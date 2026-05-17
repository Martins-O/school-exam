'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import PortalModal from '@/components/admin/PortalModal';
import PortalSpinner from '@/components/ui/PortalSpinner';

interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  isPublished: boolean;
  questionCount?: number;
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; title: string }>({
    open: false,
    id: '',
    title: ''
  });
  
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const router = useRouter();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const res = await api.get('/exams');
      const examsData = res.data;
      const withCounts = await Promise.all(
        examsData.map(async (e: Exam) => {
          try {
            const qRes = await api.get(`/exams/${e.id}`);
            return { ...e, questionCount: qRes.data.questionCount || 0 };
          } catch {
            return { ...e, questionCount: 0 };
          }
        })
      );
      setExams(withCounts);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/exams', { title, durationMinutes: duration });
      toast.success('Exam entry initialized');
      setTitle('');
      setDuration(60);
      setShowCreate(false);
      loadExams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Initialization failed');
    }
  };

  const executeDelete = async () => {
    try {
      await api.delete(`/exams/${deleteModal.id}`);
      toast.success('Record decommissioned');
      loadExams();
    } catch {
      toast.error('Deletion operation failed');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.patch(`/exams/${id}/publish`);
      toast.success('Protocol is now LIVE on gateway');
      loadExams();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Activation failed');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <PortalSpinner size="lg" color="green" />
    </div>
  );

  return (
    <>
      <AdminHeader
        subtitle="Foundry"
        actions={
          <button
            onClick={() => setShowCreate(!showCreate)}
            className={`px-8 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
              showCreate ? 'bg-red-600 text-white ring-4 ring-red-100' : 'bg-brand-gold text-brand-green hover:brightness-110 shadow-gold/20'
            }`}
          >
            {showCreate ? 'Discard Deployment' : 'New Exam Deployment'}
          </button>
        }
      />
      <main className="max-w-7xl mx-auto px-8 py-16">
        {showCreate && (
          <div className="premium-card p-12 mb-16 animate-in fade-in slide-in-from-top-8 duration-700 ease-out">
            <h2 className="text-3xl font-black mb-10 text-slate-900 uppercase tracking-tighter flex items-center gap-4">
              <span className="w-2 h-10 bg-brand-gold rounded-full"></span>
              Initialize Exam Blueprint
            </h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-10 items-end">
              <div className="md:col-span-2 floating-label-group">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="institutional-input pt-10"
                  placeholder=" "
                  required
                />
                <label>Examination Designation (Title)</label>
              </div>
              <div className="floating-label-group">
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="institutional-input pt-10"
                  placeholder=" "
                  required
                  min={1}
                />
                <label>Session Duration (Minutes)</label>
              </div>
              <div className="md:col-span-3 pt-6 flex justify-end">
                <button
                  type="submit"
                  className="px-16 py-5 bg-brand-green text-white font-black rounded-2xl hover:bg-green-800 transition-all shadow-2xl shadow-green-900/20 active:scale-95 uppercase text-xs tracking-[0.3em] flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  Confirm Deployment
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="premium-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 border-b border-slate-100">
                <th className="px-10 py-8">Exam Identity</th>
                <th className="px-10 py-8">Metrics</th>
                <th className="px-10 py-8">Status</th>
                <th className="px-10 py-8 text-right">Node Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-green-50/20 transition-colors group">
                  <td className="px-10 py-10">
                    <div className="font-black text-xl text-slate-800 group-hover:text-brand-green transition-colors uppercase tracking-tight leading-tight">{exam.title}</div>
                    <div className="text-[10px] font-black text-slate-300 mt-2 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-3 h-[1px] bg-slate-200"></span>
                      ID: {exam.id.split('-')[0].toUpperCase()}
                    </div>
                  </td>
                  <td className="px-10 py-10">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px]">⏱️</span>
                        {exam.durationMinutes} MINUTES
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px]">📝</span>
                        {exam.questionCount || 0} QUESTIONS
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-10">
                    <span
                      className={`inline-flex items-center gap-2.5 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border shadow-sm transition-all ${
                        exam.isPublished
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${exam.isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                      {exam.isPublished ? 'LIVE ON GATEWAY' : 'DRAFT PROTOCOL'}
                    </span>
                  </td>
                  <td className="px-10 py-10 text-right">
                    <div className="flex items-center justify-end gap-8 text-[10px] font-black uppercase tracking-[0.3em]">
                      <Link
                        href={`/admin/exams/${exam.id}`}
                        className="text-slate-400 hover:text-brand-green transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/exams/${exam.id}/questions`}
                        className="text-indigo-400 hover:text-indigo-600 transition-colors"
                      >
                        Bank
                      </Link>
                      {!exam.isPublished && (
                        <button
                          onClick={() => handlePublish(exam.id)}
                          className="text-emerald-500 hover:text-emerald-700 transition-colors"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteModal({ open: true, id: exam.id, title: exam.title })}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        Decommission
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {exams.length === 0 && (
            <div className="p-40 text-center bg-white">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-300 uppercase tracking-[0.4em] mb-4">Foundry Offline</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No examination protocols detected in active deployment.</p>
            </div>
          )}
        </div>
      </main>

      <PortalModal 
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ ...deleteModal, open: false })}
        onConfirm={executeDelete}
        title="Confirm Decommission"
        message={`Are you certain you wish to decommission the protocol "${deleteModal.title}"? This action is tracked and cannot be reversed easily.`}
        confirmText="Execute Purge"
        cancelText="Abort Operation"
        type="danger"
      />
      
      <footer className="max-w-7xl mx-auto px-8 py-12 text-center">
        <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.5em]">Institutional CBT Foundry Control © 2024</p>
      </footer>
    </>
  );
}
