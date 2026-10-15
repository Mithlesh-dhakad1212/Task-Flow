import { SetMetadata } from '@nestjs/common';

export const AUTH_RATE_LIMITED = 'authRateLimited';

/** Applies the stricter "auth" throttler (brute-force protection) to a route. */
export const AuthRateLimited = () => SetMetadata(AUTH_RATE_LIMITED, true);
