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

export default function ExamPage() {
  const { examId } = useParams();
  const router = useRouter();
  const {} = useAuthStore();
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
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to start exam';
      alert(msg);
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
        (e.ctrlKey && ['c','v','a','u'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I')
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
      if (res.data.autoSubmitted) {
        alert('Exam auto-submitted due to violations');
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
          alert('Exam time is up or was force-submitted');
          resetExam();
          router.push('/dashboard');
        }
      } catch (err: any) {
        if (err?.response?.status === 409) {
          clearInterval(autosaveRef.current);
          alert('Exam already closed');
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
        alert("Time's up!");
        resetExam();
        router.push('/dashboard');
      }
    }, 1000);
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit?')) return;
    try {
      await api.post(`/submissions/${submissionId}/submit`, {
        answers,
        flaggedQuestions,
      });
      clearInterval(autosaveRef.current);
      clearInterval(timerRef.current);
      resetExam();
      router.push('/dashboard?submitted=true');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Submission failed');
    }
  };

  if (status === 'idle' || questions.length === 0) {
    return <div className="min-h-screen flex items-center justify-center">Loading exam...</div>;
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Exam in Progress</h1>
          <ExamTimer remainingSeconds={remainingSeconds} />
        </div>

        {violations > 0 && (
          <ViolationOverlay violations={violations} maxViolations={maxViolations} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <QuestionCard
              question={currentQuestion}
              selectedAnswer={answers[currentQuestion.id] || null}
              onAnswer={(ans) => setAnswer(currentQuestion.id, ans)}
              isFlagged={flaggedQuestions.includes(currentQuestion.id)}
              onToggleFlag={() => toggleFlag(currentQuestion.id)}
            />
            <div className="mt-6 flex justify-between">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(currentIndex - 1)}
                className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex(currentIndex + 1)}
                className="px-4 py-2 bg-gray-300 rounded-md disabled:opacity-50"
              >
                Next
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit Exam
              </button>
            </div>
          </div>
          <div className="lg:col-span-1">
            <QuestionNavigator
              questions={questions}
              answers={answers}
              flaggedQuestions={flaggedQuestions}
              currentIndex={currentIndex}
              onNavigate={(idx) => setCurrentIndex(idx)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
