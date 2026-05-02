import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from '../submissions/entities/submission.entity';
import { Exam } from '../exams/entities/exam.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ResultsService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
  ) {}

  async getMyResults(studentId: string): Promise<any[]> {
    const submissions = await this.submissionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.exam', 'e')
      .where('s.studentId = :studentId', { studentId })
      .andWhere('s.status != :status', { status: 'in_progress' })
      .orderBy('s.submittedAt', 'DESC')
      .getMany();

    return submissions.map(s => ({
      submissionId: s.id,
      examTitle: s.exam.title,
      score: s.score,
      totalMarks: s.totalMarks,
      percentage: s.totalMarks > 0 ? (s.score / s.totalMarks) * 100 : 0,
      status: s.status,
      submittedAt: s.submittedAt?.toISOString(),
      startedAt: s.startedAt.toISOString(),
    }));
  }

  async getResult(submissionId: string, requestingUser: any): Promise<any> {
    const submission = await this.submissionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.exam', 'e')
      .innerJoinAndSelect('s.student', 'u')
      .where('s.id = :id', { id: submissionId })
      .getOne();

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Student can only view their own results
    if (requestingUser.role === 'student') {
      if (submission.student.id !== requestingUser.id) {
        throw new ForbiddenException('Not authorized');
      }
    }

    // Teacher can only view results for exams they created
    if (requestingUser.role === 'teacher') {
      if (submission.exam.createdBy?.id !== requestingUser.id) {
        throw new ForbiddenException('You can only view results for your own exams');
      }
    }

    // Parent can only view results for linked students
    if (requestingUser.role === 'parent') {
      const isLinked = await this.submissionRepo.manager
        .createQueryBuilder()
        .select('1')
        .from('parent_students', 'ps')
        .where('ps.parentId = :parentId', { parentId: requestingUser.id })
        .andWhere('ps.studentId = :studentId', { studentId: submission.student.id })
        .andWhere('ps.isActive = true')
        .getRawOne();

      if (!isLinked) {
        throw new ForbiddenException('Not linked to this student');
      }
    }

    const baseResult = {
      submissionId: submission.id,
      examTitle: submission.exam.title,
      studentName: submission.student.name,
      studentEmail: submission.student.email,
      score: submission.score,
      totalMarks: submission.totalMarks,
      percentage: submission.totalMarks > 0 ? (submission.score / submission.totalMarks) * 100 : 0,
      status: submission.status,
      startedAt: submission.startedAt.toISOString(),
      submittedAt: submission.submittedAt?.toISOString(),
      violations: submission.violations,
      autoSubmitted: submission.autoSubmitted,
    };

    // Admin and Super Admin can see full details
    if (['super_admin', 'administrator'].includes(requestingUser.role)) {
      return {
        ...baseResult,
        answers: submission.answers,
        questionOrder: submission.questionOrder,
      };
    }

    return baseResult;
  }

  async getAllResults(requestingUser?: any): Promise<any[]> {
    const query = this.submissionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.exam', 'e')
      .innerJoinAndSelect('s.student', 'u')
      .andWhere('s.status != :status', { status: 'in_progress' });

    // Teachers can only see results for exams they created
    if (requestingUser && requestingUser.role === 'teacher') {
      query.andWhere('e.createdById = :teacherId', { teacherId: requestingUser.id });
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
      percentage: s.totalMarks > 0 ? (s.score / s.totalMarks) * 100 : 0,
      status: s.status,
      submittedAt: s.submittedAt?.toISOString(),
      startedAt: s.startedAt.toISOString(),
    }));
  }

  async getResultsByExam(examId: string, requestingUser?: any): Promise<any[]> {
    const query = this.submissionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.exam', 'e')
      .innerJoinAndSelect('s.student', 'u')
      .where('s.examId = :examId', { examId })
      .andWhere('s.status != :status', { status: 'in_progress' });

    // Teachers can only see results for exams they created
    if (requestingUser && requestingUser.role === 'teacher') {
      query.andWhere('e.createdById = :teacherId', { teacherId: requestingUser.id });
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
      percentage: s.totalMarks > 0 ? (s.score / s.totalMarks) * 100 : 0,
      status: s.status,
      submittedAt: s.submittedAt?.toISOString(),
      startedAt: s.startedAt.toISOString(),
    }));
  }
}
