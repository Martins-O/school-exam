import { Controller, Get, UseGuards, Req, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TeacherService } from './teacher.service';
import { ExamsService } from '../exams/exams.service';

@Controller('teacher')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')
export class TeacherController {
  constructor(
    private readonly teacherService: TeacherService,
    private readonly examsService: ExamsService,
  ) {}

  @Get('stats')
  async getStats(@Req() req) {
    return this.teacherService.getStats(req.user.id);
  }

  @Get('exams')
  async getExams(@Req() req, @Query('classId') classId?: string) {
    return this.examsService.findByTeacher(req.user.id, classId);
  }

  @Get('results')
  async getResults(@Req() req, @Query('examId') examId?: string) {
    return this.teacherService.getResults(req.user.id, examId);
  }

  @Get('classes')
  async getClasses(@Req() req) {
    return this.teacherService.getClasses(req.user.id);
  }
}
