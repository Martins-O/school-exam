import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Column, Unique } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Class } from './class.entity';

@Entity('class_students')
export class ClassStudent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'classId' })
  class: Class;

  @Column()
  classId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'studentId' })
  student: User;

  @Column()
  studentId: string;

  @CreateDateColumn()
  enrolledAt: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  unenrolledAt: Date;
}
