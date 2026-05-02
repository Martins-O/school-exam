import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ResultsService } from './results.service';

@Controller('results')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get('my')
  @Roles('student')
  async getMyResults(@Req() req) {
    return this.resultsService.getMyResults(req.user.id);
  }

  @Get(':submissionId')
  @Roles('student', 'super_admin', 'administrator', 'teacher', 'parent')
  async getResult(@Param('submissionId') submissionId: string, @Req() req) {
    return this.resultsService.getResult(submissionId, req.user);
  }
}

@Controller('admin/results')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'administrator')
export class AdminResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get()
  async getAllResults(@Req() req) {
    return this.resultsService.getAllResults(req.user);
  }

  @Get('exam/:examId')
  async getResultsByExam(@Param('examId') examId: string, @Req() req) {
    return this.resultsService.getResultsByExam(examId, req.user);
  }
}
