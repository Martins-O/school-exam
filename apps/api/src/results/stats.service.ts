import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Exam } from '../exams/entities/exam.entity';
import { Submission } from '../submissions/entities/submission.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
  ) {}

  async getAdminStats() {
    const [totalStudents, totalExams, totalSubmissions, activeExams] = await Promise.all([
      this.userRepo.count({ where: { role: 'student', isActive: true } }),
      this.examRepo.count(),
      this.submissionRepo.count(),
      this.submissionRepo.count({ where: { status: 'in_progress' } }),
    ]);

    return { totalStudents, totalExams, totalSubmissions, activeExams };
  }
}
