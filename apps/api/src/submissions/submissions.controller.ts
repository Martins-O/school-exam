import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ExamSessionService } from './exam-session.service';
import { AutosaveDto } from './dto/autosave.dto';
import { SubmitDto } from './dto/submit.dto';
import { ViolationDto } from './dto/violation.dto';

@Controller('submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('student')
export class SubmissionsController {
  constructor(private readonly examSessionService: ExamSessionService) {}

  @Post('start/:examId')
  async start(@Param('examId') examId: string, @Req() req) {
    return this.examSessionService.startExam(examId, req.user);
  }

  @Patch(':id/autosave')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async autosave(
    @Param('id') id: string,
    @Req() req,
    @Body() dto: AutosaveDto,
  ) {
    return this.examSessionService.autosave(id, req.user.id, dto);
  }

  @Post(':id/submit')
  async submit(
    @Param('id') id: string,
    @Req() req,
    @Body() dto: SubmitDto,
  ) {
    return this.examSessionService.submit(id, req.user.id, dto);
  }

  @Post(':id/violation')
  async reportViolation(
    @Param('id') id: string,
    @Req() req,
    @Body() dto: ViolationDto,
  ) {
    return this.examSessionService.reportViolation(id, req.user.id, dto);
  }
}
