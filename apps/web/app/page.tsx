'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50/30 text-slate-900 selection:bg-green-100 selection:text-green-900 overflow-x-hidden font-sans">
      {/* News Ticker / Security Banner */}
      <div className="bg-gradient-to-r from-brand-green-dark via-brand-green to-brand-green-dark text-brand-gold py-3 px-6 overflow-hidden whitespace-nowrap border-b border-brand-gold/30 relative z-30 shadow-md">
        <div className="animate-marquee inline-block text-[9px] font-black uppercase tracking-[0.25em]">
          ⚠️ OFFICIAL NOTICE: EXAMINATION INTEGRITY PROTOCOL ACTIVE — ALL IP ADDRESSES AND PORTAL TRANSFERS ARE LOGGED BY THE ADMINISTRATIVE BOARD — STRICT ZERO-TOLERANCE POLICY ENFORCED FOR UNAUTHORIZED TAB DEPARTURES
        </div>
      </div>

      {/* Official Header */}
      <header className="cbt-header relative z-20 backdrop-blur-md bg-[var(--brand-green-dark)]/95">
        <div className="max-w-7xl mx-auto px-8 h-24 flex items-center justify-between">
          <div className="flex items-center gap-5 group cursor-pointer">
            <div className="w-14 h-14 bg-white/95 rounded-2xl flex items-center justify-center border-4 border-brand-gold shadow-lg shadow-black/20 overflow-hidden transition-all duration-300 group-hover:rotate-6">
              <svg className="w-8 h-8 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter leading-none text-white uppercase">CBT Portal</span>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-brand-gold mt-1.5 opacity-90">Academic Command Center</span>
            </div>
          </div>
          <nav className="flex items-center gap-8">
            <Link 
              href="/login" 
              className="btn-gold shadow-xl shadow-brand-gold/10 group active:scale-95"
            >
              Access Secure Portal 
              <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="relative">
        {/* Banner Section */}
        <section className="bg-gradient-to-b from-brand-green-dark via-brand-green to-emerald-950 pt-28 pb-48 text-white text-center relative overflow-hidden">
          {/* Subtle Ambient Decorative Circles */}
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-gold/5 blur-[100px] pointer-events-none"></div>

          <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          </div>

          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-md">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">Active Assessment Protocol v4.8</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.05] uppercase">
              Service Excellence <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-gold via-amber-200 to-brand-gold-light">
                Academic Integrity
              </span>
            </h1>
            
            <p className="text-base md:text-lg text-white/70 font-medium mb-14 max-w-2xl mx-auto leading-relaxed">
              Welcome to the standardized Computer-Based Testing environment for academic evaluations. Enforcing server-authoritative timings, randomized shuffles, and strict compliance logs.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 max-w-md mx-auto">
              <Link 
                href="/login" 
                className="w-full sm:w-auto btn-gold py-5 px-10 text-[11px] font-black uppercase tracking-[0.15em] hover:scale-[1.02] shadow-2xl"
              >
                CANDIDATE ENTRY
              </Link>
              <Link 
                href="/login" 
                className="w-full sm:w-auto btn-secondary bg-white/5 border-white/10 text-white hover:bg-white/10 py-5 px-10 text-[11px] font-black uppercase tracking-[0.15em]"
              >
                ADMINISTRATIVE AUDIT
              </Link>
            </div>
          </div>

          {/* Decorative Divider */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none rotate-180">
            <svg className="relative block w-full h-[50px] text-slate-50/30" viewBox="0 0 1200 1200" preserveAspectRatio="none" fill="currentColor">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,117.88c45.24,26.23,90.46,55,138.83,75.12,60,25,123,32.74,185.34,31.76V0H0V97.35c63.63,16,129.54,21.3,193,17.47C254,111.18,287.32,93.44,321.39,56.44Z"></path>
            </svg>
          </div>
        </section>

        {/* Feature Grid with dynamic portal cards */}
        <section className="max-w-7xl mx-auto px-8 -mt-24 relative z-10 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="portal-card group hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-emerald-50 text-brand-green rounded-2xl flex items-center justify-center text-2xl mb-8 border border-emerald-100/50 shadow-inner group-hover:scale-110 transition-transform">
                🛡️
              </div>
              <h3 className="text-lg font-black mb-4 uppercase tracking-tight text-slate-800">Compliance Nodes</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-8 flex-grow">
                Our active anti-cheat system monitors tab focus shifts and fullscreen departures. Any violations increment compliance tallies and notify supervisors immediately.
              </p>
              <div className="h-1.5 w-12 bg-gradient-to-r from-brand-green to-emerald-500 rounded-full"></div>
            </div>

            <div className="portal-card group hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-amber-50 text-brand-gold rounded-2xl flex items-center justify-center text-2xl mb-8 border border-amber-100/50 shadow-inner group-hover:scale-110 transition-transform">
                ⏳
              </div>
              <h3 className="text-lg font-black mb-4 uppercase tracking-tight text-slate-800">Server Authority</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-8 flex-grow">
                Timers are synchronized and tracked directly by server clocks. Eliminates local browser modifications, forcing immediate automated submission when time expires.
              </p>
              <div className="h-1.5 w-12 bg-gradient-to-r from-brand-gold to-yellow-500 rounded-full"></div>
            </div>

            <div className="portal-card group hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-8 border border-indigo-100/50 shadow-inner group-hover:scale-110 transition-transform">
                📊
              </div>
              <h3 className="text-lg font-black mb-4 uppercase tracking-tight text-slate-800">Instant Grading</h3>
              <p className="text-slate-500 text-xs leading-relaxed mb-8 flex-grow">
                Objective MCQ assessments are fully auto-graded instantly. Theory questions are routed seamlessly to manual review tables for synthesized administrative scoring.
              </p>
              <div className="h-1.5 w-12 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full"></div>
            </div>
          </div>
        </section>

        {/* Informational Academic Section */}
        <section className="bg-white border-t border-slate-100 py-24 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 rounded-full bg-slate-50/40 blur-3xl pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-7">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-8 text-brand-green-dark uppercase leading-tight">
                Authoritative Portal for <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-gold to-yellow-600">
                  Secure Academic Appraisals
                </span>
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-10">
                Designed to provide a secure and standard interface for all educational testing standards. Engineered with high-performance frameworks to guarantee zero data loss during active testing windows.
              </p>
              
              <div className="space-y-6">
                {[
                  "Secure tokenized session locks preventing multiple client entry points.",
                  "Fisher-Yates dynamic randomizations mapped uniquely to candidates.",
                  "Real-time background autosave loops syncing data buffers every minute.",
                  "Dynamic report generation integrated directly into academic transcripts."
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-1 w-5 h-5 rounded-full bg-brand-green/10 text-brand-green flex items-center justify-center text-[10px] font-black shrink-0">✓</div>
                    <p className="font-bold text-slate-700 text-xs tracking-wide leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-slate-100/50 rounded-[2.5rem] p-4 border border-slate-200/60 shadow-inner group relative">
              <div className="bg-white rounded-[2rem] p-12 shadow-sm flex flex-col items-center text-center transition-transform duration-300 group-hover:scale-[1.01]">
                <div className="w-20 h-20 bg-green-50/50 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-inner">🏛️</div>
                <h4 className="text-xl font-black mb-4 uppercase tracking-tight text-slate-800">Verification Gateway</h4>
                <p className="text-slate-500 text-xs mb-10 leading-relaxed">
                  All tests taken within this system generate fully encrypted audit transcripts validated by the academic oversight board.
                </p>
                <Link 
                  href="/login" 
                  className="btn-primary w-full shadow-lg shadow-green-900/10 active:scale-95"
                >
                  START SECURE VERIFICATION
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-brand-green-dark border-t border-brand-gold/20 h-24 flex items-center justify-center px-6">
        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 text-center">
          &copy; {new Date().getFullYear()} CBT ACADEMIC PORTAL — SECURE DISTRIBUTED ASSESSMENT SYSTEM
        </p>
      </footer>
    </div>
  );
}
