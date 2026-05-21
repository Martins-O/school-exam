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
  durationMinutes: number;
  isPublished: boolean;
  startTime: string | null;
  endTime: string | null;
  questionCount?: number;
  targetClasses: ClassItem[];
}

interface AvailableExam {
  id: string;
  title: string;
  durationMinutes: number;
}

interface TimetableData {
  classes: ClassItem[];
  selectedClass: ClassItem | null;
  exams: Exam[];
  availableExams: AvailableExam[];
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
  const [data, setData] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const [scheduleExamId, setScheduleExamId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleStartTime, setScheduleStartTime] = useState('');
  const [scheduleEndTime, setScheduleEndTime] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedClassId) {
      loadTimetable(selectedClassId);
    } else {
      loadClasses();
    }
  }, [selectedClassId]);

  const loadClasses = async () => {
    try {
      const res = await api.get('/timetable');
      setData(res.data);
      if (res.data.classes?.length > 0) {
        setSelectedClassId(res.data.classes[0].id);
      }
      setLoading(false);
    } catch { setLoading(false); toast.error('Failed to load'); }
  };

  const loadTimetable = async (classId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/timetable?classId=${classId}`);
      setData(res.data);
    } catch { toast.error('Failed to load timetable'); }
    finally { setLoading(false); }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleExamId || !scheduleDate || !scheduleStartTime) return;
    setSaving(true);
    try {
      const startDateTime = `${scheduleDate}T${scheduleStartTime}`;
      const endDateTime = scheduleEndTime ? `${scheduleDate}T${scheduleEndTime}` : null;
      await api.post('/timetable', {
        examId: scheduleExamId,
        classId: selectedClassId,
        startTime: new Date(startDateTime).toISOString(),
        endTime: endDateTime ? new Date(endDateTime).toISOString() : null,
      });
      toast.success('Exam scheduled');
      setShowScheduleForm(false);
      setScheduleExamId('');
      setScheduleDate('');
      setScheduleStartTime('');
      setScheduleEndTime('');
      loadTimetable(selectedClassId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to schedule');
    } finally { setSaving(false); }
  };

  if (loading && !data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const scheduled = data?.exams?.filter(e => e.startTime) || [];
  const unscheduled = data?.exams?.filter(e => !e.startTime) || [];
  const grouped = groupByDate(scheduled);

  return (
    <>
      <TeacherHeader
        subtitle="Exam Timetable"
        actions={
          <Link
            href="/teacher/exams"
            className="px-5 py-2 bg-brand-gold text-brand-green font-black rounded-lg text-xs uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
          >
            My Exams
          </Link>
        }
      />
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Class Selector + Schedule Form */}
        <div className="portal-card p-6 bg-white mb-10">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Select Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full md:w-80 bg-white border-2 border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-100"
              >
                <option value="">-- Select --</option>
                {data?.classes?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              className="px-6 py-3 bg-brand-green text-white font-black rounded-xl hover:bg-green-800 transition-all shadow-lg active:scale-95 uppercase text-[10px] tracking-widest"
            >
              {showScheduleForm ? 'Cancel' : '+ Schedule'}
            </button>
          </div>

          {showScheduleForm && selectedClassId && (
            <form onSubmit={handleSchedule} className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Exam</label>
                <select value={scheduleExamId} onChange={e => setScheduleExamId(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-green-100" required>
                  <option value="">-- Select --</option>
                  {data?.availableExams?.map(e => (
                    <option key={e.id} value={e.id}>{e.title} ({e.durationMinutes}min)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Date</label>
                <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-green-100" required />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Start</label>
                <input type="time" value={scheduleStartTime} onChange={e => setScheduleStartTime(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-green-100" required />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">End</label>
                <input type="time" value={scheduleEndTime} onChange={e => setScheduleEndTime(e.target.value)} className="w-full bg-white border-2 border-slate-200 rounded-lg px-3 py-2.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-green-100" />
              </div>
              <button type="submit" disabled={saving} className="px-5 py-2.5 bg-blue-600 text-white font-black rounded-lg hover:bg-blue-700 transition-all shadow active:scale-95 uppercase text-[10px] tracking-widest disabled:opacity-50">
                {saving ? 'Saving...' : 'Schedule'}
              </button>
            </form>
          )}
        </div>

        {!selectedClassId && (
          <div className="portal-card p-16 text-center bg-white">
            <p className="text-sm font-black text-slate-300 uppercase tracking-widest">Select a class to view timetable</p>
          </div>
        )}

        {selectedClassId && (
          <>
            {unscheduled.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-1.5 h-7 bg-amber-400 rounded-full"></span>
                  <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Unscheduled</h2>
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black uppercase tracking-widest">{unscheduled.length}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {unscheduled.map(exam => (
                    <div key={exam.id} className="portal-card p-5 bg-white border-l-4 border-l-amber-400">
                      <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">{exam.title}</h3>
                      <div className="text-[10px] font-bold text-slate-400 mt-1">{exam.durationMinutes} min</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <span className="w-1.5 h-7 bg-brand-green rounded-full"></span>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Scheduled</h2>
              <span className="px-2 py-0.5 bg-green-50 text-brand-green rounded text-[9px] font-black uppercase tracking-widest">{scheduled.length}</span>
            </div>

            {scheduled.length === 0 ? (
              <div className="portal-card p-12 text-center bg-white">
                <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No exams scheduled</p>
              </div>
            ) : (
              Object.entries(grouped).map(([dateKey, exams]) => (
                <div key={dateKey} className="mb-8">
                  <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span>📅</span> {formatDate(dateKey)}
                    <span className="text-[9px] text-slate-400">({exams.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {exams.map(exam => (
                      <div key={exam.id} className="portal-card p-4 bg-white flex items-center gap-4">
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-sm font-black text-brand-green min-w-[60px]">{formatTime(exam.startTime!)}</span>
                          <span className="text-[9px] text-slate-300">→</span>
                          <span className="text-xs font-bold text-slate-500 min-w-[60px]">{exam.endTime ? formatTime(exam.endTime) : '—'}</span>
                        </div>
                        <div className="flex-1">
                          <span className="font-black text-slate-800 uppercase tracking-tight text-sm">{exam.title}</span>
                          <span className="text-[10px] text-slate-400 ml-3">⏱️ {exam.durationMinutes}min</span>
                        </div>
                        <Link href={`/admin/exams/${exam.id}`} className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200">
                          Edit
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </main>
    </>
  );
}
