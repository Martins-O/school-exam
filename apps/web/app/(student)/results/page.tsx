'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

interface Result {
  submissionId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: string;
  submittedAt: string;
}

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const router = useRouter();

  useEffect(() => {
    api.get('/results/my')
      .then((res) => setResults(res.data))
      .catch(() => router.push('/login'));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/5 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-md px-6 h-20 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl transition-transform group-hover:scale-110">C</div>
          <span className="text-xl font-bold">CBT Platform</span>
        </Link>
        <Link href="/dashboard" className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
          RETURN TO DASHBOARD
        </Link>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        <header className="mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Performance History</h1>
          <p className="text-slate-400">Review your past scores and examination statuses.</p>
        </header>

        {results.length === 0 ? (
          <div className="glass-card p-20 text-center text-slate-500 rounded-3xl border-dashed">
            <p className="text-lg">No examination results found.</p>
            <p className="text-sm mt-2 text-slate-600">Once you complete an exam, your score will appear here.</p>
          </div>
        ) : (
          <div className="glass-card rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 border-b border-white/5">
                    <th className="px-8 py-6">Examination Title</th>
                    <th className="px-8 py-6">Raw Score</th>
                    <th className="px-8 py-6 text-center">Performance</th>
                    <th className="px-8 py-6">Status Type</th>
                    <th className="px-8 py-6 text-right">Completion Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {results.map((r) => (
                    <tr
                      key={r.submissionId}
                      onClick={() => router.push(`/results/${r.submissionId}`)}
                      className="hover:bg-white/[0.04] cursor-pointer transition-colors group"
                    >
                      <td className="px-8 py-6 font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                        {r.examTitle}
                      </td>
                      <td className="px-8 py-6 font-mono text-slate-400 tabular-nums">
                        {r.score} <span className="text-slate-700">/</span> {r.totalMarks}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${
                                r.percentage >= 70 ? 'bg-emerald-500' : r.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${r.percentage}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-black tabular-nums ${
                            r.percentage >= 70 ? 'text-emerald-500' : r.percentage >= 50 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {r.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${
                          r.status === 'submitted'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : r.status === 'timed_out'
                            ? 'bg-red-500/10 text-red-400 border-red-500/20'
                            : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                             r.status === 'submitted' ? 'bg-emerald-500' : r.status === 'timed_out' ? 'bg-red-500' : 'bg-yellow-500'
                          }`}></span>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right text-xs font-medium text-slate-500">
                        {new Date(r.submittedAt).toLocaleDateString()}
                        <div className="text-[10px] opacity-40">{new Date(r.submittedAt).toLocaleTimeString()}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
