import { GraderService } from './grader.service';

function makeQuestion(overrides: Partial<{ id: string; marks: number; correctAnswer: string; type: 'objective' | 'theory' }> = {}) {
  return {
    id: overrides.id ?? 'q1',
    marks: overrides.marks ?? 1,
    correctAnswer: overrides.correctAnswer ?? 'A',
    type: overrides.type ?? ('objective' as const),
    questionText: '',
    options: null,
    orderIndex: 0,
    exam: null,
    categories: [],
    pdfAttachment: null,
    maxWordCount: null,
    passageText: null,
    createdAt: new Date(),
  } as any;
}

describe('GraderService', () => {
  let service: GraderService;

  beforeEach(() => {
    service = new GraderService();
  });

  describe('grade', () => {
    it('returns 0 score and 0 totalMarks for empty questions', () => {
      const result = service.grade([], {}, []);
      expect(result.score).toBe(0);
      expect(result.totalMarks).toBe(0);
      expect(result.objectiveMarks).toBe(0);
      expect(result.theoryMarks).toBe(0);
      expect(result.theoryQuestionIds).toEqual([]);
    });

    it('scores all correct answers', () => {
      const questions = [
        makeQuestion({ id: 'q1', marks: 2, correctAnswer: 'A' }),
        makeQuestion({ id: 'q2', marks: 3, correctAnswer: 'B' }),
      ];
      const result = service.grade(['q1', 'q2'], { q1: 'A', q2: 'B' }, questions);
      expect(result.score).toBe(5);
      expect(result.totalMarks).toBe(5);
    });

    it('scores zero for all wrong answers', () => {
      const questions = [
        makeQuestion({ id: 'q1', marks: 2, correctAnswer: 'A' }),
        makeQuestion({ id: 'q2', marks: 3, correctAnswer: 'B' }),
      ];
      const result = service.grade(['q1', 'q2'], { q1: 'C', q2: 'D' }, questions);
      expect(result.score).toBe(0);
      expect(result.totalMarks).toBe(5);
    });

    it('scores partial correct answers', () => {
      const questions = [
        makeQuestion({ id: 'q1', marks: 2, correctAnswer: 'A' }),
        makeQuestion({ id: 'q2', marks: 3, correctAnswer: 'B' }),
      ];
      const result = service.grade(['q1', 'q2'], { q1: 'A', q2: 'D' }, questions);
      expect(result.score).toBe(2);
      expect(result.totalMarks).toBe(5);
    });

    it('skips theory questions in auto-grading score but counts marks', () => {
      const questions = [
        makeQuestion({ id: 'q1', marks: 2, correctAnswer: 'A' }),
        makeQuestion({ id: 'q2', marks: 5, correctAnswer: null, type: 'theory' }),
        makeQuestion({ id: 'q3', marks: 3, correctAnswer: 'B' }),
      ];
      const result = service.grade(['q1', 'q2', 'q3'], { q1: 'A', q3: 'B' }, questions);
      expect(result.score).toBe(5);
      expect(result.totalMarks).toBe(10);
      expect(result.objectiveMarks).toBe(5);
      expect(result.theoryMarks).toBe(5);
      expect(result.theoryQuestionIds).toEqual(['q2']);
    });

    it('skips deleted questions (not in questions array)', () => {
      const questions = [
        makeQuestion({ id: 'q1', marks: 2, correctAnswer: 'A' }),
        makeQuestion({ id: 'q3', marks: 3, correctAnswer: 'B' }),
      ];
      const result = service.grade(['q1', 'q2', 'q3'], { q1: 'A', q2: 'B', q3: 'B' }, questions);
      expect(result.score).toBe(5);
      expect(result.totalMarks).toBe(5);
    });

    it('handles empty answers object', () => {
      const questions = [
        makeQuestion({ id: 'q1', marks: 2, correctAnswer: 'A' }),
      ];
      const result = service.grade(['q1'], {}, questions);
      expect(result.score).toBe(0);
      expect(result.totalMarks).toBe(2);
    });

    it('handles case-insensitive? answers match exactly', () => {
      const questions = [
        makeQuestion({ id: 'q1', marks: 1, correctAnswer: 'a' }),
      ];
      const result = service.grade(['q1'], { q1: 'A' }, questions);
      expect(result.score).toBe(0);
    });

    it('returns correct objective/theory marks breakdown', () => {
      const questions = [
        makeQuestion({ id: 'q1', marks: 3, correctAnswer: 'A' }),
        makeQuestion({ id: 'q2', marks: 7, correctAnswer: null, type: 'theory' }),
      ];
      const result = service.grade(['q1', 'q2'], { q1: 'A' }, questions);
      expect(result.objectiveMarks).toBe(3);
      expect(result.theoryMarks).toBe(7);
      expect(result.theoryQuestionIds).toEqual(['q2']);
    });
  });

  describe('calculateFinalScore', () => {
    it('combines objective and theory scores', () => {
      const score = service.calculateFinalScore(5, { t1: { score: 3 }, t2: { score: 2 } }, ['t1', 't2']);
      expect(score).toBe(10);
    });

    it('returns only objective score when no theory', () => {
      const score = service.calculateFinalScore(5, {}, []);
      expect(score).toBe(5);
    });

    it('skips ungraded theory questions', () => {
      const score = service.calculateFinalScore(5, { t1: { score: 3 } }, ['t1', 't2']);
      expect(score).toBe(8);
    });
  });

  describe('isFullyGraded', () => {
    it('returns true for no theory questions', () => {
      expect(service.isFullyGraded({}, [])).toBe(true);
    });

    it('returns true when all theory questions have scores', () => {
      expect(service.isFullyGraded({ t1: { score: 3 }, t2: { score: 4 } }, ['t1', 't2'])).toBe(true);
    });

    it('returns false when some theory questions are missing scores', () => {
      expect(service.isFullyGraded({ t1: { score: 3 } }, ['t1', 't2'])).toBe(false);
    });
  });
});
