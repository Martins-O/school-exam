import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { AddStudentsDto } from './dto/add-students.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { AssignTeachersDto } from './dto/assign-teachers.dto';

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

  @Post(':id/students/bulk')
  async addStudents(@Param('id') id: string, @Body() dto: AddStudentsDto) {
    const result = await this.classesService.addStudents(id, dto.studentIds);
    return {
      message: `${result.enrolled} student(s) enrolled successfully`,
      enrolled: result.enrolled,
      errors: result.errors,
    };
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

  @Post(':id/teachers/bulk')
  async assignTeachers(@Param('id') id: string, @Body() dto: AssignTeachersDto) {
    const result = await this.classesService.assignTeachers(id, dto.teacherIds);
    return {
      message: `${result.assigned} advisor(s) assigned successfully`,
      assigned: result.assigned,
      errors: result.errors,
    };
  }

  @Delete(':id/teachers/:teacherId')
  async removeTeacher(@Param('id') id: string, @Param('teacherId') teacherId: string) {
    await this.classesService.removeTeacher(id, teacherId);
    return { message: 'Teacher removed from class successfully' };
  }
}
