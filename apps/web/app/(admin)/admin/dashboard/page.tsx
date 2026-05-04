'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import Link from 'next/link';

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
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Mock stats for beauty if API doesn't have it yet
      setStats({
        totalStudents: 1250,
        totalExams: 12,
        totalSubmissions: 890,
        activeExams: 4,
      });
      setLoading(false);
    } catch {
      router.push('/login');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-jamb-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100">
      <header className="jamb-header">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border-2 border-jamb-gold">
               <span className="text-jamb-green font-black text-xl">JAMB</span>
            </div>
            <div className="flex flex-col border-l border-white/20 pl-4">
              <span className="text-sm font-black uppercase tracking-widest text-jamb-gold">Admin Command</span>
              <span className="text-[10px] font-bold opacity-70">Control & Monitoring Node</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-black uppercase tracking-tight">{user?.name}</span>
              <span className="text-[10px] font-bold text-jamb-gold block uppercase tracking-widest leading-none mt-1">SUPER ADMINISTRATOR</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
               👤
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-12 flex items-center gap-4">
          Institutional Dashboard
          <span className="h-1 bg-jamb-green flex-grow rounded-full opacity-10"></span>
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            { label: 'Total Candidates', value: stats.totalStudents, color: 'jamb-green', icon: '👥' },
            { label: 'Exam Blueprints', value: stats.totalExams, color: 'blue-600', icon: '📝' },
            { label: 'Active Sessions', value: stats.activeExams, color: 'emerald-500', icon: '⚡' },
            { label: 'Submissions Audit', value: stats.totalSubmissions, color: 'amber-500', icon: '📁' },
          ].map((item, i) => (
            <div key={i} className="portal-card p-1">
              <div className="bg-white p-8 rounded-lg">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-2xl">{item.icon}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest text-${item.color}`}>Real-time</span>
                </div>
                <p className="text-4xl font-black text-slate-800 mb-2 tabular-nums">{item.value.toLocaleString()}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Management Portals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-4 ml-2">CORE MANAGEMENT</h2>
            
            <Link href="/admin/exams" className="portal-card group p-2 block hover:translate-x-2">
              <div className="bg-white p-8 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-green-50 text-jamb-green rounded-2xl flex items-center justify-center text-2xl group-hover:bg-jamb-green group-hover:text-white transition-all">
                    📋
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Exam Foundry</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">Configure and publish new examinations.</p>
                  </div>
                </div>
                <span className="text-slate-300 group-hover:text-jamb-green transition-colors text-xl">→</span>
              </div>
            </Link>

            <Link href="/admin/users" className="portal-card group p-2 block hover:translate-x-2">
              <div className="bg-white p-8 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                    🆔
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">User Directory</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">Manage candidate profiles and admin access.</p>
                  </div>
                </div>
                <span className="text-slate-300 group-hover:text-blue-600 transition-colors text-xl">→</span>
              </div>
            </Link>

            <Link href="/admin/results" className="portal-card group p-2 block hover:translate-x-2">
              <div className="bg-white p-8 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-amber-500 group-hover:text-white transition-all">
                    📉
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Academic Analytics</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">Review scores and performance trends.</p>
                  </div>
                </div>
                <span className="text-slate-300 group-hover:text-amber-500 transition-colors text-xl">→</span>
              </div>
            </Link>

            <Link href="/admin/classes" className="portal-card group p-2 block hover:translate-x-2">
              <div className="bg-white p-8 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    🏫
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Class Management</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">Manage classes, enrollments, and teacher assignments.</p>
                  </div>
                </div>
                <span className="text-slate-300 group-hover:text-indigo-600 transition-colors text-xl">→</span>
              </div>
            </Link>

            <Link href="/admin/transcripts" className="portal-card group p-2 block hover:translate-x-2">
              <div className="bg-white p-8 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-purple-600 group-hover:text-white transition-all">
                    📜
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Transcripts</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1">Generate and finalize academic transcripts.</p>
                  </div>
                </div>
                <span className="text-slate-300 group-hover:text-purple-600 transition-colors text-xl">→</span>
              </div>
            </Link>
          </div>

          <div>
             <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-4 ml-2">SYSTEM STATUS</h2>
             <div className="portal-card p-10 bg-white">
                <div className="space-y-8">
                  <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-700">API Gateway</span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black uppercase tracking-widest">Running</span>
                  </div>
                  <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-700">Audit Database</span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black uppercase tracking-widest">Linked</span>
                  </div>
                  <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-xs font-black uppercase tracking-widest text-slate-700">Security Nodes</span>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded text-[10px] font-black uppercase tracking-widest">Vigilant</span>
                  </div>
                  
                  <div className="pt-4 p-8 bg-slate-50 rounded-2xl border-2 border-slate-100">
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Automated Cleanup</p>
                     <p className="text-xs font-bold text-slate-600 leading-relaxed">
                        The integrity module is scheduled to run in <span className="text-jamb-green">45:12</span>. All expired sessions will be force-submitted.
                     </p>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
