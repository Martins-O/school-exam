import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Reflector } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('Exam Edge Cases (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let studentToken: string;
  let classId: string;

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

    await dataSource.query(`
      INSERT INTO "users" ("name", "email", "password", "role", "isActive")
      VALUES ('Admin User', 'admin_edge@test.com', '$2b$12$tsNEYLtHMdmhde82uf30kezJOpaM.EFaAWdXyBF6xMeeB7sIE7LIC', 'super_admin', true)
      ON CONFLICT ("email") DO NOTHING
    `);

    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'admin_edge@test.com', password: 'password123' });
    adminToken = adminLogin.body.accessToken;

    const classRes = await request(app.getHttpServer())
      .post('/api/v1/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Edge Test Class', description: 'Temp class for e2e edge cases' });
    classId = classRes.body.id;

    await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Student User',
        email: 'student_edge@test.com',
        password: 'password123',
        role: 'student',
        classIds: [classId],
      });

    const studentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'student_edge@test.com', password: 'password123' });
    studentToken = studentLogin.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Non-published exam', () => {
    it('should reject starting a non-published exam', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Unpublished Edge Exam', durationMinutes: 30, maxViolations: 3 });
      expect(res.status).toBe(201);
      const examId = res.body.id;

      const startRes = await request(app.getHttpServer())
        .post(`/api/v1/submissions/start/${examId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(startRes.status).toBe(403);
    });
  });

  describe('Class-restricted exam', () => {
    it('should reject student not enrolled in target class', async () => {
      const otherClassRes = await request(app.getHttpServer())
        .post('/api/v1/classes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Other Edge Class', description: 'Only other students here' });
      const otherClassId = otherClassRes.body.id;

      const examRes = await request(app.getHttpServer())
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Class-Restricted Edge Exam', durationMinutes: 30, maxViolations: 3 });
      const examId = examRes.body.id;

      await request(app.getHttpServer())
        .patch(`/api/v1/exams/${examId}/classes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ classIds: [otherClassId] });

      await request(app.getHttpServer())
        .post(`/api/v1/exams/${examId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ questionText: '1+1?', options: { A: '2', B: '3' }, correctAnswer: 'A', marks: 1 });

      await request(app.getHttpServer())
        .patch(`/api/v1/exams/${examId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      const startRes = await request(app.getHttpServer())
        .post(`/api/v1/submissions/start/${examId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(startRes.status).toBe(403);
    });
  });

  describe('Violation auto-submit', () => {
    it('should auto-submit when violations reach maxViolations', async () => {
      const examRes = await request(app.getHttpServer())
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Violation Edge Exam', durationMinutes: 30, maxViolations: 2 });
      const examId = examRes.body.id;

      await request(app.getHttpServer())
        .patch(`/api/v1/exams/${examId}/classes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ classIds: [classId] });

      await request(app.getHttpServer())
        .post(`/api/v1/exams/${examId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ questionText: '1+1?', options: { A: '2', B: '3' }, correctAnswer: 'A', marks: 1 });

      await request(app.getHttpServer())
        .patch(`/api/v1/exams/${examId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      const startRes = await request(app.getHttpServer())
        .post(`/api/v1/submissions/start/${examId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(startRes.status).toBe(201);
      const submissionId = startRes.body.submissionId;

      const v1 = await request(app.getHttpServer())
        .post(`/api/v1/submissions/${submissionId}/violation`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ type: 'tab_switch' });
      expect(v1.status).toBe(201);
      expect(v1.body.violations).toBe(1);
      expect(v1.body.autoSubmitted).toBe(false);

      const v2 = await request(app.getHttpServer())
        .post(`/api/v1/submissions/${submissionId}/violation`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ type: 'fullscreen_exit' });
      expect(v2.status).toBe(201);
      expect(v2.body.violations).toBe(2);
      expect(v2.body.autoSubmitted).toBe(true);
      expect(v2.body.score).toBeDefined();
      expect(v2.body.totalMarks).toBeDefined();

      const resultRes = await request(app.getHttpServer())
        .get(`/api/v1/results/${submissionId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(resultRes.status).toBe(200);
      expect(resultRes.body.status).toBe('force_submitted');
      expect(resultRes.body.autoSubmitted).toBe(true);
    });
  });

  describe('Deleted question grading', () => {
    it('should skip deleted questions during grading', async () => {
      const examRes = await request(app.getHttpServer())
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Deleted Q Edge Exam', durationMinutes: 30, maxViolations: 3 });
      const examId = examRes.body.id;

      await request(app.getHttpServer())
        .patch(`/api/v1/exams/${examId}/classes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ classIds: [classId] });

      const questionIds: string[] = [];
      const questionsData = [
        { questionText: 'Q1: 1+1?', options: { A: '2', B: '3', C: '4', D: '5' }, correctAnswer: 'A', marks: 2 },
        { questionText: 'Q2: 2+2?', options: { A: '3', B: '4', C: '5', D: '6' }, correctAnswer: 'B', marks: 2 },
        { questionText: 'Q3: 3+3?', options: { A: '5', B: '6', C: '7', D: '8' }, correctAnswer: 'B', marks: 2 },
      ];

      for (const q of questionsData) {
        const res = await request(app.getHttpServer())
          .post(`/api/v1/exams/${examId}/questions`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(q);
        expect(res.status).toBe(201);
        questionIds.push(res.body.id);
      }

      await request(app.getHttpServer())
        .patch(`/api/v1/exams/${examId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      const startRes = await request(app.getHttpServer())
        .post(`/api/v1/submissions/start/${examId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      expect(startRes.status).toBe(201);
      expect(startRes.body.questions).toHaveLength(3);
      const submissionId = startRes.body.submissionId;

      await request(app.getHttpServer())
        .delete(`/api/v1/exams/${examId}/questions/${questionIds[1]}`)
        .set('Authorization', `Bearer ${adminToken}`);

      await request(app.getHttpServer())
        .patch(`/api/v1/submissions/${submissionId}/autosave`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: { [questionIds[0]]: 'A', [questionIds[2]]: 'B' } });

      const submitRes = await request(app.getHttpServer())
        .post(`/api/v1/submissions/${submissionId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: {} });
      expect(submitRes.status).toBe(201);
      expect(submitRes.body.score).toBe(4);
      expect(submitRes.body.totalMarks).toBe(4);
      expect(submitRes.body.percentage).toBe(100);
    });
  });

  describe('Autosave after submission', () => {
    it('should return 409 when autosave called after submit', async () => {
      const examRes = await request(app.getHttpServer())
        .post('/api/v1/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Post-Submit Edge Exam', durationMinutes: 30, maxViolations: 3 });
      const examId = examRes.body.id;

      await request(app.getHttpServer())
        .patch(`/api/v1/exams/${examId}/classes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ classIds: [classId] });

      await request(app.getHttpServer())
        .post(`/api/v1/exams/${examId}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ questionText: '1+1?', options: { A: '2', B: '3' }, correctAnswer: 'A', marks: 1 });

      await request(app.getHttpServer())
        .patch(`/api/v1/exams/${examId}/publish`)
        .set('Authorization', `Bearer ${adminToken}`);

      const startRes = await request(app.getHttpServer())
        .post(`/api/v1/submissions/start/${examId}`)
        .set('Authorization', `Bearer ${studentToken}`);
      const submissionId = startRes.body.submissionId;

      await request(app.getHttpServer())
        .post(`/api/v1/submissions/${submissionId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: {} });

      const autosaveRes = await request(app.getHttpServer())
        .patch(`/api/v1/submissions/${submissionId}/autosave`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: {} });
      expect(autosaveRes.status).toBe(409);
    });
  });
});
