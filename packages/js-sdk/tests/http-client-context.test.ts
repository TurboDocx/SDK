/**
 * HTTP Client Context Header Tests
 *
 * The audit trail records device/location from request headers. The SDK must
 * send a descriptive User-Agent (so device info isn't "node"/"Unknown"),
 * a timezone, an optional client IP (X-Forwarded-For -> geolocation), and a
 * device fingerprint. These tests pin the header contract the backend reads
 * (recordAuthInfo + getTimezoneInfo).
 */

import { HttpClient } from '../src/http';

const ORIGINAL_FETCH = global.fetch;

function mockOkFetch(): jest.Mock {
  const fn = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    headers: { get: () => 'application/json' },
    json: async () => ({ data: { ok: true } }),
    arrayBuffer: async () => new ArrayBuffer(8),
  } as unknown as Response);
  global.fetch = fn;
  return fn;
}

function lastHeaders(fn: jest.Mock): Record<string, string> {
  const call = fn.mock.calls[fn.mock.calls.length - 1];
  return call[1].headers as Record<string, string>;
}

function makeClient(extra: Record<string, unknown> = {}): HttpClient {
  return new HttpClient({
    apiKey: 'TDX-test-key',
    orgId: 'org-test',
    senderEmail: 'support@example.com',
    ...extra,
  });
}

describe('HttpClient client-context headers', () => {
  beforeEach(() => {
    delete process.env.TURBODOCX_API_KEY;
    delete process.env.TURBODOCX_ORG_ID;
    delete process.env.TURBODOCX_SENDER_EMAIL;
    delete process.env.TURBODOCX_BASE_URL;
  });

  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
    jest.restoreAllMocks();
  });

  it('sends a descriptive TurboDocx SDK User-Agent by default', async () => {
    const fn = mockOkFetch();
    await makeClient().get('/api/test');
    const headers = lastHeaders(fn);
    // e.g. "@turbodocx/sdk/0.4.0 (Node.js/v20.11.0; Linux 5.15; x64; host=svc-1)"
    expect(headers['User-Agent']).toMatch(/^@turbodocx\/sdk\/\d+\.\d+\.\d+/);
    // Must NOT be the bare undici default that yields "Unknown" device info
    expect(headers['User-Agent']).not.toBe('node');
  });

  it('lets the caller override the User-Agent via clientContext', async () => {
    const fn = mockOkFetch();
    await makeClient({ clientContext: { userAgent: 'my-app/9.9 (acme-worker)' } }).get('/api/test');
    expect(lastHeaders(fn)['User-Agent']).toBe('my-app/9.9 (acme-worker)');
  });

  it('sends an X-Timezone header by default', async () => {
    const fn = mockOkFetch();
    await makeClient().get('/api/test');
    const tz = lastHeaders(fn)['X-Timezone'];
    expect(typeof tz).toBe('string');
    expect(tz.length).toBeGreaterThan(0);
  });

  it('lets the caller override the timezone', async () => {
    const fn = mockOkFetch();
    await makeClient({ clientContext: { timezone: 'America/New_York' } }).get('/api/test');
    expect(lastHeaders(fn)['X-Timezone']).toBe('America/New_York');
  });

  it('sends an Accept-Language header from the host locale by default', async () => {
    const fn = mockOkFetch();
    await makeClient().get('/api/test');
    const lang = lastHeaders(fn)['Accept-Language'];
    // e.g. "en-US" — a BCP-47 tag so the audit trail shows a real language, not "N/A"
    expect(typeof lang).toBe('string');
    expect(lang).toMatch(/^[a-z]{2,3}(-[A-Za-z0-9]+)*$/);
  });

  it('lets the caller override the language', async () => {
    const fn = mockOkFetch();
    await makeClient({ clientContext: { language: 'fr-FR' } }).get('/api/test');
    expect(lastHeaders(fn)['Accept-Language']).toBe('fr-FR');
  });

  it('does NOT send X-Forwarded-For by default (so infra LB IP wins in prod)', async () => {
    const fn = mockOkFetch();
    await makeClient().get('/api/test');
    expect(lastHeaders(fn)['X-Forwarded-For']).toBeUndefined();
  });

  it('sends X-Forwarded-For when the caller supplies a client IP', async () => {
    const fn = mockOkFetch();
    await makeClient({ clientContext: { ipAddress: '203.0.113.7' } }).get('/api/test');
    expect(lastHeaders(fn)['X-Forwarded-For']).toBe('203.0.113.7');
  });

  it('sends a non-empty X-Device-Fingerprint by default and honors overrides', async () => {
    const fn = mockOkFetch();
    await makeClient().get('/api/test');
    expect((lastHeaders(fn)['X-Device-Fingerprint'] || '').length).toBeGreaterThan(0);

    const fn2 = mockOkFetch();
    await makeClient({ clientContext: { deviceFingerprint: 'fp-abc' } }).get('/api/test');
    expect(lastHeaders(fn2)['X-Device-Fingerprint']).toBe('fp-abc');
  });

  it('preserves existing Authorization and org headers', async () => {
    const fn = mockOkFetch();
    await makeClient().get('/api/test');
    const headers = lastHeaders(fn);
    expect(headers['Authorization']).toBe('Bearer TDX-test-key');
    expect(headers['x-rapiddocx-org-id']).toBe('org-test');
  });

  it('applies context headers on multipart file uploads (the signature-create path)', async () => {
    const fn = mockOkFetch();
    const pdf = Buffer.from('%PDF-1.4 test');
    await makeClient({ clientContext: { ipAddress: '203.0.113.7' } })
      .uploadFile('/turbosign/single/prepare-for-review', pdf, 'file', { documentName: 'x' });
    const headers = lastHeaders(fn);
    expect(headers['User-Agent']).toMatch(/^@turbodocx\/sdk\//);
    expect(headers['X-Forwarded-For']).toBe('203.0.113.7');
    // Multipart must NOT carry a manual Content-Type (fetch sets the boundary)
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('applies context headers on binary downloads (getRaw)', async () => {
    const fn = mockOkFetch();
    await makeClient().getRaw('/turbosign/documents/abc/download');
    expect(lastHeaders(fn)['User-Agent']).toMatch(/^@turbodocx\/sdk\//);
  });

  it('applies context headers on the browser File upload branch', async () => {
    const fn = mockOkFetch();
    // A global File (Node 20+/browser) takes the File branch of uploadFile.
    const file = new File([Buffer.from('%PDF-1.4 test')], 'test.pdf', { type: 'application/pdf' });
    await makeClient({ clientContext: { ipAddress: '203.0.113.7' } })
      .uploadFile('/turbosign/single/prepare-for-review', file as any, 'file', { documentName: 'x' });
    const headers = lastHeaders(fn);
    expect(headers['User-Agent']).toMatch(/^@turbodocx\/sdk\//);
    expect(headers['X-Forwarded-For']).toBe('203.0.113.7');
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('applies context headers on postFormData', async () => {
    const fn = mockOkFetch();
    const fd = new FormData();
    fd.append('foo', 'bar');
    await makeClient().postFormData('/some/path', fd);
    const headers = lastHeaders(fn);
    expect(headers['User-Agent']).toMatch(/^@turbodocx\/sdk\//);
    expect(headers['Content-Type']).toBeUndefined();
  });

  it('keeps Content-Type application/json on JSON requests', async () => {
    const fn = mockOkFetch();
    await makeClient().get('/api/test');
    expect(lastHeaders(fn)['Content-Type']).toBe('application/json');
  });
});
