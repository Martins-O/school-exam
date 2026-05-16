import { MigrationInterface, QueryRunner } from "typeorm";

export class FixClassStudentCompositeUnique1778970000000 implements MigrationInterface {
    name = 'FixClassStudentCompositeUnique1778970000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_students" DROP CONSTRAINT "UQ_4e9a9986dd87d6448440f840144"`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD CONSTRAINT "UQ_class_student_unique" UNIQUE ("classId", "studentId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "class_students" DROP CONSTRAINT "UQ_class_student_unique"`);
        await queryRunner.query(`ALTER TABLE "class_students" ADD CONSTRAINT "UQ_4e9a9986dd87d6448440f840144" UNIQUE ("studentId")`);
    }
}
