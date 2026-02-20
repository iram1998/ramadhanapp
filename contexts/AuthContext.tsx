import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: { code: string; message: string; domain?: string } | null;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: () => void;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message: string; domain?: string } | null>(null);

  // Helper to map Firebase user to our App User type
  const mapFirebaseUser = (fbUser: FirebaseUser): User => ({
    id: fbUser.uid,
    name: fbUser.displayName || 'User',
    email: fbUser.email || '',
    photoUrl: fbUser.photoURL || '',
  });

  const demoUser: User = {
    id: 'mock-user-123',
    name: 'Guest User',
    email: 'guest@ramadhantracker.com',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
  };

  useEffect(() => {
    // Check if previously logged in as demo
    const isDemo = localStorage.getItem('ramadhan_demo_mode');
    if (isDemo === 'true') {
        setUser(demoUser);
        setLoading(false);
        return;
    }

    if (auth) {
      // Real Firebase Listener
      const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          setUser(mapFirebaseUser(fbUser));
          setError(null);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    setError(null);

    if (auth && googleProvider) {
        try {
            await signInWithPopup(auth, googleProvider);
            // State update is handled efficiently by the onAuthStateChanged listener
        } catch (err: any) {
            console.error("Firebase login failed detailed:", err);
            
            let errorData = {
                code: err.code || 'unknown',
                message: err.message || 'Terjadi kesalahan saat login.',
                domain: undefined
            };

            if (err.code === 'auth/unauthorized-domain') {
                errorData.message = 'Domain aplikasi ini belum diizinkan di Firebase.';
                errorData.domain = window.location.hostname;
            } else if (err.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
                errorData.message = 'API Key Firebase tidak valid. Cek konfigurasi firebase.ts.';
            } else if (err.code === 'auth/popup-closed-by-user') {
                errorData.message = 'Login dibatalkan.';
            }

            setError(errorData);
            setLoading(false);
        }
    } else {
        setError({
            code: 'config_missing',
            message: 'Firebase belum dikonfigurasi dengan benar. Cek file firebase.ts.',
        });
        setLoading(false);
    }
  };

  const loginAsDemo = () => {
      localStorage.setItem('ramadhan_demo_mode', 'true');
      setUser(demoUser);
      setError(null);
  };

  const logout = async () => {
    localStorage.removeItem('ramadhan_demo_mode');
    
    if (auth) {
        try {
            await signOut(auth);
        } catch (e) {
            console.error("Logout error", e);
        }
    }
    setUser(null);
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ user, loading, error, loginWithGoogle, loginAsDemo, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};