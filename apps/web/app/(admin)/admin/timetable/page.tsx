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
  const [data, setData] = useState<TimetableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  // Schedule form
  const [scheduleExamId, setScheduleExamId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleStartTime, setScheduleStartTime] = useState('');
  const [selectedExamDuration, setSelectedExamDuration] = useState(0);
  const [saving, setSaving] = useState(false);

  const selectedExam = data?.availableExams?.find(e => e.id === scheduleExamId);
  const calcEndTime = scheduleDate && scheduleStartTime && selectedExam
    ? (() => {
        const [h, m] = scheduleStartTime.split(':').map(Number);
        const start = new Date(scheduleDate);
        start.setHours(h, m, 0, 0);
        const end = new Date(start.getTime() + selectedExam.durationMinutes * 60 * 1000);
        return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
      })()
    : null;

  const minDate = new Date().toISOString().split('T')[0];
  const isToday = scheduleDate === minDate;
  const now = new Date();
  const minTime = isToday
    ? `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    : undefined;

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
    if (!scheduleExamId || !scheduleDate || !scheduleStartTime || !calcEndTime) return;
    setSaving(true);
    try {
      const startDateTime = `${scheduleDate}T${scheduleStartTime}`;
      const endDateTime = `${scheduleDate}T${calcEndTime}`;
      await api.post('/timetable', {
        examId: scheduleExamId,
        classId: selectedClassId,
        startTime: new Date(startDateTime).toISOString(),
        endTime: new Date(endDateTime).toISOString(),
      });
      toast.success('Exam scheduled for class');
      setShowScheduleForm(false);
      setScheduleExamId('');
      setScheduleDate('');
      setScheduleStartTime('');
      setSelectedExamDuration(0);
      loadTimetable(selectedClassId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to schedule');
    } finally { setSaving(false); }
  };

  if (loading && !data) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <PortalSpinner size="lg" color="green" />
    </div>
  );

  const scheduled = data?.exams?.filter(e => e.startTime) || [];
  const unscheduled = data?.exams?.filter(e => !e.startTime) || [];
  const grouped = groupByDate(scheduled);

  return (
    <>
      <AdminHeader
        subtitle="Exam Timetable"
        actions={
          <div className="flex items-center gap-4">
            <Link
              href="/admin/exams"
              className="px-5 py-2.5 bg-brand-gold text-brand-green rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hover:brightness-110 shadow-xl"
            >
              Manage Exams
            </Link>
          </div>
        }
      />
      <main className="max-w-7xl mx-auto px-8 py-16">
        {/* Class Selector */}
        <div className="premium-card p-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Select Class</label>
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="w-full md:w-96 bg-white border-2 border-slate-200 rounded-xl px-5 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-brand-green/40 transition-all"
              >
                <option value="">-- Select a class --</option>
                {data?.classes?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              className="px-8 py-4 bg-brand-green text-white font-black rounded-xl hover:bg-green-800 transition-all shadow-xl active:scale-95 uppercase text-[10px] tracking-widest shrink-0"
            >
              {showScheduleForm ? 'Discard' : '+ Schedule Exam'}
            </button>
          </div>

          {/* Schedule Form */}
          {showScheduleForm && selectedClassId && (
            <form onSubmit={handleSchedule} className="mt-8 pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Exam</label>
                <select
                  value={scheduleExamId}
                  onChange={(e) => {
                    setScheduleExamId(e.target.value);
                    const exam = data?.availableExams?.find(x => x.id === e.target.value);
                    setSelectedExamDuration(exam?.durationMinutes || 0);
                  }}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-green-100"
                  required
                >
                  <option value="">-- Select --</option>
                  {data?.availableExams?.map(e => (
                    <option key={e.id} value={e.id}>{e.title} ({e.durationMinutes}min)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Date</label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  min={minDate}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-green-100"
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Start Time</label>
                <input
                  type="time"
                  value={scheduleStartTime}
                  onChange={(e) => setScheduleStartTime(e.target.value)}
                  min={minTime}
                  className="w-full bg-white border-2 border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-green-100"
                  required
                />
              </div>
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">End Time (auto-calculated)</label>
                <div className="w-full bg-slate-50 border-2 border-slate-200 rounded-xl px-4 py-3.5 text-xs font-bold text-slate-500">
                  {calcEndTime || '—'}
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 uppercase text-[10px] tracking-widest disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Schedule'}
              </button>
            </form>
          )}
        </div>

        {!selectedClassId && (
          <div className="premium-card p-20 text-center">
            <p className="text-lg font-black text-slate-300 uppercase tracking-widest">Select a class to manage its timetable</p>
          </div>
        )}

        {selectedClassId && (
          <>
            {/* Unscheduled */}
            {unscheduled.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center gap-4 mb-6">
                  <span className="w-2 h-8 bg-amber-400 rounded-full"></span>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Unscheduled</h2>
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">
                    {unscheduled.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {unscheduled.map(exam => (
                    <div key={exam.id} className="premium-card p-6 border-l-4 border-l-amber-400 flex flex-col">
                      <h3 className="font-black text-slate-800 uppercase tracking-tight mb-2">{exam.title}</h3>
                      <div className="text-[10px] font-bold text-slate-400 mb-3">{exam.durationMinutes} min</div>
                      <div className="mt-auto">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                          exam.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                        }`}>
                          {exam.isPublished ? 'LIVE' : 'DRAFT'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Scheduled */}
            <div className="flex items-center gap-4 mb-6">
              <span className="w-2 h-8 bg-brand-green rounded-full"></span>
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Scheduled Exams</h2>
              <span className="px-3 py-1 bg-green-50 text-brand-green rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100">
                {scheduled.length} exam(s)
              </span>
            </div>

            {scheduled.length === 0 ? (
              <div className="premium-card p-16 text-center">
                <p className="text-sm font-black text-slate-300 uppercase tracking-widest">No exams scheduled for this class</p>
                <p className="text-[10px] font-bold text-slate-400 mt-2">Use the form above to schedule an exam</p>
              </div>
            ) : (
              Object.entries(grouped).map(([dateKey, exams]) => (
                <div key={dateKey} className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-lg">📅</span>
                    <h3 className="text-base font-black text-slate-700 uppercase tracking-tight">{formatDate(dateKey)}</h3>
                    <span className="text-[9px] font-bold text-slate-400">({exams.length})</span>
                  </div>
                  <div className="space-y-3">
                    {exams.map(exam => (
                      <div key={exam.id} className="premium-card p-5 flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right min-w-[70px]">
                            <div className="text-sm font-black text-brand-green">{formatTime(exam.startTime!)}</div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Start</div>
                          </div>
                          <div className="w-10 h-[1px] bg-slate-200"></div>
                          <div className="text-right min-w-[70px]">
                            <div className="text-sm font-black text-slate-600">{exam.endTime ? formatTime(exam.endTime) : '—'}</div>
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">End</div>
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black text-slate-800 uppercase tracking-tight">{exam.title}</h4>
                          <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 mt-1">
                            <span>⏱️ {exam.durationMinutes} min</span>
                            {exam.questionCount !== undefined && <span>📝 {exam.questionCount} Q</span>}
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                              exam.isPublished ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>{exam.isPublished ? 'LIVE' : 'DRAFT'}</span>
                          </div>
                        </div>
                        <Link
                          href={`/admin/exams/${exam.id}`}
                          className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200 shrink-0"
                        >
                          Edit Exam
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
