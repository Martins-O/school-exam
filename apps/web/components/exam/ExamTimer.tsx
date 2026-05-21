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
  
  const isDanger = remainingSeconds < 300;

  return (
    <div className={`bg-black/20 border-2 rounded-xl px-4 py-2 min-w-[140px] text-center transition-all duration-500 ${
      isDanger ? 'border-red-500 bg-red-500/10' : 'border-brand-gold bg-black/40'
    }`}>
      <div className={`text-3xl font-black font-mono tracking-wider tabular-nums ${isDanger ? 'text-red-500 animate-pulse' : 'text-brand-gold'}`}>
        {h > 0 && <span>{hh}:</span>}
        <span>{mm}</span>
        <span className="opacity-40 mx-0.5">:</span>
        <span>{ss}</span>
      </div>
    </div>
  );
}
