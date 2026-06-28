'use client';

import { useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-brand-green rounded-xl flex items-center justify-center border-b-4 border-brand-green-dark">
              <span className="text-2xl font-black text-white">A</span>
            </div>
            <span className="text-xl font-black tracking-tighter text-brand-green-dark uppercase">APEX Portal</span>
          </Link>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase mb-3">Reset Passkey</h1>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Enter your registered email to receive a reset link
          </p>
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 text-center">
            <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-black text-slate-900 uppercase mb-2">Check Your Inbox</h2>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed mb-6">
              If an account with that email exists, a password reset link has been sent. It expires in 1 hour.
            </p>
            <Link href="/login" className="text-[10px] font-black text-brand-green hover:text-brand-green-dark uppercase tracking-widest">
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 space-y-6">
            <div className="floating-label-group">
              <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-400 z-10">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="institutional-input pl-14 pt-9 pb-5"
                placeholder="admin@apex.edu.ng"
                required
              />
              <label className="!left-14">Registered Email</label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-5 rounded-2xl text-[11px] font-black tracking-[0.2em] disabled:opacity-70"
            >
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center pt-2">
              <Link href="/login" className="text-[10px] font-black text-slate-400 hover:text-brand-green uppercase tracking-widest transition-colors">
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
