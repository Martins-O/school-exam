# CBT Exam Platform — Deployment Implementation Plan

## Overview
Deploy API to Render, Frontend to Vercel, Database to Supabase.

---

## Step 1: Code Changes

### 1a. `apps/api/src/app.module.ts` — TypeORM SSL + DATABASE_URL

Replace the `ConfigModule.forRoot()` and `TypeOrmModule.forRootAsync()` blocks with:

```typescript
ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
  validationSchema: Joi.object({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    DB_HOST: Joi.string().optional(),
    DB_PORT: Joi.number().port().optional(),
    DB_USERNAME: Joi.string().optional(),
    DB_PASSWORD: Joi.string().optional(),
    DB_NAME: Joi.string().optional(),
    DATABASE_URL: Joi.string().optional(),
    JWT_SECRET: Joi.string().min(64).required(),
    FRONTEND_URL: Joi.string().uri().required(),
    CLOUDINARY_CLOUD_NAME: Joi.string().optional(),
    CLOUDINARY_API_KEY: Joi.string().optional(),
    CLOUDINARY_API_SECRET: Joi.string().optional(),
  }),
}),
TypeOrmModule.forRootAsync({
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const isProduction = config.get('NODE_ENV') === 'production';
    const databaseUrl = config.get('DATABASE_URL');

    const baseConfig: any = {
      type: 'postgres',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      synchronize: false,
      logging: !isProduction,
    };

    if (databaseUrl) {
      baseConfig.url = databaseUrl;
    } else {
      baseConfig.host = config.get('DB_HOST');
      baseConfig.port = config.get<number>('DB_PORT');
      baseConfig.username = config.get('DB_USERNAME');
      baseConfig.password = config.get('DB_PASSWORD');
      baseConfig.database = config.get('DB_NAME');
    }

    if (isProduction) {
      baseConfig.ssl = { rejectUnauthorized: false };
      baseConfig.extra = { ssl: { rejectUnauthorized: false } };
    }

    return baseConfig;
  },
}),
```

### 1b. `apps/api/src/data-source.ts` — SSL for migrations

Replace the entire file with:

```typescript
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
```

### 1c. `apps/api/package.json` — Add engines

Insert after `"private": true,`:

```json
"engines": {
  "node": ">=18.0.0"
},
```

### 1d. `apps/web/package.json` — Add engines

Insert after `"private": true,`:

```json
"engines": {
  "node": ">=18.0.0"
},
```

---

## Step 2: Create Deployment Config Files

### 2a. `render.yaml` (repo root)

```yaml
services:
  - type: web
    name: cbt-api
    runtime: node
    repo: https://github.com/YOUR_USER/YOUR_REPO
    branch: main
    rootDir: apps/api
    buildCommand: npm install && npm run build
    startCommand: npx typeorm migration:run -d dist/src/data-source && node dist/src/main
    healthCheckPath: /api/v1/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: DATABASE_URL
        sync: false  # Set manually in Render dashboard
      - key: JWT_SECRET
        sync: false
      - key: JWT_EXPIRES_IN
        value: 8h
      - key: FRONTEND_URL
        sync: false  # Your Vercel URL
      - key: CLOUDINARY_CLOUD_NAME
        sync: false
      - key: CLOUDINARY_API_KEY
        sync: false
      - key: CLOUDINARY_API_SECRET
        sync: false
```

### 2b. `vercel.json` (repo root) — Optional

Vercel auto-detects Next.js. Only needed if you want to customize:

```json
{
  "git": {
    "deploymentEnabled": {
      "apps/api": false
    }
  }
}
```

Or better — just configure via Vercel dashboard:
- Root Directory: `apps/web`
- Framework: Next.js
- Build: `next build`
- Env: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`

---

## Step 3: Deployment Sequence

### 3a. Supabase
1. Create project at supabase.com
2. Copy connection string from Settings → Database
3. Run in SQL Editor: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
4. Run migrations locally pointing at Supabase:
   ```bash
   cd apps/api
   DATABASE_URL="postgresql://postgres:...@db.xxx.supabase.co:5432/postgres" npx ts-node src/data-source.ts
   npm run migration:run
   ```

### 3b. Render
1. Push code to GitHub
2. In Render Dashboard → New Web Service → Connect repo
3. Root directory: `apps/api`
4. Build: `npm install && npm run build`
5. Start: `npx typeorm migration:run -d dist/src/data-source && node dist/src/main`
6. Add env vars (sensitive ones as Secret Files)
7. Deploy → verify `GET /api/v1/health` returns `{ status: "ok", db: "connected" }`

### 3c. Vercel
1. In Vercel Dashboard → Add New Project → Import GitHub repo
2. Root directory: `apps/web`
3. Framework: Next.js (auto)
4. Add env vars:
   - `NEXT_PUBLIC_API_URL` = `https://cbt-api.onrender.com/api/v1`
   - `NEXT_PUBLIC_WS_URL` = `https://cbt-api.onrender.com`
5. Deploy

---

## Step 4: Verify End-to-End

1. Visit Vercel URL → should redirect to `/login`
2. Run seed: `POST /api/v1/auth/login` with admin credentials
3. Create an exam → add questions → publish
4. Start exam as student → autosave → submit → see results

---

## Environment Variables Summary

### Render (API)
| Env Var | Source |
|---|---|
| `DATABASE_URL` | Supabase connection string (secret) |
| `JWT_SECRET` | Generate via `openssl rand -hex 48` (secret) |
| `FRONTEND_URL` | `https://your-app.vercel.app` |
| `CLOUDINARY_*` | Optional, from Cloudinary dashboard |

### Vercel (Frontend)
| Env Var | Source |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://cbt-api.onrender.com/api/v1` |
| `NEXT_PUBLIC_WS_URL` | `https://cbt-api.onrender.com` |
