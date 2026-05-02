'use client';

interface QuestionCardProps {
  question: {
    id: string;
    questionText: string;
    options: Record<string, string>;
    marks: number;
  };
  selected: string | null;
  onChange: (val: string) => void;
}

export default function QuestionCard({
  question,
  selected,
  onChange,
}: QuestionCardProps) {
  return (
    <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-8 md:p-12 shadow-sm">
      <div className="mb-10 min-h-[140px] flex flex-col justify-center border-b-2 border-slate-50 pb-10">
        <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.3] text-slate-800 tracking-tight">
          {question.questionText}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(question.options).map(([key, value]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`flex items-center gap-6 p-6 md:p-8 rounded-[1.5rem] border-4 text-left transition-all active:scale-[0.98] group ${
              selected === key 
              ? 'border-jamb-green bg-green-50/50 shadow-md ring-4 ring-green-100' 
              : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:border-jamb-green/40 hover:bg-white'
            }`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 transition-all ${
              selected === key 
              ? 'bg-jamb-green text-white shadow-lg rotate-3' 
              : 'bg-white border-2 border-slate-200 text-slate-400 group-hover:text-jamb-green group-hover:border-jamb-green/40'
            }`}>
              {key}
            </div>
            <span className={`font-bold text-lg md:text-xl ${selected === key ? 'text-jamb-green' : 'text-slate-700'}`}>
              {value}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
