'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import PortalSpinner from '@/components/ui/PortalSpinner';

interface ClassItem {
  id: string;
  name: string;
}

interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  isPublished: boolean;
  startTime: string | null;
  endTime: string | null;
  questionCount?: number;
  targetClasses: ClassItem[];
  createdBy?: { id: string; name: string };
}

interface ScheduleData {
  scheduled: Exam[];
  unscheduled: Exam[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
  });
}

function groupByDate(exams: Exam[]): Record<string, Exam[]> {
  const groups: Record<string, Exam[]> = {};
  for (const exam of exams) {
    if (!exam.startTime) continue;
    const dateKey = new Date(exam.startTime).toDateString();
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(exam);
  }
  const sorted: Record<string, Exam[]> = {};
  Object.keys(groups)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .forEach(k => { sorted[k] = groups[k]; });
  return sorted;
}

export default function AdminTimetablePage() {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadTimetable(); }, []);

  const loadTimetable = async () => {
    try {
      const res = await api.get('/timetable');
      setData(res.data);
    } catch { toast.error('Failed to load timetable'); }
    finally { setLoading(false); }
  };

  const startEdit = (exam: Exam) => {
    setEditingId(exam.id);
    setEditStart(exam.startTime ? new Date(exam.startTime).toISOString().slice(0, 16) : '');
    setEditEnd(exam.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : '');
  };

  const saveSchedule = async (examId: string) => {
    setSaving(true);
    try {
      await api.patch(`/timetable/${examId}`, {
        startTime: editStart ? new Date(editStart).toISOString() : null,
        endTime: editEnd ? new Date(editEnd).toISOString() : null,
      });
      toast.success('Schedule updated');
      setEditingId(null);
      loadTimetable();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update schedule');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <PortalSpinner size="lg" color="green" />
    </div>
  );

  const scheduled = data?.scheduled || [];
  const unscheduled = data?.unscheduled || [];
  const grouped = groupByDate(scheduled);

  return (
    <>
      <AdminHeader
        subtitle="Schedule Matrix"
        actions={
          <Link
            href="/admin/exams"
            className="px-6 py-2.5 bg-brand-gold text-brand-green rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:brightness-110 shadow-xl"
          >
            Manage Exams
          </Link>
        }
      />
      <main className="max-w-7xl mx-auto px-8 py-16">
        {/* Unscheduled Section */}
        {unscheduled.length > 0 && (
          <div className="mb-20">
            <div className="flex items-center gap-4 mb-8">
              <span className="w-2 h-8 bg-amber-400 rounded-full"></span>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Unscheduled Exams</h2>
              <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">
                {unscheduled.length} pending
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unscheduled.map(exam => (
                <div key={exam.id} className="premium-card p-8 border-l-4 border-l-amber-400">
                  <div className="flex items-start justify-between mb-6">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{exam.title}</h3>
                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest ${
                      exam.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {exam.isPublished ? 'LIVE' : 'DRAFT'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 mb-6">
                    <span>{exam.durationMinutes} min</span>
                    {exam.questionCount !== undefined && <span>{exam.questionCount} Q</span>}
                  </div>
                  {exam.targetClasses?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-6">
                      {exam.targetClasses.map(c => (
                        <span key={c.id} className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black uppercase tracking-widest text-slate-500">{c.name}</span>
                      ))}
                    </div>
                  )}
                  {editingId === exam.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Start</label>
                        <input type="datetime-local" value={editStart} onChange={e => setEditStart(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-xs font-bold" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">End</label>
                        <input type="datetime-local" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-xs font-bold" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveSchedule(exam.id)} disabled={saving} className="flex-1 px-4 py-2 bg-brand-green text-white rounded-lg font-black text-[9px] uppercase tracking-widest disabled:opacity-50">
                          {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-slate-100 text-slate-500 rounded-lg font-black text-[9px] uppercase tracking-widest">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(exam)} className="w-full py-3 bg-amber-50 text-amber-600 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-amber-100 transition-all">
                      Set Date & Time
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Section */}
        <div className="flex items-center gap-4 mb-8">
          <span className="w-2 h-8 bg-brand-green rounded-full"></span>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Scheduled Exams</h2>
          <span className="px-3 py-1 bg-green-50 text-brand-green rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100">
            {scheduled.length} scheduled
          </span>
        </div>

        {scheduled.length === 0 ? (
          <div className="premium-card p-20 text-center">
            <p className="text-sm font-black text-slate-300 uppercase tracking-widest mb-2">No exams scheduled</p>
            <p className="text-[10px] font-bold text-slate-400">Set dates for unscheduled exams above, or create new exams</p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateKey, exams]) => (
            <div key={dateKey} className="mb-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-brand-green/10 rounded-2xl flex items-center justify-center text-lg">
                  📅
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{formatDate(dateKey)}</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{exams.length} exam(s)</p>
                </div>
              </div>
              <div className="space-y-4">
                {exams.map(exam => (
                  <div key={exam.id} className="premium-card p-6 flex flex-col md:flex-row md:items-center gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-black text-slate-800 uppercase tracking-tight">{exam.title}</h4>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                          exam.isPublished ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>{exam.isPublished ? 'LIVE' : 'DRAFT'}</span>
                      </div>
                      {exam.targetClasses?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {exam.targetClasses.map(c => (
                            <span key={c.id} className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black uppercase tracking-widest text-slate-500">{c.name}</span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                        <span>⏱️ {exam.durationMinutes} min</span>
                        {exam.questionCount !== undefined && <span>📝 {exam.questionCount} Q</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-black text-brand-green">{formatTime(exam.startTime!)}</div>
                        <div className="text-[9px] font-bold text-slate-400">Start</div>
                      </div>
                      <div className="w-16 h-[1px] bg-slate-200"></div>
                      <div className="text-right">
                        <div className="text-xs font-black text-slate-600">{exam.endTime ? formatTime(exam.endTime) : '—'}</div>
                        <div className="text-[9px] font-bold text-slate-400">End</div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {editingId === exam.id ? (
                        <div className="flex gap-2 items-center">
                          <input type="datetime-local" value={editStart} onChange={e => setEditStart(e.target.value)} className="bg-white border-2 border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold w-40" />
                          <input type="datetime-local" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="bg-white border-2 border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold w-40" />
                          <button onClick={() => saveSchedule(exam.id)} disabled={saving} className="px-3 py-1.5 bg-brand-green text-white rounded-lg text-[9px] font-black uppercase tracking-widest disabled:opacity-50">Save</button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">X</button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => startEdit(exam)} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200">
                            Reschedule
                          </button>
                          <Link href={`/admin/exams/${exam.id}`} className="px-4 py-2 bg-brand-green/10 text-brand-green rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-brand-green/20 transition-all">
                            Edit Exam
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>
    </>
  );
}
