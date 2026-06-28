import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('Role Enforcement (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let adminToken: string;
  let teacherAToken: string;
  let teacherBToken: string;
  let studentToken: string;
  let parentToken: string;

  let classId: string;
  let studentUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
    app.setGlobalPrefix('api/v1');
    await app.init();

    dataSource = app.get(DataSource);
    await dataSource.query('TRUNCATE TABLE submissions CASCADE');
    await dataSource.query('TRUNCATE TABLE questions CASCADE');
    await dataSource.query('TRUNCATE TABLE exams CASCADE');
    await dataSource.query('TRUNCATE TABLE classes CASCADE');
    await dataSource.query('TRUNCATE TABLE class_students CASCADE');
    await dataSource.query('TRUNCATE TABLE teacher_classes CASCADE');
    await dataSource.query('TRUNCATE TABLE question_categories CASCADE');
    await dataSource.query('TRUNCATE TABLE parent_students CASCADE');
    await dataSource.query('TRUNCATE TABLE transcripts CASCADE');
    await dataSource.query('TRUNCATE TABLE users CASCADE');

    // Create admin
    await dataSource.query(`
      INSERT INTO "users" ("name", "email", "password", "role", "isActive")
      VALUES ('Admin', 'admin_role@test.com', '$2b$12$tsNEYLtHMdmhde82uf30kezJOpaM.EFaAWdXyBF6xMeeB7sIE7LIC', 'super_admin', true)
      ON CONFLICT ("email") DO NOTHING
    `);
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin_role@test.com', password: 'password123' });
    adminToken = adminLogin.body.accessToken;

    // Create class (shared)
    const classRes = await request(app.getHttpServer())
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Role Test Class', description: 'Class for role e2e' });
    classId = classRes.body.id;

    // Create Teacher A + assign to class
    const teacherARes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Teacher A', email: 'teacher_a@test.com', password: 'password123', role: 'teacher', classIds: [classId] });
    const teacherAId = teacherARes.body.id;
    const teacherALogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'teacher_a@test.com', password: 'password123' });
    teacherAToken = teacherALogin.body.accessToken;

    // Create Teacher B + assign to class
    const teacherBRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Teacher B', email: 'teacher_b@test.com', password: 'password123', role: 'teacher', classIds: [classId] });
    const teacherBId = teacherBRes.body.id;
    const teacherBLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'teacher_b@test.com', password: 'password123' });
    teacherBToken = teacherBLogin.body.accessToken;

    // Create student
    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Student', email: 'student_role@test.com', password: 'password123', role: 'student', classIds: [classId] });
    studentUserId = studentRes.body.id;
    const studentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student_role@test.com', password: 'password123' });
    studentToken = studentLogin.body.accessToken;

    // Create parent (links to student via studentIds)
    const parentRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Parent', email: 'parent_role@test.com', password: 'password123', role: 'parent', studentIds: [studentUserId] });
    const parentId = parentRes.body.id;
    const parentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'parent_role@test.com', password: 'password123' });
    parentToken = parentLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Teacher exam ownership', () => {
    let teacherAExamId: string;
    let teacherBExamId: string;

    it('Teacher A creates own exam', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ title: 'Teacher A Exam', durationMinutes: 30 });
      expect(res.status).toBe(201);
      teacherAExamId = res.body.id;
    });

    it('Teacher B cannot update Teacher A exam', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/exams/${teacherAExamId}`)
        .set('Authorization', `Bearer ${teacherBToken}`)
        .send({ title: 'Hacked by B' });
      expect(res.status).toBe(403);
    });

    it('Teacher B cannot delete Teacher A exam', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/exams/${teacherAExamId}`)
        .set('Authorization', `Bearer ${teacherBToken}`);
      expect(res.status).toBe(403);
    });

    it('Teacher B cannot publish Teacher A exam', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/exams/${teacherAExamId}/publish`)
        .set('Authorization', `Bearer ${teacherBToken}`);
      expect(res.status).toBe(403);
    });

    it('Teacher B creates own exam successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${teacherBToken}`)
        .send({ title: 'Teacher B Exam', durationMinutes: 60 });
      expect(res.status).toBe(201);
      teacherBExamId = res.body.id;
    });

    it('Teacher A cannot update Teacher B exam', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/exams/${teacherBExamId}`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ title: 'Hacked by A' });
      expect(res.status).toBe(403);
    });

    it('Teacher B can update own exam', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/exams/${teacherBExamId}`)
        .set('Authorization', `Bearer ${teacherBToken}`)
        .send({ title: 'Teacher B Updated' });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Teacher B Updated');
    });

    it('Teacher A sees only own exam in list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/exams')
        .set('Authorization', `Bearer ${teacherAToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      const titles = res.body.map((e: any) => e.title);
      expect(titles).toContain('Teacher A Exam');
      expect(titles).not.toContain('Teacher B Updated');
    });
  });

  describe('Parent result access', () => {
    let linkedSubmissionId: string;

    it('parent sees linked student in my-students list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/parent/my-students')
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].id).toBe(studentUserId);
    });

    it('parent can view linked student results (empty list is ok)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/parent/student/${studentUserId}/results`)
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('parent rejected for unlinked student', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/parent/student/00000000-0000-4000-8000-000000000000/results')
        .set('Authorization', `Bearer ${parentToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('Admin and teacher results filtering', () => {
    let examAId: string;
    let examBId: string;

    it('setup: Teacher A creates exam with question, student takes it', async () => {
      const examRes = await request(app.getHttpServer())
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ title: 'Results Test A', durationMinutes: 30 });
      examAId = examRes.body.id;

      await request(app.getHttpServer())
        .patch(`/api/v1/exams/${examAId}/classes`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ classIds: [classId] });

      await request(app.getHttpServer())
        .post(`/api/v1/exams/${examAId}/questions`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ questionText: '1+1?', options: { A: '2', B: '3' }, correctAnswer: 'A', marks: 1 });

      await request(app.getHttpServer())
        .patch(`/api/v1/exams/${examAId}/publish`)
        .set('Authorization', `Bearer ${teacherAToken}`);

      const startRes = await request(app.getHttpServer())
        .post(`/api/v1/submissions/start/${examAId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      const subId = startRes.body.submissionId;

      await request(app.getHttpServer())
        .post(`/api/v1/submissions/${subId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: {} });
    });

    it('setup: Teacher B creates exam with question, student takes it', async () => {
      const examRes = await request(app.getHttpServer())
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${teacherBToken}`)
        .send({ title: 'Results Test B', durationMinutes: 30 });
      examBId = examRes.body.id;

      await request(app.getHttpServer())
        .patch(`/api/v1/exams/${examBId}/classes`)
        .set('Authorization', `Bearer ${teacherBToken}`)
        .send({ classIds: [classId] });

      await request(app.getHttpServer())
        .post(`/api/v1/exams/${examBId}/questions`)
        .set('Authorization', `Bearer ${teacherBToken}`)
        .send({ questionText: '2+2?', options: { A: '3', B: '4' }, correctAnswer: 'B', marks: 1 });

      await request(app.getHttpServer())
        .patch(`/api/v1/exams/${examBId}/publish`)
        .set('Authorization', `Bearer ${teacherBToken}`);

      const startRes = await request(app.getHttpServer())
        .post(`/api/v1/submissions/start/${examBId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      const subId = startRes.body.submissionId;

      await request(app.getHttpServer())
        .post(`/api/v1/submissions/${subId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: {} });
    });

    it('admin sees all results', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/admin/results')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
    });

    it('teacher A sees only their exam results', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/results/exam/${examAId}`)
        .set('Authorization', `Bearer ${teacherAToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it('teacher B sees only their exam results', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/results/exam/${examBId}`)
        .set('Authorization', `Bearer ${teacherBToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it('teacher A cannot view teacher B exam results', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/admin/results/exam/${examBId}`)
        .set('Authorization', `Bearer ${teacherAToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });
});
