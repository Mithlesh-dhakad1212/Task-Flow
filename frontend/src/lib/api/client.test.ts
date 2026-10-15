import { ApiError, api, buildQuery, errorMessage } from './client';

function json(status: number, body: unknown) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('buildQuery', () => {
  it('skips empty values and joins arrays', () => {
    expect(buildQuery({ a: 'x', b: undefined, c: '', d: ['TODO', 'DONE'], e: [], f: 2, g: false })).toBe(
      '?a=x&d=TODO%2CDONE&f=2&g=false',
    );
    expect(buildQuery({})).toBe('');
  });
});

describe('api()', () => {
  const fetchMock = vi.fn();
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('sends credentials, JSON and the browser timezone', async () => {
    fetchMock.mockResolvedValueOnce(json(200, { ok: true }));
    await api('/projects', { method: 'POST', body: { name: 'x' } });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/projects$/);
    expect(init.credentials).toBe('include');
    expect(init.headers['Content-Type']).toBe('application/json');
    expect(init.headers['X-Timezone']).toEqual(expect.any(String));
    expect(init.body).toBe('{"name":"x"}');
  });

  it('refreshes once on 401 and retries the original request', async () => {
    fetchMock
      .mockResolvedValueOnce(json(401, { message: 'expired' }))
      .mockResolvedValueOnce(json(200, {})) // POST /auth/refresh
      .mockResolvedValueOnce(json(200, { id: 1 }));

    await expect(api('/auth/me')).resolves.toEqual({ id: 1 });
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/auth\/refresh$/);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('shares a single refresh between concurrent 401s', async () => {
    let refreshCalls = 0;
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        return Promise.resolve(json(200, {}));
      }
      // first call per endpoint → 401, retry → 200
      const seen = fetchMock.mock.calls.filter(([u]) => u === url).length;
      return Promise.resolve(seen === 1 ? json(401, {}) : json(200, { url }));
    });

    await Promise.all([api('/a'), api('/b'), api('/c')]);
    expect(refreshCalls).toBe(1);
  });

  it('throws ApiError with field details from the error envelope', async () => {
    fetchMock.mockResolvedValueOnce(
      json(400, {
        statusCode: 400,
        message: 'Validation failed',
        details: [{ field: 'name', messages: ['name should not be empty'] }],
        requestId: 'req-1',
      }),
    );
    const err = await api<never>('/projects', { method: 'POST', body: {} }).catch((e: ApiError) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.fieldError('name')).toBe('name should not be empty');
    expect(err.requestId).toBe('req-1');
  });

  it('maps network failures to a friendly ApiError', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const err = await api<never>('/projects').catch((e: ApiError) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
  });

  it('returns undefined for 204 responses', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    await expect(api('/tasks/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });
});

describe('errorMessage', () => {
  it('hides server internals and explains rate limits', () => {
    expect(errorMessage(new ApiError(500, 'stack trace here'))).toBe('The server had a problem. Please try again.');
    expect(errorMessage(new ApiError(429, 'x'))).toMatch(/Too many attempts/);
    expect(errorMessage(new ApiError(404, 'Project not found'))).toBe('Project not found');
    expect(errorMessage(new Error('boom'), 'fallback')).toBe('fallback');
  });
});
