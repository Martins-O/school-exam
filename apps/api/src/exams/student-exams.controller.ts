import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ExamsService } from './exams.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { Question } from '../questions/entities/question.entity';

@Controller('student/exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('student')
export class StudentExamsController {
  constructor(
    private readonly examsService: ExamsService,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
  ) {}

  @Get()
  async findAvailable() {
    const now = new Date();

    const exams = await this.examRepository
      .createQueryBuilder('exam')
      .where('exam.isPublished = :published', { published: true })
      .getMany();

    const result = [];
    for (const exam of exams) {
      if (exam.startTime && exam.startTime > now) continue;
      if (exam.endTime && exam.endTime < now) continue;

      const questionCount = await this.questionRepository
        .createQueryBuilder('q')
        .where('q.examId = :examId', { examId: exam.id })
        .getCount();

      result.push({
        id: exam.id,
        title: exam.title,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        startTime: exam.startTime,
        endTime: exam.endTime,
        questionCount,
      });
    }

    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const exam = await this.examsService.findOne(id);

    if (!exam.isPublished) {
      throw new NotFoundException('Exam not found');
    }

    const now = new Date();
    if (exam.startTime && exam.startTime > now) {
      throw new NotFoundException('Exam not available yet');
    }
    if (exam.endTime && exam.endTime < now) {
      throw new NotFoundException('Exam has ended');
    }

    const questionCount = await this.questionRepository
      .createQueryBuilder('q')
      .where('q.examId = :examId', { examId: exam.id })
      .getCount();

    return {
      id: exam.id,
      title: exam.title,
      description: exam.description,
      durationMinutes: exam.durationMinutes,
      startTime: exam.startTime,
      endTime: exam.endTime,
      questionCount,
    };
  }
}
