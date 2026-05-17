'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Link from 'next/link';
import AdminHeader from '@/components/admin/AdminHeader';
import PortalSpinner from '@/components/ui/PortalSpinner';

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
      <PortalSpinner size="lg" color="green" />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-green-100 pb-20">
      <AdminHeader 
        subtitle="Academic Analytics"
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/dashboard')}
              className="px-4 py-2 text-[10px] font-black text-white/60 hover:text-white transition-all uppercase tracking-[0.2em] hover:translate-x-[-4px]"
            >
              ← Dashboard
            </button>
            <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
            <button className="px-6 py-2.5 bg-brand-gold text-brand-green rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-gold/20 hover:brightness-110">
              Export Master Spreadsheet
            </button>
          </div>
        }
      />
      
      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="mb-16">
          <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">Academic Audit Logs</h1>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em]">{results.length} CERTIFIED RECORDS DETECTED IN REPOSITORY</p>
        </div>

        <div className="premium-card overflow-hidden bg-white shadow-2xl shadow-black/[0.03]">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] uppercase tracking-[0.3em] font-black text-slate-400 border-b border-slate-100">
                <th className="px-10 py-6">Candidate Identity</th>
                <th className="px-10 py-6">Examination Terminal</th>
                <th className="px-10 py-6 text-center">Valuation Metric</th>
                <th className="px-10 py-6 text-center">Operational State</th>
                <th className="px-10 py-6 text-right">Audit Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {results.map((r) => (
                <tr
                  key={r.submissionId}
                  onClick={() => router.push(`/results/${r.submissionId}`)}
                  className="hover:bg-slate-50/50 cursor-pointer transition-colors group"
                >
                  <td className="px-10 py-8">
                    <div className="font-black text-slate-900 group-hover:text-brand-green transition-colors uppercase tracking-tight text-sm">{r.studentName}</div>
                    <div className="text-[10px] font-black text-slate-300 mt-1 uppercase tracking-widest">{r.studentEmail}</div>
                  </td>
                  <td className="px-10 py-8 text-[11px] font-black text-slate-500 uppercase tracking-tighter max-w-[200px]">
                    {r.examTitle}
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex flex-col items-center">
                       <div className={`px-5 py-2 rounded-xl font-black text-sm shadow-sm border ${
                        r.percentage >= 70
                          ? 'bg-brand-green text-white border-transparent'
                          : r.percentage >= 50
                          ? 'bg-brand-gold text-brand-green border-transparent'
                          : 'bg-red-600 text-white border-transparent'
                      }`}>
                        {Math.round(r.percentage)}%
                      </div>
                      <div className="text-[9px] font-black text-slate-300 mt-2 tracking-widest tabular-nums uppercase">
                        {r.score} <span className="opacity-40">OF</span> {r.totalMarks}
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-center">
                    <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                      r.status === 'submitted'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right font-black text-[10px] text-slate-400 uppercase tracking-widest">
                    <div className="text-slate-600">{new Date(r.submittedAt).toLocaleDateString()}</div>
                    <div className="opacity-40 text-[9px] mt-1">{new Date(r.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-40 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8">
                       <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17v-2a4 4 0 00-4-4H5m11 9a4 4 0 01-4-4v-2" /></svg>
                    </div>
                    <h3 className="text-xl font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Audit Registry Vacant</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No examination records have been verified yet.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-8 py-12 text-center border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Institutional Analytics Engine © 2024</p>
      </footer>
    </div>
  );
}
