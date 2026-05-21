import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';

describe('Exam Flow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let adminToken: string;
  let studentToken: string;
  let examId: string;
  let questionIds: string[] = [];
  let submissionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
    app.setGlobalPrefix('api/v1');
    await app.init();

    dataSource = app.get(DataSource);
    // Cleanup DB before test
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('Step 1: Create Admin via direct SQL and login', async () => {
    await dataSource.query(`
      INSERT INTO "users" ("name", "email", "password", "role", "isActive")
      VALUES ('Admin User', 'admin_e2e@test.com', '$2b$12$tsNEYLtHMdmhde82uf30kezJOpaM.EFaAWdXyBF6xMeeB7sIE7LIC', 'super_admin', true)
      ON CONFLICT ("email") DO NOTHING
    `);

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin_e2e@test.com', password: 'password123' });
    adminToken = loginRes.body.accessToken;
  });

  it('Step 2: Create Exam (Admin)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'E2E Test Exam',
        durationMinutes: 30,
        maxViolations: 3,
      });
    expect(res.status).toBe(201);
    examId = res.body.id;
  });

  it('Step 3: Add Questions (Admin)', async () => {
    const questions = [
      { questionText: 'What is 1 + 1?', options: { A: '2', B: '3', C: '4', D: '5' }, correctAnswer: 'A', marks: 2 },
      { questionText: 'What is 2 + 2?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'B', marks: 2 },
      { questionText: 'What is 3 + 3?', options: { A: '5', B: '6', C: '7', D: '8' }, correctAnswer: 'B', marks: 2 },
    ];

    for (const q of questions) {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/exams/${examId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(q);
      expect(res.status).toBe(201);
      questionIds.push(res.body.id);
    }
  });

  it('Step 4: Publish Exam (Admin)', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/exams/${examId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.isPublished).toBe(true);
  });

  it('Step 5: Create Student via Admin API & Login', async () => {
    // Admin creates a class first, then adds student to it
    const classRes = await request(app.getHttpServer())
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'E2E Test Class', description: 'Temp class for e2e' });
    const classId = classRes.body.id;

    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Student User',
        email: 'student_e2e@test.com',
        password: 'password123',
        role: 'student',
        classIds: [classId],
      });

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student_e2e@test.com', password: 'password123' });
    studentToken = loginRes.body.accessToken;
  });

  it('Step 6: Start Exam (Student)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/submissions/start/${examId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(201);
    expect(res.body.submissionId).toBeDefined();
    expect(res.body.questions).toHaveLength(3);
    submissionId = res.body.submissionId;
  });

  it('Step 7: Autosave x3 (Student)', async () => {
    // Save Q1
    const res1 = await request(app.getHttpServer())
      .patch(`/api/v1/submissions/${submissionId}/autosave`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ answers: { [questionIds[0]]: 'A' } });
    expect(res1.status).toBe(200);

    // Save Q2
    const res2 = await request(app.getHttpServer())
      .patch(`/api/v1/submissions/${submissionId}/autosave`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ answers: { [questionIds[1]]: 'B' } });
    expect(res2.status).toBe(200);

    // Save Flag + Q3 wrong answer
    const res3 = await request(app.getHttpServer())
      .patch(`/api/v1/submissions/${submissionId}/autosave`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ flaggedQuestions: [questionIds[2]], answers: { [questionIds[2]]: 'D' } });
      
    expect(res3.status).toBe(200);
    expect(res3.body.remainingSeconds).toBeGreaterThan(0);
  });

  it('Step 8: Final Submit (Student)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/submissions/${submissionId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        answers: {}, // Already saved in autosave
      });
    
    expect(res.status).toBe(201);
    // Q1 correct (2), Q2 correct (2), Q3 wrong (0) = 4 marks out of 6
    expect(res.body.score).toBe(4);
    expect(res.body.totalMarks).toBe(6);
    expect(res.body.percentage).toBeCloseTo(66.67, 1);
  });

  it('Step 9: Verify Result (Student)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/results/${submissionId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.score).toBe(4);
    expect(res.body.status).toBe('submitted');
  });

  it('Step 10: Cannot start exam twice (Student)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/v1/submissions/start/${examId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    expect(res.status).toBe(409);
  });
});
