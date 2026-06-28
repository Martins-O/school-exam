import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePasswordResetToken1782664470179 implements MigrationInterface {
    name = 'CreatePasswordResetToken1782664470179'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "password_reset_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(150) NOT NULL, "token" character varying(255) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "usedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_2ecfa961f2f3e33fff8e19b6c7" ON "password_reset_tokens" ("email") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_2ecfa961f2f3e33fff8e19b6c7"`);
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    }

}
