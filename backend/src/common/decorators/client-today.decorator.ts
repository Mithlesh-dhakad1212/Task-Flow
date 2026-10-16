import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';
import { resolveTimeZone, todayInTimeZone } from '../utils/date.util';

/** Today's date in the caller's timezone (X-Timezone header, defaults to UTC). */
export const ClientToday = createParamDecorator((_data: unknown, ctx: ExecutionContext): Date => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return todayInTimeZone(req.header('x-timezone'));
});

/** The caller's validated IANA timezone (X-Timezone header, defaults to UTC). */
export const ClientTimeZone = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return resolveTimeZone(req.header('x-timezone'));
});
