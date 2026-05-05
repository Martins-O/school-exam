import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config({ path: '.env' });

async function cleanDatabase() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await dataSource.initialize();
  console.log('Connected. Cleaning seeded data...');

  await dataSource.transaction(async (manager) => {
    await manager.query(`DELETE FROM "transcripts"`);
    await manager.query(`DELETE FROM "submissions"`);
    await manager.query(`DELETE FROM "questions"`);
    await manager.query(`DELETE FROM "exams"`);
    await manager.query(`DELETE FROM "teacher_classes"`);
    await manager.query(`DELETE FROM "class_students"`);
    await manager.query(`DELETE FROM "classes"`);
    await manager.query(`DELETE FROM "parent_students"`);
    await manager.query(`DELETE FROM "question_categories"`);
    await manager.query(`DELETE FROM "users" WHERE "email" != 'admin@cbt.com'`);
  });

  console.log('✅ All seeded data cleared.');
  console.log('   Super admin account (admin@cbt.com) preserved.');

  await dataSource.destroy();
}

cleanDatabase().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
