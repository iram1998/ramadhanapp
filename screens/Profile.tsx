
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { THEMES, ACHIEVEMENTS } from '../constants';
import { searchCity, CityResult } from '../utils';

const SettingItem = ({ icon, label, toggle, value, checked, onClick, loading }: { icon: string, label: string, toggle?: boolean, value?: string, checked?: boolean, onClick?: () => void, loading?: boolean }) => (
    <div onClick={onClick} className={`flex items-center justify-between p-4 bg-[var(--color-card)] rounded-xl shadow-sm border border-gray-100/50 ${onClick ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}`}>
        <div className="flex items-center gap-3">
            <span className="material-symbols-outlined opacity-60">{icon}</span>
            <span className="font-medium">{label}</span>
        </div>
        {loading ? (
             <div className="size-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
        ) : toggle ? (
            <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={checked} onChange={() => {}} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
            </div>
        ) : (
            <div className="flex items-center gap-1 opacity-60">
                <span className="text-sm truncate max-w-[150px]">{value}</span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
            </div>
        )}
    </div>
);

export const Profile = () => {
  const { theme, setThemeId, score, location, manualLocation, setManualLocation, refreshLocation, ramadhanStartDate, setRamadhanStartDate, t, language, setLanguage, notificationsEnabled, toggleNotifications, audioEnabled, toggleAudio, playTestAudio, isPlaying, stopAudio, isInstallable, installApp, prayerCorrections, setPrayerCorrections, achievements, friendsLeaderboard, incomingRequests, outgoingRequests, addFriendByEmail, acceptFriend, rejectFriend, removeFriend, updateDisplayName, isStatsLocked, toggleStatsLock } = useApp();
  const { user, logout } = useAuth();
  
  // Location Search State
  const [showLocationSearch, setShowLocationSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Correction State
  const [showCorrection, setShowCorrection] = useState(false);

  // Edit Name State
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState('');

  // Add Friend State
  const [friendEmail, setFriendEmail] = useState('');
  const [friendStatus, setFriendStatus] = useState<{ loading: boolean, message: string, type: 'success'|'error'|'', invite?: boolean }>({ loading: false, message: '', type: '' });
  
  // Social Tab State
  const [socialTab, setSocialTab] = useState<'friends' | 'requests'>('friends');
  const [showFriendsView, setShowFriendsView] = useState(false);

  // iOS Detection for Install Instructions
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Lock Body Scroll when Modals are Open
  useEffect(() => {
      if (showLocationSearch || showDatePicker || showCorrection || showFriendsView) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = 'auto';
      }
      return () => {
          document.body.style.overflow = 'auto';
      };
  }, [showLocationSearch, showDatePicker, showCorrection, showFriendsView]);

  useEffect(() => {
      // Check if iOS
      const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      setIsIOS(ios);

      // Check if already installed (Standalone mode)
      const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
      setIsStandalone(standalone);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchQuery.trim()) return;
      
      setIsSearching(true);
      const results = await searchCity(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
  };

  const handleSelectCity = (city: CityResult) => {
      setManualLocation(city);
      setShowLocationSearch(false);
      setSearchResults([]);
      setSearchQuery('');
  };

  const handleUseGPS = () => {
      setManualLocation(null);
      refreshLocation();
      setShowLocationSearch(false);
  };

  // Toggle Language
  const handleLanguageToggle = () => {
      setLanguage(language === 'id' ? 'en' : 'id');
  };
  
  const updateCorrection = (key: string, delta: number) => {
      const current = prayerCorrections[key] || 0;
      setPrayerCorrections({ ...prayerCorrections, [key]: current + delta });
  };

  // Name Editing
  const startEditingName = () => {
      setTempName(user?.name || '');
      setIsEditingName(true);
  }

  const saveName = async () => {
      if(tempName.trim()) {
          await updateDisplayName(tempName.trim());
          setIsEditingName(false);
      }
  }

  // Friend Logic
  const handleAddFriend = async () => {
      if(!friendEmail.trim()) return;
      setFriendStatus({ loading: true, message: '', type: '' });
      
      const res = await addFriendByEmail(friendEmail.trim());
      
      setFriendStatus({
          loading: false,
          message: res.message,
          type: res.success ? 'success' : 'error',
          invite: res.notFound
      });
      
      if(res.success) setFriendEmail('');
  }

  const handleInvite = async () => {
       const text = `Ayo gabung di Ramadhan Tracker 2026! Cek statistik ibadah dan berkompetisi dalam kebaikan bersamaku.`;
       const url = window.location.href;
       if(navigator.share) {
           navigator.share({ title: 'Ramadhan Tracker', text, url });
       } else {
           navigator.clipboard.writeText(`${text} ${url}`);
           alert('Pesan undangan disalin ke clipboard.');
       }
  }

  return (
    <div className="animate-fade-in pb-12 relative min-h-screen">
        <header className="p-6 bg-[var(--color-card)] shadow-sm">
             <h1 className="text-2xl font-bold mb-6">{t('settings_title')}</h1>
             <div className="flex items-center gap-4">
                <div className="size-16 rounded-full border-4 border-[var(--color-primary)]/20 overflow-hidden shrink-0">
                    <img src={user?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Abdullah"} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    {isEditingName ? (
                        <div className="flex items-center gap-2">
                             <input 
                                autoFocus
                                type="text" 
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                className="w-full p-1 bg-gray-50 border border-[var(--color-primary)] rounded text-sm font-bold"
                             />
                             <button onClick={saveName} className="p-1 bg-[var(--color-primary)] text-white rounded">
                                 <span className="material-symbols-outlined text-sm">check</span>
                             </button>
                        </div>
                    ) : (
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            {user?.name}
                            <button onClick={startEditingName} className="opacity-30 hover:opacity-100">
                                <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                        </h2>
                    )}
                    <p className="opacity-60 text-sm truncate">{user?.email}</p>
                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                        Level {Math.floor(score/500) + 1} • {score} pts
                    </div>
                </div>
             </div>
        </header>

        <main className="p-6 space-y-8">
            
            {/* SOCIAL / FRIENDS SECTION (Entry) */}
            <button 
                onClick={() => setShowFriendsView(true)}
                className="w-full bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between group hover:border-[var(--color-primary)]/30 transition-all"
            >
                 <div className="flex items-center gap-4">
                    <div className="size-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                        <span className="material-symbols-outlined">group</span>
                    </div>
                    <div className="text-left">
                        <h3 className="font-bold text-base">Teman & Keluarga</h3>
                        <p className="text-xs opacity-60">{friendsLeaderboard.length - 1} Teman • {incomingRequests.length} Request</p>
                    </div>
                </div>
                <span className="material-symbols-outlined opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all">chevron_right</span>
            </button>

            {/* BADGES GALLERY */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-[var(--color-primary)] bg-[var(--color-primary)]/10 p-1 rounded-md text-sm">workspace_premium</span>
                    <h3 className="font-bold text-sm uppercase tracking-wide opacity-80">Pencapaian</h3>
                </div>
                <div className="grid grid-cols-4 gap-3">
                    {ACHIEVEMENTS.map((ach) => {
                        const isUnlocked = achievements.includes(ach.id);
                        return (
                            <div key={ach.id} className="flex flex-col items-center gap-1 group relative">
                                <div 
                                    className={`size-14 rounded-full flex items-center justify-center border-2 transition-all ${isUnlocked ? 'bg-white border-transparent shadow-md' : 'bg-gray-100 border-gray-200 opacity-50 grayscale'}`}
                                    style={{ color: isUnlocked ? ach.color : undefined }}
                                >
                                    <span className="material-symbols-outlined text-2xl">{ach.icon}</span>
                                </div>
                                <span className="text-[9px] text-center font-bold opacity-70 leading-tight">{ach.title}</span>
                                
                                {/* Tooltip */}
                                <div className="absolute bottom-full mb-2 bg-black/80 backdrop-blur-sm text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity w-32 text-center pointer-events-none z-10">
                                    {ach.description}
                                    {!isUnlocked && <span className="block text-[var(--color-secondary)] font-bold mt-1">Belum Terbuka</span>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>

            {/* PWA INSTALLATION SECTION */}
            
            {/* 1. Android / Chrome Desktop Button */}
            {isInstallable && (
                <div className="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                         <div className="size-10 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-white">
                             <span className="material-symbols-outlined">download</span>
                         </div>
                         <div>
                             <p className="font-bold text-sm">Install Aplikasi</p>
                             <p className="text-xs opacity-60">Akses lebih cepat & offline.</p>
                         </div>
                    </div>
                    <button 
                        onClick={installApp}
                        className="px-3 py-1.5 bg-[var(--color-primary)] text-white text-xs font-bold rounded-lg hover:brightness-95"
                    >
                        Install
                    </button>
                </div>
            )}

            {/* 2. iOS Instructions (Show if on iOS and NOT already installed) */}
            {isIOS && !isStandalone && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="size-10 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600">
                             <span className="material-symbols-outlined">ios_share</span>
                        </div>
                        <div>
                             <p className="font-bold text-sm">Install di iPhone/iPad</p>
                             <p className="text-xs opacity-60">Ikuti langkah berikut:</p>
                         </div>
                    </div>
                    <ol className="text-xs opacity-80 list-decimal list-inside space-y-1 ml-1">
                        <li>Klik tombol <strong>Share</strong> (ikon kotak panah) di bar bawah Safari.</li>
                        <li>Scroll ke bawah dan pilih <strong>"Add to Home Screen"</strong> (Tambah ke Layar Utama).</li>
                        <li>Klik <strong>Add</strong> di pojok kanan atas.</li>
                    </ol>
                </div>
            )}

            {/* Location Settings */}
            <section className="space-y-3">
                <h3 className="font-bold text-lg mb-2">{t('location')}</h3>
                <SettingItem 
                    icon="location_on" 
                    label={t('location')} 
                    value={location} 
                    onClick={() => setShowLocationSearch(true)}
                />
                <p className="text-xs opacity-50 px-2">
                    {manualLocation ? 'Menggunakan lokasi manual.' : 'Menggunakan Auto-Detect GPS.'} 
                    Klik untuk mengubah.
                </p>
                
                {/* Correction */}
                 <SettingItem 
                    icon="tune" 
                    label="Koreksi Waktu (Ikhtiyat)" 
                    value="Atur Manual" 
                    onClick={() => setShowCorrection(true)}
                />

                {/* 1st Ramadhan Setting */}
                <SettingItem 
                    icon="calendar_month" 
                    label="Tetapkan 1 Ramadhan" 
                    value={ramadhanStartDate} 
                    onClick={() => setShowDatePicker(true)}
                />
            </section>

            {/* Theme Switcher */}
            <section>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--color-primary)]">palette</span>
                    {t('theme')}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {THEMES.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setThemeId(t.id)}
                            className={`flex items-center p-3 rounded-xl border transition-all ${theme.id === t.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]' : 'border-gray-200 dark:border-gray-700 bg-[var(--color-card)]'}`}
                        >
                            <div className="flex gap-2 mr-4">
                                <div className="size-6 rounded-full shadow-sm" style={{ backgroundColor: t.colors.primary }}></div>
                                <div className="size-6 rounded-full shadow-sm" style={{ backgroundColor: t.colors.secondary }}></div>
                            </div>
                            <span className="font-medium flex-1 text-left">{t.name}</span>
                            {theme.id === t.id && <span className="material-symbols-outlined text-[var(--color-primary)]">check_circle</span>}
                        </button>
                    ))}
                </div>
            </section>
            
            {/* General Settings & Audio */}
            <section className="space-y-3">
                <h3 className="font-bold text-lg mb-2">{t('general')}</h3>
                <SettingItem 
                    icon="notifications" 
                    label={t('notifications')} 
                    toggle 
                    checked={notificationsEnabled}
                    onClick={toggleNotifications}
                />
                
                {/* Audio Adzan Toggle */}
                {notificationsEnabled && (
                    <div className="ml-4 space-y-2">
                        <SettingItem 
                            icon="volume_up" 
                            label={t('audio_adzan')} 
                            toggle 
                            checked={audioEnabled}
                            onClick={toggleAudio}
                        />
                        {/* Test Button Audio */}
                        <div className="flex gap-2">
                            <button 
                                onClick={playTestAudio}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-2 ${isPlaying ? 'bg-orange-100 text-orange-600 border-orange-200' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                            >
                                <span className="material-symbols-outlined text-sm">{isPlaying ? 'pause' : 'play_arrow'}</span>
                                {isPlaying ? 'Playing...' : t('test_audio')}
                            </button>
                             {isPlaying && (
                                <button 
                                    onClick={stopAudio}
                                    className="py-2 px-3 rounded-xl text-xs font-bold border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                                >
                                    {t('stop_audio')}
                                </button>
                             )}
                        </div>
                        <p className="text-[10px] opacity-60 italic">
                            *Note: Klik "Test Suara" setidaknya satu kali agar browser mengizinkan suara otomatis.
                        </p>
                    </div>
                )}

                <SettingItem 
                    icon="translate" 
                    label={t('language')} 
                    value={language === 'id' ? 'Bahasa Indonesia' : 'English'} 
                    onClick={handleLanguageToggle}
                />

                <SettingItem 
                    icon="lock" 
                    label="Privasi Statistik" 
                    toggle 
                    checked={isStatsLocked}
                    onClick={toggleStatsLock}
                />
                <p className="text-[10px] opacity-60 px-2">
                    Jika aktif, teman tidak bisa melihat detail statistik ibadah Anda.
                </p>
            </section>

            {/* Logout */}
            <button 
                onClick={logout}
                className="w-full py-4 text-red-500 font-bold bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined">logout</span>
                {t('logout')}
            </button>
        </main>

        {/* FRIENDS FULL PAGE VIEW */}
        {showFriendsView && (
            <div className="fixed inset-0 z-50 bg-[var(--color-bg)] animate-fade-in overflow-y-auto">
                <header className="sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur-md border-b border-gray-100 p-4 flex items-center gap-3 z-10">
                    <button onClick={() => setShowFriendsView(false)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <h2 className="text-lg font-bold">Teman & Keluarga</h2>
                </header>

                <main className="p-6 max-w-lg mx-auto space-y-6">
                    {/* Add Friend Input */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="font-bold text-sm mb-3">Tambah Teman Baru</h3>
                        <div className="flex gap-2">
                            <input 
                                type="email" 
                                placeholder="Masukkan email teman..."
                                value={friendEmail}
                                onChange={(e) => setFriendEmail(e.target.value)}
                                className="flex-1 p-3 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)]"
                            />
                            <button 
                                onClick={handleAddFriend}
                                disabled={friendStatus.loading}
                                className="bg-[var(--color-primary)] text-white px-4 rounded-xl flex items-center justify-center disabled:opacity-50 font-bold"
                            >
                                {friendStatus.loading ? <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Tambah'}
                            </button>
                        </div>
                        {/* Status Message */}
                        {friendStatus.message && (
                            <div className={`mt-3 p-3 rounded-xl text-xs flex items-center justify-between ${friendStatus.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                <span>{friendStatus.message}</span>
                                {friendStatus.invite && (
                                    <button onClick={handleInvite} className="underline font-bold ml-2">Undang via WA</button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* TABS */}
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                        <button 
                            onClick={() => setSocialTab('friends')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${socialTab === 'friends' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500'}`}
                        >
                            Teman ({friendsLeaderboard.length - 1})
                        </button>
                        <button 
                            onClick={() => setSocialTab('requests')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${socialTab === 'requests' ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-gray-500'}`}
                        >
                            Request ({incomingRequests.length})
                        </button>
                    </div>

                    {/* CONTENT */}
                    <div className="space-y-3">
                        {/* CONFIRMED FRIENDS */}
                        {socialTab === 'friends' && (
                            <>
                                    {friendsLeaderboard.filter(f => !f.isCurrentUser).length === 0 && (
                                    <div className="text-center py-12 opacity-50">
                                        <span className="material-symbols-outlined text-4xl mb-2">group_off</span>
                                        <p className="text-sm">Belum ada teman.</p>
                                        <p className="text-xs">Undang teman untuk saling memotivasi!</p>
                                    </div>
                                    )}
                                    {friendsLeaderboard.filter(f => !f.isCurrentUser).map(friend => (
                                    <div key={friend.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 shadow-sm">
                                            <img src={friend.avatar} className="size-12 rounded-full bg-gray-100" alt="avatar" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold truncate text-base">{friend.name}</p>
                                                <p className="text-xs opacity-50">{friend.score} Points</p>
                                            </div>
                                            <button 
                                            onClick={() => removeFriend(friend.id)}
                                            className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                            title="Hapus Teman"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                            </button>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* REQUESTS */}
                        {socialTab === 'requests' && (
                            <>
                                {/* INCOMING */}
                                {incomingRequests.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-xs font-bold uppercase opacity-50 px-2">Permintaan Masuk</p>
                                        {incomingRequests.map(req => (
                                            <div key={req.id} className="flex items-center gap-3 p-4 rounded-2xl bg-blue-50 border border-blue-100">
                                                <img src={req.avatar} className="size-10 rounded-full bg-white" alt="avatar" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">{req.name}</p>
                                                    <p className="text-xs opacity-60">Ingin berteman</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => acceptFriend(req.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700">Terima</button>
                                                    <button onClick={() => rejectFriend(req.id)} className="px-3 py-1.5 bg-white text-red-500 border border-red-100 rounded-lg text-xs font-bold hover:bg-red-50">Tolak</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* OUTGOING */}
                                {outgoingRequests.length > 0 && (
                                    <div className="space-y-3 mt-6">
                                        <p className="text-xs font-bold uppercase opacity-50 px-2">Menunggu Konfirmasi</p>
                                        {outgoingRequests.map(req => (
                                            <div key={req.id} className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 opacity-70">
                                                <img src={req.avatar} className="size-10 rounded-full bg-white grayscale" alt="avatar" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-sm truncate">{req.name}</p>
                                                    <p className="text-xs opacity-60">Undangan terkirim</p>
                                                </div>
                                                <span className="material-symbols-outlined opacity-40">hourglass_empty</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {incomingRequests.length === 0 && outgoingRequests.length === 0 && (
                                    <div className="text-center py-12 opacity-50">
                                        <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                                        <p className="text-sm">Tidak ada permintaan.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </main>
            </div>
        )}

        {/* MODALS (Location, Date, Correction) */}
        {showLocationSearch && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-[var(--color-card)] w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                        <h3 className="text-lg font-bold">Ubah Lokasi</h3>
                        <button onClick={() => setShowLocationSearch(false)} className="p-2 hover:bg-gray-100 rounded-full">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="p-6 space-y-4 overflow-y-auto min-h-0">
                        <form onSubmit={handleSearch} className="relative shrink-0">
                            <input 
                                autoFocus
                                type="text" 
                                placeholder={t('search_placeholder')} 
                                className="w-full p-4 pl-12 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 opacity-40">search</span>
                            <button 
                                type="submit"
                                disabled={isSearching}
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-lg text-sm font-bold disabled:opacity-50"
                            >
                                {isSearching ? '...' : 'Cari'}
                            </button>
                        </form>

                        <div className="space-y-2">
                            <button 
                                onClick={handleUseGPS}
                                className="w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-[var(--color-primary)]/5 border border-dashed border-[var(--color-primary)]/30 text-[var(--color-primary)] font-bold mb-4"
                            >
                                <span className="material-symbols-outlined">my_location</span>
                                {t('use_gps')}
                            </button>

                            {searchResults.length > 0 && (
                                <p className="text-xs font-bold uppercase opacity-50 px-2">Hasil Pencarian</p>
                            )}
                            
                            {searchResults.map((city, idx) => (
                                <button 
                                    key={idx}
                                    onClick={() => handleSelectCity(city)}
                                    className="w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-gray-50 border border-gray-100"
                                >
                                    <span className="material-symbols-outlined opacity-40">location_city</span>
                                    <div>
                                        <p className="font-bold text-sm text-[var(--color-text)]">{city.name}</p>
                                        <p className="text-[10px] opacity-50">Lat: {city.lat.toFixed(2)}, Lon: {city.lon.toFixed(2)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {showDatePicker && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                 <div className="bg-[var(--color-card)] w-full max-w-sm rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                        <h3 className="text-lg font-bold">Tetapkan 1 Ramadhan</h3>
                         <button onClick={() => setShowDatePicker(false)} className="p-2 hover:bg-gray-100 rounded-full">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <div className="p-6 space-y-4 overflow-y-auto">
                        <p className="text-sm opacity-60">
                            Pilih tanggal dimulainya 1 Ramadhan 1447H di wilayah Anda.
                        </p>
                        <input 
                            type="date" 
                            value={ramadhanStartDate}
                            onChange={(e) => setRamadhanStartDate(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] font-bold text-lg text-center"
                        />
                        <button 
                            onClick={() => setShowDatePicker(false)}
                            className="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-xl shadow-md hover:brightness-95"
                        >
                            {t('save')}
                        </button>
                    </div>
                 </div>
            </div>
        )}

        {showCorrection && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                 <div className="bg-[var(--color-card)] w-full max-w-sm rounded-2xl shadow-2xl flex flex-col max-h-[85vh]">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
                        <h3 className="text-lg font-bold">Koreksi Waktu (Ikhtiyat)</h3>
                         <button onClick={() => setShowCorrection(false)} className="p-2 hover:bg-gray-100 rounded-full">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-4 overflow-y-auto min-h-0">
                        <p className="text-sm opacity-60 leading-tight">
                            Jika jadwal berbeda dengan masjid lokal, tambahkan +/- menit di sini.
                        </p>
                        
                        <div className="space-y-3">
                            {['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].map((key) => (
                                <div key={key} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50/50">
                                    <span className="font-bold capitalize w-20">{key}</span>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => updateCorrection(key, -1)} className="size-8 rounded-full bg-white border shadow-sm flex items-center justify-center hover:bg-gray-100">
                                            <span className="material-symbols-outlined text-sm">remove</span>
                                        </button>
                                        <span className="font-mono w-8 text-center font-bold">
                                            {(prayerCorrections[key] || 0) > 0 ? `+${prayerCorrections[key]}` : (prayerCorrections[key] || 0)}
                                        </span>
                                        <button onClick={() => updateCorrection(key, 1)} className="size-8 rounded-full bg-[var(--color-primary)] text-white shadow-sm flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm">add</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => setShowCorrection(false)}
                            className="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-xl shadow-md hover:brightness-95"
                        >
                            Selesai
                        </button>
                    </div>
                 </div>
            </div>
        )}
    </div>
  );
};
