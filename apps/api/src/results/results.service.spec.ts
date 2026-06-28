import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ResultsService } from './results.service';
import { Submission } from '../submissions/entities/submission.entity';

function mockQueryBuilder(overrides: any = {}) {
  return {
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(overrides.getMany ?? []),
    getOne: jest.fn().mockResolvedValue(overrides.getOne ?? null),
    getRawOne: jest.fn().mockResolvedValue(overrides.getRawOne ?? null),
  };
}

function mockSubmission(overrides: any = {}) {
  return {
    id: overrides.id ?? 'sub-1',
    exam: overrides.exam ?? { id: 'exam-1', title: 'Test Exam', createdBy: overrides.examCreatedBy ?? { id: 'teacher-1' } },
    student: overrides.student ?? { id: 'student-1', name: 'Alice', email: 'alice@test.com' },
    score: overrides.score ?? 8,
    totalMarks: overrides.totalMarks ?? 10,
    status: overrides.status ?? 'submitted',
    gradingStatus: overrides.gradingStatus ?? 'auto_graded',
    finalScore: overrides.finalScore ?? null,
    answers: overrides.answers ?? { q1: 'A' },
    questionOrder: overrides.questionOrder ?? ['q1'],
    violations: overrides.violations ?? 0,
    autoSubmitted: overrides.autoSubmitted ?? false,
    startedAt: new Date('2025-01-01T10:00:00Z'),
    submittedAt: new Date('2025-01-01T11:00:00Z'),
    ...overrides,
  };
}

describe('ResultsService', () => {
  let service: ResultsService;
  let submissionRepo: any;

  const studentUser = { id: 'student-1', role: 'student' };
  const otherStudentUser = { id: 'student-2', role: 'student' };
  const teacherUser = { id: 'teacher-1', role: 'teacher' };
  const otherTeacherUser = { id: 'teacher-2', role: 'teacher' };
  const adminUser = { id: 'admin-1', role: 'administrator' };
  const parentUser = { id: 'parent-1', role: 'parent' };

  beforeEach(async () => {
    submissionRepo = {
      manager: {
        createQueryBuilder: jest.fn(),
      },
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResultsService,
        { provide: getRepositoryToken(Submission), useValue: submissionRepo },
      ],
    }).compile();

    service = module.get<ResultsService>(ResultsService);
  });

  describe('getMyResults', () => {
    it('returns only completed submissions for the student', async () => {
      const qb = mockQueryBuilder({
        getMany: [mockSubmission({ id: 'sub-1' }), mockSubmission({ id: 'sub-2' })],
      });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getMyResults('student-1');
      expect(result).toHaveLength(2);
      expect(qb.andWhere).toHaveBeenCalledWith('s.status != :status', { status: 'in_progress' });
      expect(result[0]).toHaveProperty('submissionId');
      expect(result[0]).toHaveProperty('examTitle');
      expect(result[0]).toHaveProperty('score');
    });

    it('returns empty array when no submissions', async () => {
      const qb = mockQueryBuilder({ getMany: [] });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getMyResults('student-none');
      expect(result).toEqual([]);
    });

    it('calculates percentage correctly', async () => {
      const qb = mockQueryBuilder({
        getMany: [mockSubmission({ score: 7, totalMarks: 10 })],
      });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getMyResults('student-1');
      expect(result[0].percentage).toBe(70);
    });
  });

  describe('getResult', () => {
    it('allows student to see own result', async () => {
      const qb = mockQueryBuilder({
        getOne: mockSubmission(),
      });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getResult('sub-1', studentUser);
      expect(result.submissionId).toBe('sub-1');
    });

    it('blocks student from seeing another students result', async () => {
      const qb = mockQueryBuilder({
        getOne: mockSubmission(),
      });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.getResult('sub-1', otherStudentUser)).rejects.toThrow(ForbiddenException);
    });

    it('allows teacher to see own exam result', async () => {
      const qb = mockQueryBuilder({
        getOne: mockSubmission({ exam: { id: 'exam-1', title: 'Test', createdBy: { id: 'teacher-1' } } }),
      });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getResult('sub-1', teacherUser);
      expect(result.submissionId).toBe('sub-1');
    });

    it('blocks teacher from seeing another teachers exam result', async () => {
      const qb = mockQueryBuilder({
        getOne: mockSubmission({ exam: { id: 'exam-1', title: 'Test', createdBy: { id: 'teacher-1' } } }),
      });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.getResult('sub-1', otherTeacherUser)).rejects.toThrow(ForbiddenException);
    });

    it('allows parent to see linked student result', async () => {
      const qb = mockQueryBuilder({
        getOne: mockSubmission(),
      });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      const linkQb = mockQueryBuilder({ getRawOne: { '1': 1 } });
      submissionRepo.manager.createQueryBuilder.mockReturnValue(linkQb);

      const result = await service.getResult('sub-1', parentUser);
      expect(result.submissionId).toBe('sub-1');
    });

    it('blocks parent from seeing unlinked student result', async () => {
      const qb = mockQueryBuilder({
        getOne: mockSubmission(),
      });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      const linkQb = mockQueryBuilder({ getRawOne: null });
      submissionRepo.manager.createQueryBuilder.mockReturnValue(linkQb);

      await expect(service.getResult('sub-1', parentUser)).rejects.toThrow(ForbiddenException);
    });

    it('returns admin full details with answers and question order', async () => {
      const qb = mockQueryBuilder({
        getOne: mockSubmission(),
      });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getResult('sub-1', adminUser);
      expect(result.answers).toBeDefined();
      expect(result.questionOrder).toBeDefined();
    });

    it('throws NotFoundException when submission missing', async () => {
      const qb = mockQueryBuilder({ getOne: null });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.getResult('bad-id', adminUser)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAllResults', () => {
    it('returns all results for admin', async () => {
      const qb = mockQueryBuilder({
        getMany: [mockSubmission({ id: 's1' }), mockSubmission({ id: 's2' })],
      });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getAllResults(adminUser);
      expect(result).toHaveLength(2);
    });

    it('filters by teacher owner', async () => {
      const qb = mockQueryBuilder({
        getMany: [mockSubmission({ id: 's1' })],
      });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getAllResults(teacherUser);
      expect(result).toHaveLength(1);
      expect(qb.andWhere).toHaveBeenCalledWith('e.createdById = :teacherId', { teacherId: 'teacher-1' });
    });

    it('excludes in_progress submissions', async () => {
      const qb = mockQueryBuilder({ getMany: [] });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getAllResults(adminUser);
      expect(qb.andWhere).toHaveBeenCalledWith('s.status != :status', { status: 'in_progress' });
    });
  });

  describe('getResultsByExam', () => {
    it('filters by exam id', async () => {
      const qb = mockQueryBuilder({
        getMany: [mockSubmission()],
      });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getResultsByExam('exam-1', adminUser);
      expect(result).toHaveLength(1);
      expect(qb.where).toHaveBeenCalledWith('s.examId = :examId', { examId: 'exam-1' });
    });

    it('filters by teacher owner', async () => {
      const qb = mockQueryBuilder({
        getMany: [mockSubmission()],
      });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      await service.getResultsByExam('exam-1', teacherUser);
      expect(qb.andWhere).toHaveBeenCalledWith('e.createdById = :teacherId', { teacherId: 'teacher-1' });
    });
  });

  describe('getResultsByStudent', () => {
    it('returns results for admin', async () => {
      const qb = mockQueryBuilder({
        getMany: [mockSubmission()],
      });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getResultsByStudent('student-1', adminUser);
      expect(result).toHaveLength(1);
    });

    it('allows parent of linked student', async () => {
      const linkQb = mockQueryBuilder({ getRawOne: { '1': 1 } });
      submissionRepo.manager.createQueryBuilder.mockReturnValue(linkQb);

      const qb = mockQueryBuilder({
        getMany: [mockSubmission()],
      });
      submissionRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getResultsByStudent('student-1', parentUser);
      expect(result).toHaveLength(1);
    });

    it('blocks parent of unlinked student', async () => {
      const linkQb = mockQueryBuilder({ getRawOne: null });
      submissionRepo.manager.createQueryBuilder.mockReturnValue(linkQb);

      await expect(
        service.getResultsByStudent('student-1', parentUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
