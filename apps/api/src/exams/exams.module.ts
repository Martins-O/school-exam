import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exam } from './entities/exam.entity';
import { Question } from '../questions/entities/question.entity';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { StudentExamsController } from './student-exams.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Exam, Question]), UsersModule],
  providers: [ExamsService],
  controllers: [ExamsController, StudentExamsController],
  exports: [ExamsService],
})
export class ExamsModule {}
