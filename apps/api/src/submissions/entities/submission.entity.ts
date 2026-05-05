import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Exam } from '../../exams/entities/exam.entity';

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  student: User;

  @ManyToOne(() => Exam)
  @JoinColumn()
  exam: Exam;

  @Column({ type: 'jsonb' })
  questionOrder: string[];

  @Column({ type: 'jsonb', default: {} })
  answers: Record<string, string>;

  @Column({ type: 'jsonb', default: [] })
  flaggedQuestions: string[];

  @Column({ type: 'enum', enum: ['in_progress', 'submitted', 'timed_out', 'force_submitted'] })
  status: 'in_progress' | 'submitted' | 'timed_out' | 'force_submitted';

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date;

  @Column({ type: 'int', nullable: true })
  score: number;

  @Column({ type: 'int', nullable: true })
  totalMarks: number;

  @Column({ type: 'int', default: 0 })
  violations: number;

  @Column({ type: 'boolean', default: false })
  autoSubmitted: boolean;

  @Column({ type: 'jsonb', default: {} })
  questionScores: Record<string, {
    score: number;
    feedback: string;
    gradedBy: string;
    gradedAt: string;
  }>;

  @Column({ type: 'enum', enum: ['auto_graded', 'pending_manual', 'fully_graded'], default: 'auto_graded' })
  gradingStatus: 'auto_graded' | 'pending_manual' | 'fully_graded';

  @Column({ type: 'int', nullable: true })
  finalScore: number | null;

  @Column({ type: 'text', nullable: true })
  gradingFeedback: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  gradedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
