import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type EnvironmentVariables } from './env.validation';

/** Typed accessor over validated environment variables. */
@Injectable()
export class AppConfigService {
  constructor(private readonly config: ConfigService<EnvironmentVariables, true>) {}

  get nodeEnv() {
    return this.config.get('NODE_ENV', { infer: true });
  }

  get isProduction() {
    return this.nodeEnv === 'production';
  }

  get port() {
    return this.config.get('PORT', { infer: true });
  }

  get corsOrigins(): string[] {
    return this.config
      .get('CORS_ORIGINS', { infer: true })
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  get jwtAccessSecret() {
    return this.config.get('JWT_ACCESS_SECRET', { infer: true });
  }

  get jwtAccessTtl() {
    return this.config.get('JWT_ACCESS_TTL', { infer: true });
  }

  /** Access token lifetime in milliseconds (used for the cookie max-age). */
  get jwtAccessTtlMs(): number {
    const raw = this.jwtAccessTtl;
    const value = Number.parseInt(raw, 10);
    const unit = raw.slice(-1);
    const factor = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] ?? 60_000;
    return value * factor;
  }

  get refreshTokenTtlMs(): number {
    return this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) * 86_400_000;
  }

  get bcryptRounds() {
    return this.config.get('BCRYPT_ROUNDS', { infer: true });
  }

  get cookieSecure() {
    return this.config.get('COOKIE_SECURE', { infer: true });
  }

  get rateLimitGlobal() {
    return this.config.get('RATE_LIMIT_GLOBAL', { infer: true });
  }

  get rateLimitAuth() {
    return this.config.get('RATE_LIMIT_AUTH', { infer: true });
  }
}
