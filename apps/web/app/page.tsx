import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
      </div>

      <nav className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-blue-500/20">
              C
            </div>
            <span className="text-xl font-bold tracking-tight">CBT Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link 
              href="/register" 
              className="px-5 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 rounded-full transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-8">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          SECURE COMPUTER-BASED TESTING
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
          The Modern Standard for <br /> Secure Academic Exams.
        </h1>
        
        <p className="max-w-2xl mx-auto text-lg text-slate-400 mb-12 leading-relaxed">
          Experience a secure, adversarial-resistant testing platform inspired by professional examination standards. Features anti-cheat monitoring, server-side timer authority, and real-time grading.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
          <Link 
            href="/register" 
            className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 font-bold rounded-xl hover:bg-slate-200 transition-all shadow-xl shadow-white/10 active:scale-95"
          >
            I'm a Student
          </Link>
          <Link 
            href="/login" 
            className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 font-bold rounded-xl hover:bg-white/10 transition-all active:scale-95"
          >
            Admin Dashboard
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6 text-blue-500">
              🛡️
            </div>
            <h3 className="text-xl font-bold mb-3">Anti-Cheat System</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Proprietary violation detection including tab-switch monitoring and fullscreen enforcement with auto-submission capabilities.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6 text-purple-500">
              ⚡
            </div>
            <h3 className="text-xl font-bold mb-3">Server-Side Authority</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Zero-trust architecture. Timers, grading, and question randomization are all handled securely on the server.
            </p>
          </div>
          <div className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center mb-6 text-emerald-500">
              📊
            </div>
            <h3 className="text-xl font-bold mb-3">Instant Results</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Automated grading and analytics provides students with instant feedback and admins with comprehensive performance reports.
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500 text-sm font-medium">
          &copy; {new Date().getFullYear()} CBT Exam Platform. Designed for Academic Excellence.
        </div>
      </footer>
    </div>
  );
}
