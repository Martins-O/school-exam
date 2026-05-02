'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

interface Result {
  submissionId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: string;
  startedAt: string;
  submittedAt: string;
  autoSubmitted: boolean;
}

export default function ResultDetailPage() {
  const { submissionId } = useParams();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get(`/results/${submissionId}`)
      .then((res) => setResult(res.data))
      .catch(() => router.push('/login'))
      .finally(() => setLoading(false));
  }, [submissionId]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-jamb-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!result) return null;

  const timeTaken = result.submittedAt
    ? (new Date(result.submittedAt).getTime() - new Date(result.startedAt).getTime()) / 60000
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-green-100">
      <header className="jamb-header">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-[10px] font-black uppercase tracking-[0.3em] text-white hover:text-jamb-gold transition-colors flex items-center gap-2"
          >
            <span>←</span> Back to Portal
          </button>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-white rounded flex items-center justify-center font-black text-jamb-green">J</div>
             <span className="text-sm font-black uppercase tracking-widest text-jamb-gold">Verification Result</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-20">
        <div className="portal-card bg-white p-12 relative overflow-hidden">
           {/* Certification Watermark */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] rotate-[-25deg] pointer-events-none text-9xl font-black whitespace-nowrap">
              JAMB CERTIFIED RESULT
           </div>

           <div className="relative z-10">
              <div className="text-center mb-12">
                 <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 border-4 border-white shadow-lg ring-8 ring-green-50">🏆</div>
                 <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Examination Success Certificate</h2>
                 <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tight leading-tight">{result.examTitle}</h1>
              </div>

              {result.autoSubmitted && (
                <div className="bg-amber-50 border-2 border-amber-100 text-amber-700 px-6 py-4 rounded-2xl mb-12 text-xs font-black flex items-center gap-4 uppercase tracking-wider">
                  <span className="text-2xl">⚖️</span>
                  System-Force-Submitted: Time expiration or Security protocol violation detected.
                </div>
              )}

              <div className="grid grid-cols-2 gap-8 mb-12">
                <div className="bg-slate-50 border-2 border-slate-100 p-8 rounded-[1.5rem] flex flex-col items-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Score</p>
                   <p className="text-5xl font-black text-slate-800 tabular-nums">
                     {result.score} <span className="text-slate-300 text-2xl">/</span> {result.totalMarks}
                   </p>
                </div>
                <div className="bg-slate-50 border-2 border-slate-100 p-8 rounded-[1.5rem] flex flex-col items-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Percentage</p>
                   <p className={`text-5xl font-black tabular-nums ${
                      result.percentage >= 70 ? 'text-jamb-green' : result.percentage >= 50 ? 'text-amber-500' : 'text-red-500'
                   }`}>
                     {Math.round(result.percentage)}%
                   </p>
                </div>
                <div className="bg-slate-50 border-2 border-slate-100 p-8 rounded-[1.5rem] flex flex-col items-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Terminal State</p>
                   <div className="flex items-center gap-2 mt-2">
                      <span className={`w-2 h-2 rounded-full ${result.status === 'submitted' ? 'bg-jamb-green' : 'bg-red-500'}`}></span>
                      <span className="text-xl font-black uppercase tracking-tighter text-slate-700">{result.status}</span>
                   </div>
                </div>
                <div className="bg-slate-50 border-2 border-slate-100 p-8 rounded-[1.5rem] flex flex-col items-center">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Session Log</p>
                   <p className="text-4xl font-black text-slate-800 tabular-nums uppercase tracking-tighter">
                     {Math.round(timeTaken)} <span className="text-xs font-bold text-slate-300">MINS</span>
                   </p>
                </div>
              </div>

              <div className="pt-12 border-t-2 border-dashed border-slate-100 flex flex-col sm:flex-row gap-4">
                 <button
                    onClick={() => router.push('/dashboard')}
                    className="flex-1 bg-jamb-green text-white font-black py-5 rounded-xl hover:bg-green-800 transition-all shadow-xl shadow-green-900/10 uppercase text-xs tracking-widest"
                 >
                    Establish New Link
                 </button>
                 <button
                    onClick={() => window.print()}
                    className="px-10 py-5 bg-white border-2 border-slate-200 text-slate-600 font-black rounded-xl hover:bg-slate-50 transition-all uppercase text-xs tracking-widest"
                 >
                    🖨️ Print Record
                 </button>
              </div>

              <div className="mt-12 text-center">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.4em] leading-relaxed">
                   THIS IS AN ELECTRICALLY GENERATED CERTIFICATE. ANY MODIFICATION INVALIDATES THIS RECORD. <br />
                   VERIFICATION ID: {submissionId?.toString().toUpperCase()} — GATEWAY: JAMB-CBT-1.0
                </p>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
