'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import TeacherHeader from '@/components/teacher/TeacherHeader';

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
}

interface ScheduleData {
  scheduled: Exam[];
  unscheduled: Exam[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
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

export default function TeacherTimetablePage() {
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
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const scheduled = data?.scheduled || [];
  const unscheduled = data?.unscheduled || [];
  const grouped = groupByDate(scheduled);

  return (
    <>
      <TeacherHeader
        subtitle="Exam Schedule"
        actions={
          <Link
            href="/teacher/exams"
            className="px-5 py-2 bg-brand-gold text-brand-green font-black rounded-lg text-xs uppercase tracking-widest shadow-lg shadow-black/20 hover:scale-105 transition-all"
          >
            My Exams
          </Link>
        }
      />
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Unscheduled */}
        {unscheduled.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-1.5 h-7 bg-amber-400 rounded-full"></span>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Unscheduled</h2>
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black uppercase tracking-widest">{unscheduled.length}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {unscheduled.map(exam => (
                <div key={exam.id} className="portal-card p-6 bg-white border-l-4 border-l-amber-400">
                  <h3 className="font-black text-slate-800 uppercase tracking-tight mb-2">{exam.title}</h3>
                  <div className="text-[10px] font-bold text-slate-400 mb-3">{exam.durationMinutes} min</div>
                  {exam.targetClasses?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {exam.targetClasses.map(c => (
                        <span key={c.id} className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black uppercase tracking-widest text-slate-500">{c.name}</span>
                      ))}
                    </div>
                  )}
                  {editingId === exam.id ? (
                    <div className="space-y-2">
                      <input type="datetime-local" value={editStart} onChange={e => setEditStart(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-xs font-bold" />
                      <input type="datetime-local" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-xs font-bold" />
                      <div className="flex gap-2">
                        <button onClick={() => saveSchedule(exam.id)} disabled={saving} className="flex-1 px-3 py-2 bg-brand-green text-white rounded-lg text-[9px] font-black uppercase tracking-widest disabled:opacity-50">Save</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-2 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(exam)} className="w-full py-2.5 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all">
                      Set Date & Time
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled */}
        <div className="flex items-center gap-3 mb-6">
          <span className="w-1.5 h-7 bg-brand-green rounded-full"></span>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Scheduled Exams</h2>
          <span className="px-2 py-0.5 bg-green-50 text-brand-green rounded text-[9px] font-black uppercase tracking-widest">{scheduled.length}</span>
        </div>

        {scheduled.length === 0 ? (
          <div className="portal-card p-16 text-center bg-white">
            <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No exams scheduled</p>
          </div>
        ) : (
          Object.entries(grouped).map(([dateKey, exams]) => (
            <div key={dateKey} className="mb-10">
              <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-3">
                <span>📅</span> {formatDate(dateKey)}
                <span className="text-[9px] text-slate-400">({exams.length})</span>
              </h3>
              <div className="space-y-3">
                {exams.map(exam => (
                  <div key={exam.id} className="portal-card p-5 bg-white flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">{exam.title}</h4>
                      {exam.targetClasses?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {exam.targetClasses.map(c => (
                            <span key={c.id} className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black uppercase tracking-widest text-slate-500">{c.name}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-black text-brand-green">{formatTime(exam.startTime!)}</div>
                        <div className="text-[8px] font-bold text-slate-400">START</div>
                      </div>
                      <div className="w-12 h-[1px] bg-slate-200"></div>
                      <div className="text-right">
                        <div className="text-xs font-black text-slate-600">{exam.endTime ? formatTime(exam.endTime) : '—'}</div>
                        <div className="text-[8px] font-bold text-slate-400">END</div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {editingId === exam.id ? (
                        <div className="flex gap-2 items-center">
                          <input type="datetime-local" value={editStart} onChange={e => setEditStart(e.target.value)} className="bg-white border-2 border-slate-200 rounded px-2 py-1 text-[10px] font-bold w-36" />
                          <input type="datetime-local" value={editEnd} onChange={e => setEditEnd(e.target.value)} className="bg-white border-2 border-slate-200 rounded px-2 py-1 text-[10px] font-bold w-36" />
                          <button onClick={() => saveSchedule(exam.id)} disabled={saving} className="px-3 py-1.5 bg-brand-green text-white rounded text-[9px] font-black uppercase tracking-widest disabled:opacity-50">Save</button>
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest">X</button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(exam)} className="px-3 py-1.5 bg-slate-50 text-slate-600 rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200">
                          Reschedule
                        </button>
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
