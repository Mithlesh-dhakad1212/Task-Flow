import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { type Request } from 'express';
import { todayInTimeZone } from '../utils/date.util';

/** Today's date in the caller's timezone (X-Timezone header, defaults to UTC). */
export const ClientToday = createParamDecorator((_data: unknown, ctx: ExecutionContext): Date => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return todayInTimeZone(req.header('x-timezone'));
});
