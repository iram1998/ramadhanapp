import React, { ReactNode } from 'react';
import { useApp } from '../contexts/AppContext';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Fixed: Defined before usage
const NavButton = ({ icon, label, isActive, onClick }: { icon: string; label: string; isActive: boolean; onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-[var(--color-primary)] scale-110' : 'text-gray-400 hover:text-[var(--color-primary)]/70'}`}
  >
    <span className={`material-symbols-outlined ${isActive ? 'filled' : ''}`}>{icon}</span>
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { theme } = useApp();

  const style = {
    '--color-primary': theme.colors.primary,
    '--color-secondary': theme.colors.secondary,
    '--color-bg': theme.colors.background,
    '--color-card': theme.colors.card,
    '--color-text': theme.colors.text,
    '--color-text-muted': theme.colors.textMuted,
  } as React.CSSProperties;

  return (
    <div style={style} className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] font-display transition-colors duration-500">
      <div className="mx-auto max-w-md bg-[var(--color-bg)] min-h-screen shadow-2xl relative pb-24 overflow-x-hidden">
        {children}

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[var(--color-card)]/90 backdrop-blur-lg border-t border-[var(--color-primary)]/10 px-6 py-3 pb-6 z-50 transition-colors duration-500">
          <div className="flex justify-between items-center">
            <NavButton 
              icon="home" 
              label="Home" 
              isActive={activeTab === 'dashboard'} 
              onClick={() => onTabChange('dashboard')} 
            />
            <NavButton 
              icon="task_alt" 
              label="Tracker" 
              isActive={activeTab === 'tracker'} 
              onClick={() => onTabChange('tracker')} 
            />
            <NavButton 
              icon="menu_book" 
              label="Quran" 
              isActive={activeTab === 'quran'} 
              onClick={() => onTabChange('quran')} 
            />
            <NavButton 
              icon="auto_stories" 
              label="Doa" 
              isActive={activeTab === 'doa'} 
              onClick={() => onTabChange('doa')} 
            />
             <NavButton 
              icon="person" 
              label="Profile" 
              isActive={activeTab === 'profile'} 
              onClick={() => onTabChange('profile')} 
            />
          </div>
        </nav>
      </div>
    </div>
  );
};