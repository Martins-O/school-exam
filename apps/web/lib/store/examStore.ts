import { create } from 'zustand';

interface Question {
  id: string;
  questionText: string;
  options: Record<string, string>;
  marks: number;
  type?: 'objective' | 'theory';
  maxWordCount?: number | null;
  passageText?: string | null;
}

type ExamStatus = 'idle' | 'loading' | 'active' | 'submitting' | 'submitted' | 'timed_out';

interface ExamState {
  submissionId: string | null;
  questions: Question[];
  answers: Record<string, string>;
  flaggedQuestions: string[];
  remainingSeconds: number;
  status: ExamStatus;
  currentIndex: number;
  violations: number;
  maxViolations: number;
  examTitle: string;
  startedAt: string;
  durationMinutes: number;

  setAnswer: (questionId: string, answer: string) => void;
  setAnswers: (answers: Record<string, string>) => void;
  mergeAnswers: (answers: Record<string, string>) => void;
  toggleFlag: (questionId: string) => void;
  setRemainingSeconds: (seconds: number) => void;
  setStatus: (status: ExamStatus) => void;
  setViolations: (count: number) => void;
  incrementViolations: () => void;
  setExam: (data: {
    submissionId: string;
    questions: Question[];
    remainingSeconds: number;
    examTitle: string;
    startedAt: string;
    durationMinutes: number;
    maxViolations?: number;
    answers?: Record<string, string>;
    flaggedQuestions?: string[];
  }) => void;
  resetExam: () => void;
  setCurrentIndex: (index: number) => void;
}

export const useExamStore = create<ExamState>()((set) => ({
  submissionId: null,
  questions: [],
  answers: {},
  flaggedQuestions: [],
  remainingSeconds: 0,
  status: 'idle',
  currentIndex: 0,
  violations: 0,
  maxViolations: 3,
  examTitle: '',
  startedAt: '',
  durationMinutes: 0,

  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    })),

  setAnswers: (answers) => set({ answers }),

  mergeAnswers: (answers) =>
    set((state) => ({
      answers: { ...state.answers, ...answers },
    })),

  toggleFlag: (questionId) =>
    set((state) => ({
      flaggedQuestions: state.flaggedQuestions.includes(questionId)
        ? state.flaggedQuestions.filter((id) => id !== questionId)
        : [...state.flaggedQuestions, questionId],
    })),

  setRemainingSeconds: (seconds) => set({ remainingSeconds: seconds }),

  setStatus: (status) => set({ status }),

  setViolations: (count) => set({ violations: count }),

  incrementViolations: () =>
    set((state) => ({ violations: state.violations + 1 })),

  setExam: (data) =>
    set({
      submissionId: data.submissionId,
      questions: data.questions,
      remainingSeconds: data.remainingSeconds,
      examTitle: data.examTitle,
      startedAt: data.startedAt,
      durationMinutes: data.durationMinutes,
      maxViolations: data.maxViolations ?? 3,
      status: 'active',
      answers: data.answers ?? {},
      flaggedQuestions: data.flaggedQuestions ?? [],
      violations: 0,
      currentIndex: 0,
    }),

  resetExam: () =>
    set({
      submissionId: null,
      questions: [],
      answers: {},
      flaggedQuestions: [],
      remainingSeconds: 0,
      status: 'idle',
      currentIndex: 0,
      violations: 0,
      maxViolations: 3,
      examTitle: '',
      startedAt: '',
      durationMinutes: 0,
    }),

  setCurrentIndex: (index) => set({ currentIndex: index }),
}));
