import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryRunner, In } from 'typeorm';
import { Submission } from './entities/submission.entity';
import { Exam } from '../exams/entities/exam.entity';
import { Question } from '../questions/entities/question.entity';
import { User } from '../users/entities/user.entity';
import { ClassStudent } from '../classes/entities/class-student.entity';
import { RandomizerService } from './randomizer.service';
import { GraderService } from './grader.service';
import { ExamGateway } from '../gateway/exam.gateway';
import { TranscriptAutoUpdateService } from './transcript-auto-update.service';

@Injectable()
export class ExamSessionService {
  constructor(
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(Exam)
    private readonly examRepo: Repository<Exam>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,
    private readonly randomizerService: RandomizerService,
    private readonly graderService: GraderService,
    private readonly examGateway: ExamGateway,
    private readonly transcriptAutoUpdateService: TranscriptAutoUpdateService,
  ) {}

  getRemainingSeconds(submission: Submission, exam: Exam): number {
    const examEndTime = new Date(
      submission.startedAt.getTime() + exam.durationMinutes * 60 * 1000,
    );
    const remaining = Math.floor(
      (examEndTime.getTime() - Date.now()) / 1000,
    );
    return Math.max(0, remaining);
  }

  async startExam(examId: string, student: User): Promise<any> {
    const exam = await this.examRepo.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (!exam.isPublished) {
      throw new ForbiddenException('Exam is not published');
    }

    const now = new Date();
    if (exam.startTime && exam.startTime > now) {
      throw new ForbiddenException('Exam is not available yet');
    }
    if (exam.endTime && exam.endTime < now) {
      throw new ForbiddenException('Exam has ended');
    }

    // Verify student is in exam's target class (if exam has target classes)
    const studentClasses = await this.classStudentRepo.find({
      where: { studentId: student.id },
      relations: ['class'],
    });
    const studentClassIds = new Set(studentClasses.map(sc => sc.classId));

    if (studentClassIds.size > 0) {
      const examWithClasses = await this.examRepo.findOne({
        where: { id: examId },
        relations: ['targetClasses'],
      });

      if (examWithClasses && examWithClasses.targetClasses && examWithClasses.targetClasses.length > 0) {
        const examClassIds = examWithClasses.targetClasses.map(tc => tc.id);
        const isEnrolled = examClassIds.some(id => studentClassIds.has(id));
        
        if (!isEnrolled) {
          throw new ForbiddenException('You are not enrolled in any class assigned to this exam');
        }
      }
    }

    const existing = await this.submissionRepo.findOne({
      where: {
        student: { id: student.id },
        exam: { id: examId },
        status: 'in_progress',
      },
    });

    if (existing) {
      const questions = await this.questionRepo.find({
        where: { exam: { id: examId } },
        select: ['id', 'questionText', 'options', 'marks', 'type', 'maxWordCount', 'passageText'],
      });

      const questionMap = new Map(questions.map(q => [q.id, q]));
      const orderedQuestions = existing.questionOrder
        .map(id => questionMap.get(id))
        .filter(q => q !== undefined);

      return {
        submissionId: existing.id,
        examTitle: exam.title,
        durationMinutes: exam.durationMinutes,
        startedAt: existing.startedAt.toISOString(),
        remainingSeconds: this.getRemainingSeconds(existing, exam),
        questions: orderedQuestions.map(q => ({
          id: q.id,
          questionText: q.questionText,
          options: q.options,
          marks: q.marks,
          type: q.type,
          maxWordCount: q.maxWordCount,
          passageText: q.passageText,
        })),
        maxViolations: exam.maxViolations,
      };
    }

    const activeSubmission = await this.submissionRepo.findOne({
      where: [
        { student: { id: student.id }, exam: { id: examId }, status: 'submitted' },
        { student: { id: student.id }, exam: { id: examId }, status: 'timed_out' },
        { student: { id: student.id }, exam: { id: examId }, status: 'force_submitted' },
      ],
    });

    if (activeSubmission) {
      throw new ConflictException({
        message: 'Exam already started',
        submissionId: activeSubmission.id,
      });
    }

    const questions = await this.questionRepo.find({
      where: { exam: { id: examId } },
      select: ['id', 'questionText', 'options', 'marks', 'type', 'maxWordCount', 'passageText'],
    });

    const questionOrder = this.randomizerService.shuffleQuestions(questions);

    const queryRunner =
      this.submissionRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const submission = new Submission();
      submission.student = student as any;
      submission.exam = exam as any;
      submission.questionOrder = questionOrder;
      submission.answers = {};
      submission.flaggedQuestions = [];
      submission.status = 'in_progress';
      submission.startedAt = new Date();
      submission.violations = 0;
      submission.autoSubmitted = false;

      const saved = await queryRunner.manager.save(submission);

      await queryRunner.commitTransaction();

      return {
        submissionId: saved.id,
        examTitle: exam.title,
        durationMinutes: exam.durationMinutes,
        startedAt: saved.startedAt.toISOString(),
        remainingSeconds: exam.durationMinutes * 60,
        questions: questions
          .sort((a, b) => questionOrder.indexOf(a.id) - questionOrder.indexOf(b.id))
          .map(q => ({
            id: q.id,
            questionText: q.questionText,
            options: q.options,
            marks: q.marks,
            type: q.type,
            maxWordCount: q.maxWordCount,
            passageText: q.passageText,
          })),
        maxViolations: exam.maxViolations,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async autosave(
    submissionId: string,
    studentId: string,
    dto: { answers?: Record<string, string>; flaggedQuestions?: string[] },
  ): Promise<any> {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['student', 'exam'],
    });

    if (!submission || submission.student.id !== studentId) {
      throw new ForbiddenException('Not authorized');
    }

    if (submission.status !== 'in_progress') {
      throw new ConflictException({
        message: 'Exam already closed',
        status: submission.status,
      });
    }

    const remainingSeconds = this.getRemainingSeconds(
      submission,
      submission.exam,
    );

    if (remainingSeconds <= 0) {
      const result = await this.forceSubmit(
        submission,
        submission.exam,
        'timeout',
      );
      return {
        status: 'timed_out',
        score: result.score,
        totalMarks: result.totalMarks,
      };
    }

    if (dto.answers) {
      submission.answers = { ...submission.answers, ...dto.answers };
    }
    if (dto.flaggedQuestions) {
      submission.flaggedQuestions = dto.flaggedQuestions;
    }

    await this.submissionRepo.save(submission);

    return {
      remainingSeconds,
      savedAt: new Date().toISOString(),
    };
  }

  async submit(
    submissionId: string,
    studentId: string,
    dto: { answers: Record<string, string>; flaggedQuestions?: string[] },
  ): Promise<any> {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['student', 'exam'],
    });

    if (!submission || submission.student.id !== studentId) {
      throw new ForbiddenException('Not authorized');
    }

    if (submission.status !== 'in_progress') {
      throw new ConflictException({
        message: 'Exam already closed',
        status: submission.status,
      });
    }

    submission.answers = { ...submission.answers, ...dto.answers };
    if (dto.flaggedQuestions) {
      submission.flaggedQuestions = dto.flaggedQuestions;
    }

    const questions = await this.questionRepo.find({
      where: { exam: { id: submission.exam.id } },
    });

    const gradingResult = this.graderService.grade(
      submission.questionOrder,
      submission.answers,
      questions,
    );

    const hasTheoryQuestions = gradingResult.theoryQuestionIds.length > 0;
    const gradingStatus = hasTheoryQuestions ? 'pending_manual' : 'auto_graded';

    const questionScores: Record<string, { score: number; feedback: string; gradedBy: string; gradedAt: string }> = {};
    for (const qId of gradingResult.theoryQuestionIds) {
      questionScores[qId] = { score: 0, feedback: '', gradedBy: '', gradedAt: '' };
    }

    let finalScore: number | null = null;
    if (!hasTheoryQuestions) {
      finalScore = gradingResult.score;
    }

    const result = await this.submissionRepo
      .createQueryBuilder()
      .update(Submission)
      .set({
        status: 'submitted',
        submittedAt: new Date(),
        score: gradingResult.score,
        totalMarks: gradingResult.totalMarks,
        answers: submission.answers,
        flaggedQuestions: submission.flaggedQuestions,
        gradingStatus,
        questionScores,
        finalScore,
      })
      .where('id = :id AND status = :status', {
        id: submission.id,
        status: 'in_progress',
      })
      .execute();

    if (result.affected === 0) {
      return this.submissionRepo.findOne({ where: { id: submission.id } });
    }

    this.examGateway.emitSubmission(submission.exam.id, {
      submissionId: submission.id,
      studentName: submission.student.name,
      score: gradingResult.score,
      totalMarks: gradingResult.totalMarks,
      gradingStatus,
      submittedAt: new Date().toISOString(),
    });

    this.transcriptAutoUpdateService.updateTranscriptAfterSubmission(submission.id).catch(err => {
      console.error('Failed to update transcript after submission:', err);
    });

    return {
      score: gradingResult.score,
      totalMarks: gradingResult.totalMarks,
      percentage: gradingResult.totalMarks > 0 ? (gradingResult.score / gradingResult.totalMarks) * 100 : 0,
      submittedAt: new Date().toISOString(),
      gradingStatus,
      hasTheoryQuestions,
    };
  }

  async forceSubmit(
    submission: Submission,
    exam: Exam,
    reason: 'timeout' | 'violations',
  ): Promise<any> {
    if (submission.status !== 'in_progress') {
      return this.submissionRepo.findOne({ where: { id: submission.id } });
    }

    const questions = await this.questionRepo.find({
      where: { exam: { id: exam.id } },
    });

    const gradingResult = this.graderService.grade(
      submission.questionOrder,
      submission.answers,
      questions,
    );

    const hasTheoryQuestions = gradingResult.theoryQuestionIds.length > 0;
    const gradingStatus = hasTheoryQuestions ? 'pending_manual' : 'auto_graded';

    const questionScores: Record<string, { score: number; feedback: string; gradedBy: string; gradedAt: string }> = {};
    for (const qId of gradingResult.theoryQuestionIds) {
      questionScores[qId] = { score: 0, feedback: '', gradedBy: '', gradedAt: '' };
    }

    let finalScore: number | null = null;
    if (!hasTheoryQuestions) {
      finalScore = gradingResult.score;
    }

    const newStatus =
      reason === 'timeout' ? 'timed_out' : 'force_submitted';

    const result = await this.submissionRepo
      .createQueryBuilder()
      .update(Submission)
      .set({
        status: newStatus,
        submittedAt: new Date(),
        score: gradingResult.score,
        totalMarks: gradingResult.totalMarks,
        autoSubmitted: true,
        gradingStatus,
        questionScores,
        finalScore,
      })
      .where('id = :id AND status = :status', {
        id: submission.id,
        status: 'in_progress',
      })
      .execute();

    if (result.affected === 0) {
      return this.submissionRepo.findOne({ where: { id: submission.id } });
    }

    this.transcriptAutoUpdateService.updateTranscriptAfterSubmission(submission.id).catch(err => {
      console.error('Failed to update transcript after forced submission:', err);
    });

    return this.submissionRepo.findOne({ where: { id: submission.id } });
  }

  async reportViolation(
    submissionId: string,
    studentId: string,
    dto: { type: 'tab_switch' | 'fullscreen_exit' },
  ): Promise<any> {
    const submission = await this.submissionRepo.findOne({
      where: { id: submissionId },
      relations: ['student', 'exam'],
    });

    if (!submission || submission.student.id !== studentId) {
      throw new ForbiddenException('Not authorized');
    }

    if (submission.status !== 'in_progress') {
      throw new ConflictException({
        message: 'Exam already closed',
        status: submission.status,
      });
    }

    submission.violations += 1;
    await this.submissionRepo.save(submission);

    this.examGateway.emitViolation(submission.exam.id, {
      submissionId: submission.id,
      studentName: submission.student.name,
      type: dto.type,
      violations: submission.violations,
      autoSubmitted: submission.violations >= submission.exam.maxViolations,
    });

    if (submission.violations >= submission.exam.maxViolations) {
      const result = await this.forceSubmit(
        submission,
        submission.exam,
        'violations',
      );
      return {
        violations: submission.violations,
        maxViolations: submission.exam.maxViolations,
        autoSubmitted: true,
        score: result.score,
        totalMarks: result.totalMarks,
      };
    }

    return {
      violations: submission.violations,
      maxViolations: submission.exam.maxViolations,
      autoSubmitted: false,
    };
  }
}
