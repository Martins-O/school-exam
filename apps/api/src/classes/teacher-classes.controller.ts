import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ClassesService } from './classes.service';

@Controller('teacher/classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('teacher')
export class TeacherClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  async getMyClasses(@Req() req) {
    return this.classesService.getTeacherClasses(req.user.id);
  }
}
