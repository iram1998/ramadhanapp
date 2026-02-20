import React, { useState } from 'react';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './screens/Dashboard';
import { Tracker } from './screens/Tracker';
import { Quran } from './screens/Quran';
import { Dua } from './screens/Dua';
import { Profile } from './screens/Profile';
import { Login } from './screens/Login';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
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
      case 'profile': return <Profile />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderScreen()}
    </Layout>
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