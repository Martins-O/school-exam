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

    if (requestingUser.role === 'student') {
      if (submission.student.id !== requestingUser.id) {
        throw new ForbiddenException('Not authorized');
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

    if (requestingUser.role === 'admin') {
      return {
        ...baseResult,
        answers: submission.answers,
        questionOrder: submission.questionOrder,
      };
    }

    return baseResult;
  }

  async getAllResults(): Promise<any[]> {
    const submissions = await this.submissionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.exam', 'e')
      .innerJoinAndSelect('s.student', 'u')
      .andWhere('s.status != :status', { status: 'in_progress' })
      .orderBy('s.submittedAt', 'DESC')
      .getMany();

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

  async getResultsByExam(examId: string): Promise<any[]> {
    const submissions = await this.submissionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.exam', 'e')
      .innerJoinAndSelect('s.student', 'u')
      .where('s.examId = :examId', { examId })
      .andWhere('s.status != :status', { status: 'in_progress' })
      .orderBy('s.submittedAt', 'DESC')
      .getMany();

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
