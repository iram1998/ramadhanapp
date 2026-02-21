import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChatService } from '../services/chatService';
import { Chat, Message, UserProfile } from '../types';
import { Timestamp } from 'firebase/firestore';

// Simple date formatter if date-fns is not available
const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
};

export const ChatScreen = () => {
    const { user } = useAuth();
    const [view, setView] = useState<'list' | 'room'>('list');
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessageText, setNewMessageText] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Subscribe to chat list
    useEffect(() => {
        if (!user) return;
        const unsubscribe = ChatService.subscribeToChats(user.id, (updatedChats) => {
            setChats(updatedChats);
        });
        return () => unsubscribe();
    }, [user]);

    // Subscribe to messages when activeChat changes
    useEffect(() => {
        if (!activeChat) return;
        const unsubscribe = ChatService.subscribeToMessages(activeChat.id, (updatedMessages) => {
            setMessages(updatedMessages);
            scrollToBottom();
        });
        return () => unsubscribe();
    }, [activeChat]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessageText.trim() || !activeChat || !user) return;

        try {
            await ChatService.sendMessage(activeChat.id, user.id, newMessageText);
            setNewMessageText('');
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleSearchUsers = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 2) {
            const results = await ChatService.searchUsers(query);
            // Filter out self
            setSearchResults(results.filter(u => u.id !== user?.id));
        } else {
            setSearchResults([]);
        }
    };

    const startChat = async (otherUser: UserProfile) => {
        if (!user) return;
        try {
            // Check if chat already exists in local list
            const existingChat = chats.find(c => 
                c.type === 'direct' && c.participants.includes(otherUser.id)
            );

            if (existingChat) {
                setActiveChat(existingChat);
            } else {
                const newChatId = await ChatService.createChat([user.id, otherUser.id], 'direct');
                // We might need to wait for the subscription to update, or manually set active chat
                // For now, let's just set a temporary object or wait
                // A better UX is to optimistically set it, but let's wait for the subscription
                // Actually, let's just fetch it or create a partial object
                setActiveChat({
                    id: newChatId,
                    type: 'direct',
                    participants: [user.id, otherUser.id],
                    participantDetails: [otherUser],
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
            setView('room');
            setShowNewChatModal(false);
            setSearchQuery('');
        } catch (error) {
            console.error("Failed to start chat", error);
        }
    };

    // --- RENDER HELPERS ---

    const getChatName = (chat: Chat) => {
        if (chat.type === 'group') return chat.groupName || 'Group Chat';
        // For direct chat, find the other participant
        const other = chat.participantDetails?.find(p => p.id !== user?.id);
        return other?.name || 'Unknown User';
    };

    const getChatAvatar = (chat: Chat) => {
        if (chat.type === 'group') return chat.groupPhoto || 'https://ui-avatars.com/api/?name=Group';
        const other = chat.participantDetails?.find(p => p.id !== user?.id);
        return other?.photoUrl || `https://ui-avatars.com/api/?name=${getChatName(chat)}`;
    };

    // --- VIEWS ---

    if (view === 'room' && activeChat) {
        return (
            <div className="flex flex-col h-full bg-gray-50">
                {/* Header */}
                <div className="bg-white p-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
                    <button onClick={() => setView('list')} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <img 
                        src={getChatAvatar(activeChat)} 
                        alt="Avatar" 
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                    <div>
                        <h3 className="font-bold text-gray-800">{getChatName(activeChat)}</h3>
                        <p className="text-xs text-gray-500">
                            {activeChat.type === 'group' ? `${activeChat.participants.length} members` : 'Online'}
                        </p>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                                    isMe 
                                    ? 'bg-[var(--color-primary)] text-white rounded-tr-none' 
                                    : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                                }`}>
                                    <p className="text-sm">{msg.text}</p>
                                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-emerald-100' : 'text-gray-400'}`}>
                                        {formatDate(msg.timestamp)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                    <input
                        type="text"
                        value={newMessageText}
                        onChange={(e) => setNewMessageText(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-gray-100 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
                    />
                    <button 
                        type="submit"
                        disabled={!newMessageText.trim()}
                        className="bg-[var(--color-primary)] text-white p-3 rounded-full shadow-lg disabled:opacity-50 hover:scale-105 transition-transform flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined">send</span>
                    </button>
                </form>
            </div>
        );
    }

    // List View
    return (
        <div className="flex flex-col h-full bg-white">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h1 className="text-2xl font-bold text-gray-800">Chats</h1>
                <button 
                    onClick={() => setShowNewChatModal(true)}
                    className="bg-[var(--color-primary)] text-white p-2 rounded-full shadow-md hover:bg-emerald-700 transition-colors"
                >
                    <span className="material-symbols-outlined">add_comment</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                {chats.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <span className="material-symbols-outlined text-6xl mb-2 opacity-20">chat_bubble_outline</span>
                        <p>No conversations yet</p>
                        <button onClick={() => setShowNewChatModal(true)} className="mt-4 text-[var(--color-primary)] font-bold">
                            Start a new chat
                        </button>
                    </div>
                ) : (
                    chats.map(chat => (
                        <div 
                            key={chat.id}
                            onClick={() => { setActiveChat(chat); setView('room'); }}
                            className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors"
                        >
                            <div className="relative">
                                <img 
                                    src={getChatAvatar(chat)} 
                                    alt="Avatar" 
                                    className="w-12 h-12 rounded-full object-cover border border-gray-100"
                                />
                                {/* Online indicator could go here */}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-gray-800 truncate">{getChatName(chat)}</h3>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                        {formatDate(chat.lastMessage?.timestamp || chat.updatedAt)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 truncate">
                                    {chat.lastMessage ? (
                                        <>
                                            {chat.lastMessage.senderId === user?.id && <span className="text-xs mr-1">You:</span>}
                                            {chat.lastMessage.text}
                                        </>
                                    ) : (
                                        <span className="italic text-gray-400">No messages yet</span>
                                    )}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg">New Message</h3>
                            <button onClick={() => setShowNewChatModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="p-4">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-3 text-gray-400">search</span>
                                <input 
                                    type="text" 
                                    placeholder="Search users by email..." 
                                    className="w-full bg-gray-100 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                    value={searchQuery}
                                    onChange={handleSearchUsers}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            {searchResults.length > 0 ? (
                                searchResults.map(result => (
                                    <button 
                                        key={result.id}
                                        onClick={() => startChat(result)}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                                    >
                                        <img src={result.photoUrl || `https://ui-avatars.com/api/?name=${result.name}`} className="w-10 h-10 rounded-full" alt="" />
                                        <div>
                                            <p className="font-bold text-gray-800">{result.name}</p>
                                            <p className="text-xs text-gray-500">{result.email}</p>
                                        </div>
                                    </button>
                                ))
                            ) : searchQuery.length > 2 ? (
                                <div className="text-center p-8 text-gray-400">
                                    <p>No users found</p>
                                </div>
                            ) : (
                                <div className="text-center p-8 text-gray-400">
                                    <p>Type to search people</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
