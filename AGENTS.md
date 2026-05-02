# AGENTS.md — CBT Exam Platform

> **Read this entire file before writing a single line of code.**
> This is the canonical reference for every AI agent, human developer, or tool working on this project.
> Every architectural decision, naming convention, edge case, and security requirement is documented here.
> When in doubt, re-read this file. Do not invent solutions for problems already solved here.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack — Exact Versions](#2-tech-stack--exact-versions)
3. [Repository Structure](#3-repository-structure)
4. [Database Schema — Exact Definition](#4-database-schema--exact-definition)
5. [NestJS Backend — Module Map](#5-nestjs-backend--module-map)
6. [API Routes — Complete Reference](#6-api-routes--complete-reference)
7. [Exam Engine — Critical Logic](#7-exam-engine--critical-logic)
8. [Auth System](#8-auth-system)
9. [Anti-Cheating System](#9-anti-cheating-system)
10. [Frontend — Next.js](#10-frontend--nextjs)
11. [Security Requirements](#11-security-requirements)
12. [Environment Variables](#12-environment-variables)
13. [Error Handling Contract](#13-error-handling-contract)
14. [Execution Order for Agents](#14-execution-order-for-agents)
15. [Decisions Already Made — Do Not Re-Decide](#15-decisions-already-made--do-not-re-decide)
16. [Known Edge Cases — Handle All of These](#16-known-edge-cases--handle-all-of-these)
17. [What NOT to Build in MVP](#17-what-not-to-build-in-mvp)

---

## 1. Project Overview

### What this is

A **Computer-Based Testing (CBT) platform** for academic institutions, inspired by JAMB (Joint Admissions and Matriculation Board, Nigeria). Students take timed, secure, auto-graded exams in a browser. Admins create and manage exams and questions.

### What this is NOT

- Not a quiz app. Not a survey tool.
- Not a simple CRUD application.
- This is a **secure, adversarial-environment exam system**. Students may attempt to cheat, bypass timers, or manipulate submissions. The system must be designed with **zero trust for the client**.

### Core invariants — never violate these

1. **The timer is server-authoritative.** The client displays a countdown, but the server decides when time is up.
2. **One attempt per student per exam.** Once started, an exam session cannot be restarted.
3. **Answers are autosaved.** No student should lose answers due to a browser crash or network blip.
4. **Scoring happens on the server.** The client never knows correct answers.
5. **Question order is randomized per student and stored.** The stored order is used for grading — never regenerated.

---

## 2. Tech Stack — Exact Versions

### Backend

| Package | Version | Notes |
|---|---|---|
| Node.js | 20.x LTS | Use nvm |
| NestJS | 10.x | `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express` |
| TypeORM | 0.3.x | `typeorm`, `@nestjs/typeorm` |
| PostgreSQL | 16.x | Primary datastore |
| Redis | 7.x | Optional for MVP — session cache only |
| `@nestjs/jwt` | 10.x | JWT auth |
| `@nestjs/passport` | 10.x | Passport integration |
| `passport-jwt` | 4.x | JWT strategy |
| `bcrypt` | 5.x | Password hashing |
| `class-validator` | 0.14.x | DTO validation |
| `class-transformer` | 0.5.x | DTO transformation |
| `@nestjs/websockets` | 10.x | WebSocket gateway (admin monitoring) |
| `@nestjs/platform-socket.io` | 10.x | Socket.io adapter |
| `helmet` | 7.x | HTTP security headers |
| `express-rate-limit` | 7.x | Rate limiting |
| `compression` | 1.x | Response compression |

### Frontend

| Package | Version | Notes |
|---|---|---|
| Next.js | 14.x | App Router |
| React | 18.x | |
| TailwindCSS | 3.x | |
| `axios` | 1.x | HTTP client |
| `socket.io-client` | 4.x | WebSocket (admin only) |
| `zustand` | 4.x | Client state management |
| `react-hot-toast` | 2.x | Notifications |

### Infrastructure

| Tool | Purpose |
|---|---|
| Docker + Docker Compose | Local dev environment |
| PostgreSQL 16 container | Local DB |
| Redis 7 container | Local cache |

---

## 3. Repository Structure

```
cbt-platform/
├── apps/
│   ├── api/                          # NestJS backend
│   │   ├── src/
│   │   │   ├── main.ts               # Bootstrap, global pipes, helmet, cors
│   │   │   ├── app.module.ts         # Root module
│   │   │   ├── auth/                 # AuthModule
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── roles.guard.ts
│   │   │   │   ├── roles.decorator.ts
│   │   │   │   └── dto/
│   │   │   │       ├── login.dto.ts
│   │   │   │       └── register.dto.ts
│   │   │   ├── users/                # UsersModule
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── entities/
│   │   │   │       └── user.entity.ts
│   │   │   ├── exams/                # ExamModule (admin CRUD only)
│   │   │   │   ├── exams.module.ts
│   │   │   │   ├── exams.controller.ts
│   │   │   │   ├── exams.service.ts
│   │   │   │   └── entities/
│   │   │   │       └── exam.entity.ts
│   │   │   ├── questions/            # QuestionsModule
│   │   │   │   ├── questions.module.ts
│   │   │   │   ├── questions.controller.ts
│   │   │   │   ├── questions.service.ts
│   │   │   │   └── entities/
│   │   │   │       └── question.entity.ts
│   │   │   ├── submissions/          # SubmissionModule — exam engine lives here
│   │   │   │   ├── submissions.module.ts
│   │   │   │   ├── submissions.controller.ts
│   │   │   │   ├── submissions.service.ts
│   │   │   │   ├── exam-session.service.ts   # Start, autosave, submit
│   │   │   │   ├── grader.service.ts         # Scoring logic
│   │   │   │   ├── randomizer.service.ts     # Question shuffle + storage
│   │   │   │   └── entities/
│   │   │   │       └── submission.entity.ts
│   │   │   ├── results/              # ResultsModule (read-only)
│   │   │   │   ├── results.module.ts
│   │   │   │   ├── results.controller.ts
│   │   │   │   └── results.service.ts
│   │   │   └── gateway/              # WebSocket gateway (admin monitoring)
│   │   │       └── exam.gateway.ts
│   │   ├── migrations/               # TypeORM migration files
│   │   ├── test/
│   │   └── package.json
│   └── web/                          # Next.js frontend
│       ├── app/
│       │   ├── (auth)/
│       │   │   ├── login/page.tsx
│       │   │   └── register/page.tsx
│       │   ├── (student)/
│       │   │   ├── dashboard/page.tsx
│       │   │   └── exam/[examId]/page.tsx    # The exam-taking page
│       │   └── (admin)/
│       │       ├── dashboard/page.tsx
│       │       ├── exams/page.tsx
│       │       ├── exams/[examId]/page.tsx
│       │       ├── exams/[examId]/questions/page.tsx
│       │       └── results/page.tsx
│       ├── components/
│       │   ├── exam/
│       │   │   ├── ExamTimer.tsx
│       │   │   ├── QuestionCard.tsx
│       │   │   ├── QuestionNavigator.tsx
│       │   │   └── ViolationOverlay.tsx
│       │   └── ui/
│       ├── lib/
│       │   ├── api.ts                # Axios instance
│       │   └── store/
│       │       └── examStore.ts      # Zustand store for active exam
│       └── package.json
├── docker-compose.yml
└── AGENTS.md                         # This file
```

---

## 4. Database Schema — Exact Definition

> Use TypeORM decorators. Run `typeorm migration:generate` after entity changes. Never alter the DB manually.

### 4.1 users

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ unique: true, length: 150 })
  email: string;

  @Column()
  password: string; // bcrypt hash, never plaintext

  @Column({ type: 'enum', enum: ['student', 'admin'], default: 'student' })
  role: 'student' | 'admin';

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 4.2 exams

```typescript
@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  durationMinutes: number; // Exam duration in minutes

  @Column({ type: 'timestamptz', nullable: true })
  startTime: Date; // When the exam window opens (nullable = always open)

  @Column({ type: 'timestamptz', nullable: true })
  endTime: Date; // When the exam window closes (nullable = always open)

  @Column({ default: false })
  isPublished: boolean; // Only published exams are visible to students

  @Column({ type: 'int', default: 3 })
  maxViolations: number; // Auto-submit after this many violations

  @ManyToOne(() => User)
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 4.3 questions

```typescript
@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Exam, { onDelete: 'CASCADE' })
  exam: Exam;

  @Column({ type: 'text' })
  questionText: string;

  @Column({ type: 'jsonb' })
  // Exact shape: { "A": "...", "B": "...", "C": "...", "D": "..." }
  // Always exactly 4 options keyed A, B, C, D
  options: Record<'A' | 'B' | 'C' | 'D', string>;

  @Column({ type: 'char', length: 1 })
  // Stored as 'A', 'B', 'C', or 'D'
  // NEVER expose this field to students — use @Exclude() in serialization
  correctAnswer: string;

  @Column({ type: 'int', default: 1 })
  marks: number; // Points for a correct answer (default 1)

  @Column({ type: 'int', default: 0 })
  orderIndex: number; // Admin-defined order, used as base before randomization

  @CreateDateColumn()
  createdAt: Date;
}
```

### 4.4 submissions

```typescript
@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  student: User;

  @ManyToOne(() => Exam)
  exam: Exam;

  @Column({ type: 'jsonb' })
  // Array of question UUIDs in the randomized order shown to this student
  // Set once on exam start. NEVER modified after that.
  // Shape: string[] — e.g. ["uuid1", "uuid3", "uuid2", ...]
  questionOrder: string[];

  @Column({ type: 'jsonb', default: {} })
  // Map of questionId → selected answer letter
  // Shape: Record<string, 'A' | 'B' | 'C' | 'D'>
  // Updated by autosave endpoint
  answers: Record<string, string>;

  @Column({ type: 'jsonb', default: [] })
  // Array of questionIds the student flagged for review
  flaggedQuestions: string[];

  @Column({ type: 'enum', enum: ['in_progress', 'submitted', 'timed_out', 'force_submitted'] })
  status: 'in_progress' | 'submitted' | 'timed_out' | 'force_submitted';

  @Column({ type: 'timestamptz' })
  startedAt: Date; // Server timestamp — set once on exam start

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt: Date;

  @Column({ type: 'int', nullable: true })
  score: number; // Calculated after submission, null until then

  @Column({ type: 'int', nullable: true })
  totalMarks: number; // Sum of marks for all questions in this exam

  @Column({ type: 'int', default: 0 })
  violations: number; // Tab-switch / fullscreen-exit count

  @Column({ type: 'boolean', default: false })
  autoSubmitted: boolean; // True if submitted by server (timeout or violations)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 4.5 Schema Notes

- All primary keys are UUID (`uuid_generate_v4()`). Enable the extension: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
- All timestamps use `timestamptz` (timezone-aware). Never use `timestamp` without timezone.
- `options` and `answers` are `jsonb` — not `json`. Use `jsonb` for indexing capability.
- `questionOrder` is `jsonb` storing a `string[]`. It is immutable after being set.

---

## 5. NestJS Backend — Module Map

### Module responsibilities — strict boundaries

| Module | Owns | Does NOT touch |
|---|---|---|
| `AuthModule` | Login, register, JWT issue, token validation | Exam logic |
| `UsersModule` | User entity CRUD, password hashing | Auth tokens |
| `ExamsModule` | Exam + Question CRUD (admin only) | Submissions, grading |
| `QuestionsModule` | Question CRUD under an exam | Submissions, correct answers in student responses |
| `SubmissionsModule` | Exam sessions, autosave, submit, grading, randomization | Exam metadata CRUD |
| `ResultsModule` | Reading scores and submission details | Writing any data |
| `Gateway` | WebSocket events for admin live monitoring | Business logic |

### Global setup in `main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true });

  // Global validation pipe — strip unknown fields, transform types
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Global response serialization — strips @Exclude() fields
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Global prefix
  app.setGlobalPrefix('api/v1');

  await app.listen(process.env.PORT ?? 3001);
}
```

---

## 6. API Routes — Complete Reference

All routes are prefixed with `/api/v1`. Auth routes require no token. All other routes require `Authorization: Bearer <token>` header.

### Auth

| Method | Path | Guard | Description |
|---|---|---|---|
| POST | `/auth/register` | None | Register a new student |
| POST | `/auth/login` | None | Login, returns JWT |
| GET | `/auth/me` | JWT | Returns current user profile |

### Exams (Admin)

| Method | Path | Guard | Description |
|---|---|---|---|
| POST | `/exams` | JWT + Admin | Create exam |
| GET | `/exams` | JWT + Admin | List all exams |
| GET | `/exams/:id` | JWT + Admin | Get exam detail |
| PATCH | `/exams/:id` | JWT + Admin | Update exam |
| DELETE | `/exams/:id` | JWT + Admin | Delete exam |
| PATCH | `/exams/:id/publish` | JWT + Admin | Publish exam (make visible to students) |

### Questions (Admin)

| Method | Path | Guard | Description |
|---|---|---|---|
| POST | `/exams/:examId/questions` | JWT + Admin | Add question to exam |
| GET | `/exams/:examId/questions` | JWT + Admin | List all questions (includes correct answers) |
| PATCH | `/exams/:examId/questions/:id` | JWT + Admin | Update question |
| DELETE | `/exams/:examId/questions/:id` | JWT + Admin | Delete question |

### Exams (Student)

| Method | Path | Guard | Description |
|---|---|---|---|
| GET | `/student/exams` | JWT + Student | List available (published, within window) exams |
| GET | `/student/exams/:id` | JWT + Student | Get exam metadata (no questions, no answers) |

### Exam Sessions (Student — Exam Engine)

| Method | Path | Guard | Description |
|---|---|---|---|
| POST | `/submissions/start/:examId` | JWT + Student | Start exam. Returns submission ID + randomized questions (no correct answers) |
| PATCH | `/submissions/:id/autosave` | JWT + Student | Save current answers + flagged questions. Returns remaining seconds. |
| POST | `/submissions/:id/submit` | JWT + Student | Final submit. Server grades and returns score. |
| POST | `/submissions/:id/violation` | JWT + Student | Report a violation event (tab switch, fullscreen exit). |

### Results

| Method | Path | Guard | Description |
|---|---|---|---|
| GET | `/results/my` | JWT + Student | Student's own past submissions |
| GET | `/results/:submissionId` | JWT | Get a specific result (student sees own only, admin sees all) |
| GET | `/admin/results` | JWT + Admin | All submissions across all exams |
| GET | `/admin/results/exam/:examId` | JWT + Admin | All submissions for a specific exam |

---

## 7. Exam Engine — Critical Logic

> This section is the most important in the file. Read it carefully. Implement it exactly.

### 7.1 Starting an exam — `POST /submissions/start/:examId`

Execute these steps **in order**, inside a **database transaction**:

1. **Eligibility check** — verify:
   - Exam exists and `isPublished === true`
   - Current time is within `exam.startTime` and `exam.endTime` (if set)
   - No existing submission exists for this `(student, exam)` pair with status `in_progress`, `submitted`, `timed_out`, or `force_submitted`
   - If any check fails → throw `ForbiddenException` with a clear message

2. **Fetch all questions** for this exam — only `id`, `questionText`, `options`, `marks`, `orderIndex`. Never fetch `correctAnswer` in this path.

3. **Randomize question order** using Fisher-Yates shuffle. Store the resulting array of question IDs as `questionOrder` in the new submission row.

4. **Create the submission row** with:
   - `status: 'in_progress'`
   - `startedAt: new Date()` — server time
   - `answers: {}`
   - `flaggedQuestions: []`
   - `violations: 0`
   - `questionOrder: <shuffled id array>`

5. **Return** to the client:
   ```json
   {
     "submissionId": "uuid",
     "examTitle": "...",
     "durationMinutes": 60,
     "startedAt": "ISO timestamp",
     "remainingSeconds": 3600,
     "questions": [
       {
         "id": "uuid",
         "questionText": "...",
         "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
         "marks": 1
       }
     ]
   }
   ```
   Questions must be returned **in the randomized order** stored in `questionOrder`. Never return `correctAnswer`.

### 7.2 Autosave — `PATCH /submissions/:id/autosave`

This endpoint is called every 3–5 seconds by the client. It must be fast and idempotent.

```
Request body: {
  answers: Record<string, 'A' | 'B' | 'C' | 'D'>,
  flaggedQuestions: string[]
}
```

Steps:
1. Fetch the submission. Verify `submission.student.id === req.user.id`. Throw `ForbiddenException` if not.
2. Verify `submission.status === 'in_progress'`. If `submitted`, `timed_out`, or `force_submitted` → return `409 Conflict` with `{ message: 'Exam already closed', status: submission.status }`.
3. **Calculate remaining time**: `remainingSeconds = (submission.startedAt + exam.durationMinutes * 60) - now()` (all in seconds).
4. If `remainingSeconds <= 0` → trigger auto-submit (see 7.4). Do NOT save the answers. Return `{ status: 'timed_out', score, totalMarks }`.
5. **Merge** incoming `answers` with existing `submission.answers` using object spread: `{ ...submission.answers, ...incomingAnswers }`. Never replace wholesale — merge so partial saves don't wipe previous answers.
6. Update `flaggedQuestions` (replace entirely — client sends the full current list).
7. Save using upsert/update: `UPDATE submissions SET answers = $1, flagged_questions = $2, updated_at = now() WHERE id = $3`.
8. Return: `{ remainingSeconds, savedAt: ISO timestamp }`.

**Rate limit this endpoint**: max 30 requests per minute per user. Use `express-rate-limit` or NestJS throttler.

### 7.3 Final Submit — `POST /submissions/:id/submit`

1. Fetch submission + exam + all questions (including `correctAnswer` this time).
2. Verify ownership and `status === 'in_progress'`. If already closed → return `409` with current status.
3. **Merge final answers** from request body (same merge logic as autosave).
4. **Grade**: iterate over `submission.questionOrder`. For each questionId, compare `submission.answers[questionId]` to `question.correctAnswer`. Sum marks for correct answers.
5. Set `submission.status = 'submitted'`, `submittedAt = new Date()`, `score = calculated`, `totalMarks = sum of all question marks`.
6. Save. Return: `{ score, totalMarks, percentage, submittedAt }`.

### 7.4 Auto-Submit — Server-Side Timeout Enforcement

Auto-submit is triggered in two places:
- Inside the autosave endpoint when `remainingSeconds <= 0`
- Via a scheduled job (see below)

**Auto-submit procedure** (extract to a shared private method `forceSubmit(submissionId, reason)`):
1. Fetch submission with questions (including `correctAnswer`).
2. Check `status === 'in_progress'` — if not, return early (idempotent).
3. Grade using existing `answers` (whatever was last saved).
4. Set `status = reason === 'timeout' ? 'timed_out' : 'force_submitted'`, `autoSubmitted = true`, `submittedAt = now()`, `score`, `totalMarks`.
5. Save.

**Scheduled cleanup job** — use `@nestjs/schedule` with a cron every 60 seconds:
```typescript
@Cron('0 * * * * *') // Every 60 seconds
async handleExpiredSessions() {
  const expiredSubmissions = await this.submissionsRepo
    .createQueryBuilder('s')
    .innerJoinAndSelect('s.exam', 'e')
    .where('s.status = :status', { status: 'in_progress' })
    .andWhere('s.startedAt + (e.durationMinutes * interval \'1 minute\') < NOW()')
    .getMany();

  for (const submission of expiredSubmissions) {
    await this.forceSubmit(submission.id, 'timeout');
  }
}
```

### 7.5 Remaining Time Calculation

**Always calculate on the server. Never trust the client.**

```typescript
getRemainingSeconds(submission: Submission, exam: Exam): number {
  const examEndTime = new Date(submission.startedAt.getTime() + exam.durationMinutes * 60 * 1000);
  const remaining = Math.floor((examEndTime.getTime() - Date.now()) / 1000);
  return Math.max(0, remaining);
}
```

Return `remainingSeconds` in every autosave response. The client must reconcile its display timer with this value on every autosave response.

### 7.6 Concurrency — Race Conditions

The following race condition MUST be handled:

> Student submits manually at the exact moment the scheduled job auto-submits.

Solution: Use a **database-level optimistic lock** on the final status update:

```typescript
const result = await this.submissionsRepo
  .createQueryBuilder()
  .update(Submission)
  .set({ status: newStatus, score, totalMarks, submittedAt: new Date(), autoSubmitted })
  .where('id = :id AND status = :currentStatus', { id: submission.id, currentStatus: 'in_progress' })
  .execute();

if (result.affected === 0) {
  // Another process already closed this submission — return the existing result
  return this.submissionsRepo.findOne({ where: { id: submission.id } });
}
```

This ensures only one process can close a submission, even under concurrent requests.

---

## 8. Auth System

### JWT Configuration

```typescript
JwtModule.registerAsync({
  useFactory: (config: ConfigService) => ({
    secret: config.get('JWT_SECRET'),
    signOptions: { expiresIn: '8h' },
  }),
  inject: [ConfigService],
})
```

### JWT Payload shape

```typescript
interface JwtPayload {
  sub: string;      // user.id (UUID)
  email: string;
  role: 'student' | 'admin';
  iat: number;
  exp: number;
}
```

### Roles Guard

```typescript
// Apply to any controller or handler:
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
```

The `RolesGuard` reads the role from `req.user.role` (populated by `JwtStrategy`). Throw `ForbiddenException` if role does not match.

### Password requirements

- Minimum 8 characters — enforce in `RegisterDto` using `@MinLength(8)`
- Hash with `bcrypt.hash(password, 12)` — salt rounds = 12
- Never log or return the password field — use `@Exclude()` on `User.password`

### Register endpoint

Registration is open (any user can register). Role defaults to `'student'`. Admin accounts are created manually or via a seeder — never via the public register endpoint.

---

## 9. Anti-Cheating System

### 9.1 Frontend Enforcement (Client-Side — Not Trusted, but Still Required)

Implement in the exam page component. These events are enforced on the client and reported to the server:

**Tab / window visibility:**
```typescript
document.addEventListener('visibilitychange', () => {
  if (document.hidden) reportViolation('tab_switch');
});
```

**Fullscreen exit:**
```typescript
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) reportViolation('fullscreen_exit');
});
```

**Context menu / right-click:**
```typescript
document.addEventListener('contextmenu', (e) => e.preventDefault());
```

**Copy/paste:**
```typescript
document.addEventListener('copy', (e) => e.preventDefault());
document.addEventListener('paste', (e) => e.preventDefault());
```

**Keyboard shortcuts:**
```typescript
document.addEventListener('keydown', (e) => {
  // Block: Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+U, F12, Ctrl+Shift+I
  if (
    (e.ctrlKey && ['c','v','a','u'].includes(e.key.toLowerCase())) ||
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && e.key === 'I')
  ) {
    e.preventDefault();
  }
});
```

### 9.2 Violation Reporting — `POST /submissions/:id/violation`

```
Request body: {
  type: 'tab_switch' | 'fullscreen_exit'
}
```

Server steps:
1. Verify ownership and `status === 'in_progress'`.
2. Increment `submission.violations += 1`.
3. If `submission.violations >= exam.maxViolations` → call `forceSubmit(submission.id, 'violations')`.
4. Return: `{ violations: newCount, maxViolations: exam.maxViolations, autoSubmitted: boolean }`.

### 9.3 ViolationOverlay Component (Frontend)

When `violations > 0` but below threshold, show a non-dismissable warning overlay:
```
"Warning: Leaving the exam window is not allowed.
 Violation {n} of {max}. Further violations will auto-submit your exam."
```

When `autoSubmitted === true` in the violation response, redirect to the results page immediately.

### 9.4 Server-Side Trust

The server validates on every autosave and submit:
- Student owns the submission
- Exam window is still open (time not expired)
- Status is `in_progress`

It does NOT trust:
- Client-reported time
- Client-reported score
- Client-reported question order

---

## 10. Frontend — Next.js

### 10.1 Exam Page — `app/(student)/exam/[examId]/page.tsx`

This is the most critical frontend component. It must:

1. **On mount**: call `POST /submissions/start/:examId`. Store `submissionId`, `questions`, `remainingSeconds`, `startedAt` in Zustand store.
2. **Timer**: Use a `setInterval` countdown locally for display. On every autosave response, **reconcile** the local timer with `remainingSeconds` from the server: `setLocalRemaining(serverRemainingSeconds)`. This prevents drift from page refreshes or network delays.
3. **Autosave**: Call `PATCH /submissions/:id/autosave` every 4 seconds with current `answers` and `flaggedQuestions`. Handle `409` response by redirecting to results (exam already closed).
4. **Fullscreen**: Request fullscreen on exam start: `document.documentElement.requestFullscreen()`. Show a modal if the user denies fullscreen.
5. **Anti-cheat listeners**: Attach all event listeners from section 9.1 on mount. Remove on unmount.
6. **Submit button**: Calls `POST /submissions/:id/submit` with final answers. On success → redirect to `/dashboard?submitted=true`.
7. **Auto-redirect**: When local timer hits 0 or server returns `timed_out` → redirect to dashboard.

### 10.2 Zustand Exam Store — `lib/store/examStore.ts`

```typescript
interface ExamStore {
  submissionId: string | null;
  questions: Question[];
  answers: Record<string, string>;
  flaggedQuestions: string[];
  remainingSeconds: number;
  status: 'idle' | 'in_progress' | 'submitted' | 'timed_out';

  setAnswer: (questionId: string, answer: string) => void;
  toggleFlag: (questionId: string) => void;
  setRemainingSeconds: (seconds: number) => void;
  resetExam: () => void;
}
```

State lives in memory only — do not persist to `localStorage`. If the student refreshes, they must re-call `start` which will return the existing `in_progress` submission (not create a new one).

### 10.3 Re-entry After Refresh

When `POST /submissions/start/:examId` is called and an `in_progress` submission already exists:
- **Do not throw an error**
- Return the existing submission data (same format as a new start)
- Recalculate `remainingSeconds` from `startedAt`

This allows the student to refresh without losing their session.

### 10.4 API Client — `lib/api.ts`

```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);
```

---

## 11. Security Requirements

### Must implement in MVP

| Requirement | Where |
|---|---|
| Helmet HTTP headers | `main.ts` |
| CORS restricted to `FRONTEND_URL` | `main.ts` |
| JWT on all protected routes | `JwtAuthGuard` |
| Role-based access | `RolesGuard` |
| Input validation + stripping | `ValidationPipe` with `whitelist: true` |
| `@Exclude()` on `correctAnswer` in student responses | `Question` entity + `ClassSerializerInterceptor` |
| `@Exclude()` on `password` in all user responses | `User` entity |
| Rate limiting on autosave | 30 req/min per user |
| Rate limiting on login | 10 req/min per IP |
| Server-side exam window validation | `ExamSessionService` |
| Server-side ownership check on every submission endpoint | `ExamSessionService` |
| One attempt enforcement via DB query before start | `ExamSessionService` |
| Optimistic lock on submission close | `forceSubmit()` method |
| bcrypt cost factor 12 | `UsersService` |

### Must NOT do

- Never return `correctAnswer` to students in any endpoint
- Never trust `remainingSeconds` from the client
- Never trust `score` from the client
- Never let the client choose their `questionOrder`
- Never store plaintext passwords

---

## 12. Environment Variables

### Backend (`apps/api/.env`)

```env
NODE_ENV=development
PORT=3001
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=cbt_user
DB_PASSWORD=cbt_password
DB_NAME=cbt_db
JWT_SECRET=<strong-random-secret-min-64-chars>
JWT_EXPIRES_IN=8h
FRONTEND_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### Docker Compose services

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: cbt_user
      POSTGRES_PASSWORD: cbt_password
      POSTGRES_DB: cbt_db
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

---

## 13. Error Handling Contract

All API errors return this shape:

```json
{
  "statusCode": 400,
  "message": "Human-readable error description",
  "error": "Bad Request"
}
```

Use NestJS built-in exceptions:

| Scenario | Exception |
|---|---|
| Invalid input | `BadRequestException` |
| Not authenticated | `UnauthorizedException` |
| Wrong role, not owner | `ForbiddenException` |
| Resource not found | `NotFoundException` |
| Exam already submitted | `ConflictException` |
| Exam window closed | `ForbiddenException` |

Never return stack traces in production. Set `NODE_ENV=production` to suppress them.

---

## 14. Execution Order for Agents

Build in this exact order. Do not skip ahead. Each phase depends on the previous.

### Phase 1 — Infrastructure
- [ ] `docker-compose.yml` with PostgreSQL and Redis
- [ ] `apps/api/` NestJS project scaffold (`nest new`)
- [ ] `apps/web/` Next.js project scaffold (`create-next-app`)
- [ ] TypeORM config connected to PostgreSQL
- [ ] All four entities defined with decorators
- [ ] Initial migration generated and run
- [ ] UUID extension enabled in DB

### Phase 2 — Auth
- [ ] `UsersModule` with `User` entity and `UsersService`
- [ ] `AuthModule` with register + login endpoints
- [ ] JWT strategy and `JwtAuthGuard`
- [ ] `RolesGuard` and `@Roles()` decorator
- [ ] `POST /auth/register` and `POST /auth/login` working
- [ ] `GET /auth/me` working

### Phase 3 — Exam & Question CRUD (Admin)
- [ ] `ExamsModule` — full CRUD + publish endpoint
- [ ] `QuestionsModule` — CRUD under exam
- [ ] All admin routes guarded with `@Roles('admin')`
- [ ] `correctAnswer` excluded from student-facing serialization

### Phase 4 — Exam Engine
- [ ] `RandomizerService` — Fisher-Yates shuffle
- [ ] `ExamSessionService` — start exam (with eligibility checks + transaction)
- [ ] `ExamSessionService` — autosave (merge logic + remaining time)
- [ ] `ExamSessionService` — submit (grade + close)
- [ ] `ExamSessionService` — `forceSubmit()` with optimistic lock
- [ ] Scheduled job for expired sessions
- [ ] Violation endpoint

### Phase 5 — Results
- [ ] `ResultsModule` — student's own results
- [ ] Admin results endpoints

### Phase 6 — Frontend
- [ ] Auth pages (login, register) + token storage
- [ ] Student dashboard — list available exams
- [ ] Exam page — full implementation per section 10.1
- [ ] `ExamTimer` component with server reconciliation
- [ ] `QuestionNavigator` component
- [ ] Anti-cheat event listeners
- [ ] `ViolationOverlay` component
- [ ] Admin dashboard — exam CRUD UI
- [ ] Admin question management UI
- [ ] Results pages (student + admin)

### Phase 7 — Hardening
- [ ] Rate limiting on autosave and login
- [ ] Helmet + CORS config
- [ ] Global exception filter
- [ ] Input validation on all DTOs
- [ ] End-to-end test: start → autosave × 3 → submit → verify score

---

## 15. Decisions Already Made — Do Not Re-Decide

These decisions are final. Do not propose alternatives or ask for clarification on these:

| Decision | Rationale |
|---|---|
| Timer authority = server, using `startedAt` timestamp math | Simpler and more reliable than WebSocket clock sync |
| WebSocket = admin monitoring only, not timer | Avoids complexity. Timer works without WebSocket. |
| Question randomization stored as `questionOrder` JSON array | Auditable, simple, no seed fragility |
| Answers stored as merged JSON map per submission | Single row per student per exam, efficient upsert |
| Auto-submit uses optimistic DB lock (`WHERE status = 'in_progress'`) | Prevents double-close race condition |
| Autosave merges (spread) rather than replaces answers | Prevents data loss from partial payloads |
| No offline mode in MVP | Complexity deferred |
| No AI proctoring in MVP | Complexity deferred |
| NestJS (not Express) | Structure, DI, decorators, TypeORM integration |
| Next.js App Router (not Pages Router) | Modern, server components available |
| UUID primary keys | No enumeration attacks |
| bcrypt cost 12 | Balance of security and performance |
| `timestamptz` for all timestamps | Timezone correctness |

---

## 16. Known Edge Cases — Handle All of These

| Edge Case | Required Handling |
|---|---|
| Student refreshes during exam | `start` endpoint returns existing `in_progress` session, recalculates `remainingSeconds` |
| Student submits while server auto-submits simultaneously | Optimistic lock on status field — first writer wins, second returns existing result |
| Student calls autosave after exam closes | Return `409 Conflict` with final status — do not throw 500 |
| Student tries to start same exam twice | Return `409 Conflict` with `{ message: 'Exam already started', submissionId }` |
| Exam has no questions | Block publish — `isPublished` can only be set to `true` if exam has at least 1 question |
| Admin deletes question after exam starts | `questionOrder` still references deleted question ID. Grader must skip missing questions (treat as unanswered) |
| Network failure during autosave | Client retries with same payload. Server merge is idempotent. |
| `remainingSeconds` returns 0 on autosave | Server triggers `forceSubmit`, returns `{ status: 'timed_out', score, totalMarks }` |
| Student answers all questions then waits | Final autosave before timeout captures all answers. Scheduled job grades on timeout. |
| Violation count hits threshold mid-autosave | Violation endpoint closes exam. Next autosave returns 409. |
| Admin updates exam duration after students started | `startedAt` is fixed. Remaining time = `startedAt + NEW duration - now`. Duration change affects ongoing sessions. This is by design — admin responsibility. |

---

## 17. What NOT to Build in MVP

The following are explicitly out of scope. Do not implement or scaffold them:

- Webcam / video proctoring
- AI behavior analysis
- Offline / service worker exam mode
- Dedicated lockdown browser (Electron app)
- Multi-school / SaaS multi-tenancy
- Real-time admin live monitoring dashboard (WebSocket gateway can be scaffolded but UI is not required)
- Email verification on registration
- Password reset flow
- Bulk question CSV import
- Analytics / performance insights dashboard
- Mobile app

---

*End of AGENTS.md*
*Last updated: by Claude — based on full CBT platform architectural review.*
*Any change to this file should be reflected in code, and any change to core architecture should be reflected here first.*
