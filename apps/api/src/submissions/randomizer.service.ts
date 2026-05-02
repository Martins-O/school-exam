import { Injectable } from '@nestjs/common';
import { Question } from '../questions/entities/question.entity';

@Injectable()
export class RandomizerService {
  shuffle(array: string[]): string[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  shuffleQuestions(questions: Question[]): string[] {
    return this.shuffle(questions.map(q => q.id));
  }
}
