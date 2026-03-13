# JS/TS SDK Rules

## Zero Runtime Dependencies

The JS SDK has **no runtime dependencies** — only devDependencies (TypeScript, Jest, ts-jest, @types).
Use native `fetch` (Node 18+ global) for HTTP. Use native `fs` and `path` for file operations.
Never add runtime dependencies without explicit approval.

## Static Class Pattern

Both `TurboSign` and `TurboPartner` use static classes:
```typescript
TurboSign.configure({ apiKey, orgId, senderEmail });
const result = await TurboSign.sendSignature({ ... });
```
No `new TurboSign()` — all methods are static. The `HttpClient` instance is held as a private static field.

## TypeScript Configuration

- **Strict mode**: `strict: true` in tsconfig
- **Target**: ES2020
- **Module**: commonjs
- **Declaration files**: Generated in `dist/`
- All public APIs must have TypeScript types — no `any` in public interfaces

## senderEmail Validation

`senderEmail` is **required** for TurboSign (not for TurboPartner). The HttpClient throws `ValidationError` if missing unless `skipSenderValidation: true` (used internally by TurboPartner).

## File Type Detection

Use **magic bytes** to detect file types, not file extensions:
- PDF: bytes `0x25 0x50 0x44 0x46` (`%PDF`)
- DOCX: bytes `0x50 0x4B` (`PK`) + contains `word/`
- PPTX: bytes `0x50 0x4B` (`PK`) + contains `ppt/`

## Response Unwrapping

The `smartUnwrap` method strips the `{ data: ... }` wrapper when the response object has only a `data` key. This is automatic — module methods don't need to unwrap manually.

## Testing

- Framework: Jest + ts-jest
- Run: `npm test` (from `packages/js-sdk/`)
- Mock `global.fetch` — never make real HTTP calls in tests
- Test files live in `packages/js-sdk/tests/`
