'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface Props {
  subtitle: string;
  actions?: ReactNode;
}

export default function AdminHeader({ subtitle, actions }: Props) {
  const pathname = usePathname();
  const isDashboard = pathname === '/admin/dashboard' || pathname === '/teacher/dashboard';

  return (
    <header className="cbt-header relative z-10 shadow-lg">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-10">
        <Link href="/admin/dashboard" className="flex items-center gap-4 group">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border-b-[3px] border-brand-gold shadow-[0_0_15px_rgba(197,160,89,0.3)] group-hover:-translate-y-0.5 group-hover:shadow-[0_0_20px_rgba(197,160,89,0.5)] transition-all shrink-0">
            <span className="text-xl font-black text-brand-green-dark">A</span>
          </div>
          <span className="text-xl font-black tracking-tight flex items-center gap-2 drop-shadow-md">
            APEX Portal <span className="text-[10px] font-bold text-brand-gold/90 block uppercase tracking-[0.2em] border-l border-white/20 pl-4 mt-1">{subtitle}</span>
          </span>
        </Link>
        <div className="flex items-center gap-6">
          {!isDashboard && (
            <Link href={pathname.includes('/teacher') ? '/teacher/dashboard' : '/admin/dashboard'} className="text-[10px] font-black uppercase tracking-widest hover:text-brand-gold transition-colors">BACK TO DASHBOARD</Link>
          )}
          {actions}
        </div>
      </div>
    </header>
  );
}
