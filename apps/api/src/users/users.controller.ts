import { Controller, Post, Get, Body, UseGuards, Delete, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Get()
  async findAll() {
    return this.userRepository.find({
      order: { createdAt: 'DESC' },
      select: ['id', 'name', 'email', 'role', 'isActive', 'createdAt'],
    });
  }

  @Post()
  async create(@Body() body: any) {
    return this.usersService.create({
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.userRepository.delete(id);
    return { message: 'User deleted' };
  }
}
