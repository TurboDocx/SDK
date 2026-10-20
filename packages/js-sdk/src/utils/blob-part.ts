/**
 * Re-view a Buffer's bytes as an ArrayBuffer-backed Uint8Array so it can be passed to `new Blob()`.
 *
 * ponytail: @types/node 26 types Buffer as ArrayBufferLike-backed, which is not a valid BlobPart —
 * BlobPart requires an ArrayBuffer-backed view, because the underlying buffer could in principle be
 * a SharedArrayBuffer. This is zero-copy (a view over the same memory, not a duplicate), so upload
 * memory is unchanged, and fs.readFileSync never returns a SharedArrayBuffer-backed Buffer.
 *
 * Spelled `Uint8Array<ArrayBuffer>` rather than `BlobPart` because BlobPart is not in scope
 * under ts-jest's resolution — the generic is the only form that satisfies both `tsc -p` and
 * the test run.
 *
 * It lives in this internal module, not src/http.ts, because the `Uint8Array<ArrayBuffer>`
 * generic is TypeScript 5.7+ syntax: nothing the package entry point exports imports this file,
 * so the generic never reaches the declarations a consumer's compiler reads (TypeScript 4.7+
 * stays supported).
 */
export const toBlobPart = (buffer: Buffer): Uint8Array<ArrayBuffer> =>
  new Uint8Array(buffer.buffer as ArrayBuffer, buffer.byteOffset, buffer.byteLength);
