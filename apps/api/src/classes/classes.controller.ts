import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';

@Controller('classes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin', 'administrator')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  async create(@Body() dto: CreateClassDto, @Req() req) {
    return this.classesService.create(dto, req.user);
  }

  @Get()
  async findAll() {
    return this.classesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Get(':id/students')
  async getStudents(@Param('id') id: string) {
    return this.classesService.getStudents(id);
  }

  @Post(':id/students')
  async addStudent(@Param('id') id: string, @Body() dto: AddStudentDto) {
    await this.classesService.addStudent(id, dto.studentId);
    return { message: 'Student added to class successfully' };
  }

  @Delete(':id/students/:studentId')
  async removeStudent(@Param('id') id: string, @Param('studentId') studentId: string) {
    await this.classesService.removeStudent(id, studentId);
    return { message: 'Student removed from class successfully' };
  }

  @Get(':id/teachers')
  async getTeachers(@Param('id') id: string) {
    return this.classesService.getTeachers(id);
  }

  @Post(':id/teachers')
  async assignTeacher(@Param('id') id: string, @Body() dto: AssignTeacherDto) {
    await this.classesService.assignTeacher(id, dto.teacherId);
    return { message: 'Teacher assigned to class successfully' };
  }

  @Delete(':id/teachers/:teacherId')
  async removeTeacher(@Param('id') id: string, @Param('teacherId') teacherId: string) {
    await this.classesService.removeTeacher(id, teacherId);
    return { message: 'Teacher removed from class successfully' };
  }
}
