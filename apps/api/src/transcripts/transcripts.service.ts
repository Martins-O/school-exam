import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transcript } from './entities/transcript.entity';
import { Submission } from '../submissions/entities/submission.entity';
import { User } from '../users/entities/user.entity';
import { GenerateTranscriptDto } from './dto/generate-transcript.dto';

@Injectable()
export class TranscriptsService {
  constructor(
    @InjectRepository(Transcript)
    private readonly transcriptRepo: Repository<Transcript>,
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async generate(dto: GenerateTranscriptDto, adminUser: any): Promise<Transcript> {
    const student = await this.userRepo.findOne({ where: { id: dto.studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Build query for student's submissions
    const query = this.submissionRepo
      .createQueryBuilder('s')
      .innerJoinAndSelect('s.exam', 'e')
      .where('s.studentId = :studentId', { studentId: dto.studentId })
      .andWhere('s.status IN (:...statuses)', { statuses: ['submitted', 'timed_out', 'force_submitted'] });

    if (dto.periodStart) {
      query.andWhere('s.submittedAt >= :periodStart', { periodStart: new Date(dto.periodStart) });
    }
    if (dto.periodEnd) {
      query.andWhere('s.submittedAt <= :periodEnd', { periodEnd: new Date(dto.periodEnd) });
    }

    const submissions = await query.getMany();

    // Calculate results
    const results = submissions.map(s => ({
      submissionId: s.id,
      examTitle: s.exam.title,
      score: s.score,
      totalMarks: s.totalMarks,
      percentage: s.totalMarks > 0 ? (s.score / s.totalMarks) * 100 : 0,
      status: s.status,
      submittedAt: s.submittedAt?.toISOString(),
    }));

    // Calculate average
    const totalPercentage = results.reduce((sum, r) => sum + r.percentage, 0);
    const averageScore = results.length > 0 ? totalPercentage / results.length : 0;

    // Determine period dates
    const periodStart = dto.periodStart
      ? new Date(dto.periodStart)
      : submissions.length > 0
        ? new Date(Math.min(...submissions.map(s => s.submittedAt.getTime())))
        : new Date();

    const periodEnd = dto.periodEnd
      ? new Date(dto.periodEnd)
      : submissions.length > 0
        ? new Date(Math.max(...submissions.map(s => s.submittedAt.getTime())))
        : new Date();

    const transcript = this.transcriptRepo.create({
      student,
      studentId: dto.studentId,
      generatedBy: adminUser,
      generatedById: adminUser.id,
      periodStart,
      periodEnd,
      results,
      averageScore,
      comments: dto.comments,
      isFinalized: false,
    });

    return this.transcriptRepo.save(transcript);
  }

  async findByStudent(studentId: string, requestingUser: any): Promise<Transcript[]> {
    // Students can only view their own transcripts
    if (requestingUser.role === 'student' && requestingUser.id !== studentId) {
      throw new ForbiddenException('Not authorized');
    }

    // Parents can only view transcripts for linked students
    if (requestingUser.role === 'parent') {
      const isLinked = await this.transcriptRepo.manager
        .createQueryBuilder()
        .select('1')
        .from('parent_students', 'ps')
        .where('ps.parentId = :parentId', { parentId: requestingUser.id })
        .andWhere('ps.studentId = :studentId', { studentId })
        .andWhere('ps.isActive = true')
        .getRawOne();

      if (!isLinked) {
        throw new ForbiddenException('Not linked to this student');
      }
    }

    return this.transcriptRepo.find({
      where: { studentId },
      relations: ['student', 'generatedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, requestingUser: any): Promise<Transcript> {
    const transcript = await this.transcriptRepo.findOne({
      where: { id },
      relations: ['student', 'generatedBy'],
    });

    if (!transcript) {
      throw new NotFoundException('Transcript not found');
    }

    // Students can only view their own transcripts
    if (requestingUser.role === 'student' && transcript.studentId !== requestingUser.id) {
      throw new ForbiddenException('Not authorized');
    }

    // Parents can only view transcripts for linked students
    if (requestingUser.role === 'parent') {
      const isLinked = await this.transcriptRepo.manager
        .createQueryBuilder()
        .select('1')
        .from('parent_students', 'ps')
        .where('ps.parentId = :parentId', { parentId: requestingUser.id })
        .andWhere('ps.studentId = :studentId', { studentId: transcript.studentId })
        .andWhere('ps.isActive = true')
        .getRawOne();

      if (!isLinked) {
        throw new ForbiddenException('Not linked to this student');
      }
    }

    return transcript;
  }

  async finalize(id: string, adminUser: any): Promise<Transcript> {
    const transcript = await this.findOne(id, adminUser);
    transcript.isFinalized = true;
    return this.transcriptRepo.save(transcript);
  }
}
