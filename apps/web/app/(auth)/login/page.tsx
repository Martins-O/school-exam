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
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen w-full bg-slate-50 grid grid-cols-1 lg:grid-cols-[45%_55%] font-sans selection:bg-brand-green/20 selection:text-brand-green-dark">
      {/* Left Decoration Panel (Brand & Context) */}
      <div className="hidden lg:flex bg-[var(--brand-green-dark)] relative flex-col justify-between overflow-hidden shadow-2xl z-10 border-r border-brand-green-light/20">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-brand-green via-transparent to-brand-green-dark"></div>
        <div className="absolute -top-[20%] -left-[20%] w-[60%] h-[60%] bg-brand-gold/10 blur-[100px] rounded-full pointer-events-none"></div>
        
        <div className="relative z-10 p-12 xl:p-16">
          <Link href="/" className="flex items-center gap-5 group inline-flex">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border-b-[6px] border-brand-gold shadow-[0_0_30px_rgba(197,160,89,0.3)] group-hover:-translate-y-1 group-hover:shadow-[0_0_40px_rgba(197,160,89,0.5)] transition-all duration-300 shrink-0">
              <span className="text-4xl font-black text-brand-green-dark">A</span>
            </div>
            <div className="flex flex-col">
              <span className="text-3xl font-black tracking-tighter leading-none text-white uppercase drop-shadow-md">APEX Portal</span>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-gold mt-2 drop-shadow-md">Unified Examination System</span>
            </div>
          </Link>
        </div>

        <div className="relative z-10 p-12 xl:p-16 text-white space-y-8 mt-auto">
           <h2 className="text-5xl xl:text-6xl font-black tracking-tighter leading-[1.05] uppercase drop-shadow-lg">Secure<br/>Authentication<br/>Node</h2>
           <p className="text-[13px] font-bold text-brand-green-light max-w-sm leading-relaxed uppercase tracking-widest drop-shadow-sm">
             This gateway is strictly for authorized candidates and administration personnel. All entry attempts are heavily monitored and audited by the central server.
           </p>
           <div className="flex items-center gap-3 bg-black/30 backdrop-blur-md border border-white/10 px-6 py-4 rounded-xl w-max mt-8 shadow-inner shadow-black/50">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.8)]"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Gateway Encrypted & Active</span>
          </div>
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="flex flex-col justify-center items-center relative py-12 px-6 sm:px-12 lg:px-16 xl:px-24 bg-background overflow-y-auto">
        
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="lg:hidden absolute top-8 left-8 flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-green rounded-xl flex items-center justify-center border-b-4 border-brand-green-dark shadow-md">
              <span className="text-2xl font-black text-white">A</span>
            </div>
            <div className="flex flex-col">
               <span className="text-xl font-black tracking-tighter text-brand-green-dark uppercase leading-none">APEX Portal</span>
               <span className="text-[8px] font-black tracking-[0.2em] text-brand-gold uppercase mt-1">Unified System</span>
            </div>
        </div>

        <div className="w-full max-w-[420px] mt-20 lg:mt-0 relative z-10">
          <div className="mb-12 text-center lg:text-left">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-green/5 border border-brand-green/10 text-3xl mb-8 shadow-sm">
               🔐
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4 uppercase">Academic Login</h1>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Enter your registered profile credentials to access the secure examination environment.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="floating-label-group">
               <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-green transition-colors z-10">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
               </div>
               <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="institutional-input pl-14 pt-9 pb-5"
                  placeholder="student@apex.edu.ng"
                  required
               />
               <label className="!left-14">Candidate Email Address</label>
            </div>

            <div className="floating-label-group">
               <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-green transition-colors z-10">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
               </div>
               <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="institutional-input pl-14 pr-14 pt-9 pb-5 tracking-widest"
                  placeholder=" "
                  required
               />
               <label className="!left-14">Profile Passkey</label>
               <button
                 type="button"
                 onClick={() => setShowPassword(!showPassword)}
                 className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-400 hover:text-brand-green transition-colors z-10 focus:outline-none"
                 title={showPassword ? 'Hide passkey' : 'Show passkey'}
               >
                 {showPassword ? (
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                   </svg>
                 ) : (
                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                   </svg>
                 )}
               </button>
                <Link href="/forgot-password" className="absolute -bottom-6 right-2 text-[9px] font-black text-brand-gold hover:text-brand-gold-light uppercase tracking-widest transition-colors z-10">Forgot Passkey?</Link>
            </div>
            
            <div className="pt-8">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary py-5 rounded-2xl text-[11px] font-black tracking-[0.2em] shadow-[0_15px_30px_-10px_rgba(15,81,50,0.5)] hover:shadow-[0_20px_40px_-10px_rgba(15,81,50,0.7)] disabled:opacity-70 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-3">
                    <PortalSpinner size="sm" color="white" />
                    <span>Validating Secure Token...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span>Initiate Secure Session</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </div>
                )}
              </button>
            </div>

            <div className="p-6 bg-amber-50/80 border-2 border-amber-100/50 rounded-2xl mt-8 flex gap-4 items-start shadow-sm">
               <div className="text-amber-500 text-2xl drop-shadow-sm">⚠️</div>
               <p className="text-[9px] font-black text-amber-700/80 uppercase tracking-widest leading-[1.6]">
                 Notice: All login attempts, including IP and device footprint, are recorded. Malicious attempts will trigger automatic disqualification and account lock.
               </p>
            </div>
          </form>

          <div className="mt-16 text-center lg:text-left">
            <Link href="/" className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 border-2 border-slate-100 text-slate-400 hover:text-brand-green hover:bg-brand-green/5 hover:border-brand-green/30 transition-all active:scale-90" title="Return to Main Gateway">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
