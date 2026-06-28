import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('Parent Flow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let adminToken: string;
  let studentToken: string;
  let parentToken: string;
  let studentUserId: string;
  let examId: string;
  let submissionId: string;

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
      VALUES ('Admin', 'admin_parent@test.com', '$2b$12$tsNEYLtHMdmhde82uf30kezJOpaM.EFaAWdXyBF6xMeeB7sIE7LIC', 'super_admin', true)
      ON CONFLICT ("email") DO NOTHING
    `);
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin_parent@test.com', password: 'password123' });
    adminToken = adminLogin.body.accessToken;

    // Create class + student
    const classRes = await request(app.getHttpServer())
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Parent Test Class' });
    const classId = classRes.body.id;

    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Student', email: 'student_parent@test.com', password: 'password123', role: 'student', classIds: [classId] });
    studentUserId = studentRes.body.id;
    const studentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student_parent@test.com', password: 'password123' });
    studentToken = studentLogin.body.accessToken;

    // Create parent linked to student
    const parentRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Parent', email: 'parent_flow@test.com', password: 'password123', role: 'parent', studentIds: [studentUserId] });
    const parentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'parent_flow@test.com', password: 'password123' });
    parentToken = parentLogin.body.accessToken;

    // Create exam + questions + start + submit so student has a result
    const examRes = await request(app.getHttpServer())
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Parent E2E Exam', durationMinutes: 30 });
    examId = examRes.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/exams/${examId}/questions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ questionText: 'Test Q?', options: { A: 'Yes', B: 'No' }, correctAnswer: 'A', marks: 1 });

    await request(app.getHttpServer())
      .post(`/api/v1/exams/${examId}/classes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ classIds: [classId] });

    await request(app.getHttpServer())
      .patch(`/api/v1/exams/${examId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    const startRes = await request(app.getHttpServer())
      .post(`/api/v1/submissions/start/${examId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    submissionId = startRes.body.submissionId;

    await request(app.getHttpServer())
      .post(`/api/v1/submissions/${submissionId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ answers: {} });
  });

  afterAll(async () => {
    await app.close();
  });

  it('parent sees linked student in my-students', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/parent/my-students')
      .set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(studentUserId);
  });

  it('parent views linked student results via parent endpoint', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/parent/student/${studentUserId}/results`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].submissionId).toBe(submissionId);
  });

  it('parent views linked student result via results endpoint', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/results/${submissionId}`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.studentName).toBe('Test Student');
  });

  it('parent rejected for unlinked student results', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/parent/student/00000000-0000-4000-8000-000000000000/results')
      .set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(403);
  });

  it('parent views linked student transcripts (empty initially)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/parent/student/${studentUserId}/transcripts`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('parent can access generated transcript for linked student', async () => {
    // Admin generates transcript
    const genRes = await request(app.getHttpServer())
      .post('/api/v1/transcripts/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: studentUserId, comments: 'Test transcript' });
    expect(genRes.status).toBe(201);
    const transcriptId = genRes.body.id;

    // Parent views it
    const viewRes = await request(app.getHttpServer())
      .get(`/api/v1/transcripts/${transcriptId}`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(viewRes.status).toBe(200);
    expect(viewRes.body.id).toBe(transcriptId);
    expect(parseFloat(viewRes.body.averageScore)).toBeGreaterThanOrEqual(0);
  });

  it('parent rejected for unlinked student transcript', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/transcripts/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${parentToken}`);
    expect(res.status).toBe(404);
  });
});
