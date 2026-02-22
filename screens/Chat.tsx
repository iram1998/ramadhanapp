import React, { useState, useEffect, useRef } from 'react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext'; // Import useApp
import { ChatService } from '../services/chatService';
import { Chat, Message, UserProfile } from '../types';
import { Timestamp } from 'firebase/firestore';
import { FriendProfile } from './FriendProfile';

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
    const { friendsLeaderboard } = useApp(); // Get friends list
    const [view, setView] = useState<'list' | 'room'>('list');
    const [activeChat, setActiveChat] = useState<Chat | null>(null);
    const [chats, setChats] = useState<Chat[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessageText, setNewMessageText] = useState('');
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGroupInfo, setShowGroupInfo] = useState(false);

    // Group Chat State
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [selectedGroupMembers, setSelectedGroupMembers] = useState<UserProfile[]>([]);

    // Friend Profile State
    const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

    // Subscribe to chat list
    useEffect(() => {
        if (!user) return;
        const unsubscribe = ChatService.subscribeToChats(user.id, (updatedChats) => {
            // Calculate unread counts locally if needed, but for now we rely on the UI to show bold
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
            
            // Mark as read if I'm viewing and there are unread messages
            if (user) {
                const hasUnread = updatedMessages.some(m => !m.readBy.includes(user.id));
                if (hasUnread) {
                    ChatService.markMessagesAsRead(activeChat.id, user.id);
                }
            }
        });
        return () => unsubscribe();
    }, [activeChat, user]);

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
        
        if (isCreatingGroup) {
            // Add to selection if not already selected
            if (!selectedGroupMembers.find(m => m.id === otherUser.id)) {
                setSelectedGroupMembers([...selectedGroupMembers, otherUser]);
            }
            setSearchQuery('');
            setSearchResults([]);
            return;
        }

        try {
            // Check if chat already exists in local list
            const existingChat = chats.find(c => 
                c.type === 'direct' && c.participants.includes(otherUser.id)
            );

            if (existingChat) {
                setActiveChat(existingChat);
            } else {
                const newChatId = await ChatService.createChat([user.id, otherUser.id], 'direct');
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

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setNewMessageText(prev => prev + emojiData.emoji);
        setShowEmojiPicker(false);
    };

    const handleCreateGroup = async () => {
        if (!user || !groupName.trim() || selectedGroupMembers.length === 0) return;
        
        try {
            const participantIds = [user.id, ...selectedGroupMembers.map(m => m.id)];
            const newChatId = await ChatService.createGroupChat(participantIds, groupName, undefined, groupDescription);
            
            // Optimistic set
            setActiveChat({
                id: newChatId,
                type: 'group',
                participants: participantIds,
                groupName: groupName,
                description: groupDescription,
                participantDetails: selectedGroupMembers,
                adminIds: [user.id],
                createdAt: new Date(),
                updatedAt: new Date()
            });
            
            setView('room');
            setShowNewChatModal(false);
            setIsCreatingGroup(false);
            setGroupName('');
            setGroupDescription('');
            setSelectedGroupMembers([]);
        } catch (error) {
            console.error("Failed to create group", error);
        }
    }

    // --- RENDER HELPERS ---

    const getChatName = (chat: Chat) => {
        if (chat.type === 'group') return chat.groupName || 'Group Chat';
        // For direct chat, find the other participant
        const other = chat.participantDetails?.find(p => p.id !== user?.id);
        return other?.name || 'Unknown User';
    };

    const getChatAvatar = (chat: Chat) => {
        if (chat.type === 'group') return chat.groupPhoto || `https://ui-avatars.com/api/?name=${chat.groupName}&background=random`;
        const other = chat.participantDetails?.find(p => p.id !== user?.id);
        return other?.photoUrl || `https://ui-avatars.com/api/?name=${getChatName(chat)}`;
    };

    const getOtherUserId = (chat: Chat) => {
        if (chat.type === 'group') return null;
        return chat.participants.find(id => id !== user?.id);
    }

    const handleDeleteChat = async (chat: Chat) => {
        if (!user) return;
        
        const isGroup = chat.type === 'group';
        const isAdmin = isGroup && chat.adminIds?.includes(user.id);

        if (isGroup && !isAdmin) {
            alert("Only admins can delete this group.");
            return;
        }

        if (window.confirm(`Are you sure you want to delete this ${isGroup ? 'group' : 'chat'}?`)) {
            try {
                await ChatService.deleteChat(chat.id);
                if (activeChat?.id === chat.id) {
                    setActiveChat(null);
                    setView('list');
                }
            } catch (error) {
                console.error("Failed to delete chat", error);
                alert("Failed to delete chat.");
            }
        }
    };

    // --- VIEWS ---

    if (view === 'room' && activeChat) {
        const isGroup = activeChat.type === 'group';
        const isAdmin = isGroup && activeChat.adminIds?.includes(user?.id || '');
        const canDelete = !isGroup || isAdmin;

        return (
            <div className="flex flex-col h-full bg-gray-50 relative">
                {/* Header */}
                <div className="bg-white p-4 shadow-sm flex items-center gap-3 sticky top-0 z-10">
                    <button onClick={() => setView('list')} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <button 
                        onClick={() => {
                            if (activeChat.type === 'group') {
                                setShowGroupInfo(true);
                            } else {
                                const otherId = getOtherUserId(activeChat);
                                if (otherId) setViewingProfileId(otherId);
                            }
                        }}
                        className="flex items-center gap-3 flex-1 text-left"
                    >
                        <img 
                            src={getChatAvatar(activeChat)} 
                            alt="Avatar" 
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                        <div>
                            <h3 className="font-bold text-gray-800">{getChatName(activeChat)}</h3>
                            <p className="text-xs text-gray-500">
                                {activeChat.type === 'group' ? `${activeChat.participants.length} members` : 'Click to view profile'}
                            </p>
                        </div>
                    </button>
                    {canDelete && (
                        <button 
                            onClick={() => handleDeleteChat(activeChat)}
                            className="p-2 rounded-full hover:bg-red-50 text-red-500"
                            title="Delete Chat"
                        >
                            <span className="material-symbols-outlined">delete</span>
                        </button>
                    )}
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
                                    {activeChat.type === 'group' && !isMe && (
                                        <p className="text-[10px] font-bold text-[var(--color-primary)] mb-1 opacity-80">
                                            {activeChat.participantDetails?.find(p => p.id === msg.senderId)?.name || 'Unknown'}
                                        </p>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    <div className="flex justify-end items-center gap-1 mt-1">
                                        <p className={`text-[10px] ${isMe ? 'text-emerald-100' : 'text-gray-400'}`}>
                                            {formatDate(msg.timestamp)}
                                        </p>
                                        {isMe && (
                                            <span className="material-symbols-outlined text-[10px] opacity-70">
                                                {msg.readBy.length > 1 ? 'done_all' : 'check'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 bg-white border-t border-gray-100 relative">
                    {showEmojiPicker && (
                        <div className="absolute bottom-full left-0 mb-2 z-20">
                            <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                        <button 
                            type="button"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            className="p-2 text-gray-400 hover:text-[var(--color-primary)] transition-colors"
                        >
                            <span className="material-symbols-outlined">sentiment_satisfied</span>
                        </button>
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

                {/* Friend Profile Modal */}
                {viewingProfileId && (
                    <FriendProfile 
                        friendId={viewingProfileId} 
                        onClose={() => setViewingProfileId(null)} 
                    />
                )}

                {/* Group Info Modal */}
                {showGroupInfo && activeChat.type === 'group' && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                            <div className="relative h-32 bg-[var(--color-primary)]">
                                <button 
                                    onClick={() => setShowGroupInfo(false)}
                                    className="absolute top-4 right-4 bg-black/20 text-white p-1 rounded-full hover:bg-black/40"
                                >
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                                    <img 
                                        src={getChatAvatar(activeChat)} 
                                        alt={getChatName(activeChat)} 
                                        className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-md"
                                    />
                                </div>
                            </div>
                            
                            <div className="pt-12 pb-6 px-6 text-center">
                                <h2 className="text-xl font-bold text-gray-800">{getChatName(activeChat)}</h2>
                                <p className="text-sm text-gray-500 mt-1">{activeChat.participants.length} members</p>
                                {activeChat.description && (
                                    <p className="text-sm text-gray-600 mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        {activeChat.description}
                                    </p>
                                )}
                            </div>

                            <div className="flex-1 overflow-y-auto px-4 pb-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">Members</h3>
                                <div className="space-y-1">
                                    {activeChat.participantDetails?.map(member => {
                                        const isAdmin = activeChat.adminIds?.includes(member.id);
                                        return (
                                            <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
                                                <img 
                                                    src={member.photoUrl || `https://ui-avatars.com/api/?name=${member.name}`} 
                                                    alt={member.name} 
                                                    className="w-10 h-10 rounded-full object-cover"
                                                />
                                                <div className="flex-1 min-w-0 text-left">
                                                    <p className="font-bold text-gray-800 truncate flex items-center gap-1">
                                                        {member.name}
                                                        {isAdmin && (
                                                            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-bold">ADMIN</span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-500 truncate">{member.email}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // List View
    return (
        <div className="flex flex-col h-full bg-white relative">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h1 className="text-2xl font-bold text-gray-800">Chats</h1>
                <button 
                    onClick={() => {
                        setShowNewChatModal(true);
                        setIsCreatingGroup(false);
                    }}
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
                    chats.map(chat => {
                        const isUnread = chat.lastMessage && !chat.lastMessage.readBy.includes(user?.id || '');
                        const isGroup = chat.type === 'group';
                        const isAdmin = isGroup && chat.adminIds?.includes(user?.id || '');
                        const canDelete = !isGroup || isAdmin;

                        return (
                            <div 
                                key={chat.id}
                                onClick={() => { setActiveChat(chat); setView('room'); }}
                                className={`flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-50 transition-colors ${isUnread ? 'bg-blue-50/30' : ''}`}
                            >
                                <div className="relative">
                                    <img 
                                        src={getChatAvatar(chat)} 
                                        alt="Avatar" 
                                        className="w-12 h-12 rounded-full object-cover border border-gray-100"
                                    />
                                    {isUnread && (
                                        <div className="absolute top-0 right-0 size-3 bg-red-500 rounded-full border-2 border-white"></div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`text-gray-800 truncate ${isUnread ? 'font-black' : 'font-bold'}`}>{getChatName(chat)}</h3>
                                        <span className={`text-xs whitespace-nowrap ${isUnread ? 'text-[var(--color-primary)] font-bold' : 'text-gray-400'}`}>
                                            {formatDate(chat.lastMessage?.timestamp || chat.updatedAt)}
                                        </span>
                                    </div>
                                    <p className={`text-sm truncate ${isUnread ? 'text-gray-800 font-medium' : 'text-gray-500'}`}>
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
                                {canDelete && (
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteChat(chat);
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* New Chat Modal */}
            {showNewChatModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-lg">{isCreatingGroup ? 'New Group' : 'New Chat'}</h3>
                            <button onClick={() => setShowNewChatModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                            <div className="space-y-3">
                                {!isCreatingGroup ? (
                                    <button 
                                        onClick={() => setIsCreatingGroup(true)}
                                        className="w-full flex items-center gap-3 p-3 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl font-bold hover:bg-[var(--color-primary)]/20 transition-colors"
                                    >
                                        <span className="material-symbols-outlined">group_add</span>
                                        Create New Group
                                    </button>
                                ) : (
                                    <div className="space-y-3">
                                        <input 
                                            type="text" 
                                            placeholder="Group Name" 
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Description (Optional)" 
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                                            value={groupDescription}
                                            onChange={(e) => setGroupDescription(e.target.value)}
                                        />
                                        {/* Selected Members Chips */}
                                        {selectedGroupMembers.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedGroupMembers.map(m => (
                                                    <span key={m.id} className="text-xs bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                                                        {m.name}
                                                        <button onClick={() => setSelectedGroupMembers(prev => prev.filter(x => x.id !== m.id))} className="hover:text-red-500">×</button>
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

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

                            <div className="space-y-2">
                                {searchResults.length > 0 ? (
                                    searchResults.map(result => {
                                        const isSelected = selectedGroupMembers.find(m => m.id === result.id);
                                        return (
                                            <button 
                                                key={result.id}
                                                onClick={() => startChat(result)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${isSelected ? 'bg-[var(--color-primary)]/10' : 'hover:bg-gray-50'}`}
                                            >
                                                <img src={result.photoUrl || `https://ui-avatars.com/api/?name=${result.name}`} className="w-10 h-10 rounded-full" alt="" />
                                                <div className="flex-1">
                                                    <p className="font-bold text-gray-800">{result.name}</p>
                                                    <p className="text-xs text-gray-500">{result.email}</p>
                                                </div>
                                                {isCreatingGroup && (
                                                    <div className={`size-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-[var(--color-primary)] border-transparent' : 'border-gray-300'}`}>
                                                        {isSelected && <span className="material-symbols-outlined text-white text-xs">check</span>}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })
                                ) : searchQuery.length > 2 ? (
                                    <div className="text-center p-8 text-gray-400">
                                        <p>No users found</p>
                                    </div>
                                ) : (
                                    // Show Friends List by Default
                                    <div className="space-y-2">
                                        <p className="px-1 text-xs font-bold text-gray-400 uppercase">Friends</p>
                                        {friendsLeaderboard.filter(f => !f.isCurrentUser).map(friend => {
                                             const isSelected = selectedGroupMembers.find(m => m.id === friend.id);
                                             // Map LeaderboardEntry to UserProfile structure roughly
                                             const profile: UserProfile = {
                                                 id: friend.id,
                                                 name: friend.name,
                                                 email: friend.email || '',
                                                 photoUrl: friend.avatar,
                                                 isStatsLocked: false // Default
                                             };

                                             return (
                                                <button 
                                                    key={friend.id}
                                                    onClick={() => startChat(profile)}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${isSelected ? 'bg-[var(--color-primary)]/10' : 'hover:bg-gray-50'}`}
                                                >
                                                    <img src={friend.avatar || `https://ui-avatars.com/api/?name=${friend.name}`} className="w-10 h-10 rounded-full" alt="" />
                                                    <div className="flex-1">
                                                        <p className="font-bold text-gray-800">{friend.name}</p>
                                                        <p className="text-xs text-gray-500">{friend.email}</p>
                                                    </div>
                                                    {isCreatingGroup && (
                                                        <div className={`size-5 rounded-full border flex items-center justify-center ${isSelected ? 'bg-[var(--color-primary)] border-transparent' : 'border-gray-300'}`}>
                                                            {isSelected && <span className="material-symbols-outlined text-white text-xs">check</span>}
                                                        </div>
                                                    )}
                                                </button>
                                             );
                                        })}
                                        {friendsLeaderboard.filter(f => !f.isCurrentUser).length === 0 && (
                                            <div className="text-center p-8 text-gray-400">
                                                <p>No friends yet. Search to add!</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isCreatingGroup && (
                            <div className="p-4 border-t border-gray-100 shrink-0 bg-white">
                                <button 
                                    onClick={handleCreateGroup}
                                    disabled={!groupName.trim() || selectedGroupMembers.length === 0}
                                    className="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-xl shadow-md disabled:opacity-50 hover:brightness-95"
                                >
                                    Create Group ({selectedGroupMembers.length})
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
