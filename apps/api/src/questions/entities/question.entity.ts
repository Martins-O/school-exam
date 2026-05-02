import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Exam } from '../../exams/entities/exam.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  @JoinColumn()
  exam: Exam;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'jsonb' })
  options: Record<'A' | 'B' | 'C' | 'D', string>;

  @Column({ type: 'char', length: 1 })
  @Exclude()
  @Expose({ groups: ['admin'] })
  correctAnswer: string;

  @Column({ type: 'int', default: 1 })
  marks: number;

  @Column({ type: 'int', default: 0 })
  orderIndex: number;

  @CreateDateColumn()
  createdAt: Date;
}
