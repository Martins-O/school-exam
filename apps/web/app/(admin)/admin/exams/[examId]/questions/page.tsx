'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

interface Question {
  id: string;
  questionText: string;
  options: Record<string, string>;
  correctAnswer: string;
  marks: number;
}

export default function AdminQuestionsPage() {
  const { examId } = useParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [marks, setMarks] = useState(1);
  const router = useRouter();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const res = await api.get(`/exams/${examId}/questions`);
      setQuestions(res.data);
    } catch {
      router.push('/login');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/exams/${examId}/questions`, {
        questionText,
        options,
        correctAnswer,
        marks,
      });
      setShowCreate(false);
      setQuestionText('');
      setOptions({ A: '', B: '', C: '', D: '' });
      setCorrectAnswer('A');
      setMarks(1);
      loadQuestions();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create question');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/exams/${examId}/questions/${id}`);
      loadQuestions();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Questions</h1>
          <div className="space-x-2">
            <button
              onClick={() => router.push('/admin/exams')}
              className="px-4 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
            >
              Back to Exams
            </button>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showCreate ? 'Cancel' : 'Add Question'}
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Add New Question</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Question Text</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  required
                  minLength={5}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(options).map(([key, val]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium mb-1">Option {key}</label>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) =>
                        setOptions({ ...options, [key]: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Correct Answer</label>
                  <select
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Marks</label>
                  <input
                    type="number"
                    value={marks}
                    onChange={(e) => setMarks(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min={1}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Add Question
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                  #
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                  Correct
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                  Marks
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {questions.map((q, idx) => (
                <tr key={q.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{idx + 1}</td>
                  <td className="px-6 py-4">
                    <div className="max-w-md truncate">{q.questionText}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-green-600">
                    {q.correctAnswer}
                  </td>
                  <td className="px-6 py-4">{q.marks}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No questions yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
