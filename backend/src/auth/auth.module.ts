import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigService } from '../config/app-config.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { SessionsService } from './sessions.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => ({
        secret: config.jwtAccessSecret,
        signOptions: {
          expiresIn: Math.floor(config.jwtAccessTtlMs / 1000),
          issuer: 'taskflow',
          audience: 'taskflow-api',
        },
        verifyOptions: { issuer: 'taskflow', audience: 'taskflow-api', algorithms: ['HS256'] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionsService, { provide: APP_GUARD, useClass: JwtAuthGuard }],
  exports: [AuthService],
})
export class AuthModule {}
