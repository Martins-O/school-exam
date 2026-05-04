import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('transcripts')
export class Transcript {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column()
  studentId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'generatedById' })
  generatedBy: User;

  @Column({ nullable: true })
  generatedById: string;

  @Column({ type: 'timestamptz' })
  periodStart: Date;

  @Column({ type: 'timestamptz', nullable: true })
  periodEnd: Date;

  @Column({ type: 'jsonb', default: [] })
  results: any[];

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  averageScore: number;

  @Column({ type: 'text', nullable: true })
  comments: string;

  @Column({ default: false })
  isFinalized: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
