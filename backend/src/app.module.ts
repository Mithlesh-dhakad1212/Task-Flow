import { type MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { AUTH_RATE_LIMITED } from './common/decorators/auth-rate-limit.decorator';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { AppConfigService } from './config/app-config.service';
import { AppConfigModule } from './config/config.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    ThrottlerModule.forRootAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        throttlers: [
          { name: 'default', ttl: 60_000, limit: config.rateLimitGlobal },
          {
            // Stricter limit for credential endpoints (brute-force protection).
            name: 'auth',
            ttl: 60_000,
            limit: config.rateLimitAuth,
            skipIf: (ctx) => !Reflect.getMetadata(AUTH_RATE_LIMITED, ctx.getHandler()),
          },
        ],
      }),
    }),
    AuthModule,
    ProjectsModule,
    TasksModule,
    DashboardModule,
  ],
  controllers: [HealthController],
  providers: [
    // Order matters: rate-limit before doing any auth work.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*path');
  }
}
