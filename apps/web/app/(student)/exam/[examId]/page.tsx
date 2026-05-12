'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { useExamStore } from '@/lib/store/examStore';
import toast from 'react-hot-toast';
import ExamTimer from '@/components/exam/ExamTimer';
import QuestionCard from '@/components/exam/QuestionCard';
import QuestionNavigator from '@/components/exam/QuestionNavigator';
import ViolationOverlay from '@/components/exam/ViolationOverlay';

export default function ExamRoomPage() {
  const { examId } = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const autosaveTimer = useRef<NodeJS.Timeout>();

  const {
    submissionId, questions, answers, flaggedQuestions,
    remainingSeconds, status, currentIndex, violations, maxViolations,
    examTitle, setAnswer, toggleFlag, setRemainingSeconds,
    setStatus, incrementViolations, setExam, setCurrentIndex,
  } = useExamStore();

  const startExam = async () => {
    try {
      const res = await api.post(`/submissions/start/${examId}`);
      setExam(res.data);
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {
          toast.error('Fullscreen required for examination');
        });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Ineligibility detected');
      router.push('/dashboard');
    }
  };

  useEffect(() => {
    startExam();
    return () => {
      if (autosaveTimer.current) clearInterval(autosaveTimer.current);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [examId]);

  const saveBatch = useCallback(async (final = false) => {
    if (!submissionId || status !== 'active') return;
    const { answers: currentAnswers, flaggedQuestions: currentFlags } = useExamStore.getState();
    try {
      const res = await api.patch(`/submissions/${submissionId}/autosave`, {
        answers: currentAnswers,
        flaggedQuestions: currentFlags,
      });
      if (res.data.status === 'timed_out') {
        setStatus('timed_out');
        router.push(`/results/${submissionId}`);
      } else {
        setRemainingSeconds(res.data.remainingSeconds);
      }
    } catch {
      if (!final) toast.error('Sync failed. Reconnecting...', { id: 'sync' });
    }
  }, [submissionId, status, router]);

  const startAutosaveLoop = useCallback(() => {
    autosaveTimer.current = setInterval(() => saveBatch(), 5000);
  }, [saveBatch]);

  useEffect(() => {
    if (status === 'active') startAutosaveLoop();
    return () => { if (autosaveTimer.current) clearInterval(autosaveTimer.current); };
  }, [status, startAutosaveLoop]);

  const handleSubmit = async () => {
    if (!submissionId || !confirm('Final submission will terminate this session. Proceed?')) return;
    setStatus('submitting');
    try {
      await api.post(`/submissions/${submissionId}/submit`, { answers });
      setStatus('submitted');
      toast.success('Examination Completed Successfully');
      if (document.fullscreenElement) document.exitFullscreen();
      router.push(`/results/${submissionId}`);
    } catch {
      toast.error('Submission failed. Retrying sync...');
      setStatus('active');
    }
  };

  const reportViolation = useCallback(async () => {
    if (!submissionId || status !== 'active') return;
    incrementViolations();
    try {
      await api.post(`/submissions/${submissionId}/violation`);
      toast.error('SECURITY ALERT: ACTION RECORDED', { icon: '🛡️', duration: 4000 });
    } catch {}
  }, [submissionId, status, incrementViolations]);

  const setupAntiCheat = useCallback(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && status === 'active') reportViolation();
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && status === 'active') reportViolation();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) && ['c','v','x','j','u','p','a'].includes(e.key.toLowerCase()) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
      ) {
        e.preventDefault();
        if (status === 'active') reportViolation();
      }
    };
    const handleContext = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handlePaste = (e: ClipboardEvent) => e.preventDefault();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKey);
    document.addEventListener('contextmenu', handleContext);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('contextmenu', handleContext);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [status, reportViolation]);

  useEffect(() => {
    if (status === 'active') return setupAntiCheat();
  }, [status, setupAntiCheat]);

  const startLocalTimer = useCallback(() => {
    const timer = setInterval(() => {
      const current = useExamStore.getState().remainingSeconds;
      if (current <= 1) {
        clearInterval(timer);
        saveBatch(true);
        setRemainingSeconds(0);
      } else {
        setRemainingSeconds(current - 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [saveBatch, setRemainingSeconds]);

  useEffect(() => {
    if (status === 'active') return startLocalTimer();
  }, [status, startLocalTimer]);

  if (status === 'loading') return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-brand-green border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
        <p className="font-bold text-brand-green uppercase tracking-widest text-xs">Accessing Official Node...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans select-none overflow-hidden">
      <header className="bg-brand-green text-white px-6 py-4 flex items-center justify-between shadow-lg relative z-50">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-lg flex flex-col items-center justify-center border-2 border-brand-gold">
            <span className="text-brand-green font-black text-2xl">CBT Exam</span>
            <span className="text-[6px] font-bold text-brand-green uppercase tracking-tighter">CBT Terminal</span>
          </div>
          <div className="h-10 w-px bg-white/20"></div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-gold mb-1">CANDIDATE IDENTITY</p>
            <h2 className="text-xl font-black tracking-tight uppercase">{user?.name}</h2>
            <p className="text-[10px] font-mono text-white/60">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">EXAMINATION SUBJECT</p>
            <p className="font-black text-lg text-brand-gold uppercase">{examTitle}</p>
          </div>
          <div className="h-10 w-px bg-white/20"></div>
          <div className="flex flex-col items-end">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">TIME REMAINING</p>
            <ExamTimer
              remainingSeconds={remainingSeconds}
              isCritical={remainingSeconds < 300}
            />
          </div>
        </div>
      </header>

      {status === 'active' && (
        <main className="flex-1 flex flex-col items-center bg-slate-50 relative">
          <div className="w-full max-w-5xl px-6 py-8 flex-1 flex flex-col">
            <div className="flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 bg-brand-green text-white rounded flex items-center justify-center font-black text-xl shadow-sm">
                    {currentIndex + 1}
                  </span>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">of {questions.length} questions</span>
                </div>
                <button
                  onClick={() => toggleFlag(questions[currentIndex]?.id)}
                  className={`px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                    flaggedQuestions.includes(questions[currentIndex]?.id)
                      ? 'bg-amber-100 text-amber-700 border-2 border-amber-500'
                      : 'bg-slate-200 text-slate-500 hover:bg-amber-100 hover:text-amber-600'
                  }`}
                >
                  🚩 Flag for Review
                </button>
              </div>

              <div className="flex-1">
                {questions[currentIndex] && (
                  <QuestionCard
                    question={questions[currentIndex]}
                    selected={answers[questions[currentIndex].id] || null}
                    onChange={(val) => setAnswer(questions[currentIndex].id, val)}
                  />
                )}
              </div>

              <div className="mt-8 flex items-center justify-between pb-10">
                <button
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="btn-secondary px-10 py-4 flex items-center gap-3"
                >
                  <span className="text-xl">←</span> PREVIOUS
                </button>

                <div className="flex gap-4">
                  {currentIndex === questions.length - 1 ? (
                    <button
                      onClick={handleSubmit}
                      className="btn-green px-12 py-4 shadow-xl shadow-green-900/20"
                    >
                      SUBMIT EXAMINATION
                    </button>
                  ) : (
                    <button
                      onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                      className="btn-primary bg-blue-600 px-12 py-4"
                    >
                      NEXT QUESTION <span className="text-xl ml-3">→</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="w-full bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-40">
            <div className="max-w-7xl mx-auto px-6 py-6 ring-1 ring-slate-100">
              <QuestionNavigator
                total={questions.length}
                currentIndex={currentIndex}
                answers={answers}
                flagged={flaggedQuestions}
                questionIds={questions.map(q => q.id)}
                onJump={(idx) => setCurrentIndex(idx)}
              />
            </div>
          </div>
        </main>
      )}

      {violations > 0 && (
        <ViolationOverlay
          violations={violations}
          maxViolations={maxViolations}
          onDismiss={() => {}}
        />
      )}

      <style jsx global>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
