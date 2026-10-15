import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { type AppConfigService } from '../config/app-config.service';
import { type PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { type SessionsService } from './sessions.service';

describe('AuthService', () => {
  const config = { bcryptRounds: 4, jwtAccessTtlMs: 900_000 } as AppConfigService;
  const jwt = new JwtService({ secret: 'unit-test-secret' });
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
  let sessions: { create: jest.Mock; rotate: jest.Mock; revoke: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    prisma = { user: { findUnique: jest.fn(), create: jest.fn() } };
    sessions = {
      create: jest.fn().mockResolvedValue({ sessionId: 'sid-1', userId: 'u1', refreshToken: 'sid-1.secret' }),
      rotate: jest.fn(),
      revoke: jest.fn(),
    };
    service = new AuthService(
      prisma as unknown as PrismaService,
      jwt,
      sessions as unknown as SessionsService,
      config,
    );
  });

  describe('register', () => {
    it('hashes the password and issues tokens bound to a new session', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: 'u1', email: data.email, name: data.name, createdAt: new Date() }),
      );

      const result = await service.register({ name: 'Alex', email: 'a@b.co', password: 'Password123' }, {});

      const { passwordHash } = prisma.user.create.mock.calls[0][0].data;
      expect(passwordHash).not.toBe('Password123');
      expect(await bcrypt.compare('Password123', passwordHash)).toBe(true);

      const payload = jwt.decode(result.accessToken);
      expect(payload).toMatchObject({ sub: 'u1', email: 'a@b.co', sid: 'sid-1' });
      expect(result.expiresIn).toBe(900);
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('refuses an email that is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.register({ name: 'Alex', email: 'a@b.co', password: 'Password123' }, {}),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('never returns the password hash', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.co',
        name: 'Alex',
        createdAt: new Date(),
        updatedAt: new Date(),
        passwordHash: await bcrypt.hash('Password123', 4),
      });
      const result = await service.login({ email: 'a@b.co', password: 'Password123' }, {});
      expect(Object.keys(result.user).sort()).toEqual(['createdAt', 'email', 'id', 'name']);
    });

    it('rejects a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', passwordHash: await bcrypt.hash('Password123', 4) });
      await expect(service.login({ email: 'a@b.co', password: 'nope1234' }, {})).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('still runs a bcrypt comparison for unknown emails (no timing oracle)', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const compare = jest.spyOn(bcrypt, 'compare');
      await expect(service.login({ email: 'ghost@b.co', password: 'Password123' }, {})).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(compare).toHaveBeenCalledTimes(1);
      compare.mockRestore();
    });
  });

  it('logout revokes the session when one is known', async () => {
    await service.logout('sid-1');
    await service.logout(null);
    expect(sessions.revoke).toHaveBeenCalledTimes(1);
    expect(sessions.revoke).toHaveBeenCalledWith('sid-1');
  });
});
