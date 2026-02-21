
export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    card: string;
    text: string;
    textMuted: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  achievements?: string[]; 
  friends?: string[]; // Confirmed friends IDs
  friendRequestsIncoming?: string[]; // IDs asking to be friends
  friendRequestsOutgoing?: string[]; // IDs I invited
}

export interface Task {
  id: string;
  label: string;
  points: number;
  completed: boolean;
  category: 'wajib' | 'sunnah' | 'quran' | 'charity';
  icon: string;
}

export interface HistoryData {
  date: string; // YYYY-MM-DD
  score: number;
  completedTasksCount: number;
  fastingStatus: 'puasa' | 'tidak' | 'uzur';
  pagesRead: number;
  completedTaskIds?: string[];
}

export interface DailyProgress {
  date: string;
  score: number;
  tasks: Task[];
  fastingStatus: 'puasa' | 'tidak' | 'uzur';
}

export interface QuranProgress {
  currentJuz: number;
  currentSurah: string;
  currentAyah: number;
  totalKhatamTarget: number; // Days
  startDate: string;
  completedJuz: number[];
  bookmarks: { id: string; title: string; type: 'quran' | 'dua' }[];
  lastRead?: { surahNumber: number; ayahNumber: number; surahName: string };
}

export interface PrayerTime {
  name: string;
  time: string;
  isNext: boolean;
}

export interface PrayerCorrections {
    [key: string]: number; // id prayer (subuh, dzuhur, etc) -> minutes offset
}

// --- Quran Types ---
export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean | any;
  translation?: string;
  audio?: string; // URL Audio
  surah?: Surah; // Added for Juz/Page view context
}

// --- New Feature Types ---
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  condition: (data: { streak: number, totalScore: number, completedJuz: number[], fastingDays: number }) => boolean;
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string; // Bisa HTML string sederhana
  author: string;
  readTime: string;
  category: 'Kultum' | 'Kesehatan' | 'Fiqih';
  image?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  avatar: string;
  isCurrentUser: boolean;
  rank: number;
  email?: string; // Optional for friend search display
}

// --- Chat Feature Types ---

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  participants: string[]; // User IDs
  participantDetails?: UserProfile[]; // Hydrated for UI
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: any; // Firestore Timestamp or Date
    readBy: string[];
  };
  groupName?: string;
  groupPhoto?: string;
  createdAt: any;
  updatedAt: any;
  unreadCount?: number; // Calculated on client
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  timestamp: any;
  readBy: string[];
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    photoUrl: string;
    isOnline?: boolean;
}
