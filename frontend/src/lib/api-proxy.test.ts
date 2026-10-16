// @vitest-environment node
import { forwardRequestHeaders, forwardResponseHeaders, proxyTarget, upstreamUrl } from './api-proxy';

describe('same-origin API proxy', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('targets API_PROXY_TARGET (runtime config), defaulting to localhost', () => {
    expect(proxyTarget()).toBe('http://localhost:4000');
    vi.stubEnv('API_PROXY_TARGET', 'http://api.railway.internal:8080/');
    expect(proxyTarget()).toBe('http://api.railway.internal:8080');
  });

  it('rebuilds the upstream URL with path segments and query string', () => {
    vi.stubEnv('API_PROXY_TARGET', 'http://api:4000');
    expect(upstreamUrl(['tasks'], '?status=TODO,DONE&search=design')).toBe(
      'http://api:4000/api/tasks?status=TODO,DONE&search=design',
    );
    expect(upstreamUrl(['projects', 'a b'], '')).toBe('http://api:4000/api/projects/a%20b');
  });

  it('forwards cookies and the client IP, but not hop-by-hop headers', () => {
    const incoming = new Headers({
      cookie: 'tf_access=abc; tf_refresh=def',
      'content-type': 'application/json',
      'x-timezone': 'Asia/Kolkata',
      host: 'web.example',
      connection: 'keep-alive',
      'content-length': '42',
      'x-forwarded-for': '203.0.113.7',
    });
    const out = forwardRequestHeaders(incoming);
    expect(out.get('cookie')).toBe('tf_access=abc; tf_refresh=def');
    expect(out.get('x-timezone')).toBe('Asia/Kolkata');
    expect(out.get('x-forwarded-for')).toBe('203.0.113.7');
    expect(out.has('host')).toBe(false);
    expect(out.has('connection')).toBe(false);
    expect(out.has('content-length')).toBe(false);
  });

  it('falls back to the socket IP when no X-Forwarded-For is present', () => {
    expect(forwardRequestHeaders(new Headers(), '198.51.100.4').get('x-forwarded-for')).toBe('198.51.100.4');
  });

  it('passes every Set-Cookie through individually (access + refresh)', () => {
    const upstream = new Headers();
    upstream.append('set-cookie', 'tf_access=a; Path=/; HttpOnly; SameSite=Lax');
    upstream.append('set-cookie', 'tf_refresh=r; Path=/api/auth; HttpOnly; SameSite=Lax');
    upstream.set('content-type', 'application/json');
    upstream.set('content-encoding', 'gzip');
    upstream.set('x-request-id', 'req-1');

    const out = forwardResponseHeaders(upstream);
    expect(out.getSetCookie()).toEqual([
      'tf_access=a; Path=/; HttpOnly; SameSite=Lax',
      'tf_refresh=r; Path=/api/auth; HttpOnly; SameSite=Lax',
    ]);
    expect(out.get('x-request-id')).toBe('req-1');
    // fetch() already decompressed the body
    expect(out.has('content-encoding')).toBe(false);
  });
});
