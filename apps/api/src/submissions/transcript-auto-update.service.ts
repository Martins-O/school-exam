import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transcript } from '../transcripts/entities/transcript.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { User } from '../users/entities/user.entity';
import { Exam } from '../exams/entities/exam.entity';

@Injectable()
export class TranscriptAutoUpdateService {
  constructor(
    @InjectRepository(Transcript)
    private readonly transcriptRepo: Repository<Transcript>,
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,
  ) {}

  /**
   * Called after an exam submission is graded.
   * Creates or updates an active (non-finalized) transcript for the student.
   */
  async updateTranscriptAfterSubmission(submissionId: string): Promise<void> {
    // Fetch the submission with exam and student details
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['student', 'exam'],
    });

    if (!submission || !submission.submittedAt) {
      return;
    }

    // Find or create an active (non-finalized) transcript for this student
    // If there's an active transcript, update it with the new result
    // If not, create a new one

    let transcript = await this.transcriptRepo.findOne({
      where: {
        studentId: submission.student.id,
        isFinalized: false,
      },
    });

    if (!transcript) {
      transcript = this.transcriptRepo.create({
        student: submission.student,
        studentId: submission.student.id,
        periodStart: submission.startedAt,
        periodEnd: submission.submittedAt,
        results: [],
        averageScore: 0,
        isFinalized: false,
      });
    } else {
      if (submission.startedAt < transcript.periodStart) {
        transcript.periodStart = submission.startedAt;
      }
      if (submission.submittedAt > transcript.periodEnd) {
        transcript.periodEnd = submission.submittedAt;
      }
    }

    const submissions = await this.submissionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.exam', 'e')
      .where('s.studentId = :studentId', { studentId: submission.student.id })
      .andWhere('s.submittedAt >= :periodStart', { periodStart: transcript.periodStart })
      .andWhere('s.submittedAt <= :periodEnd', { periodEnd: transcript.periodEnd })
      .andWhere('s.status IN (:...statuses)', { statuses: ['submitted', 'timed_out', 'force_submitted'] })
      .orderBy('s.submittedAt', 'ASC')
      .getMany();

    // Build results array
    transcript.results = submissions.map(s => ({
      submissionId: s.id,
      examTitle: s.exam.title,
      score: s.score,
      totalMarks: s.totalMarks,
      percentage: s.totalMarks > 0 ? (s.score / s.totalMarks) * 100 : 0,
      status: s.status,
      submittedAt: s.submittedAt?.toISOString(),
    }));

    // Calculate average score
    const totalPercentage = transcript.results.reduce((sum, r) => sum + r.percentage, 0);
    transcript.averageScore = transcript.results.length > 0 ? totalPercentage / transcript.results.length : 0;

    await this.transcriptRepo.save(transcript);
  }
}
