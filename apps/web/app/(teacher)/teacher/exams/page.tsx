'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import TeacherHeader from '@/components/teacher/TeacherHeader';
import TiptapEditor from '@/components/exam/TiptapEditor';
import MathRenderer from '@/components/exam/MathRenderer';

interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  isPublished: boolean;
  targetClasses: ClassItem[];
  questionCount?: number;
}

interface ClassItem {
  id: string;
  name: string;
}

interface QuestionForm {
  _tempId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  marks: number;
}

const emptyQuestion = (): QuestionForm => ({
  _tempId: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11),
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  marks: 1,
});

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filterClassId, setFilterClassId] = useState<string>('all');
  const [creating, setCreating] = useState(false);

  // Wizard state
  const [step, setStep] = useState(1);
  const [createdExamId, setCreatedExamId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [description, setDescription] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);

  // Question creation
  const [questions, setQuestions] = useState<QuestionForm[]>([]);
  const [savingQuestions, setSavingQuestions] = useState(false);
  const [inputMode, setInputMode] = useState<'form' | 'bulk'>('form');
  const [bulkText, setBulkText] = useState('');
  const [quickAddCount, setQuickAddCount] = useState(5);

  const router = useRouter();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [examsRes, classesRes] = await Promise.all([
        api.get('/teacher/exams'),
        api.get('/teacher/classes'),
      ]);
      setClasses(classesRes.data);
      setExams(examsRes.data);
      setLoading(false);
    } catch {
      router.push('/login');
    }
  };

  const resetForm = () => {
    setStep(1);
    setCreatedExamId(null);
    setTitle('');
    setDescription('');
    setDuration(60);
    setSelectedClassIds([]);
    setQuestions([]);
  };

  const handleCreateExam = async () => {
    setCreating(true);
    try {
      const res = await api.post('/exams', {
        title,
        durationMinutes: duration,
        description,
        targetClassIds: selectedClassIds.length > 0 ? selectedClassIds : undefined,
      });
      setCreatedExamId(res.data.id);
      toast.success('Exam created — now add questions');
      setStep(2);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setCreating(false);
    }
  };

  const addQuestion = () => {
    setQuestions([...questions, emptyQuestion()]);
  };

  const addMultipleQuestions = (count: number) => {
    setQuestions([...questions, ...Array.from({ length: count }, () => emptyQuestion())]);
  };

  const parseBulkText = () => {
    const blocks = bulkText.split(/^-{3,}/m).filter(b => b.trim());
    const parsed: QuestionForm[] = [];
    const errors: string[] = [];

    for (const block of blocks) {
      const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length < 2) {
        errors.push(`Block skipped — too few lines:\n${block.slice(0, 60)}...`);
        continue;
      }

      const questionText = lines[0];
      const options: Record<string, string> = {};
      let correctAnswer = 'A';
      let marks = 1;

      for (const line of lines.slice(1)) {
        const optMatch = line.match(/^([A-F])[.)\s]\s*(.+)/i);
        if (optMatch) {
          options[optMatch[1].toUpperCase()] = optMatch[2];
          continue;
        }
        const answerMatch = line.match(/^(?:Answer|Ans|Correct)\s*[:=-]\s*([A-F])/i);
        if (answerMatch) {
          correctAnswer = answerMatch[1].toUpperCase();
          continue;
        }
        const marksMatch = line.match(/^(?:Marks?|Points?|Score)\s*[:=-]\s*(\d+)/i);
        if (marksMatch) {
          marks = parseInt(marksMatch[1]) || 1;
        }
      }

      if (Object.keys(options).length < 2) {
        errors.push(`Not enough options parsed for: "${questionText.slice(0, 50)}..."`);
        continue;
      }

      parsed.push({
        _tempId: crypto.randomUUID?.() || Math.random().toString(36).substring(2, 11),
        questionText,
        optionA: options['A'] || '',
        optionB: options['B'] || '',
        optionC: options['C'] || '',
        optionD: options['D'] || '',
        correctAnswer,
        marks,
      });
    }

    if (parsed.length > 0) {
      setQuestions([...questions, ...parsed]);
      setBulkText('');
      setInputMode('form');
      toast.success(`${parsed.length} question(s) parsed successfully`);
    }

    if (errors.length > 0) {
      toast(errors.join('\n'), { icon: '⚠️', duration: 6000 });
    }

    if (parsed.length === 0) {
      toast.error('No questions could be parsed. Check the format.');
    }
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuestionForm, value: string | number) => {
    const updated = [...questions];
    (updated[index] as any)[field] = value;
    setQuestions(updated);
  };

  const handleSaveQuestions = async () => {
    if (!createdExamId) return;
    setSavingQuestions(true);
    let saved = 0;
    let failed = 0;

    for (const q of questions) {
      try {
        await api.post(`/exams/${createdExamId}/questions`, {
          questionText: q.questionText,
          type: 'objective',
          options: { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
          correctAnswer: q.correctAnswer,
          marks: q.marks,
        });
        saved++;
      } catch {
        failed++;
      }
    }

    if (failed > 0) {
      toast(`${saved} question(s) saved. ${failed} failed.`, { icon: '⚠️' });
    } else if (saved > 0) {
      toast.success(`${saved} question(s) saved`);
    }

    setSavingQuestions(false);

    // If we already had questions, stay on step 2 to add more
    if (failed === 0) {
      setQuestions([]);
    }
  };

  const handlePublish = async () => {
    if (!createdExamId) return;
    try {
      await api.patch(`/exams/${createdExamId}/publish`);
      toast.success('Exam published and live!');
      setShowCreate(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Publish failed — add at least 1 question first');
    }
  };

  const handleFinishDraft = () => {
    toast('Exam saved as draft. Add questions later.', { icon: '📝' });
    setShowCreate(false);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string, examTitle: string) => {
    if (!confirm(`Delete "${examTitle}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/exams/${id}`);
      toast.success('Exam deleted');
      loadData();
    } catch {
      toast.error('Deletion failed');
    }
  };

  const handlePublishExisting = async (id: string) => {
    try {
      await api.patch(`/exams/${id}/publish`);
      toast.success('Exam published');
      loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Publish failed');
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await api.patch(`/exams/${id}`, { isPublished: false });
      toast.success('Exam unpublished');
      loadData();
    } catch {
      toast.error('Failed');
    }
  };

  const toggleClass = (classId: string) => {
    setSelectedClassIds(prev =>
      prev.includes(classId) ? prev.filter(id => id !== classId) : [...prev, classId]
    );
  };

  const filteredExams = filterClassId === 'all'
    ? exams
    : exams.filter(e => e.targetClasses?.some(c => c.id === filterClassId));

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <>
      <TeacherHeader
        subtitle="Teacher Exams"
        actions={
          <button
            onClick={() => { setShowCreate(!showCreate); resetForm(); }}
            className="px-6 py-2 bg-brand-gold text-brand-green font-black rounded-lg text-xs uppercase tracking-widest shadow-lg shadow-black/20 hover:scale-105 transition-all"
          >
            {showCreate ? 'Discard' : 'New Exam'}
          </button>
        }
      />
      <main className="max-w-7xl mx-auto px-6 py-12">
        {showCreate && (
          <div className="portal-card p-10 mb-12 animate-in fade-in slide-in-from-top-4 duration-500 bg-white">
            {/* Step Indicator */}
            <div className="flex items-center gap-2 mb-10">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step >= s ? 'bg-brand-green text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {s}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${
                    step >= s ? 'text-brand-green' : 'text-slate-300'
                  }`}>
                    {s === 1 ? 'Details' : s === 2 ? 'Questions' : 'Publish'}
                  </span>
                  {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-brand-green' : 'bg-slate-100'}`} />}
                </div>
              ))}
            </div>

            {/* Step 1: Exam Details */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-black mb-8 text-brand-green uppercase tracking-tight flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-brand-gold rounded-full"></span>
                  1. Exam Details
                </h2>
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Exam Title</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-brand-green/40 transition-all"
                      placeholder="e.g. Mathematics - Mid Term"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Description (Optional)</label>
                    <TiptapEditor
                      value={description}
                      onChange={setDescription}
                      placeholder="Instructions or notes..."
                      minHeight={80}
                      mode="minimal"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Duration (Minutes)</label>
                      <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-6 py-4 text-slate-800 font-bold focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-brand-green/40 transition-all"
                        min={1}
                        max={480}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Target Classes</label>
                      <div className="flex flex-wrap gap-3">
                        {classes.length === 0 && (
                          <p className="text-[10px] text-slate-400 font-bold">No classes assigned to you.</p>
                        )}
                        {classes.map((cls) => (
                          <button
                            key={cls.id}
                            type="button"
                            onClick={() => toggleClass(cls.id)}
                            className={`px-4 py-2 rounded-lg border-2 text-xs font-black uppercase tracking-widest transition-all ${
                              selectedClassIds.includes(cls.id)
                                ? 'border-brand-green bg-green-50 text-brand-green'
                                : 'border-slate-200 text-slate-500 hover:border-slate-300'
                            }`}
                          >
                            {cls.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={handleCreateExam}
                      disabled={creating || !title}
                      className="px-12 py-5 bg-brand-green text-white font-black rounded-xl hover:bg-green-800 transition-all shadow-xl shadow-green-900/20 active:scale-95 uppercase text-xs tracking-widest disabled:opacity-50"
                    >
                      {creating ? 'Creating...' : 'Continue to Questions'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCreate(false); resetForm(); }}
                      className="px-8 py-5 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Quick Questions */}
            {step === 2 && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-brand-green uppercase tracking-tight flex items-center gap-3">
                      <span className="w-1.5 h-8 bg-brand-gold rounded-full"></span>
                      2. Add Questions
                    </h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 ml-6">
                      {questions.length} question(s) prepared
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setInputMode('form')}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        inputMode === 'form'
                          ? 'bg-brand-green text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      Form
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputMode('bulk')}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                        inputMode === 'bulk'
                          ? 'bg-brand-green text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      Bulk Paste
                    </button>
                  </div>
                </div>

                {/* Bulk Input Mode */}
                {inputMode === 'bulk' && (
                  <div className="border-2 border-dashed border-blue-200 rounded-2xl p-8 mb-8 bg-blue-50/30">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4">
                      Paste questions in this format (separate each with ---):
                    </p>
                    <pre className="text-[11px] font-mono bg-white rounded-xl p-4 mb-6 border border-blue-100 text-slate-600 leading-relaxed">
{`What is the capital of France?
A. London
B. Paris
C. Berlin
D. Madrid
Answer: B
Marks: 1
---
What is 2 + 2?
A. 3
B. 4
C. 5
D. 6
Answer: B
Marks: 2`}</pre>
                    <textarea
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      rows={12}
                      className="w-full bg-white border-2 border-blue-200 rounded-xl px-6 py-4 text-sm font-mono text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all mb-4"
                      placeholder="Paste your questions here..."
                    />
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={parseBulkText}
                        disabled={!bulkText.trim()}
                        className="px-8 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95 uppercase text-[10px] tracking-widest disabled:opacity-50"
                      >
                        Parse & Add Questions
                      </button>
                      <button
                        type="button"
                        onClick={() => { setBulkText(''); setInputMode('form'); }}
                        className="px-6 py-4 bg-slate-100 text-slate-500 font-black rounded-xl hover:bg-slate-200 transition-all uppercase text-[10px] tracking-widest"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Form Mode */}
                {inputMode === 'form' && (
                  <>
                    {/* Quick add multiple */}
                    <div className="flex items-center gap-3 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quick Add:</span>
                      <input
                        type="number"
                        value={quickAddCount}
                        onChange={(e) => setQuickAddCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-16 bg-white border-2 border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-green-100"
                        min={1}
                        max={50}
                      />
                      <button
                        type="button"
                        onClick={() => addMultipleQuestions(quickAddCount)}
                        className="px-4 py-2 bg-indigo-500 text-white font-black rounded-lg hover:bg-indigo-600 transition-all text-[10px] uppercase tracking-widest shadow-sm active:scale-95"
                      >
                        Add {quickAddCount} Questions
                      </button>
                      <span className="text-[10px] text-slate-400 font-bold ml-auto">{questions.length} total</span>
                    </div>

                    {questions.map((q, i) => (
                      <div key={q._tempId} className="border-2 border-slate-100 rounded-2xl p-6 mb-6 bg-slate-50/50">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question {i + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeQuestion(i)}
                            className="text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest"
                          >
                            Remove
                          </button>
                        </div>
                        <TiptapEditor
                          value={q.questionText}
                          onChange={(html) => updateQuestion(i, 'questionText', html)}
                          placeholder="Enter question text"
                          minHeight={80}
                          mode="full"
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          {['A', 'B', 'C', 'D'].map((letter) => (
                            <div key={letter} className="border-2 border-slate-100 rounded-xl p-3 bg-white">
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black ${
                                  q.correctAnswer === letter
                                    ? 'bg-brand-green text-white'
                                    : 'bg-slate-200 text-slate-500'
                                }`}>
                                  {letter}
                                </span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Option {letter}</span>
                                <input
                                  type="radio"
                                  name={`correct-${i}`}
                                  value={letter}
                                  checked={q.correctAnswer === letter}
                                  onChange={() => updateQuestion(i, 'correctAnswer', letter)}
                                  className="ml-auto w-4 h-4 text-brand-green focus:ring-brand-green"
                                  title="Mark as correct"
                                />
                              </div>
                              <TiptapEditor
                                value={(q as any)[`option${letter}`]}
                                onChange={(html) => updateQuestion(i, `option${letter}` as any, html)}
                                placeholder={`Option ${letter}...`}
                                minHeight={60}
                                mode="minimal"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks:</span>
                          <input
                            type="number"
                            value={q.marks}
                            onChange={(e) => updateQuestion(i, 'marks', parseInt(e.target.value) || 1)}
                            className="w-20 bg-white border-2 border-slate-100 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-brand-green/40 transition-all"
                            min={1}
                          />
                        </div>
                      </div>
                    ))}

                    {questions.length === 0 && (
                      <div className="text-center py-16 border-2 border-dashed border-slate-200 rounded-2xl mb-6">
                        <p className="text-sm font-black text-slate-300 uppercase tracking-widest mb-2">No questions yet</p>
                        <p className="text-[10px] font-bold text-slate-400">Add questions above or switch to Bulk Paste mode</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={addQuestion}
                      className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-sm font-black text-slate-400 hover:border-brand-green/40 hover:text-brand-green transition-all uppercase tracking-widest mb-8"
                    >
                      + Add One More
                    </button>
                  </>
                )}

                {/* Action buttons (shown in both modes) */}
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={handleSaveQuestions}
                    disabled={savingQuestions || questions.length === 0}
                    className="px-10 py-5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/20 active:scale-95 uppercase text-xs tracking-widest disabled:opacity-50"
                  >
                    {savingQuestions ? 'Saving...' : `Save ${questions.length} Question(s)`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="px-10 py-5 bg-brand-green text-white font-black rounded-xl hover:bg-green-800 transition-all shadow-xl shadow-green-900/20 active:scale-95 uppercase text-xs tracking-widest"
                  >
                    Skip & Review
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-8 py-5 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Publish */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-black mb-8 text-brand-green uppercase tracking-tight flex items-center gap-3">
                  <span className="w-1.5 h-8 bg-brand-gold rounded-full"></span>
                  3. Review & Publish
                </h2>

                <div className="bg-slate-50 rounded-2xl p-8 mb-8 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Title</span>
                    <span className="text-sm font-black text-slate-800">{title}</span>
                  </div>
                  {description && (
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0 mt-0.5">Description</span>
                      <div className="text-xs font-bold text-slate-600 max-w-xs text-right"><MathRenderer content={description} /></div>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</span>
                    <span className="text-sm font-black text-slate-800">{duration} min</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Classes</span>
                    <span className="text-xs font-bold text-slate-600">
                      {selectedClassIds.length > 0
                        ? `${selectedClassIds.length} class(es)`
                        : 'All classes'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Questions Saved</span>
                    <span className="text-sm font-black text-slate-800">{questions.filter(q => q.questionText).length} added</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={handlePublish}
                    className="px-10 py-5 bg-emerald-600 text-white font-black rounded-xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/20 active:scale-95 uppercase text-xs tracking-widest"
                  >
                    Publish Exam
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishDraft}
                    className="px-10 py-5 bg-amber-500 text-white font-black rounded-xl hover:bg-amber-600 transition-all shadow-xl shadow-amber-900/20 active:scale-95 uppercase text-xs tracking-widest"
                  >
                    Save as Draft
                  </button>
                  <Link
                    href={`/admin/exams/${createdExamId}/questions`}
                    className="px-10 py-5 bg-slate-200 text-slate-700 font-black rounded-xl hover:bg-slate-300 transition-all uppercase text-xs tracking-widest inline-flex items-center"
                  >
                    Full Question Editor
                  </Link>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="px-8 py-5 bg-slate-100 text-slate-600 font-black rounded-xl hover:bg-slate-200 transition-all uppercase text-xs tracking-widest"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter */}
        {classes.length > 1 && (
          <div className="mb-8 flex items-center gap-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter by Class:</label>
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="bg-white border-2 border-slate-100 rounded-lg px-4 py-2 text-xs font-bold focus:outline-none focus:border-brand-green/40"
            >
              <option value="all">All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>{cls.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Exams Table */}
        <div className="portal-card bg-white overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400 border-b border-slate-200">
                <th className="px-8 py-6">Exam</th>
                <th className="px-8 py-6">Classes</th>
                <th className="px-8 py-6">Questions</th>
                <th className="px-8 py-6">Duration</th>
                <th className="px-8 py-6">Status</th>
                <th className="px-8 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExams.map((exam) => (
                <tr key={exam.id} className="hover:bg-green-50/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="font-black text-base text-slate-800">{exam.title}</div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1">
                      {(!exam.targetClasses || exam.targetClasses.length === 0) && (
                        <span className="text-[10px] font-bold text-slate-400">All classes</span>
                      )}
                      {exam.targetClasses?.slice(0, 2).map(c => (
                        <span key={c.id} className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black uppercase tracking-widest text-slate-600">{c.name}</span>
                      ))}
                      {exam.targetClasses && exam.targetClasses.length > 2 && (
                        <span className="text-[9px] font-bold text-slate-400">+{exam.targetClasses.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-black text-slate-600">
                    {exam.questionCount ?? '—'}
                  </td>
                  <td className="px-8 py-6 text-xs font-bold text-slate-500">
                    {exam.durationMinutes} min
                  </td>
                  <td className="px-8 py-6">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      exam.isPublished
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${exam.isPublished ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
                      {exam.isPublished ? 'LIVE' : 'DRAFT'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-4 text-[10px] font-black uppercase tracking-widest">
                      <Link href={`/admin/exams/${exam.id}`} className="text-slate-600 hover:text-brand-green transition-colors underline underline-offset-4">
                        Edit
                      </Link>
                      <Link href={`/admin/exams/${exam.id}/questions`} className="text-blue-600 hover:text-blue-800 transition-colors underline underline-offset-4">
                        Questions
                      </Link>
                      <Link href={`/teacher/results?examId=${exam.id}`} className="text-emerald-600 hover:text-emerald-800 transition-colors underline underline-offset-4">
                        Results
                      </Link>
                      {exam.isPublished ? (
                        <button onClick={() => handleUnpublish(exam.id)} className="text-amber-500 hover:text-amber-700 transition-colors underline underline-offset-4">
                          Unpublish
                        </button>
                      ) : (
                        <button onClick={() => handlePublishExisting(exam.id)} className="text-green-500 hover:text-green-700 transition-colors underline underline-offset-4">
                          Publish
                        </button>
                      )}
                      <button onClick={() => handleDelete(exam.id, exam.title)} className="text-red-500 hover:text-red-700 transition-colors underline underline-offset-4">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredExams.length === 0 && (
            <div className="p-24 text-center text-slate-400 bg-white">
              <p className="text-sm font-black uppercase tracking-widest mb-2">No exams found.</p>
              <p className="text-[10px] font-bold">Create a new exam to get started.</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
