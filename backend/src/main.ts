import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { API_PREFIX, configureApp, setupSwagger } from './app.setup';
import { AppConfigService } from './config/app-config.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: false });
  const config = app.get(AppConfigService);

  // Behind a reverse proxy (Docker/hosting), trust X-Forwarded-* for req.ip and rate limiting.
  app.set('trust proxy', 1);
  configureApp(app);
  setupSwagger(app);

  await app.listen(config.port, '0.0.0.0');
  const logger = new Logger('Bootstrap');
  logger.log(`TaskFlow API listening on http://localhost:${config.port}/${API_PREFIX}`);
  logger.log(`Swagger docs at http://localhost:${config.port}/${API_PREFIX}/docs`);
}

void bootstrap();
