import React from 'react';
import { useApp } from '../contexts/AppContext';

export const Tracker = () => {
  const { tasks, toggleTask, fastingStatus, setFastingStatus } = useApp();

  const wajibs = tasks.filter(t => t.category === 'wajib');
  const sunnahs = tasks.filter(t => t.category === 'sunnah');
  
  const completedCount = wajibs.filter(t => t.completed).length;

  return (
    <div className="animate-fade-in pb-12">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[var(--color-bg)]/80 backdrop-blur-md px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-6">
                <button className="p-2 -ml-2 rounded-full hover:bg-[var(--color-primary)]/10 transition-colors">
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight">Daily Ibadah</h1>
                <button className="p-2 -mr-2 rounded-full hover:bg-[var(--color-primary)]/10 transition-colors">
                    <span className="material-symbols-outlined text-2xl">calendar_month</span>
                </button>
            </div>
            
            {/* Progress Card */}
            <div className="bg-[var(--color-card)] rounded-xl p-4 shadow-sm border border-[var(--color-primary)]/10 flex items-center gap-4">
                <div className="relative size-16 flex items-center justify-center">
                    <svg className="size-16 transform -rotate-90">
                        <circle className="text-[var(--color-primary)]/10" cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" strokeWidth="6"></circle>
                        <circle 
                            className="text-[var(--color-primary)] transition-all duration-1000 ease-out" 
                            cx="32" cy="32" fill="transparent" r="28" stroke="currentColor" 
                            strokeDasharray="175.9" 
                            strokeDashoffset={175.9 - (175.9 * (completedCount / 5))} 
                            strokeWidth="6"
                        ></circle>
                    </svg>
                    <span className="absolute text-sm font-bold">{Math.round((completedCount/5)*100)}%</span>
                </div>
                <div>
                    <p className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wider">Ramadhan Day 1</p>
                    <h2 className="text-lg font-bold">Keep it up!</h2>
                    <p className="text-xs opacity-50">{5 - completedCount} obligatory prayers left</p>
                </div>
            </div>
        </header>

        <main className="px-6 space-y-6">
            {/* Fasting Status */}
            <section>
                <h3 className="text-sm font-bold opacity-50 uppercase tracking-widest mb-3 px-1">Fasting Status</h3>
                <div className="flex h-12 w-full items-center justify-center rounded-xl bg-[var(--color-primary)]/5 p-1 border border-[var(--color-primary)]/10">
                    {['Puasa', 'Tidak', 'Uzur'].map((status) => (
                        <label key={status} className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-lg px-2 text-sm font-semibold transition-all duration-300 ${fastingStatus === status.toLowerCase() ? 'bg-[var(--color-primary)] text-white shadow-md' : 'text-[var(--color-text)] opacity-60 hover:opacity-100'}`}>
                            <span>{status}</span>
                            <input 
                                type="radio" 
                                name="fasting-status" 
                                className="hidden" 
                                checked={fastingStatus === status.toLowerCase()} 
                                onChange={() => setFastingStatus(status.toLowerCase() as any)}
                            />
                        </label>
                    ))}
                </div>
            </section>

            {/* Sholat 5 Waktu */}
            <section>
                <div className="flex justify-between items-end mb-3 px-1">
                    <h3 className="text-sm font-bold opacity-50 uppercase tracking-widest">Sholat 5 Waktu</h3>
                    <span className="text-xs font-medium text-[var(--color-primary)]">{completedCount}/5 Completed</span>
                </div>
                <div className="grid grid-cols-5 gap-3">
                    {wajibs.map((task) => (
                        <div key={task.id} className="flex flex-col items-center gap-2 group">
                            <input 
                                type="checkbox" 
                                id={task.id} 
                                className="hidden peer"
                                checked={task.completed}
                                onChange={() => toggleTask(task.id)}
                            />
                            <label htmlFor={task.id} className="w-full aspect-square flex items-center justify-center rounded-xl border-2 border-[var(--color-primary)]/20 bg-[var(--color-card)] transition-all cursor-pointer peer-checked:bg-[var(--color-primary)] peer-checked:border-[var(--color-primary)] peer-checked:text-white text-[var(--color-primary)] hover:scale-105 active:scale-95">
                                <span className={`material-symbols-outlined text-2xl ${task.completed ? '' : 'filled'}`}>
                                    {task.completed ? 'check' : task.icon}
                                </span>
                            </label>
                            <span className="text-[10px] font-bold uppercase opacity-50">{task.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Sunnah Prayers */}
            <section>
                <h3 className="text-sm font-bold opacity-50 uppercase tracking-widest mb-3 px-1">Sunnah Prayers</h3>
                <div className="space-y-2">
                    {sunnahs.map((task) => (
                        <label key={task.id} className={`flex items-center justify-between p-4 bg-[var(--color-card)] rounded-xl border transition-all cursor-pointer ${task.completed ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-[var(--color-primary)]/10'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`size-10 rounded-lg flex items-center justify-center transition-colors ${task.completed ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                                    <span className="material-symbols-outlined">{task.icon}</span>
                                </div>
                                <span className="font-semibold">{task.label}</span>
                            </div>
                            <div className={`size-6 rounded-md border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'border-[var(--color-primary)]/30'}`}>
                                {task.completed && <span className="material-symbols-outlined text-white text-sm font-bold">check</span>}
                            </div>
                            <input 
                                type="checkbox" 
                                className="hidden"
                                checked={task.completed}
                                onChange={() => toggleTask(task.id)}
                            />
                        </label>
                    ))}
                </div>
            </section>

             {/* Charity / Sedekah */}
             <section>
                <h3 className="text-sm font-bold opacity-50 uppercase tracking-widest mb-3 px-1">Charity</h3>
                {tasks.filter(t => t.category === 'charity').map(task => (
                    <label key={task.id} className="flex items-center gap-4 p-4 bg-[var(--color-secondary)]/10 rounded-xl border border-[var(--color-secondary)]/20 cursor-pointer hover:bg-[var(--color-secondary)]/20 transition-colors">
                        <div className="size-12 rounded-full bg-[var(--color-secondary)] flex items-center justify-center text-white shadow-lg shadow-[var(--color-secondary)]/30">
                            <span className="material-symbols-outlined">volunteer_activism</span>
                        </div>
                        <div className="flex-1">
                            <p className="font-bold">Sedekah Hari Ini</p>
                            <p className="text-xs opacity-60">Spread kindness today</p>
                        </div>
                        <div className={`size-7 rounded-full border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-[var(--color-secondary)] border-[var(--color-secondary)]' : 'border-[var(--color-secondary)]'}`}>
                             {task.completed && <span className="material-symbols-outlined text-white text-sm">check</span>}
                        </div>
                        <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={task.completed} 
                            onChange={() => toggleTask(task.id)}
                        />
                    </label>
                ))}
            </section>
        </main>
    </div>
  );
};