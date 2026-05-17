'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import PortalModal from '@/components/admin/PortalModal';
import PortalSpinner from '@/components/ui/PortalSpinner';

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
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
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

  const executeSubmitGrades = async () => {
    if (!selectedSubmission) return;
    setSubmitting(true);
    try {
      await api.post(`/admin/grading/${selectedSubmission.submissionId}/bulk-grade`, {
        grades,
      });
      toast.success('Grading submitted successfully');
      setSelectedSubmission(null);
      setGrades({});
      setShowConfirmSubmit(false);
      loadPending();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit grades');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <PortalSpinner size="lg" color="green" />
    </div>
  );

  if (selectedSubmission) {
    return (
      <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-green-100 pb-20">
        <header className="bg-brand-green py-8 px-10 flex items-center justify-between shadow-2xl relative z-10">
          <div className="flex items-center gap-8">
            <button
              onClick={() => setSelectedSubmission(null)}
              className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/60 hover:text-white transition-all"
            >
              <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-all">←</span>
              Back to Queue
            </button>
            <div className="h-8 w-[1px] bg-white/10"></div>
            <div>
              <h2 className="text-white font-black uppercase tracking-tight text-lg leading-none">{selectedSubmission.examTitle}</h2>
              <p className="text-brand-gold text-[10px] font-bold uppercase tracking-widest mt-2">Manual Grading Terminal</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Candidate</p>
            <p className="text-sm font-bold text-white uppercase tracking-tight">{selectedSubmission.studentName}</p>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-8 py-16">
          <div className="premium-card p-10 mb-12 flex items-center justify-between bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12 translate-x-8 translate-y-[-8]">
              <svg className="w-32 h-32 text-brand-green" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Institutional Identification</p>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedSubmission.studentName}</h1>
              <p className="text-xs font-mono text-slate-400 mt-1 uppercase">{selectedSubmission.studentEmail}</p>
            </div>
            <div className="text-right border-l-2 border-slate-50 pl-10">
              <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Objective Performance</p>
              <p className="text-5xl font-black text-brand-green tabular-nums leading-none">
                {selectedSubmission.score}<span className="text-slate-200 text-2xl mx-1">/</span>{selectedSubmission.totalMarks}
              </p>
            </div>
          </div>

          <div className="space-y-12">
            {selectedSubmission.theoryQuestions.map((q, idx) => (
              <div key={q.id} className="premium-card bg-white group hover:translate-y-[-4px] transition-all border-l-4 border-indigo-500 shadow-xl shadow-indigo-900/5">
                <div className="bg-slate-50/80 px-10 py-6 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <span className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-lg shadow-indigo-600/20">{idx + 1}</span>
                    <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">{q.questionText}</h3>
                  </div>
                  {q.currentScore !== null && q.currentScore > 0 && (
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      Previous Assessment: {q.currentScore}%
                    </span>
                  )}
                </div>

                {q.passageText && (
                  <div className="px-10 py-6 bg-amber-50/50 border-b border-amber-100/50">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-1.5 h-4 bg-brand-gold rounded-full"></span>
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Reference Context (Passage)</p>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed font-medium italic">{q.passageText}</p>
                  </div>
                )}

                <div className="px-10 py-10">
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Input Response</p>
                    {q.maxWordCount && (
                      <span className="text-[10px] font-bold text-slate-300 uppercase">Limit: {q.maxWordCount} Words</span>
                    )}
                  </div>
                  <div 
                    className="prose prose-slate max-w-none bg-slate-50/50 rounded-2xl p-8 border border-slate-100 min-h-[140px] shadow-inner text-slate-800 font-medium leading-relaxed selection:bg-indigo-100"
                    dangerouslySetInnerHTML={{ __html: q.studentAnswer || '<em class="text-slate-300 italic">No substantial input detected from candidate</em>' }}
                  />
                </div>

                <div className="px-10 py-10 bg-slate-50/50 border-t border-slate-100 border-dashed">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="md:col-span-1">
                      <div className="floating-label-group">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={grades[q.id]?.score || 0}
                          onChange={(e) => setGrades({ ...grades, [q.id]: { ...grades[q.id], score: parseInt(e.target.value) || 0, feedback: grades[q.id]?.feedback || '' } })}
                          className="institutional-input pt-10 text-2xl font-mono text-indigo-600"
                          placeholder=" "
                        />
                        <label>Assigned Valuation (0-100)</label>
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <div className="floating-label-group">
                        <input
                          type="text"
                          value={grades[q.id]?.feedback || ''}
                          onChange={(e) => setGrades({ ...grades, [q.id]: { ...grades[q.id], score: grades[q.id]?.score || 0, feedback: e.target.value } })}
                          className="institutional-input pt-10 italic"
                          placeholder=" "
                        />
                        <label>Administrative Feedback (Synthesized Assessment)</label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex gap-6 pt-10 border-t border-slate-200">
            <button
              onClick={() => setShowConfirmSubmit(true)}
              disabled={submitting}
              className="px-14 py-5 bg-brand-green text-white font-black rounded-2xl transition-all shadow-2xl shadow-green-900/30 active:scale-95 uppercase text-[10px] tracking-[0.2em] hover:bg-green-800 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <PortalSpinner size="sm" color="white" />
                  <span>Processing Audit...</span>
                </>
              ) : (
                'Commit Assessment Protocol'
              )}
            </button>
            <button
              onClick={() => setSelectedSubmission(null)}
              className="px-14 py-5 bg-white border border-slate-200 text-slate-400 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase text-[10px] tracking-[0.2em] active:scale-95"
            >
              Abort Session
            </button>
          </div>
        </main>

        <PortalModal 
          isOpen={showConfirmSubmit}
          onClose={() => setShowConfirmSubmit(false)}
          onConfirm={executeSubmitGrades}
          title="Confirm Assessment Commit"
          message={`Are you certain you wish to commit the manual valuation for "${selectedSubmission.studentName}"? Once submitted, these scores will be integrated into the candidate's final academic record.`}
          confirmText="Commit & Finalize"
          cancelText="Retain Session"
          type="warning"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-green-100 pb-20">
      <AdminHeader 
        subtitle="Manual Grading"
        actions={
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="px-6 py-2.5 bg-brand-gold text-brand-green rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-gold/20 hover:brightness-110"
          >
            ← Dashboard
          </button>
        }
      />
      
      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="mb-16">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Manual Valuation Queue</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{pending.length} PROTOCOLS PENDING ADMINISTRATIVE REVIEW</p>
        </div>

        <div className="premium-card overflow-hidden bg-white shadow-2xl shadow-black/[0.03]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 border-b border-slate-100">
                <th className="px-10 py-6">Candidate Identity</th>
                <th className="px-10 py-6">Examination Node</th>
                <th className="px-10 py-6 text-center">Protocol Metric</th>
                <th className="px-10 py-6 text-center">Progress Matrix</th>
                <th className="px-10 py-6 text-right">Audit Timestamp</th>
                <th className="px-10 py-6 text-right">Administrative Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pending.map((s) => (
                <tr key={s.submissionId} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-8">
                    <div className="font-black text-slate-900 group-hover:text-brand-green transition-colors uppercase tracking-tight text-sm">{s.studentName}</div>
                    <div className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-widest">{s.studentEmail}</div>
                  </td>
                  <td className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-tighter max-w-[200px]">
                    {s.examTitle}
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="text-2xl font-black text-slate-900 tabular-nums">
                      {s.score}<span className="text-slate-200 text-sm mx-1">/</span>{s.totalMarks}
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-32 bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden shadow-inner">
                        <div 
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000 ease-out" 
                          style={{ width: `${s.totalCount > 0 ? ((s.totalCount - s.pendingCount) / s.totalCount) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-[9px] font-black text-slate-300 tracking-[0.2em] uppercase">
                        {s.totalCount - s.pendingCount} <span className="opacity-40">OF</span> {s.totalCount} GRADED
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right font-black text-[10px] text-slate-400 uppercase tracking-widest">
                    <div className="text-slate-600">{new Date(s.submittedAt).toLocaleDateString()}</div>
                    <div className="opacity-40 text-[9px] mt-1">{new Date(s.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <button
                      onClick={() => openSubmission(s.submissionId)}
                      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-indigo-900/10 active:scale-95"
                    >
                      Initialize Audit
                    </button>
                  </td>
                </tr>
              ))}
              {pending.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-10 py-40 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                       <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <h3 className="text-xl font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Audit Queue Clear</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">All candidate submissions have been manually valued.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-12 text-center border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Institutional Evaluation Registry © 2024</p>
      </footer>
    </div>
  );
}
