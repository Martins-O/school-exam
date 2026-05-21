import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ResultsService } from './results.service';
import { StatsService } from './stats.service';

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
  constructor(
    private readonly resultsService: ResultsService,
    private readonly statsService: StatsService,
  ) {}

  @Get()
  async getAllResults(@Req() req) {
    return this.resultsService.getAllResults(req.user);
  }

  @Get('exam/:examId')
  @Roles('super_admin', 'administrator', 'teacher')
  async getResultsByExam(@Param('examId') examId: string, @Req() req) {
    return this.resultsService.getResultsByExam(examId, req.user);
  }

  @Get('stats')
  @Roles('super_admin', 'administrator')
  async getStats(@Req() req) {
    return this.statsService.getAdminStats();
  }
}
