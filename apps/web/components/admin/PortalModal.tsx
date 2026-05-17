'use client';

import { ReactNode, useEffect, useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function PortalModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info'
}: Props) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => setShow(false), 300);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!show && !isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={`relative w-full max-w-md premium-card p-10 animate-in fade-in zoom-in-95 duration-300 ease-out ${!isOpen && 'animate-out fade-out zoom-out-95'}`}>
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 border-4 ${
            type === 'danger' ? 'bg-red-50 border-red-100 text-red-500' : 
            type === 'warning' ? 'bg-amber-50 border-amber-100 text-amber-500' : 
            'bg-brand-green/5 border-brand-green/10 text-brand-green'
          }`}>
            {type === 'danger' && (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            )}
            {type === 'warning' && (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            )}
            {type === 'info' && (
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )}
          </div>
          
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-4">{title}</h3>
          <p className="text-sm font-bold text-slate-500 leading-relaxed mb-10">{message}</p>
          
          <div className="flex gap-4 w-full">
            <button
              onClick={onClose}
              className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 py-4 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-900/20' : 
                type === 'warning' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-900/20' : 
                'bg-brand-green hover:bg-green-800 shadow-green-900/20'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
