import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTranscripts1777707000004 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "transcripts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "studentId" uuid NOT NULL,
                "generatedById" uuid,
                "periodStart" TIMESTAMPTZ NOT NULL,
                "periodEnd" TIMESTAMPTZ,
                "results" jsonb NOT NULL DEFAULT '[]',
                "averageScore" numeric(5,2) NOT NULL DEFAULT 0,
                "comments" text,
                "isFinalized" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_transcripts" PRIMARY KEY ("id"),
                CONSTRAINT "FK_transcripts_student" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_transcripts_generatedBy" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "transcripts"`);
    }
}
