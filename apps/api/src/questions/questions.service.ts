import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from './entities/question.entity';
import { Exam } from '../exams/entities/exam.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
  ) {}

  async create(examId: string, dto: CreateQuestionDto): Promise<Question> {
    const exam = await this.examRepository.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    const question = this.questionRepository.create({
      ...dto,
      exam,
    });

    return this.questionRepository.save(question);
  }

  async findAll(examId: string): Promise<Question[]> {
    return this.questionRepository.find({
      where: { exam: { id: examId } },
    });
  }

  async findOne(examId: string, id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id, exam: { id: examId } },
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return question;
  }

  async update(examId: string, id: string, dto: UpdateQuestionDto): Promise<Question> {
    const question = await this.findOne(examId, id);
    Object.assign(question, dto);
    return this.questionRepository.save(question);
  }

  async remove(examId: string, id: string): Promise<void> {
    const question = await this.findOne(examId, id);
    await this.questionRepository.remove(question);
  }
}
