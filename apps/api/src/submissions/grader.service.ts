import { Injectable } from '@nestjs/common';
import { Question } from '../questions/entities/question.entity';

@Injectable()
export class GraderService {
  /**
   * Grades a submission — only objective questions are auto-graded.
   * Theory questions are excluded from auto-grading and must be graded manually.
   */
  grade(
    questionOrder: string[],
    answers: Record<string, string>,
    questions: Question[],
  ): {
    score: number;
    totalMarks: number;
    objectiveMarks: number;
    theoryMarks: number;
    theoryQuestionIds: string[];
  } {
    const correctAnswerMap = new Map<string, string>();
    const marksMap = new Map<string, number>();
    const typeMap = new Map<string, 'objective' | 'theory'>();
    let totalMarks = 0;
    let objectiveMarks = 0;
    let theoryMarks = 0;
    const theoryQuestionIds: string[] = [];

    for (const q of questions) {
      correctAnswerMap.set(q.id, q.correctAnswer);
      marksMap.set(q.id, q.marks);
      typeMap.set(q.id, q.type || 'objective');
      totalMarks += q.marks;
      if (q.type === 'theory') {
        theoryMarks += q.marks;
        theoryQuestionIds.push(q.id);
      } else {
        objectiveMarks += q.marks;
      }
    }

    let score = 0;
    for (const questionId of questionOrder) {
      const qType = typeMap.get(questionId);
      if (qType === 'theory') continue;

      if (correctAnswerMap.has(questionId)) {
        const correct = correctAnswerMap.get(questionId);
        if (correct && answers[questionId] === correct) {
          score += marksMap.get(questionId) || 0;
        }
      }
    }

    return { score, totalMarks, objectiveMarks, theoryMarks, theoryQuestionIds };
  }

  /**
   * Calculate final score after manual grading.
   * Combines auto-graded objective score with manually graded theory scores.
   */
  calculateFinalScore(
    objectiveScore: number,
    questionScores: Record<string, { score: number }>,
    theoryQuestionIds: string[],
  ): number {
    let theoryScore = 0;
    for (const qId of theoryQuestionIds) {
      if (questionScores[qId]) {
        theoryScore += questionScores[qId].score;
      }
    }
    return objectiveScore + theoryScore;
  }

  /**
   * Check if all theory questions have been graded.
   */
  isFullyGraded(
    questionScores: Record<string, { score: number }>,
    theoryQuestionIds: string[],
  ): boolean {
    if (theoryQuestionIds.length === 0) return true;
    return theoryQuestionIds.every(qId => questionScores[qId] !== undefined);
  }
}
