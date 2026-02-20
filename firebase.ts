import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// ------------------------------------------------------------------
// PENTING: Ganti konfigurasi di bawah ini dengan data asli dari 
// Firebase Console > Project Settings > General > Your Apps > Config
// ------------------------------------------------------------------
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA4QeMGwdonEOs7GOql9g7--0K0oZ0gI1o",
  authDomain: "ramadantracker-c0ba8.firebaseapp.com",
  projectId: "ramadantracker-c0ba8",
  storageBucket: "ramadantracker-c0ba8.firebasestorage.app",
  messagingSenderId: "749815738077",
  appId: "1:749815738077:web:b94ca4e6a6f7ec54a67534",
  measurementId: "G-BJ3GJS4FXK"
};

let app;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

try {
  // Inisialisasi Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("GAGAL MENGHUBUNGKAN FIREBASE:", error);
  // Jangan gunakan mode demo otomatis agar error terlihat jelas
}

export { auth, db, googleProvider };