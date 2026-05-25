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
    baseConfig.url = databaseUrl;
  } else {
    baseConfig.host = process.env.DB_HOST;
    baseConfig.port = parseInt(process.env.DB_PORT || '5432');
    baseConfig.username = process.env.DB_USERNAME;
    baseConfig.password = process.env.DB_PASSWORD;
    baseConfig.database = process.env.DB_NAME;
  }

  if (isProduction) {
    baseConfig.ssl = { rejectUnauthorized: false };
    baseConfig.extra = { ssl: { rejectUnauthorized: false } };
  }

  const dataSource = new DataSource(baseConfig);

  await dataSource.initialize();

  const email = process.env.ADMIN_EMAIL || 'admin@cbt.com';
  const password = process.env.ADMIN_PASSWORD || 'password123';
  const hashedPassword = await bcrypt.hash(password, 12);

  const result = await dataSource.query(`
    INSERT INTO "users" ("name", "email", "password", "role", "isActive")
    VALUES ('Super Admin', $1, $2, 'super_admin', true)
    ON CONFLICT ("email") 
    DO UPDATE SET "password" = $2, "role" = 'super_admin', "isActive" = true
  `, [email, hashedPassword]);

  console.log('✅ Admin account created/updated');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log('   Role: super_admin');

  await dataSource.destroy();
}

seedAdmin().catch(console.error);
