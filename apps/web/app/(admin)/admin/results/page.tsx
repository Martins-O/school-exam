'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Result {
  submissionId: string;
  examTitle: string;
  studentName: string;
  studentEmail: string;
  score: number;
  totalMarks: number;
  percentage: number;
  status: string;
  submittedAt: string;
}

export default function AdminResultsPage() {
  const [results, setResults] = useState<Result[]>([]);
  const router = useRouter();

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const res = await api.get('/admin/results');
      setResults(res.data);
    } catch {
      router.push('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">All Results</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                  Exam
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                  Score
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                  Percentage
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">
                  Submitted
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {results.map((r) => (
                <tr
                  key={r.submissionId}
                  onClick={() => router.push(`/results/${r.submissionId}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium">{r.studentName}</div>
                    <div className="text-sm text-gray-500">{r.studentEmail}</div>
                  </td>
                  <td className="px-6 py-4">{r.examTitle}</td>
                  <td className="px-6 py-4">
                    {r.score}/{r.totalMarks}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        r.percentage >= 70
                          ? 'bg-green-100 text-green-800'
                          : r.percentage >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {r.percentage.toFixed(0)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        r.status === 'submitted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(r.submittedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No submissions yet.
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
