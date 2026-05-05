'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  email: string;
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

export default function ParentTranscriptsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [transcriptsLoading, setTranscriptsLoading] = useState(false);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  useEffect(() => {
    api.get('/parent/my-students')
      .then((res) => {
        setStudents(res.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Unauthorized');
        setLoading(false);
        router.push('/login');
      });
  }, []);

  const loadStudentTranscripts = async (student: Student) => {
    setSelectedStudent(student);
    setTranscriptsLoading(true);
    try {
      const res = await api.get(`/parent/student/${student.id}/transcripts`);
      setTranscripts(res.data);
    } catch {
      toast.error('Failed to load transcripts');
    } finally {
      setTranscriptsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100">
      <header className="cbt-header">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border-2 border-brand-gold">
              <svg className="w-7 h-7 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="flex flex-col border-l border-white/20 pl-4">
              <span className="text-sm font-black uppercase tracking-widest text-brand-gold">Parent Portal</span>
              <span className="text-[10px] font-bold opacity-70">Transcript Access</span>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-black uppercase tracking-tight">{user?.name}</span>
              <span className="text-[10px] font-bold text-brand-gold/80 block uppercase tracking-widest">PARENT/GUARDIAN</span>
            </div>
            <button 
              onClick={handleLogout}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-black/20"
            >
              Log Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center gap-6 mb-8">
          <Link href="/parent" className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-green transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-12 flex items-center gap-4">
          Academic Transcripts
          <span className="h-1 bg-brand-green flex-grow rounded-full opacity-10"></span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 mb-6 ml-2">LINKED WARDS</h2>
            <div className="space-y-4">
              {students.length === 0 ? (
                <div className="portal-card p-10 text-center border-dashed">
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No wards linked to your profile.</p>
                  <p className="text-[10px] text-slate-300 mt-2">Contact administration to link your child.</p>
                </div>
              ) : (
                students.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => loadStudentTranscripts(student)}
                    className={`portal-card p-6 w-full text-left transition-all ${
                      selectedStudent?.id === student.id ? 'border-brand-green bg-green-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl">
                        👨‍🎓
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-tight">{student.name}</h3>
                        <p className="text-[10px] font-mono text-slate-400">{student.email}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedStudent ? (
              <div>
                <div className="flex items-center justify-between mb-8 border-b-2 border-slate-200 pb-6">
                  <h2 className="text-xl font-black text-brand-green uppercase tracking-tight">
                    {selectedStudent.name}&apos;s Transcripts
                  </h2>
                  <span className="bg-slate-200 px-3 py-1 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    {transcripts.length} DOCUMENT(S)
                  </span>
                </div>

                {transcriptsLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : transcripts.length === 0 ? (
                  <div className="portal-card p-20 text-center border-dashed">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No transcripts generated yet.</p>
                    <p className="text-[10px] text-slate-300 mt-2">Contact administration to generate transcripts.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {transcripts.map((t) => (
                      <div key={t.id} className="portal-card bg-white overflow-hidden relative">
                        {t.isFinalized && (
                          <div className="absolute top-0 right-0 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-xl">
                            Finalized
                          </div>
                        )}
                        <div className="p-8">
                          <div className="flex items-start justify-between mb-6">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic Period</p>
                              <p className="text-sm font-bold text-slate-700">
                                {new Date(t.periodStart).toLocaleDateString()} — {t.periodEnd ? new Date(t.periodEnd).toLocaleDateString() : 'Present'}
                              </p>
                              {t.generatedBy && (
                                <p className="text-[10px] font-mono text-slate-400 mt-1">Generated by: {t.generatedBy.name}</p>
                              )}
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Average Score</p>
                              <p className={`text-4xl font-black tabular-nums ${
                                t.averageScore >= 70 ? 'text-brand-green' : t.averageScore >= 50 ? 'text-amber-500' : 'text-red-500'
                              }`}>
                                {Math.round(t.averageScore)}%
                              </p>
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

                          <div className="mt-6 flex justify-between items-center pt-6 border-t border-slate-100">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                              Created: {new Date(t.createdAt).toLocaleDateString()}
                            </p>
                            <button
                              onClick={() => window.print()}
                              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                              Print
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="portal-card p-20 text-center border-dashed h-full flex items-center justify-center">
                <div>
                  <p className="text-4xl mb-4 opacity-20">👆</p>
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Select a ward to view their transcripts.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
