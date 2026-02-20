import React from 'react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { THEMES } from '../constants';

// Fixed: Defined before usage
const SettingItem = ({ icon, label, toggle, value, defaultChecked }: { icon: string, label: string, toggle?: boolean, value?: string, defaultChecked?: boolean }) => (
    <div className="flex items-center justify-between p-4 bg-[var(--color-card)] rounded-xl shadow-sm border border-gray-100/50">
        <div className="flex items-center gap-3">
            <span className="material-symbols-outlined opacity-60">{icon}</span>
            <span className="font-medium">{label}</span>
        </div>
        {toggle ? (
            <div className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--color-primary)]"></div>
            </div>
        ) : (
            <div className="flex items-center gap-1 opacity-60">
                <span className="text-sm">{value}</span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
            </div>
        )}
    </div>
);

export const Profile = () => {
  const { theme, setThemeId, score } = useApp();
  const { user, logout } = useAuth();

  return (
    <div className="animate-fade-in pb-12">
        <header className="p-6 bg-[var(--color-card)] shadow-sm">
             <h1 className="text-2xl font-bold mb-6">Profile & Settings</h1>
             <div className="flex items-center gap-4">
                <div className="size-16 rounded-full border-4 border-[var(--color-primary)]/20 overflow-hidden">
                    <img src={user?.photoUrl || "https://api.dicebear.com/7.x/avataaars/svg?seed=Abdullah"} alt="Profile" className="w-full h-full object-cover" />
                </div>
                <div>
                    <h2 className="text-xl font-bold">{user?.name}</h2>
                    <p className="opacity-60 text-sm">{user?.email}</p>
                    <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                        Level 12 • {score} pts
                    </div>
                </div>
             </div>
        </header>

        <main className="p-6 space-y-8">
            {/* Theme Switcher */}
            <section>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[var(--color-primary)]">palette</span>
                    App Theme
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {THEMES.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setThemeId(t.id)}
                            className={`flex items-center p-3 rounded-xl border transition-all ${theme.id === t.id ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]' : 'border-gray-200 dark:border-gray-700 bg-[var(--color-card)]'}`}
                        >
                            <div className="flex gap-2 mr-4">
                                <div className="size-6 rounded-full shadow-sm" style={{ backgroundColor: t.colors.primary }}></div>
                                <div className="size-6 rounded-full shadow-sm" style={{ backgroundColor: t.colors.secondary }}></div>
                            </div>
                            <span className="font-medium flex-1 text-left">{t.name}</span>
                            {theme.id === t.id && <span className="material-symbols-outlined text-[var(--color-primary)]">check_circle</span>}
                        </button>
                    ))}
                </div>
            </section>
            
            {/* Other Settings Mock */}
            <section className="space-y-3">
                <h3 className="font-bold text-lg mb-2">General</h3>
                <SettingItem icon="notifications" label="Notifications" toggle />
                <SettingItem icon="location_on" label="Location Services" toggle defaultChecked />
                <SettingItem icon="translate" label="Language" value="Bahasa Indonesia" />
            </section>

            {/* Logout */}
            <button 
                onClick={logout}
                className="w-full py-4 text-red-500 font-bold bg-red-50 hover:bg-red-100 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
                <span className="material-symbols-outlined">logout</span>
                Sign Out
            </button>
        </main>
    </div>
  );
};