import { createHash } from 'node:crypto';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { type AppConfigService } from '../config/app-config.service';
import { type PrismaService } from '../prisma/prisma.service';
import { ROTATION_GRACE_MS, SessionsService } from './sessions.service';

const sha = (v: string) => createHash('sha256').update(v).digest('hex');
const SESSION_ID = '11111111-1111-4111-8111-111111111111';
const SECRET = 'a'.repeat(64);

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    userId: 'user-1',
    refreshTokenHash: sha(SECRET),
    previousTokenHash: null as string | null,
    rotatedAt: null as Date | null,
    revokedAt: null as Date | null,
    expiresAt: new Date(Date.now() + 60_000),
    ...overrides,
  };
}

describe('SessionsService', () => {
  let prisma: {
    session: { create: jest.Mock; findUnique: jest.Mock; updateMany: jest.Mock };
  };
  let service: SessionsService;

  beforeAll(() => jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined));

  beforeEach(() => {
    prisma = {
      session: {
        create: jest.fn().mockResolvedValue({ id: SESSION_ID }),
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    const config = { refreshTokenTtlMs: 7 * 86_400_000 } as AppConfigService;
    service = new SessionsService(prisma as unknown as PrismaService, config);
  });

  it('stores only a hash of the refresh secret', async () => {
    const { refreshToken } = await service.create('user-1', {});
    const [sessionId, secret] = refreshToken.split('.');
    expect(sessionId).toBe(SESSION_ID);

    const stored = prisma.session.create.mock.calls[0][0].data.refreshTokenHash;
    expect(stored).toBe(sha(secret));
    expect(stored).not.toContain(secret);
  });

  it('rotates a current token and records the previous hash', async () => {
    prisma.session.findUnique.mockResolvedValue(makeSession());
    const result = await service.rotate(`${SESSION_ID}.${SECRET}`);

    expect(result.refreshToken).not.toBe(`${SESSION_ID}.${SECRET}`);
    const update = prisma.session.updateMany.mock.calls[0][0];
    expect(update.where).toMatchObject({ id: SESSION_ID, refreshTokenHash: sha(SECRET), revokedAt: null });
    expect(update.data.previousTokenHash).toBe(sha(SECRET));
  });

  it('accepts the just-rotated token inside the grace window', async () => {
    prisma.session.findUnique.mockResolvedValue(
      makeSession({ refreshTokenHash: sha('newer'), previousTokenHash: sha(SECRET), rotatedAt: new Date() }),
    );
    await expect(service.rotate(`${SESSION_ID}.${SECRET}`)).resolves.toBeDefined();
  });

  it('revokes the session when an old token is reused after the grace window', async () => {
    prisma.session.findUnique.mockResolvedValue(
      makeSession({
        refreshTokenHash: sha('newer'),
        previousTokenHash: sha(SECRET),
        rotatedAt: new Date(Date.now() - ROTATION_GRACE_MS - 1),
      }),
    );
    await expect(service.rotate(`${SESSION_ID}.${SECRET}`)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: { id: SESSION_ID, revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it.each([
    ['revoked', { revokedAt: new Date() }],
    ['expired', { expiresAt: new Date(Date.now() - 1) }],
  ])('rejects a %s session', async (_label, overrides) => {
    prisma.session.findUnique.mockResolvedValue(makeSession(overrides));
    await expect(service.rotate(`${SESSION_ID}.${SECRET}`)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects when a concurrent rotation won the race', async () => {
    prisma.session.findUnique.mockResolvedValue(makeSession());
    prisma.session.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.rotate(`${SESSION_ID}.${SECRET}`)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it.each([undefined, '', 'no-dot', 'not-a-uuid.' + SECRET, `${SESSION_ID}.short`])(
    'rejects malformed token %p without hitting the database',
    async (token) => {
      await expect(service.rotate(token)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.session.findUnique).not.toHaveBeenCalled();
    },
  );

  it('isActive requires matching user, not revoked, not expired', async () => {
    prisma.session.findUnique.mockResolvedValue(makeSession());
    await expect(service.isActive(SESSION_ID, 'user-1')).resolves.toBe(true);
    await expect(service.isActive(SESSION_ID, 'someone-else')).resolves.toBe(false);

    prisma.session.findUnique.mockResolvedValue(makeSession({ revokedAt: new Date() }));
    await expect(service.isActive(SESSION_ID, 'user-1')).resolves.toBe(false);
  });
});
