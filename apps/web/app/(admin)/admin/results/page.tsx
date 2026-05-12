'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';

interface Result {
  submissionId: string;
  examTitle: string;
  studentName: string;
  studentEmail: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: string;
  submittedAt: string;
}

export default function AdminResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const res = await api.get('/admin/results');
      setResults(res.data);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <>
      <AdminHeader subtitle="Analytics" />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-2">Academic Audit Logs</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">{results.length} CERTIFIED RECORDS DETECTED</p>
          </div>
          <button className="px-6 py-2 bg-slate-800 text-white font-black rounded-lg text-[10px] uppercase tracking-widest shadow-lg hover:bg-slate-900 transition-all">
            Export Master Spreadsheet
          </button>
        </div>

        <div className="portal-card overflow-hidden bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 border-b border-slate-200">
                <th className="px-8 py-6">Candidate Identity</th>
                <th className="px-8 py-6">Examination Terminal</th>
                <th className="px-8 py-6 text-center">Score Grade</th>
                <th className="px-8 py-6 text-center">State</th>
                <th className="px-8 py-6 text-right">Audit Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r) => (
                <tr
                  key={r.submissionId}
                  onClick={() => router.push(`/results/${r.submissionId}`)}
                  className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                >
                  <td className="px-8 py-6">
                    <div className="font-black text-slate-800 group-hover:text-brand-green transition-colors uppercase tracking-tight">{r.studentName}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1 uppercase">{r.studentEmail}</div>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-slate-600 uppercase tracking-tighter">
                    {r.examTitle}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col items-center">
                       <div className={`px-4 py-1.5 rounded-lg font-black text-sm border shadow-sm ${
                        r.percentage >= 70
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : r.percentage >= 50
                          ? 'bg-amber-50 border-amber-200 text-amber-600'
                          : 'bg-red-50 border-red-200 text-red-600'
                      }`}>
                        {Math.round(r.percentage)}%
                      </div>
                      <div className="text-[8px] font-black text-slate-400 mt-1.5 tracking-widest tabular-nums">
                        {r.score} OF {r.totalMarks}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      r.status === 'submitted'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-red-50 text-red-600 border-red-200'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right font-mono text-[10px] text-slate-400 uppercase">
                    <div className="font-black text-slate-600">{new Date(r.submittedAt).toLocaleDateString()}</div>
                    <div className="opacity-60">{new Date(r.submittedAt).toLocaleTimeString()}</div>
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center text-slate-400 bg-white uppercase tracking-widest font-black text-xs">
                    Verification Engine is empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
