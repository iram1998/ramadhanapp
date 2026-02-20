
import React, { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { getMonthlyPrayerTimes, calculateRamadhanDay } from '../utils';

export const Tracker = () => {
  const { tasks, toggleTask, fastingStatus, setFastingStatus, prayerSchedule, currentRamadhanDay, manualLocation, location, ramadhanStartDate } = useApp();
  
  // View State: 'tracker' or 'schedule'
  const [isScheduleView, setIsScheduleView] = useState(false);
  
  const [monthlySchedule, setMonthlySchedule] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const wajibs = tasks.filter(t => t.category === 'wajib');
  const sunnahs = tasks.filter(t => t.category === 'sunnah');
  
  const completedCount = wajibs.filter(t => t.completed).length;

  const parseDateString = (dateStr: string) => {
      const parts = dateStr.split('-'); 
      if (parts.length === 3) {
          return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateStr;
  }

  const getDayStatus = (dateStr: string) => {
      const targetDate = new Date(dateStr);
      const today = new Date();
      targetDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);

      if (targetDate.getTime() === today.getTime()) return 'today';
      if (targetDate < today) return 'past';
      return 'future';
  };

  useEffect(() => {
    if (isScheduleView) {
        setLoadingSchedule(true);
        const lat = manualLocation ? manualLocation.lat : -6.1702;
        const lon = manualLocation ? manualLocation.lon : 106.8310;
        
        const startDate = new Date(ramadhanStartDate);
        const startMonth = startDate.getMonth() + 1; // getMonth is 0-indexed
        const startYear = startDate.getFullYear();

        const fetchSchedule = async (latitude: number, longitude: number) => {
            try {
                // Fetch Month 1 (Start of Ramadhan)
                const data1 = await getMonthlyPrayerTimes(latitude, longitude, startMonth, startYear);
                
                // Calculate Next Month for the second half of Ramadhan
                let nextMonth = startMonth + 1;
                let nextYear = startYear;
                if (nextMonth > 12) {
                    nextMonth = 1;
                    nextYear = startYear + 1;
                }

                // Fetch Month 2
                const data2 = await getMonthlyPrayerTimes(latitude, longitude, nextMonth, nextYear);
                
                // Combine data
                setMonthlySchedule([...data1, ...data2]);
            } catch (error) {
                console.error("Failed to load schedule", error);
            } finally {
                setLoadingSchedule(false);
            }
        };
        
        if (!manualLocation && navigator.geolocation) {
             navigator.geolocation.getCurrentPosition(async (pos) => {
                 fetchSchedule(pos.coords.latitude, pos.coords.longitude);
             }, () => {
                 fetchSchedule(-6.1702, 106.8310);
             });
        } else {
             fetchSchedule(lat, lon);
        }
    }
  }, [isScheduleView, ramadhanStartDate, manualLocation]);

  useEffect(() => {
      if (!loadingSchedule && isScheduleView && monthlySchedule.length > 0) {
          setTimeout(() => {
              const todayRow = document.getElementById('row-today');
              if (todayRow) {
                  todayRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
          }, 500);
      }
  }, [loadingSchedule, isScheduleView, monthlySchedule]);

  // --- RENDER: SCHEDULE FULL PAGE VIEW ---
  if (isScheduleView) {
      return (
        <div className="animate-fade-in bg-[var(--color-bg)] min-h-screen pb-24">
            {/* Sticky Header */}
            <header className="sticky top-0 z-20 bg-[var(--color-bg)]/95 backdrop-blur-md border-b border-[var(--color-primary)]/10 shadow-sm">
                <div className="px-4 py-4 flex items-center gap-3">
                    <button 
                        onClick={() => setIsScheduleView(false)} 
                        className="p-2 -ml-2 rounded-full hover:bg-[var(--color-primary)]/10 text-[var(--color-text)] transition-colors"
                    >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                    </button>
                    <div>
                        <h2 className="text-lg font-bold leading-tight">Jadwal Imsakiyah</h2>
                        <div className="flex items-center gap-1.5 opacity-60">
                            <span className="material-symbols-outlined text-[10px]">location_on</span>
                            <span className="text-xs truncate max-w-[200px]">{location}</span>
                        </div>
                    </div>
                </div>
                {/* Table Header (Sticky below main header) */}
                <div className="grid grid-cols-5 text-center text-[10px] font-bold uppercase tracking-wider py-3 bg-[var(--color-primary)]/5 text-[var(--color-primary)] border-y border-[var(--color-primary)]/10">
                    <div>Ramadhan</div>
                    <div>Tanggal</div>
                    <div>Imsak</div>
                    <div>Subuh</div>
                    <div>Maghrib</div>
                </div>
            </header>

            {/* Scrollable Content */}
            <div className="p-0 overflow-x-auto">
                {loadingSchedule ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4 mt-8">
                        <div className="size-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm opacity-50">Memuat jadwal...</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 min-w-[320px]">
                        {monthlySchedule.map((day, idx) => {
                            const dateStr = parseDateString(day.date.gregorian.date); 
                            const rDay = calculateRamadhanDay(ramadhanStartDate, dateStr);
                            const status = getDayStatus(dateStr);
                            
                            // Filter: Only show Ramadhan Days 1 to 30
                            if (rDay < 1 || rDay > 30) return null;

                            let rowClass = '';
                            let textClass = 'text-[var(--color-text)]';
                            
                            if (status === 'past') {
                                rowClass = 'bg-gray-50 dark:bg-white/5';
                                textClass = 'opacity-40 line-through decoration-gray-300';
                            } else if (status === 'today') {
                                rowClass = 'bg-[var(--color-primary)]/10 relative';
                                textClass = 'font-bold text-[var(--color-text)]';
                            } else {
                                rowClass = 'active:bg-gray-50';
                            }

                            return (
                                <div 
                                    key={idx} 
                                    id={status === 'today' ? 'row-today' : undefined} 
                                    className={`grid grid-cols-5 text-center py-4 text-sm items-center transition-colors ${rowClass}`}
                                >
                                    {status === 'today' && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-primary)]"></div>
                                    )}
                                    
                                    <div className={`${status === 'today' ? 'text-[var(--color-primary)] font-extrabold' : textClass} ${status === 'past' ? '' : 'font-semibold'}`}>
                                        Ke-{rDay}
                                    </div>
                                    <div className={`text-xs flex flex-col items-center justify-center ${status === 'past' ? 'opacity-40' : 'opacity-70'}`}>
                                        <span className="font-bold">{day.date.gregorian.day}</span>
                                        <span className="text-[10px] uppercase">{day.date.gregorian.month.en.slice(0,3)}</span>
                                    </div>
                                    <div className={`font-mono ${textClass}`}>
                                        {day.timings.Imsak.split(' ')[0]}
                                    </div>
                                    <div className={`font-mono ${textClass}`}>
                                        {day.timings.Fajr.split(' ')[0]}
                                    </div>
                                    <div className={`font-mono ${status === 'today' ? 'text-[var(--color-secondary)] font-extrabold text-base' : textClass}`}>
                                        {day.timings.Maghrib.split(' ')[0]}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {/* Empty State */}
                         {monthlySchedule.length === 0 && (
                            <div className="p-12 text-center opacity-50 flex flex-col items-center">
                                <span className="material-symbols-outlined text-4xl mb-2 opacity-50">event_busy</span>
                                <p>Tidak ada data Ramadhan.</p>
                                <p className="text-xs mt-1">Cek koneksi internet atau pengaturan tanggal.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      );
  }

  // --- RENDER: MAIN TRACKER VIEW ---
  return (
    <div className="animate-fade-in pb-12">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[var(--color-bg)]/80 backdrop-blur-md px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
                <button className="p-2 -ml-2 rounded-full hover:bg-[var(--color-primary)]/10 transition-colors">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Daily Ibadah</h1>
                <button 
                    onClick={() => setIsScheduleView(true)}
                    className="p-2 -mr-2 rounded-full hover:bg-[var(--color-primary)]/10 transition-colors text-[var(--color-primary)]"
                >
                    <span className="material-symbols-outlined text-2xl">calendar_month</span>
                </button>
            </div>
            
            {/* Progress Card */}
            <div className="bg-[var(--color-card)] rounded-xl p-4 shadow-sm border border-[var(--color-primary)]/10 flex items-center gap-4">
                <div className="relative size-16 flex items-center justify-center">
                    <svg className="size-16 transform -rotate-90">
                        <circle className="text-[var(--color-primary)]/10" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="6"></circle>
                        <circle 
                            className="text-[var(--color-primary)] transition-all duration-1000 ease-out" 
                            cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" 
                            strokeDasharray="175.9" 
                            strokeDashoffset={175.9 - (175.9 * (completedCount / 5))} 
                            strokeWidth="6"
                        ></circle>
                    </svg>
                    <span className="absolute text-sm font-bold">{Math.round((completedCount/5)*100)}%</span>
                </div>
                <div>
                    <p className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wider">
                        {currentRamadhanDay > 0 ? `Ramadhan Day ${currentRamadhanDay}` : 'Menuju Ramadhan'}
                    </p>
                    <h2 className="text-lg font-bold">Keep it up!</h2>
                    <p className="text-xs opacity-50">{5 - completedCount} obligatory prayers left</p>
                </div>
            </div>
        </header>

        <main className="px-6 space-y-6">
            {/* Fasting Schedule & Status */}
            <section className="space-y-4">
                 <div className="flex justify-between items-end px-1">
                    <h3 className="text-sm font-bold opacity-50 uppercase tracking-widest">Jadwal Puasa</h3>
                    <button 
                        onClick={() => setIsScheduleView(true)} 
                        className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                    >
                        Lihat Imsakiyah
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>
                
                {/* Jadwal Imsak & Maghrib Card */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-primary)]/10 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1 opacity-60">
                            <span className="material-symbols-outlined text-sm">wb_twilight</span>
                            <span className="text-xs font-bold uppercase">Mulai (Imsak)</span>
                        </div>
                        <p className="text-2xl font-extrabold text-[var(--color-primary)]">{prayerSchedule.imsak || '--:--'}</p>
                        <p className="text-[10px] opacity-40">Subuh: {prayerSchedule.subuh || '--:--'}</p>
                    </div>
                    <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-primary)]/10 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1 opacity-60">
                             <span className="material-symbols-outlined text-sm">restaurant</span>
                            <span className="text-xs font-bold uppercase">Berbuka</span>
                        </div>
                         <p className="text-2xl font-extrabold text-[var(--color-secondary)]">{prayerSchedule.maghrib || '--:--'}</p>
                         <p className="text-[10px] opacity-40">Maghrib Time</p>
                    </div>
                </div>

                {/* Status Toggle */}
                <div className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--color-primary)]/5 p-1 border border-[var(--color-primary)]/10">
                    {['Puasa', 'Tidak', 'Uzur'].map((status) => (
                        <label key={status} className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-semibold transition-all duration-300 ${fastingStatus === status.toLowerCase() ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--color-text)] opacity-60 hover:opacity-100'}`}>
                            <span>{status}</span>
                            <input 
                                type="radio" 
                                name="fasting-status" 
                                className="hidden" 
                                checked={fastingStatus === status.toLowerCase()} 
                                onChange={() => setFastingStatus(status.toLowerCase() as any)}
                            />
                        </label>
                    ))}
                </div>
            </section>

            {/* Sholat 5 Waktu */}
            <section>
                <div className="flex justify-between items-end mb-3 px-1">
                    <h3 className="text-sm font-bold opacity-50 uppercase tracking-widest">Sholat 5 Waktu</h3>
                    <span className="text-xs font-medium text-[var(--color-primary)]">{completedCount}/5 Completed</span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {wajibs.map((task) => {
                        const time = prayerSchedule[task.id] || '--:--';
                        return (
                            <label key={task.id} className={`flex items-center p-3 bg-[var(--color-card)] rounded-xl border transition-all cursor-pointer group ${task.completed ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30'}`}>
                                <div className={`size-12 rounded-lg flex items-center justify-center transition-colors mr-4 ${task.completed ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                                    <span className="material-symbols-outlined">{task.icon}</span>
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-base">{task.label}</span>
                                        <span className={`font-mono font-semibold text-sm ${task.completed ? 'text-[var(--color-primary)]' : 'opacity-50'}`}>{time}</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full bg-[var(--color-primary)] transition-all duration-500 ${task.completed ? 'w-full' : 'w-0'}`}></div>
                                    </div>
                                </div>

                                <div className={`ml-4 size-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--color-primary)]/30'}`}>
                                    {task.completed && <span className="material-symbols-outlined text-white text-sm font-bold">check</span>}
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden"
                                    checked={task.completed}
                                    onChange={() => toggleTask(task.id)}
                                />
                            </label>
                        );
                    })}
                </div>
            </section>

            {/* Sunnah Prayers */}
            <section>
                <h3 className="text-sm font-bold opacity-50 uppercase tracking-widest mb-3 px-1">Sunnah Prayers</h3>
                <div className="space-y-2">
                    {sunnahs.map((task) => {
                         // Only show time for Dhuha
                         const time = task.id === 'dhuha' ? prayerSchedule['dhuha'] : null;
                         return (
                            <label key={task.id} className={`flex items-center justify-between p-4 bg-[var(--color-card)] rounded-xl border transition-all cursor-pointer ${task.completed ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-primary)]/10'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`size-10 rounded-lg flex items-center justify-center transition-colors ${task.completed ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                                        <span className="material-symbols-outlined">{task.icon}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-semibold">{task.label}</span>
                                        {time && <span className="text-xs opacity-50 font-mono">Starts {time}</span>}
                                    </div>
                                </div>
                                <div className={`size-6 rounded-md border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--color-primary)]/30'}`}>
                                    {task.completed && <span className="material-symbols-outlined text-white text-sm font-bold">check</span>}
                                </div>
                                <input 
                                    type="checkbox" 
                                    className="hidden"
                                    checked={task.completed}
                                    onChange={() => toggleTask(task.id)}
                                />
                            </label>
                         );
                    })}
                </div>
            </section>

             {/* Charity / Sedekah */}
             <section>
                <h3 className="text-sm font-bold opacity-50 uppercase tracking-widest mb-3 px-1">Charity</h3>
                {tasks.filter(t => t.category === 'charity').map(task => (
                    <label key={task.id} className="flex items-center gap-4 p-4 bg-[var(--color-secondary)]/10 rounded-xl border border-[var(--color-secondary)]/20 cursor-pointer hover:bg-[var(--color-secondary)]/20 transition-colors">
                        <div className="size-12 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-white shadow-lg shadow-[var(--color-secondary)]/30">
                            <span className="material-symbols-outlined">volunteer_activism</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-bold">Sedekah Hari Ini</p>
                            <p className="text-xs opacity-60">Spread kindness today</p>
                        </div>
                        <div className={`size-7 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-[var(--color-secondary)] border-[var(--color-secondary)]' : 'border-[var(--color-secondary)]'}`}>
                             {task.completed && <span className="material-symbols-outlined text-white text-sm">check</span>}
                        </div>
                        <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={task.completed} 
                            onChange={() => toggleTask(task.id)}
                        />
                    </label>
                ))}
            </section>
        </main>
    </div>
  );
};
