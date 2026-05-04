import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from './entities/class.entity';
import { ClassStudent } from './entities/class-student.entity';
import { TeacherClass } from './entities/teacher-class.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private readonly classRepo: Repository<Class>,
    @InjectRepository(ClassStudent)
    private readonly classStudentRepo: Repository<ClassStudent>,
    @InjectRepository(TeacherClass)
    private readonly teacherClassRepo: Repository<TeacherClass>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: { name: string; description?: string }, adminUser: any): Promise<Class> {
    const classEntity = this.classRepo.create({
      name: dto.name,
      description: dto.description,
      createdBy: adminUser,
      createdById: adminUser.id,
    });
    return this.classRepo.save(classEntity);
  }

  async findAll(): Promise<Class[]> {
    return this.classRepo.find({ relations: ['createdBy'] });
  }

  async findOne(id: string): Promise<Class> {
    const classEntity = await this.classRepo.findOne({
      where: { id },
      relations: ['createdBy'],
    });
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }
    return classEntity;
  }

  async getStudents(classId: string): Promise<any[]> {
    const classStudents = await this.classStudentRepo.find({
      where: { classId },
      relations: ['student'],
    });
    return classStudents.map(cs => ({
      id: cs.student.id,
      name: cs.student.name,
      email: cs.student.email,
      enrolledAt: cs.enrolledAt,
    }));
  }

  async addStudent(classId: string, studentId: string): Promise<void> {
    // Verify class exists
    const classEntity = await this.findOne(classId);

    // Verify student exists and is a student
    const student = await this.userRepo.findOne({ where: { id: studentId } });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    if (student.role !== 'student') {
      throw new BadRequestException('User is not a student');
    }

    // Check if already enrolled
    const existing = await this.classStudentRepo.findOne({
      where: { classId, studentId },
    });
    if (existing) {
      throw new BadRequestException('Student already enrolled in this class');
    }

    // Enroll student
    const classStudent = this.classStudentRepo.create({
      class: classEntity,
      classId,
      student,
      studentId,
      enrolledAt: new Date(),
    });
    await this.classStudentRepo.save(classStudent);
  }

  async removeStudent(classId: string, studentId: string): Promise<void> {
    const classStudent = await this.classStudentRepo.findOne({
      where: { classId, studentId },
    });
    if (!classStudent) {
      throw new NotFoundException('Student not enrolled in this class');
    }
    await this.classStudentRepo.remove(classStudent);
  }

  async getTeachers(classId: string): Promise<any[]> {
    const teacherClasses = await this.teacherClassRepo.find({
      where: { classId },
      relations: ['teacher'],
    });
    return teacherClasses.map(tc => ({
      id: tc.teacher.id,
      name: tc.teacher.name,
      email: tc.teacher.email,
      assignedAt: tc.assignedAt,
    }));
  }

  async assignTeacher(classId: string, teacherId: string): Promise<void> {
    // Verify class exists
    const classEntity = await this.findOne(classId);

    // Verify teacher exists and is a teacher
    const teacher = await this.userRepo.findOne({ where: { id: teacherId } });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }
    if (!['teacher', 'super_admin', 'administrator'].includes(teacher.role)) {
      throw new BadRequestException('User is not a teacher or admin');
    }

    // Check if already assigned
    const existing = await this.teacherClassRepo.findOne({
      where: { classId, teacherId },
    });
    if (existing) {
      throw new BadRequestException('Teacher already assigned to this class');
    }

    // Assign teacher
    const teacherClass = this.teacherClassRepo.create({
      class: classEntity,
      classId,
      teacher,
      teacherId,
      assignedAt: new Date(),
    });
    await this.teacherClassRepo.save(teacherClass);
  }

  async removeTeacher(classId: string, teacherId: string): Promise<void> {
    const teacherClass = await this.teacherClassRepo.findOne({
      where: { classId, teacherId },
    });
    if (!teacherClass) {
      throw new NotFoundException('Teacher not assigned to this class');
    }
    await this.teacherClassRepo.remove(teacherClass);
  }

  async getTeacherClasses(teacherId: string): Promise<Class[]> {
    const teacherClasses = await this.teacherClassRepo.find({
      where: { teacherId },
      relations: ['class', 'class.createdBy'],
    });
    return teacherClasses.map(tc => tc.class);
  }

  async getStudentClasses(studentId: string): Promise<Class[]> {
    const classStudents = await this.classStudentRepo.find({
      where: { studentId },
      relations: ['class', 'class.createdBy'],
    });
    return classStudents.map(cs => cs.class);
  }
}
