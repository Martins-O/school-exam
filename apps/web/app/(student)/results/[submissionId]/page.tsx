'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';

interface Result {
  submissionId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: string;
  startedAt: string;
  submittedAt: string;
  autoSubmitted: boolean;
}

export default function ResultDetailPage() {
  const { submissionId } = useParams();
  const [result, setResult] = useState<Result | null>(null);
  const router = useRouter();

  useEffect(() => {
    api.get(`/results/${submissionId}`)
      .then((res) => setResult(res.data))
      .catch(() => router.push('/login'));
  }, [submissionId]);

  if (!result) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const timeTaken = result.submittedAt
    ? (new Date(result.submittedAt).getTime() - new Date(result.startedAt).getTime()) / 60000
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push('/results')}
          className="mb-6 text-blue-600 hover:underline"
        >
          ← Back to Results
        </button>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold mb-6">{result.examTitle}</h1>

          {result.autoSubmitted && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-6">
              ⚠️ This exam was auto-submitted
            </div>
          )}

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">Score</p>
              <p className="text-2xl font-bold">
                {result.score}/{result.totalMarks}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">Percentage</p>
              <p
                className={`text-2xl font-bold ${
                  result.percentage >= 70
                    ? 'text-green-600'
                    : result.percentage >= 50
                    ? 'text-yellow-600'
                    : 'text-red-600'
                }`}
              >
                {result.percentage.toFixed(0)}%
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">Status</p>
              <span
                className={`px-2 py-1 rounded-full text-sm ${
                  result.status === 'submitted'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {result.status}
              </span>
            </div>
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">Time Taken</p>
              <p className="text-2xl font-bold">
                {timeTaken.toFixed(0)} min
              </p>
            </div>
          </div>

          <button
            onClick={() => router.push('/dashboard')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
