import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ACCESS_COOKIE } from './auth/auth.types';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { appValidationPipe } from './common/pipes/validation.pipe';
import { AppConfigService } from './config/app-config.service';

export const API_PREFIX = 'api';

/**
 * Shared HTTP setup used by main.ts *and* the e2e tests, so the tests exercise
 * the exact same pipes, filters and middleware as production.
 */
export function configureApp(app: INestApplication): void {
  const config = app.get(AppConfigService);

  app.setGlobalPrefix(API_PREFIX);
  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Timezone', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
  });
  app.useGlobalPipes(appValidationPipe);
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();
}

export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const doc = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription(
      [
        'REST API for the TaskFlow project-management app.',
        '',
        '**Authentication** — call `POST /api/auth/login` (or `register`). The browser receives httpOnly',
        'cookies, so "Try it out" works straight away from this page. API clients can instead send the',
        'returned `accessToken` as `Authorization: Bearer <token>`.',
        '',
        'All errors share one envelope: `{ statusCode, error, message, details?, path, timestamp, requestId }`.',
      ].join('\n'),
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addCookieAuth(ACCESS_COOKIE)
    .build();
  return SwaggerModule.createDocument(app, doc);
}

export function setupSwagger(app: INestApplication): void {
  SwaggerModule.setup(`${API_PREFIX}/docs`, app, buildOpenApiDocument(app), {
    jsonDocumentUrl: `${API_PREFIX}/docs-json`,
    swaggerOptions: { persistAuthorization: true, withCredentials: true },
  });
}
