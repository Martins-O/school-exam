import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTheoryQuestionSupport1777979621716 implements MigrationInterface {
    name = 'AddTheoryQuestionSupport1777979621716'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question_question_categories" DROP CONSTRAINT "FK_question_question_categories_category"`);
        await queryRunner.query(`ALTER TABLE "question_question_categories" DROP CONSTRAINT "FK_question_question_categories_question"`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "questionScores" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`CREATE TYPE "public"."submissions_gradingstatus_enum" AS ENUM('auto_graded', 'pending_manual', 'fully_graded')`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "gradingStatus" "public"."submissions_gradingstatus_enum" NOT NULL DEFAULT 'auto_graded'`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "finalScore" integer`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "gradingFeedback" text`);
        await queryRunner.query(`ALTER TABLE "submissions" ADD "gradedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE TYPE "public"."questions_type_enum" AS ENUM('objective', 'theory')`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "type" "public"."questions_type_enum" NOT NULL DEFAULT 'objective'`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "pdfAttachment" text`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "maxWordCount" integer`);
        await queryRunner.query(`ALTER TABLE "questions" ADD "passageText" text`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "options" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "correctAnswer" DROP NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_4845bc2dc5a4da316243e1f713" ON "question_question_categories" ("questionId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9db1cc3220c23e9adabb629db8" ON "question_question_categories" ("questionCategoryId") `);
        await queryRunner.query(`ALTER TABLE "question_question_categories" ADD CONSTRAINT "FK_4845bc2dc5a4da316243e1f7139" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "question_question_categories" ADD CONSTRAINT "FK_9db1cc3220c23e9adabb629db8c" FOREIGN KEY ("questionCategoryId") REFERENCES "question_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question_question_categories" DROP CONSTRAINT "FK_9db1cc3220c23e9adabb629db8c"`);
        await queryRunner.query(`ALTER TABLE "question_question_categories" DROP CONSTRAINT "FK_4845bc2dc5a4da316243e1f7139"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9db1cc3220c23e9adabb629db8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4845bc2dc5a4da316243e1f713"`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "correctAnswer" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "options" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "passageText"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "maxWordCount"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "pdfAttachment"`);
        await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."questions_type_enum"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "gradedAt"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "gradingFeedback"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "finalScore"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "gradingStatus"`);
        await queryRunner.query(`DROP TYPE "public"."submissions_gradingstatus_enum"`);
        await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "questionScores"`);
        await queryRunner.query(`ALTER TABLE "question_question_categories" ADD CONSTRAINT "FK_question_question_categories_question" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_question_categories" ADD CONSTRAINT "FK_question_question_categories_category" FOREIGN KEY ("questionCategoryId") REFERENCES "question_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
