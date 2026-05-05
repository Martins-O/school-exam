import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from '../exams/entities/exam.entity';
import { Question } from '../questions/entities/question.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { TeacherClass } from '../classes/entities/teacher-class.entity';
import { Class } from '../classes/entities/class.entity';

@Injectable()
export class TeacherService {
  constructor(
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(TeacherClass)
    private readonly teacherClassRepo: Repository<TeacherClass>,
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
  ) {}

  async getStats(teacherId: string) {
    const [myExams, myQuestions, mySubmissions, assignedClasses] = await Promise.all([
      this.examRepo.count({ where: { createdBy: { id: teacherId } } }),
      this.questionRepo
        .createQueryBuilder('q')
        .innerJoin('q.exam', 'e')
        .where('e.createdById = :teacherId', { teacherId })
        .getCount(),
      this.submissionRepo
        .createQueryBuilder('s')
        .innerJoin('s.exam', 'e')
        .where('e.createdById = :teacherId', { teacherId })
        .getCount(),
      this.teacherClassRepo.count({ where: { teacherId } }),
    ]);

    return { myExams, myQuestions, mySubmissions, assignedClasses };
  }

  async getClasses(teacherId: string): Promise<Class[]> {
    const teacherClasses = await this.teacherClassRepo.find({
      where: { teacherId },
      relations: ['class', 'class.createdBy'],
    });
    return teacherClasses.map(tc => tc.class);
  }

  async getResults(teacherId: string, examId?: string) {
    const query = this.submissionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.exam', 'e')
      .innerJoinAndSelect('s.student', 'u')
      .where('e.createdById = :teacherId', { teacherId })
      .andWhere('s.status != :status', { status: 'in_progress' });

    if (examId) {
      query.andWhere('s.examId = :examId', { examId });
    }

    query.orderBy('s.submittedAt', 'DESC');

    const submissions = await query.getMany();

    return submissions.map(s => ({
      submissionId: s.id,
      examTitle: s.exam.title,
      studentName: s.student.name,
      studentEmail: s.student.email,
      score: s.score,
      totalMarks: s.totalMarks,
      percentage: s.totalMarks > 0 ? Math.round((s.score / s.totalMarks) * 100 * 100) / 100 : 0,
      status: s.status,
      submittedAt: s.submittedAt?.toISOString(),
      startedAt: s.startedAt.toISOString(),
    }));
  }
}
