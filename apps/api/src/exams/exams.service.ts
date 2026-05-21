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
    const { targetClassIds, ...rest } = dto;

    const exam = this.examRepository.create({
      ...rest,
      createdBy: adminUser,
    });

    if (targetClassIds && targetClassIds.length > 0) {
      if (adminUser.role === 'teacher') {
        const teacherClasses = await this.teacherClassRepository.find({
          where: { teacherId: adminUser.id },
        });
        const allowedClassIds = new Set(teacherClasses.map(tc => tc.classId));
        for (const classId of targetClassIds) {
          if (!allowedClassIds.has(classId)) {
            throw new ForbiddenException(`You are not assigned to class ${classId}`);
          }
        }
      }

      const classes = await this.classRepository.findByIds(targetClassIds);
      if (classes.length !== targetClassIds.length) {
        throw new NotFoundException('One or more classes not found');
      }
      exam.targetClasses = classes;
    }

    return this.examRepository.save(exam);
  }

  async findAll(user?: any): Promise<Exam[]> {
    if (user && user.role === 'teacher') {
      return this.examRepository.find({
        where: { createdBy: { id: user.id } },
        relations: ['createdBy', 'targetClasses'],
      });
    }
    return this.examRepository.find({
      relations: ['createdBy', 'targetClasses'],
    });
  }

  async findAllWithQuestionCount(): Promise<any[]> {
    return this.examRepository
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.createdBy', 'createdBy')
      .leftJoinAndSelect('exam.targetClasses', 'targetClasses')
      .loadRelationCountAndMap('exam.questionCount', 'exam.questions')
      .getMany();
  }

  async findByTeacher(teacherId: string, classId?: string): Promise<any[]> {
    const qb = this.examRepository
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.createdBy', 'createdBy')
      .leftJoinAndSelect('exam.targetClasses', 'targetClasses')
      .loadRelationCountAndMap('exam.questionCount', 'exam.questions')
      .where('exam.createdById = :teacherId', { teacherId });

    if (classId) {
      qb.andWhere('targetClasses.id = :classId', { classId });
    }

    return qb.getMany();
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

  async findOneWithQuestionCount(id: string): Promise<any> {
    const exam = await this.examRepository
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.createdBy', 'createdBy')
      .leftJoinAndSelect('exam.targetClasses', 'targetClasses')
      .loadRelationCountAndMap('exam.questionCount', 'exam.questions')
      .where('exam.id = :id', { id })
      .getOne();
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

  async publish(id: string, user?: any): Promise<Exam> {
    const exam = await this.findOne(id);

    // Teachers can only publish their own exams
    if (user && user.role === 'teacher' && exam.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only publish your own exams');
    }

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
