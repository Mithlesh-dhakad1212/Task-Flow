import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AppConfigService } from '../config/app-config.service';
import { PrismaService } from '../prisma/prisma.service';
import { type RequestMeta } from './auth.types';

/** Window during which the just-rotated refresh token is still accepted (multi-tab races). */
export const ROTATION_GRACE_MS = 30_000;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export interface IssuedRefreshToken {
  sessionId: string;
  userId: string;
  refreshToken: string;
}

/**
 * Refresh-token sessions with rotation and reuse detection.
 *
 * Token format: `<sessionId>.<random secret>`. Only sha256(secret) is stored.
 * Every refresh replaces the secret. Presenting a secret that was rotated out
 * (outside the short grace window) means the token was copied — the whole
 * session is revoked.
 */
@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async create(userId: string, meta: RequestMeta): Promise<IssuedRefreshToken> {
    const secret = randomBytes(48).toString('base64url');
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: sha256(secret),
        userAgent: meta.userAgent?.slice(0, 255),
        ipAddress: meta.ipAddress?.slice(0, 64),
        expiresAt: new Date(Date.now() + this.config.refreshTokenTtlMs),
      },
    });
    return { sessionId: session.id, userId, refreshToken: `${session.id}.${secret}` };
  }

  async rotate(refreshToken: string | undefined): Promise<IssuedRefreshToken> {
    const parsed = this.parse(refreshToken);
    if (!parsed) throw new UnauthorizedException('Invalid refresh token');

    const session = await this.prisma.session.findUnique({ where: { id: parsed.sessionId } });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Session expired, please log in again');
    }

    const presentedHash = sha256(parsed.secret);
    const isCurrent = safeEqual(presentedHash, session.refreshTokenHash);
    const isRecentPrevious =
      !!session.previousTokenHash &&
      !!session.rotatedAt &&
      safeEqual(presentedHash, session.previousTokenHash) &&
      Date.now() - session.rotatedAt.getTime() < ROTATION_GRACE_MS;

    if (!isCurrent && !isRecentPrevious) {
      // Token reuse: someone presented a stale token. Assume compromise.
      await this.revoke(session.id);
      this.logger.warn(`Refresh token reuse detected; revoked session ${session.id} (user ${session.userId})`);
      throw new UnauthorizedException('Session expired, please log in again');
    }

    const secret = randomBytes(48).toString('base64url');
    // Optimistic concurrency: only rotate if nobody else rotated in between.
    const { count } = await this.prisma.session.updateMany({
      where: { id: session.id, refreshTokenHash: session.refreshTokenHash, revokedAt: null },
      data: {
        previousTokenHash: session.refreshTokenHash,
        refreshTokenHash: sha256(secret),
        rotatedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });
    if (count === 0) throw new UnauthorizedException('Session expired, please log in again');

    return { sessionId: session.id, userId: session.userId, refreshToken: `${session.id}.${secret}` };
  }

  async revoke(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /** Session id embedded in a refresh token, without validating it. */
  sessionIdOf(refreshToken: string | undefined): string | null {
    return this.parse(refreshToken)?.sessionId ?? null;
  }

  async isActive(sessionId: string, userId: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { userId: true, revokedAt: true, expiresAt: true },
    });
    return !!session && session.userId === userId && !session.revokedAt && session.expiresAt > new Date();
  }

  private parse(token: string | undefined): { sessionId: string; secret: string } | null {
    if (!token || typeof token !== 'string') return null;
    const dot = token.indexOf('.');
    if (dot < 0) return null;
    const sessionId = token.slice(0, dot);
    const secret = token.slice(dot + 1);
    if (!UUID.test(sessionId) || secret.length < 32) return null;
    return { sessionId, secret };
  }
}
