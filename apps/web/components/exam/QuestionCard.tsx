'use client';

import RichTextEditor from './RichTextEditor';

interface QuestionCardProps {
  question: {
    id: string;
    questionText: string;
    options?: Record<string, string>;
    marks: number;
    type?: 'objective' | 'theory';
    maxWordCount?: number | null;
    passageText?: string | null;
  };
  selected: string | null;
  onChange: (val: string) => void;
}

export default function QuestionCard({
  question,
  selected,
  onChange,
}: QuestionCardProps) {
  const questionType = question.type || 'objective';

  return (
    <div className="bg-white border-2 border-slate-200 rounded-[2rem] p-8 md:p-12 shadow-sm">
      {question.passageText && (
        <div className="mb-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl">
          <p className="text-sm font-bold text-amber-700 uppercase tracking-widest mb-3">Passage / Reading Material</p>
          <p className="text-lg leading-relaxed text-slate-700 whitespace-pre-wrap">{question.passageText}</p>
        </div>
      )}

      <div className="mb-10 min-h-[100px] flex flex-col justify-center border-b-2 border-slate-50 pb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            questionType === 'theory'
              ? 'bg-purple-100 text-purple-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {questionType === 'theory' ? 'Theory' : 'Objective'}
          </span>
          <span className="text-xs font-bold text-slate-400">({question.marks} marks)</span>
        </div>
        <h2 className="text-2xl md:text-4xl font-extrabold leading-[1.3] text-slate-800 tracking-tight">
          {question.questionText}
        </h2>
      </div>

      {questionType === 'theory' ? (
        <div>
          <RichTextEditor
            value={selected || ''}
            onChange={onChange}
            maxWordCount={question.maxWordCount}
            placeholder="Type your answer here. You can use bold, italic, and underline for formatting."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(question.options || {}).map(([key, value]) => (
            <button
              key={key}
              onClick={() => onChange(key)}
              className={`flex items-center gap-6 p-6 md:p-8 rounded-[1.5rem] border-4 text-left transition-all active:scale-[0.98] group ${
                selected === key 
                ? 'border-brand-green bg-green-50/50 shadow-md ring-4 ring-green-100' 
                : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:border-brand-green/40 hover:bg-white'
              }`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl flex-shrink-0 transition-all ${
                selected === key 
                ? 'bg-brand-green text-white shadow-lg rotate-3' 
                : 'bg-white border-2 border-slate-200 text-slate-400 group-hover:text-brand-green group-hover:border-brand-green/40'
              }`}>
                {key}
              </div>
              <span className={`font-bold text-lg md:text-xl ${selected === key ? 'text-brand-green' : 'text-slate-700'}`}>
                {value}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
