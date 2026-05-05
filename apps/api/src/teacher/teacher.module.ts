import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from '../exams/entities/exam.entity';
import { Question } from '../questions/entities/question.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { TeacherClass } from '../classes/entities/teacher-class.entity';
import { Class } from '../classes/entities/class.entity';
import { User } from '../users/entities/user.entity';
import { TeacherService } from './teacher.service';
import { TeacherController } from './teacher.controller';
import { ExamsService } from '../exams/exams.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, Question, Submission, TeacherClass, Class, User]),
  ],
  providers: [TeacherService, ExamsService],
  controllers: [TeacherController],
  exports: [TeacherService],
})
export class TeacherModule {}
