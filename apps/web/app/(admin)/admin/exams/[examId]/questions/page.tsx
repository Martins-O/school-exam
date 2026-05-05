'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Question {
  id: string;
  questionText: string;
  type: 'objective' | 'theory';
  options?: Record<string, string>;
  correctAnswer?: string;
  marks: number;
  maxWordCount?: number | null;
  passageText?: string | null;
  pdfAttachment?: string | null;
}

export default function AdminQuestionsPage() {
  const { examId } = useParams();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  
  const [questionType, setQuestionType] = useState<'objective' | 'theory'>('objective');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [marks, setMarks] = useState(1);
  const [maxWordCount, setMaxWordCount] = useState<number | ''>('');
  const [passageText, setPassageText] = useState('');
  
  const pdfFileRef = useRef<HTMLInputElement>(null);
  const csvFileRef = useRef<HTMLInputElement>(null);
  const [pdfExtracted, setPdfExtracted] = useState<any[] | null>(null);
  const [csvExtracted, setCsvExtracted] = useState<any[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  
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
      const payload: any = {
        questionText,
        type: questionType,
        marks,
      };

      if (questionType === 'objective') {
        payload.options = options;
        payload.correctAnswer = correctAnswer;
      } else {
        if (maxWordCount) payload.maxWordCount = Number(maxWordCount);
        if (passageText) payload.passageText = passageText;
      }

      await api.post(`/exams/${examId}/questions`, payload);
      toast.success('Question added to database');
      setShowCreate(false);
      resetForm();
      loadQuestions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to inject question');
    }
  };

  const resetForm = () => {
    setQuestionText('');
    setOptions({ A: '', B: '', C: '', D: '' });
    setCorrectAnswer('A');
    setMarks(1);
    setMaxWordCount('');
    setPassageText('');
    setQuestionType('objective');
    setPdfExtracted(null);
    setCsvExtracted(null);
    setPdfFile(null);
    setCsvFile(null);
  };

  const handlePdfUpload = async () => {
    if (!pdfFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      const res = await api.post(`/exams/${examId}/questions/extract-pdf`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPdfExtracted(res.data.questions);
      toast.success(`Extracted ${res.data.questions.length} questions from PDF`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to extract PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', csvFile);
      await api.post(`/exams/${examId}/questions/bulk-import-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('CSV imported successfully');
      setCsvExtracted([]);
      setCsvFile(null);
      loadQuestions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to import CSV');
    } finally {
      setUploading(false);
    }
  };

  const handleImportExtracted = async () => {
    if (!pdfExtracted?.length) return;
    setUploading(true);
    try {
      for (const q of pdfExtracted) {
        const payload: any = {
          questionText: q.questionText,
          type: q.type,
          marks: q.marks || 1,
        };
        if (q.type === 'objective') {
          payload.options = q.options;
          payload.correctAnswer = q.correctAnswer;
        }
        if (q.passageText) payload.passageText = q.passageText;
        if (q.maxWordCount) payload.maxWordCount = q.maxWordCount;
        await api.post(`/exams/${examId}/questions`, payload);
      }
      toast.success(`Imported ${pdfExtracted.length} questions`);
      setPdfExtracted(null);
      loadQuestions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to import questions');
    } finally {
      setUploading(false);
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
            onClick={() => { setShowImport(!showImport); setShowCreate(false); }}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-xs transition-all active:scale-95 shadow-lg shadow-purple-600/20"
          >
            {showImport ? 'DISCARD' : 'IMPORT'}
          </button>
          <button 
            onClick={() => { setShowCreate(!showCreate); setShowImport(false); resetForm(); }}
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Question Type</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setQuestionType('objective')}
                    className={`flex-1 py-4 rounded-2xl font-bold transition-all border ${
                      questionType === 'objective' 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Objective (Multiple Choice)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestionType('theory')}
                    className={`flex-1 py-4 rounded-2xl font-bold transition-all border ${
                      questionType === 'theory' 
                        ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-600/20' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    Theory / Essay
                  </button>
                </div>
              </div>

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

              {questionType === 'objective' && (
                <>
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
                </>
              )}

              {questionType === 'theory' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Passage / Reading Material (Optional)</label>
                    <textarea
                      value={passageText}
                      onChange={(e) => setPassageText(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all min-h-[100px]"
                      placeholder="Optional: Add a passage or reading material that this question is based on..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Max Word Count (Optional)</label>
                      <input
                        type="number"
                        value={maxWordCount}
                        onChange={(e) => setMaxWordCount(e.target.value ? parseInt(e.target.value) : '')}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all font-mono"
                        min={1}
                        placeholder="e.g. 500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Award Marks</label>
                      <input
                        type="number"
                        value={marks}
                        onChange={(e) => setMarks(parseInt(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40 transition-all font-mono"
                        min={1}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 flex gap-4">
                <button
                  type="submit"
                  className="px-12 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
                >
                  SAVE TO CURRICULUM
                </button>
              </div>
            </form>
          </div>
        )}

        {showImport && (
          <div className="glass-card p-10 mb-12 animate-in slide-in-from-top-8 duration-500">
            <h2 className="text-2xl font-bold mb-8">Import Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h3 className="text-lg font-bold mb-4">PDF Upload (Auto-Extract)</h3>
                <p className="text-sm text-slate-400 mb-6">Upload a PDF exam. Questions will be extracted by numbered patterns for your review before import.</p>
                <input
                  type="file"
                  accept=".pdf"
                  ref={pdfFileRef}
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="mb-4 text-sm text-slate-400"
                />
                <button
                  type="button"
                  onClick={handlePdfUpload}
                  disabled={uploading || !pdfFile}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl font-bold text-sm transition-all"
                >
                  {uploading ? 'Extracting...' : 'Extract Questions'}
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h3 className="text-lg font-bold mb-4">CSV Upload (Bulk Import)</h3>
                <p className="text-sm text-slate-400 mb-6">Upload a CSV with columns: type, questionText, optionA, optionB, optionC, optionD, correctAnswer, marks, category</p>
                <input
                  type="file"
                  accept=".csv"
                  ref={csvFileRef}
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="mb-4 text-sm text-slate-400"
                />
                <button
                  type="button"
                  onClick={handleCsvUpload}
                  disabled={uploading || !csvFile}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-xl font-bold text-sm transition-all"
                >
                  {uploading ? 'Importing...' : 'Import CSV'}
                </button>
              </div>
            </div>

            {pdfExtracted && pdfExtracted.length > 0 && (
              <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl p-8">
                <h3 className="text-lg font-bold mb-4">Extracted Questions ({pdfExtracted.length})</h3>
                <div className="max-h-96 overflow-y-auto space-y-4 mb-6">
                  {pdfExtracted.map((q, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${q.type === 'theory' ? 'bg-purple-600/30 text-purple-400' : 'bg-blue-600/30 text-blue-400'}`}>
                          {q.type}
                        </span>
                        <span className="text-xs text-slate-500">{q.marks} marks</span>
                      </div>
                      <p className="text-sm text-white mb-2">{q.questionText}</p>
                      {q.options && (
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                          {Object.entries(q.options).map(([k, v]) => (
                            <span key={k} className={q.correctAnswer === k ? 'text-emerald-400' : ''}>{String(k)}: {String(v)}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleImportExtracted}
                  disabled={uploading}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl font-bold text-sm transition-all"
                >
                  {uploading ? 'Importing...' : `Import All ${pdfExtracted.length} Questions`}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="glass-card p-8 group hover:bg-white/[0.04] transition-all border border-white/5">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-1 ${
                    q.type === 'theory' 
                      ? 'bg-purple-600/20 text-purple-500 ring-purple-500/30' 
                      : 'bg-blue-600/20 text-blue-500 ring-blue-500/30'
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        q.type === 'theory' 
                          ? 'bg-purple-600/20 text-purple-400' 
                          : 'bg-blue-600/20 text-blue-400'
                      }`}>
                        {q.type}
                      </span>
                      {q.maxWordCount && (
                        <span className="text-[10px] text-slate-500">Max {q.maxWordCount} words</span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-4 max-w-2xl leading-relaxed">
                      {q.questionText}
                    </h3>
                    {q.passageText && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4">
                        <p className="text-xs text-amber-400 font-bold mb-1">PASSAGE:</p>
                        <p className="text-sm text-slate-400 whitespace-pre-wrap">{q.passageText}</p>
                      </div>
                    )}
                    {q.type === 'objective' && q.options && (
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
                    )}
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
