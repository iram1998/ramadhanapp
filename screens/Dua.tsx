
import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';

const CATEGORIES = ['Favorit', 'Harian', 'Ramadhan', 'Sholat', 'Pagi & Petang'];

const DUAS = [
    // RAMADHAN CATEGORY
    {
        id: 'niat-puasa',
        title: 'Niat Puasa Ramadhan',
        arabic: 'نَوَيْتُ صَوْمَ غَدٍ عَنْ أَدَاءِ فَرْضِ شَهْرِ رَمَضَانَ هَذِهِ السَّنَةِ لِلَّهِ تَعَالَى',
        latin: "Nawaitu shauma ghadin 'an ada'i fardhi syahri Ramadhana hadzihis sanati lillahi Ta'ala.",
        meaning: "Aku niat berpuasa esok hari untuk menunaikan kewajiban puasa bulan Ramadhan tahun ini karena Allah Ta'ala.",
        category: 'Ramadhan'
    },
    {
        id: 'doa-berbuka',
        title: 'Doa Berbuka Puasa',
        arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ',
        latin: "Dzahabaz zhama'u wabtallatil 'uruuqu wa tsabatal ajru insyaa Allah.",
        meaning: "Telah hilang rasa haus dan urat-urat telah basah, serta pahala telah tetap, insya Allah.",
        category: 'Ramadhan'
    },
    {
        id: 'lailatul-qadar',
        title: 'Doa Lailatul Qadar',
        arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
        latin: "Allahumma innaka 'afuwwun tuhibbul 'afwa fa'fu 'anni.",
        meaning: "Ya Allah, sesungguhnya Engkau Maha Pemaaf dan senang memaafkan, maka maafkanlah kesalahanku.",
        category: 'Ramadhan'
    },
    {
        id: 'doa-sahur',
        title: 'Doa Makan Sahur',
        arabic: 'يَرْحَمُ اللهُ المُتَسَحِّرِيْنَ',
        latin: "Yarhamullahul mutasahhirin.",
        meaning: "Semoga Allah melimpahkan rahmat kepada orang-orang yang bersahur.",
        category: 'Ramadhan'
    },

    // HARIAN CATEGORY
    {
        id: 'doa-makan',
        title: 'Doa Sebelum Makan',
        arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ',
        latin: "Allahumma barik lana fima razaqtana waqina 'adzaban-nar.",
        meaning: "Ya Allah, berkahilah kami dalam rezeki yang telah Engkau berikan kepada kami dan peliharalah kami dari siksa api neraka.",
        category: 'Harian'
    },
    {
        id: 'doa-tidur',
        title: 'Doa Sebelum Tidur',
        arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
        latin: "Bismika Allahumma amutu wa ahya.",
        meaning: "Dengan menyebut nama-Mu Ya Allah, aku mati dan aku hidup.",
        category: 'Harian'
    },
    {
        id: 'keluar-rumah',
        title: 'Doa Keluar Rumah',
        arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ، لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ',
        latin: "Bismillahi tawakkaltu 'alallahi, laa haula wa laa quwwata illa billah.",
        meaning: "Dengan nama Allah, aku bertawakkal kepada Allah. Tiada daya dan kekuatan kecuali dengan Allah.",
        category: 'Harian'
    },
    
    // SHOLAT CATEGORY
    {
        id: 'doa-iftitah',
        title: 'Doa Iftitah (Singkat)',
        arabic: 'اللَّهُمَّ بَاعِدْ بَيْنِي وَبَيْنَ خَطَايَايَ كَمَا بَاعَدْتَ بَيْنَ الْمَشْرِقِ وَالْمَغْرِبِ',
        latin: "Allahumma baa'id bainii wa baina khathaayaaya kamaa baa'adta bainal masyriqi wal maghrib.",
        meaning: "Ya Allah, jauhkanlah antara aku dan kesalahan-kesalahanku sebagaimana Engkau menjauhkan antara timur dan barat.",
        category: 'Sholat'
    },
    
    // PAGI & PETANG CATEGORY
    {
        id: 'sayyidul-istighfar',
        title: 'Sayyidul Istighfar',
        arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ...',
        latin: "Allahumma anta Rabbi laa ilaha illa anta khalaqtani...",
        meaning: "Ya Allah, Engkau adalah Rabbku, tidak ada Ilah yang berhak disembah kecuali Engkau...",
        category: 'Pagi & Petang'
    }
];

export const Dua = () => {
    const { dzikirCounts, incrementDzikir, updateQuranProgress, quranProgress } = useApp();
    const [activeCat, setActiveCat] = useState('Ramadhan');
    const [search, setSearch] = useState('');

    const toggleBookmark = (dua: any) => {
        const item = { id: dua.id, title: dua.title, type: 'dua' as const };
        const bookmarks = quranProgress.bookmarks || [];
        const exists = bookmarks.some(b => b.id === item.id);
        
        if (exists) {
            updateQuranProgress({ bookmarks: bookmarks.filter(b => b.id !== item.id) });
        } else {
            updateQuranProgress({ bookmarks: [...bookmarks, item] });
        }
    }

    const isBookmarked = (id: string) => {
        return quranProgress.bookmarks?.some(b => b.id === id);
    }

    const filtered = DUAS.filter(d => 
        (activeCat === 'Favorit' ? isBookmarked(d.id) : d.category === activeCat) &&
        (d.title.toLowerCase().includes(search.toLowerCase()) || d.meaning.toLowerCase().includes(search.toLowerCase()))
    );

  return (
    <div className="animate-fade-in pb-12 flex flex-col h-screen">
        <header className="sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur-md z-10 px-4 pt-4 pb-2 border-b border-[var(--color-primary)]/5">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--color-primary)]">auto_stories</span>
                    Doa & Dzikir
                </h1>
            </div>
            
            {/* Search */}
            <div className="relative group mb-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--color-primary)]/60 group-focus-within:text-[var(--color-primary)] transition-colors">
                    <span className="material-symbols-outlined">search</span>
                </div>
                <input 
                    type="text" 
                    className="block w-full pl-10 pr-4 py-3 bg-[var(--color-card)] border-none rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-primary)] shadow-sm outline-none transition-all placeholder:text-[var(--color-text-muted)]" 
                    placeholder="Cari doa atau dzikir..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                {CATEGORIES.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setActiveCat(cat)}
                        className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeCat === cat ? 'bg-[var(--color-primary)] text-white shadow-md' : 'bg-[var(--color-card)] border border-gray-100 text-[var(--color-text-muted)] hover:border-[var(--color-primary)]'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
            
            {/* Dzikir Counter Section (Always visible on Pagi & Petang or Sholat) */}
            {(activeCat === 'Sholat' || activeCat === 'Pagi & Petang') && (
                <div className="animate-fade-in mb-6">
                     <div className="flex items-center gap-2 mb-3 px-1">
                        <span className="material-symbols-outlined text-[var(--color-primary)] filled text-sm">touch_app</span>
                        <h2 className="text-sm font-bold uppercase opacity-50 tracking-widest">
                            Penghitung Dzikir
                        </h2>
                    </div>
                    <div className="grid gap-3">
                        {[
                            { id: 'subhanallah', label: 'Tasbih (Subhanallah)', color: 'bg-blue-500' }, 
                            { id: 'alhamdulillah', label: 'Tahmid (Alhamdulillah)', color: 'bg-green-500' }, 
                            { id: 'allahuakbar', label: 'Takbir (Allahu Akbar)', color: 'bg-orange-500' },
                            { id: 'astaghfirullah', label: 'Istighfar', color: 'bg-slate-500' }
                        ].map((dz, idx) => {
                             const count = dzikirCounts[dz.id] || 0;
                             const target = dz.id === 'astaghfirullah' ? 100 : 33;
                             const progress = Math.min((count % target) / target * 100, 100);
                             const isCompleted = count > 0 && count % target === 0;
                             
                             return (
                                 <div key={idx} className="bg-[var(--color-card)] p-4 rounded-xl flex items-center justify-between border border-[var(--color-primary)]/10 shadow-sm relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer select-none" onClick={() => incrementDzikir(dz.id)}>
                                     {/* Progress Background */}
                                     <div className="absolute left-0 bottom-0 top-0 bg-[var(--color-primary)]/5 transition-all duration-200" style={{ width: `${progress}%` }}></div>
                                     
                                    <div className="relative z-10 flex flex-col">
                                        <span className="font-bold text-base">{dz.label}</span>
                                        <span className="text-[10px] opacity-60 font-bold uppercase tracking-wide">Target: {target}x</span>
                                    </div>
                                    <div className="relative z-10 flex items-center gap-4">
                                        <span className={`text-2xl font-mono font-bold ${isCompleted ? 'text-green-500' : 'text-[var(--color-primary)]'}`}>{count}</span>
                                        <div 
                                            className="size-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-lg shadow-[var(--color-primary)]/30 group-hover:scale-110 transition-transform"
                                        >
                                            <span className="material-symbols-outlined text-xl">add</span>
                                        </div>
                                    </div>
                                 </div>
                             );
                        })}
                    </div>
                    <div className="h-px w-full bg-gray-100 my-6"></div>
                </div>
            )}

            {filtered.length === 0 && (
                <div className="text-center py-10 opacity-50">
                    <span className="material-symbols-outlined text-4xl mb-2">bookmark_border</span>
                    <p>Tidak ada doa dalam kategori ini.</p>
                </div>
            )}

            {filtered.map((dua, i) => (
                <article key={i} className="bg-[var(--color-card)] rounded-xl p-5 shadow-sm border border-[var(--color-primary)]/5 transition-transform hover:scale-[1.01]">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-[var(--color-primary)] text-lg">{dua.title}</h3>
                        <div className="flex gap-1 -mr-2">
                             <button className="p-2 text-[var(--color-primary)]/40 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 rounded-full transition-all">
                                <span className="material-symbols-outlined text-xl">content_copy</span>
                            </button>
                            <button 
                                onClick={() => toggleBookmark(dua)}
                                className={`p-2 rounded-full ${isBookmarked(dua.id) ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'} hover:bg-[var(--color-primary)]/5 transition-all`}
                            >
                                <span className={`material-symbols-outlined text-xl ${isBookmarked(dua.id) ? 'filled' : ''}`}>bookmark</span>
                            </button>
                        </div>
                    </div>
                    <p className="font-arabic text-right text-2xl leading-loose mb-6 text-[var(--color-text)]" dir="rtl">
                        {dua.arabic}
                    </p>
                    <div className="space-y-2">
                        <p className="text-sm italic text-[var(--color-primary)] font-medium">
                            {dua.latin}
                        </p>
                        <p className="text-sm leading-relaxed opacity-80">
                            "{dua.meaning}"
                        </p>
                    </div>
                </article>
            ))}
        </div>
    </div>
  );
};
