'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';

interface Submission {
  submissionId: string;
  examTitle: string;
  studentName: string;
  studentEmail: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: string;
  submittedAt: string;
  startedAt: string;
}

interface Exam {
  id: string;
  title: string;
}

export default function TeacherResultsPage() {
  const [results, setResults] = useState<Submission[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterExamId, setFilterExamId] = useState<string>('all');
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resultsRes, examsRes] = await Promise.all([
        api.get('/teacher/results'),
        api.get('/teacher/exams'),
      ]);
      setResults(resultsRes.data);
      setExams(examsRes.data);
      setLoading(false);
    } catch {
      router.push('/login');
    }
  };

  const filteredResults = filterExamId === 'all'
    ? results
    : results.filter(r => {
        const exam = exams.find(e => e.title === r.examTitle);
        return exam?.id === filterExamId;
      });

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
              CBT Exam <span className="text-xs font-bold text-brand-gold/80 block uppercase tracking-widest border-l border-white/20 pl-4 mt-1">Results</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/teacher/dashboard" className="text-[10px] font-black uppercase tracking-widest hover:text-brand-gold transition-colors">BACK TO DASHBOARD</Link>
            <Link href="/teacher/exams" className="text-[10px] font-black uppercase tracking-widest hover:text-brand-gold transition-colors underline underline-offset-4">MY EXAMS</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-8 flex items-center gap-4">
          Student Results
          <span className="h-1 bg-brand-green flex-grow rounded-full opacity-10"></span>
        </h1>

        {/* Filter */}
        {exams.length > 0 && (
          <div className="mb-8 flex items-center gap-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Exam:</label>
            <select
              value={filterExamId}
              onChange={(e) => setFilterExamId(e.target.value)}
              className="bg-white border-2 border-slate-100 rounded-lg px-4 py-2 text-xs font-bold focus:outline-none focus:border-brand-green/40"
            >
              <option value="all">All Exams</option>
              {exams.map((exam) => (
                <option key={exam.id} value={exam.id}>{exam.title}</option>
              ))}
            </select>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="portal-card p-6 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Submissions</p>
            <p className="text-3xl font-black text-slate-800 mt-2">{filteredResults.length}</p>
          </div>
          <div className="portal-card p-6 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Average Score</p>
            <p className="text-3xl font-black text-slate-800 mt-2">
              {filteredResults.length > 0
                ? Math.round(filteredResults.reduce((sum, r) => sum + r.percentage, 0) / filteredResults.length)
                : 0}%
            </p>
          </div>
          <div className="portal-card p-6 bg-white">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pass Rate (≥50%)</p>
            <p className="text-3xl font-black text-slate-800 mt-2">
              {filteredResults.length > 0
                ? Math.round((filteredResults.filter(r => r.percentage >= 50).length / filteredResults.length) * 100)
                : 0}%
            </p>
          </div>
        </div>

        {/* Results Table */}
        <div className="portal-card bg-white overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 border-b border-slate-200">
                <th className="px-8 py-6">Student</th>
                <th className="px-8 py-6">Exam</th>
                <th className="px-8 py-6">Score</th>
                <th className="px-8 py-6">Percentage</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6">Submitted</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    <p className="text-sm font-black uppercase tracking-widest">No results yet.</p>
                    <p className="text-[10px] font-bold mt-1">Results will appear when students submit exams.</p>
                  </td>
                </tr>
              ) : (
                filteredResults.map((sub) => (
                  <tr key={sub.submissionId} className="hover:bg-green-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-bold text-sm text-slate-800">{sub.studentName}</div>
                      <div className="text-[10px] text-slate-400">{sub.studentEmail}</div>
                    </td>
                    <td className="px-8 py-6 text-xs font-bold text-slate-600">{sub.examTitle}</td>
                    <td className="px-8 py-6 text-sm font-black text-slate-800">
                      {sub.score}/{sub.totalMarks}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-sm font-black ${
                        sub.percentage >= 70 ? 'text-green-600' : sub.percentage >= 50 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {sub.percentage}%
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        sub.status === 'submitted'
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                          : sub.status === 'timed_out'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-amber-50 text-amber-600 border-amber-200'
                      }`}>
                        {sub.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-bold text-slate-400">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <Link
                        href={`/results/${sub.submissionId}`}
                        className="text-[10px] font-black uppercase tracking-widest text-brand-green hover:underline underline underline-offset-4"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
