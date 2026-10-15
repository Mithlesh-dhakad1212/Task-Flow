import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { type Request, type Response } from 'express';
import { type ErrorResponseDto, type FieldErrorDto } from '../http/error-response';

interface NormalizedError {
  status: number;
  message: string;
  details?: FieldErrorDto[];
}

/**
 * Converts every thrown error into the same JSON envelope (ErrorResponseDto),
 * maps known Prisma errors to meaningful HTTP statuses and makes sure internal
 * details never leak to clients for 5xx responses.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { status, message, details } = this.normalize(exception);
    const body: ErrorResponseDto = {
      statusCode: status,
      error: HttpStatus[status]
        ? HttpStatus[status]
            .split('_')
            .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
            .join(' ')
        : 'Error',
      message,
      ...(details?.length ? { details } : {}),
      path: req.originalUrl ?? req.url,
      timestamp: new Date().toISOString(),
      requestId: req.id ?? 'unknown',
    };

    if (status >= 500) {
      this.logger.error(
        `[${body.requestId}] ${req.method} ${body.path} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`[${body.requestId}] ${req.method} ${body.path} → ${status} ${message}`);
    }

    res.status(status).json(body);
  }

  private normalize(exception: unknown): NormalizedError {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') return { status, message: response };

      const r = response as { message?: string | string[]; details?: FieldErrorDto[] };
      const message = Array.isArray(r.message) ? r.message.join('; ') : (r.message ?? exception.message);
      return { status, message, details: r.details };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          return { status: HttpStatus.CONFLICT, message: 'A record with this value already exists' };
        case 'P2025':
          return { status: HttpStatus.NOT_FOUND, message: 'Resource not found' };
        case 'P2003':
          return { status: HttpStatus.BAD_REQUEST, message: 'Related resource does not exist' };
      }
    }

    if (exception instanceof SyntaxError && 'body' in exception) {
      return { status: HttpStatus.BAD_REQUEST, message: 'Malformed JSON body' };
    }

    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' };
  }
}
