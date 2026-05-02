'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Summary {
  totalExams: number;
  totalQuestions: number;
  totalSubmissions: number;
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const router = useRouter();

  useEffect(() => {
    Promise.all([
      api.get('/exams'),
      api.get('/admin/results'),
    ])
      .then(([examsRes, resultsRes]) => {
        const exams = examsRes.data;
        const submissions = resultsRes.data;
        const totalQuestions = exams.reduce((sum: number, e: { questionCount?: number }) => sum + (e.questionCount || 0), 0);
        setSummary({
          totalExams: exams.length,
          totalQuestions,
          totalSubmissions: submissions.length,
        });
      })
      .catch(() => router.push('/login'));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-sm text-gray-600">Total Exams</p>
              <p className="text-3xl font-bold text-blue-600">{summary.totalExams}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-sm text-gray-600">Total Questions</p>
              <p className="text-3xl font-bold text-green-600">{summary.totalQuestions}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-sm text-gray-600">Total Submissions</p>
              <p className="text-3xl font-bold text-purple-600">{summary.totalSubmissions}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => router.push('/admin/exams')}
            className="bg-white p-6 rounded-lg shadow-md hover:bg-gray-50 text-left"
          >
            <h3 className="text-lg font-semibold mb-2">Manage Exams</h3>
            <p className="text-gray-600">Create, edit, and publish exams</p>
          </button>
          <button
            onClick={() => router.push('/admin/results')}
            className="bg-white p-6 rounded-lg shadow-md hover:bg-gray-50 text-left"
          >
            <h3 className="text-lg font-semibold mb-2">View Results</h3>
            <p className="text-gray-600">See all student submissions</p>
          </button>
        </div>
      </div>
    </div>
  );
}
