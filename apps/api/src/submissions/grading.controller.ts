import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { GradingService } from './grading.service';
import { GradeQuestionDto } from './dto/grade-question.dto';

@Controller('admin/grading')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'administrator', 'teacher')
export class GradingController {
  constructor(private readonly gradingService: GradingService) {}

  @Get('pending')
  async getPendingGrading(@Req() req) {
    return this.gradingService.getPendingGrading(req.user);
  }

  @Get('exam/:examId/graded')
  async getGradedSubmissions(@Param('examId') examId: string, @Req() req) {
    return this.gradingService.getFullyGradedSubmissions(examId, req.user);
  }

  @Get(':submissionId')
  async getSubmissionForGrading(@Param('submissionId') submissionId: string, @Req() req) {
    return this.gradingService.getSubmissionForGrading(submissionId, req.user);
  }

  @Post(':submissionId/questions/:questionId/grade')
  async gradeQuestion(
    @Param('submissionId') submissionId: string,
    @Param('questionId') questionId: string,
    @Body() dto: GradeQuestionDto,
    @Req() req,
  ) {
    return this.gradingService.gradeQuestion(
      submissionId,
      questionId,
      dto,
      req.user.id,
      req.user.name,
    );
  }

  @Post(':submissionId/bulk-grade')
  async bulkGrade(
    @Param('submissionId') submissionId: string,
    @Body() dto: { grades: Record<string, { score: number; feedback?: string }> },
    @Req() req,
  ) {
    return this.gradingService.bulkGradeQuestions(
      submissionId,
      dto.grades,
      req.user.id,
      req.user.name,
    );
  }
}
