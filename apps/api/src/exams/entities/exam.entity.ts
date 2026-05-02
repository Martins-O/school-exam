import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  durationMinutes: number;

  @Column({ type: 'timestamptz', nullable: true })
  startTime: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endTime: Date;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ type: 'int', default: 3 })
  maxViolations: number;

  @ManyToOne(() => User)
  @JoinColumn()
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
