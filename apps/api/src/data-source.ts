import { setDefaultResultOrder } from 'dns';
setDefaultResultOrder('ipv4first');

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config();

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL;

const baseConfig: any = {
  type: 'postgres',
  entities: [join(__dirname, '**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
  synchronize: false,
  logging: true,
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

export const AppDataSource = new DataSource(baseConfig);
