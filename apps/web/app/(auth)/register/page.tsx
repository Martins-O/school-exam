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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/register', { name, email, password });
      const loginRes = await api.post('/auth/login', { email, password });
      const token = loginRes.data.accessToken;
      document.cookie = `cbt_token=${token}; path=/; max-age=28800`;
      setAuth(loginRes.data.user, token);
      toast.success('Registration successful!');
      router.push('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Registration failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-blue-600/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-[20%] left-[20%] w-[30%] h-[30%] bg-emerald-600/10 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-md w-full relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
              C
            </div>
            <span className="text-2xl font-extrabold tracking-tight">CBT Platform</span>
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-white">Create Account</h1>
          <p className="text-slate-400 mt-2">Join the modern testing standard</p>
        </div>

        <div className="glass-card p-8">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm text-center">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                placeholder="John Doe"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                placeholder="you@school.edu"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                placeholder="•••••••• (Min. 8 chars)"
                required
                minLength={8}
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-slate-950 font-bold py-4 rounded-xl hover:bg-slate-200 transition-all shadow-xl shadow-white/5 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isLoading ? 'CREATING ACCOUNT...' : 'REGISTER ACCOUNT'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-500 font-bold hover:underline underline-offset-4">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
