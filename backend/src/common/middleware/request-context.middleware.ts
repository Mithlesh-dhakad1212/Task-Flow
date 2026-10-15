import { randomUUID } from 'node:crypto';
import { Injectable, Logger, type NestMiddleware } from '@nestjs/common';
import { type NextFunction, type Request, type Response } from 'express';

const INCOMING_ID = /^[A-Za-z0-9-]{8,64}$/;

/**
 * Assigns a request id (honouring a well-formed incoming X-Request-Id),
 * echoes it back in the response and writes one structured access-log line
 * per request once the response has finished.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const incoming = req.header('x-request-id');
    req.id = incoming && INCOMING_ID.test(incoming) ? incoming : randomUUID();
    res.setHeader('X-Request-Id', req.id);

    const started = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      const line = `[${req.id}] ${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`;
      if (res.statusCode >= 500) this.logger.error(line);
      else if (res.statusCode >= 400) this.logger.warn(line);
      else this.logger.log(line);
    });

    next();
  }
}
