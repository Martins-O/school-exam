import {
  Controller, Get, Post, Patch, Param, Query, Body, UseGuards, Req,
} from '@nestjs/common';
import { IsString, IsOptional, IsDateString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TimetableService } from './timetable.service';

class ScheduleExamDto {
  @IsString()
  examId: string;

  @IsString()
  classId: string;

  @IsDateString()
  startTime: string;

  @IsOptional()
  @IsDateString()
  endTime?: string | null;
}

class UpdateScheduleDto {
  @IsOptional()
  @IsDateString()
  startTime?: string | null;

  @IsOptional()
  @IsDateString()
  endTime?: string | null;
}

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
  async scheduleExam(@Body() dto: ScheduleExamDto, @Req() req) {
    const startTime = new Date(dto.startTime);
    const endTime = dto.endTime ? new Date(dto.endTime) : null;
    return this.timetableService.scheduleExam(
      dto.examId,
      dto.classId,
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
    @Body() dto: UpdateScheduleDto,
    @Req() req,
  ) {
    const startTime = dto.startTime ? new Date(dto.startTime) : null;
    const endTime = dto.endTime ? new Date(dto.endTime) : null;
    return this.timetableService.updateSchedule(examId, startTime, endTime, req.user);
  }
}
