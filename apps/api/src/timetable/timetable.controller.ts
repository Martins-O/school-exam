import {
  Controller, Get, Patch, Param, Body, UseGuards, Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TimetableService } from './timetable.service';

class UpdateScheduleDto {
  startTime: string | null;
  endTime: string | null;
}

@Controller('timetable')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get()
  @Roles('super_admin', 'administrator', 'teacher')
  async getTimetable(@Req() req) {
    return this.timetableService.getTimetable(req.user);
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
