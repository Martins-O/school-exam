import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from '../exams/entities/exam.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { Question } from '../questions/entities/question.entity';
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
    private readonly classesService: ClassesService,
  ) {}

  async getTimetable(user?: any): Promise<{ scheduled: any[]; unscheduled: any[] }> {
    const query = this.examRepository
      .createQueryBuilder('exam')
      .leftJoinAndSelect('exam.targetClasses', 'targetClasses')
      .leftJoinAndSelect('exam.createdBy', 'createdBy')
      .loadRelationCountAndMap('exam.questionCount', 'exam.questions');

    if (user && user.role === 'teacher') {
      query.where('exam.createdById = :teacherId', { teacherId: user.id });
    }

    const allExams = await query.getMany();

    const scheduled = allExams
      .filter(e => e.startTime)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const unscheduled = allExams.filter(e => !e.startTime);

    return { scheduled, unscheduled };
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
      .loadRelationCountAndMap('exam.questionCount', 'exam.questions')
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

    const todayExamIds = new Set(today.map(e => e.id));
    const upcomingExamIds = new Set(upcoming.map(e => e.id));

    const completedExamIds = new Set(completed.map(c => c.examId));
    const filteredToday = today.filter(e => !completedExamIds.has(e.id));
    const filteredUpcoming = upcoming.filter(e => !completedExamIds.has(e.id));

    return {
      upcoming: filteredUpcoming,
      today: filteredToday,
      completed,
    };
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
