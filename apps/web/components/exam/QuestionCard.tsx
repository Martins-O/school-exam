interface QuestionCardProps {
  question: {
    id: string;
    questionText: string;
    options: Record<string, string>;
    marks: number;
    image?: string;
  };
  selectedAnswer: string | null;
  onAnswer: (answer: string) => void;
  isFlagged: boolean;
  onToggleFlag: () => void;
}

export default function QuestionCard({
  question,
  selectedAnswer,
  onAnswer,
}: QuestionCardProps) {
  return (
    <div className="glass-card p-10 rounded-[2.5rem]">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest">
            {question.marks} POINT{question.marks !== 1 ? 'S' : ''}
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold leading-tight text-white">
          {question.questionText}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(question.options).map(([key, value]) => (
          <button
            key={key}
            onClick={() => onAnswer(key)}
            className={`flex items-center gap-4 p-6 rounded-3xl border-2 text-left transition-all group ${
              selectedAnswer === key 
              ? 'border-blue-600 bg-blue-600/10 text-white shadow-lg shadow-blue-600/10' 
              : 'border-white/5 bg-white/5 text-slate-400 hover:border-white/20 hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 transition-colors ${
              selectedAnswer === key 
              ? 'bg-blue-600 text-white' 
              : 'bg-white/5 text-slate-500 group-hover:bg-white/20 group-hover:text-white'
            }`}>
              {key}
            </div>
            <span className="font-semibold text-lg">{value}</span>
            {selectedAnswer === key && (
              <div className="ml-auto w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] animate-in zoom-in duration-300">
                ✓
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
