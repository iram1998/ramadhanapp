
import React, { useState } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './screens/Dashboard';
import { Tracker } from './screens/Tracker';
import { Quran } from './screens/Quran';
import { Dua } from './screens/Dua';
import { Profile } from './screens/Profile';
import { Login } from './screens/Login';
import { ChatScreen } from './screens/Chat';

// NEW: Achievement Popup Component
const AchievementPopup = () => {
    const { newlyUnlockedAchievement, closeAchievementPopup } = useApp();

    if (!newlyUnlockedAchievement) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
             <div className="bg-[var(--color-card)] rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl relative border-4 border-yellow-400">
                 {/* Confetti effect background (simplified with CSS radial) */}
                 <div className="absolute inset-0 bg-yellow-400/5 rounded-xl pointer-events-none"></div>

                 <div className="size-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-400 animate-bounce">
                      <span className="material-symbols-outlined text-5xl text-yellow-600">emoji_events</span>
                 </div>
                 
                 <h2 className="text-2xl font-extrabold text-[var(--color-primary)] mb-1 uppercase tracking-tighter transform -rotate-1">Achievement Unlocked!</h2>
                 <p className="text-gray-500 font-bold text-sm uppercase tracking-widest mb-4">Level Up</p>
                 
                 <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100">
                     <h3 className="font-bold text-lg mb-1">{newlyUnlockedAchievement.title}</h3>
                     <p className="text-sm opacity-70">{newlyUnlockedAchievement.description}</p>
                 </div>

                 <button 
                    onClick={closeAchievementPopup}
                    className="w-full bg-[var(--color-primary)] text-white font-bold py-3 rounded-xl shadow-lg hover:scale-105 transition-transform"
                 >
                    MANTAP!
                 </button>
             </div>
        </div>
    );
}

const AppContent = () => {
  const { activeTab, setActiveTab } = useApp();
  const { user, loading } = useAuth();

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
               <div className="size-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          </div>
      );
  }

  if (!user) {
      return <Login />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'tracker': return <Tracker />;
      case 'quran': return <Quran />;
      case 'doa': return <Dua />;
      case 'chat': return <ChatScreen />;
      case 'profile': return <Profile />;
      default: return <Dashboard />;
    }
  };

  return (
    <>
        <AchievementPopup />
        <Layout activeTab={activeTab} onTabChange={setActiveTab}>
          {renderScreen()}
        </Layout>
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
        <AppProvider>
            <AppContent />
        </AppProvider>
    </AuthProvider>
  );
}
