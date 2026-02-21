# Dokumen Spesifikasi Aplikasi: Ramadhan Tracker 2026

## 1. Ringkasan Aplikasi
**Ramadhan Tracker 2026** adalah aplikasi web progresif (PWA) modern yang dirancang untuk membantu umat Muslim memaksimalkan ibadah selama bulan suci Ramadhan. Aplikasi ini menggabungkan fitur pelacakan ibadah harian, manajemen target Al-Quran, jadwal sholat akurat berbasis lokasi, serta elemen sosial dan gamifikasi untuk menjaga motivasi pengguna.

---

## 2. Fitur Utama Berdasarkan Modul

### A. Dashboard (Beranda)
Pusat informasi utama yang memberikan ringkasan aktivitas pengguna secara real-time.
*   **Countdown Waktu Sholat**: Menghitung mundur waktu menuju sholat berikutnya berdasarkan lokasi pengguna.
*   **Jam Digital Lokal**: Menampilkan waktu saat ini sesuai zona waktu lokasi pengguna (*Timezone Aware*).
*   **Informasi Tanggal Hijriyah**: Menampilkan tanggal Hijriyah yang sinkron dengan pengaturan "Tanggal 1 Ramadhan".
*   **Sistem Level & Gamifikasi**:
    *   **XP & Level**: Pengguna mendapatkan poin (XP) setiap menyelesaikan ibadah.
    *   **Progress Circle**: Visualisasi lingkaran progres menuju level berikutnya.
*   **Statistik Ringkas**:
    *   **Streak**: Jumlah hari berturut-turut menggunakan aplikasi.
    *   **Total Skor**: Akumulasi poin ibadah.
    *   **Status Puasa**: Indikator status puasa hari ini.
*   **Grafik Aktivitas**: Grafik batang yang menampilkan konsistensi penyelesaian tugas ibadah dalam seminggu terakhir.
*   **Leaderboard Preview**: Peringkat teman teratas langsung di halaman depan.
*   **Hadits Harian**: Menampilkan kutipan hadits inspiratif secara acak.

### B. Daily Ibadah Tracker (Pelacak Ibadah)
Fitur untuk mencatat dan memantau kewajiban harian.
*   **Checklist Ibadah**:
    *   **Wajib**: Subuh, Dzuhur, Ashar, Maghrib, Isya.
    *   **Sunnah**: Tarawih, Tahajud, Dhuha, Dzikir.
    *   **Sosial**: Sedekah.
*   **Status Puasa**: Toggle status harian (Puasa / Tidak Puasa / Uzur Syar'i).
*   **Integrasi Waktu Sholat**: Menampilkan jam spesifik di samping nama sholat.
*   **Edit Riwayat (Backdate)**: Kemampuan untuk mengisi atau mengedit data ibadah pada tanggal-tanggal sebelumnya (jika lupa mencatat).
*   **Jadwal Imsakiyah**: Tampilan tabel jadwal sholat sebulan penuh yang responsif.

### C. Quran Progress (Target Khatam)
Manajemen target membaca Al-Quran.
*   **Pencatatan Detail**: Input Juz, Surah, dan Ayat terakhir yang dibaca.
*   **Log Harian**: Input jumlah halaman yang dibaca hari ini.
*   **Kalkulasi Target**: Menghitung sisa halaman yang harus dibaca per hari untuk mencapai target khatam.
*   **Bookmark**: Menyimpan posisi bacaan terakhir.

### D. Doa & Dzikir (Spiritual Companion)
*   **Digital Tasbih**: Penghitung dzikir dengan target (misal: 33x) dan indikator visual.
*   **Kumpulan Doa**: Database doa harian, puasa, dan sholat dengan fitur pencarian.

### E. Social & Community (Fitur Sosial)
Berinteraksi dengan sesama pengguna untuk saling memotivasi.
*   **Friend System**:
    *   Tambah teman via email.
    *   Daftar Permintaan Masuk (Incoming) dan Terkirim (Outgoing).
    *   Terima/Tolak permintaan pertemanan.
*   **Chatting**:
    *   **Direct Message (DM)**: Chat pribadi antar teman.
    *   **Group Chat**: Membuat grup chat dengan memilih anggota dari daftar teman.
    *   **Indikator Pesan**: Status pesan belum dibaca (Bold & Badge).
*   **Leaderboard**: Peringkat skor ibadah antar teman (*Circle*) untuk kompetisi sehat (*Fastabiqul Khairat*).
*   **Profil Teman**: Melihat statistik, level, dan pencapaian teman (jika tidak diprivat).

### E. Profil & Pengaturan (Personalisasi)
*   **Lokasi & Waktu**:
    *   **Auto-Detect GPS**: Mengambil koordinat otomatis.
    *   **Manual Search**: Pencarian kota manual.
    *   **Koreksi Waktu (Ikhtiyat)**: Penyesuaian menit waktu sholat manual.
    *   **Tanggal Mulai Ramadhan**: Pengaturan tanggal 1 Ramadhan (misal: 18/19 Feb 2026).
*   **Personalisasi Tampilan**:
    *   **Tema (Themes)**: 5 Pilihan warna (Gold-Green, Midnight, Earth, dll).
    *   **Bahasa**: Indonesia & Inggris.
*   **Notifikasi & Audio**:
    *   **Adzan Otomatis**: Pemutar audio adzan saat waktu sholat tiba.
    *   **Push Notification**: Notifikasi browser.
*   **Privasi & Keamanan**:
    *   **Privasi Statistik**: Opsi untuk menyembunyikan detail statistik ibadah dari teman (Lock Profile).
    *   **Edit Nama**: Mengubah nama tampilan.

---

## 3. Spesifikasi Teknis (Tech Stack)

### A. Frontend
*   **Framework**: React 18 (Functional Components, Hooks).
*   **Language**: TypeScript (Strict Type Safety).
*   **Build Tool**: Vite (High-performance bundler).
*   **Styling**: Tailwind CSS (Utility-first framework).
*   **Icons**: Google Material Symbols.
*   **Charts**: Recharts (Data visualization).

### B. Backend & Database
*   **Platform**: Firebase (Google Cloud).
*   **Authentication**: Firebase Auth (Google Sign-In & Anonymous/Demo).
*   **Database**: Cloud Firestore (NoSQL, Real-time updates).
    *   Menyimpan data user, progress ibadah, chat, dan relasi teman.

### C. Integrasi API
*   **Prayer Times**: Aladhan API (Perhitungan waktu sholat berdasarkan koordinat & metode kalkulasi).
*   **Geolocation**: Browser Native Geolocation API.

### D. Fitur Unggulan Teknis
*   **PWA (Progressive Web App)**: Dapat diinstal di HP, icon di home screen, tampilan full-screen.
*   **Offline Support**: Caching data jadwal sholat di localStorage.
*   **Real-time Sync**: Chat dan Leaderboard terupdate otomatis tanpa refresh (Firestore Listeners).
*   **Responsive Design**: Tampilan optimal di Mobile, Tablet, dan Desktop.
