import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submission } from '../submissions/entities/submission.entity';
import { Exam } from '../exams/entities/exam.entity';
import { User } from '../users/entities/user.entity';
import { ResultsService } from './results.service';
import { ResultsController, AdminResultsController } from './results.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Submission, Exam, User])],
  providers: [ResultsService],
  controllers: [ResultsController, AdminResultsController],
  exports: [ResultsService],
})
export class ResultsModule {}
