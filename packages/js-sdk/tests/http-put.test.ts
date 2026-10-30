/**
 * HttpClient.put — a JSON PUT (used by reorderLineItemImages), unwrapped like every other call,
 * and the 409 a refused quote delete comes back as.
 */

import { HttpClient } from '../src/http';
import { ConflictError } from '../src/utils/errors';

const ORIGINAL_FETCH = global.fetch;

function makeClient(): HttpClient {
  return new HttpClient({ apiKey: 'TDX-test-key', orgId: 'org-test', skipSenderValidation: true });
}

describe('HttpClient.put', () => {
  afterEach(() => {
    global.fetch = ORIGINAL_FETCH;
  });

  it('sends a JSON PUT and unwraps { data }', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: { results: [{ id: 'img-2' }], message: 'Image order saved' } }),
    } as unknown as Response);
    global.fetch = fetchMock;

    const result = await makeClient().put<{ results: Array<{ id: string }> }>(
      '/v1/quotes/q-1/items/li-1/images/order',
      { imageIds: ['img-2'] }
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/v1\/quotes\/q-1\/items\/li-1\/images\/order$/);
    expect(init.method).toBe('PUT');
    expect(JSON.parse(init.body)).toEqual({ imageIds: ['img-2'] });
    expect(result.results).toEqual([{ id: 'img-2' }]);
  });

  it('maps a refused delete (409 with a top-level message) to ConflictError with its code', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 409,
      statusText: 'Conflict',
      json: async () => ({
        message: "A sent quote can't be deleted. Void it instead.",
        error: { message: "A sent quote can't be deleted. Void it instead.", code: 'CANNOT_DELETE_SENT_QUOTE' },
        data: {},
      }),
    } as unknown as Response);

    const promise = makeClient().delete('/v1/quotes/q-1');

    await expect(promise).rejects.toBeInstanceOf(ConflictError);
    await expect(promise).rejects.toMatchObject({
      statusCode: 409,
      code: 'CANNOT_DELETE_SENT_QUOTE',
      message: "A sent quote can't be deleted. Void it instead.",
    });
  });
});
