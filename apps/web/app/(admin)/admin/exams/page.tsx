'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  isPublished: boolean;
  questionCount?: number;
}

export default function AdminExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const router = useRouter();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      const res = await api.get('/exams');
      const examsData = res.data;
      const withCounts = await Promise.all(
        examsData.map(async (e: Exam) => {
          const qRes = await api.get(`/exams/${e.id}`);
          return { ...e, questionCount: qRes.data.questionCount || 0 };
        })
      );
      setExams(withCounts);
    } catch {
      router.push('/login');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/exams', { title, durationMinutes: duration });
      setTitle('');
      setDuration(60);
      setShowCreate(false);
      loadExams();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create exam');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this exam?')) return;
    try {
      await api.delete(`/exams/${id}`);
      loadExams();
    } catch {}
  };

  const handlePublish = async (id: string) => {
    try {
      await api.patch(`/exams/${id}/publish`);
      loadExams();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Manage Exams</h1>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {showCreate ? 'Cancel' : 'Create Exam'}
          </button>
        </div>

        {showCreate && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-xl font-semibold mb-4">Create New Exam</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  minLength={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                  min={1}
                  max={480}
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
              >
                Create
              </button>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Title</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Duration</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Questions</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{exam.title}</td>
                  <td className="px-6 py-4">{exam.durationMinutes} min</td>
                  <td className="px-6 py-4">{exam.questionCount || 0}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-sm ${
                        exam.isPublished
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {exam.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => router.push(`/admin/exams/${exam.id}/questions`)}
                      className="text-blue-600 hover:underline"
                    >
                      Questions
                    </button>
                    {!exam.isPublished && (
                      <button
                        onClick={() => handlePublish(exam.id)}
                        className="text-green-600 hover:underline"
                      >
                        Publish
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
