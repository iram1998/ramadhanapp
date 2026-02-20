
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { getMonthlyPrayerTimes, calculateRamadhanDay, calculateQiblaDirection } from '../utils';

// --- SUB-COMPONENTS (TOOLS) ---

const ZakatCalculator = ({ onClose }: { onClose: () => void }) => {
    const [tab, setTab] = useState<'fitrah' | 'maal'>('maal');
    const [assets, setAssets] = useState('');
    const [debts, setDebts] = useState('');
    const [goldPrice, setGoldPrice] = useState('1100000'); // Est. 1.1jt/gram
    const [ricePrice, setRicePrice] = useState('15000'); // Est. 15rb/liter
    const [familyMembers, setFamilyMembers] = useState('1');

    // Nisab Emas 85 gram
    const nisabMaal = 85 * parseInt(goldPrice || '0');
    const totalWealth = (parseInt(assets || '0') - parseInt(debts || '0'));
    const zakatMaalAmount = totalWealth >= nisabMaal ? totalWealth * 0.025 : 0;
    
    // Zakat Fitrah (3.5 Liter or 2.5 Kg)
    const zakatFitrahAmount = parseInt(familyMembers || '0') * (3.5 * parseInt(ricePrice || '0'));

    const formatRupiah = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-[var(--color-card)] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[var(--color-bg)]">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <span className="material-symbols-outlined text-[var(--color-primary)]">calculate</span>
                        Kalkulator Zakat
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <div className="flex p-2 bg-[var(--color-bg)]">
                     <button onClick={() => setTab('maal')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'maal' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-500'}`}>Zakat Maal</button>
                     <button onClick={() => setTab('fitrah')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${tab === 'fitrah' ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-gray-500'}`}>Zakat Fitrah</button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4 bg-[var(--color-card)]">
                    {tab === 'maal' ? (
                        <>
                            <div className="p-3 bg-yellow-50 text-yellow-800 rounded-xl text-xs border border-yellow-200">
                                <span className="font-bold">Nisab:</span> {formatRupiah(nisabMaal)} (Setara 85g Emas).<br/>
                                Jika total harta bersih mencapai nisab dan telah berlalu 1 tahun (Haul), wajib dikeluarkan 2.5%.
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold uppercase opacity-50 mb-1 block">Total Harta (Tabungan/Investasi)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                                    <input type="number" value={assets} onChange={e => setAssets(e.target.value)} className="w-full pl-10 p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="0" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase opacity-50 mb-1 block">Hutang Jatuh Tempo</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                                    <input type="number" value={debts} onChange={e => setDebts(e.target.value)} className="w-full pl-10 p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="0" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase opacity-50 mb-1 block">Harga Emas (per gram)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                                    <input type="number" value={goldPrice} onChange={e => setGoldPrice(e.target.value)} className="w-full pl-10 p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="1100000" />
                                </div>
                            </div>

                            <div className="mt-6 p-4 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-center">
                                <p className="text-sm font-bold opacity-60 uppercase mb-1">Zakat yang harus dikeluarkan</p>
                                <p className={`text-2xl font-extrabold ${zakatMaalAmount > 0 ? 'text-[var(--color-primary)]' : 'text-gray-400'}`}>
                                    {formatRupiah(zakatMaalAmount)}
                                </p>
                                {totalWealth < nisabMaal && (
                                    <p className="text-xs text-red-500 mt-2 font-bold">Belum mencapai Nisab</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                             <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-xs border border-blue-200">
                                Zakat Fitrah wajib bagi setiap jiwa, dibayarkan sebelum sholat Idul Fitri. Setara 3.5 Liter / 2.5 Kg makanan pokok.
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase opacity-50 mb-1 block">Jumlah Anggota Keluarga</label>
                                <input type="number" value={familyMembers} onChange={e => setFamilyMembers(e.target.value)} className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="1" />
                            </div>
                            <div>
                                <label className="text-xs font-bold uppercase opacity-50 mb-1 block">Harga Beras (per Liter)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-gray-400">Rp</span>
                                    <input type="number" value={ricePrice} onChange={e => setRicePrice(e.target.value)} className="w-full pl-10 p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-primary)]" placeholder="15000" />
                                </div>
                            </div>

                             <div className="mt-6 p-4 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-center">
                                <p className="text-sm font-bold opacity-60 uppercase mb-1">Total Zakat Fitrah</p>
                                <p className="text-2xl font-extrabold text-[var(--color-primary)]">
                                    {formatRupiah(zakatFitrahAmount)}
                                </p>
                            </div>
                        </>
                    )}
                </div>
             </div>
        </div>
    );
};

const QiblaFinder = ({ onClose, lat, lon }: { onClose: () => void, lat: number, lon: number }) => {
    const [alpha, setAlpha] = useState<number | null>(null); // Device heading (0-360)
    const [permissionGranted, setPermissionGranted] = useState(false);
    
    // Calculate Qibla angle from North
    const qiblaBearing = calculateQiblaDirection(lat, lon);
    
    // Calculate rotation needed for the arrow
    // Arrow points to Qibla.
    // If phone faces North (alpha=0), arrow should rotate 'qiblaBearing' deg.
    // If phone faces East (alpha=90), arrow should rotate 'qiblaBearing - 90'.
    const arrowRotation = alpha !== null ? (qiblaBearing - alpha) : qiblaBearing;

    useEffect(() => {
        // Check if device orientation is supported without permission (Android/Desktop)
        if (window.DeviceOrientationEvent && !(typeof (window.DeviceOrientationEvent as any).requestPermission === 'function')) {
             setPermissionGranted(true);
             window.addEventListener('deviceorientation', handleOrientation);
        }
        
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, []);

    const handleOrientation = (e: DeviceOrientationEvent) => {
        // alpha: rotation around z-axis (compass direction)
        // webkitCompassHeading is for iOS
        let heading = 0;
        if ((e as any).webkitCompassHeading) {
            heading = (e as any).webkitCompassHeading;
        } else if (e.alpha !== null) {
            heading = 360 - e.alpha; // Android usually runs counter-clockwise for alpha
        }
        setAlpha(heading);
    };

    const requestAccess = async () => {
        if (typeof (window.DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const response = await (window.DeviceOrientationEvent as any).requestPermission();
                if (response === 'granted') {
                    setPermissionGranted(true);
                    window.addEventListener('deviceorientation', handleOrientation);
                } else {
                    alert('Izin akses sensor ditolak.');
                }
            } catch (error) {
                console.error(error);
            }
        } else {
            setPermissionGranted(true); // Should have been handled in useEffect, but just in case
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in text-white">
            <div className="w-full max-w-sm flex flex-col items-center text-center relative">
                 <button onClick={onClose} className="absolute top-0 right-0 p-2 bg-white/10 rounded-full hover:bg-white/20">
                    <span className="material-symbols-outlined">close</span>
                </button>

                <h2 className="text-2xl font-bold mb-1">Arah Kiblat</h2>
                <p className="text-sm opacity-60 mb-8">Ka'bah berada di {Math.round(qiblaBearing)}° dari Utara.</p>
                
                {!permissionGranted ? (
                    <div className="bg-white/10 p-6 rounded-2xl border border-white/20">
                        <span className="material-symbols-outlined text-4xl mb-2 opacity-50">explore_off</span>
                        <p className="mb-4 text-sm">Izin kompas diperlukan untuk fitur ini (iOS/Mobile).</p>
                        <button onClick={requestAccess} className="bg-[var(--color-primary)] px-6 py-2 rounded-full font-bold shadow-lg">
                            Izinkan Kompas
                        </button>
                    </div>
                ) : (
                    <div className="relative size-64 flex items-center justify-center">
                        {/* Compass Rose Background */}
                        <div 
                            className="absolute inset-0 border-4 border-white/20 rounded-full transition-transform duration-200 ease-out flex items-center justify-center"
                             style={{ transform: `rotate(${-alpha!}deg)` }}
                        >
                             <div className="absolute top-2 text-xs font-bold text-red-400">N</div>
                             <div className="absolute bottom-2 text-xs font-bold opacity-50">S</div>
                             <div className="absolute right-4 text-xs font-bold opacity-50">E</div>
                             <div className="absolute left-4 text-xs font-bold opacity-50">W</div>
                             {/* Marks */}
                             <div className="w-1 h-3 bg-white/20 absolute top-0"></div>
                             <div className="w-1 h-3 bg-white/20 absolute bottom-0"></div>
                             <div className="w-3 h-1 bg-white/20 absolute right-0"></div>
                             <div className="w-3 h-1 bg-white/20 absolute left-0"></div>
                        </div>

                        {/* Qibla Pointer (Green Arrow) */}
                        {/* This needs to point to Qibla relative to North */}
                        <div 
                             className="absolute w-1 h-32 origin-bottom transition-transform duration-300 ease-out"
                             style={{ 
                                 transform: `rotate(${arrowRotation}deg)`, 
                                 bottom: '50%' 
                             }}
                        >
                            <div className="w-full h-full flex flex-col items-center">
                                <div className="size-12 -mt-6">
                                    <span className="material-symbols-outlined text-4xl text-[var(--color-primary)] drop-shadow-[0_0_10px_rgba(5,150,105,0.8)]" style={{ transform: 'rotate(-45deg)' }}>navigation</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Kaaba Icon Fixed for visualization relative to arrow? No, arrow moves. */}
                        
                        <div className="absolute text-[10px] bottom-[-40px] opacity-50">
                            Pastikan HP datar. Jauhkan dari magnet/logam.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};


export const Tracker = () => {
  const { 
      tasks, 
      toggleTask, 
      fastingStatus, 
      setFastingStatus, 
      prayerSchedule, 
      currentRamadhanDay, 
      manualLocation, 
      location, 
      ramadhanStartDate,
      history,
      updateHistoryTask,
      updateHistoryFasting,
      timezone 
  } = useApp();
  
  // View State: 'tracker' or 'schedule'
  const [isScheduleView, setIsScheduleView] = useState(false);
  const [viewDate, setViewDate] = useState<string>(''); // Default empty = today
  
  // Tools Modal State
  const [activeTool, setActiveTool] = useState<'zakat' | 'qibla' | null>(null);

  const [monthlySchedule, setMonthlySchedule] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Initialize ViewDate to Today
  useEffect(() => {
      const today = new Date().toISOString().split('T')[0];
      setViewDate(today);
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = viewDate === todayStr;

  // --- DERIVE DATA BASED ON VIEW DATE ---
  // If Today: use Context main state. If History: find in history array or default.
  
  let displayedTasks = tasks;
  let displayedFasting = fastingStatus;
  let displayedRamadhanDay = currentRamadhanDay;

  if (!isToday && viewDate) {
      const historyEntry = history.find(h => h.date === viewDate);
      
      // Reconstruct tasks state from history
      displayedTasks = tasks.map(t => ({
          ...t,
          completed: historyEntry?.completedTaskIds?.includes(t.id) || false
      }));

      displayedFasting = historyEntry?.fastingStatus || 'tidak';
      displayedRamadhanDay = calculateRamadhanDay(ramadhanStartDate, viewDate);
  }

  // Derived counts
  const wajibs = displayedTasks.filter(t => t.category === 'wajib');
  const sunnahs = displayedTasks.filter(t => t.category === 'sunnah');
  const completedCount = wajibs.filter(t => t.completed).length;

  // --- DATE NAVIGATION HANDLERS ---
  const changeDate = (offset: number) => {
      const d = new Date(viewDate);
      d.setDate(d.getDate() + offset);
      // Prevent going into future
      const newDateStr = d.toISOString().split('T')[0];
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      
      if (d <= now) {
          setViewDate(newDateStr);
      }
  };

  const handleToggleTask = (id: string) => {
      if (isToday) {
          toggleTask(id);
      } else {
          updateHistoryTask(viewDate, id);
      }
  };

  const handleFastingChange = (status: 'puasa' | 'tidak' | 'uzur') => {
      if (isToday) {
          setFastingStatus(status);
      } else {
          updateHistoryFasting(viewDate, status);
      }
  };

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
            <div className="flex items-center justify-between mb-4">
                <button className="p-2 -ml-2 rounded-full hover:bg-[var(--color-primary)]/10 transition-colors">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold tracking-tight">Daily Ibadah</h1>
                </div>
                <button 
                    onClick={() => setIsScheduleView(true)}
                    className="p-2 -mr-2 rounded-full hover:bg-[var(--color-primary)]/10 transition-colors text-[var(--color-primary)]"
                >
                    <span className="material-symbols-outlined text-2xl">calendar_month</span>
                </button>
            </div>

            {/* Date Navigator */}
            <div className="flex items-center justify-between bg-[var(--color-card)] rounded-full p-1 border border-[var(--color-primary)]/10 mb-6 shadow-sm">
                <button onClick={() => changeDate(-1)} className="p-2 hover:bg-[var(--color-primary)]/10 rounded-full transition-colors">
                    <span className="material-symbols-outlined text-base opacity-60">chevron_left</span>
                </button>
                <div className="text-center">
                    <span className="block text-xs font-bold uppercase tracking-wider opacity-50">
                        {isToday ? 'Hari Ini' : 'Mencatat'}
                    </span>
                    <span className="block text-sm font-bold text-[var(--color-primary)]">
                        {new Date(viewDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                </div>
                <button 
                    onClick={() => changeDate(1)} 
                    disabled={isToday}
                    className={`p-2 rounded-full transition-colors ${isToday ? 'opacity-20 cursor-not-allowed' : 'hover:bg-[var(--color-primary)]/10'}`}
                >
                    <span className="material-symbols-outlined text-base opacity-60">chevron_right</span>
                </button>
            </div>
            
            {/* Progress Card */}
            <div className={`rounded-xl p-4 shadow-sm border flex items-center gap-4 transition-colors ${!isToday ? 'bg-orange-50 border-orange-200' : 'bg-[var(--color-card)] border-[var(--color-primary)]/10'}`}>
                <div className="relative size-16 flex items-center justify-center">
                    <svg className="size-16 transform -rotate-90">
                        <circle className={`${!isToday ? 'text-orange-200' : 'text-[var(--color-primary)]/10'}`} cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="6"></circle>
                        <circle 
                            className={`${!isToday ? 'text-orange-500' : 'text-[var(--color-primary)]'} transition-all duration-1000 ease-out`} 
                            cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" 
                            strokeDasharray="175.9" 
                            strokeDashoffset={175.9 - (175.9 * (completedCount / 5))} 
                            strokeWidth="6"
                        ></circle>
                    </svg>
                    <span className="absolute text-sm font-bold">{Math.round((completedCount/5)*100)}%</span>
                </div>
                <div>
                    <p className={`text-xs font-semibold uppercase tracking-wider ${!isToday ? 'text-orange-600' : 'text-[var(--color-primary)]'}`}>
                        {displayedRamadhanDay > 0 ? `Ramadhan Day ${displayedRamadhanDay}` : 'Menuju Ramadhan'}
                    </p>
                    <h2 className="text-lg font-bold">
                        {completedCount === 5 ? 'MasyaAllah!' : !isToday ? 'Past Data' : 'Keep it up!'}
                    </h2>
                    <p className="text-xs opacity-50">{5 - completedCount} obligatory prayers left</p>
                </div>
            </div>
        </header>

        <main className="px-6 space-y-6">
            
            {/* NEW: TOOL BUTTONS (Kiblat & Zakat) */}
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => setActiveTool('qibla')}
                    className="flex items-center justify-between p-4 bg-[var(--color-card)] border border-[var(--color-primary)]/10 rounded-xl shadow-sm hover:bg-[var(--color-primary)]/5 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center">
                             <span className="material-symbols-outlined">explore</span>
                        </div>
                        <div className="text-left">
                            <span className="block font-bold text-sm">Arah Kiblat</span>
                            <span className="block text-[10px] opacity-60">Kompas Digital</span>
                        </div>
                    </div>
                </button>
                <button 
                    onClick={() => setActiveTool('zakat')}
                    className="flex items-center justify-between p-4 bg-[var(--color-card)] border border-[var(--color-primary)]/10 rounded-xl shadow-sm hover:bg-[var(--color-primary)]/5 transition-colors group"
                >
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-lg bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] flex items-center justify-center">
                             <span className="material-symbols-outlined">calculate</span>
                        </div>
                         <div className="text-left">
                            <span className="block font-bold text-sm">Kalkulator</span>
                            <span className="block text-[10px] opacity-60">Hitung Zakat</span>
                        </div>
                    </div>
                </button>
            </div>

            {/* Backdate Notice */}
            {!isToday && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-3 rounded-xl flex items-start gap-3 text-xs">
                     <span className="material-symbols-outlined text-base mt-0.5">history</span>
                     <div>
                         <span className="font-bold block mb-0.5">Mode Edit Histori</span>
                         Anda sedang mengubah data untuk tanggal lampau. Perubahan akan disimpan otomatis.
                     </div>
                </div>
            )}

            {/* Fasting Schedule & Status */}
            <section className="space-y-4">
                 <div className="flex justify-between items-center px-1">
                    <h3 className="text-sm font-bold opacity-50 uppercase tracking-widest">Jadwal Puasa</h3>
                    <button 
                        onClick={() => setIsScheduleView(true)} 
                        className="text-xs font-bold text-[var(--color-primary)] hover:underline flex items-center gap-1"
                    >
                        Lihat Imsakiyah
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                </div>

                {/* IMSAK & MAGHRIB CARDS (UPDATED LAYOUT) */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Imsak Card */}
                    <div className="bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-primary)]/10 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                        <div className="flex items-center gap-2 opacity-60">
                            <span className="material-symbols-outlined text-sm">wb_twilight</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Mulai (Imsak)</span>
                        </div>
                        <p className="text-3xl font-extrabold text-[var(--color-primary)] tracking-tight">
                            {isToday ? (prayerSchedule['imsak'] || '--:--') : '-:-'}
                        </p>
                        <p className="text-xs font-medium opacity-40">
                            Subuh: {isToday ? (prayerSchedule['subuh'] || '--:--') : '-:-'}
                        </p>
                    </div>

                    {/* Berbuka Card */}
                    <div className="bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-primary)]/10 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                        <div className="flex items-center gap-2 opacity-60">
                            <span className="material-symbols-outlined text-sm">restaurant</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider">Berbuka</span>
                        </div>
                        <p className="text-3xl font-extrabold text-[#D97706] tracking-tight">
                            {isToday ? (prayerSchedule['maghrib'] || '--:--') : '-:-'}
                        </p>
                        <p className="text-xs font-medium opacity-40">
                            Maghrib Time
                        </p>
                    </div>
                </div>
                
                {/* Status Toggle */}
                <div className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--color-primary)]/5 p-1 border border-[var(--color-primary)]/10">
                    {['Puasa', 'Tidak', 'Uzur'].map((status) => (
                        <label key={status} className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-semibold transition-all duration-300 ${displayedFasting === status.toLowerCase() ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--color-text)] opacity-60 hover:opacity-100'}`}>
                            <span>{status}</span>
                            <input 
                                type="radio" 
                                name="fasting-status" 
                                className="hidden" 
                                checked={displayedFasting === status.toLowerCase()} 
                                onChange={() => handleFastingChange(status.toLowerCase() as any)}
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
                        const time = isToday ? (prayerSchedule[task.id] || '--:--') : '';
                        return (
                            <label key={task.id} className={`flex items-center p-3 bg-[var(--color-card)] rounded-xl border transition-all cursor-pointer group ${task.completed ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-primary)]/10 hover:border-[var(--color-primary)]/30'}`}>
                                <div className={`size-12 rounded-lg flex items-center justify-center transition-colors mr-4 ${task.completed ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                                    <span className="material-symbols-outlined">{task.icon}</span>
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-base">{task.label}</span>
                                        {isToday && <span className={`font-mono font-semibold text-sm ${task.completed ? 'text-[var(--color-primary)]' : 'opacity-50'}`}>{time}</span>}
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
                                    onChange={() => handleToggleTask(task.id)}
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
                         const time = (isToday && task.id === 'dhuha') ? prayerSchedule['dhuha'] : null;
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
                                    onChange={() => handleToggleTask(task.id)}
                                />
                            </label>
                         );
                    })}
                </div>
            </section>

             {/* Charity / Sedekah */}
             <section>
                <h3 className="text-sm font-bold opacity-50 uppercase tracking-widest mb-3 px-1">Charity</h3>
                {displayedTasks.filter(t => t.category === 'charity').map(task => (
                    <label key={task.id} className="flex items-center gap-4 p-4 bg-[var(--color-secondary)]/10 rounded-xl border border-[var(--color-secondary)]/20 cursor-pointer hover:bg-[var(--color-secondary)]/20 transition-colors">
                        <div className="size-12 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-white shadow-lg shadow-[var(--color-secondary)]/30">
                            <span className="material-symbols-outlined">volunteer_activism</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-bold">Sedekah</p>
                            <p className="text-xs opacity-60">Spread kindness</p>
                        </div>
                        <div className={`size-7 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-[var(--color-secondary)] border-[var(--color-secondary)]' : 'border-[var(--color-secondary)]'}`}>
                             {task.completed && <span className="material-symbols-outlined text-white text-sm">check</span>}
                        </div>
                        <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={task.completed} 
                            onChange={() => handleToggleTask(task.id)}
                        />
                    </label>
                ))}
            </section>
        </main>

        {/* MODALS */}
        {activeTool === 'zakat' && <ZakatCalculator onClose={() => setActiveTool(null)} />}
        {activeTool === 'qibla' && (
            <QiblaFinder 
                onClose={() => setActiveTool(null)} 
                lat={manualLocation?.lat || -6.1702} 
                lon={manualLocation?.lon || 106.8310} 
            />
        )}
    </div>
  );
};
