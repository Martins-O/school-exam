'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Exam {
  id: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  startTime: string | null;
  endTime: string | null;
  isPublished: boolean;
  maxViolations: number;
  createdBy: { id: string; name: string };
  targetClasses: ClassItem[];
}

interface ClassItem {
  id: string;
  name: string;
  description: string | null;
}

export default function ExamDetailPage() {
  const params = useParams();
  const examId = params.examId as string;
  const router = useRouter();

  const [exam, setExam] = useState<Exam | null>(null);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'classes'>('details');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [maxViolations, setMaxViolations] = useState(3);

  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([loadExam(), loadClasses()]).finally(() => setLoading(false));
  }, []);

  const loadExam = async () => {
    try {
      const res = await api.get(`/exams/${examId}`);
      const data = res.data;
      setExam(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setDurationMinutes(data.durationMinutes);
      setStartTime(data.startTime ? data.startTime.slice(0, 16) : '');
      setEndTime(data.endTime ? data.endTime.slice(0, 16) : '');
      setMaxViolations(data.maxViolations);
      setSelectedClassIds(data.targetClasses?.map((c: ClassItem) => c.id) || []);
    } catch {
      toast.error('Exam not found');
      router.push('/admin/exams');
    }
  };

  const loadClasses = async () => {
    try {
      const res = await api.get('/classes');
      setClasses(res.data);
    } catch {}
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/exams/${examId}`, {
        title,
        description: description || null,
        durationMinutes,
        startTime: startTime || null,
        endTime: endTime || null,
        maxViolations,
      });
      toast.success('Exam updated');
      loadExam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      await api.patch(`/exams/${examId}/publish`);
      toast.success('Exam is now LIVE');
      loadExam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Publish failed');
    }
  };

  const handleUnpublish = async () => {
    try {
      await api.patch(`/exams/${examId}`, { isPublished: false });
      toast.success('Exam unpublished');
      loadExam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  const handleAssignClasses = async () => {
    setSaving(true);
    try {
      await api.patch(`/exams/${examId}/classes`, { classIds: selectedClassIds });
      toast.success('Classes updated');
      loadExam();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleClass = (classId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!exam) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100">
      <header className="cbt-header relative z-10">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/admin/exams" className="flex items-center gap-4 group">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border-b-2 border-slate-300">
              <svg className="w-5 h-5 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight flex items-center gap-2">
              CBT Exam <span className="text-xs font-bold text-brand-gold/80 block uppercase tracking-widest border-l border-white/20 pl-4 mt-1">Exam Editor</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/admin/exams" className="text-[10px] font-black uppercase tracking-widest hover:text-brand-gold transition-colors">BACK TO LIST</Link>
            <Link
              href={`/admin/exams/${examId}/questions`}
              className="px-5 py-2 bg-brand-gold text-brand-green font-black rounded-lg text-xs uppercase tracking-widest shadow-lg shadow-black/20 hover:scale-105 transition-all"
            >
              Manage Questions
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{exam.title}</h1>
          <div className="flex items-center gap-4 mt-3">
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
              exam.isPublished
                ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : 'bg-amber-50 text-amber-600 border-amber-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${exam.isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              {exam.isPublished ? 'LIVE' : 'DRAFT'}
            </span>
            <span className="text-[10px] font-mono text-slate-400">ID: {examId.split('-')[0].toUpperCase()}</span>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'details' ? 'bg-brand-green text-white' : 'bg-white text-slate-500 hover:bg-slate-100'
            }`}
          >
            Exam Details
          </button>
          <button
            onClick={() => setActiveTab('classes')}
            className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'classes' ? 'bg-brand-green text-white' : 'bg-white text-slate-500 hover:bg-slate-100'
            }`}
          >
            Target Classes ({selectedClassIds.length})
          </button>
        </div>

        {activeTab === 'details' && (
          <div className="portal-card p-10 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Examination Designation</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-brand-green/40 transition-all"
                  placeholder="e.g. Mathematics - CBT 2026"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-brand-green/40 transition-all resize-none"
                  placeholder="Exam instructions, scope, or notes..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Duration (Minutes)</label>
                <input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-brand-green/40 transition-all"
                  min={1}
                  max={480}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Max Violations Before Auto-Submit</label>
                <input
                  type="number"
                  value={maxViolations}
                  onChange={(e) => setMaxViolations(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-brand-green/40 transition-all"
                  min={1}
                  max={10}
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Start Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-brand-green/40 transition-all"
                />
                <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-wider">Leave blank for always open</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">End Time (Optional)</label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-brand-green/40 transition-all"
                />
                <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-wider">Leave blank for no deadline</p>
              </div>

              <div className="md:col-span-2 flex items-center gap-6 pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-12 py-5 bg-brand-green text-white font-black rounded-xl hover:bg-green-800 transition-all shadow-xl shadow-green-900/20 active:scale-95 uppercase text-xs tracking-widest disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {exam.isPublished ? (
                  <button
                    onClick={handleUnpublish}
                    className="px-8 py-5 bg-amber-500 text-white font-black rounded-xl hover:bg-amber-600 transition-all uppercase text-xs tracking-widest"
                  >
                    Unpublish
                  </button>
                ) : (
                  <button
                    onClick={handlePublish}
                    className="px-8 py-5 bg-emerald-500 text-white font-black rounded-xl hover:bg-emerald-600 transition-all uppercase text-xs tracking-widest"
                  >
                    Publish Exam
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="portal-card p-10 bg-white">
            <h2 className="text-xl font-black text-brand-green uppercase tracking-tight mb-6 flex items-center gap-3">
              <span className="w-1.5 h-8 bg-brand-gold rounded-full"></span>
              Assign Target Classes
            </h2>
            <p className="text-xs text-slate-500 font-bold mb-6">
              Students in selected classes will be able to see and take this exam. Leave empty for all students.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
              {classes.length === 0 && (
                <div className="md:col-span-2 py-8 text-center text-slate-400">
                  <p className="text-sm font-black uppercase tracking-widest">No classes exist yet.</p>
                  <Link href="/admin/classes" className="text-brand-green underline text-xs font-bold mt-2 inline-block">Create classes first</Link>
                </div>
              )}
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => toggleClass(cls.id)}
                  className={`flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all ${
                    selectedClassIds.includes(cls.id)
                      ? 'border-brand-green bg-green-50'
                      : 'border-slate-100 hover:border-slate-200 bg-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                    selectedClassIds.includes(cls.id)
                      ? 'bg-brand-green border-brand-green'
                      : 'border-slate-300'
                  }`}>
                    {selectedClassIds.includes(cls.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-black text-sm text-slate-800">{cls.name}</div>
                    {cls.description && (
                      <div className="text-[10px] text-slate-400 font-bold">{cls.description}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={handleAssignClasses}
              disabled={saving}
              className="px-12 py-5 bg-brand-green text-white font-black rounded-xl hover:bg-green-800 transition-all shadow-xl shadow-green-900/20 active:scale-95 uppercase text-xs tracking-widest disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Class Assignments'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
