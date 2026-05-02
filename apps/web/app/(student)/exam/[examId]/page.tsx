'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useExamStore } from '@/lib/store/examStore';
import { useAuthStore } from '@/lib/store/authStore';
import ExamTimer from '@/components/exam/ExamTimer';
import QuestionCard from '@/components/exam/QuestionCard';
import QuestionNavigator from '@/components/exam/QuestionNavigator';
import ViolationOverlay from '@/components/exam/ViolationOverlay';
import toast from 'react-hot-toast';

export default function ExamPage() {
  const { examId } = useParams();
  const router = useRouter();
  const {
    submissionId,
    questions,
    answers,
    flaggedQuestions,
    remainingSeconds,
    status,
    currentIndex,
    setAnswer,
    toggleFlag,
    setRemainingSeconds,
    setExam,
    resetExam,
    setCurrentIndex,
  } = useExamStore();

  const [violations, setViolations] = useState(0);
  const [showViolationOverlay, setShowViolationOverlay] = useState(false);
  const [maxViolations] = useState(3);
  const autosaveRef = useRef<NodeJS.Timeout>();
  const timerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (status === 'idle') {
      startExam();
    }

    setupAntiCheat();
    requestFullscreen();

    startLocalTimer();
    startAutosaveLoop();

    return () => {
      clearInterval(autosaveRef.current);
      clearInterval(timerRef.current);
      removeAntiCheat();
    };
  }, []);

  const startExam = async () => {
    try {
      const res = await api.post(`/submissions/start/${examId}`);
      setExam(res.data);
      toast.success('Examination started. Good luck!');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to start exam';
      toast.error(msg);
      router.push('/dashboard');
    }
  };

  const requestFullscreen = () => {
    document.documentElement.requestFullscreen().catch(() => {});
  };

  const setupAntiCheat = () => {
    const handleVisibility = () => {
      if (document.hidden) reportViolation('tab_switch');
    };
    const handleFullscreen = () => {
      if (!document.fullscreenElement) reportViolation('fullscreen_exit');
    };
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handlePaste = (e: ClipboardEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && ['c','v','a','u','p','s'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        e.key === 'Escape'
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreen);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('keydown', handleKeyDown);

    (window as { __antiCheatCleanup?: () => void }).__antiCheatCleanup = () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreen);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  };

  const removeAntiCheat = () => {
    (window as { __antiCheatCleanup?: () => void }).__antiCheatCleanup?.();
  };

  const reportViolation = async (type: 'tab_switch' | 'fullscreen_exit') => {
    if (!submissionId) return;
    try {
      const res = await api.post(`/submissions/${submissionId}/violation`, { type });
      setViolations(res.data.violations);
      setShowViolationOverlay(true);
      if (res.data.autoSubmitted) {
        toast.error('EXAM TERMINATED: Too many violations.', { duration: 5000 });
        resetExam();
        router.push('/dashboard');
      }
    } catch (_err) {}
  };

  const startAutosaveLoop = () => {
    autosaveRef.current = setInterval(async () => {
      if (!submissionId) return;
      try {
        const res = await api.patch(`/submissions/${submissionId}/autosave`, {
          answers,
          flaggedQuestions,
        });
        setRemainingSeconds(res.data.remainingSeconds);
        if (res.data.status === 'timed_out' || res.data.status === 'force_submitted') {
          clearInterval(autosaveRef.current);
          toast.error('Session closed by server.');
          resetExam();
          router.push('/dashboard');
        }
      } catch (err: any) {
        if (err?.response?.status === 409) {
          clearInterval(autosaveRef.current);
          resetExam();
          router.push('/dashboard');
        }
      }
    }, 4000);
  };

  const startLocalTimer = () => {
    timerRef.current = setInterval(() => {
      setRemainingSeconds(remainingSeconds - 1);
      if (remainingSeconds <= 0) {
        clearInterval(timerRef.current);
        toast.error("Time is up!");
        resetExam();
        router.push('/dashboard');
      }
    }, 1000);
  };

  const handleSubmit = async () => {
    if (!confirm('FINAL SUBMISSION: Are you sure? You cannot undo this action.')) return;
    try {
      await api.post(`/submissions/${submissionId}/submit`, {
        answers,
        flaggedQuestions,
      });
      clearInterval(autosaveRef.current);
      clearInterval(timerRef.current);
      toast.success('Exam submitted successfully!');
      resetExam();
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Submission failed');
    }
  };

  if (status === 'idle' || questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-400 font-medium">Securing session...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30 font-sans">
      <nav className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-xl">C</div>
            <div>
              <h2 className="font-bold text-lg leading-none mb-1">CBT Active Session</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Encrypted Connection
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <div className="hidden md:block">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 text-right">Progress</p>
              <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500" 
                  style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <ExamTimer remainingSeconds={remainingSeconds} />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {showViolationOverlay && (
          <ViolationOverlay
            violations={violations}
            maxViolations={maxViolations}
            onDismiss={() => setShowViolationOverlay(false)}
          />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-slate-400">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <button 
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`flex items-center gap-2 px-4 py-1 rounded-full text-xs font-bold transition-all ${
                  flaggedQuestions.includes(currentQuestion.id) 
                  ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' 
                  : 'bg-white/5 text-slate-500 border border-white/10 hover:text-white'
                }`}
              >
                🚩 {flaggedQuestions.includes(currentQuestion.id) ? 'FLAGGED FOR REVIEW' : 'FLAG FOR REVIEW'}
              </button>
            </div>

            <QuestionCard
              question={currentQuestion}
              selectedAnswer={answers[currentQuestion.id] || null}
              onAnswer={(ans) => setAnswer(currentQuestion.id, ans)}
              isFlagged={flaggedQuestions.includes(currentQuestion.id)}
              onToggleFlag={() => toggleFlag(currentQuestion.id)}
            />

            <div className="flex items-center justify-between pt-6 border-t border-white/5">
              <div className="flex gap-4">
                <button
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-20 active:scale-95"
                >
                  PREVIOUS
                </button>
                <button
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-sm hover:bg-white/10 transition-all disabled:opacity-20 active:scale-95"
                >
                  NEXT QUESTION
                </button>
              </div>
              
              <button
                onClick={handleSubmit}
                className="px-10 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all shadow-xl shadow-blue-600/20 active:scale-95"
              >
                FINISH & SUBMIT
              </button>
            </div>
          </div>

          <aside className="lg:col-span-1">
            <div className="sticky top-28 space-y-6">
              <div className="glass-card p-6 rounded-3xl">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Subject Navigator</h3>
                <QuestionNavigator
                  questions={questions}
                  answers={answers}
                  flaggedQuestions={flaggedQuestions}
                  currentIndex={currentIndex}
                  onNavigate={(idx) => setCurrentIndex(idx)}
                />
              </div>

              <div className="bg-blue-600/10 border border-blue-600/20 rounded-3xl p-6">
                <div className="flex items-center gap-2 text-blue-400 mb-2">
                  <span className="text-xl">💡</span>
                  <span className="font-bold text-sm">Quick Tip</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Your work is automatically saved every few seconds. You can safely refresh the page if you encounter technical issues.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
