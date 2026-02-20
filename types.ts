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
}

export interface PrayerTime {
  name: string;
  time: string;
  isNext: boolean;
}