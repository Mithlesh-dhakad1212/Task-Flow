/**
 * Helpers for the same-origin API proxy (app/api/[...path]/route.ts).
 * Kept separate so they can be unit-tested and because Next.js route files
 * may only export HTTP handlers and route config.
 */
export const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
]);

export function proxyTarget(): string {
  return (process.env.API_PROXY_TARGET ?? 'http://localhost:4000').replace(/\/$/, '');
}

/** Builds the upstream URL: /api/<path>?<query> on the API. */
export function upstreamUrl(path: string[], search: string): string {
  return `${proxyTarget()}/api/${path.map(encodeURIComponent).join('/')}${search}`;
}

export function forwardRequestHeaders(incoming: Headers, clientIp?: string): Headers {
  const headers = new Headers();
  incoming.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  // Keep the real client IP for the API's rate limiting and logs.
  const forwardedFor = incoming.get('x-forwarded-for') ?? clientIp;
  if (forwardedFor) headers.set('x-forwarded-for', forwardedFor);
  return headers;
}

export function forwardResponseHeaders(upstream: Headers): Headers {
  const headers = new Headers();
  upstream.forEach((value, key) => {
    const k = key.toLowerCase();
    // fetch() already decoded the body, so the original encoding/length no longer apply.
    if (HOP_BY_HOP.has(k) || k === 'content-encoding' || k === 'set-cookie') return;
    headers.set(key, value);
  });
  // Multiple Set-Cookie headers (access + refresh) must be forwarded individually.
  for (const cookie of upstream.getSetCookie()) headers.append('set-cookie', cookie);
  return headers;
}
