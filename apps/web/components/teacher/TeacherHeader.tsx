'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface Props {
  subtitle: string;
  actions?: ReactNode;
}

export default function TeacherHeader({ subtitle, actions }: Props) {
  return (
    <header className="cbt-header relative z-10">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/teacher/dashboard" className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border-b-2 border-slate-300">
            <svg className="w-5 h-5 text-brand-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <span className="text-xl font-black tracking-tight flex items-center gap-2">
            CBT Exam <span className="text-xs font-bold text-brand-gold/80 block uppercase tracking-widest border-l border-white/20 pl-4 mt-1">{subtitle}</span>
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/teacher/dashboard" className="text-[10px] font-black uppercase tracking-widest hover:text-brand-gold transition-colors">BACK TO DASHBOARD</Link>
          {actions}
        </div>
      </div>
    </header>
  );
}
