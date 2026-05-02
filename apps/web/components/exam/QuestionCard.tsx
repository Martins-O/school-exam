interface QuestionCardProps {
  question: {
    id: string;
    questionText: string;
    options: Record<string, string>;
    marks: number;
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
  isFlagged,
  onToggleFlag,
}: QuestionCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">
          {question.questionText}
          <span className="ml-2 text-sm text-gray-500">(Marks: {question.marks})</span>
        </h3>
        <button
          onClick={onToggleFlag}
          className={`px-3 py-1 rounded-md text-sm ${
            isFlagged ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {isFlagged ? 'Flagged' : 'Flag for review'}
        </button>
      </div>

      <div className="space-y-3">
        {Object.entries(question.options).map(([key, value]) => (
          <label
            key={key}
            className={`flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 ${
              selectedAnswer === key ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <input
              type="radio"
              name={question.id}
              value={key}
              checked={selectedAnswer === key}
              onChange={() => onAnswer(key)}
              className="mr-3"
            />
            <span className="font-medium mr-2">{key})</span>
            <span>{value}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
