import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submission } from './entities/submission.entity';
import { ExamSessionService } from './exam-session.service';
import { GraderService } from './grader.service';
import { RandomizerService } from './randomizer.service';
import { SubmissionsController } from './submissions.controller';
import { SessionCleanupTask } from './tasks/session-cleanup.task';
import { TranscriptAutoUpdateService } from './transcript-auto-update.service';
import { Exam } from '../exams/entities/exam.entity';
import { Question } from '../questions/entities/question.entity';
import { User } from '../users/entities/user.entity';
import { ClassStudent } from '../classes/entities/class-student.entity';
import { Transcript } from '../transcripts/entities/transcript.entity';

import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Submission, Exam, Question, User, ClassStudent, Transcript]),
    GatewayModule,
  ],
  providers: [
    ExamSessionService,
    GraderService,
    RandomizerService,
    SessionCleanupTask,
    TranscriptAutoUpdateService,
  ],
  controllers: [SubmissionsController],
  exports: [ExamSessionService],
})
export class SubmissionsModule {}
