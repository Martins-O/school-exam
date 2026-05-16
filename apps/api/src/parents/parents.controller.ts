import { Controller, Post, Get, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ParentsService } from './parents.service';
import { ResultsService } from '../results/results.service';
import { TranscriptsService } from '../transcripts/transcripts.service';
import { LinkStudentDto } from './dto/link-student.dto';

@Controller('parent')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParentsController {
  constructor(
    private readonly parentsService: ParentsService,
    private readonly resultsService: ResultsService,
    private readonly transcriptsService: TranscriptsService,
  ) {}

  @Post('link-student')
  @Roles('super_admin', 'administrator')
  async linkStudent(@Body() dto: LinkStudentDto) {
    await this.parentsService.linkStudent(dto.parentId, dto.studentId);
    return { message: 'Parent linked to student successfully' };
  }

  @Get('my-students')
  @Roles('parent')
  async getMyStudents(@Req() req) {
    return this.parentsService.getMyStudents(req.user.id);
  }

  @Get('student/:studentId/results')
  @Roles('parent')
  async getStudentResults(@Param('studentId') studentId: string, @Req() req) {
    return this.resultsService.getResultsByStudent(studentId, req.user);
  }

  @Get('student/:studentId/transcripts')
  @Roles('parent')
  async getStudentTranscripts(@Param('studentId') studentId: string, @Req() req) {
    return this.transcriptsService.findByStudent(studentId, req.user);
  }

  @Delete('unlink/:studentId')
  @Roles('super_admin', 'administrator')
  async unlinkStudent(@Param('studentId') studentId: string, @Req() req) {
    await this.parentsService.unlinkStudent(req.user.id, studentId);
    return { message: 'Parent unlinked from student successfully' };
  }
}
