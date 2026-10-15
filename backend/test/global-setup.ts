import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { TEST_DATABASE_URL } from './setup-env';

/** Brings the test database schema up to date once per run. */
export default function globalSetup() {
  execSync('npx prisma migrate deploy', {
    cwd: join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    stdio: 'ignore',
  });
}
