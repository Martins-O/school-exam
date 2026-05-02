import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, SerializeOptions, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { QuestionsService } from './questions.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

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
    return this.questionsService.update(examId, id, dto, req.user);
  }

  @Delete(':id')
  async remove(@Param('examId') examId: string, @Param('id') id: string, @Req() req) {
    await this.questionsService.remove(examId, id, req.user);
    return { message: 'Question deleted successfully' };
  }
}
