import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(data: {
    name: string;
    email: string;
    password: string;
    role?: 'super_admin' | 'administrator' | 'teacher' | 'student' | 'parent';
    createdById?: string;
  }): Promise<User> {
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = this.userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'student',
      createdById: data.createdById,
    });

    return this.userRepository.save(user);
  }

  async createByAdmin(adminId: string, data: {
    name: string;
    email: string;
    password: string;
    role: 'super_admin' | 'administrator' | 'teacher' | 'student' | 'parent';
  }): Promise<User> {
    return this.create({
      ...data,
      createdById: adminId,
    });
  }

  async findAll(role?: string): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user');
    if (role) {
      query.where('user.role = :role', { role });
    }
    return query.getMany();
  }
}
