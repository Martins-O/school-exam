import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('Teacher Class Flow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let adminToken: string;
  let teacherToken: string;
  let otherTeacherToken: string;
  let studentToken: string;

  let classAId: string;
  let classBId: string;
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
      VALUES ('Admin', 'admin_tc@test.com', '$2b$12$tsNEYLtHMdmhde82uf30kezJOpaM.EFaAWdXyBF6xMeeB7sIE7LIC', 'super_admin', true)
      ON CONFLICT ("email") DO NOTHING
    `);
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin_tc@test.com', password: 'password123' });
    adminToken = adminLogin.body.accessToken;

    // Create two classes
    const classARes = await request(app.getHttpServer())
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Class A', description: 'Class for teacher assignment' });
    classAId = classARes.body.id;

    const classBRes = await request(app.getHttpServer())
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Class B', description: 'Class NOT for teacher' });
    classBId = classBRes.body.id;

    // Create Teacher A — assigned to Class A only
    const teacherRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Teacher A', email: 'teacher_class@test.com', password: 'password123', role: 'teacher', classIds: [classAId] });
    const teacherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'teacher_class@test.com', password: 'password123' });
    teacherToken = teacherLogin.body.accessToken;

    // Create Teacher B (unassigned)
    const otherTeacherRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Teacher B', email: 'teacher_other@test.com', password: 'password123', role: 'teacher', classIds: [] });
    const otherTeacherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'teacher_other@test.com', password: 'password123' });
    otherTeacherToken = otherTeacherLogin.body.accessToken;

    // Create student in Class A
    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Class Student', email: 'student_class@test.com', password: 'password123', role: 'student', classIds: [classAId] });
    studentUserId = studentRes.body.id;
    const studentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student_class@test.com', password: 'password123' });
    studentToken = studentLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('teacher lists assigned classes only', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/teacher/classes')
      .set('Authorization', `Bearer ${teacherToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Class A');
  });

  it('teacher creates exam for assigned class successfully', async () => {
    const examRes = await request(app.getHttpServer())
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'Teacher Class Exam', durationMinutes: 30, targetClassIds: [classAId] });
    expect(examRes.status).toBe(201);
    expect(examRes.body.title).toBe('Teacher Class Exam');
  });

  it('teacher creates exam with no class (general exam)', async () => {
    const examRes = await request(app.getHttpServer())
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'No Class Exam', durationMinutes: 30 });
    expect(examRes.status).toBe(201);
  });

  it('teacher cannot create exam for unassigned class', async () => {
    const examRes = await request(app.getHttpServer())
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'Should Fail', durationMinutes: 30, targetClassIds: [classBId] });
    expect(examRes.status).toBe(403);
  });

  it('unassigned teacher cannot create exam for any class', async () => {
    const examRes = await request(app.getHttpServer())
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${otherTeacherToken}`)
      .send({ title: 'No way', durationMinutes: 30, targetClassIds: [classAId] });
    expect(examRes.status).toBe(403);
  });

  it('unassigned teacher can create exam without target classes', async () => {
    const examRes = await request(app.getHttpServer())
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${otherTeacherToken}`)
      .send({ title: 'Unassigned Teacher Exam', durationMinutes: 30 });
    expect(examRes.status).toBe(201);
  });

  it('student in class A can take exam assigned to class A', async () => {
    // Create exam with class A
    const examRes = await request(app.getHttpServer())
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'Takeable Exam', durationMinutes: 30, targetClassIds: [classAId] });
    const examId = examRes.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/exams/${examId}/questions`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ questionText: '1+1?', options: { A: '2', B: '3' }, correctAnswer: 'A', marks: 1 });

    await request(app.getHttpServer())
      .patch(`/api/v1/exams/${examId}/publish`)
      .set('Authorization', `Bearer ${teacherToken}`);

    const startRes = await request(app.getHttpServer())
      .post(`/api/v1/submissions/start/${examId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(startRes.status).toBe(201);
    expect(startRes.body.submissionId).toBeDefined();
  });
});
