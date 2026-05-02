import { Injectable } from '@nestjs/common';
import { Question } from '../questions/entities/question.entity';

@Injectable()
export class GraderService {
  /**
   * Grades a submission based on the provided answers and question set.
   * Returns the total score and total marks possible.
   */
  grade(
    questionOrder: string[],
    answers: Record<string, string>,
    questions: Question[],
  ): { score: number; totalMarks: number } {
    const correctAnswerMap = new Map<string, string>();
    const marksMap = new Map<string, number>();
    let totalMarks = 0;

    for (const q of questions) {
      correctAnswerMap.set(q.id, q.correctAnswer);
      marksMap.set(q.id, q.marks);
      totalMarks += q.marks;
    }

    let score = 0;
    for (const questionId of questionOrder) {
      if (correctAnswerMap.has(questionId)) {
        if (answers[questionId] === correctAnswerMap.get(questionId)) {
          score += marksMap.get(questionId) || 0;
        }
      }
    }

    return { score, totalMarks };
  }
}
