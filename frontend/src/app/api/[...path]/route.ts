/**
 * Same-origin API proxy: the browser calls `/api/*` on the web app's own
 * domain and this handler forwards the request to the NestJS API.
 *
 * Why: when the web app and API live on different sites (e.g. two
 * `*.up.railway.app` subdomains, which the Public Suffix List treats as
 * separate sites), browsers won't send the API's session cookies with
 * cross-site requests, and many block third-party cookies entirely. Proxying
 * makes the session cookies first-party and removes the need for CORS.
 *
 * The target is read at runtime (not baked into the bundle), so one image
 * works in every environment: API_PROXY_TARGET=http://api:4000 in Docker
 * Compose, a Railway private-network URL in production, localhost in dev.
 */
import { type NextRequest } from 'next/server';
import { forwardRequestHeaders, forwardResponseHeaders, proxyTarget, upstreamUrl } from '@/lib/api-proxy';

export const dynamic = 'force-dynamic';

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }): Promise<Response> {
  const { path } = await ctx.params;
  const url = upstreamUrl(path, req.nextUrl.search);
  const hasBody = !['GET', 'HEAD'].includes(req.method);

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers: forwardRequestHeaders(req.headers, req.headers.get('x-real-ip') ?? undefined),
      body: hasBody ? await req.arrayBuffer() : undefined,
      redirect: 'manual',
      cache: 'no-store',
    });
  } catch (err) {
    console.error(`API proxy could not reach ${proxyTarget()}`, err);
    return Response.json(
      {
        statusCode: 502,
        error: 'Bad Gateway',
        message: 'The API is unreachable. Please try again shortly.',
        path: `/api/${path.join('/')}`,
        timestamp: new Date().toISOString(),
      },
      { status: 502 },
    );
  }

  return new Response(upstream.status === 204 || upstream.status === 304 ? null : upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: forwardResponseHeaders(upstream.headers),
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
