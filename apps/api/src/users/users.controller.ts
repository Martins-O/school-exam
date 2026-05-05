import { Controller, Post, Body, Get, Patch, Param, UseGuards, Request, ForbiddenException, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { ClassesService } from '../classes/classes.service';
import { ParentsService } from '../parents/parents.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly classesService: ClassesService,
    private readonly parentsService: ParentsService,
  ) {}

  @Post()
  @Roles('super_admin', 'administrator')
  async createUser(@Request() req, @Body() createUserDto: CreateUserDto) {
    const allowedRoles: string[] = ['super_admin', 'administrator', 'teacher', 'student', 'parent'];

    if (!allowedRoles.includes(createUserDto.role)) {
      throw new ForbiddenException('Invalid role specified');
    }

    if (createUserDto.role === 'super_admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenException('Only super admins can create super admin accounts');
    }

    if (createUserDto.role === 'student') {
      if (!createUserDto.classIds || createUserDto.classIds.length === 0) {
        throw new ForbiddenException('Students must be assigned to a class');
      }
      if (createUserDto.classIds.length > 1) {
        throw new ForbiddenException('Students can only be assigned to one class');
      }
    }

    if (createUserDto.role === 'parent') {
      const hasExisting = createUserDto.studentIds && createUserDto.studentIds.length > 0;
      const hasNew = createUserDto.newStudents && createUserDto.newStudents.length > 0;
      if (!hasExisting && !hasNew) {
        throw new ForbiddenException('Parents must be linked to at least one student');
      }
    }

    const user = await this.usersService.createByAdmin(req.user.id, {
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
      role: createUserDto.role,
    });

    if (createUserDto.role === 'student' && createUserDto.classIds && createUserDto.classIds.length > 0) {
      await this.classesService.addStudent(createUserDto.classIds[0], user.id);
    }

    if (createUserDto.role === 'teacher' && createUserDto.classIds) {
      for (const classId of createUserDto.classIds) {
        try {
          await this.classesService.assignTeacher(classId, user.id);
        } catch {
          // skip
        }
      }
    }

    if (createUserDto.role === 'parent') {
      if (createUserDto.studentIds) {
        for (const studentId of createUserDto.studentIds) {
          try {
            await this.parentsService.linkStudent(user.id, studentId);
          } catch {
            // skip
          }
        }
      }

      if (createUserDto.newStudents) {
        for (const studentData of createUserDto.newStudents) {
          try {
            const newStudent = await this.usersService.createByAdmin(req.user.id, {
              name: studentData.name,
              email: studentData.email,
              password: studentData.password,
              role: 'student',
            });

            if (createUserDto.classIds && createUserDto.classIds.length > 0) {
              await this.classesService.addStudent(createUserDto.classIds[0], newStudent.id);
            }

            await this.parentsService.linkStudent(user.id, newStudent.id);
          } catch {
            // skip
          }
        }
      }
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }

  @Get()
  @Roles('super_admin', 'administrator')
  async getUsers(@Query('role') role?: string) {
    const users = await this.usersService.findAll(role);
    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));
  }

  @Get('me')
  @Roles('super_admin', 'administrator', 'teacher', 'student', 'parent')
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Patch(':id')
  @Roles('super_admin')
  async updateUser(@Param('id') id: string, @Body() data: { name?: string; email?: string; isActive?: boolean }) {
    const user = await this.usersService.update(id, data);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };
  }

  @Patch(':id/toggle-status')
  @Roles('super_admin')
  async toggleUserStatus(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    const updated = await this.usersService.update(id, { isActive: !user.isActive });
    return {
      id: updated.id,
      name: updated.name,
      isActive: updated.isActive,
    };
  }

  @Patch(':id/assign-classes')
  @Roles('super_admin')
  async assignClasses(@Param('id') id: string, @Body() data: { classIds: string[] }) {
    const user = await this.usersService.findById(id);

    if (user.role === 'student') {
      if (!data.classIds || data.classIds.length === 0) {
        return { message: 'No classes provided' };
      }
      if (data.classIds.length > 1) {
        throw new ForbiddenException('Students can only be assigned to one class');
      }
      await this.classesService.addStudent(data.classIds[0], id);
    }

    if (user.role === 'teacher') {
      for (const classId of data.classIds) {
        try {
          await this.classesService.assignTeacher(classId, id);
        } catch {}
      }
    }

    return { message: 'Classes assigned successfully' };
  }

  @Patch(':id/link-students')
  @Roles('super_admin')
  async linkStudents(@Param('id') id: string, @Body() data: { studentIds: string[] }) {
    const user = await this.usersService.findById(id);

    if (user.role !== 'parent') {
      throw new ForbiddenException('Only parents can have students linked');
    }

    for (const studentId of data.studentIds) {
      try {
        await this.parentsService.linkStudent(id, studentId);
      } catch {}
    }

    return { message: 'Students linked successfully' };
  }
}
