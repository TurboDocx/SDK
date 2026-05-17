/**
 * HTTP Error Mapping Tests
 *
 * Verifies that HttpClient.handleErrorResponse maps HTTP status codes to the
 * correct typed errors from the TurboDocxError hierarchy. Mocks `global.fetch`
 * to return responses with various status codes.
 */

import { HttpClient } from '../src/http';
import {
  TurboDocxError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
} from '../src/utils/errors';

const ORIGINAL_FETCH = global.fetch;

function makeClient(): HttpClient {
  return new HttpClient({
    apiKey: 'TDX-test-key',
    orgId: 'org-test',
    senderEmail: 'support@example.com',
  });
}

function mockFetchResponse(status: number, body: Record<string, unknown> = {}): void {
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status,
    statusText: `HTTP ${status}`,
    json: async () => body,
  } as unknown as Response);
}

describe('HttpClient error mapping', () => {
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

  it('maps 400 to ValidationError', async () => {
    mockFetchResponse(400, { message: 'Bad request body' });
    const client = makeClient();
    await expect(client.get('/api/test')).rejects.toBeInstanceOf(ValidationError);
  });

  it('maps 401 to AuthenticationError', async () => {
    mockFetchResponse(401, { message: 'Invalid API key' });
    const client = makeClient();
    await expect(client.get('/api/test')).rejects.toBeInstanceOf(AuthenticationError);
  });

  it('maps 403 to AuthorizationError', async () => {
    mockFetchResponse(403, { message: 'Forbidden' });
    const client = makeClient();
    await expect(client.get('/api/test')).rejects.toBeInstanceOf(AuthorizationError);
  });

  it('maps 404 to NotFoundError', async () => {
    mockFetchResponse(404, { message: 'Not found' });
    const client = makeClient();
    await expect(client.get('/api/test')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('maps 409 to ConflictError', async () => {
    mockFetchResponse(409, { message: 'Webhook with name signature already exists' });
    const client = makeClient();
    await expect(client.post('/api/webhooks', {})).rejects.toBeInstanceOf(ConflictError);
  });

  it('preserves the server message on ConflictError', async () => {
    const message = 'Webhook with name signature already exists';
    mockFetchResponse(409, { message });
    const client = makeClient();
    await expect(client.post('/api/webhooks', {})).rejects.toThrow(message);
  });

  it('maps 429 to RateLimitError', async () => {
    mockFetchResponse(429, { message: 'Too many requests' });
    const client = makeClient();
    await expect(client.get('/api/test')).rejects.toBeInstanceOf(RateLimitError);
  });

  it('maps 500 to generic TurboDocxError', async () => {
    mockFetchResponse(500, { message: 'Internal server error' });
    const client = makeClient();
    const promise = client.get('/api/test');
    await expect(promise).rejects.toBeInstanceOf(TurboDocxError);
    // Should NOT be one of the more specific subclasses
    await expect(promise).rejects.not.toBeInstanceOf(ValidationError);
    await expect(promise).rejects.not.toBeInstanceOf(ConflictError);
  });

  it('ConflictError carries statusCode 409 and code CONFLICT', async () => {
    mockFetchResponse(409, { message: 'conflict' });
    const client = makeClient();
    try {
      await client.post('/api/webhooks', {});
      fail('expected ConflictError');
    } catch (err) {
      expect(err).toBeInstanceOf(ConflictError);
      const ce = err as ConflictError;
      expect(ce.statusCode).toBe(409);
      expect(ce.code).toBe('CONFLICT');
      expect(ce.name).toBe('ConflictError');
    }
  });
});
