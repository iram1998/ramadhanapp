# Dokumentasi Produk: Ramadhan Tracker 2026

## Tentang Aplikasi
**Ramadhan Tracker 2026** adalah aplikasi pendamping ibadah komprehensif yang dirancang untuk membantu umat Muslim memaksimalkan produktivitas ibadah selama bulan suci Ramadhan. Aplikasi ini menggabungkan elemen *tracking* (pencatatan), *gamification* (permainan), dan *social connection* (sosial) untuk memotivasi pengguna agar konsisten dalam beribadah.

Dengan antarmuka yang modern, bersih, dan mudah digunakan, aplikasi ini bertujuan untuk mengubah rutinitas ibadah menjadi kebiasaan yang menyenangkan dan terukur, sekaligus mempererat tali silaturahmi melalui fitur komunitas.

---

## Fitur Unggulan (Key Features)

### 1. 📊 Pelacak Ibadah Harian (Daily Worship Tracker)
Sistem pencatatan terintegrasi untuk berbagai aktivitas ibadah:
*   **Sholat Wajib & Sunnah**: Checklist sholat 5 waktu, Tarawih, Tahajud, dan Dhuha.
*   **Status Puasa**: Pencatatan status harian (Puasa, Tidak, atau Uzur/Haid).
*   **Sedekah & Kebaikan**: Poin khusus untuk aktivitas sosial.
*   **Sistem Poin (Pahala Score)**: Setiap ibadah yang dikerjakan memberikan poin untuk memotivasi pengguna.

### 2. 🏆 Gamifikasi & Pencapaian (Gamification)
Membuat ibadah lebih semangat dengan sistem penghargaan:
*   **Badges & Achievements**: Buka lencana unik (seperti "Ahli Subuh", "Khatam Quran", "Full Streak") berdasarkan pencapaian tertentu.
*   **Leveling System**: Naik level berdasarkan total skor ibadah yang dikumpulkan.
*   **Streak Counter**: Menghitung hari berturut-turut dalam menjalankan ibadah tanpa putus.

### 3. 🤝 Fitur Sosial & Chat (Community)
Beribadah bersama teman dan keluarga:
*   **Leaderboard Teman**: Bandingkan progres ibadah dengan teman dalam *circle* Anda.
*   **Real-time Chat**: Kirim pesan pribadi (DM) atau buat **Grup Chat** untuk saling mengingatkan.
*   **Friend Request System**: Tambah teman menggunakan email dengan sistem persetujuan.
*   **Profil Teman**: Lihat statistik dan pencapaian teman (jika diizinkan).

### 4. 🕌 Jadwal Sholat & Adzan Otomatis
*   **Auto-Detect Location**: Jadwal sholat akurat berdasarkan lokasi GPS pengguna.
*   **Manual Location**: Opsi pencarian kota manual untuk pengguna yang bepergian.
*   **Audio Adzan**: Notifikasi suara adzan otomatis saat waktu sholat tiba.
*   **Koreksi Waktu (Ikhtiyat)**: Pengaturan manual untuk menyesuaikan waktu dengan masjid setempat.

---

## Fitur Lainnya

*   **📖 Quran Progress Tracker**: Catat progres tadarus (Juz, Surah, Ayat) dan target khatam.
*   **📿 Digital Dzikir Counter**: Tasbih digital untuk menghitung dzikir harian.
*   **📅 History & Grafik**: Lihat riwayat ibadah hari-hari sebelumnya (bisa diisi mundur/backdate).
*   **🎨 Tema Visual**: Pilihan tema warna (Gold-Green, Midnight Blue, Earth, dll) sesuai selera.
*   **🌐 Multi-bahasa**: Dukungan penuh Bahasa Indonesia dan Bahasa Inggris.
*   **🔒 Kontrol Privasi**: Opsi "Privasi Statistik" untuk menyembunyikan detail ibadah dari orang lain.
*   **📱 PWA (Progressive Web App)**: Dapat diinstal langsung ke *home screen* HP tanpa melalui App Store/Play Store dan mendukung akses offline terbatas.

---

## Tech Stack (Teknologi yang Digunakan)

Aplikasi ini dibangun menggunakan teknologi web modern yang menjamin performa cepat, ringan, dan skalabilitas tinggi.

### Frontend
*   **Language**: [TypeScript](https://www.typescriptlang.org/) - Untuk keamanan tipe data dan kode yang lebih robust.
*   **Framework**: [React 18](https://react.dev/) - Library UI untuk membangun antarmuka yang interaktif.
*   **Build Tool**: [Vite](https://vitejs.dev/) - Untuk proses development yang super cepat dan build produksi yang optimal.
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework untuk desain yang responsif dan custom.

### Backend & Services
*   **Platform**: [Firebase](https://firebase.google.com/) (Backend-as-a-Service).
*   **Authentication**: Firebase Auth - Untuk login aman menggunakan Google Account.
*   **Database**: Cloud Firestore - Database NoSQL real-time untuk menyimpan data user, chat, dan leaderboard.
*   **Hosting**: Containerized Environment (Docker/Nginx).

### Libraries & Tools Pendukung
*   **Icons**: Google Material Symbols.
*   **Date/Time**: Native JavaScript Date & Intl API (tanpa library berat seperti moment.js).
*   **Geolocation**: Browser Geolocation API.
*   **PWA**: Service Workers & Web Manifest.

---

*Dokumen ini dibuat otomatis berdasarkan versi pengembangan terakhir Ramadhan Tracker 2026.*
