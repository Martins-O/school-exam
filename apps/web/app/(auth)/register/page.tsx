'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setIsLoading(true);

    try {
      const res = await api.post('/auth/register', { name, email, password });
      document.cookie = `cbt_token=${res.data.accessToken}; path=/; max-age=28800`;
      setAuth(res.data.user, res.data.accessToken);
      toast.success('Account created successfully');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100 selection:text-green-900">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-10 h-10 bg-jamb-green rounded flex items-center justify-center font-black text-white text-xl border-b-2 border-green-900">
              J
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tighter leading-tight text-jamb-green">JAMB</span>
              <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400">Portal Security Layer</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Node Secure</span>
          </div>
        </div>
      </div>

      <main className="flex items-center justify-center py-20 px-6">
        <div className="max-w-md w-full">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2 uppercase">Candidate Registration</h1>
            <p className="text-slate-500 font-medium tracking-wide">Create your authorized examination profile.</p>
          </div>

          <div className="portal-card p-10 bg-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-jamb-green">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">👤</span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-jamb-green/40 transition-all font-bold"
                    placeholder="e.g. John Doe"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-jamb-green">
                  Candidate Email
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">📧</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-jamb-green/40 transition-all font-bold"
                    placeholder="e.g. cand@jamb.gov.ng"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-jamb-green">
                  Profile Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔑</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-jamb-green/40 transition-all font-bold"
                    placeholder="••••••••••••"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-jamb-green">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔒</span>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl pl-12 pr-6 py-4 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-jamb-green/40 transition-all font-bold"
                    placeholder="••••••••••••"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-jamb-green hover:bg-green-800 text-white font-black py-5 rounded-xl transition-all shadow-xl shadow-green-900/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none uppercase text-xs tracking-[0.2em]"
                >
                  {isLoading ? 'Creating Profile...' : 'Register Account'}
                </button>
              </div>

              <div className="pt-4 text-center">
                <p className="text-sm font-bold text-slate-500">
                  Already have an account?{' '}
                  <Link href="/login" className="text-jamb-green font-black hover:underline">
                    Sign In
                  </Link>
                </p>
              </div>
            </form>
          </div>

          <div className="mt-12 text-center">
            <Link href="/" className="text-[10px] font-black text-jamb-green uppercase tracking-[0.3em] hover:underline">
              ← Return to Landing Page
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
