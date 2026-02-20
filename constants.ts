import { Task, Theme } from './types';

export const THEMES: Theme[] = [
  {
    id: 'gold-green',
    name: 'Klasik & Elegan',
    colors: {
      primary: '#059669', // Emerald 600
      secondary: '#D97706', // Amber 600 (Goldish)
      background: '#F0FDF4', // Emerald 50
      card: '#FFFFFF',
      text: '#064E3B',
      textMuted: '#6EE7B7',
    },
  },
  {
    id: 'pastel',
    name: 'Modern Pastel',
    colors: {
      primary: '#84A59D', // Sage Green
      secondary: '#F28482', // Dusty Rose
      background: '#F5F7F5', // Soft Grey/Green
      card: '#FFFFFF',
      text: '#355070',
      textMuted: '#A5A58D',
    },
  },
  {
    id: 'earth',
    name: 'Earth Tone',
    colors: {
      primary: '#C07850', // Terracotta
      secondary: '#C19A6B', // Warm Camel
      background: '#F9F5EB', // Cream
      card: '#FFFFFF',
      text: '#4A3B32',
      textMuted: '#DDBEA9',
    },
  },
  {
    id: 'night',
    name: 'Malam Ramadhan',
    colors: {
      primary: '#1E3A8A', // Midnight Blue
      secondary: '#94A3B8', // Silver
      background: '#0F172A', // Slate 900
      card: '#1E293B', // Slate 800
      text: '#F8FAFC', // Slate 50
      textMuted: '#64748B',
    },
  },
  {
    id: 'lavender',
    name: 'Spiritual Lavender',
    colors: {
      primary: '#7C3AED', // Violet 600
      secondary: '#A78BFA', // Lavender
      background: '#F5F3FF', // Violet 50
      card: '#FFFFFF',
      text: '#4C1D95',
      textMuted: '#C4B5FD',
    },
  },
];

export const INITIAL_TASKS: Task[] = [
  { id: 'subuh', label: 'Subuh', points: 10, completed: false, category: 'wajib', icon: 'flare' },
  { id: 'dzuhur', label: 'Dzuhur', points: 10, completed: false, category: 'wajib', icon: 'wb_sunny' },
  { id: 'ashar', label: 'Ashar', points: 10, completed: false, category: 'wajib', icon: 'wb_twilight' },
  { id: 'maghrib', label: 'Maghrib', points: 10, completed: false, category: 'wajib', icon: 'nights_stay' },
  { id: 'isya', label: 'Isya', points: 10, completed: false, category: 'wajib', icon: 'bedtime' },
  { id: 'tarawih', label: 'Tarawih', points: 15, completed: false, category: 'sunnah', icon: 'mosque' },
  { id: 'tahajud', label: 'Tahajud', points: 20, completed: false, category: 'sunnah', icon: 'alarm' },
  { id: 'dhuha', label: 'Dhuha', points: 10, completed: false, category: 'sunnah', icon: 'light_mode' },
  { id: 'sedekah', label: 'Sedekah', points: 15, completed: false, category: 'charity', icon: 'volunteer_activism' },
  { id: 'tilawah', label: 'Tilawah (1 Juz)', points: 20, completed: false, category: 'quran', icon: 'menu_book' },
];

export const PRAYER_SCHEDULE_MOCK = [
  { name: 'Imsak', time: '04:22', isNext: false },
  { name: 'Subuh', time: '04:32', isNext: false },
  { name: 'Dzuhur', time: '11:58', isNext: true },
  { name: 'Ashar', time: '15:12', isNext: false },
  { name: 'Maghrib', time: '18:02', isNext: false },
  { name: 'Isya', time: '19:11', isNext: false },
];