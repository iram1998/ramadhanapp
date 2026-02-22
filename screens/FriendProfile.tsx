import React, { useState, useEffect } from 'react';
import { UserProfile, HistoryData, Achievement } from '../types';
import { ACHIEVEMENTS } from '../constants';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface FriendProfileProps {
    friendId: string;
    onClose: () => void;
}

export const FriendProfile = ({ friendId, onClose }: FriendProfileProps) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [stats, setStats] = useState<{
        totalScore: number;
        streak: number;
        achievements: string[];
        history: HistoryData[];
    } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFriendData = async () => {
            try {
                const docRef = doc(db, 'users', friendId);
                const snap = await getDoc(docRef);
                
                if (snap.exists()) {
                    const data = snap.data();
                    setProfile({
                        id: snap.id,
                        name: data.name,
                        email: data.email,
                        photoUrl: data.photoUrl,
                        isStatsLocked: data.isStatsLocked
                    });

                    if (!data.isStatsLocked) {
                        const history = data.history || [];
                        const totalScore = (data.score || 0) + history.reduce((acc: number, h: HistoryData) => acc + (h.score || 0), 0);
                        setStats({
                            totalScore,
                            streak: history.length, // Simplified streak
                            achievements: data.achievements || [],
                            history
                        });
                    }
                }
            } catch (e) {
                console.error("Error fetching friend profile", e);
            } finally {
                setLoading(false);
            }
        };

        fetchFriendData();
    }, [friendId]);

    if (!profile && loading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="size-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto relative">
                
                {/* Header Image / Pattern */}
                <div className="h-24 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] relative">
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Profile Info */}
                <div className="px-6 pb-6 -mt-12">
                    <div className="flex justify-between items-end mb-4">
                        <img 
                            src={profile.photoUrl || `https://ui-avatars.com/api/?name=${profile.name}`} 
                            alt={profile.name}
                            className="size-24 rounded-full border-4 border-white shadow-md bg-white"
                        />
                        {stats && (
                            <div className="mb-2 text-right">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Level</p>
                                <p className="text-2xl font-black text-[var(--color-primary)]">
                                    {Math.floor(stats.totalScore / 500) + 1}
                                </p>
                            </div>
                        )}
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-800">{profile.name}</h2>
                    <p className="text-sm text-gray-500 mb-6">{profile.email}</p>

                    {profile.isStatsLocked ? (
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-8 text-center">
                            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">lock</span>
                            <p className="font-bold text-gray-600">Statistik Pribadi</p>
                            <p className="text-xs text-gray-400">Pengguna ini menyembunyikan detail ibadahnya.</p>
                        </div>
                    ) : stats ? (
                        <div className="space-y-6">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-[var(--color-primary)]/5 p-4 rounded-xl border border-[var(--color-primary)]/10 text-center">
                                    <p className="text-xs font-bold text-[var(--color-primary)] uppercase mb-1">Total Skor</p>
                                    <p className="text-2xl font-black text-gray-800">{stats.totalScore}</p>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 text-center">
                                    <p className="text-xs font-bold text-orange-600 uppercase mb-1">Streak</p>
                                    <p className="text-2xl font-black text-gray-800">{stats.streak} <span className="text-xs font-normal text-gray-400">hari</span></p>
                                </div>
                            </div>

                            {/* Achievements */}
                            <div>
                                <h3 className="font-bold text-sm uppercase tracking-wide opacity-70 mb-3">Pencapaian</h3>
                                <div className="flex flex-wrap gap-2">
                                    {ACHIEVEMENTS.map(ach => {
                                        const isUnlocked = stats.achievements.includes(ach.id);
                                        if (!isUnlocked) return null;
                                        return (
                                            <div key={ach.id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 pr-3 rounded-full p-1" title={ach.description}>
                                                <div className="size-8 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: ach.color }}>
                                                    <span className="material-symbols-outlined text-[14px]">{ach.icon}</span>
                                                </div>
                                                <span className="text-xs font-bold text-gray-700">{ach.title}</span>
                                            </div>
                                        )
                                    })}
                                    {stats.achievements.length === 0 && (
                                        <p className="text-xs text-gray-400 italic">Belum ada pencapaian.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-400">Gagal memuat data.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
