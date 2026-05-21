import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import pdfParse = require('pdf-parse');
import * as csvParser from 'csv-parser';
import { Question } from './entities/question.entity';
import { Exam } from '../exams/entities/exam.entity';
import { QuestionCategory } from '../categories/entities/question-category.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Exam)
    private readonly examRepository: Repository<Exam>,
    @InjectRepository(QuestionCategory)
    private readonly categoryRepository: Repository<QuestionCategory>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findAll(examId: string): Promise<Question[]> {
    return this.questionRepository.find({
      where: { exam: { id: examId } },
      relations: ['categories'],
      order: { createdAt: 'ASC' },
    });
  }

  async create(examId: string, dto: CreateQuestionDto, user?: any): Promise<Question> {
    const exam = await this.examRepository.findOne({
      where: { id: examId },
      relations: ['createdBy'],
    });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (user && user.role === 'teacher' && exam.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only add questions to your own exams');
    }

    let categories: QuestionCategory[] = [];
    if (dto.categoryIds && dto.categoryIds.length > 0) {
      categories = await this.categoryRepository.findBy({ id: In(dto.categoryIds) });
    }

    const question = this.questionRepository.create({
      exam,
      questionText: dto.questionText,
      type: dto.type || 'objective',
      options: dto.type === 'theory' ? null : (dto.options || {}),
      correctAnswer: dto.type === 'theory' ? null : dto.correctAnswer,
      marks: dto.marks ?? 1,
      categories,
    });

    return this.questionRepository.save(question);
  }

  async findOne(examId: string, id: string): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id, exam: { id: examId } },
      relations: ['exam', 'exam.createdBy', 'categories'],
    });
    if (!question) {
      throw new NotFoundException('Question not found');
    }
    return question;
  }

  async update(id: string, dto: UpdateQuestionDto, user?: any): Promise<Question> {
    const question = await this.questionRepository.findOne({
      where: { id },
      relations: ['exam', 'exam.createdBy', 'categories'],
    });
    if (!question) throw new NotFoundException('Question not found');
    if (user && user.role === 'teacher' && question.exam.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only modify your own questions');
    }

    Object.assign(question, dto);
    if (dto.categoryIds) {
      const categories = await this.categoryRepository.findBy({ id: In(dto.categoryIds) });
      question.categories = categories;
    }

    if (dto.questionText) question.questionText = dto.questionText;
    if (dto.type) question.type = dto.type;
    if (dto.options !== undefined) question.options = dto.options;
    if (dto.correctAnswer !== undefined) question.correctAnswer = dto.correctAnswer;
    if (dto.marks) question.marks = dto.marks;
    if (dto.pdfAttachment !== undefined) question.pdfAttachment = dto.pdfAttachment;
    if (dto.maxWordCount !== undefined) question.maxWordCount = dto.maxWordCount;
    if (dto.passageText !== undefined) question.passageText = dto.passageText;

    return this.questionRepository.save(question);
  }

  async remove(examId: string, id: string, user?: any): Promise<void> {
    const question = await this.findOne(examId, id);

    if (user && user.role === 'teacher' && question.exam.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only delete questions from your own exams');
    }

    if (question.pdfAttachment) {
      try {
        const publicId = question.pdfAttachment.split('/').pop()?.split('.')[0];
        if (publicId) {
          await this.cloudinaryService.deleteFile(publicId);
        }
      } catch {
        // ignore cleanup errors
      }
    }

    await this.questionRepository.remove(question);
  }

  async bulkImport(examId: string, questions: CreateQuestionDto[], user?: any): Promise<{ success: number; failed: number; errors: string[] }> {
    const exam = await this.examRepository.findOne({
      where: { id: examId },
      relations: ['createdBy'],
    });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (user && user.role === 'teacher' && exam.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only add questions to your own exams');
    }

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < questions.length; i++) {
      try {
        const dto = questions[i];

        if (!dto.questionText) {
          throw new BadRequestException('Missing required field: questionText');
        }

        if (dto.type !== 'theory' && !dto.correctAnswer) {
          throw new BadRequestException('Objective questions require a correctAnswer');
        }

        let categories: QuestionCategory[] = [];
        if (dto.categoryIds && dto.categoryIds.length > 0) {
          categories = await this.categoryRepository.findBy({ id: In(dto.categoryIds) });
        }

        const question = this.questionRepository.create({
          questionText: dto.questionText,
          type: dto.type || 'objective',
          options: dto.type === 'theory' ? null : (dto.options || {}),
          correctAnswer: dto.type === 'theory' ? null : dto.correctAnswer,
          marks: dto.marks || 1,
          exam,
          categories,
          pdfAttachment: dto.pdfAttachment || null,
          maxWordCount: dto.maxWordCount || null,
          passageText: dto.passageText || null,
        });

        await this.questionRepository.save(question);
        success++;
      } catch (error) {
        failed++;
        errors.push(`Question ${i + 1}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  }

  async bulkImportFromCsv(examId: string, file: Express.Multer.File, user?: any): Promise<{ success: number; failed: number; errors: string[] }> {
    const exam = await this.examRepository.findOne({
      where: { id: examId },
      relations: ['createdBy'],
    });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (user && user.role === 'teacher' && exam.createdBy.id !== user.id) {
      throw new ForbiddenException('You can only add questions to your own exams');
    }

    const rows: Record<string, string>[] = await new Promise((resolve, reject) => {
      const results: Record<string, string>[] = [];
      csvParser()
        .on('data', (row) => results.push(row))
        .on('end', () => resolve(results))
        .on('error', reject)
        .end(file.buffer);
    });

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const type = (row.type || 'objective').trim().toLowerCase();

        if (!row.questionText || !row.questionText.trim()) {
          throw new BadRequestException('Missing questionText');
        }

        const options: Record<string, string> = {};
        if (type === 'objective') {
          if (row.option_A) options['A'] = row.option_A.trim();
          if (row.option_B) options['B'] = row.option_B.trim();
          if (row.option_C) options['C'] = row.option_C.trim();
          if (row.option_D) options['D'] = row.option_D.trim();
          if (row.option_E) options['E'] = row.option_E.trim();
          if (row.option_F) options['F'] = row.option_F.trim();
        }

        let categories: QuestionCategory[] = [];
        if (row.categories && row.categories.trim()) {
          const categoryNames = row.categories.split(',').map(c => c.trim()).filter(Boolean);
          for (const name of categoryNames) {
            let cat = await this.categoryRepository.findOne({ where: { name } });
            if (!cat) {
              cat = this.categoryRepository.create({
                name,
                createdById: exam.createdBy.id,
              });
              cat = await this.categoryRepository.save(cat);
            }
            categories.push(cat);
          }
        }

        const question = this.questionRepository.create({
          questionText: row.questionText.trim(),
          type: type === 'theory' ? 'theory' : 'objective',
          options: type === 'objective' && Object.keys(options).length > 0 ? options : null,
          correctAnswer: type === 'theory' ? null : (row.correctAnswer ? row.correctAnswer.trim().toUpperCase() : null),
          marks: row.marks ? parseInt(row.marks, 10) || 1 : 1,
          exam,
          categories,
          maxWordCount: row.maxWordCount ? parseInt(row.maxWordCount, 10) || null : null,
          passageText: row.passageText && row.passageText.trim() ? row.passageText.trim() : null,
        });

        if (type === 'objective' && !question.correctAnswer) {
          throw new BadRequestException('Objective questions require a correctAnswer');
        }

        await this.questionRepository.save(question);
        success++;
      } catch (error) {
        failed++;
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    return { success, failed, errors };
  }

  async extractPdfQuestions(examId: string, file: Express.Multer.File): Promise<{
    pdfUrl?: string;
    extractedQuestions: Array<{
      type: 'objective' | 'theory';
      questionText: string;
      options?: Record<string, string>;
      correctAnswer?: string;
      marks?: number;
      maxWordCount?: number;
      passageText?: string;
    }>;
  }> {
    const exam = await this.examRepository.findOne({ where: { id: examId } });
    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    let pdfUrl: string | null = null;
    try {
      const result = await this.cloudinaryService.uploadFile(file, 'cbt-exams/pdfs');
      pdfUrl = result.secure_url;
    } catch {
      // Cloudinary not configured — skip upload, still extract text
    }

    const pdfData = await pdfParse(file.buffer);
    const rawText = pdfData.text;

    const extractedQuestions = this.parseExtractedText(rawText);

    return { ...(pdfUrl ? { pdfUrl } : {}), extractedQuestions };
  }

  private parseExtractedText(text: string): Array<{
    type: 'objective' | 'theory';
    questionText: string;
    options?: Record<string, string>;
    correctAnswer?: string;
    marks?: number;
    maxWordCount?: number;
    passageText?: string;
  }> {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    type ExtractedQuestion = {
      type: 'objective' | 'theory';
      questionText: string;
      options?: Record<string, string>;
      correctAnswer?: string;
      marks?: number;
      maxWordCount?: number;
      passageText?: string;
    };

    const questions: ExtractedQuestion[] = [];

    let currentQuestion: ExtractedQuestion | null = null;
    const optionPattern = /^([A-F])[.)]\s+(.+)$/;
    const questionPattern = /^(\d+)[.)]\s+(.+)$/;

    for (const line of lines) {
      const questionMatch = line.match(questionPattern);
      const optionMatch = line.match(optionPattern);

      if (questionMatch) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }
        currentQuestion = {
          type: 'objective',
          questionText: questionMatch[2].trim(),
          options: {},
          marks: 1,
        };
      } else if (optionMatch && currentQuestion) {
        const key = optionMatch[1];
        const value = optionMatch[2].trim();
        if (currentQuestion.options) {
          currentQuestion.options[key] = value;
        }
      } else if (currentQuestion && currentQuestion.type === 'objective') {
        if (currentQuestion.options && Object.keys(currentQuestion.options).length >= 2) {
          currentQuestion = null;
        }
      }
    }

    if (currentQuestion) {
      if (currentQuestion.options && Object.keys(currentQuestion.options).length < 2) {
        currentQuestion.type = 'theory';
        currentQuestion.maxWordCount = 500;
        delete currentQuestion.options;
        delete currentQuestion.correctAnswer;
      }
      questions.push(currentQuestion);
    }

    if (questions.length === 0) {
      const cleanedText = text.replace(/\s+/g, ' ').trim();
      if (cleanedText.length > 0) {
        questions.push({
          type: 'theory',
          questionText: cleanedText.substring(0, 500),
          passageText: cleanedText.length > 500 ? cleanedText : null,
          maxWordCount: 1000,
          marks: 10,
        });
      }
    }

    return questions;
  }
}
