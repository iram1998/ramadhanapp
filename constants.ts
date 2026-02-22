
import { Task, Theme, Achievement, Article } from './types';

// URL Audio Adzan (Mishary Rashid Alafasy - Short/Clear version)
export const ADZAN_AUDIO_URL = "https://www.islamcan.com/audio/adhan/azan1.mp3";

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
  { id: 'dzikir-pagi', label: 'Dzikir Pagi', points: 5, completed: false, category: 'sunnah', icon: 'wb_iridescent' },
  { id: 'dzikir-petang', label: 'Dzikir Petang', points: 5, completed: false, category: 'sunnah', icon: 'dark_mode' },

  { id: 'sedekah', label: 'Sedekah', points: 15, completed: false, category: 'charity', icon: 'volunteer_activism' },
  { id: 'tilawah', label: 'Tilawah (1/2 Juz+)', points: 20, completed: false, category: 'quran', icon: 'menu_book' },
];

export const TRANSLATIONS = {
  id: {
    nav_home: 'Beranda',
    nav_tracker: 'Ibadah',
    nav_quran: 'Quran',
    nav_dua: 'Doa',
    nav_chat: 'Chat',
    nav_profile: 'Profil',
    greeting: 'Ahlan',
    next_prayer: 'Menuju',
    streak: 'Streak',
    level: 'Level',
    sedekah: 'Sedekah',
    completed: 'Tamat',
    fasting_schedule: 'Jadwal Puasa',
    prayer_times: 'Sholat 5 Waktu',
    settings_title: 'Profile & Pengaturan',
    location: 'Lokasi & Jadwal',
    language: 'Bahasa',
    notifications: 'Notifikasi & Adzan',
    logout: 'Keluar Aplikasi',
    general: 'Umum',
    theme: 'Tema Aplikasi',
    save: 'Simpan',
    search_placeholder: 'Cari Kota...',
    use_gps: 'Gunakan GPS Otomatis',
    audio_adzan: 'Suara Adzan',
    test_audio: 'Test Suara',
    stop_audio: 'Stop Suara',
  },
  en: {
    nav_home: 'Home',
    nav_tracker: 'Tracker',
    nav_quran: 'Quran',
    nav_dua: 'Dua',
    nav_chat: 'Chat',
    nav_profile: 'Profile',
    greeting: 'Ahlan',
    next_prayer: 'Upcoming',
    streak: 'Streak',
    level: 'Level',
    sedekah: 'Charity',
    completed: 'Completed',
    fasting_schedule: 'Fasting Schedule',
    prayer_times: '5 Daily Prayers',
    settings_title: 'Profile & Settings',
    location: 'Location & Schedule',
    language: 'Language',
    notifications: 'Notifications & Adhan',
    logout: 'Logout',
    general: 'General',
    theme: 'App Theme',
    save: 'Save',
    search_placeholder: 'Search City...',
    use_gps: 'Use GPS Automatically',
    audio_adzan: 'Adhan Audio',
    test_audio: 'Test Audio',
    stop_audio: 'Stop Audio',
  }
};

// --- ACHIEVEMENTS DATA ---
export const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'newbie',
        title: 'Langkah Awal',
        description: 'Mencapai skor total 100 poin.',
        icon: 'footprint',
        color: '#60A5FA', // Blue
        condition: (d) => d.totalScore >= 100
    },
    {
        id: 'week_streak',
        title: 'Istiqomah Mingguan',
        description: 'Menjaga streak ibadah selama 7 hari.',
        icon: 'local_fire_department',
        color: '#F59E0B', // Amber
        condition: (d) => d.streak >= 7
    },
    {
        id: 'quran_lover',
        title: 'Sahabat Al-Quran',
        description: 'Menyelesaikan minimal 1 Juz.',
        icon: 'menu_book',
        color: '#10B981', // Emerald
        condition: (d) => d.completedJuz.length >= 1
    },
    {
        id: 'puasa_full',
        title: 'Pejuang Puasa',
        description: 'Berpuasa penuh selama 5 hari.',
        icon: 'restaurant_menu',
        color: '#8B5CF6', // Purple
        condition: (d) => d.fastingDays >= 5
    },
    {
        id: 'khatam',
        title: 'Khatam Quran',
        description: 'Menyelesaikan 30 Juz Al-Quran.',
        icon: 'workspace_premium',
        color: '#D97706', // Gold
        condition: (d) => d.completedJuz.length >= 30
    }
];

// --- ARTICLES DATA (KULTUM) ---
export const ARTICLES: Article[] = [
    {
        id: 'art-01',
        title: 'Keutamaan 10 Hari Pertama Ramadhan',
        excerpt: 'Fase pertama bulan Ramadhan adalah fase Rahmat (kasih sayang Allah).',
        content: `Bulan Ramadhan dibagi menjadi tiga fase: sepuluh hari pertama adalah rahmat, sepuluh hari kedua adalah ampunan (maghfirah), dan sepuluh hari terakhir adalah pembebasan dari api neraka (itqun minan nar). Manfaatkan hari-hari awal ini untuk memperbanyak doa meminta kasih sayang Allah.`,
        author: 'Ust. Hanan Attaki (Summary)',
        readTime: '2 min',
        category: 'Kultum',
        image: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?auto=format&fit=crop&q=80&w=200'
    },
    {
        id: 'art-02',
        title: 'Tips Menjaga Hidrasi Saat Puasa',
        excerpt: 'Strategi minum air 2-4-2 agar tubuh tetap bugar seharian.',
        content: `Kunci agar tidak dehidrasi bukan minum banyak sekaligus saat sahur, tapi membaginya. Rumus 2-4-2: 2 gelas saat berbuka, 4 gelas di malam hari (dicicil), dan 2 gelas saat sahur. Hindari minuman diuretik seperti teh dan kopi berlebihan saat sahur.`,
        author: 'Dr. Zaidul Akbar (Tips)',
        readTime: '3 min',
        category: 'Kesehatan',
        image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=200'
    },
    {
        id: 'art-03',
        title: 'Sedekah di Bulan Ramadhan',
        excerpt: 'Pahala sedekah dilipatgandakan di bulan suci ini.',
        content: `Rasulullah SAW adalah orang yang paling dermawan, dan beliau lebih dermawan lagi di bulan Ramadhan. Sedekah tidak harus berupa uang besar, memberi iftar (buka puasa) walau hanya seteguk air atau sebutir kurma pun mendapat pahala seperti orang yang berpuasa tersebut.`,
        author: 'Redaksi',
        readTime: '2 min',
        category: 'Fiqih',
        image: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=200'
    }
];
