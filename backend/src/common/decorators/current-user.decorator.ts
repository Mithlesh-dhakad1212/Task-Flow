import { createParamDecorator, type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { type Request } from 'express';
import { type AuthUser } from '../../auth/auth.types';

/** Injects the authenticated user populated by JwtAuthGuard. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser => {
  const req = ctx.switchToHttp().getRequest<Request>();
  if (!req.user) throw new UnauthorizedException();
  return req.user;
});
