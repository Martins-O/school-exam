'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import AdminHeader from '@/components/admin/AdminHeader';
import PortalModal from '@/components/admin/PortalModal';
import TiptapEditor from '@/components/exam/TiptapEditor';
import MathRenderer from '@/components/exam/MathRenderer';

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
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string }>({
    open: false,
    id: ''
  });
  
  const [questionType, setQuestionType] = useState<'objective' | 'theory'>('objective');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' });
  const [correctAnswer, setCorrectAnswer] = useState('A');
  const [marks, setMarks] = useState(1);
  const [maxWordCount, setMaxWordCount] = useState<number | ''>('');
  const [passageText, setPassageText] = useState('');
  const [batchQuestions, setBatchQuestions] = useState<any[]>([]);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  
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
      const payload = buildQuestionPayload();
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

  const buildQuestionPayload = () => {
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
    return payload;
  };

  const addToBatch = () => {
    const payload = buildQuestionPayload();
    setBatchQuestions([...batchQuestions, payload]);
    resetForm();
    toast.success('Question added to batch queue');
  };

  const removeFromBatch = (idx: number) => {
    setBatchQuestions(batchQuestions.filter((_, i) => i !== idx));
  };

  const handleBatchSubmit = async () => {
    if (!batchQuestions.length) return;
    setBatchSubmitting(true);
    try {
      const res = await api.post(`/exams/${examId}/questions/bulk-import`, { questions: batchQuestions });
      const data = res.data;
      const successCount = data.success?.length || 0;
      const failCount = data.failed?.length || 0;
      if (failCount > 0) {
        toast.error(`${failCount} question(s) failed — see console for details`);
        console.error('Batch import errors:', data.errors);
      }
      toast.success(`Batch injected ${successCount} question(s) successfully`);
      setBatchQuestions([]);
      setShowCreate(false);
      loadQuestions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Batch injection failed');
    } finally {
      setBatchSubmitting(false);
    }
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
      setPdfExtracted(res.data.extractedQuestions);
      toast.success(`Extracted ${res.data.extractedQuestions.length} questions from PDF`);
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
      const questions = pdfExtracted.map((q) => {
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
        return payload;
      });
      const res = await api.post(`/exams/${examId}/questions/bulk-import`, { questions });
      const successCount = res.data.success?.length || 0;
      toast.success(`Imported ${successCount} question(s) from PDF`);
      setPdfExtracted(null);
      loadQuestions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to import questions');
    } finally {
      setUploading(false);
    }
  };

  const executeDelete = async () => {
    try {
      await api.delete(`/exams/${examId}/questions/${deleteModal.id}`);
      toast.success('Question removed');
      loadQuestions();
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans selection:bg-green-100">
      <AdminHeader 
        subtitle="Question Bank" 
        actions={
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin/exams')}
              className="px-4 py-2 text-[10px] font-black text-white/60 hover:text-white transition-all uppercase tracking-[0.2em] hover:translate-x-[-4px]"
            >
              ← Back to Exams
            </button>
            <div className="h-6 w-[1px] bg-white/10 mx-1"></div>
            <button 
              onClick={() => { setShowImport(!showImport); setShowCreate(false); }}
              className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
                showImport ? 'bg-red-600 text-white ring-4 ring-red-100' : 'bg-brand-gold text-brand-green hover:brightness-110 shadow-gold/20'
              }`}
            >
              {showImport ? 'Close Protocol' : 'Import Protocol'}
            </button>
            <button 
              onClick={() => { setShowCreate(!showCreate); setShowImport(false); resetForm(); setBatchQuestions([]); }}
              className={`px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
                showCreate ? 'bg-red-600 text-white ring-4 ring-red-100' : 'bg-white text-brand-green hover:bg-slate-50'
              }`}
            >
              {showCreate ? 'Discard Record' : '+ Author New'}
            </button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-8 py-16">
        {showCreate && (
          <div className="premium-card p-12 mb-16 animate-in fade-in slide-in-from-top-8 duration-700 ease-out">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-4">
                  <span className="w-2 h-10 bg-brand-gold rounded-full"></span>
                  Author New Record
                </h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 ml-6">Examination Logic Interface</p>
              </div>
              <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Bank Status</span>
                <span className="text-[10px] font-black text-brand-green uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Ready for Injection
                </span>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-12">
              <section>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Logic Type Selection
                </label>
                <div className="grid grid-cols-2 gap-6">
                    <button
                      type="button"
                      onClick={() => setQuestionType('objective')}
                      className={`group relative overflow-hidden p-8 rounded-2xl transition-all duration-500 border-2 ${
                        questionType === 'objective' 
                          ? 'bg-brand-green border-brand-green text-white shadow-2xl shadow-green-900/20 translate-y-[-4px]' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        <span className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${questionType === 'objective' ? 'bg-white/20' : 'bg-slate-50'}`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </span>
                        <div className="text-center">
                          <span className="block font-black text-sm uppercase tracking-widest mb-1">Objective</span>
                          <span className={`text-[10px] font-bold uppercase opacity-60 tracking-tight ${questionType === 'objective' ? 'text-white' : 'text-slate-400'}`}>Multiple Choice Protocol</span>
                        </div>
                      </div>
                      {questionType === 'objective' && <div className="absolute top-0 right-0 p-4"><div className="w-2 h-2 bg-brand-gold rounded-full shadow-[0_0_15px_#FFD700]"></div></div>}
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuestionType('theory')}
                      className={`group relative overflow-hidden p-8 rounded-2xl transition-all duration-500 border-2 ${
                        questionType === 'theory' 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-900/20 translate-y-[-4px]' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="relative z-10 flex flex-col items-center gap-4">
                        <span className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${questionType === 'theory' ? 'bg-white/20' : 'bg-slate-50'}`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </span>
                        <div className="text-center">
                          <span className="block font-black text-sm uppercase tracking-widest mb-1">Theory / Essay</span>
                          <span className={`text-[10px] font-bold uppercase opacity-60 tracking-tight ${questionType === 'theory' ? 'text-white' : 'text-slate-400'}`}>Expository Response</span>
                        </div>
                      </div>
                    </button>
                </div>
              </section>

              <section className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Examination Question Prompt</label>
                  <TiptapEditor
                    value={questionText}
                    onChange={setQuestionText}
                    placeholder="Type or paste question text here..."
                    minHeight={160}
                    mode="full"
                  />
                </div>

                {questionType === 'objective' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-left-4 duration-500">
                    {Object.entries(options).map(([key, val]) => (
                      <div key={key}>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="w-8 h-8 bg-white border-2 border-slate-100 rounded-lg flex items-center justify-center font-black text-[10px] text-slate-400 shadow-sm">{key}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Option {key}</span>
                        </div>
                        <TiptapEditor
                          value={val}
                          onChange={(html) => setOptions({ ...options, [key]: html })}
                          placeholder={`Option ${key} content...`}
                          minHeight={60}
                          mode="minimal"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
                {questionType === 'objective' ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Correct Choice Key</label>
                    <div className="flex gap-3">
                      {['A', 'B', 'C', 'D'].map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setCorrectAnswer(key)}
                          className={`flex-1 py-4 rounded-xl font-black text-xs transition-all duration-300 border-2 ${
                            correctAnswer === key 
                              ? 'bg-brand-green border-brand-green text-white shadow-xl shadow-green-900/10 scale-105' 
                              : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'
                          }`}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="floating-label-group animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <input
                      type="number"
                      value={maxWordCount}
                      onChange={(e) => setMaxWordCount(e.target.value ? parseInt(e.target.value) : '')}
                      className="institutional-input pt-10"
                      placeholder=" "
                    />
                    <label>Maximum Word Constraint (Optional)</label>
                  </div>
                )}
                
                <div className="floating-label-group">
                  <input
                    type="number"
                    value={marks}
                    onChange={(e) => setMarks(parseInt(e.target.value))}
                    className="institutional-input pt-10 text-brand-green"
                    placeholder=" "
                    min={1}
                  />
                  <label>Allocated Marks / Point Value</label>
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">PTS</div>
                </div>
              </section>

              {questionType === 'theory' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Reference Passage / Background Context (Optional)</label>
                  <TiptapEditor
                    value={passageText}
                    onChange={setPassageText}
                    placeholder="Type or paste reference passage here..."
                    minHeight={120}
                    mode="full"
                  />
                </div>
              )}

              {/* Batch Queue */}
              {batchQuestions.length > 0 && (
                <div className="border-t border-slate-100 pt-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest flex items-center gap-3">
                      <span className="w-6 h-6 bg-brand-gold rounded-lg flex items-center justify-center text-brand-green text-[10px] font-black">{batchQuestions.length}</span>
                      Pending Questions in Batch Queue
                    </h3>
                    <button
                      type="button"
                      onClick={() => setBatchQuestions([])}
                      className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest transition-colors"
                    >
                      Clear Queue
                    </button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {batchQuestions.map((q, idx) => (
                      <div key={idx} className="flex items-start gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4 group">
                        <span className="w-7 h-7 bg-slate-200 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0">{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${q.type === 'theory' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                              {q.type}
                            </span>
                            <span className="text-[9px] font-black text-slate-300">{q.marks} PTS</span>
                          </div>
                          <p className="text-xs font-bold text-slate-600 truncate">{q.questionText}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromBatch(idx)}
                          className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all shrink-0 opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-8 border-t border-slate-100 flex items-center justify-between gap-4">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={addToBatch}
                    disabled={!questionText.trim()}
                    className="px-8 py-5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl transition-all active:scale-95 uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                    Add to Queue
                  </button>
                  {batchQuestions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBatchSubmit}
                      disabled={batchSubmitting}
                      className="px-8 py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition-all shadow-2xl shadow-indigo-900/20 active:scale-95 uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 disabled:opacity-40 disabled:pointer-events-none"
                    >
                      {batchSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Injecting...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          Batch Inject {batchQuestions.length}
                        </>
                      )}
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-12 py-5 bg-brand-green hover:bg-green-800 text-white font-black rounded-2xl transition-all shadow-2xl shadow-green-900/20 active:scale-95 uppercase text-xs tracking-[0.3em] flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  Inject Single
                </button>
              </div>
            </form>
          </div>
        )}

        {showImport && (
          <div className="premium-card p-12 mb-16 animate-in fade-in slide-in-from-top-8 duration-700 ease-out border-indigo-100">
            <h2 className="text-3xl font-black mb-12 text-slate-900 uppercase tracking-tighter flex items-center gap-4">
              <span className="w-2 h-10 bg-indigo-500 rounded-full"></span>
              Protocol Bulk Import
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="bg-slate-50/50 border-2 border-slate-100 rounded-3xl p-10 group hover:border-indigo-200 transition-all duration-500">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4">PDF Intelligence Node</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-8">AI-assisted extraction of examination questions from standard PDF documents.</p>
                <div className="space-y-6">
                  <input
                    type="file"
                    accept=".pdf"
                    ref={pdfFileRef}
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="block w-full text-[10px] text-slate-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handlePdfUpload}
                    disabled={uploading || !pdfFile}
                    className="w-full py-4 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white disabled:opacity-50 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    {uploading ? 'Analyzing Matrix...' : 'Start Extraction Scan'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-50/50 border-2 border-slate-100 rounded-3xl p-10 group hover:border-emerald-200 transition-all duration-500">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4">CSV Dataset Sync</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed mb-8">Rapid injection of formatted question datasets via CSV protocol.</p>
                <div className="space-y-6">
                  <input
                    type="file"
                    accept=".csv"
                    ref={csvFileRef}
                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                    className="block w-full text-[10px] text-slate-400 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleCsvUpload}
                    disabled={uploading || !csvFile}
                    className="w-full py-4 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white disabled:opacity-50 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
                  >
                    {uploading ? 'Syncing...' : 'Execute Data Injection'}
                  </button>
                </div>
              </div>
            </div>

            {pdfExtracted && pdfExtracted.length > 0 && (
              <div className="mt-12 bg-white border-2 border-slate-100 rounded-3xl p-10 shadow-2xl shadow-slate-200">
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8 flex items-center gap-3">
                  <span className="w-8 h-8 bg-brand-gold rounded-lg flex items-center justify-center text-brand-green text-xs">!</span>
                  Staging Buffer ({pdfExtracted.length} Records)
                </h3>
                <div className="max-h-[400px] overflow-y-auto space-y-4 mb-10 pr-6 custom-scrollbar">
                  {pdfExtracted.map((q, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 transition-all hover:bg-white hover:border-brand-green/20">
                      <div className="flex items-center gap-3 mb-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${q.type === 'theory' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {q.type}
                        </span>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{q.marks} PTS</span>
                      </div>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed mb-4">{q.questionText}</p>
                      {q.options && (
                        <div className="flex flex-wrap gap-4 text-[9px] font-black text-slate-400 uppercase tracking-tight">
                          {Object.entries(q.options).map(([k, v]) => (
                            <span key={k} className={`flex items-center gap-2 ${q.correctAnswer === k ? 'text-emerald-600' : ''}`}>
                              <span className={`w-4 h-4 flex items-center justify-center rounded border ${q.correctAnswer === k ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200'}`}>{String(k)}</span>
                              {String(v)}
                            </span>
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
                  className="px-12 py-5 bg-brand-green text-white disabled:opacity-50 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-green-900/20 active:scale-95 w-full md:w-auto"
                >
                  {uploading ? 'Committing...' : `Commit All ${pdfExtracted.length} to Production Bank`}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="space-y-12">
          {questions.map((q, idx) => (
            <div key={q.id} className="premium-card group hover:translate-y-[-8px]">
              <div className="p-12">
                <div className="flex justify-between items-start">
                  <div className="flex gap-8">
                    <div className="flex flex-col items-center">
                      <span className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg border-2 transition-all duration-500 group-hover:scale-110 ${
                        q.type === 'theory' 
                          ? 'bg-indigo-50 text-indigo-600 border-indigo-100' 
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="mt-4 w-[2px] h-full bg-slate-50 group-hover:bg-brand-gold/20 transition-colors"></div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-6">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${
                          q.type === 'theory' 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-brand-green text-white'
                        }`}>
                          {q.type} Protocol
                        </span>
                        {q.maxWordCount && (
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            {q.maxWordCount} Word Max
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 mb-10 max-w-4xl leading-[1.4] uppercase tracking-tight">
                        <MathRenderer content={q.questionText} />
                      </h3>
                      
                      {q.passageText && (
                        <div className="bg-slate-50/50 border-l-4 border-brand-gold rounded-r-2xl p-8 mb-10 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-[0.03] scale-[4] translate-x-12 translate-y-[-12]">
                            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.154c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                          </div>
                          <p className="text-[10px] text-brand-green font-black uppercase tracking-[0.3em] mb-3">Contextual Reference:</p>
                          <div className="text-sm text-slate-500 leading-relaxed italic relative z-10"><MathRenderer content={q.passageText} /></div>
                        </div>
                      )}

                      {q.type === 'objective' && q.options && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-6">
                          {Object.entries(q.options).map(([key, val]) => (
                            <div key={key} className={`group/opt flex items-center gap-6 p-4 rounded-2xl border-2 transition-all duration-300 ${q.correctAnswer === key ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-transparent hover:border-slate-100'}`}>
                              <span className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 font-black text-xs transition-all duration-500 ${q.correctAnswer === key ? 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 rotate-[360deg]' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
                                {key}
                              </span>
                              <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${q.correctAnswer === key ? 'text-emerald-700' : 'text-slate-400 group-hover/opt:text-slate-600'}`}><MathRenderer content={val} /></span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-12 ml-12">
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-2 block">Valuation</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-brand-green tabular-nums">{q.marks}</span>
                        <span className="text-[10px] font-black text-slate-300 uppercase">PTS</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setDeleteModal({ open: true, id: q.id })}
                      className="group/del relative w-12 h-12 bg-slate-50 hover:bg-red-50 rounded-2xl flex items-center justify-center transition-all duration-300 active:scale-90"
                    >
                      <svg className="w-5 h-5 text-slate-300 group-hover/del:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      <span className="absolute right-full mr-4 px-3 py-1.5 bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover/del:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl">Purge Record</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {questions.length === 0 && (
            <div className="text-center py-40 premium-card bg-white border-dashed border-2 border-slate-200">
              <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10">
                <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              </div>
              <h3 className="text-2xl font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Question Bank Offline</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-10">No examination logic has been detected in this repository.</p>
              <button 
                onClick={() => setShowCreate(true)}
                className="px-10 py-4 bg-brand-gold text-brand-green font-black text-[10px] uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-2xl shadow-gold/20"
              >
                Initialize First Entry
              </button>
            </div>
          )}
        </div>
      </main>
      
      <PortalModal 
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ ...deleteModal, open: false })}
        onConfirm={executeDelete}
        title="Confirm Purge"
        message="Are you certain you wish to permanently remove this question from the bank? This action is tracked and cannot be reversed."
        confirmText="Purge Record"
        cancelText="Abort Operation"
        type="danger"
      />

      <footer className="max-w-7xl mx-auto px-8 py-12 border-t border-slate-100 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Institutional CBT Command & Control © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
