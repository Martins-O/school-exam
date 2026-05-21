'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import AdminHeader from '@/components/admin/AdminHeader';
import PortalModal from '@/components/admin/PortalModal';
import PortalSpinner from '@/components/ui/PortalSpinner';

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
  const [finalizeModal, setFinalizeModal] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: ''
  });
  const router = useRouter();

  const refreshData = () => {
    return Promise.all([
      api.get('/transcripts').catch(() => ({ data: [] })),
      api.get('/users?role=student').catch(() => ({ data: [] })),
    ]).then(([transcriptsRes, usersRes]) => {
      setTranscripts(transcriptsRes.data);
      setStudents(usersRes.data);
    });
  };

  useEffect(() => {
    refreshData().then(() => setLoading(false));
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
      refreshData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Generation failed');
    }
  };

  const executeFinalize = async () => {
    try {
      await api.patch(`/transcripts/${finalizeModal.id}/finalize`);
      toast.success('Transcript finalized');
      setFinalizeModal({ ...finalizeModal, open: false });
      refreshData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Finalization failed');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <PortalSpinner size="lg" color="green" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-green-100 pb-20">
      <AdminHeader
        subtitle="Transcripts"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 text-[10px] font-black text-white/60 hover:text-white transition-all uppercase tracking-[0.2em] hover:translate-x-[-4px]"
            >
              ← Dashboard
            </button>
            <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
                showCreate ? 'bg-red-600 text-white ring-4 ring-red-100' : 'bg-brand-gold text-brand-green hover:brightness-110 shadow-gold/20'
              }`}
            >
              {showCreate ? 'Discard Data' : '+ Generate New'}
            </button>
          </div>
        }
      />
      
      <main className="max-w-7xl mx-auto px-8 py-16">
        {showCreate && (
          <div className="premium-card p-12 mb-16 animate-in fade-in slide-in-from-top-8 duration-700 ease-out">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
                  <span className="w-2 h-10 bg-brand-gold rounded-full"></span>
                  Generate Academic Record
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 ml-6">Authoritative Document Synthesis</p>
              </div>
            </div>

            <form onSubmit={handleGenerate} className="space-y-8">
              <div className="floating-label-group">
                <select 
                  value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
                  className="institutional-input pt-10"
                  required
                >
                  <option value="">Select a student...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
                <label>Target Candidate</label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="floating-label-group">
                  <input 
                    type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
                    className="institutional-input pt-10"
                  />
                  <label>Audit Period Start (Optional)</label>
                </div>
                <div className="floating-label-group">
                  <input 
                    type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
                    className="institutional-input pt-10"
                  />
                  <label>Audit Period End (Optional)</label>
                </div>
              </div>

              <div className="floating-label-group">
                <textarea 
                  value={comments} onChange={e => setComments(e.target.value)}
                  className="institutional-input min-h-[120px] pt-10 italic"
                  placeholder=" "
                />
                <label>Administrative Observations (Optional)</label>
              </div>

              <div className="pt-8 border-t border-slate-100 flex justify-end gap-4">
                <button 
                  type="button" onClick={() => setShowCreate(false)}
                  className="px-10 py-4 bg-slate-50 text-slate-400 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all"
                >
                  Discard
                </button>
                <button 
                  type="submit"
                  className="px-12 py-4 bg-brand-green text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-800 transition-all shadow-2xl shadow-green-900/20 active:scale-95"
                >
                  Initialize Synthesis
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="mb-16">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Academic Registry</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{transcripts.length} RECORDS DETECTED IN REPOSITORY</p>
        </div>

        <div className="space-y-12">
          {transcripts.length === 0 ? (
            <div className="text-center py-40 premium-card bg-white border-dashed border-2 border-slate-200">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10">
                <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Registry Empty</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No academic credentials have been synthesized.</p>
            </div>
          ) : (
            transcripts.map((t) => (
              <div key={t.id} className="premium-card group hover:translate-y-[-4px] transition-all">
                <div className="p-12">
                  <div className="flex items-start justify-between mb-12">
                    <div>
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${
                          t.isFinalized
                            ? 'bg-blue-600 text-white'
                            : 'bg-brand-gold text-brand-green'
                        }`}>
                          {t.isFinalized ? 'FINALIZED' : 'DRAFT'} PROTOCOL
                        </span>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                          ID: {t.id.split('-')[0].toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                        {t.student?.name || 'Unknown Student'}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-[0.2em]">
                        Audit Window: {new Date(t.periodStart).toLocaleDateString()} — {t.periodEnd ? new Date(t.periodEnd).toLocaleDateString() : 'Present'}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      {!t.isFinalized && (
                        <button
                          onClick={() => setFinalizeModal({ open: true, id: t.id, name: t.student?.name || 'Unknown' })}
                          className="px-8 py-3 bg-brand-green text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all active:scale-95 shadow-xl shadow-green-900/10"
                        >
                          Finalize Record
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-slate-50/50 border border-slate-100 p-8 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Aggregate Performance</p>
                      <p className={`text-5xl font-black tabular-nums ${
                        t.averageScore >= 70 ? 'text-brand-green' : t.averageScore >= 50 ? 'text-brand-gold' : 'text-red-500'
                      }`}>
                        {Math.round(t.averageScore)}%
                      </p>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 p-8 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Protocol Count</p>
                      <p className="text-5xl font-black text-slate-900 tabular-nums">{t.results.length}</p>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 p-8 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-2">Authorized By</p>
                      <p className="text-sm font-black text-slate-600 uppercase tracking-tight mt-4">{t.generatedBy?.name || 'System Auto-Node'}</p>
                    </div>
                  </div>

                  {t.comments && (
                    <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-2xl mb-12 italic relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-[0.05] translate-x-4 translate-y-[-4]">
                         <svg className="w-16 h-16 text-brand-green" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.154c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                      </div>
                      <p className="text-[10px] font-black text-brand-green uppercase tracking-widest mb-2">Administrative Assessment:</p>
                      <p className="text-sm font-bold text-slate-600 leading-relaxed">{t.comments}</p>
                    </div>
                  )}

                  <div className="overflow-hidden border border-slate-100 rounded-2xl">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.3em] font-black text-slate-400">
                          <th className="px-8 py-5">Examination Node</th>
                          <th className="px-8 py-5 text-center">Metric</th>
                          <th className="px-8 py-5 text-center">Valuation</th>
                          <th className="px-8 py-5 text-center">Integrity</th>
                          <th className="px-8 py-5 text-right">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {t.results.map((r) => (
                          <tr key={r.submissionId} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6 font-black text-slate-800 uppercase text-xs tracking-tight">{r.examTitle}</td>
                            <td className="px-8 py-6 text-center font-black text-slate-400 tabular-nums text-xs">{r.score} / {r.totalMarks}</td>
                            <td className="px-8 py-6 text-center">
                              <span className={`text-sm font-black tabular-nums ${r.percentage >= 70 ? 'text-brand-green' : 'text-slate-900'}`}>
                                {Math.round(r.percentage)}%
                              </span>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                r.status === 'submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-right text-[10px] font-black text-slate-300 uppercase tracking-widest">
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

      <PortalModal 
        isOpen={finalizeModal.open}
        onClose={() => setFinalizeModal({ ...finalizeModal, open: false })}
        onConfirm={executeFinalize}
        title="Finalize Academic Record"
        message={`Are you certain you wish to finalize the record for "${finalizeModal.name}"? This action locks the document against further data synchronization and commits it to the authoritative registry.`}
        confirmText="Finalize & Lock"
        cancelText="Abort Operation"
        type="warning"
      />

      <footer className="max-w-7xl mx-auto px-8 py-12 text-center border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Institutional CBT Registry Control © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
