'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';

interface Props {
  title?: string;
}

export default function StudentHeader({ title }: Props) {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return (
    <header className="cbt-header">
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border-2 border-brand-gold">
              <svg className="w-7 h-7 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            </div>
          </Link>
          <div className="flex flex-col border-l border-white/20 pl-4">
            <span className="text-sm font-black uppercase tracking-widest text-brand-gold">{title || 'Candidate Portal'}</span>
            <span className="text-[10px] font-bold opacity-70">Unified Data Node</span>
          </div>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-black uppercase tracking-tight">{user?.name}</span>
            <span className="text-[10px] font-bold text-brand-gold/80 block uppercase tracking-widest">STUDENT</span>
          </div>
          <button
            onClick={() => { clearAuth(); window.location.href = '/login'; }}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-black/20"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
