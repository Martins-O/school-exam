import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from '../exams/entities/exam.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { Question } from '../questions/entities/question.entity';
import { Class } from '../classes/entities/class.entity';
import { TeacherClass } from '../classes/entities/teacher-class.entity';
import { ClassesService } from '../classes/classes.service';

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(Submission)
    private readonly submissionRepository: Repository<Submission>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Class)
    private readonly classRepository: Repository<Class>,
    @InjectRepository(TeacherClass)
    private readonly teacherClassRepository: Repository<TeacherClass>,
    private readonly classesService: ClassesService,
  ) {}

  async getTimetable(user?: any, classId?: string): Promise<{
    classes: any[];
    selectedClass: any | null;
    exams: any[];
    availableExams: any[];
  }> {
    let allClasses: Class[];
    if (user && user.role === 'teacher') {
      const teacherClasses = await this.teacherClassRepository.find({
        where: { teacherId: user.id },
        relations: ['class'],
      });
      allClasses = teacherClasses.map(tc => tc.class);
      if (classId && !allClasses.some(c => c.id === classId)) {
        throw new ForbiddenException('You are not assigned to this class');
      }
    } else {
      allClasses = await this.classRepository.find();
    }

    let selectedClass: Class | null = null;
    if (classId) {
      selectedClass = allClasses.find(c => c.id === classId) || null;
      if (!selectedClass && user?.role !== 'teacher') {
        selectedClass = await this.classRepository.findOne({ where: { id: classId } });
      }
    }

    const examQuery = this.examRepository
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.targetClasses', 'targetClasses')
      .leftJoinAndSelect('exam.createdBy', 'createdBy')
      .loadRelationCountAndMap('exam.questionCount', 'exam.questions');

    if (user && user.role === 'teacher') {
      examQuery.where('exam.createdById = :teacherId', { teacherId: user.id });
    }

    const allExams = await examQuery.getMany();

    let classExams = allExams;
    if (selectedClass) {
      classExams = allExams.filter(exam =>
        exam.targetClasses?.some(c => c.id === selectedClass.id)
      );
    }

    const scheduled = classExams
      .filter(e => e.startTime)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const unscheduled = classExams.filter(e => !e.startTime);

    const allScheduledIds = new Set(classExams.filter(e => e.startTime).map(e => e.id));
    const availableExams = allExams
      .filter(e => !e.startTime)
      .filter(e => !allScheduledIds.has(e.id))
      .filter(e => user?.role !== 'teacher' || e.createdBy?.id === user?.id);

    return {
      classes: allClasses.map(c => ({ id: c.id, name: c.name })),
      selectedClass: selectedClass ? { id: selectedClass.id, name: selectedClass.name } : null,
      exams: [...scheduled, ...unscheduled],
      availableExams: availableExams.map(e => ({
        id: e.id,
        title: e.title,
        durationMinutes: e.durationMinutes,
      })),
    };
  }

  async getStudentTimetable(studentId: string): Promise<{
    upcoming: any[];
    today: any[];
    completed: any[];
  }> {
    const now = new Date();

    const studentClasses = await this.classesService.getStudentClasses(studentId);
    const classIds = studentClasses.map(c => c.id);

    const allExams = await this.examRepository
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.targetClasses', 'targetClass')
      .leftJoinAndSelect('exam.createdBy', 'createdBy')
      .where('exam.isPublished = :published', { published: true })
      .getMany();

    const studentExams = allExams.filter(exam => {
      if (exam.targetClasses && exam.targetClasses.length > 0) {
        return exam.targetClasses.some(c => classIds.includes(c.id));
      }
      return true;
    });

    const questionCounts: Record<string, number> = {};
    for (const exam of studentExams) {
      const count = await this.questionRepository
        .createQueryBuilder('q')
        .where('q.examId = :examId', { examId: exam.id })
        .getCount();
      questionCounts[exam.id] = count;
    }

    const upcoming = studentExams
      .filter(e => e.startTime && new Date(e.startTime) > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        durationMinutes: e.durationMinutes,
        startTime: e.startTime,
        endTime: e.endTime,
        questionCount: questionCounts[e.id] || 0,
        targetClasses: e.targetClasses,
      }));

    const today = studentExams
      .filter(e => {
        if (e.startTime && new Date(e.startTime) > now) return false;
        if (e.endTime && new Date(e.endTime) < now) return false;
        return true;
      })
      .map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        durationMinutes: e.durationMinutes,
        startTime: e.startTime,
        endTime: e.endTime,
        questionCount: questionCounts[e.id] || 0,
      }));

    const submissions = await this.submissionRepository
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.exam', 'exam')
      .where('s.studentId = :studentId', { studentId })
      .andWhere('s.status IN (:...statuses)', {
        statuses: ['submitted', 'timed_out', 'force_submitted'],
      })
      .orderBy('s.submittedAt', 'DESC')
      .getMany();

    const completed = submissions.map(s => ({
      id: s.id,
      examId: s.exam.id,
      examTitle: s.exam.title,
      score: s.score,
      totalMarks: s.totalMarks,
      percentage: s.totalMarks ? Math.round((s.score / s.totalMarks) * 100) : null,
      submittedAt: s.submittedAt,
      status: s.status,
    }));

    const completedExamIds = new Set(completed.map(c => c.examId));
    const filteredToday = today.filter(e => !completedExamIds.has(e.id));
    const filteredUpcoming = upcoming.filter(e => !completedExamIds.has(e.id));

    return {
      upcoming: filteredUpcoming,
      today: filteredToday,
      completed,
    };
  }

  async scheduleExam(
    examId: string,
    classId: string,
    startTime: Date,
    endTime: Date | null,
    user: any,
  ): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { id: examId },
      relations: ['createdBy', 'targetClasses'],
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (user.role === 'teacher' && exam.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only schedule your own exams');
    }

    const classEntity = await this.classRepository.findOne({ where: { id: classId } });
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }

    if (user.role === 'teacher') {
      const teacherClass = await this.teacherClassRepository.findOne({
        where: { teacherId: user.id, classId },
      });
      if (!teacherClass) {
        throw new ForbiddenException('You are not assigned to this class');
      }
    }

    if (startTime <= new Date()) {
      throw new BadRequestException('Start time must be in the future');
    }

    const alreadyTargets = exam.targetClasses?.some(c => c.id === classId);
    if (!alreadyTargets) {
      exam.targetClasses = [...(exam.targetClasses || []), classEntity];
    }

    exam.startTime = startTime;
    exam.endTime = endTime;
    return this.examRepository.save(exam);
  }

  async updateSchedule(
    examId: string,
    startTime: Date | null,
    endTime: Date | null,
    user: any,
  ): Promise<Exam> {
    const exam = await this.examRepository.findOne({
      where: { id: examId },
      relations: ['createdBy'],
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (user.role === 'teacher' && exam.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only schedule your own exams');
    }

    exam.startTime = startTime;
    exam.endTime = endTime;
    return this.examRepository.save(exam);
  }
}
