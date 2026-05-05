import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { Question } from '../questions/entities/question.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { Class } from '../classes/entities/class.entity';
import { TeacherClass } from '../classes/entities/teacher-class.entity';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { StudentExamsController } from './student-exams.controller';
import { UsersModule } from '../users/users.module';
import { ClassesModule } from '../classes/classes.module';

@Module({
  imports: [TypeOrmModule.forFeature([Exam, Question, Submission, Class, TeacherClass]), UsersModule, ClassesModule],
  providers: [ExamsService],
  controllers: [ExamsController, StudentExamsController],
  exports: [ExamsService],
})
export class ExamsModule {}
