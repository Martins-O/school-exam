import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  SerializeOptions,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { BulkImportDto } from './dto/bulk-import.dto';

function csvFileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
) {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Only CSV files are allowed'), false);
  }
}

function pdfFileFilter(
  _req: any,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
) {
  if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Only PDF files are allowed'), false);
  }
}

@Controller('exams/:examId/questions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'administrator', 'teacher')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Post()
  @SerializeOptions({ groups: ['admin'] })
  async create(@Param('examId') examId: string, @Body() dto: CreateQuestionDto, @Req() req) {
    return this.questionsService.create(examId, dto, req.user);
  }

  @Get()
  @SerializeOptions({ groups: ['admin'] })
  async findAll(@Param('examId') examId: string) {
    return this.questionsService.findAll(examId);
  }

  @Patch(':id')
  @SerializeOptions({ groups: ['admin'] })
  async update(
    @Param('examId') examId: string,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
    @Req() req,
  ) {
    return this.questionsService.update(id, dto, req.user);
  }

  @Delete(':id')
  async remove(@Param('examId') examId: string, @Param('id') id: string, @Req() req) {
    await this.questionsService.remove(examId, id, req.user);
    return { message: 'Question deleted successfully' };
  }

  @Post('bulk-import')
  @SerializeOptions({ groups: ['admin'] })
  async bulkImport(
    @Param('examId') examId: string,
    @Body() dto: BulkImportDto,
    @Req() req,
  ) {
    return this.questionsService.bulkImport(examId, dto.questions, req.user);
  }

  @Post('bulk-import-csv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: csvFileFilter,
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  @SerializeOptions({ groups: ['admin'] })
  async bulkImportCsv(
    @Param('examId') examId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    if (!file) {
      throw new BadRequestException('No CSV file provided');
    }
    return this.questionsService.bulkImportFromCsv(examId, file, req.user);
  }

  @Post('extract-pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: pdfFileFilter,
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  )
  async extractPdf(
    @Param('examId') examId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No PDF file provided');
    }
    return this.questionsService.extractPdfQuestions(examId, file);
  }
}
