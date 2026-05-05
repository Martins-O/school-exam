import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Submission } from './entities/submission.entity';
import { Question } from '../questions/entities/question.entity';
import { Exam } from '../exams/entities/exam.entity';
import { GraderService } from './grader.service';
import { TranscriptAutoUpdateService } from './transcript-auto-update.service';

@Injectable()
export class GradingService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,
    private readonly graderService: GraderService,
    private readonly transcriptAutoUpdateService: TranscriptAutoUpdateService,
  ) {}

  async getSubmissionForGrading(
    submissionId: string,
    requestingUser: any,
  ): Promise<any> {
    const submission = await this.submissionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.exam', 'e')
      .innerJoinAndSelect('s.student', 'u')
      .where('s.id = :id', { id: submissionId })
      .getOne();

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    // Only teachers (exam owner), admins, and super admins can grade
    if (requestingUser.role === 'teacher') {
      if (submission.exam.createdBy?.id !== requestingUser.id) {
        throw new ForbiddenException('You can only grade submissions for your own exams');
      }
    } else if (!['super_admin', 'administrator'].includes(requestingUser.role)) {
      throw new ForbiddenException('Not authorized to grade submissions');
    }

    const questions = await this.questionRepo.find({
      where: { id: In(submission.questionOrder), type: 'theory' },
      select: ['id', 'questionText', 'maxWordCount', 'passageText'],
    });

    const questionMap = new Map(questions.map(q => [q.id, q]));
    const theoryQuestions = submission.questionOrder
      .filter(qId => questionMap.has(qId))
      .map(qId => ({
        id: qId,
        ...questionMap.get(qId),
        studentAnswer: submission.answers[qId] || '',
        currentScore: submission.questionScores?.[qId]?.score ?? null,
        currentFeedback: submission.questionScores?.[qId]?.feedback ?? '',
      }));

    return {
      submissionId: submission.id,
      examTitle: submission.exam.title,
      studentName: submission.student.name,
      studentEmail: submission.student.email,
      status: submission.status,
      gradingStatus: submission.gradingStatus,
      score: submission.score,
      totalMarks: submission.totalMarks,
      finalScore: submission.finalScore,
      theoryQuestions,
    };
  }

  async gradeQuestion(
    submissionId: string,
    questionId: string,
    dto: { score: number; feedback?: string },
    graderId: string,
    graderName: string,
  ): Promise<any> {
    const submission = await this.submissionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.exam', 'e')
      .innerJoinAndSelect('s.student', 'u')
      .where('s.id = :id', { id: submissionId })
      .getOne();

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (!['submitted', 'timed_out', 'force_submitted'].includes(submission.status)) {
      throw new BadRequestException('Submission is not yet complete');
    }

    if (submission.gradingStatus === 'auto_graded') {
      throw new BadRequestException('This submission has no theory questions to grade');
    }

    const question = await this.questionRepo.findOne({
      where: { id: questionId, exam: { id: submission.exam.id }, type: 'theory' },
    });

    if (!question) {
      throw new NotFoundException('Theory question not found in this exam');
    }

    if (dto.score > question.marks) {
      throw new BadRequestException(`Score cannot exceed question marks (${question.marks})`);
    }

    if (!submission.questionScores) {
      submission.questionScores = {};
    }

    submission.questionScores[questionId] = {
      score: dto.score,
      feedback: dto.feedback || '',
      gradedBy: graderId,
      gradedAt: new Date().toISOString(),
    };

    const theoryQuestionIds = submission.questionOrder.filter(qId =>
      submission.questionScores[qId] !== undefined ||
      (submission.questionScores[qId] && submission.questionScores[qId].gradedAt !== '')
    );

    const allTheoryGraded = this.graderService.isFullyGraded(
      submission.questionScores,
      submission.questionOrder.filter(qId => {
        return true;
      }),
    );

    const finalScore = this.graderService.calculateFinalScore(
      submission.score,
      submission.questionScores,
      Object.keys(submission.questionScores),
    );

    if (allTheoryGraded) {
      submission.gradingStatus = 'fully_graded';
      submission.finalScore = finalScore;
      submission.gradedAt = new Date();
      submission.gradingFeedback = `Graded by ${graderName}`;
    } else {
      submission.gradingStatus = 'pending_manual';
    }

    await this.submissionRepo.save(submission);

    if (allTheoryGraded) {
      this.transcriptAutoUpdateService.updateTranscriptAfterSubmission(submission.id).catch(err => {
        console.error('Failed to update transcript after manual grading:', err);
      });
    }

    return {
      questionId,
      score: dto.score,
      feedback: dto.feedback,
      gradingStatus: submission.gradingStatus,
      finalScore: allTheoryGraded ? finalScore : null,
      allTheoryGraded,
    };
  }

  async bulkGradeQuestions(
    submissionId: string,
    grades: Record<string, { score: number; feedback?: string }>,
    graderId: string,
    graderName: string,
  ): Promise<any> {
    const submission = await this.submissionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.exam', 'e')
      .where('s.id = :id', { id: submissionId })
      .getOne();

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (!['submitted', 'timed_out', 'force_submitted'].includes(submission.status)) {
      throw new BadRequestException('Submission is not yet complete');
    }

    if (!submission.questionScores) {
      submission.questionScores = {};
    }

    const questionMap = new Map<string, number>();
    const questions = await this.questionRepo.find({
      where: { id: In(Object.keys(grades)), type: 'theory' },
      select: ['id', 'marks'],
    });

    for (const q of questions) {
      questionMap.set(q.id, q.marks);
    }

    for (const [qId, grade] of Object.entries(grades)) {
      const maxMarks = questionMap.get(qId);
      if (!maxMarks) {
        throw new NotFoundException(`Theory question ${qId} not found`);
      }
      if (grade.score > maxMarks) {
        throw new BadRequestException(`Score for question ${qId} cannot exceed ${maxMarks}`);
      }

      submission.questionScores[qId] = {
        score: grade.score,
        feedback: grade.feedback || '',
        gradedBy: graderId,
        gradedAt: new Date().toISOString(),
      };
    }

    const allTheoryGraded = this.graderService.isFullyGraded(
      submission.questionScores,
      Object.keys(submission.questionScores),
    );

    const finalScore = this.graderService.calculateFinalScore(
      submission.score,
      submission.questionScores,
      Object.keys(submission.questionScores),
    );

    if (allTheoryGraded) {
      submission.gradingStatus = 'fully_graded';
      submission.finalScore = finalScore;
      submission.gradedAt = new Date();
      submission.gradingFeedback = `Graded by ${graderName}`;
    } else {
      submission.gradingStatus = 'pending_manual';
    }

    await this.submissionRepo.save(submission);

    if (allTheoryGraded) {
      this.transcriptAutoUpdateService.updateTranscriptAfterSubmission(submission.id).catch(err => {
        console.error('Failed to update transcript after manual grading:', err);
      });
    }

    return {
      gradedCount: Object.keys(grades).length,
      gradingStatus: submission.gradingStatus,
      finalScore: allTheoryGraded ? finalScore : null,
      allTheoryGraded,
    };
  }

  async getPendingGrading(requestingUser: any): Promise<any[]> {
    const query = this.submissionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.exam', 'e')
      .innerJoinAndSelect('s.student', 'u')
      .where('s.gradingStatus = :status', { status: 'pending_manual' })
      .andWhere('s.status != :inProgress', { inProgress: 'in_progress' });

    if (requestingUser.role === 'teacher') {
      query.andWhere('e.createdById = :teacherId', { teacherId: requestingUser.id });
    }

    query.orderBy('s.submittedAt', 'ASC');

    const submissions = await query.getMany();

    return submissions.map(s => {
      const pendingCount = Object.values(s.questionScores || {}).filter(
        (qs: any) => !qs.gradedAt || qs.gradedAt === '',
      ).length;

      const totalCount = Object.keys(s.questionScores || {}).length;

      return {
        submissionId: s.id,
        examTitle: s.exam.title,
        studentName: s.student.name,
        studentEmail: s.student.email,
        score: s.score,
        totalMarks: s.totalMarks,
        pendingCount,
        totalCount,
        submittedAt: s.submittedAt?.toISOString(),
      };
    });
  }

  async getFullyGradedSubmissions(examId: string, requestingUser: any): Promise<any[]> {
    const query = this.submissionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.exam', 'e')
      .innerJoinAndSelect('s.student', 'u')
      .where('s.examId = :examId', { examId })
      .andWhere('s.gradingStatus = :status', { status: 'fully_graded' })
      .andWhere('s.status != :inProgress', { inProgress: 'in_progress' });

    if (requestingUser.role === 'teacher') {
      query.andWhere('e.createdById = :teacherId', { teacherId: requestingUser.id });
    }

    query.orderBy('s.gradedAt', 'DESC');

    const submissions = await query.getMany();

    return submissions.map(s => ({
      submissionId: s.id,
      examTitle: s.exam.title,
      studentName: s.student.name,
      studentEmail: s.student.email,
      score: s.score,
      totalMarks: s.totalMarks,
      finalScore: s.finalScore,
      percentage: s.totalMarks > 0 ? ((s.finalScore || s.score) / s.totalMarks) * 100 : 0,
      gradedAt: s.gradedAt?.toISOString(),
      submittedAt: s.submittedAt?.toISOString(),
    }));
  }
}
