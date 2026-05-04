import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Column } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Class } from './class.entity';

@Entity('teacher_classes')
export class TeacherClass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Class)
  @JoinColumn({ name: 'classId' })
  class: Class;

  @Column()
  classId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @Column()
  teacherId: string;

  @CreateDateColumn()
  assignedAt: Date;
}
