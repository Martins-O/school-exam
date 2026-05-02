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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get('/results/my')
      .then((res) => setResults(res.data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-[#020617] p-8 text-white">Retaining academic history...</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30">
      <nav className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-md px-6 h-20 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">C</div>
          <span className="text-xl font-bold tracking-tight">CBT Records</span>
        </Link>
        <Link href="/dashboard" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
          BACK TO PORTAL
        </Link>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-10 h-[2px] bg-emerald-500"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500">Performance Archive</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-2">Academic History</h1>
          <p className="text-slate-500 font-medium">Verify your examination accomplishments and score certificates.</p>
        </header>

        {results.length === 0 ? (
          <div className="glass-card p-24 text-center rounded-[2.5rem] border-dashed border-white/10">
            <div className="text-5xl mb-6 opacity-20">📊</div>
            <p className="text-xl font-bold text-slate-400">No examination records found.</p>
            <p className="text-sm mt-2 text-slate-600">Your performance metrics will appear here upon exam completion.</p>
          </div>
        ) : (
          <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/5 shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 border-b border-white/5">
                    <th className="px-10 py-8">Examination Identity</th>
                    <th className="px-10 py-8">Score Value</th>
                    <th className="px-10 py-8 text-center">Outcome</th>
                    <th className="px-10 py-8">State</th>
                    <th className="px-10 py-8 text-right">Certificate Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {results.map((r) => (
                    <tr
                      key={r.submissionId}
                      onClick={() => router.push(`/results/${r.submissionId}`)}
                      className="hover:bg-white/[0.04] cursor-pointer transition-colors group"
                    >
                      <td className="px-10 py-8">
                        <div className="font-black text-lg text-slate-200 group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                          {r.examTitle}
                        </div>
                      </td>
                      <td className="px-10 py-8 font-mono text-xs tracking-widest text-slate-500 tabular-nums">
                        {r.score} <span className="opacity-30">/</span> {r.totalMarks} <span className="text-[10px] font-bold text-slate-600 ml-1">TOTAL</span>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center justify-center gap-4">
                          <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden flex-shrink-0">
                            <div 
                              className={`h-full transition-all duration-1000 ${
                                r.percentage >= 70 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : r.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${r.percentage}%` }}
                            ></div>
                          </div>
                          <span className={`text-xs font-black tabular-nums min-w-[32px] ${
                            r.percentage >= 70 ? 'text-emerald-500' : r.percentage >= 50 ? 'text-yellow-500' : 'text-red-500'
                          }`}>
                            {Math.round(r.percentage)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
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
                      <td className="px-10 py-8 text-right">
                        <div className="text-xs font-bold text-slate-300 mb-1">{new Date(r.submittedAt).toLocaleDateString()}</div>
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{new Date(r.submittedAt).toLocaleTimeString()}</div>
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
