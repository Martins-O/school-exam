'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-green-100 selection:text-green-900">
      {/* Official Header */}
      <header className="cbt-header relative z-20">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center border-4 border-brand-gold shadow-inner overflow-hidden">
              <svg className="w-8 h-8 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tighter leading-none">CBT Exam</span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">COMPUTER BASED TEST</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="/login" 
              className="px-6 py-2 bg-brand-gold text-brand-green font-black rounded-lg text-xs uppercase tracking-widest shadow-lg shadow-black/20 hover:scale-105 transition-all"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Sub Header / News Ticker */}
      <div className="bg-brand-gold text-brand-green py-2 px-6 overflow-hidden whitespace-nowrap">
        <div className="animate-marquee inline-block text-[10px] font-black uppercase tracking-widest">
          IMPORTANT: CANDIDATES ARE ADVISED TO REGISTER WITH THEIR VALID DETAILS — EXAMINATION MALPRACTICE IS A PUNISHABLE OFFENSE — ENSURE YOUR SYSTEM IS FUNCTIONING BEFORE STARTING THE TEST
        </div>
      </div>

      <main className="relative">
        {/* Banner Section */}
        <section className="bg-brand-green pt-20 pb-40 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          </div>
          <div className="max-w-4xl mx-auto px-6 relative z-10">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6 uppercase">
              Service Excellence <br /> <span className="text-brand-gold">Integrity</span>
            </h1>
            <p className="text-lg text-white/80 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
              The standardized Computer-Based Testing platform for academic institutions. Secure, Reliable, and Authoritative.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-10 py-5 bg-brand-gold text-brand-green font-black rounded-xl hover:bg-white transition-all shadow-xl shadow-black/20"
              >
                ACCESS CANDIDATE PORTAL
              </Link>
              <Link 
                href="/login" 
                className="w-full sm:w-auto px-10 py-5 bg-white/10 border-2 border-white/20 font-black rounded-xl hover:bg-white/20 transition-all"
              >
                ADMINISTRATION
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="max-w-7xl mx-auto px-6 -mt-20 relative z-10 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="portal-card p-10 h-full flex flex-col">
              <div className="w-16 h-16 bg-green-50 text-brand-green rounded-2xl flex items-center justify-center text-3xl mb-8 border border-green-100">
                🛡️
              </div>
              <h3 className="text-xl font-black mb-4 uppercase tracking-tight">Zero Tolerance</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow">
                Our anti-cheat nodes monitor every browser action. Fullscreen enforcement and activity logging ensure a clean examination environment.
              </p>
              <div className="h-1 w-12 bg-brand-green/20 rounded-full"></div>
            </div>
            <div className="portal-card p-10 h-full flex flex-col">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-8 border border-blue-100">
                ⌛
              </div>
              <h3 className="text-xl font-black mb-4 uppercase tracking-tight">Server Authority</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow">
                Real-time server-side timer synchronization eliminates client-side bypass attempts. Sessions auto-terminate upon expiration.
              </p>
              <div className="h-1 w-12 bg-blue-600/20 rounded-full"></div>
            </div>
            <div className="portal-card p-10 h-full flex flex-col">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-3xl mb-8 border border-amber-100">
                📊
              </div>
              <h3 className="text-xl font-black mb-4 uppercase tracking-tight">Instant Audit</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-grow">
                Automated grading and performance analytics available instantly after submission. Detailed audit logs for admin review.
              </p>
              <div className="h-1 w-12 bg-amber-600/20 rounded-full"></div>
            </div>
          </div>
        </section>

        {/* Informational Section */}
        <section className="bg-white border-t border-slate-100 py-20">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-black tracking-tight mb-8 text-brand-green uppercase">
                A Unified Gateway for <br /> Future Success.
              </h2>
              <div className="space-y-6">
                {[
                  "Secure Biometric-linked Authentication Support",
                  "Cross-platform Compatibility (Chrome, Firefox, Safari)",
                  "Low-latency Real-time Data Synchronization",
                  "Automated Results Verification System"
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-1 w-5 h-5 rounded-full bg-brand-green text-white flex items-center justify-center text-[10px]">✓</div>
                    <p className="font-bold text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-100 rounded-[2.5rem] p-4 border border-slate-200 shadow-inner group">
              <div className="bg-white rounded-[2rem] p-12 shadow-sm flex flex-col items-center text-center group-hover:scale-[1.01] transition-transform">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-4xl mb-6">🏛️</div>
                <h4 className="text-2xl font-black mb-4">Official Verification</h4>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                  All examinations conducted on this platform are monitored by the institutional academic board. 
                </p>
                <Link href="/login" className="px-8 py-4 bg-brand-green text-white font-black rounded-xl hover:bg-green-800 transition-all">
                  START VERIFICATION
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 h-20 flex items-center justify-center">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
          &copy; {new Date().getFullYear()} CBT EXAM PLATFORM — SECURE ASSESSMENT SYSTEM
        </p>
      </footer>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
