import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Exam } from '../../exams/entities/exam.entity';
import { QuestionCategory } from '../../categories/entities/question-category.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  exam: Exam;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'jsonb' })
  options: Record<string, string>;

  @Column({ type: 'char', length: 1 })
  @Exclude()
  @Expose({ groups: ['admin'] })
  correctAnswer: string;

  @Column({ type: 'int', default: 1 })
  marks: number;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  @ManyToMany(() => QuestionCategory)
  @JoinTable()
  categories: QuestionCategory[];

  @CreateDateColumn()
  createdAt: Date;
}
