'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import Link from 'next/link';

interface Stats {
  myExams: number;
  myQuestions: number;
  mySubmissions: number;
  assignedClasses: number;
}

interface ClassItem {
  id: string;
  name: string;
  description: string | null;
}

interface Submission {
  submissionId: string;
  examTitle: string;
  studentName: string;
  studentEmail: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: string;
  submittedAt: string;
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<Stats>({
    myExams: 0,
    myQuestions: 0,
    mySubmissions: 0,
    assignedClasses: 0,
  });
  const [myClasses, setMyClasses] = useState<ClassItem[]>([]);
  const [recentSubmissions, setRecentSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, classesRes, resultsRes] = await Promise.all([
        api.get('/teacher/stats'),
        api.get('/teacher/classes'),
        api.get('/teacher/results'),
      ]);
      setStats(statsRes.data);
      setMyClasses(classesRes.data);
      setRecentSubmissions(resultsRes.data.slice(0, 20));
      setLoading(false);
    } catch {
      router.push('/login');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100">
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
              <span className="text-sm font-black uppercase tracking-widest text-brand-gold">Teacher Portal</span>
              <span className="text-[10px] font-bold opacity-70">Classroom Management</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-black uppercase tracking-tight">{user?.name}</span>
              <span className="text-[10px] font-bold text-brand-gold block uppercase tracking-widest leading-none mt-1">TEACHER</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
               👤
            </div>
            <button
              onClick={() => { clearAuth(); window.location.href = '/login'; }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg text-[10px] uppercase tracking-widest transition-all"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-12 flex items-center gap-4">
          My Classroom
          <span className="h-1 bg-brand-green flex-grow rounded-full opacity-10"></span>
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            { label: 'My Exams', value: stats.myExams, color: 'brand-green', icon: '📝', link: '/teacher/exams' },
            { label: 'Questions Created', value: stats.myQuestions, color: 'blue-600', icon: '📋', link: '/teacher/exams' },
            { label: 'Student Submissions', value: stats.mySubmissions, color: 'emerald-500', icon: '📁', link: '/teacher/results' },
            { label: 'Assigned Classes', value: stats.assignedClasses, color: 'amber-500', icon: '🏫', link: '/teacher/classes' },
          ].map((item, i) => (
            <Link key={i} href={item.link} className="portal-card group p-1 block hover:translate-x-1 transition-all">
              <div className="bg-white p-8 rounded-lg">
                <div className="flex justify-between items-start mb-6">
                  <span className="text-2xl">{item.icon}</span>
                  <span className={`text-[10px] font-black uppercase tracking-widest text-${item.color}`}>Live</span>
                </div>
                <p className="text-4xl font-black text-slate-800 mb-2 tabular-nums">{item.value.toLocaleString()}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Recent Submissions */}
          <div className="lg:col-span-2">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-4 ml-2">RECENT SUBMISSIONS</h2>
            <div className="portal-card bg-white overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 border-b border-slate-200">
                    <th className="px-6 py-4">Student</th>
                    <th className="px-6 py-4">Exam</th>
                    <th className="px-6 py-4">Score</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSubmissions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16 text-center text-slate-400">
                        <p className="text-sm font-black uppercase tracking-widest">No submissions yet.</p>
                      </td>
                    </tr>
                  ) : (
                    recentSubmissions.map((sub) => (
                      <tr key={sub.submissionId} className="hover:bg-green-50/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm text-slate-800">{sub.studentName}</div>
                          <div className="text-[10px] text-slate-400">{sub.studentEmail}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600">{sub.examTitle}</td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-black ${
                            sub.percentage >= 70 ? 'text-green-600' : sub.percentage >= 50 ? 'text-amber-500' : 'text-red-500'
                          }`}>
                            {sub.score}/{sub.totalMarks}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">({sub.percentage}%)</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                            sub.status === 'submitted'
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                              : sub.status === 'timed_out'
                                ? 'bg-red-50 text-red-600 border-red-200'
                                : 'bg-amber-50 text-amber-600 border-amber-200'
                          }`}>
                            {sub.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-slate-400">
                          {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Assigned Classes */}
          <div>
            <div className="flex items-center justify-between mb-4 ml-2">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">MY CLASSES</h2>
              {myClasses.length > 0 && (
                <Link href="/teacher/exams" className="text-[10px] font-black uppercase tracking-widest text-brand-green hover:underline">
                  Create Exam
                </Link>
              )}
            </div>
            <div className="space-y-3">
              {myClasses.length === 0 ? (
                <div className="portal-card p-8 bg-white text-center">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No classes assigned yet.</p>
                  <p className="text-[10px] font-bold text-slate-300 mt-1">Contact an administrator to be assigned to a class.</p>
                </div>
              ) : (
                myClasses.map((cls) => (
                  <div key={cls.id} className="portal-card p-6 bg-white">
                    <div className="font-black text-sm text-slate-800">{cls.name}</div>
                    {cls.description && (
                      <div className="text-[10px] text-slate-400 font-bold mt-1">{cls.description}</div>
                    )}
                  </div>
                ))
              )}
              <Link href="/teacher/timetable" className="mt-4 block w-full py-4 bg-cyan-50 text-cyan-700 text-center rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-cyan-100 transition-all border border-cyan-200">
                📅 Exam Timetable
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
