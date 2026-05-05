import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submission } from '../submissions/entities/submission.entity';
import { Exam } from '../exams/entities/exam.entity';
import { User } from '../users/entities/user.entity';
import { ResultsService } from './results.service';
import { StatsService } from './stats.service';
import { ResultsController, AdminResultsController } from './results.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Submission, Exam, User])],
  providers: [ResultsService, StatsService],
  controllers: [ResultsController, AdminResultsController],
  exports: [ResultsService, StatsService],
})
export class ResultsModule {}
