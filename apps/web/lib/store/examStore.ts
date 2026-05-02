import { create } from 'zustand';

interface ExamState {
  submissionId: string | null;
  questions: { id: string; questionText: string; options: Record<string, string>; marks: number }[];
  answers: Record<string, string>;
  flaggedQuestions: string[];
  remainingSeconds: number;
  status: 'idle' | 'in_progress' | 'submitted' | 'timed_out';
  currentIndex: number;

  setAnswer: (questionId: string, answer: string) => void;
  toggleFlag: (questionId: string) => void;
  setRemainingSeconds: (seconds: number) => void;
  setExam: (data: { submissionId: string; questions: { id: string; questionText: string; options: Record<string, string>; marks: number }[]; remainingSeconds: number }) => void;
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

  setAnswer: (questionId, answer) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: answer },
    })),

  toggleFlag: (questionId) =>
    set((state) => ({
      flaggedQuestions: state.flaggedQuestions.includes(questionId)
        ? state.flaggedQuestions.filter((id) => id !== questionId)
        : [...state.flaggedQuestions, questionId],
    })),

  setRemainingSeconds: (seconds) => set({ remainingSeconds: seconds }),

  setExam: (data) =>
    set({
      submissionId: data.submissionId,
      questions: data.questions,
      remainingSeconds: data.remainingSeconds,
      status: 'in_progress' as const,
      answers: {},
      flaggedQuestions: [],
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
    }),

  setCurrentIndex: (index) => set({ currentIndex: index }),
}));
