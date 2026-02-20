
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Task, Article } from '../types';
import { ARTICLES } from '../constants';

// --- DATA HADITS ---
const HADITHS = [
    { text: "Sebaik-baik kalian adalah yang mempelajari Al-Quran dan mengajarkannya.", narrator: "HR. Bukhari" },
    { text: "Puasa adalah perisai yang dengannya seorang hamba membentengi diri dari api neraka.", narrator: "HR. Ahmad" },
    { text: "Barangsiapa mendirikan sholat pada malam Lailatul Qadar karena iman dan mengharap pahala, diampuni dosanya yang telah lalu.", narrator: "HR. Bukhari" },
    { text: "Apabila datang bulan Ramadhan, pintu-pintu surga dibuka, pintu-pintu neraka ditutup dan setan-setan dibelenggu.", narrator: "HR. Bukhari & Muslim" },
    { text: "Saling memberi hadiahlah kalian, niscaya kalian akan saling mencintai.", narrator: "HR. Bukhari" }
];

const StatCard = ({ icon, value, label, color }: { icon: string, value: string | number, label: string, color: string }) => (
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

// --- NEW COMPONENT: ACTIVITY CHART ---
const ActivityChart = ({ history, tasks, primaryColor }: { history: any[], tasks: Task[], primaryColor: string }) => {
    // Helper to get day name (Sen, Sel, etc)
    const getDayName = (dateStr: string) => {
        const date = new Date(dateStr);
        // Fallback for simple names if Intl not fully supported or for custom brief
        const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        return days[date.getDay()];
    };

    // Prepare Data (Last 6 days + Today)
    const data = [];
    const todayCount = tasks.filter(t => t.completed).length;
    
    // Fill previous days from history
    const len = history.length;
    // Take last 6 entries
    const start = Math.max(0, len - 6);
    for (let i = start; i < len; i++) {
        data.push({
            day: getDayName(history[i].date),
            value: history[i].completedTasksCount || 0,
            isToday: false
        });
    }

    // Pad with empty data if history is empty (new user)
    while (data.length < 6) {
        data.unshift({ day: '-', value: 0, isToday: false });
    }

    // Add Today
    data.push({
        day: 'Hari Ini',
        value: todayCount,
        isToday: true
    });

    const maxVal = 12; // Approx max total tasks (Wajib + Sunnah) per day

    return (
        <div className="bg-[var(--color-card)] p-5 rounded-2xl border border-[var(--color-primary)]/10 shadow-sm mt-4">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--color-primary)] bg-[var(--color-primary)]/10 p-1 rounded-md text-sm">bar_chart</span>
                    <h3 className="font-bold text-sm uppercase tracking-wide opacity-80">Grafik Ibadah</h3>
                </div>
                <span className="text-[10px] font-bold opacity-40">7 HARI TERAKHIR</span>
            </div>
            
            <div className="flex items-end justify-between h-32 gap-2">
                {data.map((item, idx) => {
                    const height = Math.min((item.value / maxVal) * 100, 100);
                    // Safe height for very small values to show at least a pixel
                    const displayHeight = item.value > 0 ? `${height}%` : '4px';
                    
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-default">
                            <div className="w-full h-full flex items-end justify-center bg-gray-50/50 dark:bg-white/5 rounded-t-lg relative overflow-hidden">
                                <div 
                                    style={{ height: displayHeight }}
                                    className={`w-full transition-all duration-1000 ease-out rounded-t-md relative ${item.isToday ? 'opacity-100' : 'opacity-40'}`}
                                >
                                    <div 
                                        className="absolute inset-0 w-full h-full"
                                        style={{ backgroundColor: primaryColor }}
                                    ></div>
                                </div>
                                {/* Tooltip Value on Hover/Tap */}
                                {item.value > 0 && (
                                     <div className="absolute bottom-2 text-[10px] font-bold text-[var(--color-text)] opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--color-bg)]/80 px-1 rounded shadow-sm backdrop-blur-sm z-10">
                                        {item.value}
                                    </div>
                                )}
                            </div>
                            <span className={`text-[9px] font-bold uppercase ${item.isToday ? 'text-[var(--color-primary)]' : 'opacity-40'}`}>
                                {item.day}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

// --- NEW COMPONENT: ARTICLE CARD ---
const ArticleCard = ({ article }: { article: Article }) => (
    <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-primary)]/10 overflow-hidden shadow-sm flex flex-col hover:border-[var(--color-primary)]/30 transition-all cursor-pointer">
        <div className="relative h-32 bg-gray-100">
            {article.image && (
                <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
            )}
            <div className="absolute top-2 left-2 bg-[var(--color-primary)] text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                {article.category}
            </div>
        </div>
        <div className="p-4 flex flex-col gap-2">
            <h3 className="font-bold text-base leading-tight line-clamp-2">{article.title}</h3>
            <p className="text-xs opacity-60 line-clamp-2">{article.excerpt}</p>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <span className="text-[10px] font-bold opacity-40">{article.author}</span>
                <span className="text-[10px] font-bold text-[var(--color-primary)] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[10px]">schedule</span>
                    {article.readTime}
                </span>
            </div>
        </div>
    </div>
);

// --- NEW HELPER: SMART INSIGHT GENERATOR ---
const getSmartInsight = (history: any[], tasks: Task[], score: number, quranProgress: any) => {
    // 1. Check Prayer Consistency (Last 3 days)
    const recentHistory = history.slice(-3);
    const avgScore = recentHistory.length > 0 
        ? recentHistory.reduce((acc, h) => acc + (h.score || 0), 0) / recentHistory.length 
        : score;

    // Logic Tree
    if (avgScore === 0 && score === 0) {
        return "Mulai perjalanan ibadahmu hari ini. Bismillah!";
    }
    
    // Check Quran
    const pagesToday = tasks.find(t => t.id === 'tilawah' && t.completed);
    if (!pagesToday && quranProgress.completedJuz.length < 1) {
        return "Jangan lupa tilawah hari ini, walau satu ayat.";
    }

    if (score > avgScore + 20) {
        return "MasyaAllah! Ibadahmu hari ini meningkat pesat.";
    }

    if (score > 80) {
        return "Pertahankan semangatmu! Surga merindukanmu.";
    }

    return "Konsistensi adalah kunci. Sedikit demi sedikit lama-lama menjadi bukit.";
};

export const Dashboard = () => {
  const { theme, score, location, timezone, nextPrayer, hijriDate, tasks, history, quranProgress, t, friendsLeaderboard, setActiveTab } = useApp();
  const { user } = useAuth();
  
  // State for Countdown
  const [timeLeft, setTimeLeft] = useState<string>('--:--:--');
  const [randomHadith, setRandomHadith] = useState(HADITHS[0]);
  const [locationTime, setLocationTime] = useState<string>('');
  
  // Article Rotation Logic (Simple day-based)
  const todayIndex = new Date().getDate() % ARTICLES.length;
  const dailyArticle = ARTICLES[todayIndex];

  const smartInsight = getSmartInsight(history, tasks, score, quranProgress);

  // --- 1. CLOCK & COUNTDOWN LOGIC (TIMEZONE AWARE) ---
  useEffect(() => {
    // Pick random hadith on mount
    setRandomHadith(HADITHS[Math.floor(Math.random() * HADITHS.length)]);

    const timer = setInterval(() => {
        // 1. Get current time in the LOCATION'S timezone
        const nowString = new Date().toLocaleString('en-US', { timeZone: timezone });
        const now = new Date(nowString); // "Now" as a Date object in that zone

        // Update Location Clock Display
        // Use 'en-GB' to ensure HH:MM:SS format (with colons)
        setLocationTime(new Intl.DateTimeFormat('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            timeZone: timezone 
        }).format(new Date()));

        if (!nextPrayer) {
            setTimeLeft("00:00:00");
            return;
        }

        // 2. Parse Next Prayer Time
        const [h, m] = nextPrayer.time.split(':').map(Number);
        
        // Create Target Date based on "Now" year/month/day but prayer hours
        const target = new Date(now); 
        target.setHours(h, m, 0, 0);

        // If target is earlier than now (in that zone), it means the prayer is tomorrow
        if (target.getTime() < now.getTime()) {
             target.setDate(target.getDate() + 1);
        }

        // 3. Calculate Diff
        const diff = target.getTime() - now.getTime();

        if (diff <= 0) {
            setTimeLeft("00:00:00");
        } else {
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);
            
            setTimeLeft(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextPrayer, timezone]);

  // Share Function
  const handleShare = async () => {
      const shareData = {
          title: 'Ramadhan Tracker 2026',
          text: `Saya sudah mencapai Level ${Math.floor((score + history.reduce((acc, h) => acc + (h.score || 0), 0)) / 500) + 1} di Ramadhan Tracker! Total XP: ${score}. Yuk gabung!`,
          url: window.location.href
      };

      if (navigator.share) {
          try {
              await navigator.share(shareData);
          } catch (err) {
              console.log('Error sharing:', err);
          }
      } else {
          // Fallback to clipboard
          navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
          alert('Tautan dan statistik disalin ke clipboard!');
      }
  };

  // --- 2. STATS CALCULATION ---
  const streakCount = history.length + (score > 0 ? 1 : 0);

  // Calculate Level based on Total Score (History Score + Today Score)
  const totalScore = history.reduce((acc, day) => acc + (day.score || 0), 0) + score;
  const currentLevel = Math.floor(totalScore / 500) + 1;
  const nextLevelScore = currentLevel * 500;
  const progressToNextLevel = Math.min(((totalScore % 500) / 500) * 100, 100);

  const completedJuzCount = quranProgress.completedJuz.length;
  const charityToday = tasks.find(t => t.id === 'sedekah' && t.completed) ? 1 : 0;

  const displayPrayer = nextPrayer || { name: 'Selesai', time: '--:--' };

  return (
    <div className="animate-fade-in pb-12">
      {/* Header */}
      <header className="p-6 sticky top-0 z-10 bg-[var(--color-bg)]/80 backdrop-blur-md">
        <div className="flex items-center justify-between">
            <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold tracking-tight">{t('greeting')}, {user?.name.split(' ')[0]}</h1>
            <p className="text-sm font-medium opacity-60">{hijriDate || 'Ramadhan 1447H'}</p>
            </div>
            <div className="size-10 rounded-full border-2 border-[var(--color-primary)]/20 overflow-hidden">
                <img src={user?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Abdullah"} alt="Profile" className="w-full h-full object-cover" />
            </div>
        </div>
      </header>

      <div className="px-6 space-y-6">
        
        {/* Prayer Card */}
        <div className="relative overflow-hidden rounded-2xl bg-[var(--color-primary)] text-white p-6 shadow-xl shadow-[var(--color-primary)]/20 transition-all duration-500 group">
            <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-1">
                    <div className="flex items-center gap-1.5 opacity-90">
                        <span className="material-symbols-outlined text-sm">location_on</span>
                        <span className="text-xs font-semibold tracking-wider uppercase">{location.split(',')[0]}</span>
                    </div>
                    
                    <div className="mt-2">
                        <p className="text-sm font-medium opacity-80 mb-1">{t('next_prayer')} {displayPrayer.name}</p>
                        <h2 className="text-4xl font-mono font-bold tracking-tighter">
                            {timeLeft}
                        </h2>
                    </div>
                    
                    <div className="flex items-center gap-3 mt-3">
                        <div className="inline-flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            <span className="material-symbols-outlined text-xs">alarm</span>
                            <span className="text-xs font-bold">{displayPrayer.time}</span>
                        </div>
                        {/* Live Clock Display */}
                        <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                            <span className="material-symbols-outlined text-xs">schedule</span>
                            <div className="flex flex-col leading-none">
                                <span className="text-xs font-mono opacity-80 font-bold">{locationTime || '--:--:--'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Icon Big */}
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                     <span className="material-symbols-outlined text-3xl">mosque</span>
                </div>
            </div>
            {/* Abstract Decorative Circles */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
        </div>

        {/* Spiritual Progress */}
        <section className="bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-primary)]/10 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="font-bold text-lg">Level Spiritual</h3>
                <button 
                    onClick={handleShare}
                    className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] px-3 py-1.5 bg-[var(--color-primary)]/10 rounded-full hover:bg-[var(--color-primary)] hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined text-xs">share</span>
                    Share
                </button>
            </div>
            
            <div className="flex flex-col items-center relative z-10">
                {/* Custom Circular Progress using conic-gradient */}
                <div 
                  className="relative size-40 rounded-full flex items-center justify-center transition-all duration-1000 shadow-inner bg-[var(--color-bg)]"
                  style={{
                    background: `radial-gradient(closest-side, var(--color-card) 79%, transparent 80% 100%), conic-gradient(var(--color-primary) ${progressToNextLevel}%, var(--color-background) 0)`
                  }}
                >
                    <div className="text-center">
                        <span className="block text-3xl font-extrabold text-[var(--color-text)]">{totalScore}</span>
                        <span className="text-xs font-semibold opacity-50 uppercase tracking-widest">/ {nextLevelScore} XP</span>
                    </div>
                    {/* Level Badge Overlay */}
                    <div className="absolute -bottom-3 bg-[var(--color-primary)] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        Lvl {currentLevel}
                    </div>
                </div>
                
                {/* SMART INSIGHT TEXT */}
                <div className="mt-6 text-center bg-[var(--color-primary)]/5 p-3 rounded-xl w-full border border-[var(--color-primary)]/10">
                    <p className="text-sm font-medium opacity-80 leading-relaxed italic">
                       "{smartInsight}"
                    </p>
                </div>
            </div>
        </section>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
            <StatCard 
                icon="local_fire_department" 
                value={`${streakCount} Hari`} 
                label={t('streak')}
                color={theme.colors.secondary} 
            />
            <StatCard 
                icon="auto_stories" 
                value={`${completedJuzCount} Juz`} 
                label={t('completed')} 
                color={theme.colors.primary} 
            />
            <StatCard 
                icon="volunteer_activism" 
                value={`${charityToday > 0 ? 'Sudah' : 'Belum'}`} 
                label={t('sedekah')} 
                color="#8b5cf6" 
            />
        </div>
        
        {/* FRIENDS LEADERBOARD WIDGET (Replaced Global) */}
        <section className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-primary)]/10 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#D97706] bg-[#D97706]/10 p-1 rounded-md text-sm">groups</span>
                    <h3 className="font-bold text-sm uppercase tracking-wide opacity-80">Circle of Goodness</h3>
                </div>
                <button 
                    onClick={() => setActiveTab('profile')} 
                    className="text-[10px] font-bold text-[var(--color-primary)] flex items-center gap-1 hover:underline"
                >
                    <span className="material-symbols-outlined text-xs">person_add</span>
                    ADD FRIEND
                </button>
            </div>
            
            {friendsLeaderboard.length <= 1 ? (
                 <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-xs opacity-60 mb-2">Belum ada teman di Circle ini.</p>
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className="text-xs font-bold bg-[var(--color-primary)] text-white px-3 py-1.5 rounded-lg shadow-sm"
                    >
                        Undang Teman
                    </button>
                 </div>
            ) : (
                <div className="space-y-3">
                    {friendsLeaderboard.slice(0, 5).map((entry, idx) => (
                        <div key={idx} className={`flex items-center gap-3 p-2 rounded-xl transition-all ${entry.isCurrentUser ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 shadow-sm scale-[1.01]' : 'border border-transparent'}`}>
                             <div className={`size-8 flex items-center justify-center font-bold rounded-lg text-xs ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                 #{idx + 1}
                             </div>
                             <img src={entry.avatar} className="size-8 rounded-full bg-gray-200 object-cover" alt="avatar" />
                             <div className="flex-1 min-w-0">
                                 <p className="text-sm font-bold truncate">{entry.name} {entry.isCurrentUser && '(You)'}</p>
                             </div>
                             <div className="text-right">
                                 <p className="text-xs font-bold text-[var(--color-primary)]">{entry.score} XP</p>
                             </div>
                        </div>
                    ))}
                </div>
            )}
        </section>

        {/* KULTUM HARIAN */}
        <section>
            <div className="flex items-center gap-2 mb-3">
                 <span className="material-symbols-outlined text-[var(--color-primary)] bg-[var(--color-primary)]/10 p-1 rounded-md text-sm">article</span>
                 <h3 className="font-bold text-sm uppercase tracking-wide opacity-80">Kultum Hari Ini</h3>
            </div>
            <ArticleCard article={dailyArticle} />
        </section>

        {/* NEW CHART SECTION */}
        <ActivityChart history={history} tasks={tasks} primaryColor={theme.colors.primary} />

        {/* Daily Hadith */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 border border-[var(--color-primary)]/10">
            <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-sm">format_quote</span>
                <h4 className="text-xs font-bold uppercase tracking-widest opacity-50">Hadits Hari Ini</h4>
            </div>
            <p className="font-medium leading-relaxed italic opacity-80 text-sm">
                "{randomHadith.text}"
            </p>
            <p className="mt-3 text-xs font-bold text-[var(--color-primary)] text-right">— {randomHadith.narrator}</p>
        </div>
      </div>
    </div>
  );
};
