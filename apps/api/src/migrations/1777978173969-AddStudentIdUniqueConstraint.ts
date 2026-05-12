import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStudentIdUniqueConstraint1777978173969 implements MigrationInterface {
    name = 'AddStudentIdUniqueConstraint1777978173969'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transcripts" DROP CONSTRAINT "FK_transcripts_student"`);
        await queryRunner.query(`ALTER TABLE "transcripts" DROP CONSTRAINT "FK_transcripts_generatedBy"`);
        await queryRunner.query(`ALTER TABLE "classes" DROP CONSTRAINT "FK_classes_createdBy"`);
        await queryRunner.query(`ALTER TABLE "question_categories" DROP CONSTRAINT "FK_question_categories_createdBy"`);
        await queryRunner.query(`ALTER TABLE "parent_students" DROP CONSTRAINT "FK_parent_students_parent"`);
        await queryRunner.query(`ALTER TABLE "parent_students" DROP CONSTRAINT "FK_parent_students_student"`);
        await queryRunner.query(`ALTER TABLE "teacher_classes" DROP CONSTRAINT "FK_teacher_classes_class"`);
        await queryRunner.query(`ALTER TABLE "teacher_classes" DROP CONSTRAINT "FK_teacher_classes_teacher"`);
        await queryRunner.query(`ALTER TABLE "class_students" DROP CONSTRAINT "FK_class_students_class"`);
        await queryRunner.query(`ALTER TABLE "class_students" DROP CONSTRAINT "FK_class_students_student"`);
        await queryRunner.query(`ALTER TABLE "exam_target_classes" DROP CONSTRAINT "FK_exam_target_classes_exam"`);
        await queryRunner.query(`ALTER TABLE "exam_target_classes" DROP CONSTRAINT "FK_exam_target_classes_class"`);
        await queryRunner.query(`ALTER TABLE "parent_students" DROP CONSTRAINT "UQ_parent_student_unique"`);
        await queryRunner.query(`ALTER TABLE "teacher_classes" DROP CONSTRAINT "UQ_teacher_class_unique"`);
        await queryRunner.query(`ALTER TABLE "class_students" DROP CONSTRAINT "UQ_class_student_unique"`);
        await queryRunner.query(`CREATE TABLE "questions_categories_question_categories" ("questionsId" uuid NOT NULL, "questionCategoriesId" uuid NOT NULL, CONSTRAINT "PK_e9972344404b6763efc7d5eb99d" PRIMARY KEY ("questionsId", "questionCategoriesId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7333fb31d3e98406a2230886a5" ON "questions_categories_question_categories" ("questionsId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ae8573e3cc792c1da46c2b4958" ON "questions_categories_question_categories" ("questionCategoriesId") `);
        await queryRunner.query(`ALTER TABLE "classes" ALTER COLUMN "createdById" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "question_categories" ALTER COLUMN "createdById" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD CONSTRAINT "UQ_4e9a9986dd87d6448440f840144" UNIQUE ("studentId")`);
        await queryRunner.query(`CREATE INDEX "IDX_5e348c17d74ef44ff669a7ade7" ON "exam_target_classes" ("examId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f6ef7b91d435937d5b82b0d277" ON "exam_target_classes" ("classId") `);
        await queryRunner.query(`ALTER TABLE "users" ADD COLUMN "createdById" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_51d635f1d983d505fb5a2f44c52" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transcripts" ADD CONSTRAINT "FK_fafa206fa28552793ed9e3f3bd5" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transcripts" ADD CONSTRAINT "FK_f0e77dcedb3de39f5539c96b01f" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "classes" ADD CONSTRAINT "FK_38f8de3ee0fa4d0342572070dd7" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_categories" ADD CONSTRAINT "FK_4c49e0535fb1008da59bfb87fa3" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "parent_students" ADD CONSTRAINT "FK_d75bfe2068e448c910ba1296116" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "parent_students" ADD CONSTRAINT "FK_e5eaa6a5814ca0b7add6c47b90c" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teacher_classes" ADD CONSTRAINT "FK_d297dd8fa5ebc846ea6e2b606de" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teacher_classes" ADD CONSTRAINT "FK_3cc662aba5923bce09382a9acc8" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD CONSTRAINT "FK_8077e3550bf215749c0cdd138c2" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD CONSTRAINT "FK_4e9a9986dd87d6448440f840144" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exam_target_classes" ADD CONSTRAINT "FK_5e348c17d74ef44ff669a7ade7a" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "exam_target_classes" ADD CONSTRAINT "FK_f6ef7b91d435937d5b82b0d2771" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "questions_categories_question_categories" ADD CONSTRAINT "FK_7333fb31d3e98406a2230886a58" FOREIGN KEY ("questionsId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "questions_categories_question_categories" ADD CONSTRAINT "FK_ae8573e3cc792c1da46c2b49583" FOREIGN KEY ("questionCategoriesId") REFERENCES "question_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "questions_categories_question_categories" DROP CONSTRAINT "FK_ae8573e3cc792c1da46c2b49583"`);
        await queryRunner.query(`ALTER TABLE "questions_categories_question_categories" DROP CONSTRAINT "FK_7333fb31d3e98406a2230886a58"`);
        await queryRunner.query(`ALTER TABLE "exam_target_classes" DROP CONSTRAINT "FK_f6ef7b91d435937d5b82b0d2771"`);
        await queryRunner.query(`ALTER TABLE "exam_target_classes" DROP CONSTRAINT "FK_5e348c17d74ef44ff669a7ade7a"`);
        await queryRunner.query(`ALTER TABLE "class_students" DROP CONSTRAINT "FK_4e9a9986dd87d6448440f840144"`);
        await queryRunner.query(`ALTER TABLE "class_students" DROP CONSTRAINT "FK_8077e3550bf215749c0cdd138c2"`);
        await queryRunner.query(`ALTER TABLE "teacher_classes" DROP CONSTRAINT "FK_3cc662aba5923bce09382a9acc8"`);
        await queryRunner.query(`ALTER TABLE "teacher_classes" DROP CONSTRAINT "FK_d297dd8fa5ebc846ea6e2b606de"`);
        await queryRunner.query(`ALTER TABLE "parent_students" DROP CONSTRAINT "FK_e5eaa6a5814ca0b7add6c47b90c"`);
        await queryRunner.query(`ALTER TABLE "parent_students" DROP CONSTRAINT "FK_d75bfe2068e448c910ba1296116"`);
        await queryRunner.query(`ALTER TABLE "question_categories" DROP CONSTRAINT "FK_4c49e0535fb1008da59bfb87fa3"`);
        await queryRunner.query(`ALTER TABLE "classes" DROP CONSTRAINT "FK_38f8de3ee0fa4d0342572070dd7"`);
        await queryRunner.query(`ALTER TABLE "transcripts" DROP CONSTRAINT "FK_f0e77dcedb3de39f5539c96b01f"`);
        await queryRunner.query(`ALTER TABLE "transcripts" DROP CONSTRAINT "FK_fafa206fa28552793ed9e3f3bd5"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_51d635f1d983d505fb5a2f44c52"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f6ef7b91d435937d5b82b0d277"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5e348c17d74ef44ff669a7ade7"`);
        await queryRunner.query(`ALTER TABLE "class_students" DROP CONSTRAINT "UQ_4e9a9986dd87d6448440f840144"`);
        await queryRunner.query(`ALTER TABLE "question_categories" ALTER COLUMN "createdById" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "classes" ALTER COLUMN "createdById" DROP NOT NULL`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ae8573e3cc792c1da46c2b4958"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7333fb31d3e98406a2230886a5"`);
        await queryRunner.query(`DROP TABLE "questions_categories_question_categories"`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD CONSTRAINT "UQ_class_student_unique" UNIQUE ("classId", "studentId")`);
        await queryRunner.query(`ALTER TABLE "teacher_classes" ADD CONSTRAINT "UQ_teacher_class_unique" UNIQUE ("classId", "teacherId")`);
        await queryRunner.query(`ALTER TABLE "parent_students" ADD CONSTRAINT "UQ_parent_student_unique" UNIQUE ("parentId", "studentId")`);
        await queryRunner.query(`ALTER TABLE "exam_target_classes" ADD CONSTRAINT "FK_exam_target_classes_class" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "exam_target_classes" ADD CONSTRAINT "FK_exam_target_classes_exam" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD CONSTRAINT "FK_class_students_student" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD CONSTRAINT "FK_class_students_class" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teacher_classes" ADD CONSTRAINT "FK_teacher_classes_teacher" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teacher_classes" ADD CONSTRAINT "FK_teacher_classes_class" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "parent_students" ADD CONSTRAINT "FK_parent_students_student" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "parent_students" ADD CONSTRAINT "FK_parent_students_parent" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "question_categories" ADD CONSTRAINT "FK_question_categories_createdBy" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "classes" ADD CONSTRAINT "FK_classes_createdBy" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transcripts" ADD CONSTRAINT "FK_transcripts_generatedBy" FOREIGN KEY ("generatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "transcripts" ADD CONSTRAINT "FK_transcripts_student" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
