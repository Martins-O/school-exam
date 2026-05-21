import {
  Controller, Get, Post, Patch, Param, Query, Body, UseGuards, Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TimetableService } from './timetable.service';

@Controller('timetable')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get()
  @Roles('super_admin', 'administrator', 'teacher')
  async getTimetable(@Req() req, @Query('classId') classId?: string) {
    return this.timetableService.getTimetable(req.user, classId);
  }

  @Post()
  @Roles('super_admin', 'administrator', 'teacher')
  async scheduleExam(@Body() body: any, @Req() req) {
    const startTime = new Date(body.startTime);
    const endTime = body.endTime ? new Date(body.endTime) : null;
    return this.timetableService.scheduleExam(
      body.examId,
      body.classId,
      startTime,
      endTime,
      req.user,
    );
  }

  @Get('student')
  @Roles('student')
  async getStudentTimetable(@Req() req) {
    return this.timetableService.getStudentTimetable(req.user.id);
  }

  @Patch(':examId')
  @Roles('super_admin', 'administrator', 'teacher')
  async updateSchedule(
    @Param('examId') examId: string,
    @Body() body: any,
    @Req() req,
  ) {
    const startTime = body.startTime ? new Date(body.startTime) : null;
    const endTime = body.endTime ? new Date(body.endTime) : null;
    return this.timetableService.updateSchedule(examId, startTime, endTime, req.user);
  }
}
