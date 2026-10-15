import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { type Request } from 'express';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';
import { ACCESS_COOKIE, type AccessTokenPayload } from './auth.types';
import { SessionsService } from './sessions.service';

export function extractAccessToken(req: Request): string | undefined {
  const header = req.header('authorization');
  if (header?.startsWith('Bearer ')) return header.slice(7).trim();
  const cookie = (req.cookies as Record<string, string> | undefined)?.[ACCESS_COOKIE];
  return typeof cookie === 'string' && cookie ? cookie : undefined;
}

/**
 * Global guard: every route requires a valid access token unless marked
 * @Public(). Accepts `Authorization: Bearer` (API clients) or the httpOnly
 * cookie (browser). The token's session must still be active, so logging out
 * invalidates outstanding access tokens immediately.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly sessions: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = extractAccessToken(req);
    if (!token) throw new UnauthorizedException('Authentication required');

    let payload: AccessTokenPayload;
    try {
      payload = await this.jwt.verifyAsync<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Access token is invalid or expired');
    }

    if (!payload.sid || !(await this.sessions.isActive(payload.sid, payload.sub))) {
      throw new UnauthorizedException('Session has ended, please log in again');
    }

    req.user = { id: payload.sub, email: payload.email, sessionId: payload.sid };
    return true;
  }
}
