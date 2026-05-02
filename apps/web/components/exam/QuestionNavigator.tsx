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
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h4 className="font-semibold mb-3">Question Navigator</h4>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((q, idx) => {
          const isAnswered = !!answers[q.id];
          const isFlagged = flaggedQuestions.includes(q.id);
          const isCurrent = idx === currentIndex;

          let bgColor = 'bg-gray-200';
          if (isCurrent) bgColor = 'bg-blue-500 text-white';
          else if (isFlagged) bgColor = 'bg-yellow-300';
          else if (isAnswered) bgColor = 'bg-green-300';

          return (
            <button
              key={q.id}
              onClick={() => onNavigate(idx)}
              className={`w-10 h-10 rounded-md text-sm font-medium ${bgColor}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-4 space-y-1 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-300 rounded"></div>
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-300 rounded"></div>
          <span>Flagged</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <span>Unanswered</span>
        </div>
      </div>
    </div>
  );
}
