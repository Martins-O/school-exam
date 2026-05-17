'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import toast from 'react-hot-toast';

interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  startTime: string | null;
  endTime: string | null;
  questionCount: number;
}

export default function DashboardPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    api.get('/student/exams')
      .then((res) => {
        setExams(res.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Unauthorized Access');
        setLoading(false);
        router.push('/login');
      });
  }, [router]);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="cbt-header">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border-2 border-brand-gold">
              <svg className="w-7 h-7 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="flex flex-col border-l border-white/20 pl-4">
              <span className="text-sm font-black uppercase tracking-widest text-brand-gold">Candidate Portal</span>
              <span className="text-[10px] font-bold opacity-70">Unified Data Node</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-black uppercase tracking-tight">{user?.name}</span>
              <span className="text-[10px] font-bold text-brand-gold/80 block uppercase tracking-widest">STUDENT</span>
            </div>
            <button 
              onClick={handleLogout}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-black/20"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-10 flex items-center justify-between border-b-2 border-slate-200 pb-6">
              <h1 className="text-2xl font-black text-brand-green uppercase tracking-tight">Active Assignments</h1>
              <span className="bg-slate-200 px-3 py-1 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest">
                {exams.length} NODE(S) AVAILABLE
              </span>
            </div>

            <div className="space-y-6">
              {exams.length === 0 ? (
                <div className="portal-card p-20 text-center border-dashed">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active nodes detected in the queue.</p>
                </div>
              ) : (
                exams.map((exam) => (
                  <div key={exam.id} className="portal-card p-1 items-stretch group">
                    <div className="bg-white p-8 rounded-lg flex flex-col md:flex-row items-center gap-8">
                      <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                        📄
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2 group-hover:text-brand-green transition-colors">{exam.title}</h3>
                        <p className="text-slate-500 text-sm font-medium mb-4">{exam.description || 'No additional instructions provided.'}</p>
                        <div className="flex flex-wrap justify-center md:justify-start gap-4">
                          <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-md text-[10px] font-black uppercase tracking-widest border border-blue-100">
                            ⏱️ {exam.durationMinutes} MINUTES
                          </span>
                          <span className="px-3 py-1 bg-green-50 text-brand-green rounded-md text-[10px] font-black uppercase tracking-widest border border-green-100">
                            ❓ {exam.questionCount} QUESTIONS
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/exam/${exam.id}`)}
                        className="w-full md:w-auto px-10 py-4 bg-brand-green text-white font-black rounded-xl hover:bg-green-800 transition-all shadow-xl shadow-green-900/20 uppercase text-xs tracking-widest"
                      >
                        Launch Test
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="portal-card p-8 bg-brand-green text-white relative overflow-hidden">
               <div className="relative z-10">
                <h4 className="font-black uppercase tracking-widest text-xs text-brand-gold mb-4">Official Warning</h4>
                <p className="text-sm font-medium leading-relaxed opacity-90">
                  Participation in examination malpractice leads to automatic disqualification and potential prosecution. Ensure all browser windows other than this portal are closed.
                </p>
               </div>
               <div className="absolute -bottom-8 -right-8 opacity-10 text-9xl">⚖️</div>
            </div>

            <div className="portal-card p-8">
              <h4 className="font-black uppercase tracking-widest text-xs text-slate-400 mb-6 border-b border-slate-100 pb-4">Profile Synchronization</h4>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-tighter">Biometric Link</span>
                  <span className="font-black text-emerald-500 uppercase">ACTIVE</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500 uppercase tracking-tighter">Session Key</span>
                  <span className="font-black text-slate-300 font-mono">0x4F...7E2</span>
                </div>
              </div>
               <Link href="/results" className="mt-8 block w-full py-4 border-2 border-slate-100 text-slate-600 text-center rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">
                 View Past Results
               </Link>
               <Link href="/transcripts" className="mt-4 block w-full py-4 border-2 border-slate-100 text-slate-600 text-center rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all">
                 View Transcripts
               </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
