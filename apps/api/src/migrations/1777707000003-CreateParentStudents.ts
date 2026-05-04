import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateParentStudents1777707000003 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create parent_students table
        await queryRunner.query(`
            CREATE TABLE "parent_students" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "parentId" uuid NOT NULL,
                "studentId" uuid NOT NULL,
                "isActive" boolean NOT NULL DEFAULT true,
                "linkedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_parent_students" PRIMARY KEY ("id"),
                CONSTRAINT "FK_parent_students_parent" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_parent_students_student" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_parent_student_unique" UNIQUE ("parentId", "studentId")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "parent_students"`);
    }
}
