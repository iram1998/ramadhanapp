import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Theme, Task, DailyProgress, QuranProgress, PrayerTime } from '../types';
import { THEMES, INITIAL_TASKS } from '../constants';
import { getPrayerTimes, getHijriDate } from '../utils';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';

interface AppContextType {
  theme: Theme;
  setThemeId: (id: string) => void;
  tasks: Task[];
  toggleTask: (id: string) => void;
  fastingStatus: 'puasa' | 'tidak' | 'uzur';
  setFastingStatus: (status: 'puasa' | 'tidak' | 'uzur') => void;
  score: number;
  quranProgress: QuranProgress;
  updateQuranProgress: (progress: Partial<QuranProgress>) => void;
  location: string;
  prayerTimes: PrayerTime[];
  hijriDate: string;
  nextPrayer: PrayerTime | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  // Theme State
  const [currentThemeId, setCurrentThemeId] = useState<string>('gold-green');
  
  // Data State
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [fastingStatus, setFastingStatusState] = useState<'puasa' | 'tidak' | 'uzur'>('puasa');
  const [score, setScore] = useState(0); 
  const [location, setLocation] = useState('Detecting...');
  
  // Prayer Times State
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [nextPrayer, setNextPrayer] = useState<PrayerTime | undefined>(undefined);
  const [hijriDate, setHijriDate] = useState<string>('');

  const [quranProgress, setQuranProgress] = useState<QuranProgress>({
    currentJuz: 1,
    currentSurah: "Al-Fatihah",
    currentAyah: 1,
    completedJuz: [],
    startDate: new Date().toISOString().split('T')[0], 
    totalKhatamTarget: 30,
  });

  // Derived theme object
  const theme = THEMES.find((t) => t.id === currentThemeId) || THEMES[0];

  const isDemoUser = !user || user.id === 'mock-user-123';

  // --- FIRESTORE SYNC ---
  // Save data whenever critical state changes
  const saveDataToFirestore = async (
      newTasks: Task[], 
      newScore: number, 
      newFasting: string, 
      newTheme: string,
      newQuran: QuranProgress
  ) => {
    // Prevent saving if no user, no DB, or if user is Demo User
    if (!user || !db || isDemoUser) return;

    try {
        const userRef = doc(db, 'users', user.id);
        await setDoc(userRef, {
            tasks: newTasks,
            score: newScore,
            fastingStatus: newFasting,
            themeId: newTheme,
            quranProgress: newQuran,
            lastUpdated: new Date().toISOString()
        }, { merge: true });
    } catch (e) {
        console.error("Error saving data:", e);
    }
  };

  // Load data on user login
  useEffect(() => {
    if (!user) return;
    
    // Skip Firestore listener for demo user
    if (!db || user.id === 'mock-user-123') {
        // We could load from localStorage here for demo user persistence if needed
        // For now, demo user starts fresh or keeps current memory state
        return;
    }

    const userRef = doc(db, 'users', user.id);
    
    // Real-time listener
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.tasks) setTasks(data.tasks);
            if (data.score !== undefined) setScore(data.score);
            if (data.fastingStatus) setFastingStatusState(data.fastingStatus);
            if (data.themeId) setCurrentThemeId(data.themeId);
            if (data.quranProgress) setQuranProgress(data.quranProgress);
        } else {
            // Create initial document for new user
            const initialQuran = {
                currentJuz: 1,
                currentSurah: "Al-Fatihah",
                currentAyah: 1,
                completedJuz: [],
                startDate: new Date().toISOString().split('T')[0], 
                totalKhatamTarget: 30,
            };
            saveDataToFirestore(INITIAL_TASKS, 0, 'puasa', 'gold-green', initialQuran);
        }
    }, (error) => {
        console.error("Firestore listener error:", error);
    });

    return () => unsubscribe();
  }, [user]);
  // ----------------------

  useEffect(() => {
    // Set Hijri Date
    setHijriDate(getHijriDate());

    const updatePrayerTimes = (lat: number, long: number, locName: string) => {
        try {
            const { list, next, imsak } = getPrayerTimes(lat, long);
            const fullList = [
                { name: 'Imsak', time: imsak, isNext: false, id: 'imsak', raw: new Date() },
                ...list
            ];
            
            // Map to simple PrayerTime type
            const mappedList: PrayerTime[] = fullList.map(p => ({
                name: p.name,
                time: p.time,
                isNext: p.isNext || false
            }));

            setPrayerTimes(mappedList);
            
            // Safe next prayer setting
            if (next) {
                setNextPrayer({
                    name: next.name,
                    time: next.time,
                    isNext: true
                });
            }
            
            setLocation(locName);
        } catch (e) {
            console.error(e);
            setLocation("Default");
        }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updatePrayerTimes(latitude, longitude, "My Location");
        },
        (error) => {
          console.log('Location default:', error);
          // Default to Jakarta
          updatePrayerTimes(-6.2, 106.8, "Jakarta (Default)");
        }
      );
    } else {
        updatePrayerTimes(-6.2, 106.8, "Jakarta (Default)");
    }
  }, []);

  const toggleTask = (id: string) => {
    const newTasks = tasks.map((t) => {
        if (t.id === id) {
          return { ...t, completed: !t.completed };
        }
        return t;
    });
    
    // Recalculate score entirely based on new task state to ensure consistency
    const newScore = newTasks.reduce((acc, curr) => acc + (curr.completed ? curr.points : 0), 0);

    setTasks(newTasks);
    setScore(newScore);

    saveDataToFirestore(newTasks, newScore, fastingStatus, currentThemeId, quranProgress);
  };

  const setFastingStatus = (status: 'puasa' | 'tidak' | 'uzur') => {
      setFastingStatusState(status);
      saveDataToFirestore(tasks, score, status, currentThemeId, quranProgress);
  };

  const setThemeId = (id: string) => {
    setCurrentThemeId(id);
    saveDataToFirestore(tasks, score, fastingStatus, id, quranProgress);
  };

  const updateQuranProgress = (updates: Partial<QuranProgress>) => {
      const newQuran = { ...quranProgress, ...updates };
      setQuranProgress(newQuran);
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, newQuran);
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        setThemeId,
        tasks,
        toggleTask,
        fastingStatus,
        setFastingStatus,
        score,
        quranProgress,
        updateQuranProgress,
        location,
        prayerTimes,
        hijriDate,
        nextPrayer
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