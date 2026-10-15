export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api').replace(/\/$/, '');

export interface FieldError {
  field: string;
  messages: string[];
}

/** Error thrown for any non-2xx response; mirrors the API error envelope. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details: FieldError[] = [],
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** First validation message for a field, if any. */
  fieldError(field: string): string | undefined {
    return this.details.find((d) => d.field === field)?.messages[0];
  }
}

type QueryValue = string | number | boolean | undefined | null | readonly (string | number)[];

export function buildQuery(params?: Record<string, QueryValue>): string {
  if (!params) return '';
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length) qs.set(key, value.join(','));
    } else {
      qs.set(key, String(value));
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

function timeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

let onSessionExpired: (() => void) | null = null;

/** Registered by AuthProvider: called when a refresh attempt fails. */
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Single-flight refresh: if ten requests hit a 401 at once, only one refresh
 * call is made and all ten wait for it, then retry.
 */
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });
  return refreshInFlight;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, QueryValue>;
  signal?: AbortSignal;
  /** Don't try to refresh on 401 (used by the auth endpoints themselves). */
  skipAuthRetry?: boolean;
}

export async function api<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal, skipAuthRetry } = opts;
  const url = `${API_URL}${path}${buildQuery(query)}`;
  const tz = timeZone();

  const send = () =>
    fetch(url, {
      method,
      signal,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(tz && { 'X-Timezone': tz }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res: Response;
  try {
    res = await send();
    if (res.status === 401 && !skipAuthRetry) {
      if (await refreshSession()) {
        res = await send();
      } else {
        onSessionExpired?.();
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      data?.message ?? `Request failed (${res.status})`,
      data?.details ?? [],
      data?.requestId,
    );
  }
  return data as T;
}

/** Human-friendly message for any thrown value. */
export function errorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof ApiError) {
    if (err.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    if (err.status >= 500) return 'The server had a problem. Please try again.';
    return err.message;
  }
  return fallback;
}
