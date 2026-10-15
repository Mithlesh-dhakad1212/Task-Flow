import { validateEnv } from './env.validation';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
};

describe('validateEnv', () => {
  it('applies defaults and coerces numbers/booleans', () => {
    const env = validateEnv({ ...valid, PORT: '5000', COOKIE_SECURE: 'false' });
    expect(env.PORT).toBe(5000);
    expect(env.COOKIE_SECURE).toBe(false);
    expect(env.JWT_ACCESS_TTL).toBe('15m');
    expect(validateEnv({ ...valid, COOKIE_SECURE: 'true' }).COOKIE_SECURE).toBe(true);
  });

  it('fails fast on a weak JWT secret', () => {
    expect(() => validateEnv({ ...valid, JWT_ACCESS_SECRET: 'short' })).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('fails fast when DATABASE_URL is missing', () => {
    expect(() => validateEnv({ JWT_ACCESS_SECRET: valid.JWT_ACCESS_SECRET })).toThrow(/DATABASE_URL/);
  });
});
