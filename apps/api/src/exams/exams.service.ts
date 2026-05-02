import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { Question } from '../questions/entities/question.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  async create(dto: CreateExamDto, adminUser: any): Promise<Exam> {
    const exam = this.examRepository.create({
      ...dto,
      createdBy: adminUser,
    });
    return this.examRepository.save(exam);
  }

  async findAll(): Promise<Exam[]> {
    return this.examRepository.find({
      relations: ['createdBy'],
    });
  }

  async findOne(id: string): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { id },
      relations: ['createdBy'],
    });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }
    return exam;
  }

  async update(id: string, dto: UpdateExamDto): Promise<Exam> {
    const exam = await this.findOne(id);
    Object.assign(exam, dto);
    return this.examRepository.save(exam);
  }

  async remove(id: string): Promise<void> {
    const exam = await this.findOne(id);
    await this.examRepository.remove(exam);
  }

  async publish(id: string): Promise<Exam> {
    const exam = await this.findOne(id);

    const questionCount = await this.questionRepository
      .createQueryBuilder('question')
      .where('question.examId = :examId', { examId: id })
      .getCount();

    if (questionCount === 0) {
      throw new BadRequestException('Cannot publish exam with no questions');
    }

    exam.isPublished = true;
    return this.examRepository.save(exam);
  }
}
