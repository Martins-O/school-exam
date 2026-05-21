'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';

interface ClassItem {
  id: string;
  name: string;
}

interface ScheduledExam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  startTime: string;
  endTime: string | null;
  questionCount: number;
  targetClasses: ClassItem[];
}

interface TodayExam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  startTime: string | null;
  endTime: string | null;
  questionCount: number;
}

interface CompletedExam {
  id: string;
  examId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  submittedAt: string;
  status: string;
}

interface TimetableData {
  upcoming: ScheduledExam[];
  today: TodayExam[];
  completed: CompletedExam[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

function groupByDate(exams: ScheduledExam[]): Record<string, ScheduledExam[]> {
  const groups: Record<string, ScheduledExam[]> = {};
  for (const exam of exams) {
    const dateKey = new Date(exam.startTime).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(exam);
  }
  const sorted: Record<string, ScheduledExam[]> = {};
  Object.keys(groups)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .forEach(k => { sorted[k] = groups[k]; });
  return sorted;
}

export default function StudentTimetablePage() {
  const [data, setData] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const clearAuth = useAuthStore(s => s.clearAuth);

  useEffect(() => {
    api.get('/timetable/student')
      .then(res => { setData(res.data); setLoading(false); })
      .catch(() => { setLoading(false); router.push('/login'); });
  }, [router]);

  const handleLogout = () => { clearAuth(); router.push('/login'); };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const groupedUpcoming = data?.upcoming ? groupByDate(data.upcoming) : {};

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
              <span className="text-sm font-black uppercase tracking-widest text-brand-gold">Exam Schedule</span>
              <span className="text-[10px] font-bold opacity-70">Personal Timetable</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-[10px] font-black text-white/70 hover:text-white uppercase tracking-widest transition-all">
              Dashboard
            </Link>
            <button onClick={handleLogout} className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg text-[10px] uppercase tracking-widest transition-all shadow-lg">
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Today's Exams */}
        {data?.today && data.today.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <span className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white text-sm">⚡</span>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Available Now</h2>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200">
                {data.today.length} exam(s)
              </span>
            </div>
            <div className="space-y-4">
              {data.today.map(exam => (
                <div key={exam.id} className="portal-card p-6 bg-white flex flex-col md:flex-row md:items-center gap-6 border-l-4 border-l-emerald-400">
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1">{exam.title}</h3>
                    <p className="text-xs text-slate-500 mb-3">{exam.description}</p>
                    <div className="flex gap-4 text-[10px] font-bold text-slate-400">
                      <span>⏱️ {exam.durationMinutes} min</span>
                      <span>📝 {exam.questionCount} questions</span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/exam/${exam.id}`)}
                    className="px-8 py-4 bg-brand-green text-white font-black rounded-xl hover:bg-green-800 transition-all shadow-xl shadow-green-900/20 uppercase text-xs tracking-widest shrink-0"
                  >
                    Launch Test
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Exams */}
        {data?.upcoming && data.upcoming.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-4 mb-8">
              <span className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">📅</span>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Upcoming Exams</h2>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-200">
                {data.upcoming.length} scheduled
              </span>
            </div>
            {Object.entries(groupedUpcoming).map(([dateKey, exams]) => (
              <div key={dateKey} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-sm">📆</div>
                  <div>
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-tight">{formatDate(dateKey)}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{exams.length} exam(s)</p>
                  </div>
                </div>
                <div className="space-y-3 ml-2">
                  {exams.map(exam => (
                    <div key={exam.id} className="portal-card p-5 bg-white border-l-4 border-l-blue-300 flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <h4 className="font-black text-slate-800 uppercase tracking-tight">{exam.title}</h4>
                        {exam.targetClasses?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {exam.targetClasses.map(c => (
                              <span key={c.id} className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black uppercase tracking-widest text-slate-500">{c.name}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-black text-blue-600">{formatTime(exam.startTime)}</div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Start Time</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-bold text-slate-500">{exam.durationMinutes} min</div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Duration</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed Exams */}
        {data?.completed && data.completed.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <span className="w-8 h-8 bg-slate-400 rounded-full flex items-center justify-center text-white text-sm">✓</span>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Completed</h2>
              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-200">
                {data.completed.length} exam(s)
              </span>
            </div>
            <div className="space-y-3">
              {data.completed.map(exam => (
                <div key={exam.id} className="portal-card p-5 bg-white flex flex-col md:flex-row md:items-center gap-4 opacity-80">
                  <div className="flex-1">
                    <h3 className="font-black text-slate-700 uppercase tracking-tight">{exam.examTitle}</h3>
                    <div className="text-[10px] font-bold text-slate-400 mt-1">
                      Taken: {exam.submittedAt ? formatDate(exam.submittedAt) : '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="text-right">
                      <div className={`text-lg font-black ${exam.percentage !== null && exam.percentage >= 50 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {exam.percentage !== null ? `${exam.percentage}%` : '—'}
                      </div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Score</div>
                    </div>
                    <Link
                      href={`/results/${exam.id}`}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!data?.upcoming || data.upcoming.length === 0) &&
         (!data?.today || data.today.length === 0) &&
         (!data?.completed || data.completed.length === 0) && (
          <div className="portal-card p-20 text-center border-dashed">
            <p className="text-sm font-black text-slate-300 uppercase tracking-widest mb-2">No exams found</p>
            <p className="text-[10px] font-bold text-slate-400">Your timetable is empty. Check back later.</p>
          </div>
        )}
      </main>
    </div>
  );
}
