'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  isPublished: boolean;
  targetClasses: ClassItem[];
}

interface ClassItem {
  id: string;
  name: string;
}

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [examQuestionCounts, setExamQuestionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [description, setDescription] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [examsRes, classesRes] = await Promise.all([
        api.get('/teacher/exams'),
        api.get('/teacher/classes'),
      ]);
      setClasses(classesRes.data);

      const examsData = examsRes.data;
      setExams(examsData);

      const counts: Record<string, number> = {};
      await Promise.all(
        examsData.map(async (e: Exam) => {
          try {
            const qRes = await api.get(`/exams/${e.id}`);
            counts[e.id] = qRes.data.questionCount || 0;
          } catch {
            counts[e.id] = 0;
          }
        })
      );
      setExamQuestionCounts(counts);
      setLoading(false);
    } catch {
      router.push('/login');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await api.post('/exams', { title, durationMinutes: duration, description });
      const examId = res.data.id;

      if (selectedClassIds.length > 0) {
        await api.patch(`/exams/${examId}/classes`, { classIds: selectedClassIds });
      }

      toast.success('Exam created');
      setTitle('');
      setDescription('');
      setDuration(60);
      setSelectedClassIds([]);
      setShowCreate(false);
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string, examTitle: string) => {
    if (!confirm(`Delete "${examTitle}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/exams/${id}`);
      toast.success('Exam deleted');
      loadData();
    } catch {
      toast.error('Deletion failed');
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.patch(`/exams/${id}/publish`);
      toast.success('Exam published');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Publish failed');
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await api.patch(`/exams/${id}`, { isPublished: false });
      toast.success('Exam unpublished');
      loadData();
    } catch {
      toast.error('Failed');
    }
  };

  const toggleClass = (classId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const filteredExams = filterClassId === 'all'
    ? exams
    : exams.filter(e => e.targetClasses?.some(c => c.id === filterClassId));

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100">
      <header className="cbt-header relative z-10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/teacher/dashboard" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border-b-2 border-slate-300">
              <svg className="w-5 h-5 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight flex items-center gap-2">
              CBT Exam <span className="text-xs font-bold text-brand-gold/80 block uppercase tracking-widest border-l border-white/20 pl-4 mt-1">Teacher Exams</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/teacher/dashboard" className="text-[10px] font-black uppercase tracking-widest hover:text-brand-gold transition-colors">BACK TO DASHBOARD</Link>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-6 py-2 bg-brand-gold text-brand-green font-black rounded-lg text-xs uppercase tracking-widest shadow-lg shadow-black/20 hover:scale-105 transition-all"
            >
              {showCreate ? 'Discard' : 'New Exam'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {showCreate && (
          <div className="portal-card p-10 mb-12 animate-in fade-in slide-in-from-top-4 duration-500 bg-white">
            <h2 className="text-2xl font-black mb-8 text-brand-green uppercase tracking-tight flex items-center gap-3">
              <span className="w-1.5 h-8 bg-brand-gold rounded-full"></span>
              Create New Exam
            </h2>
            <form onSubmit={handleCreate} className="space-y-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Exam Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-brand-green/40 transition-all"
                  placeholder="e.g. Mathematics - Mid Term"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-brand-green/40 transition-all resize-none"
                  placeholder="Instructions or notes..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Duration (Minutes)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-brand-green/40 transition-all"
                    min={1}
                    max={480}
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Classes (Optional)</label>
                  <div className="flex flex-wrap gap-3">
                    {classes.length === 0 && (
                      <p className="text-[10px] text-slate-400 font-bold">No classes assigned to you. Contact an administrator.</p>
                    )}
                    {classes.map((cls) => (
                      <button
                        key={cls.id}
                        type="button"
                        onClick={() => toggleClass(cls.id)}
                        className={`px-4 py-2 rounded-lg border-2 text-xs font-black uppercase tracking-widest transition-all ${
                          selectedClassIds.includes(cls.id)
                            ? 'border-brand-green bg-green-50 text-brand-green'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {cls.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={creating}
                  className="px-12 py-5 bg-brand-green text-white font-black rounded-xl hover:bg-green-800 transition-all shadow-xl shadow-green-900/20 active:scale-95 uppercase text-xs tracking-widest disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Exam'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-8 py-5 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter */}
        {classes.length > 1 && (
          <div className="mb-8 flex items-center gap-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Class:</label>
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="bg-white border-2 border-slate-100 rounded-lg px-4 py-2 text-xs font-bold focus:outline-none focus:border-brand-green/40"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Exams Table */}
        <div className="portal-card bg-white overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 border-b border-slate-200">
                <th className="px-8 py-6">Exam</th>
                <th className="px-8 py-6">Classes</th>
                <th className="px-8 py-6">Questions</th>
                <th className="px-8 py-6">Duration</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExams.map((exam) => (
                <tr key={exam.id} className="hover:bg-green-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="font-black text-base text-slate-800">{exam.title}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1">
                      {exam.targetClasses?.length === 0 && (
                        <span className="text-[10px] font-bold text-slate-400">All classes</span>
                      )}
                      {exam.targetClasses?.slice(0, 2).map(c => (
                        <span key={c.id} className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black uppercase tracking-widest text-slate-600">{c.name}</span>
                      ))}
                      {exam.targetClasses && exam.targetClasses.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-400">+{exam.targetClasses.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-black text-slate-600">
                    {examQuestionCounts[exam.id] ?? '—'}
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-500">
                    {exam.durationMinutes} min
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      exam.isPublished
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${exam.isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                      {exam.isPublished ? 'LIVE' : 'DRAFT'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-4 text-[10px] font-black uppercase tracking-widest">
                      <Link href={`/admin/exams/${exam.id}`} className="text-slate-600 hover:text-brand-green transition-colors underline underline-offset-4">
                        Edit
                      </Link>
                      <Link href={`/admin/exams/${exam.id}/questions`} className="text-blue-600 hover:text-blue-800 transition-colors underline underline-offset-4">
                        Questions
                      </Link>
                      <Link href={`/teacher/results?examId=${exam.id}`} className="text-emerald-600 hover:text-emerald-800 transition-colors underline underline-offset-4">
                        Results
                      </Link>
                      {exam.isPublished ? (
                        <button onClick={() => handleUnpublish(exam.id)} className="text-amber-500 hover:text-amber-700 transition-colors underline underline-offset-4">
                          Unpublish
                        </button>
                      ) : (
                        <button onClick={() => handlePublish(exam.id)} className="text-green-500 hover:text-green-700 transition-colors underline underline-offset-4">
                          Publish
                        </button>
                      )}
                      <button onClick={() => handleDelete(exam.id, exam.title)} className="text-red-500 hover:text-red-700 transition-colors underline underline-offset-4">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredExams.length === 0 && (
            <div className="p-24 text-center text-slate-400 bg-white">
              <p className="text-sm font-black uppercase tracking-widest mb-2">No exams found.</p>
              <p className="text-[10px] font-bold">Create a new exam to get started.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
