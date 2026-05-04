import { Controller, Post, Get, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ParentsService } from './parents.service';
import { LinkStudentDto } from './dto/link-student.dto';

@Controller('parent')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post('link-student')
  @Roles('super_admin', 'administrator')
  async linkStudent(@Body() dto: LinkStudentDto, @Req() req) {
    // Admins can link any parent to any student
    // The admin user is acting on behalf of the system
    await this.parentsService.linkStudent(dto.studentId, req.user.id);
    return { message: 'Parent linked to student successfully' };
  }

  @Get('my-students')
  @Roles('parent')
  async getMyStudents(@Req() req) {
    return this.parentsService.getMyStudents(req.user.id);
  }

  @Delete('unlink/:studentId')
  @Roles('super_admin', 'administrator')
  async unlinkStudent(@Param('studentId') studentId: string, @Req() req) {
    await this.parentsService.unlinkStudent(req.user.id, studentId);
    return { message: 'Parent unlinked from student successfully' };
  }
}
