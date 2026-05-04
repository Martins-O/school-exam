import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionCategory } from './entities/question-category.entity';
import { QuestionCategoriesService } from './question-categories.service';
import { QuestionCategoriesController } from './question-categories.controller';

@Module({
  imports: [TypeOrmModule.forFeature([QuestionCategory])],
  controllers: [QuestionCategoriesController],
  providers: [QuestionCategoriesService],
  exports: [QuestionCategoriesService],
})
export class CategoriesModule {}
