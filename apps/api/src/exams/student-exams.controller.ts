import { Controller, Get, Param, UseGuards, NotFoundException, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ExamsService } from './exams.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { Question } from '../questions/entities/question.entity';
import { ClassesService } from '../classes/classes.service';

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
    private readonly classesService: ClassesService,
  ) {}

  @Get()
  async findAvailable(@Req() req) {
    const now = new Date();
    const studentId = req.user.id;

    // Get student's classes
    const studentClasses = await this.classesService.getStudentClasses(studentId);
    const classIds = studentClasses.map(c => c.id);

    // Build query for published exams within time window
    const query = this.examRepository
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.targetClasses', 'targetClass')
      .where('exam.isPublished = :published', { published: true });

    // If student has classes, filter by those classes
    if (classIds.length > 0) {
      query.andWhere(
        '(targetClass.id IN (:...classIds) OR exam.targetClasses IS NULL)',
        { classIds }
      );
    }

    const exams = await query.getMany();

    const result = [];
    for (const exam of exams) {
      if (exam.startTime && exam.startTime > now) continue;
      if (exam.endTime && exam.endTime < now) continue;

      // Check if student already has a submission
      const existingSubmission = await this.examRepository.manager
        .createQueryBuilder()
        .select('1')
        .from('submissions', 's')
        .where('s.examId = :examId', { examId: exam.id })
        .andWhere('s.studentId = :studentId', { studentId })
        .andWhere('s.status IN (:...statuses)', { status: ['in_progress', 'submitted', 'timed_out', 'force_submitted'] })
        .getRawOne();

      if (existingSubmission) continue;

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
