
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { Theme, Task, DailyProgress, QuranProgress, PrayerTime, HistoryData, PrayerCorrections, Achievement, LeaderboardEntry } from '../types';
import { THEMES, INITIAL_TASKS, TRANSLATIONS, ADZAN_AUDIO_URL, ACHIEVEMENTS } from '../constants';
import { getPrayerTimes, getHijriDate, calculateRamadhanDay, addMinutesToTime } from '../utils';
import { useAuth } from './AuthContext';
import { auth, db } from '../firebase';
import { doc, setDoc, onSnapshot, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

interface AppContextType {
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

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
  updateHistoryTask: (date: string, taskId: string) => void;
  updateHistoryFasting: (date: string, status: 'puasa' | 'tidak' | 'uzur') => void;
  quranProgress: QuranProgress;
  updateQuranProgress: (progress: Partial<QuranProgress>) => void;
  pagesReadToday: number;
  setPagesReadToday: (count: number) => void;
  dzikirCounts: Record<string, number>;
  incrementDzikir: (id: string) => void;
  location: string;
  prayerTimes: PrayerTime[];
  prayerSchedule: Record<string, string>; 
  prayerCorrections: PrayerCorrections;
  setPrayerCorrections: (corrections: PrayerCorrections) => void;
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
  achievements: string[]; // Unlocked Achievement IDs
  
  // Friend System
  friendsLeaderboard: LeaderboardEntry[]; // Confirmed Friends
  incomingRequests: LeaderboardEntry[];
  outgoingRequests: LeaderboardEntry[];
  
  addFriendByEmail: (email: string) => Promise<{ success: boolean; message: string; notFound?: boolean }>;
  acceptFriend: (friendId: string) => Promise<void>;
  rejectFriend: (friendId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  
  updateDisplayName: (newName: string) => Promise<void>;
  
  // Privacy
  isStatsLocked: boolean;
  toggleStatsLock: () => void;

  // New: Achievement Popup State
  newlyUnlockedAchievement: Achievement | null;
  closeAchievementPopup: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');

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
  const [prayerCorrections, setPrayerCorrectionsState] = useState<PrayerCorrections>({});

  // Ramadhan Settings
  const [ramadhanStartDate, setRamadhanStartDateState] = useState<string>('2026-02-19'); // Default 19th based on prompt
  
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

  // Gamification & Social State
  const [achievements, setAchievements] = useState<string[]>([]);
  const [newlyUnlockedAchievement, setNewlyUnlockedAchievement] = useState<Achievement | null>(null);
  const [isStatsLocked, setIsStatsLocked] = useState(false); // New State
  
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<LeaderboardEntry[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<LeaderboardEntry[]>([]);
  
  const [friendIds, setFriendIds] = useState<string[]>([]); // Confirmed IDs
  const [incomingIds, setIncomingIds] = useState<string[]>([]);
  const [outgoingIds, setOutgoingIds] = useState<string[]>([]);

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
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, newState, prayerCorrections, achievements, isStatsLocked);
  };

  const toggleStatsLock = () => {
      const newState = !isStatsLocked;
      setIsStatsLocked(newState);
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled, prayerCorrections, achievements, newState);
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
      newAudio: boolean,
      newCorrections: PrayerCorrections,
      newAchievements: string[],
      newStatsLocked: boolean // New param
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
            prayerCorrections: newCorrections,
            achievements: newAchievements,
            isStatsLocked: newStatsLocked, // Save to DB
            lastUpdated: new Date().toISOString()
        }, { merge: true });
    } catch (e) {
        console.error("Error saving data:", e);
    }
  };

  // Check and update achievements based on current data
  const checkAchievements = (currentScore: number, currentHistory: HistoryData[], quran: QuranProgress, currentAchievements: string[]) => {
      let newlyUnlocked: string[] = [];
      const totalScore = currentHistory.reduce((acc, h) => acc + (h.score || 0), 0) + currentScore;
      const fastingDays = currentHistory.filter(h => h.fastingStatus === 'puasa').length;
      
      const streak = currentHistory.length; // Approximate, could be refined

      let lastUnlockedObj: Achievement | null = null;

      ACHIEVEMENTS.forEach(ach => {
          if (!currentAchievements.includes(ach.id)) {
               if (ach.condition({
                   streak,
                   totalScore,
                   completedJuz: quran.completedJuz,
                   fastingDays
               })) {
                   newlyUnlocked.push(ach.id);
                   lastUnlockedObj = ach;
               }
          }
      });

      if (newlyUnlocked.length > 0) {
          const updated = [...currentAchievements, ...newlyUnlocked];
          setAchievements(updated);
          
          // Trigger Popup for the last unlocked one
          if (lastUnlockedObj) {
              setNewlyUnlockedAchievement(lastUnlockedObj);
          }
          return updated;
      }
      return currentAchievements;
  }

  const closeAchievementPopup = () => {
      setNewlyUnlockedAchievement(null);
  };

  // --- SOCIAL / FRIENDS LOGIC ---

  const addFriendByEmail = async (email: string): Promise<{ success: boolean; message: string; notFound?: boolean }> => {
      if (!user || !db) return { success: false, message: "Anda harus login." };
      if (email === user.email) return { success: false, message: "Tidak bisa menambahkan diri sendiri." };

      if (isDemoUser) {
          if (email.includes('error')) return { success: false, message: "Email tidak ditemukan.", notFound: true };
          // Demo logic: Just simulate outgoing request appearing
          const mockRequest: LeaderboardEntry = {
              id: `temp-${Math.random()}`,
              name: email.split('@')[0],
              score: 0,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
              isCurrentUser: false,
              rank: 0,
              email: email
          };
          setOutgoingRequests(prev => [...prev, mockRequest]);
          return { success: true, message: `Permintaan terkirim ke ${email}` };
      }

      try {
          // 1. Find User by Email
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where("email", "==", email));
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
              return { success: false, message: "Email belum terdaftar di aplikasi.", notFound: true };
          }

          const friendDoc = querySnapshot.docs[0];
          const friendId = friendDoc.id;
          
          // 2. Checks
          if (friendIds.includes(friendId)) return { success: false, message: "Sudah menjadi teman." };
          if (incomingIds.includes(friendId)) return { success: false, message: "Orang ini sudah mengirim permintaan padamu. Cek tab Request." };
          if (outgoingIds.includes(friendId)) return { success: false, message: "Permintaan sudah dikirim sebelumnya." };

          // 3. Update Target User (Add to Incoming)
          const targetRef = doc(db, 'users', friendId);
          await updateDoc(targetRef, {
              friendRequestsIncoming: arrayUnion(user.id)
          });
          
          // 4. Update Current User (Add to Outgoing)
          const myRef = doc(db, 'users', user.id);
          await updateDoc(myRef, {
              friendRequestsOutgoing: arrayUnion(friendId)
          });

          return { success: true, message: `Permintaan pertemanan dikirim ke ${friendDoc.data().name || 'Pengguna'}` };

      } catch (e) {
          console.error("Add friend error:", e);
          return { success: false, message: "Terjadi kesalahan koneksi." };
      }
  };

  const acceptFriend = async (friendId: string) => {
      if (!user || !db) return;
      if (isDemoUser) {
           // Demo logic: Move from incoming to friends
           const req = incomingRequests.find(r => r.id === friendId);
           if(req) {
               setFriendsLeaderboard(prev => [...prev, req]);
               setIncomingRequests(prev => prev.filter(r => r.id !== friendId));
           }
           return;
      }

      try {
          // 1. Update Me: Remove from Incoming, Add to Friends
          const myRef = doc(db, 'users', user.id);
          await updateDoc(myRef, {
              friendRequestsIncoming: arrayRemove(friendId),
              friends: arrayUnion(friendId)
          });

          // 2. Update Sender: Remove from Outgoing, Add to Friends
          const senderRef = doc(db, 'users', friendId);
          await updateDoc(senderRef, {
              friendRequestsOutgoing: arrayRemove(user.id),
              friends: arrayUnion(user.id)
          });

      } catch(e) { console.error("Accept friend error", e); }
  }

  const rejectFriend = async (friendId: string) => {
      if (!user || !db) return;
      if (isDemoUser) {
          setIncomingRequests(prev => prev.filter(r => r.id !== friendId));
          return;
      }

      try {
          // 1. Update Me: Remove from Incoming
          const myRef = doc(db, 'users', user.id);
          await updateDoc(myRef, {
              friendRequestsIncoming: arrayRemove(friendId)
          });

          // 2. Update Sender: Remove from Outgoing
          const senderRef = doc(db, 'users', friendId);
          await updateDoc(senderRef, {
              friendRequestsOutgoing: arrayRemove(user.id)
          });
      } catch(e) { console.error("Reject friend error", e); }
  }

  const removeFriend = async (friendId: string) => {
      if (!user || !db) return;
      if (isDemoUser) {
          setFriendsLeaderboard(prev => prev.filter(f => f.id !== friendId));
          return;
      }
      if(!window.confirm("Hapus teman ini dari circle?")) return;

      try {
          // 1. Remove from Me
          const myRef = doc(db, 'users', user.id);
          await updateDoc(myRef, {
              friends: arrayRemove(friendId)
          });

          // 2. Remove from Friend
          const friendRef = doc(db, 'users', friendId);
          await updateDoc(friendRef, {
              friends: arrayRemove(user.id)
          });
      } catch(e) { console.error("Remove friend error", e); }
  }

  const updateDisplayName = async (newName: string) => {
      if (!user) return;
      if (isDemoUser) {
          alert("Nama berhasil diubah (Mode Demo).");
          return;
      }
      try {
          // 1. Update Firestore
          const userRef = doc(db, 'users', user.id);
          await updateDoc(userRef, { name: newName });
          
          // 2. Update Firebase Auth Profile (for immediate consistency in some parts of the app)
          if (auth && auth.currentUser) {
              await updateProfile(auth.currentUser, { displayName: newName });
          }
      } catch (e) {
          console.error("Update name error", e);
      }
  };

  // Helper to fetch user profiles for lists
  const fetchUserProfiles = async (ids: string[]): Promise<LeaderboardEntry[]> => {
      if (!ids || ids.length === 0 || !db) return [];
      try {
          const promises = ids.map(id => getDoc(doc(db, 'users', id)));
          const snaps = await Promise.all(promises);
          
          return snaps.map(snap => {
              if(!snap.exists()) return null;
              const d = snap.data();
              const totalH = (d.history || []).reduce((acc: number, h: HistoryData) => acc + (h.score || 0), 0);
              const total = totalH + (d.score || 0);
              
              return {
                  id: snap.id,
                  name: d.name || 'User',
                  score: total,
                  avatar: d.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.email}`,
                  isCurrentUser: false,
                  rank: 0,
                  email: d.email
              };
          }).filter(Boolean) as LeaderboardEntry[];
      } catch(e) {
          console.error("Error fetching profiles", e);
          return [];
      }
  }

  // Effect to fetch Friends, Incoming, and Outgoing data
  useEffect(() => {
      const fetchAllSocialData = async () => {
          if (!user || !db || isDemoUser) return;
          
          // 1. Friends Leaderboard (Confirmed Only)
          const friendsEntries = await fetchUserProfiles(friendIds);
          
          // Add Me
          const currentUserTotal = history.reduce((acc, h) => acc + (h.score || 0), 0) + score;
          const meEntry: LeaderboardEntry = {
              id: user.id,
              name: user.name ? `${user.name.split(' ')[0]} (Saya)` : 'Saya',
              score: currentUserTotal,
              avatar: user.photoUrl,
              isCurrentUser: true,
              rank: 1,
              email: user.email
          };

          const allFriends = [...friendsEntries, meEntry].sort((a, b) => b.score - a.score);
          const rankedFriends = allFriends.map((u, i) => ({ ...u, rank: i + 1 }));
          setFriendsLeaderboard(rankedFriends);

          // 2. Incoming Requests
          const incomingEntries = await fetchUserProfiles(incomingIds);
          setIncomingRequests(incomingEntries);

          // 3. Outgoing Requests
          const outgoingEntries = await fetchUserProfiles(outgoingIds);
          setOutgoingRequests(outgoingEntries);
      };

      fetchAllSocialData();
  }, [friendIds, incomingIds, outgoingIds, score, history, user, isDemoUser]);


  // Sync data from Firestore
  useEffect(() => {
    if (!user) return;
    if (!db || user.id === 'mock-user-123') {
        checkDailyReset(INITIAL_TASKS, 0, [], 'puasa', '', 0, {}); 
        // Mock Friends - Demo User
        const mockFriends = [
            { id: 'f1', name: 'Ayah', score: 1500, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ayah', isCurrentUser: false, rank: 1 },
            { id: 'me', name: 'Saya', score: 1200, avatar: user.photoUrl, isCurrentUser: true, rank: 2 },
        ];
        setFriendsLeaderboard(mockFriends);
        setIncomingRequests([{ id: 'req1', name: 'Budi Santoso', score: 0, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Budi', isCurrentUser: false, rank: 0 }]);
        setOutgoingRequests([]);
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
            
            // Social Arrays
            const fIds = data.friends || [];
            const incIds = data.friendRequestsIncoming || [];
            const outIds = data.friendRequestsOutgoing || [];

            if (data.themeId) setCurrentThemeId(data.themeId);
            if (data.quranProgress) setQuranProgress(data.quranProgress);
            if (data.manualLocation) setManualLocationState(data.manualLocation);
            if (data.ramadhanStartDate) setRamadhanStartDateState(data.ramadhanStartDate);
            if (data.language) setLanguageState(data.language);
            if (data.notificationsEnabled !== undefined) setNotificationsEnabled(data.notificationsEnabled);
            if (data.audioEnabled !== undefined) setAudioEnabled(data.audioEnabled);
            if (data.prayerCorrections) setPrayerCorrectionsState(data.prayerCorrections);
            if (data.achievements) setAchievements(data.achievements);
            if (data.isStatsLocked !== undefined) setIsStatsLocked(data.isStatsLocked);
            
            // Update IDs state (triggers the other useEffect to fetch profiles)
            setFriendIds(fIds);
            setIncomingIds(incIds);
            setOutgoingIds(outIds);

            checkDailyReset(fetchedTasks, fetchedScore, fetchedHistory, fetchedFasting, fetchedDate, fetchedPages, fetchedDzikir);

        } else {
            const today = new Date().toISOString().split('T')[0];
            setLastRecordedDate(today);
            // Save initial user doc
            setDoc(userRef, {
                email: user.email,
                name: user.name,
                photoUrl: user.photoUrl,
                friends: [],
                friendRequestsIncoming: [],
                friendRequestsOutgoing: [],
                tasks: INITIAL_TASKS,
                score: 0,
                fastingStatus: 'puasa',
                themeId: 'gold-green',
                quranProgress: quranProgress,
                manualLocation: null,
                ramadhanStartDate: '2026-02-19',
                history: [],
                lastRecordedDate: today,
                pagesReadToday: 0,
                dzikirCounts: {},
                language: 'id',
                notificationsEnabled: false,
                audioEnabled: false,
                prayerCorrections: {},
                achievements: [],
                lastUpdated: new Date().toISOString()
            }, { merge: true });
        }
    }, (error) => {
        console.error("Firestore listener error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // --- NOTIFICATION & AUDIO LOGIC ---
  useEffect(() => {
      // Logic runs every 30 seconds
      if (prayerTimes.length === 0) return;

      const checkInterval = setInterval(() => {
          const nowInZone = new Date().toLocaleString('en-US', { timeZone: timezone, hour12: false });
          const zoneDate = new Date(nowInZone);
          const currentHour = String(zoneDate.getHours()).padStart(2, '0');
          const currentMinute = String(zoneDate.getMinutes()).padStart(2, '0');
          const currentTimeStr = `${currentHour}:${currentMinute}`;
          
          if (lastNotificationTime === currentTimeStr) return;

          const match = prayerTimes.find(p => p.time === currentTimeStr);
          if (match) {
               console.log("Prayer time matched:", match.name);
               setLastNotificationTime(currentTimeStr);
               
               if (notificationsEnabled && Notification.permission === 'granted') {
                   new Notification(`Waktu ${match.name} Telah Tiba`, {
                       body: `Selamat menunaikan ibadah sholat ${match.name}.`,
                       icon: '/logo192.png',
                       badge: '/logo192.png'
                   });
               }

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
              // Simpan hari terakhir yang terekam
              newHistory.push({
                  date: recordedDate, 
                  score: currentScore,
                  completedTasksCount: currentTasks.filter(t => t.completed).length,
                  fastingStatus: currentFasting,
                  pagesRead: currentPages,
                  completedTaskIds: currentTasks.filter(t => t.completed).map(t => t.id) // Save completed IDs
              });
          } else {
              // Simpan hari-hari kosong di antaranya
              newHistory.push({
                  date: dateStr,
                  score: 0,
                  completedTasksCount: 0,
                  fastingStatus: 'tidak',
                  pagesRead: 0,
                  completedTaskIds: []
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

      saveDataToFirestore(resetTasks, 0, 'puasa', currentThemeId, quranProgress, manualLocation, ramadhanStartDate, newHistory, today, resetPages, resetDzikir, language, notificationsEnabled, audioEnabled, prayerCorrections, achievements);
  };

  // --- PRAYER TIMES LOGIC (WITH CORRECTIONS) ---
  const fetchPrayers = async (lat: number, long: number, locName?: string) => {
      try {
          const schedule = await getPrayerTimes(lat, long);
          
          const applyOffset = (time: string, id: string) => {
              const offset = prayerCorrections[id] || 0;
              return offset === 0 ? time : addMinutesToTime(time, offset);
          };

          const fullList: PrayerTime[] = [
              { name: 'Imsak', time: applyOffset(schedule.imsak, 'subuh'), isNext: false }, 
              ...schedule.list.map(p => ({
                  name: p.name,
                  time: applyOffset(p.time, p.id),
                  isNext: p.isNext
              }))
          ];
          
          const nowInZone = new Date().toLocaleString('en-US', { timeZone: schedule.timezone, hour12: false });
          const zoneDate = new Date(nowInZone);
          const currentHour = String(zoneDate.getHours()).padStart(2, '0');
          const currentMinute = String(zoneDate.getMinutes()).padStart(2, '0');
          const currentTimeStr = `${currentHour}:${currentMinute}`;
          
          let nextP = fullList.find(p => p.time > currentTimeStr && p.name !== 'Imsak');
          if (!nextP) nextP = fullList.find(p => p.name !== 'Imsak'); 
          
          if(nextP) nextP.isNext = true;

          setPrayerTimes(fullList);
          
          const timesDict: Record<string, string> = {
              imsak: applyOffset(schedule.imsak, 'subuh'),
              subuh: applyOffset(schedule.times.subuh, 'subuh'),
              dhuha: applyOffset(schedule.times.dhuha, 'dhuha'),
              dzuhur: applyOffset(schedule.times.dzuhur, 'dzuhur'),
              ashar: applyOffset(schedule.times.ashar, 'ashar'),
              maghrib: applyOffset(schedule.times.maghrib, 'maghrib'),
              isya: applyOffset(schedule.times.isya, 'isya'),
          };
          setPrayerSchedule(timesDict);

          if (nextP) {
              setNextPrayer({
                  name: nextP.name,
                  time: nextP.time,
                  isNext: true
              });
          }
          setLocation(locName || schedule.locationName);
          setTimezone(schedule.timezone);
      } catch (e) {
          console.error("Failed to load prayers:", e);
      }
  };

  // --- UPDATED EFFECT: HIJRI DATE BASED ON SETTINGS ---
  useEffect(() => {
    // 1. Calculate Hijri Text: If within Ramadhan (1-30 days) relative to start date, use that count.
    // Otherwise fallback to standard calendar.
    if (currentRamadhanDay >= 1 && currentRamadhanDay <= 30) {
         setHijriDate(`${currentRamadhanDay} Ramadhan 1447H`);
    } else {
         setHijriDate(getHijriDate(timezone));
    }
    
    // 2. Fetch Prayers based on location
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
  }, [manualLocation, timezone, prayerCorrections, currentRamadhanDay]); // Added currentRamadhanDay as dependency

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
    
    // Check achievements
    const updatedAchievements = checkAchievements(newScore, history, quranProgress, achievements);

    saveDataToFirestore(newTasks, newScore, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled, prayerCorrections, updatedAchievements);
  };

  const setFastingStatus = (status: 'puasa' | 'tidak' | 'uzur') => {
      setFastingStatusState(status);
      saveDataToFirestore(tasks, score, status, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled, prayerCorrections, achievements);
  };

  // --- NEW ACTIONS FOR BACKDATE HISTORY ---
  const updateHistoryTask = (date: string, taskId: string) => {
      // Cari apakah history untuk tanggal ini ada
      const existingIndex = history.findIndex(h => h.date === date);
      let newHistory = [...history];
      
      // Ambil poin dari task definition
      const taskDef = INITIAL_TASKS.find(t => t.id === taskId);
      if (!taskDef) return;

      if (existingIndex >= 0) {
          // Update existing history
          const entry = { ...newHistory[existingIndex] };
          const completedIds = entry.completedTaskIds || [];
          const isCompleted = completedIds.includes(taskId);

          let newCompletedIds;
          let scoreChange = 0;

          if (isCompleted) {
              newCompletedIds = completedIds.filter(id => id !== taskId);
              scoreChange = -taskDef.points;
          } else {
              newCompletedIds = [...completedIds, taskId];
              scoreChange = taskDef.points;
          }

          entry.completedTaskIds = newCompletedIds;
          entry.completedTasksCount = newCompletedIds.length;
          entry.score = Math.max(0, (entry.score || 0) + scoreChange);
          
          newHistory[existingIndex] = entry;
      } else {
          // Create new history entry (Backfill case)
          newHistory.push({
              date: date,
              score: taskDef.points,
              completedTasksCount: 1,
              fastingStatus: 'tidak', // Default
              pagesRead: 0,
              completedTaskIds: [taskId]
          });
          // Sort history by date to keep consistent
          newHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
      
      setHistory(newHistory);
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, newHistory, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled, prayerCorrections, achievements);
  };

  const updateHistoryFasting = (date: string, status: 'puasa' | 'tidak' | 'uzur') => {
       const existingIndex = history.findIndex(h => h.date === date);
       let newHistory = [...history];

       if (existingIndex >= 0) {
           newHistory[existingIndex] = { ...newHistory[existingIndex], fastingStatus: status };
       } else {
           newHistory.push({
               date: date,
               score: 0,
               completedTasksCount: 0,
               fastingStatus: status,
               pagesRead: 0,
               completedTaskIds: []
           });
           newHistory.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
       }

       setHistory(newHistory);
       saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, newHistory, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled, prayerCorrections, achievements);
  };


  const setThemeId = (id: string) => {
    setCurrentThemeId(id);
    saveDataToFirestore(tasks, score, fastingStatus, id, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled, prayerCorrections, achievements);
  };

  const updateQuranProgress = (updates: Partial<QuranProgress>) => {
      const newQuran = { ...quranProgress, ...updates };
      setQuranProgress(newQuran);
      // Check achievements
      const updatedAchievements = checkAchievements(score, history, newQuran, achievements);
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, newQuran, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled, prayerCorrections, updatedAchievements);
  };

  const setManualLocation = (loc: { name: string; lat: number; lon: number } | null) => {
      setManualLocationState(loc);
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, loc, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled, prayerCorrections, achievements);
  };

  const setRamadhanStartDate = (date: string) => {
      setRamadhanStartDateState(date);
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, date, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled, prayerCorrections, achievements);
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
           saveDataToFirestore(newTasks, newScore, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, count, dzikirCounts, language, notificationsEnabled, audioEnabled, prayerCorrections, achievements);
      } else {
           saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, count, dzikirCounts, language, notificationsEnabled, audioEnabled, prayerCorrections, achievements);
      }
  }

  const incrementDzikir = (id: string) => {
      const currentVal = dzikirCounts[id] || 0;
      const newCounts = { ...dzikirCounts, [id]: currentVal + 1 };
      setDzikirCounts(newCounts);
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, newCounts, language, notificationsEnabled, audioEnabled, prayerCorrections, achievements);
  }

  const setLanguage = (lang: 'id' | 'en') => {
      setLanguageState(lang);
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, lang, notificationsEnabled, audioEnabled, prayerCorrections, achievements);
  }

  const setPrayerCorrections = (corrections: PrayerCorrections) => {
      setPrayerCorrectionsState(corrections);
      saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, notificationsEnabled, audioEnabled, corrections, achievements);
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
              saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, true, audioEnabled, prayerCorrections, achievements);
          } else {
              alert("Izin notifikasi ditolak. Cek pengaturan browser.");
          }
      } else {
          setNotificationsEnabled(false);
          saveDataToFirestore(tasks, score, fastingStatus, currentThemeId, quranProgress, manualLocation, ramadhanStartDate, history, lastRecordedDate, pagesReadToday, dzikirCounts, language, false, audioEnabled, prayerCorrections, achievements);
      }
  }

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
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
        updateHistoryTask,
        updateHistoryFasting,
        quranProgress,
        updateQuranProgress,
        pagesReadToday,
        setPagesReadToday,
        dzikirCounts,
        incrementDzikir,
        location,
        prayerTimes,
        prayerSchedule,
        prayerCorrections,
        setPrayerCorrections,
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
        timezone,
        achievements,
        
        friendsLeaderboard,
        incomingRequests,
        outgoingRequests,
        
        addFriendByEmail,
        acceptFriend,
        rejectFriend,
        removeFriend,
        updateDisplayName,

        newlyUnlockedAchievement,
        closeAchievementPopup,
        isStatsLocked,
        toggleStatsLock
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
