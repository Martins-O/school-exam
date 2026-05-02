import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserRoles1777707000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // This migration was already applied manually
        // The users table now has:
        // - role enum: 'super_admin', 'administrator', 'teacher', 'student', 'parent'
        // - createdById column with foreign key
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert is complex - would need to recreate old enum
        // Skipping for now since this was a manual migration
    }
}
