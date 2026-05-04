import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentStudent } from './entities/parent-student.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ParentsService {
  constructor(
    @InjectRepository(ParentStudent)
    private readonly parentStudentRepo: Repository<ParentStudent>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async linkStudent(parentId: string, studentId: string): Promise<void> {
    // Verify student exists and has student role
    const student = await this.userRepo.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    if (student.role !== 'student') {
      throw new BadRequestException('User is not a student');
    }

    // Check if already linked
    const existing = await this.parentStudentRepo.findOne({
      where: { parentId, studentId },
    });
    if (existing) {
      throw new BadRequestException('Parent already linked to this student');
    }

    // Create link
    const parentStudent = this.parentStudentRepo.create({
      parentId,
      studentId,
      isActive: true,
      linkedAt: new Date(),
    });
    await this.parentStudentRepo.save(parentStudent);
  }

  async unlinkStudent(parentId: string, studentId: string): Promise<void> {
    const parentStudent = await this.parentStudentRepo.findOne({
      where: { parentId, studentId },
    });
    if (!parentStudent) {
      throw new NotFoundException('Link not found');
    }
    await this.parentStudentRepo.remove(parentStudent);
  }

  async getMyStudents(parentId: string): Promise<any[]> {
    const links = await this.parentStudentRepo.find({
      where: { parentId, isActive: true },
      relations: ['student'],
    });
    return links.map(link => ({
      id: link.student.id,
      name: link.student.name,
      email: link.student.email,
      linkedAt: link.linkedAt,
    }));
  }

  async isLinked(parentId: string, studentId: string): Promise<boolean> {
    const link = await this.parentStudentRepo.findOne({
      where: { parentId, studentId, isActive: true },
    });
    return !!link;
  }
}
