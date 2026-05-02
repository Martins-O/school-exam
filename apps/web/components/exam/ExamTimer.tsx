interface ExamTimerProps {
  remainingSeconds: number;
}

export default function ExamTimer({ remainingSeconds }: ExamTimerProps) {
  const h = Math.floor(remainingSeconds / 3600);
  const m = Math.floor((remainingSeconds % 3600) / 60);
  const s = remainingSeconds % 60;
  
  const hh = h.toString().padStart(2, '0');
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  
  const isLow = remainingSeconds < 300;
  const isCritical = remainingSeconds < 60;

  return (
    <div className="flex flex-col items-end">
      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mb-1">Time Remaining</p>
      <div
        className={`text-4xl font-black tracking-widest flex items-center tabular-nums transition-colors duration-500 ${
          isCritical ? 'text-red-500 animate-pulse' : isLow ? 'text-orange-500' : 'text-white'
        }`}
      >
        {h > 0 && <span>{hh}<span className="text-white/20 px-1">:</span></span>}
        <span>{mm}</span>
        <span className="text-white/20 px-1">:</span>
        <span>{ss}</span>
      </div>
    </div>
  );
}
