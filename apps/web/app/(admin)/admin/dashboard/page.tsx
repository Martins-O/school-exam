'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';

import PortalSpinner from '@/components/ui/PortalSpinner';

interface Stats {
  totalStudents: number;
  totalExams: number;
  totalSubmissions: number;
  activeExams: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalExams: 0,
    totalSubmissions: 0,
    activeExams: 0,
  });
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    const d = new Date();
    setCurrentDate(d.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }));
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/results/stats');
      setStats(res.data);
      setLoading(false);
    } catch {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => { loadStats(); }, [loadStats]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <PortalSpinner size="lg" color="green" />
    </div>
  );

  return (
    <div className="min-h-screen bg-transparent font-sans selection:bg-brand-green/20 selection:text-brand-green-dark pb-20">
      <AdminHeader 
        subtitle="Command Center"
        actions={
          <div className="flex items-center gap-6">
            <div className="h-10 w-[1px] bg-white/10"></div>
            <button
              onClick={() => { clearAuth(); window.location.href = '/login'; }}
              className="px-6 py-2.5 bg-red-600/20 hover:bg-red-600 text-white border border-red-500/30 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl"
            >
              Terminate Session
            </button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-8 py-16">
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-brand-gold text-brand-green text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm">
                Node {user?.id?.split('-')[0].toUpperCase() || 'MAIN'}
              </span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{currentDate}</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">
              Welcome Back, <span className="text-brand-green">{user?.name?.split(' ')[0]}</span>
            </h1>
            <p className="text-xs font-bold text-slate-400 mt-4 uppercase tracking-[0.3em]">System Overseer Interface — Secure Access Level 10</p>
          </div>
          
          <div className="flex gap-4">
            <Link href="/admin/results" className="px-8 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-brand-green hover:border-brand-green/20 transition-all shadow-sm">
              View Results
            </Link>
            <Link href="/admin/exams" className="px-8 py-4 bg-brand-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-2xl shadow-green-900/20 active:scale-95 flex items-center">
              Manage Exams
            </Link>
          </div>
        </header>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {[
            { label: 'Candidate Matrix', value: stats.totalStudents, growth: '+12%', color: 'text-brand-green', bg: 'bg-green-50/50', icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )},
            { label: 'Active Protocols', value: stats.totalExams, growth: 'Stable', color: 'text-indigo-600', bg: 'bg-indigo-50/50', icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            )},
            { label: 'Live Sessions', value: stats.activeExams, growth: 'LIVE', color: 'text-emerald-500', bg: 'bg-emerald-50/50', icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            )},
            { label: 'Submissions Audit', value: stats.totalSubmissions, growth: '+1.2k', color: 'text-brand-gold', bg: 'bg-amber-50/50', icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            )},
          ].map((item, i) => (
            <div key={i} className="premium-card p-10 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 p-4 opacity-5 translate-x-4 translate-y-[-4] transition-transform group-hover:translate-x-2 group-hover:translate-y-[-2] ${item.color}`}>
                <div className="scale-[4]">{item.icon}</div>
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}>
                    {item.icon}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-white shadow-sm ${item.color}`}>
                    {item.growth}
                  </span>
                </div>
                <p className="text-5xl font-black text-slate-900 mb-2 tabular-nums tracking-tighter">{item.value.toLocaleString()}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Operation Control Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-10">
            <div className="flex items-center justify-between ml-2">
              <h2 className="text-xs font-black uppercase tracking-[0.5em] text-slate-400">Tactical Management</h2>
              <div className="h-[1px] bg-slate-100 flex-grow ml-8"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { 
                  href: "/admin/exams", 
                  title: "Exam Foundry", 
                  desc: "Initialize and deploy high-stakes examination protocols.", 
                  icon: "📋", 
                  color: "border-brand-green", 
                  iconBg: "bg-green-50 text-brand-green" 
                },
                { 
                  href: "/admin/users", 
                  title: "User Directory", 
                  desc: "Manage personnel identity and secure access tokens.", 
                  icon: "🆔", 
                  color: "border-blue-500", 
                  iconBg: "bg-blue-50 text-blue-600" 
                },
                { 
                  href: "/admin/results", 
                  title: "Analytics Node", 
                  desc: "Deep dive into candidate metrics and performance data.", 
                  icon: "📉", 
                  color: "border-brand-gold", 
                  iconBg: "bg-amber-50 text-brand-gold" 
                },
                { 
                  href: "/admin/grading", 
                  title: "Theory Grading", 
                  desc: "Human-in-the-loop manual evaluation protocols.", 
                  icon: "✍️", 
                  color: "border-purple-500", 
                  iconBg: "bg-purple-50 text-purple-600" 
                },
                { 
                  href: "/admin/classes", 
                  title: "Class Control", 
                  desc: "Orchestrate class hierarchies and teacher deployment.", 
                  icon: "🏫", 
                  color: "border-indigo-500", 
                  iconBg: "bg-indigo-50 text-indigo-600" 
                },
                { 
                  href: "/admin/transcripts", 
                  title: "Credential Sync", 
                  desc: "Generate and finalize authoritative academic records.", 
                  icon: "📜", 
                  color: "border-rose-500", 
                  iconBg: "bg-rose-50 text-rose-600" 
                }
              ].map((link, i) => (
                <Link key={i} href={link.href} className="premium-card group hover:translate-y-[-6px]">
                  <div className={`h-1 absolute top-0 left-8 right-8 bg-transparent group-hover:bg-current transition-colors ${link.color}`}></div>
                  <div className="p-10 flex flex-col h-full">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-8 group-hover:scale-110 transition-all ${link.iconBg}`}>
                      {link.icon}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2 flex items-center gap-2">
                        {link.title}
                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </h3>
                      <p className="text-[11px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">{link.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-10">
             <div className="flex items-center justify-between ml-2">
                <h2 className="text-xs font-black uppercase tracking-[0.5em] text-slate-400">Live Status Node</h2>
                <div className="h-[1px] bg-slate-100 flex-grow ml-8"></div>
             </div>
             
             <div className="premium-card p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/5 rounded-bl-full translate-x-8 translate-y-[-8]"></div>
                
                <div className="space-y-10 relative z-10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 bg-brand-green rounded-full animate-pulse shadow-[0_0_10px_#00602F]"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">API Gateway</span>
                    </div>
                    <span className="text-[9px] font-black text-brand-green uppercase tracking-widest bg-green-50 px-3 py-1 rounded">Vigilant</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 bg-brand-green rounded-full animate-pulse shadow-[0_0_10px_#00602F]"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Encryption Layer</span>
                    </div>
                    <span className="text-[9px] font-black text-brand-green uppercase tracking-widest bg-green-50 px-3 py-1 rounded">Active</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 bg-brand-green rounded-full animate-pulse shadow-[0_0_10px_#00602F]"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Sync Pipeline</span>
                    </div>
                    <span className="text-[9px] font-black text-brand-green uppercase tracking-widest bg-green-50 px-3 py-1 rounded">Nominal</span>
                  </div>

                  <div className="pt-10 border-t border-slate-100">
                    <div className="bg-slate-50/80 rounded-2xl p-8 border-2 border-slate-100">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xl">⚠️</span>
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Automated Cleanup Node</p>
                      </div>
                      <p className="text-[11px] font-bold text-slate-500 leading-relaxed italic">
                        "Session expiration protocols are verified every 60 seconds. Unauthorized persistence is automatically terminated to maintain database integrity."
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl shadow-slate-900/10 active:scale-95">
                      Open System Console
                    </button>
                  </div>
                </div>
             </div>

             <div className="premium-card p-10 bg-brand-gold/5 border-brand-gold/20">
                <h3 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.4em] mb-4">Quick Alert</h3>
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  There are currently <span className="text-brand-green font-black">{stats.activeExams} active sessions</span> on the gateway. Monitor the <Link href="/admin/results" className="underline font-black text-slate-900">Live Audit</Link> for real-time submission data.
                </p>
             </div>
          </div>
        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto px-8 py-12 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Institutional Command Matrix v4.2.0 © 2024</p>
      </footer>
    </div>
  );
}
