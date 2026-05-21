import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateClassStudentHistory1779364647039 implements MigrationInterface {
    name = 'UpdateClassStudentHistory1779364647039'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_students" DROP CONSTRAINT "UQ_class_student_unique"`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD "unenrolledAt" TIMESTAMP WITH TIME ZONE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_students" DROP COLUMN "unenrolledAt"`);
        await queryRunner.query(`ALTER TABLE "class_students" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD CONSTRAINT "UQ_class_student_unique" UNIQUE ("classId", "studentId")`);
    }

}
