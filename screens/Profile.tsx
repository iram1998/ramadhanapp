
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { THEMES } from '../constants';
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
  const { theme, setThemeId, score, location, manualLocation, setManualLocation, refreshLocation, ramadhanStartDate, setRamadhanStartDate, t, language, setLanguage, notificationsEnabled, toggleNotifications, audioEnabled, toggleAudio, playTestAudio, isPlaying, stopAudio, isInstallable, installApp, prayerCorrections, setPrayerCorrections } = useApp();
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

  // iOS Detection for Install Instructions
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

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

  return (
    <div className="animate-fade-in pb-12 relative min-h-screen">
        <header className="p-6 bg-[var(--color-card)] shadow-sm">
             <h1 className="text-2xl font-bold mb-6">{t('settings_title')}</h1>
             <div className="flex items-center gap-4">
                <div className="size-16 rounded-full border-4 border-[var(--color-primary)]/20 overflow-hidden">
                    <img src={user?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Abdullah"} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">{user?.name}</h2>
                    <p className="opacity-60 text-sm">{user?.email}</p>
                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                        Level 12 • {score} pts
                    </div>
                </div>
             </div>
        </header>

        <main className="p-6 space-y-8">
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

        {/* LOCATION SEARCH MODAL */}
        {showLocationSearch && (
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-[var(--color-card)] w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-bold">Ubah Lokasi</h3>
                        <button onClick={() => setShowLocationSearch(false)} className="p-2 hover:bg-gray-100 rounded-full">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSearch} className="relative">
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

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
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

                        {searchResults.length === 0 && searchQuery && !isSearching && (
                            <div className="text-center py-8 opacity-50">
                                <p>Tidak ditemukan. Coba nama kota yang lebih umum.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* DATE PICKER MODAL */}
        {showDatePicker && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                 <div className="bg-[var(--color-card)] w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Tetapkan 1 Ramadhan</h3>
                         <button onClick={() => setShowDatePicker(false)} className="p-2 hover:bg-gray-100 rounded-full">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
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
        )}

        {/* CORRECTION MODAL */}
        {showCorrection && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                 <div className="bg-[var(--color-card)] w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Koreksi Waktu (Ikhtiyat)</h3>
                         <button onClick={() => setShowCorrection(false)} className="p-2 hover:bg-gray-100 rounded-full">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
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
        )}
    </div>
  );
};
