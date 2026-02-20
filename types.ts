
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
  pagesRead: number; // New: Track Quran pages per day
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
  bookmarks: { id: string; title: string; type: 'quran' | 'dua' }[]; // New: Bookmarks
}

export interface PrayerTime {
  name: string;
  time: string;
  isNext: boolean;
}

export interface PrayerCorrections {
    [key: string]: number; // id prayer (subuh, dzuhur, etc) -> minutes offset
}
