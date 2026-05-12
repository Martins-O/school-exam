'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';

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

  const handleDelete = async (id: string, examTitle: string) => {
    if (!confirm(`Confirm decommissioning of "${examTitle}"? This action is tracked.`)) return;
    try {
      await api.delete(`/exams/${id}`);
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
      <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <>
      <AdminHeader
        subtitle="Foundry"
        actions={
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-6 py-2 bg-brand-gold text-brand-green font-black rounded-lg text-xs uppercase tracking-widest shadow-lg shadow-black/20 hover:scale-105 transition-all"
          >
            {showCreate ? 'Discard Deployment' : 'New Exam Deployment'}
          </button>
        }
      />
      <main className="max-w-7xl mx-auto px-6 py-12">
        {showCreate && (
          <div className="portal-card p-10 mb-12 animate-in fade-in slide-in-from-top-4 duration-500 bg-white">
            <h2 className="text-2xl font-black mb-8 text-brand-green uppercase tracking-tight flex items-center gap-3">
              <span className="w-1.5 h-8 bg-brand-gold rounded-full"></span>
              Initialize Exam Blueprint
            </h2>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Examination Designation</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-brand-green/40 transition-all"
                  placeholder="e.g. Unified Tertiary Matriculation (English)"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Session Duration (Min)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-brand-green/40 transition-all"
                  required
                  min={1}
                />
              </div>
              <div className="md:col-span-3 pt-4">
                <button
                  type="submit"
                  className="px-12 py-5 bg-brand-green text-white font-black rounded-xl hover:bg-green-800 transition-all shadow-xl shadow-green-900/20 active:scale-95 uppercase text-xs tracking-widest"
                >
                  Confirm Deployment
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="portal-card overflow-hidden bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 border-b border-slate-200">
                <th className="px-8 py-6">Exam Identity</th>
                <th className="px-8 py-6">Metrics</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Node Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-green-50/30 transition-colors group">
                  <td className="px-8 py-7">
                    <div className="font-black text-lg text-slate-800 group-hover:text-brand-green transition-colors uppercase tracking-tight">{exam.title}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">ID: {exam.id.split('-')[0].toUpperCase()}</div>
                  </td>
                  <td className="px-8 py-7">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                        <span className="opacity-40">⏱️</span> {exam.durationMinutes} MINUTES
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                        <span className="opacity-40">📝</span> {exam.questionCount || 0} QUESTIONS
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-7">
                    <span
                      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                        exam.isPublished
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${exam.isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                      {exam.isPublished ? 'LIVE ON GATEWAY' : 'DRAFT PROTOCOL'}
                    </span>
                  </td>
                  <td className="px-8 py-7 text-right">
                    <div className="flex items-center justify-end gap-6 text-[10px] font-black uppercase tracking-widest">
                      <Link
                        href={`/admin/exams/${exam.id}`}
                        className="text-slate-600 hover:text-brand-green transition-colors underline underline-offset-4"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/admin/exams/${exam.id}/questions`}
                        className="text-blue-600 hover:text-blue-800 transition-colors underline underline-offset-4"
                      >
                        Bank
                      </Link>
                      {!exam.isPublished && (
                        <button
                          onClick={() => handlePublish(exam.id)}
                          className="text-emerald-500 hover:text-emerald-700 transition-colors underline underline-offset-4"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(exam.id, exam.title)}
                        className="text-red-500 hover:text-red-700 transition-colors underline underline-offset-4"
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
            <div className="p-24 text-center text-slate-400 bg-white">
              <p className="text-sm font-black uppercase tracking-widest mb-2">No active examination protocols.</p>
              <p className="text-[10px] font-bold">Initiate a new deployment using the primary control above.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
