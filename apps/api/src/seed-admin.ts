import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config({ path: '.env' });

async function seedAdmin() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

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
