import React from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

// Fixed: Defined before usage
const StatCard = ({ icon, value, label, color }: { icon: string, value: string, label: string, color: string }) => (
    <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-primary)]/10 flex flex-col items-center gap-2 shadow-sm transition-transform hover:-translate-y-1 duration-300">
        <div className="p-3 rounded-full bg-opacity-10 text-opacity-100" style={{ backgroundColor: `${color}20`, color: color }}>
            <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <div className="text-center">
            <p className="text-lg font-extrabold">{value}</p>
            <p className="text-[10px] uppercase font-bold opacity-50 tracking-wide">{label}</p>
        </div>
    </div>
);

export const Dashboard = () => {
  const { theme, score, location, nextPrayer, hijriDate, tasks } = useApp();
  const { user } = useAuth();
  
  // Safe fallback if data is still loading
  const displayPrayer = nextPrayer || { name: 'Loading...', time: '--:--' };
  const completedTasks = tasks.filter(t => t.completed).length;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="p-6 sticky top-0 z-10 bg-[var(--color-bg)]/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold tracking-tight">Welcome, {user?.name.split(' ')[0]}</h1>
            <p className="text-sm font-medium opacity-60">{hijriDate || 'Ramadhan 1447H'}</p>
            </div>
            <div className="size-10 rounded-full border-2 border-[var(--color-primary)]/20 overflow-hidden">
                <img src={user?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Abdullah"} alt="Profile" className="w-full h-full object-cover" />
            </div>
        </div>
      </header>

      <div className="px-6 space-y-6">
        
        {/* Prayer Card */}
        <div className="relative overflow-hidden rounded-2xl bg-[var(--color-primary)] text-white p-6 shadow-xl shadow-[var(--color-primary)]/20 transition-all duration-500">
            <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 opacity-90">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        <span className="text-xs font-semibold tracking-wider uppercase">{location}</span>
                    </div>
                    <h2 className="text-4xl font-bold">{displayPrayer.name} <span className="text-2xl font-light opacity-80">{displayPrayer.time}</span></h2>
                    <p className="text-sm font-medium opacity-90">
                        {displayPrayer.name === 'Loading...' ? 'Calculating...' : 'Next Prayer'}
                    </p>
                </div>
                <button className="bg-white/20 hover:bg-white/30 p-2 rounded-lg backdrop-blur-sm transition-colors">
                    <span className="material-symbols-outlined">schedule</span>
                </button>
            </div>
            {/* Abstract Decorative Circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
        </div>

        {/* Spiritual Progress */}
        <section className="bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-primary)]/10 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Spiritual Progress</h3>
                <span className="text-xs font-bold text-[var(--color-primary)] px-2.5 py-1 bg-[var(--color-primary)]/10 rounded-full uppercase tracking-wider">Level 12</span>
            </div>
            
            <div className="flex flex-col items-center">
                {/* Custom Circular Progress using conic-gradient */}
                <div 
                  className="relative size-40 rounded-full flex items-center justify-center transition-all duration-1000"
                  style={{
                    background: `radial-gradient(closest-side, var(--color-card) 79%, transparent 80% 100%), conic-gradient(var(--color-primary) ${Math.min((score / 1000) * 100, 100)}%, var(--color-background) 0)`
                  }}
                >
                    <div className="text-center">
                        <span className="block text-3xl font-extrabold text-[var(--color-text)]">{score}</span>
                        <span className="text-xs font-semibold opacity-50 uppercase tracking-widest">/ 1000 pts</span>
                    </div>
                </div>
                
                <p className="mt-6 text-sm text-center opacity-70 leading-relaxed max-w-[240px]">
                    You're doing great! Complete your <span className="text-[var(--color-primary)] font-bold">Dzuhur</span> to reach today's milestone.
                </p>
            </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
            <StatCard icon="local_fire_department" value="12 Days" label="Streak" color={theme.colors.secondary} />
            <StatCard icon="auto_stories" value="5 Juz" label="Completed" color={theme.colors.primary} />
            <StatCard icon="volunteer_activism" value="15x" label="Sedekah" color="#8b5cf6" />
        </div>

        {/* Daily Hadith */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 border border-[var(--color-primary)]/10">
            <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-sm">format_quote</span>
                <h4 className="text-xs font-bold uppercase tracking-widest opacity-50">Daily Hadith</h4>
            </div>
            <p className="font-medium leading-relaxed italic opacity-80">
                "The best of you are those who learn the Quran and teach it."
            </p>
            <p className="mt-3 text-xs font-bold text-[var(--color-primary)]">— Sahih Bukhari</p>
        </div>
      </div>
    </div>
  );
};