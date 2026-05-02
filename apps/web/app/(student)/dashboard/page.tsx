'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import toast from 'react-hot-toast';

interface Exam {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  startTime: string | null;
  endTime: string | null;
  questionCount: number;
}

export default function DashboardPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    api.get('/student/exams')
      .then((res) => {
        setExams(res.data);
        setLoading(false);
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || 'Failed to load exams');
        setLoading(false);
        router.push('/login');
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                  <div className="h-6 bg-gray-300 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          <button
            onClick={() => router.push('/results')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            My Results
          </button>
        </div>

        <h2 className="text-2xl font-semibold mb-6">Available Exams</h2>

        {exams.length === 0 ? (
          <p className="text-gray-500">No exams available at the moment.</p>
        ) : (
          <div className="grid gap-6">
            {exams.map((exam) => (
              <div key={exam.id} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-2">{exam.title}</h3>
                {exam.description && (
                  <p className="text-gray-600 mb-4">{exam.description}</p>
                )}
                <div className="flex gap-4 text-sm text-gray-500 mb-4">
                  <span>Duration: {exam.durationMinutes} min</span>
                  {exam.startTime && (
                    <span>Starts: {new Date(exam.startTime).toLocaleString()}</span>
                  )}
                  {exam.endTime && (
                    <span>Ends: {new Date(exam.endTime).toLocaleString()}</span>
                  )}
                  <span>Questions: {exam.questionCount}</span>
                </div>
                <button
                  onClick={() => router.push(`/exam/${exam.id}`)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Start Exam
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
