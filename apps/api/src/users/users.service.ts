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
    role?: 'student' | 'admin';
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
    });

    return this.userRepository.save(user);
  }
}
