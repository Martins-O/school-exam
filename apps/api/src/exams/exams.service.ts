import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from './entities/exam.entity';
import { Question } from '../questions/entities/question.entity';
import { Class } from '../classes/entities/class.entity';
import { TeacherClass } from '../classes/entities/teacher-class.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(TeacherClass)
    private readonly teacherClassRepository: Repository<TeacherClass>,
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

  async update(id: string, dto: UpdateExamDto, user?: any): Promise<Exam> {
    const exam = await this.findOne(id);

    // Teachers can only update their own exams
    if (user && user.role === 'teacher' && exam.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only modify your own exams');
    }

    Object.assign(exam, dto);
    return this.examRepository.save(exam);
  }

  async remove(id: string, user?: any): Promise<void> {
    const exam = await this.findOne(id);

    // Teachers can only delete their own exams
    if (user && user.role === 'teacher' && exam.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only delete your own exams');
    }

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

  async assignClasses(examId: string, classIds: string[], user: any): Promise<void> {
    const exam = await this.examRepository.findOne({
      where: { id: examId },
      relations: ['targetClasses'],
    });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    // Teachers can only assign classes they are assigned to
    if (user.role === 'teacher') {
      const teacherClasses = await this.teacherClassRepository.find({
        where: { teacherId: user.id },
        relations: ['class'],
      });
      const allowedClassIds = new Set(teacherClasses.map(tc => tc.classId));

      for (const classId of classIds) {
        if (!allowedClassIds.has(classId)) {
          throw new ForbiddenException('You can only assign classes you are assigned to');
        }
      }
    }

    // Verify all classes exist
    const classes = await this.classRepository.findByIds(classIds);
    if (classes.length !== classIds.length) {
      throw new NotFoundException('One or more classes not found');
    }

    exam.targetClasses = classes;
    await this.examRepository.save(exam);
  }
}
