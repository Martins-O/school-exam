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
    return this.classRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.createdBy', 'createdBy')
      .loadRelationCountAndMap('c.studentCount', 'c.classStudents', 'cs', qb => qb.where('cs.isActive = true'))
      .loadRelationCountAndMap('c.teacherCount', 'c.teacherClasses')
      .getMany();
  }

  async findOne(id: string): Promise<Class> {
    const classEntity = await this.classRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.createdBy', 'createdBy')
      .loadRelationCountAndMap('c.studentCount', 'c.classStudents', 'cs', qb => qb.where('cs.isActive = true'))
      .loadRelationCountAndMap('c.teacherCount', 'c.teacherClasses')
      .where('c.id = :id', { id })
      .getOne();
    if (!classEntity) {
      throw new NotFoundException('Class not found');
    }
    return classEntity;
  }

  async getStudents(classId: string): Promise<any[]> {
    const classStudents = await this.classStudentRepo.find({
      where: { classId },
      relations: ['student'],
      order: { enrolledAt: 'DESC' },
    });
    return classStudents.map(cs => ({
      id: cs.student.id,
      name: cs.student.name,
      email: cs.student.email,
      enrolledAt: cs.enrolledAt,
      isActive: cs.isActive,
      unenrolledAt: cs.unenrolledAt,
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

    // Check if student is already actively enrolled in any class
    const existingEnrollment = await this.classStudentRepo.findOne({
      where: { studentId, isActive: true },
    });
    if (existingEnrollment) {
      if (existingEnrollment.classId === classId) {
        throw new BadRequestException('Student is already actively enrolled in this class.');
      }
      // Reassign: Mark previous enrollment as inactive
      existingEnrollment.isActive = false;
      existingEnrollment.unenrolledAt = new Date();
      await this.classStudentRepo.save(existingEnrollment);
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
      where: { classId, studentId, isActive: true },
    });
    if (!classStudent) {
      throw new NotFoundException('Student is not actively enrolled in this class');
    }
    classStudent.isActive = false;
    classStudent.unenrolledAt = new Date();
    await this.classStudentRepo.save(classStudent);
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

  async addStudents(classId: string, studentIds: string[]): Promise<{ enrolled: number; errors: { id: string; message: string }[] }> {
    const classEntity = await this.findOne(classId);
    const enrolled: string[] = [];
    const errors: { id: string; message: string }[] = [];

    for (const studentId of studentIds) {
      try {
        const student = await this.userRepo.findOne({ where: { id: studentId } });
        if (!student) {
          errors.push({ id: studentId, message: 'Student not found' });
          continue;
        }
        if (student.role !== 'student') {
          errors.push({ id: studentId, message: 'User is not a student' });
          continue;
        }

        const existingEnrollment = await this.classStudentRepo.findOne({
          where: { studentId, isActive: true },
        });
        if (existingEnrollment) {
          if (existingEnrollment.classId === classId) {
            errors.push({ id: studentId, message: 'Student is already actively enrolled in this class' });
            continue;
          }
          existingEnrollment.isActive = false;
          existingEnrollment.unenrolledAt = new Date();
          await this.classStudentRepo.save(existingEnrollment);
        }

        const classStudent = this.classStudentRepo.create({
          class: classEntity,
          classId,
          student,
          studentId,
          enrolledAt: new Date(),
        });
        await this.classStudentRepo.save(classStudent);
        enrolled.push(studentId);
      } catch (err: any) {
        errors.push({ id: studentId, message: err.message || 'Enrollment failed' });
      }
    }

    return { enrolled: enrolled.length, errors };
  }

  async assignTeachers(classId: string, teacherIds: string[]): Promise<{ assigned: number; errors: { id: string; message: string }[] }> {
    const classEntity = await this.findOne(classId);
    const assigned: string[] = [];
    const errors: { id: string; message: string }[] = [];

    for (const teacherId of teacherIds) {
      try {
        const teacher = await this.userRepo.findOne({ where: { id: teacherId } });
        if (!teacher) {
          errors.push({ id: teacherId, message: 'Teacher not found' });
          continue;
        }
        if (!['teacher', 'super_admin', 'administrator'].includes(teacher.role)) {
          errors.push({ id: teacherId, message: 'User is not a teacher or admin' });
          continue;
        }

        const existing = await this.teacherClassRepo.findOne({
          where: { classId, teacherId },
        });
        if (existing) {
          errors.push({ id: teacherId, message: 'Teacher already assigned to this class' });
          continue;
        }

        const teacherClass = this.teacherClassRepo.create({
          class: classEntity,
          classId,
          teacher,
          teacherId,
          assignedAt: new Date(),
        });
        await this.teacherClassRepo.save(teacherClass);
        assigned.push(teacherId);
      } catch (err: any) {
        errors.push({ id: teacherId, message: err.message || 'Assignment failed' });
      }
    }

    return { assigned: assigned.length, errors };
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
      where: { studentId, isActive: true },
      relations: ['class', 'class.createdBy'],
    });
    return classStudents.map(cs => cs.class);
  }
}
