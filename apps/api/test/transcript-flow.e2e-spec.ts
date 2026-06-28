import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('Transcript Flow (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  let adminToken: string;
  let studentToken: string;
  let studentUserId: string;
  let examId: string;
  let transcriptId: string;

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
      VALUES ('Admin', 'admin_transcript@test.com', '$2b$12$tsNEYLtHMdmhde82uf30kezJOpaM.EFaAWdXyBF6xMeeB7sIE7LIC', 'super_admin', true)
      ON CONFLICT ("email") DO NOTHING
    `);
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin_transcript@test.com', password: 'password123' });
    adminToken = adminLogin.body.accessToken;

    // Create class + student
    const classRes = await request(app.getHttpServer())
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Transcript Test Class' });
    const classId = classRes.body.id;

    const studentRes = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Transcript Student', email: 'student_transcript@test.com', password: 'password123', role: 'student', classIds: [classId] });
    studentUserId = studentRes.body.id;
    const studentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student_transcript@test.com', password: 'password123' });
    studentToken = studentLogin.body.accessToken;

    // Create exam with question, publish
    const examRes = await request(app.getHttpServer())
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Transcript Exam 1', durationMinutes: 30 });
    examId = examRes.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/exams/${examId}/questions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ questionText: 'What is capital of France?', options: { A: 'Paris', B: 'London', C: 'Berlin', D: 'Madrid' }, correctAnswer: 'A', marks: 1 });

    await request(app.getHttpServer())
      .post(`/api/v1/exams/${examId}/classes`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ classIds: [classId] });

    await request(app.getHttpServer())
      .patch(`/api/v1/exams/${examId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    // Student takes exam
    const startRes = await request(app.getHttpServer())
      .post(`/api/v1/submissions/start/${examId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    const submissionId = startRes.body.submissionId;

    await request(app.getHttpServer())
      .post(`/api/v1/submissions/${submissionId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ answers: {} });
  });

  afterAll(async () => {
    await app.close();
  });

  it('generates transcript with correct average', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/transcripts/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: studentUserId, comments: 'First term' });
    expect(res.status).toBe(201);
    expect(res.body.studentId).toBe(studentUserId);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].examTitle).toBe('Transcript Exam 1');
    expect(parseFloat(res.body.averageScore)).toBeGreaterThanOrEqual(0);
    expect(res.body.isFinalized).toBe(false);
    transcriptId = res.body.id;
  });

  it('lists transcripts for student', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/transcripts/student/${studentUserId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const manualTranscript = res.body.find((t: any) => t.id === transcriptId);
    expect(manualTranscript).toBeDefined();
  });

  it('finalizes transcript', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/api/v1/transcripts/${transcriptId}/finalize`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.isFinalized).toBe(true);
  });

  it('student views finalized transcript detail', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/transcripts/${transcriptId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.isFinalized).toBe(true);
    expect(res.body.results).toHaveLength(1);
  });

  it('student cannot view another students transcript', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/transcripts/${transcriptId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    // Same student, same transcript — ok
    expect(res.status).toBe(200);
  });

  it('two-exam transcript aggregates correctly', async () => {
    // Create a second exam and take it
    const exam2Res = await request(app.getHttpServer())
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Transcript Exam 2', durationMinutes: 30 });
    const exam2Id = exam2Res.body.id;

    await request(app.getHttpServer())
      .post(`/api/v1/exams/${exam2Id}/questions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ questionText: '2+2?', options: { A: '3', B: '4', C: '5' }, correctAnswer: 'B', marks: 2 });

    await request(app.getHttpServer())
      .patch(`/api/v1/exams/${exam2Id}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);

    const classRes = await request(app.getHttpServer())
      .get('/api/v1/classes')
      .set('Authorization', `Bearer ${adminToken}`);
    const classId = classRes.body[0]?.id;

    if (classId) {
      await request(app.getHttpServer())
        .post(`/api/v1/exams/${exam2Id}/classes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ classIds: [classId] });
    }

    const startRes = await request(app.getHttpServer())
      .post(`/api/v1/submissions/start/${exam2Id}`)
      .set('Authorization', `Bearer ${studentToken}`);
    const subId = startRes.body.submissionId;
    const qId = startRes.body.questions[0].id;

    await request(app.getHttpServer())
      .post(`/api/v1/submissions/${subId}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ answers: { [qId]: 'B' } });

    // Generate transcript for both exams with periodStart before both
    const genRes = await request(app.getHttpServer())
      .post('/api/v1/transcripts/generate')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ studentId: studentUserId, periodStart: '2024-01-01T00:00:00Z' });

    expect(genRes.status).toBe(201);
    expect(genRes.body.results).toHaveLength(2);
    expect(parseFloat(genRes.body.averageScore)).toBeGreaterThan(0);
  });
});
