'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

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
  const [loading, setLoading] = useState(true);
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
    } finally {
      setLoading(false);
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
      toast.success('Question added to database');
      setShowCreate(false);
      setQuestionText('');
      setOptions({ A: '', B: '', C: '', D: '' });
      setCorrectAnswer('A');
      setMarks(1);
      loadQuestions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to inject question');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently remove this question?')) return;
    try {
      await api.delete(`/exams/${examId}/questions/${id}`);
      toast.success('Question removed');
      loadQuestions();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <div className="min-h-screen bg-[#020617] p-8 text-white">Loading curriculum...</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30">
      <nav className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-md px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard" className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold">C</Link>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Question Bank</span>
            <span className="text-sm font-bold tracking-tight">CBT System Control</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/admin/exams')}
            className="px-5 py-2 text-xs font-bold text-slate-400 hover:text-white transition-all underline underline-offset-4"
          >
            BACK TO DEPLOYMENTS
          </button>
          <button 
            onClick={() => setShowCreate(!showCreate)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-lg shadow-blue-600/20"
          >
            {showCreate ? 'DISCARD' : '+ ADD QUESTION'}
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {showCreate && (
          <div className="glass-card p-10 mb-12 animate-in slide-in-from-top-8 duration-500">
            <h2 className="text-2xl font-bold mb-8">Author New Question</h2>
            <form onSubmit={handleCreate} className="space-y-8">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Question Prompt</label>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all min-h-[120px]"
                  placeholder="Enter the examination question text..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(options).map(([key, val]) => (
                  <div key={key}>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Option {key}</label>
                    <input
                      type="text"
                      value={val}
                      onChange={(e) => setOptions({ ...options, [key]: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Verification Key (Correct Answer)</label>
                  <div className="flex gap-4">
                    {['A', 'B', 'C', 'D'].map((key) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setCorrectAnswer(key)}
                        className={`flex-1 py-4 rounded-2xl font-bold transition-all border ${
                          correctAnswer === key 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                            : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                        }`}
                      >
                        {key}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Award Marks</label>
                  <input
                    type="number"
                    value={marks}
                    onChange={(e) => setMarks(parseInt(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all font-mono"
                    min={1}
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full md:w-auto px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                >
                  SAVE TO CURRICULUM
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="glass-card p-8 group hover:bg-white/[0.04] transition-all border border-white/5">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <span className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-500 flex items-center justify-center font-bold text-xs ring-1 ring-blue-500/30">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4 max-w-2xl leading-relaxed">
                      {q.questionText}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                      {Object.entries(q.options).map(([key, val]) => (
                        <div key={key} className={`flex items-center gap-3 text-sm font-medium ${q.correctAnswer === key ? 'text-emerald-400' : 'text-slate-500'}`}>
                          <span className={`w-5 h-5 flex items-center justify-center rounded border ${q.correctAnswer === key ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-white/10 bg-white/5'} font-black text-[10px]`}>
                            {key}
                          </span>
                          {val}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-1">Score Value</span>
                    <span className="text-xl font-black text-white tabular-nums">{q.marks} PTS</span>
                  </div>
                  <button 
                    onClick={() => handleDelete(q.id)}
                    className="mt-4 px-4 py-2 text-[10px] font-black text-slate-600 hover:text-red-500 transition-colors uppercase tracking-[0.2em] border border-transparent hover:border-red-500/20 rounded-lg"
                  >
                    DELETE
                  </button>
                </div>
              </div>
            </div>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-24 glass-card border-dashed border-white/10">
              <p className="text-slate-500 font-bold mb-4">The curriculum is currently empty.</p>
              <button 
                onClick={() => setShowCreate(true)}
                className="text-blue-500 text-xs font-black uppercase tracking-widest hover:underline"
              >
                + ADD THE FIRST QUESTION
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
