import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQuestionCategories1777707000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create question_categories table
        await queryRunner.query(`
            CREATE TABLE "question_categories" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "description" text,
                "createdById" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_question_categories" PRIMARY KEY ("id"),
                CONSTRAINT "FK_question_categories_createdBy" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);

        // Create question_question_categories join table
        await queryRunner.query(`
            CREATE TABLE "question_question_categories" (
                "questionId" uuid NOT NULL,
                "questionCategoryId" uuid NOT NULL,
                CONSTRAINT "FK_question_question_categories_question" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_question_question_categories_category" FOREIGN KEY ("questionCategoryId") REFERENCES "question_categories"("id") ON DELETE CASCADE,
                CONSTRAINT "PK_question_question_categories" PRIMARY KEY ("questionId", "questionCategoryId")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "question_question_categories"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "question_categories"`);
    }
}
