import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { AssignClassesDto } from './dto/assign-classes.dto';

@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'administrator', 'teacher')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Post()
  async create(@Body() dto: CreateExamDto, @Req() req) {
    return this.examsService.create(dto, req.user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateExamDto, @Req() req) {
    return this.examsService.update(id, dto, req.user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req) {
    await this.examsService.remove(id, req.user);
    return { message: 'Exam deleted successfully' };
  }

  @Get()
  async findAll() {
    return this.examsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Patch(':id/publish')
  async publish(@Param('id') id: string) {
    return this.examsService.publish(id);
  }

  @Patch(':id/classes')
  async assignClasses(@Param('id') id: string, @Body() dto: AssignClassesDto, @Req() req) {
    await this.examsService.assignClasses(id, dto.classIds, req.user);
    return { message: 'Classes assigned to exam successfully' };
  }
}
