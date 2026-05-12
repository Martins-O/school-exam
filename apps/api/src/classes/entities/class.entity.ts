import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ClassStudent } from './class-student.entity';
import { TeacherClass } from './teacher-class.entity';

@Entity('classes')
export class Class {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column()
  createdById: string;

  @OneToMany(() => ClassStudent, cs => cs.class)
  classStudents: ClassStudent[];

  @OneToMany(() => TeacherClass, tc => tc.class)
  teacherClasses: TeacherClass[];

  @CreateDateColumn()
  createdAt: Date;
}
