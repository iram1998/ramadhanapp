import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';

export const Login = () => {
  const { loginWithGoogle, loginAsDemo, loading, error, clearError } = useAuth();
  const isDemo = !auth;
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        const port = window.location.port;
        setHostname(port ? `${host}:${port}` : host);
    }
  }, []);

  const handleCopyDomain = (domainToCopy: string) => {
    if (!domainToCopy) return;
    navigator.clipboard.writeText(domainToCopy);
    alert(`Domain disalin: ${domainToCopy}\n\nTempel di Firebase Console > Authentication > Settings > Authorized Domains`);
  };

  // Check if likely running in AI Studio preview or typical sandbox
  const isPreviewEnv = hostname.includes('googleusercontent.com') || hostname.includes('webcontainer') || hostname === '';

  return (
    <div className="min-h-screen bg-[#F0FDF4] text-[#064E3B] font-display flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#059669]/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D97706]/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>

      <div className="w-full max-w-sm z-10 flex flex-col items-center text-center animate-fade-in">
        
        {/* Logo / Icon */}
        <div className="size-24 rounded-3xl bg-gradient-to-br from-[#059669] to-[#047857] flex items-center justify-center shadow-xl shadow-[#059669]/20 mb-8 transform rotate-3">
           <span className="material-symbols-outlined text-white text-5xl">mosque</span>
        </div>

        <h1 className="text-3xl font-extrabold mb-2 text-gray-900 tracking-tight">
          Ramadhan Tracker <br/>
          <span className="text-[#059669]">2026</span>
        </h1>
        
        <p className="text-gray-500 mb-8 text-sm leading-relaxed max-w-[260px]">
          Ahlan wa Sahlan. Please sign in to track your ibadah, save your progress, and get daily insights.
        </p>

        {/* ERROR CARD */}
        {error && (
            <div className="w-full bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-left animate-fade-in shadow-sm">
                <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-red-500 mt-0.5">error</span>
                    <div className="flex-1">
                        <p className="font-bold text-red-700 text-sm mb-1">Login Gagal</p>
                        <p className="text-xs text-red-600 mb-2">{error.message}</p>
                        
                        {error.code === 'auth/unauthorized-domain' && (
                            <div className="bg-white/60 rounded-lg p-2 border border-red-100 mt-2">
                                <p className="text-[10px] uppercase font-bold text-red-400 mb-1">Domain Yang Perlu Didaftarkan:</p>
                                <div className="flex items-center gap-2">
                                    <code className="bg-white px-2 py-1 rounded border border-gray-200 text-xs flex-1 truncate font-mono select-all text-red-600">
                                        {error.domain || hostname}
                                    </code>
                                    <button 
                                        onClick={() => handleCopyDomain(error.domain || hostname)}
                                        className="bg-red-100 hover:bg-red-200 text-red-700 text-xs px-2 py-1 rounded font-bold transition-colors"
                                    >
                                        Salin
                                    </button>
                                </div>
                                <p className="text-[9px] text-red-500 mt-1 italic">
                                    Jangan gunakan link aistudio.google.com! Gunakan domain di atas.
                                </p>
                            </div>
                        )}
                    </div>
                    <button onClick={clearError} className="text-gray-400 hover:text-gray-600">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            </div>
        )}

        {/* Action Buttons */}
        {!error ? (
            <div className="w-full space-y-3">
                <button 
                    onClick={loginWithGoogle}
                    disabled={loading}
                    className="w-full bg-white hover:bg-gray-50 text-gray-800 font-bold py-3.5 px-4 rounded-xl border border-gray-200 shadow-lg shadow-gray-200/50 transition-all active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group"
                >
                    {loading ? (
                        <div className="size-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                    ) : (
                        <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l3.66-2.84z" />
                            <path fill="#EA4335" d="M12 4.63c1.61 0 3.06.55 4.21 1.64l3.16-3.16C17.45 1.09 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span>{isDemo ? 'Start Demo (Mock Auth)' : 'Continue with Google'}</span>
                        </>
                    )}
                </button>

                {/* Show Demo button even if no error yet, for users who know preview has issues */}
                {isPreviewEnv && (
                    <button 
                        onClick={loginAsDemo}
                        className="w-full bg-transparent text-[#059669] hover:bg-[#059669]/5 font-bold py-2 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                    >
                        Masuk Mode Demo (Tanpa Login) &rarr;
                    </button>
                )}
            </div>
        ) : (
             <div className="flex flex-col gap-3 w-full">
                 <button 
                    onClick={loginWithGoogle}
                    className="w-full bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary)]/90 font-bold py-3 px-4 rounded-xl shadow-md transition-all active:scale-95"
                >
                    Coba Login Lagi
                </button>
                <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-gray-300"></div>
                    <span className="flex-shrink-0 mx-4 text-xs font-bold text-gray-400 uppercase">Atau</span>
                    <div className="flex-grow border-t border-gray-300"></div>
                </div>
                <button 
                    onClick={loginAsDemo}
                    className="w-full bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 font-bold py-3 px-4 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined text-gray-500">person_off</span>
                    Masuk Mode Demo (Recommended)
                </button>
             </div>
        )}

        {/* DOMAIN INFO FOOTER */}
        <div className="mt-8 pt-6 border-t border-gray-200/50 w-full flex flex-col items-center">
             {isPreviewEnv && (
                 <div className="mb-3 px-3 py-2 bg-yellow-50 text-yellow-800 text-[10px] rounded-lg border border-yellow-200 text-center max-w-[280px]">
                    <span className="font-bold">⚠️ Tips AI Studio:</span><br/>
                    Preview sering memblokir popup Google.<br/>
                    Gunakan <strong>Mode Demo</strong> jika login gagal terus.
                </div>
            )}
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2">
                Domain Aplikasi Ini (Untuk Whitelist):
            </p>
            <div 
                onClick={() => handleCopyDomain(hostname)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg cursor-pointer hover:border-[#059669] hover:shadow-sm transition-all group max-w-full"
            >
                <code className="text-xs font-mono text-gray-600 group-hover:text-[#059669] truncate max-w-[200px]">
                    {hostname || 'Detecting...'}
                </code>
                <span className="material-symbols-outlined text-[12px] text-gray-400 group-hover:text-[#059669]">content_copy</span>
            </div>
            <p className="mt-2 text-[10px] text-gray-400 text-center max-w-[280px]">
                Salin domain di atas (BUKAN aistudio.google.com) ke <br/> 
                <strong>Firebase Console &gt; Auth &gt; Settings &gt; Authorized Domains</strong>
            </p>
        </div>
      </div>
    </div>
  );
};