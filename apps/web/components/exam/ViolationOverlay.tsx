'use client';

interface ViolationOverlayProps {
  violations: number;
  maxViolations: number;
  onDismiss: () => void;
}

export default function ViolationOverlay({ violations, maxViolations, onDismiss }: ViolationOverlayProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-6 selection:bg-red-100">
      <div className="portal-card max-w-sm w-full p-10 bg-white border-red-500/30 shadow-2xl animate-in zoom-in duration-300">
        <div className="text-red-600 text-6xl mb-8 text-center drop-shadow-sm">⚖️</div>
        <h2 className="text-2xl font-black mb-4 text-center text-slate-800 uppercase tracking-tight">Security Protocol Violation</h2>
        <p className="text-slate-500 mb-8 text-center text-sm font-medium leading-relaxed">
          The system has detected an attempt to leave the active examination environment. This action has been recorded in your audit log.
        </p>
        
        <div className="bg-red-50 border-2 border-red-100 p-6 rounded-2xl mb-8 flex flex-col items-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-1">Violation Count</p>
          <div className="flex items-center gap-1">
             <span className="text-4xl font-black text-red-700">{violations}</span>
             <span className="text-xl font-bold text-red-300">/</span>
             <span className="text-xl font-bold text-red-400">{maxViolations}</span>
          </div>
          <p className="text-[9px] font-bold text-red-800 mt-4 uppercase tracking-tighter text-center">
             REACHING {maxViolations} CAUSES AUTOMATIC DISQUALIFICATION
          </p>
        </div>

        <button
          onClick={onDismiss}
          className="w-full bg-red-600 text-white py-4 rounded-xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-900/10 uppercase text-xs tracking-widest active:scale-95"
        >
          Confirm Acknowledgment
        </button>
      </div>
    </div>
  );
}
