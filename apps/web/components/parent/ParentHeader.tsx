'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';

interface Props {
  title?: string;
}

export default function ParentHeader({ title }: Props) {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return (
    <header className="cbt-header">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/parent" className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border-b-2 border-slate-300">
            <svg className="w-5 h-5 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight">{title || 'Parent Portal'}</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/parent" className="text-[10px] font-black uppercase tracking-widest hover:text-brand-gold transition-colors">DASHBOARD</Link>
          <button
            onClick={() => { clearAuth(); window.location.href = '/login'; }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg text-[10px] uppercase tracking-widest transition-all"
          >
            Log Out
          </button>
        </div>
      </div>
    </header>
  );
}
