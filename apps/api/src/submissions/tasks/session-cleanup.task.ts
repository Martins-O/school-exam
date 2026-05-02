import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Submission } from '../entities/submission.entity';
import { ExamSessionService } from '../exam-session.service';

@Injectable()
export class SessionCleanupTask {
  constructor(
    private readonly examSessionService: ExamSessionService,
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
  ) {}

  @Cron('0 * * * * *')
  async handleExpiredSessions() {
    const expiredSubmissions = await this.submissionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.exam', 'e')
      .where('s.status = :status', { status: 'in_progress' })
      .andWhere(`s.startedAt + (e.durationMinutes * interval '1 minute') < NOW()`)
      .getMany();

    for (const submission of expiredSubmissions) {
      await this.examSessionService.forceSubmit(
        submission,
        submission.exam,
        'timeout',
      );
    }
  }
}
