import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config({ path: '.env' });

const TARGET_TABLES = [
  'users', 'exams', 'questions', 'submissions', 'classes',
  'class_students', 'teacher_classes', 'exam_target_classes',
  'question_categories', 'question_question_categories',
  'parent_students', 'transcripts', 'questions_categories_question_categories',
];

async function cleanup() {
  const databaseUrl = process.env.DATABASE_URL;
  const baseConfig: any = { type: 'postgres' };

  if (databaseUrl) {
    const parsed = new URL(databaseUrl);
    baseConfig.host = parsed.hostname;
    baseConfig.port = parseInt(parsed.port || '5432');
    baseConfig.username = decodeURIComponent(parsed.username);
    baseConfig.password = decodeURIComponent(parsed.password);
    baseConfig.database = parsed.pathname.replace('/', '');
  } else {
    baseConfig.host = process.env.DB_HOST;
    baseConfig.port = parseInt(process.env.DB_PORT || '5432');
    baseConfig.username = process.env.DB_USERNAME;
    baseConfig.password = process.env.DB_PASSWORD;
    baseConfig.database = process.env.DB_NAME;
  }

  if (process.env.NODE_ENV === 'production') {
    baseConfig.ssl = { rejectUnauthorized: false };
    baseConfig.extra = {
      ssl: { rejectUnauthorized: false },
      family: 4,
      max: 1,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
      parameters: { pgbouncer: 'true' },
    };
  }

  const dataSource = new DataSource(baseConfig);
  await dataSource.initialize();

  const existingTables: string[] = (
    await dataSource.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    )
  ).map((r: any) => r.table_name);

  const toDrop = TARGET_TABLES.filter((t) => existingTables.includes(t));

  if (toDrop.length > 0) {
    console.log(`Dropping ${toDrop.length} pre-existing tables for clean migration...`);
    for (const table of toDrop) {
      await dataSource.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
    }
  } else {
    console.log('No conflicting tables found, proceeding with fresh migration.');
  }

  await dataSource.destroy();
  console.log('Cleanup complete.');
}

cleanup().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
