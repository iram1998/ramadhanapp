import React, { useState } from 'react';

const CATEGORIES = ['Harian', 'Sholat', 'Ramadhan', 'Favorit'];

const DUAS = [
    {
        title: 'Doa Berbuka Puasa',
        arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللَّهُ',
        latin: "Dzahabaz zhama'u wabtallatil 'uruuqu wa tsabatal ajru insyaa Allah.",
        meaning: "Telah hilang rasa haus dan urat-urat telah basah, serta pahala telah tetap, insya Allah.",
        category: 'Ramadhan'
    },
    {
        title: 'Niat Puasa Ramadhan',
        arabic: 'نَوَيْتُ صَوْمَ غَدٍ عَنْ أَدَاءِ فَرْضِ شَهْرِ رَمَضَانَ هَذِهِ السَّنَةِ لِلَّهِ تَعَالَى',
        latin: "Nawaitu shauma ghadin 'an ada'i fardhi syahri Ramadhana hadzihis sanati lillahi Ta'ala.",
        meaning: "Aku niat berpuasa esok hari untuk menunaikan kewajiban puasa bulan Ramadhan tahun ini karena Allah Ta'ala.",
        category: 'Ramadhan'
    },
    {
        title: 'Doa Sebelum Makan',
        arabic: 'اللَّهُمَّ بَارِكْ لَنَا فِيمَا رَزَقْتَنَا وَقِنَا عَذَابَ النَّارِ',
        latin: "Allahumma barik lana fima razaqtana waqina 'adzaban-nar.",
        meaning: "Ya Allah, berkahilah kami dalam rezeki yang telah Engkau berikan kepada kami dan peliharalah kami dari siksa api neraka.",
        category: 'Harian'
    }
];

export const Dua = () => {
    const [activeCat, setActiveCat] = useState('Ramadhan');
    const [search, setSearch] = useState('');

    const filtered = DUAS.filter(d => 
        (activeCat === 'Favorit' ? true : d.category === activeCat) &&
        (d.title.toLowerCase().includes(search.toLowerCase()) || d.meaning.toLowerCase().includes(search.toLowerCase()))
    );

  return (
    <div className="animate-fade-in pb-12 flex flex-col h-screen">
        <header className="sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur-md z-10 px-4 pt-4 pb-2">
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
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {CATEGORIES.map(cat => (
                    <button 
                        key={cat}
                        onClick={() => setActiveCat(cat)}
                        className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${activeCat === cat ? 'bg-[var(--color-primary)] text-white shadow-md' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20'}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
            {filtered.map((dua, i) => (
                <article key={i} className="bg-[var(--color-card)] rounded-xl p-5 shadow-sm border border-[var(--color-primary)]/5 transition-transform hover:scale-[1.01]">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-[var(--color-primary)]">{dua.title}</h3>
                        <div className="flex gap-2">
                             <button className="text-[var(--color-primary)]/70 hover:text-[var(--color-primary)] hover:scale-110 transition-all">
                                <span className="material-symbols-outlined">play_circle</span>
                            </button>
                            <button className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:scale-110 transition-all">
                                <span className="material-symbols-outlined">bookmark</span>
                            </button>
                        </div>
                    </div>
                    <p className="font-arabic text-right text-2xl leading-loose mb-4" dir="rtl">
                        {dua.arabic}
                    </p>
                    <p className="text-sm italic opacity-60 mb-2 font-medium">
                        {dua.latin}
                    </p>
                    <p className="text-sm leading-relaxed opacity-90">
                        "{dua.meaning}"
                    </p>
                </article>
            ))}

            {/* Dzikir Section (Static for demo) */}
            {activeCat === 'Sholat' && (
                <div className="mt-8">
                     <h2 className="text-xl font-extrabold flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-[var(--color-primary)] filled">prayer_times</span>
                        Dzikir Setelah Sholat
                    </h2>
                    <div className="grid gap-3">
                        {['Tasbih (Subhanallah)', 'Tahmid (Alhamdulillah)', 'Takbir (Allahu Akbar)'].map((dz, idx) => (
                             <div key={idx} className="bg-[var(--color-primary)]/5 p-4 rounded-xl flex items-center justify-between border border-[var(--color-primary)]/10">
                                <span className="font-bold text-sm">{dz}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/20 px-2 py-1 rounded">33x</span>
                                    <button className="size-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center shadow-md active:scale-90 transition-transform">
                                        <span className="material-symbols-outlined text-sm">add</span>
                                    </button>
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};