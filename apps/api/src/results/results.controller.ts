import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ResultsService } from './results.service';

@Controller('results')
@UseGuards(JwtAuthGuard)
export class ResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles('student')
  async getMyResults(@Req() req) {
    return this.resultsService.getMyResults(req.user.id);
  }

  @Get(':submissionId')
  async getResult(@Param('submissionId') submissionId: string, @Req() req) {
    return this.resultsService.getResult(submissionId, req.user);
  }
}

@Controller('admin/results')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminResultsController {
  constructor(private readonly resultsService: ResultsService) {}

  @Get()
  async getAllResults() {
    return this.resultsService.getAllResults();
  }

  @Get('exam/:examId')
  async getResultsByExam(@Param('examId') examId: string) {
    return this.resultsService.getResultsByExam(examId);
  }
}
