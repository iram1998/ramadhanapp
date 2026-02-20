import React from 'react';
import { useApp } from '../contexts/AppContext';

// Replaced Recharts with this custom CSS Bar Chart Component
const SimpleBarChart = ({ data, color, mutedColor }: { data: { name: string; value: number }[], color: string, mutedColor: string }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="flex items-end justify-between h-32 w-full gap-2 pt-4">
      {data.map((item, index) => {
        const heightPercent = (item.value / maxValue) * 100;
        const isHigh = item.value > 10;
        return (
          <div key={index} className="flex flex-col items-center flex-1 gap-2 group">
             <div className="relative w-full flex items-end justify-center h-full rounded-t-sm overflow-hidden bg-gray-50/50">
                <div 
                  style={{ 
                    height: `${heightPercent}%`, 
                    backgroundColor: isHigh ? color : mutedColor,
                    opacity: isHigh ? 1 : 0.5 
                  }} 
                  className="w-full rounded-t-md transition-all duration-500 group-hover:opacity-80"
                ></div>
                {/* Tooltip on hover */}
                <div className="absolute -top-8 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    {item.value} pages
                </div>
             </div>
             <span className="text-[10px] font-bold opacity-40">{item.name}</span>
          </div>
        );
      })}
    </div>
  );
};

const chartData = [
  { name: 'Mon', value: 8 },
  { name: 'Tue', value: 15 },
  { name: 'Wed', value: 6 },
  { name: 'Thu', value: 11 },
  { name: 'Fri', value: 18 },
  { name: 'Sat', value: 4 },
  { name: 'Sun', value: 9 },
];

export const Quran = () => {
  const { quranProgress, updateQuranProgress, theme } = useApp();
  const percentage = Math.round((quranProgress.completedJuz.length / 30) * 100);

  const handleNextJuz = () => {
    const nextJuz = quranProgress.currentJuz < 30 ? quranProgress.currentJuz + 1 : 1;
    // Simple logic: add current juz to completed list if not there
    const newCompleted = [...new Set([...quranProgress.completedJuz, quranProgress.currentJuz])];
    
    updateQuranProgress({
        currentJuz: nextJuz,
        completedJuz: newCompleted,
        // Reset or mock next surah logic
        currentSurah: `Juz ${nextJuz}`, 
        currentAyah: 1
    });
  };

  return (
    <div className="animate-fade-in pb-24">
        {/* Sticky Header */}
        <div className="flex items-center p-4 pb-2 justify-between sticky top-0 bg-[var(--color-bg)]/80 backdrop-blur-md z-10 border-b border-gray-100/50">
            <div className="size-10 flex items-center justify-center cursor-pointer hover:bg-[var(--color-primary)]/10 rounded-full transition-colors">
                <span className="material-symbols-outlined">arrow_back</span>
            </div>
            <h2 className="text-lg font-bold leading-tight flex-1 text-center">Quran Progress</h2>
            <div className="size-10 flex items-center justify-center cursor-pointer hover:bg-[var(--color-primary)]/10 rounded-full transition-colors">
                <span className="material-symbols-outlined">settings</span>
            </div>
        </div>

        <div className="flex flex-col gap-6 p-6">
            {/* Goal Card */}
            <div className="flex flex-col gap-4 rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-card)] p-6 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                        <p className="text-base font-bold">Target Khatam</p>
                        <p className="text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-1 rounded-md w-fit">
                            {quranProgress.totalKhatamTarget} Days
                        </p>
                    </div>
                    <button className="flex items-center justify-center rounded-full h-10 w-10 bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all">
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
                    
                    {/* Custom Progress Bar */}
                    <div className="h-4 w-full rounded-full bg-gray-100 overflow-hidden mt-1">
                        <div 
                            className="h-full rounded-full bg-[var(--color-primary)] shadow-[0_0_15px_rgba(var(--color-primary),0.5)] transition-all duration-1000 ease-out" 
                            style={{ width: `${percentage}%` }}
                        >
                            <div className="w-full h-full bg-white/20 animate-pulse"></div>
                        </div>
                    </div>
                    
                    <p className="opacity-50 text-xs text-center italic mt-2">
                        "Read in the name of your Lord who created..." (96:1)
                    </p>
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
                    <h3 className="text-lg font-bold tracking-tight">Reading Statistics</h3>
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
                    <h3 className="text-lg font-bold tracking-tight">Favorite Verses</h3>
                    <button className="text-[var(--color-primary)] text-sm font-bold hover:underline">See All</button>
                </div>
                {[
                    { loc: 'Al-Baqarah, 255', note: 'Ayatul Kursi' },
                    { loc: 'Al-Kahf, 1-10', note: 'Friday Sunnah' }
                ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-[var(--color-card)] p-4 shadow-sm hover:border-[var(--color-primary)]/30 transition-all cursor-pointer group">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/5 text-[var(--color-primary)] group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                            <span className="material-symbols-outlined">bookmark</span>
                        </div>
                        <div className="flex flex-1 flex-col">
                            <p className="text-base font-bold text-[var(--color-text)]">{item.loc}</p>
                            <p className="text-xs opacity-50 font-medium uppercase tracking-wide">{item.note}</p>
                        </div>
                        <button className="size-8 rounded-full flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-gray-100">
                            <span className="material-symbols-outlined text-lg">more_vert</span>
                        </button>
                    </div>
                ))}
            </div>

        </div>
    </div>
  );
};