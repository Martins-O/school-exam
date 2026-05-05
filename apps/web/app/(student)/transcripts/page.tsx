'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';

interface Transcript {
  id: string;
  studentId: string;
  student?: { name: string; email: string };
  generatedBy?: { name: string };
  periodStart: string;
  periodEnd: string | null;
  results: {
    submissionId: string;
    examTitle: string;
    score: number;
    totalMarks: number;
    percentage: number;
    status: string;
    submittedAt: string;
  }[];
  averageScore: number;
  comments: string | null;
  isFinalized: boolean;
  createdAt: string;
}

export default function StudentTranscriptsPage() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    api.get(`/transcripts/student/${user.id}`)
      .then((res) => {
        setTranscripts(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100">
      <header className="cbt-header">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border-b-2 border-slate-300">
              <svg className="w-5 h-5 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight flex items-center gap-2">
              CBT Exam <span className="text-xs font-bold text-brand-gold/80 block uppercase tracking-widest border-l border-white/20 pl-4 mt-1">My Transcripts</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest text-white/80 hover:text-brand-gold transition-colors">BACK TO DASHBOARD</Link>
            <Link href="/results" className="text-[10px] font-black uppercase tracking-widest text-white/80 hover:text-brand-gold transition-colors">VIEW RESULTS</Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2">Academic Transcripts</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{transcripts.length} DOCUMENT(S) AVAILABLE</p>
        </div>

        {transcripts.length === 0 ? (
          <div className="portal-card p-20 text-center border-dashed">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No transcripts generated yet.</p>
            <p className="text-[10px] text-slate-300 mt-2">Your transcripts will appear here once an administrator generates them.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {transcripts.map((t) => (
              <div key={t.id} className="portal-card bg-white overflow-hidden relative">
                {t.isFinalized && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
                    Finalized
                  </div>
                )}
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic Period</p>
                      <p className="text-sm font-bold text-slate-700">
                        {new Date(t.periodStart).toLocaleDateString()} — {t.periodEnd ? new Date(t.periodEnd).toLocaleDateString() : 'Present'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Score</p>
                      <p className={`text-4xl font-black tabular-nums ${
                        t.averageScore >= 70 ? 'text-brand-green' : t.averageScore >= 50 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {Math.round(t.averageScore)}%
                      </p>
                    </div>
                  </div>

                  {t.comments && (
                    <div className="bg-green-50 border border-green-100 p-4 rounded-xl mb-6">
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Comments</p>
                      <p className="text-sm font-medium text-green-800">{t.comments}</p>
                    </div>
                  )}

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
                          <th className="px-4 py-3">Exam</th>
                          <th className="px-4 py-3 text-center">Score</th>
                          <th className="px-4 py-3 text-center">Percentage</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3 text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {t.results.map((r) => (
                          <tr key={r.submissionId}>
                            <td className="px-4 py-3 font-bold text-slate-700">{r.examTitle}</td>
                            <td className="px-4 py-3 text-center font-mono text-xs">{r.score}/{r.totalMarks}</td>
                            <td className="px-4 py-3 text-center font-black text-sm">{Math.round(r.percentage)}%</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                r.status === 'submitted' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-xs text-slate-400">
                              {new Date(r.submittedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-6 flex justify-between items-center pt-6 border-t border-slate-100">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                      Generated: {new Date(t.createdAt).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Print
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
