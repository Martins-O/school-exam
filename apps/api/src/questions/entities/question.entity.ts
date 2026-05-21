import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Exam } from '../../exams/entities/exam.entity';
import { QuestionCategory } from '../../categories/entities/question-category.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examId' })
  exam: Exam;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'enum', enum: ['objective', 'theory'], default: 'objective' })
  @Expose({ groups: ['student', 'admin'] })
  type: 'objective' | 'theory';

  @Column({ type: 'jsonb', nullable: true })
  options: Record<string, string> | null;

  @Column({ type: 'char', length: 1, nullable: true })
  @Exclude()
  @Expose({ groups: ['admin'] })
  correctAnswer: string | null;

  @Column({ type: 'int', default: 1 })
  marks: number;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  @ManyToMany(() => QuestionCategory)
  @JoinTable({
    name: 'question_question_categories',
    joinColumn: { name: 'questionId' },
    inverseJoinColumn: { name: 'questionCategoryId' },
  })
  categories: QuestionCategory[];

  @Column({ type: 'text', nullable: true })
  @Expose({ groups: ['student', 'admin'] })
  pdfAttachment: string | null;

  @Column({ type: 'int', nullable: true })
  @Expose({ groups: ['student', 'admin'] })
  maxWordCount: number | null;

  @Column({ type: 'text', nullable: true })
  @Expose({ groups: ['student', 'admin'] })
  passageText: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
