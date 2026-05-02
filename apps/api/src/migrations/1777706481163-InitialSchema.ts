import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1777706481163 implements MigrationInterface {
    name = 'InitialSchema1777706481163'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('student', 'admin')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(100) NOT NULL, "email" character varying(150) NOT NULL, "password" character varying NOT NULL, "role" "public"."users_role_enum" NOT NULL DEFAULT 'student', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "exams" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(200) NOT NULL, "description" text, "durationMinutes" integer NOT NULL, "startTime" TIMESTAMP WITH TIME ZONE, "endTime" TIMESTAMP WITH TIME ZONE, "isPublished" boolean NOT NULL DEFAULT false, "maxViolations" integer NOT NULL DEFAULT '3', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" uuid, CONSTRAINT "PK_b43159ee3efa440952794b4f53e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."submissions_status_enum" AS ENUM('in_progress', 'submitted', 'timed_out', 'force_submitted')`);
        await queryRunner.query(`CREATE TABLE "submissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "questionOrder" jsonb NOT NULL, "answers" jsonb NOT NULL DEFAULT '{}', "flaggedQuestions" jsonb NOT NULL DEFAULT '[]', "status" "public"."submissions_status_enum" NOT NULL, "startedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "submittedAt" TIMESTAMP WITH TIME ZONE, "score" integer, "totalMarks" integer, "violations" integer NOT NULL DEFAULT '0', "autoSubmitted" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "studentId" uuid, "examId" uuid, CONSTRAINT "PK_10b3be95b8b2fb1e482e07d706b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "questionText" text NOT NULL, "options" jsonb NOT NULL, "correctAnswer" character(1) NOT NULL, "marks" integer NOT NULL DEFAULT '1', "orderIndex" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "examId" uuid, CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "exams" ADD CONSTRAINT "FK_05812086a3dfc6ce3b45618ed9c" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_4fc99318a291abd7e2a50f50851" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD CONSTRAINT "FK_f2f7f7ccde3bf5c6f70bd378a94" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "questions" ADD CONSTRAINT "FK_32cd92f2cd6b9438d6425bff0b8" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions" DROP CONSTRAINT "FK_32cd92f2cd6b9438d6425bff0b8"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_f2f7f7ccde3bf5c6f70bd378a94"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_4fc99318a291abd7e2a50f50851"`);
        await queryRunner.query(`ALTER TABLE "exams" DROP CONSTRAINT "FK_05812086a3dfc6ce3b45618ed9c"`);
        await queryRunner.query(`DROP TABLE "questions"`);
        await queryRunner.query(`DROP TABLE "submissions"`);
        await queryRunner.query(`DROP TYPE "public"."submissions_status_enum"`);
        await queryRunner.query(`DROP TABLE "exams"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    }

}
