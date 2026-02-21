import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    Timestamp, 
    doc, 
    updateDoc, 
    arrayUnion,
    getDocs,
    limit,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Chat, Message, UserProfile } from '../types';

export const ChatService = {
    // 1. Create or Get Existing Chat
    async createChat(participants: string[], type: 'direct' | 'group', groupName?: string): Promise<string> {
        if (!db) throw new Error("Firestore not initialized");

        // For direct chats, check if one already exists
        if (type === 'direct') {
            const chatsRef = collection(db, 'chats');
            // This is a simple check. For production, you might want a more robust compound query or ID generation strategy.
            // Here we just check if a chat exists with these exact 2 participants.
            // Firestore array-contains is tricky for exact match of arrays.
            // A common pattern is to store a sorted string of IDs as a unique key, or query all chats and filter client side (if low volume).
            // For now, we'll just create a new one if we don't find one easily, but let's try to find it.
            
            // Simplified: Just create a new one for now to ensure it works, 
            // or we could query where participants array-contains the current user, then filter in memory.
            const q = query(chatsRef, where('participants', 'array-contains', participants[0]));
            const snapshot = await getDocs(q);
            const existing = snapshot.docs.find(doc => {
                const data = doc.data();
                return data.type === 'direct' && 
                       data.participants.includes(participants[1]) && 
                       data.participants.length === 2;
            });

            if (existing) return existing.id;
        }

        const newChat = {
            type,
            participants,
            groupName: groupName || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: null
        };

        const docRef = await addDoc(collection(db, 'chats'), newChat);
        return docRef.id;
    },

    // 2. Send Message
    async sendMessage(chatId: string, senderId: string, text: string) {
        if (!db) throw new Error("Firestore not initialized");

        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const chatRef = doc(db, 'chats', chatId);

        const newMessage = {
            senderId,
            text,
            timestamp: serverTimestamp(),
            readBy: [senderId]
        };

        await addDoc(messagesRef, newMessage);

        // Update last message in chat doc
        await updateDoc(chatRef, {
            lastMessage: {
                text,
                senderId,
                timestamp: Timestamp.now(),
                readBy: [senderId]
            },
            updatedAt: serverTimestamp()
        });
    },

    // 3. Subscribe to Chat List
    subscribeToChats(userId: string, callback: (chats: Chat[]) => void) {
        if (!db) return () => {};

        const q = query(
            collection(db, 'chats'), 
            where('participants', 'array-contains', userId)
            // Removed orderBy to avoid needing a composite index immediately.
            // We will sort client-side below.
        );

        return onSnapshot(q, async (snapshot) => {
            const chats = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Chat));
            
            // Sort client-side by updatedAt desc
            chats.sort((a, b) => {
                const timeA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : new Date(a.updatedAt).getTime();
                const timeB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : new Date(b.updatedAt).getTime();
                return timeB - timeA;
            });

            // Hydrate participant details (fetch names/avatars)
            // In a real app, you might want to cache this or use a separate listener for users.
            const hydratedChats = await Promise.all(chats.map(async (chat) => {
                const otherUserIds = chat.participants.filter(id => id !== userId);
                // Fetch details for these users
                // Optimization: In a real app, store basic user info in the chat doc or use a global user cache.
                // Here we'll fetch on demand for simplicity.
                const details: UserProfile[] = [];
                for (const uid of otherUserIds) {
                    const userDoc = await getDoc(doc(db, 'users', uid));
                    if (userDoc.exists()) {
                        details.push({ id: userDoc.id, ...userDoc.data() } as UserProfile);
                    }
                }
                return { ...chat, participantDetails: details };
            }));

            callback(hydratedChats);
        });
    },

    // 4. Subscribe to Messages
    subscribeToMessages(chatId: string, callback: (messages: Message[]) => void) {
        if (!db) return () => {};

        const q = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('timestamp', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const messages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            callback(messages);
        });
    },

    // 5. Search Users
    async searchUsers(searchTerm: string): Promise<UserProfile[]> {
        if (!db || !searchTerm) return [];

        // Firestore doesn't support native full-text search.
        // We'll do a simple prefix search on 'email' or 'name'.
        // Note: This is case-sensitive and limited.
        
        const usersRef = collection(db, 'users');
        // Try searching by email
        const qEmail = query(
            usersRef, 
            where('email', '>=', searchTerm), 
            where('email', '<=', searchTerm + '\uf8ff'),
            limit(5)
        );
        
        const snapshot = await getDocs(qEmail);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
    },

    // 6. Create Group Chat
    async createGroupChat(participants: string[], groupName: string, groupPhoto?: string): Promise<string> {
        if (!db) throw new Error("Firestore not initialized");

        const newChat = {
            type: 'group',
            participants,
            groupName,
            groupPhoto: groupPhoto || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: null
        };

        const docRef = await addDoc(collection(db, 'chats'), newChat);
        return docRef.id;
    },

    // 7. Mark Messages as Read
    async markMessagesAsRead(chatId: string, userId: string) {
        if (!db) return;

        // Get unread messages
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, where('readBy', '!=', userId)); // This might need an index if combined with other filters
        // Simple approach: Get recent messages and update them client-side check
        // Or better: Just update the chat metadata for "last read" per user, but here we track per message.
        
        // Let's just update the last 20 messages to be safe and simple without complex queries
        const recentQ = query(messagesRef, orderBy('timestamp', 'desc'), limit(20));
        const snapshot = await getDocs(recentQ);

        const batch = [];
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            if (!data.readBy.includes(userId)) {
                updateDoc(doc.ref, {
                    readBy: arrayUnion(userId)
                });
            }
        });
    }
};
