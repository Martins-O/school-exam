'use client';

interface QuestionNavigatorProps {
  total: number;
  currentIndex: number;
  answers: Record<string, string>;
  flagged: string[];
  questionIds: string[];
  onJump: (idx: number) => void;
}

export default function QuestionNavigator({
  total,
  currentIndex,
  answers,
  flagged: flaggedQuestions,
  questionIds,
  onJump,
}: QuestionNavigatorProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Question Matrix</h3>
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-jamb-green rounded"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Answered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Flagged</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: total }).map((_, idx) => {
          const qId = questionIds[idx];
          const isAnswered = !!answers[qId];
          const isFlagged = flaggedQuestions.includes(qId);
          const isCurrent = idx === currentIndex;

          let bgClass = 'bg-slate-100 text-slate-400 border-slate-200';
          if (isCurrent) {
            bgClass = 'bg-white border-4 border-blue-600 text-blue-600 shadow-sm z-10 scale-110';
          } else if (isFlagged) {
            bgClass = 'bg-amber-500 text-white border-amber-600';
          } else if (isAnswered) {
            bgClass = 'bg-jamb-green text-white border-green-900';
          }

          return (
            <button
              key={idx}
              onClick={() => onJump(idx)}
              className={`w-10 h-10 rounded-lg text-xs font-black border-b-4 transition-all active:translate-y-1 ${bgClass}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
