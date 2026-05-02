'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';

interface Summary {
  totalExams: number;
  totalQuestions: number;
  totalSubmissions: number;
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    Promise.all([
      api.get('/exams'),
      api.get('/admin/results'),
    ])
      .then(([examsRes, resultsRes]) => {
        const exams = examsRes.data;
        const submissions = resultsRes.data;
        const totalQuestions = exams.reduce((sum: number, e: { questionCount?: number }) => sum + (e.questionCount || 0), 0);
        setSummary({
          totalExams: exams.length,
          totalQuestions,
          totalSubmissions: submissions.length,
        });
      })
      .catch(() => router.push('/login'));
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl uppercase tracking-tighter">Admin</div>
            <span className="text-xl font-bold tracking-tight">CBT System Control</span>
          </div>
          <div className="flex items-center gap-8">
            <Link href="/admin/exams" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Exams</Link>
            <Link href="/admin/results" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Results</Link>
            <Link href="/admin/users" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Users</Link>
            <button 
              onClick={handleLogout}
              className="text-sm font-bold text-red-400 hover:text-red-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Command Center</h1>
          <p className="text-slate-400 font-medium">Overview of system health and academic performance across the platform.</p>
        </header>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Exams</span>
                <span className="text-2xl">📋</span>
              </div>
              <p className="text-4xl font-black text-white">{summary.totalExams}</p>
              <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 w-[60%]"></div>
              </div>
            </div>
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Total Questions</span>
                <span className="text-2xl">❓</span>
              </div>
              <p className="text-4xl font-black text-white">{summary.totalQuestions}</p>
              <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 w-[45%]"></div>
              </div>
            </div>
            <div className="glass-card p-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Submissions</span>
                <span className="text-2xl">📥</span>
              </div>
              <p className="text-4xl font-black text-white">{summary.totalSubmissions}</p>
              <div className="mt-4 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 w-[75%]"></div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <button
            onClick={() => router.push('/admin/exams')}
            className="group glass-card p-8 text-left hover:bg-white/[0.07] transition-all hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-blue-600/20 rounded-2xl flex items-center justify-center text-3xl mb-6 text-blue-500 group-hover:scale-110 transition-transform">
              ⚙️
            </div>
            <h3 className="text-2xl font-bold mb-3">Exam Management</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Create, curate, and publish academic examinations. Manage question banks and set session parameters.
            </p>
            <div className="inline-flex items-center gap-2 text-blue-400 text-sm font-bold">
              OPEN MANAGEMENT PORTAL <span className="text-lg">→</span>
            </div>
          </button>
          
          <button
            onClick={() => router.push('/admin/results')}
            className="group glass-card p-8 text-left hover:bg-white/[0.07] transition-all hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-purple-600/20 rounded-2xl flex items-center justify-center text-3xl mb-6 text-purple-500 group-hover:scale-110 transition-transform">
              📊
            </div>
            <h3 className="text-2xl font-bold mb-3">Academic Insights</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Review student performance metrics. Export results and analyze success rates across all published exams.
            </p>
            <div className="inline-flex items-center gap-2 text-purple-400 text-sm font-bold">
              VIEW ANALYTICS DASHBOARD <span className="text-lg">→</span>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/users')}
            className="group glass-card p-8 text-left hover:bg-white/[0.07] transition-all hover:-translate-y-1"
          >
            <div className="w-14 h-14 bg-emerald-600/20 rounded-2xl flex items-center justify-center text-3xl mb-6 text-emerald-500 group-hover:scale-110 transition-transform">
              👥
            </div>
            <h3 className="text-2xl font-bold mb-3">User Directory</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Manage student enrollments and instructor credentials. Invite new users and control platform access.
            </p>
            <div className="inline-flex items-center gap-2 text-emerald-400 text-sm font-bold">
              MANAGE USER ACCOUNTS <span className="text-lg">→</span>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
