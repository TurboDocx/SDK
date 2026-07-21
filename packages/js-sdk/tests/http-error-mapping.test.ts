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
  NetworkError,
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

  /**
   * The API reports field-level validation failures as an envelope whose top-level message is
   * generic ("There was an issue validating the body"), with the actionable per-field reasons
   * nested under data.errors[]. Surfacing only the envelope leaves the caller with no idea
   * which field was wrong.
   */
  describe('validation error detail extraction', () => {
    it('surfaces the per-field reason instead of the generic envelope message', async () => {
      mockFetchResponse(400, {
        message: 'There was an issue validating the body',
        type: 'ValidationError',
        data: { errors: [{ message: 'senderEmail must be a valid email address', path: ['senderEmail'] }] },
      });

      await expect(makeClient().post('/turbosign/single/prepare-for-review', {})).rejects.toThrow(
        'senderEmail must be a valid email address'
      );
    });

    it('joins multiple field errors so every failure is reported', async () => {
      mockFetchResponse(400, {
        message: 'There was an issue validating the body',
        data: {
          errors: [
            { message: 'senderEmail must be a valid email address' },
            { message: '"recipients" is required' },
          ],
        },
      });

      try {
        await makeClient().post('/turbosign/single/prepare-for-review', {});
        fail('expected ValidationError');
      } catch (err) {
        const message = (err as ValidationError).message;
        expect(message).toContain('senderEmail must be a valid email address');
        expect(message).toContain('"recipients" is required');
      }
    });

    it('falls back to the top-level message when there are no field errors', async () => {
      mockFetchResponse(400, {
        message: 'A sender email is required for API-key requests.',
        error: 'SenderEmailRequired',
      });

      await expect(makeClient().post('/turbosign/single/prepare-for-review', {})).rejects.toThrow(
        'A sender email is required for API-key requests.'
      );
    });

    it('ignores an empty errors array rather than blanking the message', async () => {
      mockFetchResponse(400, { message: 'There was an issue validating the body', data: { errors: [] } });

      await expect(makeClient().post('/turbosign/single/prepare-for-review', {})).rejects.toThrow(
        'There was an issue validating the body'
      );
    });

    /**
     * The TurboQuote surface reports failures as a NESTED object — `{ error: { message, code } }`
     * — rather than a top-level string. Reading `error` as a string stringifies the object into
     * "[object Object]", losing the reason entirely.
     */
    it('reads the message out of a nested error object (never "[object Object]")', async () => {
      mockFetchResponse(404, { error: { message: 'Quote not found', code: 'QUOTE_NOT_FOUND' } });

      try {
        await makeClient().get('/v1/quotes/missing-id');
        fail('expected NotFoundError');
      } catch (err) {
        const message = (err as NotFoundError).message;
        expect(message).toBe('Quote not found');
        expect(message).not.toContain('[object Object]');
      }
    });

    /**
     * Bulk signature validation puts its per-row reasons in a TOP-LEVEL `errors` array
     * (not under `data`), so it needs the same extraction as the celebrate envelope.
     */
    it('surfaces per-row reasons from a top-level errors array (bulk validation)', async () => {
      mockFetchResponse(400, {
        message: 'Bulk validation failed',
        type: 'BulkValidationFailed',
        errors: [{ message: 'Row 1: recipient email is invalid' }, { message: 'Row 3: name is required' }],
      });

      try {
        await makeClient().post('/turbosign/bulk/ingest', {});
        fail('expected ValidationError');
      } catch (err) {
        const message = (err as ValidationError).message;
        expect(message).toContain('Row 1: recipient email is invalid');
        expect(message).toContain('Row 3: name is required');
      }
    });
  });

  /**
   * The API's specific reason code lets callers branch programmatically
   * (`err.code === 'QUOTE_NOT_FOUND'`) rather than only on the HTTP class. It arrives in four
   * different places depending on which handler produced the response.
   */
  describe('error code extraction', () => {
    it('reads a nested error.code (TurboQuote surface)', async () => {
      mockFetchResponse(404, { error: { message: 'Quote not found', code: 'QUOTE_NOT_FOUND' } });

      try {
        await makeClient().get('/v1/quotes/missing');
        fail('expected NotFoundError');
      } catch (err) {
        expect((err as NotFoundError).code).toBe('QUOTE_NOT_FOUND');
      }
    });

    it('reads a top-level `type` (signature + validation handlers)', async () => {
      mockFetchResponse(400, { message: 'Recipient name is required', type: 'RecipientNameRequired' });

      try {
        await makeClient().post('/turbosign/single/prepare-for-signing', {});
        fail('expected ValidationError');
      } catch (err) {
        expect((err as ValidationError).code).toBe('RecipientNameRequired');
      }
    });

    it('reads `error` as the code when a separate message is present', async () => {
      // e.g. { message: "A sender email is required…", error: "SenderEmailRequired" }
      mockFetchResponse(400, {
        message: 'A sender email is required for API-key requests.',
        error: 'SenderEmailRequired',
      });

      try {
        await makeClient().post('/turbosign/single/prepare-for-signing', {});
        fail('expected ValidationError');
      } catch (err) {
        const validationError = err as ValidationError;
        expect(validationError.code).toBe('SenderEmailRequired');
        // …and the message is still the human-readable one, not the code.
        expect(validationError.message).toBe('A sender email is required for API-key requests.');
      }
    });

    it('does NOT treat a lone `error` string as a code (it is the message)', async () => {
      // SingleStepRoutes sends { error: <message>, code: <type> } — with no `message` key the
      // string IS the message, so it must not also be reported as the code.
      mockFetchResponse(400, { error: 'Document could not be prepared', code: 'TemplateProcessingFailed' });

      try {
        await makeClient().post('/turbosign/single/prepare-for-signing', {});
        fail('expected ValidationError');
      } catch (err) {
        const validationError = err as ValidationError;
        expect(validationError.message).toBe('Document could not be prepared');
        expect(validationError.code).toBe('TemplateProcessingFailed');
      }
    });

    it('falls back to the SDK default code when the API sends none', async () => {
      mockFetchResponse(404, { message: 'Resource missing' });

      try {
        await makeClient().get('/v1/anything');
        fail('expected NotFoundError');
      } catch (err) {
        expect((err as NotFoundError).code).toBe('NOT_FOUND');
      }
    });

    it('lets an API-supplied code win over the class default', async () => {
      // The default must never mask a real code the backend sent.
      mockFetchResponse(404, { message: 'Quote missing', code: 'QUOTE_NOT_FOUND' });

      try {
        await makeClient().get('/v1/anything');
        fail('expected NotFoundError');
      } catch (err) {
        expect((err as NotFoundError).code).toBe('QUOTE_NOT_FOUND');
      }
    });

    it('gives every error subclass a default code', () => {
      // Parity guard: all six SDKs populate `code` for every typed error.
      expect(new AuthenticationError('x').code).toBe('AUTHENTICATION_ERROR');
      expect(new AuthorizationError('x').code).toBe('AUTHORIZATION_ERROR');
      expect(new ValidationError('x').code).toBe('VALIDATION_ERROR');
      expect(new NotFoundError('x').code).toBe('NOT_FOUND');
      expect(new ConflictError('x').code).toBe('CONFLICT');
      expect(new RateLimitError('x').code).toBe('RATE_LIMIT_EXCEEDED');
      expect(new NetworkError('x').code).toBe('NETWORK_ERROR');
    });
  });
});
