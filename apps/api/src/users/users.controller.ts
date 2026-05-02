import { Controller, Post, Body, Get, UseGuards, Request, ForbiddenException, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('super_admin', 'administrator')
  async createUser(@Request() req, @Body() createUserDto: CreateUserDto) {
    const allowedRoles: string[] = ['super_admin', 'administrator', 'teacher', 'student', 'parent'];

    if (!allowedRoles.includes(createUserDto.role)) {
      throw new ForbiddenException('Invalid role specified');
    }

    // Only super_admin can create super_admin accounts
    if (createUserDto.role === 'super_admin' && req.user.role !== 'super_admin') {
      throw new ForbiddenException('Only super admins can create super admin accounts');
    }

    const user = await this.usersService.createByAdmin(req.user.id, {
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
      role: createUserDto.role,
    });

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
}
