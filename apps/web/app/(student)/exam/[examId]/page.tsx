'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import toast from 'react-hot-toast';
import ExamTimer from '@/components/exam/ExamTimer';
import QuestionCard from '@/components/exam/QuestionCard';
import QuestionNavigator from '@/components/exam/QuestionNavigator';
import ViolationOverlay from '@/components/exam/ViolationOverlay';

interface Question {
  id: string;
  questionText: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  marks: number;
  type: 'objective' | 'theory';
  maxWordCount?: number | null;
  passageText?: string | null;
}

interface ExamSession {
  submissionId: string;
  examTitle: string;
  durationMinutes: number;
  startedAt: string;
  remainingSeconds: number;
  questions: Question[];
  maxViolations?: number;
}

export default function ExamRoomPage() {
  const { examId } = useParams();
  const [session, setSession] = useState<ExamSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [violations, setViolations] = useState(0);
  const [status, setStatus] = useState<'loading' | 'active' | 'submitting' | 'submitted' | 'timed_out'>('loading');
  
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const autosaveTimer = useRef<NodeJS.Timeout>();

  const startExam = async () => {
    try {
      const res = await api.post(`/submissions/start/${examId}`);
      setSession(res.data);
      setRemainingSeconds(res.data.remainingSeconds);
      setStatus('active');
      
      // Request Fullscreen
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

  const saveBatch = async (final = false) => {
    if (!session || status !== 'active') return;
    try {
      const res = await api.patch(`/submissions/${session.submissionId}/autosave`, {
        answers,
        flaggedQuestions: flagged
      });
      
      if (res.data.status === 'timed_out') {
        setStatus('timed_out');
        router.push(`/results/${session.submissionId}`);
      } else {
        setRemainingSeconds(res.data.remainingSeconds);
      }
    } catch {
      if (!final) toast.error('Sync failed. Reconnecting...', { id: 'sync' });
    }
  };

  const startAutosaveLoop = useCallback(() => {
    autosaveTimer.current = setInterval(() => saveBatch(), 5000);
  }, [session, answers, flagged, status]);

  useEffect(() => {
    if (status === 'active') startAutosaveLoop();
    return () => { if (autosaveTimer.current) clearInterval(autosaveTimer.current); };
  }, [status, startAutosaveLoop]);

  const handleSubmit = async () => {
    if (!session || !confirm('Final submission will terminate this session. Proceed?')) return;
    setStatus('submitting');
    try {
      await api.post(`/submissions/${session.submissionId}/submit`, { answers });
      setStatus('submitted');
      toast.success('Examination Completed Successfully');
      if (document.fullscreenElement) document.exitFullscreen();
      router.push(`/results/${session.submissionId}`);
    } catch (_err) {
      toast.error('Submission failed. Retrying sync...');
      setStatus('active');
    }
  };

  const reportViolation = useCallback(async () => {
    if (!session || status !== 'active') return;
    setViolations(v => v + 1);
    try {
      await api.post(`/submissions/${session.submissionId}/violation`);
      toast.error('SECURITY ALERT: ACTION RECORDED', { icon: '🛡️', duration: 4000 });
    } catch {}
  }, [session, status]);

  const setupAntiCheat = useCallback(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && status === 'active') reportViolation();
    };
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['c','v','x','j','u','p'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        reportViolation();
      }
    };
    const handleContext = (e: MouseEvent) => e.preventDefault();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('keydown', handleKey);
    document.addEventListener('contextmenu', handleContext);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('contextmenu', handleContext);
    };
  }, [status, reportViolation]);

  useEffect(() => {
    if (status === 'active') return setupAntiCheat();
  }, [status, setupAntiCheat]);

  const startLocalTimer = useCallback(() => {
    const timer = setInterval(() => {
      setRemainingSeconds(s => {
        if (s <= 1) {
          clearInterval(timer);
          saveBatch(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [status]);

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
      {/* Official Exam Header */}
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
            <p className="font-black text-lg text-brand-gold uppercase">{session?.examTitle}</p>
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
            {session && (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 bg-brand-green text-white rounded flex items-center justify-center font-black text-xl shadow-sm">
                      {currentIndex + 1}
                    </span>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">of {session.questions.length} questions</span>
                  </div>
                  <button 
                    onClick={() => {
                      const qId = session.questions[currentIndex].id;
                      setFlagged(f => f.includes(qId) ? f.filter(id => id !== qId) : [...f, qId]);
                    }}
                    className={`px-4 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all ${
                      flagged.includes(session.questions[currentIndex].id) 
                        ? 'bg-amber-100 text-amber-700 border-2 border-amber-500' 
                        : 'bg-slate-200 text-slate-500 hover:bg-amber-100 hover:text-amber-600'
                    }`}
                  >
                    🚩 Flag for Review
                  </button>
                </div>

                <div className="flex-1">
                  <QuestionCard 
                    question={session.questions[currentIndex]}
                    selected={answers[session.questions[currentIndex].id] || null}
                    onChange={(val) => setAnswers({ ...answers, [session.questions[currentIndex].id]: val })}
                  />
                </div>

                {/* Tacticle Bottom Navigation Toolbar */}
                <div className="mt-8 flex items-center justify-between pb-10">
                  <button
                    onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
                    disabled={currentIndex === 0}
                    className="btn-secondary px-10 py-4 flex items-center gap-3"
                  >
                    <span className="text-xl">←</span> PREVIOUS
                  </button>
                  
                  <div className="flex gap-4">
                    {currentIndex === session.questions.length - 1 ? (
                      <button
                        onClick={handleSubmit}
                        className="btn-green px-12 py-4 shadow-xl shadow-green-900/20"
                      >
                        SUBMIT EXAMINATION
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentIndex(i => Math.min(session.questions.length - 1, i + 1))}
                        className="btn-primary bg-blue-600 px-12 py-4"
                      >
                        NEXT QUESTION <span className="text-xl ml-3">→</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Persistent Navigator Drawer (Always Visible in Standard CBT) */}
          <div className="w-full bg-white border-t border-slate-200 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] relative z-40">
            <div className="max-w-7xl mx-auto px-6 py-6 ring-1 ring-slate-100">
               <QuestionNavigator 
                total={session?.questions.length || 0}
                currentIndex={currentIndex}
                answers={answers}
                flagged={flagged}
                questionIds={session?.questions.map(q => q.id) || []}
                onJump={(idx) => setCurrentIndex(idx)}
              />
            </div>
          </div>
        </main>
      )}

      {violations > 0 && (
        <ViolationOverlay 
          violations={violations} 
          maxViolations={session?.maxViolations || 3} 
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
