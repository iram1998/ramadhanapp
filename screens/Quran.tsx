
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { getSurahList, getSurahDetail, getJuzDetail, getPageDetail } from '../utils';
import { Surah, Ayah } from '../types';

// Custom CSS Bar Chart Component
const SimpleBarChart = ({ data, color, mutedColor }: { data: { name: string; value: number }[], color: string, mutedColor: string }) => {
  const maxValue = Math.max(...data.map(d => d.value), 10); // Minimum scale of 10 for better viz
  
  return (
    <div className="flex items-end justify-between h-32 w-full gap-2 pt-4">
      {data.map((item, index) => {
        const heightPercent = (item.value / maxValue) * 100;
        const isHigh = item.value > 5;
        const isToday = index === data.length - 1;

        return (
          <div key={index} className="flex flex-col items-center flex-1 gap-2 group">
             <div className="relative w-full flex items-end justify-center h-full rounded-t-sm overflow-hidden bg-gray-50/50">
                <div 
                  style={{ 
                    height: `${heightPercent || 2}%`, // Min height for visibility
                    backgroundColor: isToday ? color : (item.value > 0 ? color : mutedColor),
                    opacity: isToday ? 1 : (item.value > 0 ? 0.6 : 0.3) 
                  }} 
                  className={`w-full rounded-t-md transition-all duration-500 group-hover:opacity-80`}
                ></div>
                {/* Tooltip on hover */}
                <div className="absolute -top-8 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {item.value} pages
                </div>
             </div>
             <span className={`text-[10px] font-bold ${isToday ? 'text-[var(--color-primary)]' : 'opacity-40'}`}>{item.name}</span>
          </div>
        );
      })}
    </div>
  );
};

const RECOMMENDED_BOOKMARKS = [
    { id: 'ayat-kursi', title: 'Ayatul Kursi (Al-Baqarah: 255)', type: 'quran' as const },
    { id: 'al-kahf', title: 'Al-Kahf (Jumat Sunnah)', type: 'quran' as const },
    { id: 'al-mulk', title: 'Al-Mulk (Before Sleep)', type: 'quran' as const },
];

export const Quran = () => {
  const { quranProgress, updateQuranProgress, theme, pagesReadToday, setPagesReadToday, history } = useApp();
  
  // Tab State: 'tracker' | 'reader'
  const [activeTab, setActiveTab] = useState<'tracker' | 'reader'>('reader');
  // Reader View Mode: 'surah' | 'juz' | 'page'
  const [readMode, setReadMode] = useState<'surah' | 'juz' | 'page'>('surah');
  
  // Reader State
  const [surahList, setSurahList] = useState<Surah[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  
  // Selected Data
  const [selectedItem, setSelectedItem] = useState<{ type: 'surah'|'juz'|'page', id: number, name: string } | null>(null);
  const [content, setContent] = useState<{ ayahs: Ayah[] } | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Target Modal
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [targetInput, setTargetInput] = useState('30');

  // Audio State
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null); // Index in array
  const [isPlaying, setIsPlaying] = useState(false);

  // --- INIT DATA ---
  useEffect(() => {
      // Load Surah List on mount if in reader tab & surah mode
      if (activeTab === 'reader' && readMode === 'surah' && surahList.length === 0) {
          setLoadingList(true);
          getSurahList().then(data => {
              setSurahList(data);
              setLoadingList(false);
          });
      }
  }, [activeTab, readMode]);

  // Handle Audio Stop when unmounting or closing
  useEffect(() => {
      return () => {
          if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
          }
      };
  }, []);

  // Lock Body Scroll when Modals are Open
  useEffect(() => {
      if (showTargetModal) {
          document.body.style.overflow = 'hidden';
      } else {
          document.body.style.overflow = 'auto';
      }
      return () => {
          document.body.style.overflow = 'auto';
      };
  }, [showTargetModal]);

  // --- AUDIO HANDLERS ---
  const toggleAudio = (ayahIndex: number, audioUrl?: string) => {
      if (!audioUrl) {
          alert("Audio tidak tersedia untuk ayat ini.");
          return;
      }

      if (playingAyah === ayahIndex && isPlaying) {
          audioRef.current?.pause();
          setIsPlaying(false);
      } else {
          // Play new ayah
          if (audioRef.current) {
              audioRef.current.pause();
          }
          audioRef.current = new Audio(audioUrl);
          audioRef.current.onended = () => {
              // Auto play next if available
              if (content && ayahIndex + 1 < content.ayahs.length) {
                   const nextAyah = content.ayahs[ayahIndex + 1];
                   toggleAudio(ayahIndex + 1, nextAyah.audio);
              } else {
                  setIsPlaying(false);
                  setPlayingAyah(null);
              }
          };
          
          setPlayingAyah(ayahIndex);
          setIsPlaying(true);
          audioRef.current.play().catch(e => {
              console.error("Audio failed", e);
              setIsPlaying(false);
          });
          
          // Scroll to playing ayah with a slight delay to allow UI updates (like player bar appearing)
          setTimeout(() => {
              const targetAyah = content?.ayahs[ayahIndex];
              const sNum = targetAyah?.surah?.number || (selectedItem?.type === 'surah' ? selectedItem.id : 0);
              const el = document.getElementById(`ayah-${sNum}-${targetAyah?.numberInSurah}`);
              if(el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
          }, 100);
      }
  };


  // --- HANDLERS ---
  const handleOpenItem = async (type: 'surah'|'juz'|'page', id: number, name: string) => {
      setSelectedItem({ type, id, name });
      setLoadingContent(true);
      setContent(null);
      setPlayingAyah(null);
      setIsPlaying(false);
      
      let detail = null;
      if (type === 'surah') detail = await getSurahDetail(id);
      else if (type === 'juz') detail = await getJuzDetail(id);
      else if (type === 'page') detail = await getPageDetail(id);

      setContent(detail);
      setLoadingContent(false);
      
      // Update progress state simple (only for surah tracking mostly)
      if (type === 'surah') {
           updateQuranProgress({ currentSurah: name });
      }
  };

  const handleNextPage = () => {
      if (selectedItem && selectedItem.type === 'page' && selectedItem.id < 604) {
          handleOpenItem('page', selectedItem.id + 1, `Halaman ${selectedItem.id + 1}`);
          window.scrollTo(0,0);
      }
  };
  
  const handlePrevPage = () => {
      if (selectedItem && selectedItem.type === 'page' && selectedItem.id > 1) {
          handleOpenItem('page', selectedItem.id - 1, `Halaman ${selectedItem.id - 1}`);
          window.scrollTo(0,0);
      }
  };

  const handleBackToList = () => {
      setSelectedItem(null);
      setContent(null);
      if(audioRef.current) {
          audioRef.current.pause();
          setIsPlaying(false);
          setPlayingAyah(null);
      }
  };

  const saveLastRead = (ayah: any) => {
      // Handle different structures. API for Juz/Page puts 'surah' inside ayah object
      const surahNum = ayah.surah ? ayah.surah.number : (selectedItem?.type === 'surah' ? selectedItem.id : 0);
      const surahName = ayah.surah ? ayah.surah.englishName : (selectedItem?.type === 'surah' ? selectedItem?.name : '');

      if (surahNum) {
        updateQuranProgress({
            lastRead: {
                surahNumber: surahNum,
                surahName: surahName,
                ayahNumber: ayah.numberInSurah
            }
        });
        alert(`Ditandai: ${surahName} Ayat ${ayah.numberInSurah}`);
      }
  }

  // --- CHART DATA LOGIC (Existing) ---
  const getChartData = () => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const data = [];
      const historyLen = history.length;
      const startIndex = Math.max(0, historyLen - 6);
      const relevantHistory = history.slice(startIndex);

      const neededPadding = 6 - relevantHistory.length;
      for (let i = 0; i < neededPadding; i++) {
          data.push({ name: '-', value: 0 });
      }

      relevantHistory.forEach(day => {
          const d = new Date(day.date);
          data.push({ name: days[d.getDay()], value: day.pagesRead || 0 });
      });

      data.push({ name: 'Today', value: pagesReadToday });
      return data;
  };

  const chartData = getChartData();
  const percentage = Math.round((quranProgress.completedJuz.length / 30) * 100);

  const handleNextJuz = () => {
    const nextJuz = quranProgress.currentJuz < 30 ? quranProgress.currentJuz + 1 : 1;
    const newCompleted = [...new Set([...quranProgress.completedJuz, quranProgress.currentJuz])];
    
    updateQuranProgress({
        currentJuz: nextJuz,
        completedJuz: newCompleted,
        currentSurah: `Juz ${nextJuz}`, 
        currentAyah: 1
    });
  };
  
  const toggleBookmark = (item: { id: string; title: string; type: 'quran' | 'dua' }) => {
      const exists = quranProgress.bookmarks?.some(b => b.id === item.id);
      let newBookmarks;
      if (exists) {
          newBookmarks = quranProgress.bookmarks.filter(b => b.id !== item.id);
      } else {
          newBookmarks = [...(quranProgress.bookmarks || []), item];
      }
      updateQuranProgress({ bookmarks: newBookmarks });
  };
  
  const saveTarget = () => {
      const val = parseInt(targetInput);
      if(val > 0) {
          updateQuranProgress({ totalKhatamTarget: val });
          setShowTargetModal(false);
      }
  }

  // --- RENDER COMPONENT ---
  return (
    <div className="animate-fade-in pb-24 min-h-screen bg-[var(--color-bg)]">
        {/* Sticky Header with Tabs */}
        <div className="sticky top-0 bg-[var(--color-bg)]/95 backdrop-blur-md z-20 border-b border-[var(--color-primary)]/10">
            <div className="flex items-center p-4 pb-2 justify-between">
                {selectedItem ? (
                    <button onClick={handleBackToList} className="size-10 flex items-center justify-center hover:bg-[var(--color-primary)]/10 rounded-full transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                ) : (
                    <div className="size-10"></div> 
                )}
                
                <h2 className="text-lg font-bold leading-tight flex-1 text-center">
                    {selectedItem ? selectedItem.name : 'Al-Quran'}
                </h2>
                
                <div className="size-10 flex items-center justify-center cursor-pointer hover:bg-[var(--color-primary)]/10 rounded-full transition-colors">
                    <span className="material-symbols-outlined">settings</span>
                </div>
            </div>

            {/* Main Tabs */}
            {!selectedItem && (
                <div className="flex px-4 pb-0 mb-[-1px]">
                    <button 
                        onClick={() => setActiveTab('reader')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'reader' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent opacity-50'}`}
                    >
                        Baca Quran
                    </button>
                    <button 
                         onClick={() => setActiveTab('tracker')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'tracker' ? 'border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent opacity-50'}`}
                    >
                        Tracker & Hafalan
                    </button>
                </div>
            )}
        </div>

        {/* --- READER TAB --- */}
        {activeTab === 'reader' && (
            <div className="p-0">
                {/* ... (Reader logic stays mostly the same, elided for brevity in this update block as request focus is on Tracker features, but need to include full file or it gets cut off. Re-pasting full content of Reader Tab) */}
                
                {/* LIST VIEW */}
                {!selectedItem && (
                    <div className="p-4 space-y-4 animate-fade-in">
                        {/* Sub-Tabs: Surah / Juz / Halaman */}
                        <div className="flex p-1 bg-[var(--color-card)] border border-[var(--color-primary)]/10 rounded-xl mb-2">
                             {(['surah', 'juz', 'page'] as const).map(mode => (
                                 <button 
                                    key={mode}
                                    onClick={() => setReadMode(mode)}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize ${readMode === mode ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--color-text)] opacity-60'}`}
                                 >
                                     {mode === 'page' ? 'Halaman' : mode}
                                 </button>
                             ))}
                        </div>

                        {/* Last Read Card */}
                        {quranProgress.lastRead && (
                             <div className="bg-gradient-to-r from-[var(--color-primary)] to-emerald-700 rounded-2xl p-5 text-white shadow-lg shadow-[var(--color-primary)]/20 relative overflow-hidden">
                                <div className="relative z-10 flex justify-between items-center">
                                    <div>
                                        <p className="text-xs font-bold opacity-80 uppercase tracking-widest mb-1">Terakhir Dibaca</p>
                                        <h3 className="text-xl font-bold">{quranProgress.lastRead.surahName}</h3>
                                        <p className="text-sm opacity-90">Ayat {quranProgress.lastRead.ayahNumber}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleOpenItem('surah', quranProgress.lastRead!.surahNumber, quranProgress.lastRead!.surahName)}
                                        className="bg-white text-[var(--color-primary)] px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-gray-100 transition-colors"
                                    >
                                        Lanjut
                                    </button>
                                </div>
                                <div className="absolute right-0 bottom-0 opacity-10">
                                    <span className="material-symbols-outlined text-[100px] -mr-4 -mb-4">menu_book</span>
                                </div>
                             </div>
                        )}

                        {/* MODE SURAH */}
                        {readMode === 'surah' && (
                            <>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Cari Surah..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full p-3 pl-10 bg-[var(--color-card)] rounded-xl border border-[var(--color-primary)]/10 focus:border-[var(--color-primary)] outline-none text-sm"
                                    />
                                    <span className="material-symbols-outlined absolute left-3 top-3 opacity-40">search</span>
                                </div>

                                {loadingList ? (
                                    <div className="flex flex-col items-center py-12 opacity-50">
                                        <div className="size-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-2"></div>
                                        <p className="text-xs">Memuat daftar surah...</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {surahList.filter(s => s.englishName.toLowerCase().includes(searchTerm.toLowerCase()) || s.name.includes(searchTerm)).map((surah) => (
                                            <div 
                                                key={surah.number} 
                                                onClick={() => handleOpenItem('surah', surah.number, surah.englishName)}
                                                className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-primary)]/5 hover:border-[var(--color-primary)]/30 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-lg flex items-center justify-center font-bold text-sm relative">
                                                        {surah.number}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-base">{surah.englishName}</h4>
                                                        <p className="text-xs opacity-50 font-medium uppercase tracking-wide">{surah.revelationType} • {surah.numberOfAyahs} Ayat</p>
                                                    </div>
                                                </div>
                                                <span className="font-arabic text-xl opacity-80 text-[var(--color-primary)]">{surah.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}

                        {/* MODE JUZ */}
                        {readMode === 'juz' && (
                            <div className="grid grid-cols-2 gap-3">
                                {Array.from({length: 30}, (_, i) => i + 1).map(juz => (
                                    <button 
                                        key={juz}
                                        onClick={() => handleOpenItem('juz', juz, `Juz ${juz}`)}
                                        className="p-4 bg-[var(--color-card)] border border-[var(--color-primary)]/10 rounded-xl hover:bg-[var(--color-primary)]/5 flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                             <div className="size-8 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-xs font-bold">{juz}</div>
                                             <span className="font-bold text-sm">Juz {juz}</span>
                                        </div>
                                        <span className="material-symbols-outlined opacity-30 text-sm">chevron_right</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* MODE HALAMAN */}
                        {readMode === 'page' && (
                             <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                {Array.from({length: 604}, (_, i) => i + 1).map(page => (
                                    <button 
                                        key={page}
                                        onClick={() => handleOpenItem('page', page, `Hal ${page}`)}
                                        className="p-2 bg-[var(--color-card)] border border-[var(--color-primary)]/10 rounded-lg hover:bg-[var(--color-primary)]/5 text-center"
                                    >
                                        <span className="font-bold text-sm">{page}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                    </div>
                )}

                {/* DETAIL CONTENT VIEW */}
                {selectedItem && (
                    <div className="animate-fade-in bg-[var(--color-bg)] min-h-screen pb-24">
                         {loadingContent ? (
                            <div className="flex flex-col items-center justify-center h-[50vh] opacity-50">
                                <div className="size-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-sm">Membuka Mushaf...</p>
                            </div>
                         ) : content ? (
                            <div className="p-4 space-y-6">
                                {/* Basmalah if Surah Mode and not At-Tawbah (9) */}
                                {selectedItem.type === 'surah' && selectedItem.id !== 9 && (
                                    <div className="text-center py-6 bg-[var(--color-card)] rounded-2xl border border-[var(--color-primary)]/5 mb-4 shadow-sm">
                                        <p className="font-arabic text-2xl text-[var(--color-text)]">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                                    </div>
                                )}
                                
                                {content.ayahs.map((ayah: Ayah, idx: number) => {
                                    const isActive = playingAyah === idx;
                                    
                                    // Check for new Surah start in Juz/Page mode
                                    const isNewSurah = (selectedItem.type === 'juz' || selectedItem.type === 'page') && ayah.numberInSurah === 1;
                                    const surahName = ayah.surah?.englishName || '';
                                    const surahNumber = ayah.surah?.number || 0;

                                    return (
                                        <React.Fragment key={`${ayah.number}-${ayah.numberInSurah}`}>
                                            {/* RENDER SURAH HEADER IF NEW SURAH DETECTED */}
                                            {isNewSurah && (
                                                <div className="mt-8 mb-6 text-center animate-fade-in">
                                                    <div className="inline-block bg-[var(--color-primary)] text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-[var(--color-primary)]/20 mb-4">
                                                        {surahName}
                                                    </div>
                                                    {surahNumber !== 9 && surahNumber !== 1 && (
                                                        <div className="py-4 bg-[var(--color-card)] rounded-2xl border border-[var(--color-primary)]/5 shadow-sm">
                                                            <p className="font-arabic text-2xl text-[var(--color-text)]">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className={`group scroll-mt-32 transition-colors duration-300 ${isActive ? 'bg-[var(--color-primary)]/5 rounded-2xl' : ''}`} id={`ayah-${surahNumber || (selectedItem.type === 'surah' ? selectedItem.id : 0)}-${ayah.numberInSurah}`}>
                                                <div className="bg-[var(--color-card)] rounded-2xl p-5 border border-transparent hover:border-[var(--color-primary)]/20 transition-all shadow-sm">
                                                    {/* Header: Number & Info */}
                                                    <div className="flex justify-between items-center mb-4 bg-gray-50/50 p-2 rounded-lg">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${isActive ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                                                                {ayah.numberInSurah}
                                                            </span>
                                                            {/* Also showing Surah name tag next to number for clarity */}
                                                            {(selectedItem.type === 'juz' || selectedItem.type === 'page') && ayah.surah && (
                                                                <span className="text-[10px] font-bold uppercase tracking-wide opacity-50 bg-gray-200 px-2 py-0.5 rounded-md">
                                                                    {ayah.surah.englishName}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex gap-2">
                                                             <button 
                                                                onClick={() => toggleAudio(idx, ayah.audio)}
                                                                className={`size-8 rounded-full flex items-center justify-center transition-colors ${isActive && isPlaying ? 'bg-[var(--color-primary)] text-white' : 'hover:bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}
                                                                title="Play Audio"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">
                                                                    {isActive && isPlaying ? 'pause' : 'play_arrow'}
                                                                </span>
                                                            </button>
                                                             <button 
                                                                onClick={() => saveLastRead(ayah)}
                                                                className="size-8 rounded-full hover:bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                                                                title="Tandai Terakhir Baca"
                                                            >
                                                                <span className="material-symbols-outlined text-lg">bookmark</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Arabic Text */}
                                                    <p className={`font-arabic text-right text-3xl leading-[2.5] mb-6 transition-colors ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text)]'}`} dir="rtl">
                                                        {ayah.text}
                                                    </p>

                                                    {/* Translation */}
                                                    <p className="text-sm leading-relaxed opacity-80 text-[var(--color-text)]">
                                                        {ayah.translation}
                                                    </p>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    );
                                })}

                                {/* Page Navigation (Only for Page Mode) */}
                                {selectedItem.type === 'page' && (
                                    <div className="flex gap-3 pt-4">
                                        <button 
                                            disabled={selectedItem.id <= 1}
                                            onClick={handlePrevPage}
                                            className="flex-1 py-3 bg-[var(--color-card)] border border-[var(--color-primary)]/20 rounded-xl font-bold text-sm disabled:opacity-50"
                                        >
                                            ← Sebelumnya
                                        </button>
                                        <button 
                                            disabled={selectedItem.id >= 604}
                                            onClick={handleNextPage}
                                            className="flex-1 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm disabled:opacity-50"
                                        >
                                            Selanjutnya →
                                        </button>
                                    </div>
                                )}
                                
                                <div className="h-20 flex items-center justify-center opacity-50 text-sm">
                                    <p>Akhir {selectedItem.name}</p>
                                </div>
                            </div>
                         ) : (
                             <div className="p-10 text-center opacity-50">Gagal memuat ayat. Periksa koneksi internet.</div>
                         )}

                         {/* Sticky Audio Player Bar (If Playing) */}
                         {selectedItem && (
                            <div className={`fixed bottom-0 left-0 right-0 p-4 bg-[var(--color-card)]/90 backdrop-blur-lg border-t border-[var(--color-primary)]/10 transition-transform duration-300 z-50 ${playingAyah !== null ? 'translate-y-0' : 'translate-y-full'}`}>
                                <div className="max-w-md mx-auto flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center animate-pulse">
                                            <span className="material-symbols-outlined">graphic_eq</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">Ayat {playingAyah !== null && content?.ayahs[playingAyah] ? content.ayahs[playingAyah].numberInSurah : '-'}</p>
                                            <p className="text-xs opacity-60">Misyari Rasyid Al-Afasy</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => {
                                                if(playingAyah !== null && playingAyah > 0) {
                                                    const prev = playingAyah - 1;
                                                    toggleAudio(prev, content?.ayahs[prev].audio);
                                                }
                                            }}
                                            className="p-2 rounded-full hover:bg-gray-100"
                                        >
                                             <span className="material-symbols-outlined">skip_previous</span>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (playingAyah !== null) {
                                                    toggleAudio(playingAyah, content?.ayahs[playingAyah].audio);
                                                }
                                            }}
                                            className="size-10 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center"
                                        >
                                             <span className="material-symbols-outlined">{isPlaying ? 'pause' : 'play_arrow'}</span>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                 if(content && playingAyah !== null && playingAyah + 1 < content.ayahs.length) {
                                                    const next = playingAyah + 1;
                                                    toggleAudio(next, content.ayahs[next].audio);
                                                }
                                            }}
                                            className="p-2 rounded-full hover:bg-gray-100"
                                        >
                                             <span className="material-symbols-outlined">skip_next</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                         )}
                    </div>
                )}
            </div>
        )}

        {/* --- TRACKER TAB (Original View) --- */}
        {activeTab === 'tracker' && (
             <div className="flex flex-col gap-6 p-6 animate-fade-in">
                {/* Goal Card */}
                <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-card)] p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <p className="text-base font-bold">Target Khatam</p>
                            <p className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-1 rounded-md w-fit">
                                {quranProgress.totalKhatamTarget} Days
                            </p>
                        </div>
                        <button 
                            onClick={() => {
                                setTargetInput(quranProgress.totalKhatamTarget.toString());
                                setShowTargetModal(true);
                            }}
                            className="flex items-center justify-center rounded-full h-10 w-10 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                        </button>
                    </div>
                    
                    <div className="flex flex-col gap-3 pt-2">
                        <div className="flex justify-between items-end">
                            <div className="flex flex-col">
                                <span className="text-4xl font-extrabold text-[var(--color-primary)] leading-none">{percentage}%</span>
                            </div>
                            <p className="text-sm font-semibold mb-1 opacity-80 text-right">
                                Reading <span className="text-[var(--color-primary)] block">Juz {quranProgress.currentJuz}</span>
                            </p>
                        </div>
                        
                        <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden mt-1">
                            <div 
                                className="h-full rounded-full bg-[var(--color-primary)] shadow-[0_0_15px_rgba(var(--color-primary),0.5)] transition-all duration-1000 ease-out" 
                                style={{ width: `${percentage}%` }}
                            >
                                <div className="w-full h-full bg-white/20 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Input Pages Today */}
                <div className="bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-primary)]/10 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-bold">Halaman Hari Ini</p>
                        <p className="text-xs opacity-50">Log bacaan harianmu</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setPagesReadToday(Math.max(0, pagesReadToday - 1))}
                            className="size-8 rounded-full border border-gray-200 flex items-center justify-center active:scale-90 transition-transform"
                        >
                            <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <span className="text-xl font-mono font-bold w-8 text-center">{pagesReadToday}</span>
                        <button 
                            onClick={() => setPagesReadToday(pagesReadToday + 1)}
                            className="size-8 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-[var(--color-primary)]/30"
                        >
                            <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                    </div>
                </div>

                {/* Continue Reading CTA */}
                <div 
                    onClick={handleNextJuz}
                    className="group relative flex flex-col gap-3 rounded-2xl bg-[var(--color-primary)] p-6 shadow-lg shadow-[var(--color-primary)]/30 cursor-pointer overflow-hidden text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="absolute -right-6 -top-6 opacity-10 rotate-12">
                        <span className="material-symbols-outlined text-[140px]">menu_book</span>
                    </div>
                    
                    <div className="relative z-10 flex items-center gap-4">
                        <div className="flex size-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white shadow-inner border border-white/10">
                            <span className="material-symbols-outlined filled">check</span>
                        </div>
                        <div className="flex flex-col">
                            <p className="text-white/80 text-xs font-bold uppercase tracking-wider mb-0.5">Mark as Completed</p>
                            <h4 className="text-white text-xl font-bold">Finish Juz {quranProgress.currentJuz}</h4>
                            <p className="text-white/90 text-sm">Tap to proceed to Juz {quranProgress.currentJuz + 1}</p>
                        </div>
                    </div>
                </div>

                {/* Stats Chart */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-bold tracking-tight">Activity (Pages)</h3>
                        <span className="text-[var(--color-primary)] text-[10px] font-bold bg-[var(--color-primary)]/10 px-2 py-1 rounded uppercase tracking-wider">Last 7 Days</span>
                    </div>
                    <div className="rounded-2xl border border-[var(--color-primary)]/10 bg-[var(--color-card)] p-6 shadow-sm">
                        <SimpleBarChart 
                            data={chartData} 
                            color={theme.colors.primary} 
                            mutedColor={theme.colors.textMuted} 
                        />
                    </div>
                </div>
                
                {/* Bookmarks */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-lg font-bold tracking-tight">Bookmarks</h3>
                    </div>
                    {(quranProgress.bookmarks || []).map((b, i) => (
                        <div key={b.id} className="flex items-center gap-4 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary)]/5 p-4 shadow-sm transition-all cursor-pointer group">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white transition-colors">
                                <span className="material-symbols-outlined filled">bookmark</span>
                            </div>
                            <div className="flex flex-1 flex-col">
                                <p className="text-base font-bold text-[var(--color-text)]">{b.title}</p>
                                <p className="text-xs opacity-50 font-medium uppercase tracking-wide">Saved</p>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); toggleBookmark(b); }} className="size-8 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors">
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        </div>
                    ))}
                    
                    {RECOMMENDED_BOOKMARKS.filter(rb => !quranProgress.bookmarks?.some(b => b.id === rb.id)).map((item, i) => (
                        <div key={i} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-[var(--color-card)] p-4 shadow-sm hover:border-[var(--color-primary)]/30 transition-all cursor-pointer group">
                            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/5 text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                                <span className="material-symbols-outlined">bookmark_border</span>
                            </div>
                            <div className="flex flex-1 flex-col">
                                <p className="text-base font-bold text-[var(--color-text)]">{item.title}</p>
                                <p className="text-xs opacity-50 font-medium uppercase tracking-wide">Recommended</p>
                            </div>
                            <button onClick={() => toggleBookmark(item)} className="size-8 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-gray-100">
                                <span className="material-symbols-outlined text-lg">add</span>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Modal Target Khatam */}
        {showTargetModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                 <div className="bg-[var(--color-card)] w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold">Target Khatam</h3>
                         <button onClick={() => setShowTargetModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    <p className="text-sm opacity-60">
                        Berapa hari target Anda untuk menyelesaikan 30 Juz Al-Quran?
                    </p>
                    <div className="flex items-center gap-2">
                         <input 
                            type="number" 
                            value={targetInput}
                            onChange={(e) => setTargetInput(e.target.value)}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary)] font-bold text-lg text-center"
                            min="1"
                            max="365"
                        />
                        <span className="font-bold opacity-60">Hari</span>
                    </div>
                    
                    <button 
                        onClick={saveTarget}
                        className="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-xl shadow-md hover:brightness-95"
                    >
                        Simpan Target
                    </button>
                 </div>
            </div>
        )}
    </div>
  );
};
