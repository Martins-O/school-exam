import { MigrationInterface, QueryRunner } from "typeorm";

export class SeedAdmin1777706481164 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            INSERT INTO "users" ("name", "email", "password", "role", "isActive")
            VALUES ('Super Admin', 'admin@cbt.com', '$2b$12$OG7X4L.cW3L0MAHtm5Qa7e4busy.mbful4bMXOOspLj.99QEkv1jS', 'super_admin', true)
            ON CONFLICT ("email") DO NOTHING;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "users" WHERE "email" = 'admin@cbt.com'`);
    }
}
