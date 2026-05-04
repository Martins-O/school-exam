import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateClassEntities1777707000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create classes table
        await queryRunner.query(`
            CREATE TABLE "classes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying(100) NOT NULL,
                "description" text,
                "createdById" uuid,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_classes" PRIMARY KEY ("id"),
                CONSTRAINT "FK_classes_createdBy" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);

        // Create class_students table
        await queryRunner.query(`
            CREATE TABLE "class_students" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "classId" uuid NOT NULL,
                "studentId" uuid NOT NULL,
                "enrolledAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_class_students" PRIMARY KEY ("id"),
                CONSTRAINT "FK_class_students_class" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_class_students_student" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_class_student_unique" UNIQUE ("classId", "studentId")
            )
        `);

        // Create teacher_classes table
        await queryRunner.query(`
            CREATE TABLE "teacher_classes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "classId" uuid NOT NULL,
                "teacherId" uuid NOT NULL,
                "assignedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_teacher_classes" PRIMARY KEY ("id"),
                CONSTRAINT "FK_teacher_classes_class" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_teacher_classes_teacher" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "UQ_teacher_class_unique" UNIQUE ("classId", "teacherId")
            )
        `);

        // Add targetClasses to exams table
        await queryRunner.query(`CREATE TABLE "exam_target_classes" ("examId" uuid NOT NULL, "classId" uuid NOT NULL, CONSTRAINT "FK_exam_target_classes_exam" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE, CONSTRAINT "FK_exam_target_classes_class" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE, CONSTRAINT "PK_exam_target_classes" PRIMARY KEY ("examId", "classId"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "exam_target_classes"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "teacher_classes"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "class_students"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "classes"`);
    }
}
