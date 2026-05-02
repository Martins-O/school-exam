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
  const { user, clearAuth } = useAuthStore();

  useEffect(() => {
    api.get('/student/exams')
      .then((res) => {
        setExams(res.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load exams');
        setLoading(false);
      });
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8">
        <div className="max-w-5xl mx-auto space-y-8 animate-pulse">
          <div className="h-10 bg-white/5 rounded-xl w-64"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-white/5 rounded-2xl border border-white/10"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl">C</div>
            <span className="text-xl font-bold">CBT Platform</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/results" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Past Results
            </Link>
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
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Welcome, {user?.name}</h1>
          <p className="text-slate-400">Manage your active exams and review your progress.</p>
        </header>

        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
              Available Exams
            </h2>
          </div>

          {exams.length === 0 ? (
            <div className="glass-card p-20 text-center text-slate-500 rounded-3xl border-dashed">
              <p className="text-lg">No active exams assigned to you at the moment.</p>
              <p className="text-sm mt-2 text-slate-600">Check back later or contact your administrator.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exams.map((exam) => (
                <div 
                  key={exam.id} 
                  className="glass-card group p-6 hover:bg-white/[0.07] transition-all hover:-translate-y-1"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl">
                      📝
                    </div>
                    <div className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-[10px] font-bold uppercase tracking-widest">
                      {exam.durationMinutes} MIN
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{exam.title}</h3>
                  {exam.description && (
                    <p className="text-slate-400 text-sm mb-6 line-clamp-2 leading-relaxed">{exam.description}</p>
                  )}

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="opacity-50">Questions:</span>
                      <span className="font-semibold text-slate-300">{exam.questionCount} Total</span>
                    </div>
                    {exam.startTime && (
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="opacity-50">Window:</span>
                        <span className="font-semibold text-slate-300">
                          {new Date(exam.startTime).toLocaleDateString()} - {exam.endTime ? new Date(exam.endTime).toLocaleDateString() : 'Always Open'}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => router.push(`/exam/${exam.id}`)}
                    className="w-full py-4 bg-white text-slate-950 font-bold rounded-xl hover:bg-blue-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-white/5"
                  >
                    ENTER EXAM ROOM
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
