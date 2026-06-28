import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { QuestionsService } from './questions.service';
import { Question } from './entities/question.entity';
import { Exam } from '../exams/entities/exam.entity';
import { QuestionCategory } from '../categories/entities/question-category.entity';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

describe('QuestionsService', () => {
  let service: QuestionsService;
  let questionRepo: any;
  let examRepo: any;
  let categoryRepo: any;
  let cloudinaryService: any;

  const mockTeacher = { id: 'teacher-1', role: 'teacher' };
  const mockOtherTeacher = { id: 'teacher-2', role: 'teacher' };

  function mockExam(overrides: any = {}) {
    return {
      id: overrides.id ?? 'exam-1',
      title: 'Test Exam',
      createdBy: overrides.createdBy ?? mockTeacher,
      ...overrides,
    };
  }

  function mockQuestion(overrides: any = {}) {
    return {
      id: overrides.id ?? 'q-1',
      questionText: overrides.questionText ?? 'Test question?',
      type: overrides.type ?? 'objective',
      options: overrides.options ?? { A: 'Opt A', B: 'Opt B', C: 'Opt C', D: 'Opt D' },
      correctAnswer: overrides.correctAnswer ?? 'A',
      marks: overrides.marks ?? 1,
      exam: overrides.exam ?? mockExam(),
      categories: overrides.categories ?? [],
      pdfAttachment: overrides.pdfAttachment ?? null,
      save: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    };
  }

  beforeEach(async () => {
    questionRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    examRepo = {
      findOne: jest.fn(),
    };

    categoryRepo = {
      findBy: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    cloudinaryService = {
      deleteFile: jest.fn().mockResolvedValue(undefined),
      uploadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuestionsService,
        { provide: getRepositoryToken(Question), useValue: questionRepo },
        { provide: getRepositoryToken(Exam), useValue: examRepo },
        { provide: getRepositoryToken(QuestionCategory), useValue: categoryRepo },
        { provide: CloudinaryService, useValue: cloudinaryService },
      ],
    }).compile();

    service = module.get<QuestionsService>(QuestionsService);
  });

  describe('findAll', () => {
    it('returns questions for an exam', async () => {
      const questions = [mockQuestion({ id: 'q1' }), mockQuestion({ id: 'q2' })];
      questionRepo.find.mockResolvedValue(questions);

      const result = await service.findAll('exam-1');
      expect(result).toHaveLength(2);
      expect(questionRepo.find).toHaveBeenCalledWith({
        where: { exam: { id: 'exam-1' } },
        relations: ['categories'],
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('returns question when found', async () => {
      const question = mockQuestion();
      questionRepo.findOne.mockResolvedValue(question);

      const result = await service.findOne('exam-1', 'q-1');
      expect(result.id).toBe('q-1');
    });

    it('throws NotFoundException when not found', async () => {
      questionRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('exam-1', 'bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates an objective question', async () => {
      const exam = mockExam();
      examRepo.findOne.mockResolvedValue(exam);

      const dto = {
        questionText: 'New question?',
        type: 'objective',
        options: { A: 'a', B: 'b', C: 'c', D: 'd' },
        correctAnswer: 'B',
        marks: 2,
      };

      const created = mockQuestion({ questionText: 'New question?', correctAnswer: 'B', marks: 2 });
      questionRepo.create.mockReturnValue(created);
      questionRepo.save.mockResolvedValue(created);

      const result = await service.create('exam-1', dto as any, mockTeacher);
      expect(result.questionText).toBe('New question?');
      expect(result.marks).toBe(2);
    });

    it('creates a theory question with no options/answer', async () => {
      const exam = mockExam();
      examRepo.findOne.mockResolvedValue(exam);

      const dto = {
        questionText: 'Explain something',
        type: 'theory',
        marks: 5,
      };

      const created = mockQuestion({
        questionText: 'Explain something',
        type: 'theory',
        options: null,
        correctAnswer: null,
        marks: 5,
      });
      questionRepo.create.mockReturnValue(created);
      questionRepo.save.mockResolvedValue(created);

      const result = await service.create('exam-1', dto as any, mockTeacher);
      expect(result.type).toBe('theory');
      expect(result.options).toBeNull();
      expect(result.correctAnswer).toBeNull();
    });

    it('throws NotFoundException when exam does not exist', async () => {
      examRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create('bad-id', { questionText: '?' } as any, mockTeacher),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when teacher does not own exam', async () => {
      const exam = mockExam({ createdBy: mockOtherTeacher });
      examRepo.findOne.mockResolvedValue(exam);

      await expect(
        service.create('exam-1', { questionText: '?' } as any, mockTeacher),
      ).rejects.toThrow(ForbiddenException);
    });

    it('associates categories when provided', async () => {
      const exam = mockExam();
      examRepo.findOne.mockResolvedValue(exam);

      const categories = [{ id: 'cat-1', name: 'Algebra' }];
      categoryRepo.findBy.mockResolvedValue(categories);

      const dto = {
        questionText: 'New question?',
        correctAnswer: 'A',
        options: { A: 'a', B: 'b', C: 'c', D: 'd' },
        categoryIds: ['cat-1'],
      };

      const created = mockQuestion({ categories });
      questionRepo.create.mockReturnValue(created);
      questionRepo.save.mockResolvedValue(created);

      const result = await service.create('exam-1', dto as any, mockTeacher);
      expect(result.categories).toEqual(categories);
    });
  });

  describe('update', () => {
    it('updates question fields', async () => {
      const question = mockQuestion();
      questionRepo.findOne.mockResolvedValue(question);
      categoryRepo.findBy.mockResolvedValue([]);
      questionRepo.save.mockImplementation(e => Promise.resolve(e));

      const result = await service.update('q-1', { questionText: 'Updated?' } as any, mockTeacher);
      expect(result.questionText).toBe('Updated?');
    });

    it('allows admin to update any question', async () => {
      const question = mockQuestion({ exam: mockExam({ createdBy: mockOtherTeacher }) });
      questionRepo.findOne.mockResolvedValue(question);
      questionRepo.save.mockImplementation(e => Promise.resolve(e));

      const result = await service.update('q-1', { questionText: 'Admin update' } as any, { id: 'admin-1', role: 'administrator' });
      expect(result.questionText).toBe('Admin update');
    });

    it('throws ForbiddenException when teacher updates anothers question', async () => {
      const question = mockQuestion({ exam: mockExam({ createdBy: mockOtherTeacher }) });
      questionRepo.findOne.mockResolvedValue(question);

      await expect(
        service.update('q-1', { questionText: 'Hacked' } as any, mockTeacher),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when question not found', async () => {
      questionRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('bad-id', { questionText: '?' } as any, mockTeacher),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes a question', async () => {
      const question = mockQuestion();
      questionRepo.findOne.mockResolvedValue(question);

      await service.remove('exam-1', 'q-1', mockTeacher);
      expect(questionRepo.remove).toHaveBeenCalledWith(question);
    });

    it('cleans up pdfAttachment on cloudinary when present', async () => {
      const question = mockQuestion({ pdfAttachment: 'https://res.cloudinary.com/demo/image/upload/v1/cbt-exams/pdfs/somefile.pdf' });
      questionRepo.findOne.mockResolvedValue(question);

      await service.remove('exam-1', 'q-1', mockTeacher);
      expect(cloudinaryService.deleteFile).toHaveBeenCalledWith('somefile');
    });

    it('throws ForbiddenException when teacher deletes anothers question', async () => {
      const question = mockQuestion({ exam: mockExam({ createdBy: mockOtherTeacher }) });
      questionRepo.findOne.mockResolvedValue(question);

      await expect(service.remove('exam-1', 'q-1', mockTeacher)).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when question not found', async () => {
      questionRepo.findOne.mockResolvedValue(null);

      await expect(service.remove('exam-1', 'bad-id', mockTeacher)).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkImport', () => {
    it('imports questions successfully', async () => {
      const exam = mockExam();
      examRepo.findOne.mockResolvedValue(exam);
      questionRepo.save.mockResolvedValue({});

      const questions = [
        { questionText: 'Q1?', correctAnswer: 'A', options: { A: 'a', B: 'b' } },
        { questionText: 'Q2?', correctAnswer: 'B', options: { A: 'a', B: 'b' } },
      ];

      const result = await service.bulkImport('exam-1', questions as any, mockTeacher);
      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('reports failures per question', async () => {
      const exam = mockExam();
      examRepo.findOne.mockResolvedValue(exam);

      const question = { questionText: 'Q1?', correctAnswer: 'A', options: { A: 'a', B: 'b' } };
      questionRepo.save.mockRejectedValueOnce(new Error('DB error'));

      const result = await service.bulkImport('exam-1', [question], mockTeacher);
      expect(result.failed).toBe(1);
      expect(result.errors[0]).toContain('DB error');
    });

    it('throws ForbiddenException for unauthorized teacher', async () => {
      const exam = mockExam({ createdBy: mockOtherTeacher });
      examRepo.findOne.mockResolvedValue(exam);

      await expect(
        service.bulkImport('exam-1', [], mockTeacher),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when exam missing', async () => {
      examRepo.findOne.mockResolvedValue(null);

      await expect(service.bulkImport('bad-id', [], mockTeacher)).rejects.toThrow(NotFoundException);
    });
  });
});
