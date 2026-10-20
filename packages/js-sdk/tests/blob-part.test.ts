/**
 * toBlobPart lives in its own internal module (not src/http.ts) so its
 * `Uint8Array<ArrayBuffer>` return type (TypeScript 5.7+ syntax) stays out of the declaration
 * files the package entry point pulls in. That keeps the README's "TypeScript 4.7+" true.
 */
import { toBlobPart } from '../src/utils/blob-part';

describe('toBlobPart', () => {
  it('returns a zero-copy Uint8Array view over the same bytes as the Buffer', () => {
    const buffer = Buffer.from('%PDF-1.7 hello');

    const part = toBlobPart(buffer);

    expect(part).toBeInstanceOf(Uint8Array);
    expect(part.buffer).toBe(buffer.buffer);
    expect(part.byteOffset).toBe(buffer.byteOffset);
    expect(part.byteLength).toBe(buffer.byteLength);
    expect(Buffer.from(part).toString()).toBe('%PDF-1.7 hello');
  });

  it('respects the offset of a Buffer sliced out of a larger pool', () => {
    const pooled = Buffer.from('xxABCyy').subarray(2, 5);

    const part = toBlobPart(pooled);

    expect(Buffer.from(part).toString()).toBe('ABC');
  });

  it('produces a value Blob accepts', async () => {
    const blob = new Blob([toBlobPart(Buffer.from('abc'))], { type: 'text/plain' });

    expect(await blob.text()).toBe('abc');
  });
});
