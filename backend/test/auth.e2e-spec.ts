import { type INestApplication } from '@nestjs/common';
import request from 'supertest';
import { type PrismaService } from '../src/prisma/prisma.service';
import { cookieValue, createTestApp, registerUser, resetDatabase } from './utils';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ({ app, prisma } = await createTestApp());
    await resetDatabase(prisma);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('creates a user, sets httpOnly cookies and never returns secrets', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Alex', email: '  Alex@Example.com ', password: 'Password123' })
        .expect(201);

      expect(res.body.user).toEqual(
        expect.objectContaining({ email: 'alex@example.com', name: 'Alex', id: expect.any(String) }),
      );
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(JSON.stringify(res.body)).not.toMatch(/password|refresh/i);

      const cookies = res.headers['set-cookie'] as unknown as string[];
      expect(cookies.find((c) => c.startsWith('tf_access='))).toMatch(/HttpOnly/);
      expect(cookies.find((c) => c.startsWith('tf_refresh='))).toMatch(/Path=\/api\/auth.*HttpOnly|HttpOnly.*Path=\/api\/auth/);

      const stored = await prisma.user.findUniqueOrThrow({ where: { email: 'alex@example.com' } });
      expect(stored.passwordHash).not.toContain('Password123');
      expect(stored.passwordHash).toMatch(/^\$2[aby]\$/);
    });

    it('rejects a duplicate email with 409', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'Alex 2', email: 'ALEX@example.com', password: 'Password123' })
        .expect(409);
    });

    it('validates input and reports every invalid field', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'A', email: 'nope', password: 'short' })
        .expect(400);

      expect(res.body).toMatchObject({ statusCode: 400, message: 'Validation failed' });
      const fields = res.body.details.map((d: { field: string }) => d.field).sort();
      expect(fields).toEqual(['email', 'name', 'password']);
      expect(res.body.requestId).toEqual(expect.any(String));
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials (email is case-insensitive)', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'Alex@example.com', password: 'Password123' })
        .expect(200);
    });

    it('returns the same 401 for a wrong password and an unknown email', async () => {
      const wrong = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'alex@example.com', password: 'WrongPass1' })
        .expect(401);
      const unknown = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'WrongPass1' })
        .expect(401);
      expect(wrong.body.message).toBe(unknown.body.message);
    });
  });

  describe('protected routes', () => {
    it('rejects requests without a token', async () => {
      await request(app.getHttpServer()).get('/api/auth/me').expect(401);
      await request(app.getHttpServer()).get('/api/projects').expect(401);
    });

    it('rejects a tampered token', async () => {
      const { accessToken } = await registerUser(app);
      const tampered = accessToken.slice(0, -2) + (accessToken.endsWith('a') ? 'bb' : 'aa');
      await request(app.getHttpServer()).get('/api/auth/me').set('Authorization', `Bearer ${tampered}`).expect(401);
    });

    it('accepts either the cookie or a Bearer token', async () => {
      const { agent, accessToken, email } = await registerUser(app);
      const viaCookie = await agent.get('/api/auth/me').expect(200);
      expect(viaCookie.body.email).toBe(email);
      await request(app.getHttpServer()).get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`).expect(200);
    });
  });

  describe('refresh + logout', () => {
    it('rotates the refresh token and detects reuse of an old one', async () => {
      const server = app.getHttpServer();
      const login = await request(server)
        .post('/api/auth/register')
        .send({ name: 'Rotator', email: 'rotate@example.com', password: 'Password123' })
        .expect(201);
      const firstRefresh = cookieValue(login.headers['set-cookie'], 'tf_refresh')!;

      const refreshed = await request(server)
        .post('/api/auth/refresh')
        .set('Cookie', `tf_refresh=${firstRefresh}`)
        .expect(200);
      const secondRefresh = cookieValue(refreshed.headers['set-cookie'], 'tf_refresh')!;
      expect(secondRefresh).toBeDefined();
      expect(secondRefresh).not.toEqual(firstRefresh);

      const thirdRes = await request(server)
        .post('/api/auth/refresh')
        .set('Cookie', `tf_refresh=${secondRefresh}`)
        .expect(200);
      const latestAccess = thirdRes.body.accessToken as string;

      // `firstRefresh` is two rotations old (outside the grace window) → treated as theft.
      await request(server).post('/api/auth/refresh').set('Cookie', `tf_refresh=${firstRefresh}`).expect(401);

      // ...which revokes the whole session, including access tokens issued for it.
      await request(server).get('/api/auth/me').set('Authorization', `Bearer ${latestAccess}`).expect(401);
    });

    it('tolerates a concurrent refresh with the just-rotated token (multi-tab race)', async () => {
      const server = app.getHttpServer();
      const login = await request(server)
        .post('/api/auth/register')
        .send({ name: 'Tabs', email: 'tabs@example.com', password: 'Password123' })
        .expect(201);
      const token = cookieValue(login.headers['set-cookie'], 'tf_refresh')!;

      await request(server).post('/api/auth/refresh').set('Cookie', `tf_refresh=${token}`).expect(200);
      await request(server).post('/api/auth/refresh').set('Cookie', `tf_refresh=${token}`).expect(200);
    });

    it('rejects a garbage refresh token', async () => {
      await request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', 'tf_refresh=garbage').expect(401);
      await request(app.getHttpServer()).post('/api/auth/refresh').expect(401);
    });

    it('logout revokes the session server-side, invalidating the access token immediately', async () => {
      const { agent, accessToken } = await registerUser(app);
      await agent.get('/api/projects').expect(200);

      const res = await agent.post('/api/auth/logout').expect(204);
      const cleared = res.headers['set-cookie'] as unknown as string[];
      expect(cleared.some((c) => c.startsWith('tf_access=;'))).toBe(true);

      // Even a copy of the old access token no longer works.
      await request(app.getHttpServer()).get('/api/projects').set('Authorization', `Bearer ${accessToken}`).expect(401);
      await agent.post('/api/auth/refresh').expect(401);
    });
  });
});
