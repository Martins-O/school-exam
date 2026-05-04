'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

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

export default function AdminTranscriptsPage() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [comments, setComments] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      api.get('/transcripts/student/all').catch(() => ({ data: [] })),
      api.get('/users?role=student').catch(() => ({ data: [] })),
    ]).then(([transcriptsRes, usersRes]) => {
      setTranscripts(transcriptsRes.data);
      setStudents(usersRes.data);
      setLoading(false);
    });
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body: any = { studentId: selectedStudent };
      if (periodStart) body.periodStart = periodStart;
      if (periodEnd) body.periodEnd = periodEnd;
      if (comments) body.comments = comments;
      await api.post('/transcripts/generate', body);
      toast.success('Transcript generated successfully');
      setShowCreate(false);
      setSelectedStudent('');
      setComments('');
      setPeriodStart('');
      setPeriodEnd('');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Generation failed');
    }
  };

  const handleFinalize = async (id: string) => {
    if (!confirm('Finalize this transcript? It will be locked from further updates.')) return;
    try {
      await api.patch(`/transcripts/${id}/finalize`);
      toast.success('Transcript finalized');
      window.location.reload();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Finalization failed');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-jamb-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100">
      <header className="jamb-header relative z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-black text-jamb-green text-xl border-b-2 border-slate-300">
              J
            </div>
            <span className="text-xl font-black tracking-tight flex items-center gap-2">
              JAMB <span className="text-xs font-bold text-jamb-gold/80 block uppercase tracking-widest border-l border-white/20 pl-4 mt-1">Transcripts</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="text-[10px] font-black uppercase tracking-widest hover:text-jamb-gold transition-colors">BACK TO DASHBOARD</Link>
            <button 
              onClick={() => setShowCreate(!showCreate)}
              className="px-6 py-2 bg-jamb-gold text-jamb-green font-black rounded-lg text-xs uppercase tracking-widest shadow-lg shadow-black/20 hover:scale-105 transition-all"
            >
              {showCreate ? 'Discard' : 'Generate Transcript'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {showCreate && (
          <div className="portal-card p-10 mb-12 bg-white">
            <h2 className="text-2xl font-black mb-8 text-jamb-green uppercase tracking-tight flex items-center gap-3">
              <span className="w-1.5 h-8 bg-jamb-gold rounded-full"></span>
              Generate Academic Transcript
            </h2>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Student</label>
                <select 
                  value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:border-jamb-green/40 outline-none"
                  required
                >
                  <option value="">Select a student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Period Start (optional)</label>
                  <input 
                    type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:border-jamb-green/40 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Period End (optional)</label>
                  <input 
                    type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:border-jamb-green/40 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Comments (optional)</label>
                <textarea 
                  value={comments} onChange={e => setComments(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:border-jamb-green/40 outline-none transition-all min-h-[80px]"
                  placeholder="e.g. Excellent performance in sciences..."
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-4 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-4 bg-jamb-green text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-800 transition-all shadow-lg"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2">Academic Transcripts</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{transcripts.length} DOCUMENT(S) DETECTED</p>
          </div>
        </div>

        <div className="space-y-6">
          {transcripts.length === 0 ? (
            <div className="portal-card p-20 text-center border-dashed">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No transcripts generated yet.</p>
              <p className="text-[10px] text-slate-300 mt-2">Use the Generate button to create a transcript for a student.</p>
            </div>
          ) : (
            transcripts.map((t) => (
              <div key={t.id} className="portal-card bg-white overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                        {t.student?.name || 'Unknown Student'}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">
                        Period: {new Date(t.periodStart).toLocaleDateString()} — {t.periodEnd ? new Date(t.periodEnd).toLocaleDateString() : 'Present'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        t.isFinalized
                          ? 'bg-blue-50 text-blue-600 border-blue-200'
                          : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {t.isFinalized ? 'FINALIZED' : 'DRAFT'}
                      </span>
                      {!t.isFinalized && (
                        <button
                          onClick={() => handleFinalize(t.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                        >
                          Finalize
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-50 p-6 rounded-xl text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Average Score</p>
                      <p className={`text-4xl font-black tabular-nums ${
                        t.averageScore >= 70 ? 'text-jamb-green' : t.averageScore >= 50 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {Math.round(t.averageScore)}%
                      </p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exams Taken</p>
                      <p className="text-4xl font-black text-slate-800 tabular-nums">{t.results.length}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Generated By</p>
                      <p className="text-sm font-bold text-slate-600">{t.generatedBy?.name || 'System'}</p>
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
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
