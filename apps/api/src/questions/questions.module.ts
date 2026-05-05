import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './entities/question.entity';
import { Exam } from '../exams/entities/exam.entity';
import { QuestionCategory } from '../categories/entities/question-category.entity';
import { QuestionsService } from './questions.service';
import { QuestionsController } from './questions.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Exam, QuestionCategory]), CloudinaryModule],
  providers: [QuestionsService],
  controllers: [QuestionsController],
  exports: [QuestionsService],
})
export class QuestionsModule {}
