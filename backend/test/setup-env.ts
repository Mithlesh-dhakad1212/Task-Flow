// Runs in every e2e worker before modules are imported.
// Explicit values win over anything in backend/.env (ConfigModule gives process.env precedence).
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://taskflow:taskflow@localhost:5433/taskflow_test?schema=public';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_DATABASE_URL;
process.env.JWT_ACCESS_SECRET = 'e2e-test-secret-that-is-definitely-long-enough';
process.env.JWT_ACCESS_TTL = '15m';
process.env.BCRYPT_ROUNDS = '4';
process.env.COOKIE_SECURE = 'false';
process.env.CORS_ORIGINS = 'http://localhost:3000';
process.env.RATE_LIMIT_GLOBAL = '10000';
process.env.RATE_LIMIT_AUTH = '10000';
