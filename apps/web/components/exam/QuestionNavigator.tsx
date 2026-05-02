interface QuestionNavigatorProps {
  questions: { id: string }[];
  answers: Record<string, string>;
  flaggedQuestions: string[];
  currentIndex: number;
  onNavigate: (index: number) => void;
}

export default function QuestionNavigator({
  questions,
  answers,
  flaggedQuestions,
  currentIndex,
  onNavigate,
}: QuestionNavigatorProps) {
  return (
    <div>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, idx) => {
          const isAnswered = !!answers[q.id];
          const isFlagged = flaggedQuestions.includes(q.id);
          const isCurrent = idx === currentIndex;

          let stateStyles = 'bg-white/5 border-white/10 text-slate-500 hover:bg-white/10 hover:text-white';
          if (isCurrent) {
            stateStyles = 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20';
          } else if (isFlagged) {
            stateStyles = 'bg-yellow-500/20 border-yellow-500/30 text-yellow-500';
          } else if (isAnswered) {
            stateStyles = 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
          }

          return (
            <button
              key={q.id}
              onClick={() => onNavigate(idx)}
              className={`relative w-full aspect-square rounded-xl text-xs font-black border transition-all active:scale-90 ${stateStyles}`}
            >
              {idx + 1}
              {isAnswered && !isCurrent && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full shadow-sm"></div>
              )}
            </button>
          );
        })}
      </div>
      
      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
          <span className="text-slate-500">Status Legend</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500/80">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            ANSWERED
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-yellow-500/80">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            FLAGGED
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500/80">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            ACTIVE
          </div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
            <div className="w-2 h-2 bg-slate-700 rounded-full"></div>
            REMAINING
          </div>
        </div>
      </div>
    </div>
  );
}
