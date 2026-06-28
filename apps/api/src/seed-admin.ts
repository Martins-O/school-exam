import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config({ path: '.env' });

async function seedAdmin() {
  const isProduction = process.env.NODE_ENV === 'production';
  const databaseUrl = process.env.DATABASE_URL;

  const baseConfig: any = {
    type: 'postgres',
  };

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

  if (isProduction) {
    baseConfig.ssl = { rejectUnauthorized: false };
    baseConfig.extra = { ssl: { rejectUnauthorized: false }, family: 4 };
  }

  const dataSource = new DataSource(baseConfig);

  await dataSource.initialize();

  const email = process.env.ADMIN_EMAIL || 'admin@cbt.com';
  const password = process.env.ADMIN_PASSWORD;

  // Skip seeding if ADMIN_PASSWORD is not set (admin already exists from a previous deploy)
  if (!password) {
    console.log('⏭️  Skipping admin seed — ADMIN_PASSWORD not set. Admin account unchanged.');
    await dataSource.destroy();
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const result = await dataSource.query(`
    INSERT INTO "users" ("name", "email", "password", "role", "isActive")
    VALUES ('Super Admin', $1, $2, 'super_admin', true)
    ON CONFLICT ("email") DO NOTHING
  `, [email, hashedPassword]);

  const rowCount = result?.[1]?.rowCount ?? 0;
  if (rowCount === 0) {
    console.log('⏭️  Admin account already exists — skipping seed.');
  } else {
    console.log('✅ Admin account created');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('   Role: super_admin');
  }

  await dataSource.destroy();
}

seedAdmin().catch(console.error);
