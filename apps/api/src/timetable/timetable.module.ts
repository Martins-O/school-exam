import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from '../exams/entities/exam.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { Question } from '../questions/entities/question.entity';
import { ClassesModule } from '../classes/classes.module';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';

@Module({
  imports: [TypeOrmModule.forFeature([Exam, Submission, Question]), ClassesModule],
  controllers: [TimetableController],
  providers: [TimetableService],
})
export class TimetableModule {}
