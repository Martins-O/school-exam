import { Client } from 'pg';
import { config } from 'dotenv';

config();

async function createTestDb() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5433'),
    user: process.env.DB_USERNAME || 'cbt_user',
    password: process.env.DB_PASSWORD || 'cbt_password',
    database: 'postgres',
  });

  await client.connect();

  try {
    await client.query(`CREATE DATABASE cbt_test`);
    console.log('✅ Created database cbt_test');
  } catch (err: any) {
    if (err.code === '42P04') {
      console.log('ℹ️  Database cbt_test already exists');
    } else {
      throw err;
    }
  }

  await client.end();
}

createTestDb().catch((err) => {
  console.error('Failed to create test database:', err);
  process.exit(1);
});
