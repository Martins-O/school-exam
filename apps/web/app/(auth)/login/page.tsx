'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import toast from 'react-hot-toast';
import PortalSpinner from '@/components/ui/PortalSpinner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      document.cookie = `cbt_token=${res.data.accessToken}; path=/; max-age=28800`;
      setAuth(res.data.user, res.data.accessToken);
      toast.success('Successfully Authenticated');
      const role = res.data.user.role;
      if (role === 'super_admin' || role === 'administrator') {
        router.push('/admin/dashboard');
      } else if (role === 'teacher') {
        router.push('/teacher/dashboard');
      } else if (role === 'parent') {
        router.push('/parent');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Authentication Failed. Check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/30 flex flex-col font-sans selection:bg-green-100 selection:text-green-900">
      {/* Official Top Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center border-b-4 border-green-950 shadow-md shadow-green-900/10 group-hover:rotate-3 transition-all duration-300">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter leading-none text-brand-green-dark uppercase">CBT Portal</span>
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Security Authentication</span>
            </div>
          </Link>
          <div className="flex items-center gap-3 bg-emerald-50/50 border border-emerald-100 px-4 py-2 rounded-xl">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-emerald-800">Secure Node Online</span>
          </div>
        </div>
      </header>

      {/* Main Authentication Center */}
      <main className="flex-grow flex items-center justify-center py-20 px-6 relative">
        {/* Decorative elements */}
        <div className="absolute top-[10%] left-[20%] w-72 h-72 rounded-full bg-brand-green/5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[20%] w-80 h-80 rounded-full bg-brand-gold/5 blur-3xl pointer-events-none"></div>

        <div className="max-w-md w-full relative z-10">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-3 uppercase">Academic Credentials</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Enter your authorized profile email & keyphrase.</p>
          </div>

          <div className="portal-card glass-card p-10 bg-white/95">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Email Address */}
              <div className="space-y-3">
                <label className="block text-[9px] font-black uppercase tracking-[0.25em] text-brand-green-dark">
                  Candidate Email Address
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400/80 group-focus-within:text-brand-green transition-colors">👤</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400/80 focus:outline-none focus:ring-4 focus:ring-green-50/50 focus:border-brand-green/30 transition-all font-bold text-sm shadow-inner"
                    placeholder="student@cbt.edu.ng"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-3">
                <label className="block text-[9px] font-black uppercase tracking-[0.25em] text-brand-green-dark">
                  Profile Security Password
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400/80 group-focus-within:text-brand-green transition-colors">🔑</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400/80 focus:outline-none focus:ring-4 focus:ring-green-50/50 focus:border-brand-green/30 transition-all font-bold text-sm shadow-inner"
                    placeholder="••••••••••••"
                    required
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-5 rounded-xl text-[10px] font-black tracking-[0.2em] shadow-xl hover:scale-[1.01] active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <PortalSpinner size="sm" color="white" />
                      <span>Validating Security Key...</span>
                    </>
                  ) : (
                    'Establish Secure Session'
                  )}
                </button>
              </div>

              <div className="pt-8 border-t border-slate-100 text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                  Notice: All login attempts are recorded for auditing. Sharing verification keys violates examination regulations and is subject to disciplinary action.
                </p>
              </div>
            </form>
          </div>

          <div className="mt-12 text-center">
            <Link href="/" className="text-[9px] font-black text-brand-green-dark hover:text-brand-green uppercase tracking-[0.25em] transition-colors border-b border-dashed border-brand-green-dark/30 pb-1 hover:border-brand-green">
              ← Return to Main Gateway
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center bg-slate-100/50 border-t border-slate-200/50">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">
          Official Examination Portal &copy; {new Date().getFullYear()} — Secure Endpoint Layer
        </p>
      </footer>
    </div>
  );
}
