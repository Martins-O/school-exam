import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { ExamsService } from './exams.service';
import { Exam } from './entities/exam.entity';
import { Question } from '../questions/entities/question.entity';
import { Class } from '../classes/entities/class.entity';
import { TeacherClass } from '../classes/entities/teacher-class.entity';

describe('ExamsService', () => {
  let service: ExamsService;
  let examRepo: any;
  let questionRepo: any;

  const mockAdmin = { id: 'admin-1', role: 'administrator' };
  const mockTeacher = { id: 'teacher-1', role: 'teacher' };
  const mockOtherTeacher = { id: 'teacher-2', role: 'teacher' };

  function createMockExam(overrides: any = {}) {
    return {
      id: overrides.id ?? 'exam-1',
      title: overrides.title ?? 'Test Exam',
      description: null,
      durationMinutes: 30,
      startTime: null,
      endTime: null,
      isPublished: overrides.isPublished ?? false,
      maxViolations: 3,
      createdBy: overrides.createdBy ?? mockAdmin,
      targetClasses: overrides.targetClasses ?? [],
      save: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  function createQueryBuilderMock(options: { getCount?: number; getMany?: any[]; getOne?: any }) {
    const qb: any = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      loadRelationCountAndMap: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getCount: jest.fn().mockResolvedValue(options.getCount ?? 0),
      getMany: jest.fn().mockResolvedValue(options.getMany ?? []),
      getOne: jest.fn().mockResolvedValue(options.getOne ?? null),
    };
    return qb;
  }

  beforeEach(async () => {
    examRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    questionRepo = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        { provide: getRepositoryToken(Exam), useValue: examRepo },
        { provide: getRepositoryToken(Question), useValue: questionRepo },
        { provide: getRepositoryToken(Class), useValue: {} },
        { provide: getRepositoryToken(TeacherClass), useValue: { find: jest.fn() } },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
  });

  describe('findOne', () => {
    it('returns exam when found', async () => {
      const mockExam = createMockExam();
      examRepo.findOne.mockResolvedValue(mockExam);

      const result = await service.findOne('exam-1');
      expect(result.id).toBe('exam-1');
    });

    it('throws NotFoundException when not found', async () => {
      examRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish', () => {
    it('publishes exam when questions exist', async () => {
      const mockExam = createMockExam();
      examRepo.findOne.mockResolvedValue(mockExam);

      const qb = createQueryBuilderMock({ getCount: 3 });
      questionRepo.createQueryBuilder.mockReturnValue(qb);

      examRepo.save.mockResolvedValue({ ...mockExam, isPublished: true });

      const result = await service.publish('exam-1', mockAdmin);
      expect(result.isPublished).toBe(true);
    });

    it('throws BadRequestException when no questions', async () => {
      const mockExam = createMockExam();
      examRepo.findOne.mockResolvedValue(mockExam);

      const qb = createQueryBuilderMock({ getCount: 0 });
      questionRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.publish('exam-1', mockAdmin)).rejects.toThrow(BadRequestException);
    });

    it('throws ForbiddenException when teacher tries to publish anothers exam', async () => {
      const mockExam = createMockExam({ createdBy: mockOtherTeacher });
      examRepo.findOne.mockResolvedValue(mockExam);

      await expect(service.publish('exam-1', mockTeacher)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('allows teacher to update own exam', async () => {
      const mockExam = createMockExam({ createdBy: mockTeacher });
      examRepo.findOne.mockResolvedValue(mockExam);
      examRepo.save.mockImplementation(e => Promise.resolve(e));

      const result = await service.update('exam-1', { title: 'Updated' }, mockTeacher);
      expect(result.title).toBe('Updated');
    });

    it('blocks teacher from updating another teacher exam', async () => {
      const mockExam = createMockExam({ createdBy: mockOtherTeacher });
      examRepo.findOne.mockResolvedValue(mockExam);

      await expect(
        service.update('exam-1', { title: 'Hacked' }, mockTeacher),
      ).rejects.toThrow(ForbiddenException);
    });

    it('allows admin to update any exam', async () => {
      const mockExam = createMockExam({ createdBy: mockOtherTeacher });
      examRepo.findOne.mockResolvedValue(mockExam);
      examRepo.save.mockImplementation(e => Promise.resolve(e));

      const result = await service.update('exam-1', { title: 'Admin Updated' }, mockAdmin);
      expect(result.title).toBe('Admin Updated');
    });
  });

  describe('remove', () => {
    it('allows teacher to delete own exam', async () => {
      const mockExam = createMockExam({ createdBy: mockTeacher });
      examRepo.findOne.mockResolvedValue(mockExam);

      await service.remove('exam-1', mockTeacher);
      expect(examRepo.remove).toHaveBeenCalledWith(mockExam);
    });

    it('blocks teacher from deleting another teacher exam', async () => {
      const mockExam = createMockExam({ createdBy: mockOtherTeacher });
      examRepo.findOne.mockResolvedValue(mockExam);

      await expect(service.remove('exam-1', mockTeacher)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('returns all exams for admin', async () => {
      const exams = [createMockExam({ id: '1' }), createMockExam({ id: '2' })];
      examRepo.find.mockResolvedValue(exams);

      const result = await service.findAll(mockAdmin);
      expect(result).toHaveLength(2);
    });

    it('returns only own exams for teacher', async () => {
      const exam = createMockExam({ id: '1', createdBy: mockTeacher });
      examRepo.find.mockResolvedValue([exam]);

      const result = await service.findAll(mockTeacher);
      expect(result).toHaveLength(1);
      expect(examRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { createdBy: { id: 'teacher-1' } },
        }),
      );
    });
  });

  describe('create', () => {
    it('creates exam with basic fields', async () => {
      const dto = { title: 'New Exam', durationMinutes: 60 };
      const created = createMockExam({ id: 'new-1', title: 'New Exam', durationMinutes: 60, createdBy: mockAdmin });
      examRepo.create.mockReturnValue(created);
      examRepo.save.mockResolvedValue(created);

      const result = await service.create(dto as any, mockAdmin);
      expect(result.title).toBe('New Exam');
      expect(result.durationMinutes).toBe(60);
    });

    it('throws NotFoundException for non-existent target classes', async () => {
      const dto = { title: 'New Exam', durationMinutes: 60, targetClassIds: ['bad-id'] };
      const created = createMockExam();
      examRepo.create.mockReturnValue(created);

      const classRepo = { find: jest.fn().mockResolvedValue([]), findBy: jest.fn().mockResolvedValue([]) };

      (service as any).classRepository = classRepo;

      await expect(service.create(dto as any, mockAdmin)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByTeacher', () => {
    it('returns exams filtered by teacher', async () => {
      const qb = createQueryBuilderMock({
        getMany: [createMockExam({ id: '1', createdBy: mockTeacher })],
      });
      examRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findByTeacher('teacher-1');
      expect(result).toHaveLength(1);
    });
  });
});
