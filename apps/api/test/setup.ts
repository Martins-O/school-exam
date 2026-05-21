// Jest setupFiles run BEFORE test modules are imported.
// This sets DB_NAME for ConfigService before AppModule loads.
// @nestjs/config's .env loader does NOT override existing process.env vars.
process.env.DB_NAME = 'cbt_test';
