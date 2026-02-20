
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Theme, Task, DailyProgress, QuranProgress, PrayerTime, HistoryData } from '../types';
import { THEMES, INITIAL_TASKS, TRANSLATIONS, ADZAN_AUDIO_URL } from '../constants';
import { getPrayerTimes, getHijriDate, calculateRamadhanDay } from '../utils';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

interface AppContextType {
  theme: Theme;
  setThemeId: (id: string) => void;
  language: 'id' | 'en';
  setLanguage: (lang: 'id' | 'en') => void;
  t: (key: keyof typeof TRANSLATIONS['id']) => string;
  notificationsEnabled: boolean;
  toggleNotifications: () => Promise<void>;
  audioEnabled: boolean;
  toggleAudio: () => void;
  playTestAudio: () => void;
  stopAudio: () => void;
  isPlaying: boolean;
  tasks: Task[];
  toggleTask: (id: string) => void;
  fastingStatus: 'puasa' | 'tidak' | 'uzur';
  setFastingStatus: (status: 'puasa' | 'tidak' | 'uzur') => void;
  score: number;
  history: HistoryData[];
  quranProgress: QuranProgress;
  updateQuranProgress: (progress: Partial<QuranProgress>) => void;
  pagesReadToday: number;
  setPagesReadToday: (count: number) => void;
  dzikirCounts: Record<string, number>;
  incrementDzikir: (id: string) => void;
  location: string;
  prayerTimes: PrayerTime[];
  prayerSchedule: Record<string, string>; 
  hijriDate: string;
  nextPrayer: PrayerTime | undefined;
  manualLocation: { name: string; lat: number; lon: number } | null;
  setManualLocation: (loc: { name: string; lat: number; lon: number } | null) => void;
  refreshLocation: () => void;
  ramadhanStartDate: string;
  setRamadhanStartDate: (date: string) => void;
  currentRamadhanDay: number;
  isInstallable: boolean;
  installApp: () => void;
  timezone: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  // Settings State
  const [currentThemeId, setCurrentThemeId] = useState<string>('gold-green');
  const [language, setLanguageState] = useState<'id' | 'en'>('id');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Audio Ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Data State
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [fastingStatus, setFastingStatusState] = useState<'puasa' | 'tidak' | 'uzur'>('puasa');
  const [score, setScore] = useState(0); 
  const [history, setHistory] = useState<HistoryData[]>([]);
  const [lastRecordedDate, setLastRecordedDate] = useState<string>('');
  
  // New States
  const [pagesReadToday, setPagesReadTodayState] = useState<number>(0);
  const [dzikirCounts, setDzikirCounts] = useState<Record<string, number>>({});
  const [lastNotificationTime, setLastNotificationTime] = useState<string>('');

  // Prayer Times State
  const [location, setLocation] = useState('Detecting...');
  const [timezone, setTimezone] = useState('Asia/Jakarta');
  const [manualLocation, setManualLocationState] = useState<{ name: string; lat: number; lon: number } | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [prayerSchedule, setPrayerSchedule] = useState<Record<string, string>>({});
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | undefined>(undefined);
  const [hijriDate, setHijriDate] = useState<string>('');

  // Ramadhan Settings
  const [ramadhanStartDate, setRamadhanStartDateState] = useState<string>('2026-02-18');
  
  // UPDATED: Calculate day using Timezone (for "Today" dashboard)
  const currentRamadhanDay = calculateRamadhanDay(ramadhanStartDate, timezone);

  const [quranProgress, setQuranProgress] = useState<QuranProgress>({
    currentJuz: 1,
    currentSurah: "Al-Fatihah",
    currentAyah: 1,
    completedJuz: [],
    startDate: new Date().toISOString().split('T')[0], 
    totalKhatamTarget: 30,
    bookmarks: [] 
  });

  const theme = THEMES.find((t) => t.id === currentThemeId) || THEMES[0];
  const isDemoUser = !user || user.id === 'mock-user-123';

  // --- PWA INSTALLATION LOGIC ---
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  // --- AUDIO INITIALIZATION ---
  useEffect(() => {
    // Init audio object
    audioRef.current = new Audio(ADZAN_AUDIO_URL);
    audioRef.current.onended = () => setIsPlaying(false);
    return () => {
        if(audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    }
  }, []);

  const playTestAudio = () => {
      if (audioRef.current) {
          if (isPlaying) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
              setIsPlaying(false);
          } else {
              audioRef.current.play().then(() => setIsPlaying(true)).catch(e => {
                  console.warn("Audio play blocked", e);
                  alert("Browser memblokir suara otomatis. Silakan interaksi dengan halaman terlebih dahulu.");
              });
          }
      }
  };

  const stopAudio = () => {
      if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
      }
  };

  const toggleAudio = () => {
      const newState = !audioEnabled;
      setAudioEnabled(newState);
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, newState);
  };


  // --- FIRESTORE SYNC ---
  const saveDataToFirestore = async (
      newTasks: Task[], 
      newScore: number, 
      newFasting: string, 
      newTheme: string,
      newQuran: QuranProgress,
      newManualLoc: { name: string; lat: number; lon: number } | null,
      newStartDate: string,
      newHistory: HistoryData[],
      recordDate: string,
      newPages: number,
      newDzikir: Record<string, number>,
      newLang: string,
      newNotif: boolean,
      newAudio: boolean
  ) => {
    if (!user || !db || isDemoUser) return;

    try {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, {
            tasks: newTasks,
            score: newScore,
            fastingStatus: newFasting,
            themeId: newTheme,
            quranProgress: newQuran,
            manualLocation: newManualLoc,
            ramadhanStartDate: newStartDate,
            history: newHistory,
            lastRecordedDate: recordDate,
            pagesReadToday: newPages,
            dzikirCounts: newDzikir,
            language: newLang,
            notificationsEnabled: newNotif,
            audioEnabled: newAudio,
            lastUpdated: new Date().toISOString()
        }, { merge: true });
    } catch (e) {
        console.error("Error saving data:", e);
    }
  };

  // Sync data from Firestore
  useEffect(() => {
    if (!user) return;
    if (!db || user.id === 'mock-user-123') {
        checkDailyReset(INITIAL_TASKS, 0, [], 'puasa', '', 0, {}); 
        return;
    }

    const userRef = doc(db, 'users', user.id);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const fetchedTasks = data.tasks || INITIAL_TASKS;
            const fetchedScore = data.score || 0;
            const fetchedHistory = data.history || [];
            const fetchedFasting = data.fastingStatus || 'puasa';
            const fetchedDate = data.lastRecordedDate || '';
            const fetchedPages = data.pagesReadToday || 0;
            const fetchedDzikir = data.dzikirCounts || {};

            if (data.themeId) setCurrentThemeId(data.themeId);
            if (data.quranProgress) setQuranProgress(data.quranProgress);
            if (data.manualLocation) setManualLocationState(data.manualLocation);
            if (data.ramadhanStartDate) setRamadhanStartDateState(data.ramadhanStartDate);
            if (data.language) setLanguageState(data.language);
            if (data.notificationsEnabled !== undefined) setNotificationsEnabled(data.notificationsEnabled);
            if (data.audioEnabled !== undefined) setAudioEnabled(data.audioEnabled);

            checkDailyReset(fetchedTasks, fetchedScore, fetchedHistory, fetchedFasting, fetchedDate, fetchedPages, fetchedDzikir);

        } else {
            const today = new Date().toISOString().split('T')[0];
            setLastRecordedDate(today);
            saveDataToFirestore(INITIAL_TASKS, 0, 'puasa', 'gold-green', quranProgress, null, '2026-02-18', [], today, 0, {}, 'id', false, false);
        }
    }, (error) => {
        console.error("Firestore listener error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // --- NOTIFICATION & AUDIO LOGIC (UPDATED FOR TIMEZONE) ---
  useEffect(() => {
      // Logic runs every 30 seconds
      if (prayerTimes.length === 0) return;

      const checkInterval = setInterval(() => {
          // Get "Now" in location's timezone
          const nowInZone = new Date().toLocaleString('en-US', { timeZone: timezone, hour12: false });
          // Extract HH:MM
          // Format usually "M/D/YYYY, HH:MM:SS" or similar depending on locale, safer to use format parts or split
          // Let's use Date object from the string
          const zoneDate = new Date(nowInZone);
          const currentHour = String(zoneDate.getHours()).padStart(2, '0');
          const currentMinute = String(zoneDate.getMinutes()).padStart(2, '0');
          const currentTimeStr = `${currentHour}:${currentMinute}`;
          
          if (lastNotificationTime === currentTimeStr) return;

          const match = prayerTimes.find(p => p.time === currentTimeStr);
          if (match) {
               console.log("Prayer time matched:", match.name);
               setLastNotificationTime(currentTimeStr);
               
               // 1. Browser Notification
               if (notificationsEnabled && Notification.permission === 'granted') {
                   new Notification(`Waktu ${match.name} Telah Tiba`, {
                       body: `Selamat menunaikan ibadah sholat ${match.name}.`,
                       icon: '/logo192.png',
                       badge: '/logo192.png'
                   });
               }

               // 2. Play Audio Adzan
               if (audioEnabled && audioRef.current && !isPlaying) {
                   audioRef.current.currentTime = 0;
                   audioRef.current.play()
                     .then(() => setIsPlaying(true))
                     .catch(err => console.error("Auto-play blocked:", err));
               }
          }
      }, 30000); 

      return () => clearInterval(checkInterval);
  }, [notificationsEnabled, audioEnabled, prayerTimes, lastNotificationTime, isPlaying, timezone]);

  // --- DAILY RESET LOGIC WITH GAP FILLING ---
  const checkDailyReset = (
      currentTasks: Task[], 
      currentScore: number, 
      currentHistory: HistoryData[],
      currentFasting: 'puasa' | 'tidak' | 'uzur',
      recordedDate: string,
      currentPages: number,
      currentDzikir: Record<string, number>
  ) => {
      const today = new Date().toISOString().split('T')[0];
      
      if (!recordedDate || recordedDate === today) {
          setTasks(currentTasks);
          setScore(currentScore);
          setHistory(currentHistory);
          setFastingStatusState(currentFasting);
          setPagesReadTodayState(currentPages);
          setDzikirCounts(currentDzikir);
          setLastRecordedDate(today);
          return;
      }

      console.log(`New Day Detected! Last: ${recordedDate}, Today: ${today}`);
      
      const lastDateObj = new Date(recordedDate);
      const todayDateObj = new Date(today);
      const diffTime = Math.abs(todayDateObj.getTime() - lastDateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      let newHistory = [...currentHistory];

      for (let i = 0; i < diffDays; i++) {
          const dateToLog = new Date(lastDateObj);
          dateToLog.setDate(dateToLog.getDate() + i); 
          const dateStr = dateToLog.toISOString().split('T')[0];

          if (i === 0) {
              newHistory.push({
                  date: recordedDate, 
                  score: currentScore,
                  completedTasksCount: currentTasks.filter(t => t.completed).length,
                  fastingStatus: currentFasting,
                  pagesRead: currentPages
              });
          } else {
              newHistory.push({
                  date: dateStr,
                  score: 0,
                  completedTasksCount: 0,
                  fastingStatus: 'tidak',
                  pagesRead: 0
              });
          }
      }

      const resetTasks = INITIAL_TASKS.map(t => ({...t, completed: false}));
      const resetPages = 0;
      const resetDzikir = {};

      setTasks(resetTasks);
      setScore(0);
      setHistory(newHistory);
      setFastingStatusState('puasa');
      setPagesReadTodayState(resetPages);
      setDzikirCounts(resetDzikir);
      setLastRecordedDate(today);

      saveDataToFirestore(resetTasks, 0, 'puasa', currentThemeId, quranProgress, manualLocation, ramadhanStartDate, newHistory, today, resetPages, resetDzikir, language, notificationsEnabled, audioEnabled);
  };

  // --- PRAYER TIMES LOGIC ---
  const fetchPrayers = async (lat: number, long: number, locName?: string) => {
      try {
          const schedule = await getPrayerTimes(lat, long);
          const fullList: PrayerTime[] = [
              { name: 'Imsak', time: schedule.imsak, isNext: false },
              ...schedule.list.map(p => ({
                  name: p.name,
                  time: p.time,
                  isNext: p.isNext
              }))
          ];

          setPrayerTimes(fullList);
          setPrayerSchedule(schedule.times);
          
          if (schedule.next) {
              setNextPrayer({
                  name: schedule.next.name,
                  time: schedule.next.time,
                  isNext: true
              });
          }
          setLocation(locName || schedule.locationName);
          setTimezone(schedule.timezone); // Update Timezone
      } catch (e) {
          console.error("Failed to load prayers:", e);
      }
  };

  useEffect(() => {
    // Update Hijri Date whenever timezone changes
    setHijriDate(getHijriDate(timezone));
    
    if (manualLocation) {
        fetchPrayers(manualLocation.lat, manualLocation.lon, manualLocation.name);
    } else {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => fetchPrayers(position.coords.latitude, position.coords.longitude),
            () => fetchPrayers(-6.1702, 106.8310, "Jakarta (Default)")
          );
        } else {
            fetchPrayers(-6.1702, 106.8310, "Jakarta (Default)");
        }
    }
  }, [manualLocation, timezone]); // Added timezone dep

  const refreshLocation = () => {
       if (manualLocation) {
         fetchPrayers(manualLocation.lat, manualLocation.lon, manualLocation.name);
       } else {
         setLocation("Detecting...");
         navigator.geolocation.getCurrentPosition(
            (pos) => fetchPrayers(pos.coords.latitude, pos.coords.longitude),
            () => fetchPrayers(-6.1702, 106.8310, "Jakarta (Default)")
         );
       }
  };

  // --- ACTIONS ---

  const toggleTask = (id: string) => {
    const newTasks = tasks.map((t) => {
        if (t.id === id) {
          return { ...t, completed: !t.completed };
        }
        return t;
    });
    const newScore = newTasks.reduce((acc, curr) => acc + (curr.completed ? curr.points : 0), 0);
    setTasks(newTasks);
    setScore(newScore);
    saveDataToFirestore(newTasks, newScore, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled);
  };

  const setFastingStatus = (status: 'puasa' | 'tidak' | 'uzur') => {
      setFastingStatusState(status);
      saveDataToFirestore(tasks, score, status, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled);
  };

  const setThemeId = (id: string) => {
    setCurrentThemeId(id);
    saveDataToFirestore(tasks, score, fastingStatus, id, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled);
  };

  const updateQuranProgress = (updates: Partial<QuranProgress>) => {
      const newQuran = { ...quranProgress, ...updates };
      setQuranProgress(newQuran);
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, newQuran, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled);
  };

  const setManualLocation = (loc: { name: string; lat: number; lon: number } | null) => {
      setManualLocationState(loc);
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, loc, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled);
  };

  const setRamadhanStartDate = (date: string) => {
      setRamadhanStartDateState(date);
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, date, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled);
  }

  const setPagesReadToday = (count: number) => {
      setPagesReadTodayState(count);
      
      let newTasks = [...tasks];
      let updated = false;

      if (count >= 10) {
          const tilawahTask = newTasks.find(t => t.id === 'tilawah');
          if (tilawahTask && !tilawahTask.completed) {
              newTasks = newTasks.map(t => t.id === 'tilawah' ? { ...t, completed: true } : t);
              updated = true;
          }
      }

      if (updated) {
           const newScore = newTasks.reduce((acc, curr) => acc + (curr.completed ? curr.points : 0), 0);
           setTasks(newTasks);
           setScore(newScore);
           saveDataToFirestore(newTasks, newScore, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, count, dzikirCounts, language, notificationsEnabled, audioEnabled);
      } else {
           saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, count, dzikirCounts, language, notificationsEnabled, audioEnabled);
      }
  }

  const incrementDzikir = (id: string) => {
      const currentVal = dzikirCounts[id] || 0;
      const newCounts = { ...dzikirCounts, [id]: currentVal + 1 };
      setDzikirCounts(newCounts);
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, newCounts, language, notificationsEnabled, audioEnabled);
  }

  const setLanguage = (lang: 'id' | 'en') => {
      setLanguageState(lang);
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, lang, notificationsEnabled, audioEnabled);
  }

  const t = (key: keyof typeof TRANSLATIONS['id']) => {
      return TRANSLATIONS[language][key] || key;
  }

  const toggleNotifications = async () => {
      if (!notificationsEnabled) {
          if (!("Notification" in window)) {
              alert("Browser ini tidak mendukung notifikasi.");
              return;
          }
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
              setNotificationsEnabled(true);
              new Notification("Ramadhan Tracker", { body: language === 'id' ? "Notifikasi diaktifkan! Kami akan mengingatkan waktu sholat." : "Notifications enabled! We will remind you at prayer times." });
              saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, true, audioEnabled);
          } else {
              alert("Izin notifikasi ditolak. Cek pengaturan browser.");
          }
      } else {
          setNotificationsEnabled(false);
          saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, false, audioEnabled);
      }
  }

  return (
    <AppContext.Provider
      value={{
        theme,
        setThemeId,
        language,
        setLanguage,
        t,
        notificationsEnabled,
        toggleNotifications,
        audioEnabled,
        toggleAudio,
        playTestAudio,
        stopAudio,
        isPlaying,
        tasks,
        toggleTask,
        fastingStatus,
        setFastingStatus,
        score,
        history,
        quranProgress,
        updateQuranProgress,
        pagesReadToday,
        setPagesReadToday,
        dzikirCounts,
        incrementDzikir,
        location,
        prayerTimes,
        prayerSchedule,
        hijriDate,
        nextPrayer,
        manualLocation,
        setManualLocation,
        refreshLocation,
        ramadhanStartDate,
        setRamadhanStartDate,
        currentRamadhanDay,
        isInstallable,
        installApp,
        timezone
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
