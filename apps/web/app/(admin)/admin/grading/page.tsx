'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface PendingSubmission {
  submissionId: string;
  examTitle: string;
  studentName: string;
  studentEmail: string;
  score: number;
  totalMarks: number;
  pendingCount: number;
  totalCount: number;
  submittedAt: string;
}

interface TheoryQuestion {
  id: string;
  questionText: string;
  maxWordCount?: number | null;
  passageText?: string | null;
  studentAnswer: string;
  currentScore: number | null;
  currentFeedback: string;
}

interface SubmissionDetail {
  submissionId: string;
  examTitle: string;
  studentName: string;
  studentEmail: string;
  status: string;
  gradingStatus: string;
  score: number;
  totalMarks: number;
  finalScore: number | null;
  theoryQuestions: TheoryQuestion[];
}

export default function GradingDashboardPage() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingSubmission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [grades, setGrades] = useState<Record<string, { score: number; feedback: string }>>({});

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      const res = await api.get('/admin/grading/pending');
      setPending(res.data);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const openSubmission = async (submissionId: string) => {
    try {
      const res = await api.get(`/admin/grading/${submissionId}`);
      setSelectedSubmission(res.data);
      const initialGrades: Record<string, { score: number; feedback: string }> = {};
      for (const q of res.data.theoryQuestions) {
        initialGrades[q.id] = {
          score: q.currentScore ?? 0,
          feedback: q.currentFeedback || '',
        };
      }
      setGrades(initialGrades);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load submission');
    }
  };

  const handleSubmitGrades = async () => {
    if (!selectedSubmission) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/grading/${selectedSubmission.submissionId}/bulk-grade`, {
        grades,
      });
      toast.success('Grading submitted successfully');
      setSelectedSubmission(null);
      setGrades({});
      loadPending();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit grades');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (selectedSubmission) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <header className="cbt-header">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <button
              onClick={() => setSelectedSubmission(null)}
              className="text-[10px] font-black uppercase tracking-[0.3em] text-white hover:text-brand-gold transition-colors flex items-center gap-2"
            >
              <span>←</span> Back to Grading Queue
            </button>
            <span className="text-sm font-black uppercase tracking-widest text-brand-gold">Manual Grading Terminal</span>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-12">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{selectedSubmission.examTitle}</h1>
                <p className="text-sm text-slate-500 font-bold">{selectedSubmission.studentName} ({selectedSubmission.studentEmail})</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objective Score</p>
                <p className="text-3xl font-black text-slate-800">{selectedSubmission.score} / {selectedSubmission.totalMarks}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {selectedSubmission.theoryQuestions.map((q, idx) => (
              <div key={q.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-purple-50 border-b border-purple-100 px-8 py-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">{idx + 1}</span>
                    <div>
                      <h3 className="font-bold text-purple-900">{q.questionText}</h3>
                      {q.currentScore !== null && q.currentScore > 0 && (
                        <span className="text-xs text-purple-600 font-bold">Previously graded: {q.currentScore}</span>
                      )}
                    </div>
                  </div>
                </div>

                {q.passageText && (
                  <div className="px-8 py-4 bg-amber-50 border-b border-amber-100">
                    <p className="text-xs font-bold text-amber-700 uppercase mb-2">Passage:</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{q.passageText}</p>
                  </div>
                )}

                <div className="px-8 py-6 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Student Answer</p>
                  <div 
                    className="prose prose-sm max-w-none bg-slate-50 rounded-xl p-6 border border-slate-200 min-h-[100px]"
                    dangerouslySetInnerHTML={{ __html: q.studentAnswer || '<em class="text-slate-400">No answer provided</em>' }}
                  />
                  {q.maxWordCount && (
                    <p className="text-xs text-slate-400 mt-2">Max word count: {q.maxWordCount}</p>
                  )}
                </div>

                <div className="px-8 py-6 bg-slate-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Score</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={grades[q.id]?.score || 0}
                        onChange={(e) => setGrades({ ...grades, [q.id]: { ...grades[q.id], score: parseInt(e.target.value) || 0, feedback: grades[q.id]?.feedback || '' } })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-6 py-4 text-slate-800 font-mono text-lg focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Feedback (Optional)</label>
                      <input
                        type="text"
                        value={grades[q.id]?.feedback || ''}
                        onChange={(e) => setGrades({ ...grades, [q.id]: { ...grades[q.id], score: grades[q.id]?.score || 0, feedback: e.target.value } })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-6 py-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                        placeholder="e.g. Good effort, but missing key points..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 flex gap-4">
            <button
              onClick={handleSubmitGrades}
              disabled={submitting}
              className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black rounded-xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95 uppercase text-sm tracking-widest"
            >
              {submitting ? 'Submitting...' : 'Submit All Grades'}
            </button>
            <button
              onClick={() => setSelectedSubmission(null)}
              className="px-12 py-4 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-xl hover:bg-slate-50 transition-all uppercase text-sm tracking-widest"
            >
              Cancel
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100">
      <header className="cbt-header">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border-b-2 border-slate-300">
              <svg className="w-5 h-5 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight flex items-center gap-2">
              CBT Exam <span className="text-xs font-bold text-brand-gold/80 block uppercase tracking-widest border-l border-white/20 pl-4 mt-1">Grading</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="text-[10px] font-black uppercase tracking-widest hover:text-brand-gold transition-colors">BACK TO DASHBOARD</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2">Theory Grading Queue</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{pending.length} SUBMISSIONS PENDING MANUAL REVIEW</p>
        </div>

        <div className="portal-card overflow-hidden bg-white rounded-2xl shadow-sm border border-slate-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 border-b border-slate-200">
                <th className="px-8 py-6">Candidate Identity</th>
                <th className="px-8 py-6">Examination Terminal</th>
                <th className="px-8 py-6 text-center">Objective Score</th>
                <th className="px-8 py-6 text-center">Theory Progress</th>
                <th className="px-8 py-6 text-right">Submitted</th>
                <th className="px-8 py-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pending.map((s) => (
                <tr key={s.submissionId} className="hover:bg-purple-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-black text-slate-800 group-hover:text-brand-green transition-colors uppercase tracking-tight">{s.studentName}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase">{s.studentEmail}</div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-600 uppercase tracking-tighter">
                    {s.examTitle}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="text-xl font-black text-slate-800 tabular-nums">
                      {s.score} <span className="text-slate-300 text-sm">/</span> {s.totalMarks}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-32 bg-slate-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all" 
                          style={{ width: `${s.totalCount > 0 ? ((s.totalCount - s.pendingCount) / s.totalCount) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-500 tracking-widest">
                        {s.totalCount - s.pendingCount} / {s.totalCount} graded
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right font-mono text-[10px] text-slate-400 uppercase">
                    <div className="font-black text-slate-600">{new Date(s.submittedAt).toLocaleDateString()}</div>
                    <div className="opacity-60">{new Date(s.submittedAt).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      onClick={() => openSubmission(s.submissionId)}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-lg text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-purple-600/20"
                    >
                      Grade Now
                    </button>
                  </td>
                </tr>
              ))}
              {pending.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center text-slate-400 bg-white uppercase tracking-widest font-black text-xs">
                    No submissions pending manual grading.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
