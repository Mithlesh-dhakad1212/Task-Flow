export interface AuthUser {
  id: string;
  email: string;
  sessionId: string;
}

export interface AccessTokenPayload {
  sub: string;
  email: string;
  /** Session id — lets the guard reject tokens of logged-out sessions. */
  sid: string;
}

export interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}

export const ACCESS_COOKIE = 'tf_access';
export const REFRESH_COOKIE = 'tf_refresh';
/** Refresh cookie is only ever sent to the auth endpoints. */
export const REFRESH_COOKIE_PATH = '/api/auth';
