'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import Link from 'next/link';

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
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <PortalSpinner size="lg" color="white" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans selection:bg-brand-gold/30 selection:text-white pb-20 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-green/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen"></div>
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-brand-gold/5 blur-[100px] rounded-full mix-blend-screen"></div>
        
        {/* Tech Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
      </div>

      <nav className="relative z-10 border-b border-white/5 bg-white/[0.02] backdrop-blur-3xl sticky top-0">
        <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-gold to-yellow-600 p-[1px]">
               <div className="w-full h-full bg-[#050505] rounded-xl flex items-center justify-center">
                 <span className="font-black text-brand-gold text-lg">A</span>
               </div>
             </div>
             <div>
               <h2 className="text-sm font-black tracking-widest uppercase text-white">APEX Portal</h2>
               <p className="text-[9px] text-brand-gold tracking-[0.2em] uppercase font-bold">Command Center</p>
             </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="h-6 w-[1px] bg-white/10"></div>
            <button
              onClick={() => { clearAuth(); window.location.href = '/login'; }}
              className="px-6 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/40 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0)] hover:shadow-[0_0_15px_rgba(239,68,68,0.15)]"
            >
              Terminate Session
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-16 relative z-10">
        <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-8 group">
          <div className="relative">
            <div className="absolute -left-6 top-2 bottom-2 w-1 bg-gradient-to-b from-brand-green to-transparent rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 bg-white/5 text-slate-300 text-[9px] font-black uppercase tracking-[0.2em] rounded-full border border-white/10 backdrop-blur-md">
                Node {user?.id?.split('-')[0].toUpperCase() || 'MAIN'}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <svg className="w-3 h-3 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {currentDate}
              </span>
            </div>
            <h1 className="text-5xl font-black text-white uppercase tracking-tighter leading-tight drop-shadow-lg">
              Welcome Back,<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-green via-emerald-400 to-brand-green animate-gradient-x">
                {user?.name?.split(' ')[0] || 'Administrator'}
              </span>
            </h1>
            <p className="text-[11px] font-bold text-slate-400 mt-4 uppercase tracking-[0.3em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></span>
              System Overseer Interface — Level 10
            </p>
          </div>
          
          <div className="flex gap-4">
            <Link href="/admin/results" className="px-8 py-4 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300">
              View Results
            </Link>
            <Link href="/admin/exams" className="relative group/btn px-8 py-4 bg-brand-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center shadow-[0_0_20px_rgba(15,81,50,0.4)] hover:shadow-[0_0_30px_rgba(15,81,50,0.6)] hover:-translate-y-1">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-400 to-brand-green opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">Manage Exams</span>
            </Link>
          </div>
        </header>

        {/* Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {[
            { label: 'Candidate Matrix', value: stats.totalStudents, growth: '+12%', color: 'text-brand-green', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]', border: 'border-brand-green/20', bg: 'from-brand-green/20 to-transparent', icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )},
            { label: 'Active Protocols', value: stats.totalExams, growth: 'Stable', color: 'text-indigo-400', glow: 'shadow-[0_0_30px_rgba(99,102,241,0.15)]', border: 'border-indigo-500/20', bg: 'from-indigo-500/20 to-transparent', icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            )},
            { label: 'Live Sessions', value: stats.activeExams, growth: 'LIVE', color: 'text-emerald-400', glow: 'shadow-[0_0_30px_rgba(52,211,153,0.15)]', border: 'border-emerald-500/20', bg: 'from-emerald-500/20 to-transparent', icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            )},
            { label: 'Submissions Audit', value: stats.totalSubmissions, growth: '+1.2k', color: 'text-brand-gold', glow: 'shadow-[0_0_30px_rgba(197,160,89,0.15)]', border: 'border-brand-gold/20', bg: 'from-brand-gold/20 to-transparent', icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            )},
          ].map((item, i) => (
            <div key={i} className={`group relative bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:bg-white/[0.04] transition-all duration-500 hover:-translate-y-2 ${item.glow}`}>
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${item.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              <div className={`absolute top-0 right-0 p-4 opacity-5 translate-x-4 translate-y-[-4] transition-transform duration-700 group-hover:translate-x-2 group-hover:translate-y-[-2] ${item.color}`}>
                <div className="scale-[4]">{item.icon}</div>
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border ${item.border} ${item.color} group-hover:scale-110 transition-transform duration-500`}>
                    {item.icon}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border bg-[#050505]/50 backdrop-blur-md ${item.border} ${item.color}`}>
                    {item.growth}
                  </span>
                </div>
                <p className="text-5xl font-black text-white mb-3 tabular-nums tracking-tighter drop-shadow-md">{item.value.toLocaleString()}</p>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Operation Control Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black uppercase tracking-[0.5em] text-slate-400">Tactical Management</h2>
              <div className="h-[1px] bg-white/10 flex-grow ml-8"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { 
                  href: "/admin/exams", 
                  title: "Exam Foundry", 
                  desc: "Initialize and deploy high-stakes examination protocols.", 
                  icon: "📋", 
                  color: "border-brand-green/30", 
                  hoverColor: "hover:border-brand-green/60",
                  bg: "from-brand-green/10"
                },
                { 
                  href: "/admin/users", 
                  title: "User Directory", 
                  desc: "Manage personnel identity and secure access tokens.", 
                  icon: "🆔", 
                  color: "border-blue-500/30", 
                  hoverColor: "hover:border-blue-500/60",
                  bg: "from-blue-500/10"
                },
                { 
                  href: "/admin/results", 
                  title: "Analytics Node", 
                  desc: "Deep dive into candidate metrics and performance data.", 
                  icon: "📉", 
                  color: "border-brand-gold/30", 
                  hoverColor: "hover:border-brand-gold/60",
                  bg: "from-brand-gold/10"
                },
                { 
                  href: "/admin/grading", 
                  title: "Theory Grading", 
                  desc: "Human-in-the-loop manual evaluation protocols.", 
                  icon: "✍️", 
                  color: "border-purple-500/30", 
                  hoverColor: "hover:border-purple-500/60",
                  bg: "from-purple-500/10"
                },
                { 
                  href: "/admin/classes", 
                  title: "Class Control", 
                  desc: "Orchestrate class hierarchies and teacher deployment.", 
                  icon: "🏫", 
                  color: "border-indigo-500/30", 
                  hoverColor: "hover:border-indigo-500/60",
                  bg: "from-indigo-500/10"
                },
                { 
                  href: "/admin/transcripts", 
                  title: "Credential Sync", 
                  desc: "Generate and finalize authoritative academic records.", 
                  icon: "📜", 
                  color: "border-rose-500/30", 
                  hoverColor: "hover:border-rose-500/60",
                  bg: "from-rose-500/10"
                }
              ].map((link, i) => (
                <Link key={i} href={link.href} className={`group relative bg-white/[0.02] backdrop-blur-md border border-white/5 rounded-3xl overflow-hidden hover:-translate-y-1 transition-all duration-300 ${link.hoverColor}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${link.bg} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <div className="p-8 relative z-10 flex flex-col h-full">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-6 bg-[#050505]/50 border ${link.color} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner`}>
                      {link.icon}
                    </div>
                    <div className="flex-grow">
                      <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 flex items-center gap-2">
                        {link.title}
                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-widest">{link.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-8">
             <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-[0.5em] text-slate-400">Live Status Node</h2>
                <div className="h-[1px] bg-white/10 flex-grow ml-8"></div>
             </div>
             
             <div className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green/10 rounded-bl-full translate-x-8 translate-y-[-8] blur-2xl group-hover:bg-brand-green/20 transition-colors duration-700"></div>
                
                <div className="space-y-8 relative z-10">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-brand-green rounded-full shadow-[0_0_10px_#10B981] animate-pulse"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">API Gateway</span>
                    </div>
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full">Vigilant</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-brand-green rounded-full shadow-[0_0_10px_#10B981] animate-pulse delay-75"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">Encryption Layer</span>
                    </div>
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full">Active</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 bg-brand-green rounded-full shadow-[0_0_10px_#10B981] animate-pulse delay-150"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-200">Sync Pipeline</span>
                    </div>
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 border border-emerald-400/20 px-3 py-1 rounded-full">Nominal</span>
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <div className="bg-[#050505]/50 rounded-2xl p-6 border border-white/5">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-brand-gold drop-shadow-[0_0_8px_rgba(197,160,89,0.5)] text-sm">✦</span>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Automated Cleanup</p>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed italic">
                        "Session expiration protocols are verified every 60 seconds. Unauthorized persistence is terminated to maintain data integrity."
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-300 border border-white/10 hover:border-white/20 active:scale-95 flex items-center justify-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Open System Console
                    </button>
                  </div>
                </div>
             </div>

             <div className="bg-gradient-to-br from-brand-gold/10 to-transparent border border-brand-gold/20 rounded-3xl p-8 relative overflow-hidden backdrop-blur-xl group">
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,rgba(197,160,89,0.15),transparent_50%)]"></div>
                <div className="relative z-10">
                  <h3 className="text-[10px] font-black text-brand-gold uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-ping"></span>
                    Quick Alert
                  </h3>
                  <p className="text-[11px] font-bold text-slate-300 leading-relaxed">
                    There are currently <span className="text-white font-black">{stats.activeExams} active sessions</span> on the gateway. Monitor the <Link href="/admin/results" className="text-brand-gold hover:text-brand-gold-light underline underline-offset-4 decoration-brand-gold/30 transition-colors">Live Audit</Link> for real-time submission data.
                  </p>
                </div>
             </div>
          </div>
        </div>
      </main>
      
      <footer className="max-w-7xl mx-auto px-8 py-8 mt-12 border-t border-white/5 text-center relative z-10">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">Institutional Command Matrix v4.2.0 © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

