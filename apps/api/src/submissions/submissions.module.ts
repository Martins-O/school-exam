import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submission } from './entities/submission.entity';
import { ExamSessionService } from './exam-session.service';
import { RandomizerService } from './randomizer.service';
import { SubmissionsController } from './submissions.controller';
import { SessionCleanupTask } from './tasks/session-cleanup.task';
import { Exam } from '../exams/entities/exam.entity';
import { Question } from '../questions/entities/question.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Submission, Exam, Question, User])],
  providers: [
    ExamSessionService,
    RandomizerService,
    SessionCleanupTask,
  ],
  controllers: [SubmissionsController],
  exports: [ExamSessionService],
})
export class SubmissionsModule {}
