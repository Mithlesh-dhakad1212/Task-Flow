import { plainToInstance, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

/**
 * Environment contract. The app refuses to boot with a missing or malformed
 * variable rather than failing later at request time.
 */
export class EnvironmentVariables {
  @IsIn(['development', 'production', 'test'])
  NODE_ENV: 'development' | 'production' | 'test' = 'development';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 4000;

  /** Bind address. Use "::" to accept IPv6 too (e.g. Railway private networking). */
  @IsString()
  HOST = '0.0.0.0';

  /** Number of reverse proxies in front of the API, used to derive the client IP. */
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5)
  TRUST_PROXY = 1;

  @IsString()
  CORS_ORIGINS = 'http://localhost:3000';

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string;

  @IsString()
  @MinLength(32, { message: 'JWT_ACCESS_SECRET must be at least 32 characters' })
  JWT_ACCESS_SECRET: string;

  @IsString()
  @Matches(/^\d+[smhd]$/, { message: 'JWT_ACCESS_TTL must look like 15m, 1h, 30s or 1d' })
  JWT_ACCESS_TTL = '15m';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  REFRESH_TOKEN_TTL_DAYS = 7;

  @Type(() => Number)
  @IsInt()
  @Min(4)
  @Max(15)
  BCRYPT_ROUNDS = 12;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  COOKIE_SECURE = false;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  RATE_LIMIT_GLOBAL = 300;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  RATE_LIMIT_AUTH = 10;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  // `Type(() => Boolean)` would turn the string "false" into true.
  const normalized = { ...config };
  if (typeof normalized.COOKIE_SECURE === 'string') {
    normalized.COOKIE_SECURE = normalized.COOKIE_SECURE.toLowerCase() === 'true';
  }

  const validated = plainToInstance(EnvironmentVariables, normalized, {
    enableImplicitConversion: false,
    exposeDefaultValues: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    const details = errors
      .map((e) => `  - ${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return validated;
}
