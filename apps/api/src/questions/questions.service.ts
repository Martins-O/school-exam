import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { Exam } from '../exams/entities/exam.entity';
import { QuestionCategory } from '../categories/entities/question-category.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(QuestionCategory)
    private readonly categoryRepository: Repository<QuestionCategory>,
  ) {}

  async create(examId: string, dto: CreateQuestionDto, user?: any): Promise<Question> {
    const exam = await this.examRepository.findOne({
      where: { id: examId },
      relations: ['createdBy'],
    });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Teachers can only add questions to their own exams
    if (user && user.role === 'teacher' && exam.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only add questions to your own exams');
    }

    let categories: QuestionCategory[] = [];
    if (dto.categoryIds && dto.categoryIds.length > 0) {
      categories = await this.categoryRepository.findByIds(dto.categoryIds);
      if (categories.length !== dto.categoryIds.length) {
        throw new NotFoundException('One or more categories not found');
      }
    }

    const question = this.questionRepository.create({
      questionText: dto.questionText,
      options: dto.options || {},
      correctAnswer: dto.correctAnswer,
      marks: dto.marks || 1,
      exam,
      categories,
    });

    return this.questionRepository.save(question);
  }

  async findAll(examId: string): Promise<Question[]> {
    return this.questionRepository.find({
      where: { exam: { id: examId } },
      relations: ['categories'],
    });
  }

  async findOne(examId: string, id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id, exam: { id: examId } },
      relations: ['categories'],
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return question;
  }

  async update(examId: string, id: string, dto: UpdateQuestionDto, user?: any): Promise<Question> {
    const question = await this.findOne(examId, id);

    // Teachers can only update questions in their own exams
    if (user && user.role === 'teacher' && question.exam.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only modify questions in your own exams');
    }

    if (dto.categoryIds) {
      const categories = await this.categoryRepository.findByIds(dto.categoryIds);
      question.categories = categories;
    }

    if (dto.questionText) question.questionText = dto.questionText;
    if (dto.options) question.options = dto.options;
    if (dto.correctAnswer) question.correctAnswer = dto.correctAnswer;
    if (dto.marks) question.marks = dto.marks;

    return this.questionRepository.save(question);
  }

  async remove(examId: string, id: string, user?: any): Promise<void> {
    const question = await this.findOne(examId, id);

    // Teachers can only delete questions from their own exams
    if (user && user.role === 'teacher' && question.exam.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only delete questions from your own exams');
    }

    await this.questionRepository.remove(question);
  }

  async bulkImport(examId: string, questions: CreateQuestionDto[], user?: any): Promise<{ success: number; failed: number; errors: string[] }> {
    const exam = await this.examRepository.findOne({
      where: { id: examId },
      relations: ['createdBy'],
    });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Teachers can only add questions to their own exams
    if (user && user.role === 'teacher' && exam.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only add questions to your own exams');
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < questions.length; i++) {
      try {
        const dto = questions[i];
        
        if (!dto.questionText || !dto.correctAnswer) {
          throw new BadRequestException('Missing required fields: questionText, correctAnswer');
        }

        let categories: QuestionCategory[] = [];
        if (dto.categoryIds && dto.categoryIds.length > 0) {
          categories = await this.categoryRepository.findByIds(dto.categoryIds);
        }

        const question = this.questionRepository.create({
          questionText: dto.questionText,
          options: dto.options || {},
          correctAnswer: dto.correctAnswer,
          marks: dto.marks || 1,
          exam,
          categories,
        });

        await this.questionRepository.save(question);
        success++;
      } catch (error) {
        failed++;
        errors.push(`Question ${i + 1}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  }
}
