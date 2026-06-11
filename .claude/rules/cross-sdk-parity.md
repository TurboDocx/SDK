# Cross-SDK Feature Parity

All SDKs must implement the same operations. When adding a feature to one SDK, implement it in all others (or open tracking issues).

## Required TurboSign Operations

| Operation | JS | Py | Go | PHP | Java |
|---|---|---|---|---|---|
| configure | `configure()` | `configure()` | `Configure()` | `configure()` | `configure()` |
| createSignatureReviewLink | `createSignatureReviewLink()` | `create_signature_review_link()` | `CreateSignatureReviewLink()` | `createSignatureReviewLink()` | `createSignatureReviewLink()` |
| sendSignature | `sendSignature()` | `send_signature()` | `SendSignature()` | `sendSignature()` | `sendSignature()` |
| getStatus | `getStatus()` | `get_status()` | `GetStatus()` | `getStatus()` | `getStatus()` |
| download | `download()` | `download()` | `Download()` | `download()` | `download()` |
| void | `void()` | `void_document()` | `VoidDocument()` | `voidDocument()` | `voidDocument()` |
| resend | `resend()` | `resend_email()` | `ResendEmail()` | `resend()` | `resendEmail()` |
| getAuditTrail | `getAuditTrail()` | `get_audit_trail()` | `GetAuditTrail()` | `getAuditTrail()` | `getAuditTrail()` |

## Required TurboPartner Operations

- Organization CRUD: create, list, getDetails, update, delete
- Organization entitlements: updateEntitlements
- Organization users: list, add, update role, remove, resend invitation
- Organization API keys: list, create, update, revoke
- Partner API keys: list, create, update, revoke
- Partner users: list, add, update permissions, remove, resend invitation
- Audit logs: list with filtering

## Required TurboWebhooks Operations

| Operation | JS | Py | Go | PHP | Java |
|---|---|---|---|---|---|
| configure | `configure()` | `configure()` | `Configure()` | `configure()` | `configure()` |
| createWebhook | `createWebhook()` | `create_webhook()` | `CreateWebhook()` | `createWebhook()` | `createWebhook()` |
| getWebhook | `getWebhook()` | `get_webhook()` | `GetWebhook()` | `getWebhook()` | `getWebhook()` |
| updateWebhook | `updateWebhook()` | `update_webhook()` | `UpdateWebhook()` | `updateWebhook()` | `updateWebhook()` |
| deleteWebhook | `deleteWebhook()` | `delete_webhook()` | `DeleteWebhook()` | `deleteWebhook()` | `deleteWebhook()` |
| testWebhook | `testWebhook()` | `test_webhook()` | `TestWebhook()` | `testWebhook()` | `testWebhook()` |
| notifyWebhook | `notifyWebhook()` | `notify_webhook()` | `NotifyWebhook()` | `notifyWebhook()` | `notifyWebhook()` |
| regenerateWebhookSecret | `regenerateWebhookSecret()` | `regenerate_webhook_secret()` | `RegenerateWebhookSecret()` | `regenerateWebhookSecret()` | `regenerateWebhookSecret()` |
| listWebhookDeliveries | `listWebhookDeliveries()` | `list_webhook_deliveries()` | `ListWebhookDeliveries()` | `listWebhookDeliveries()` | `listWebhookDeliveries()` |
| replayWebhookDelivery | `replayWebhookDelivery()` | `replay_webhook_delivery()` | `ReplayWebhookDelivery()` | `replayWebhookDelivery()` | `replayWebhookDelivery()` |
| getWebhookStats | `getWebhookStats()` | `get_webhook_stats()` | `GetWebhookStats()` | `getWebhookStats()` | `getWebhookStats()` |
| verifyWebhookSignature (free function helper) | `verifyWebhookSignature()` | `verify_webhook_signature()` | `VerifyWebhookSignature()` | `verifyWebhookSignature()` | `WebhookSignatureVerifier.verify()` |

**Notes:**
- All TurboWebhooks methods require an **administrator** TDX- key (the backend route gate is `requireOrgRole(administrator)`).
- **No `listWebhooks` by design.** The SDK is locked to a single fixed-name webhook per org (`signature`) so it stays in sync with the UI's Signature Webhooks settings page. A list method would either return `[]` / `[the-one-webhook]` (useless) or surface webhooks the SDK can't act on (the other methods are hardcoded to `/api/webhooks/signature`). Users who need multi-webhook management call the REST API directly.
- `verifyWebhookSignature` is a free function, not a method on `TurboWebhooks` — it has no `apiKey` / `orgId` dependency and is used by webhook *receivers*.
- **Java has no free functions.** The webhook signature helper is exposed as `WebhookSignatureVerifier.verify(...)`, a static method on a final utility class. Semantically equivalent to the free-function form used in JS / Py / Go / PHP — just expressed in idiomatic Java.
- **PHP `TurboWebhooks::configure()` takes a typed config object** (`HttpClientConfig`), matching the SDK-wide PHP convention used by `TurboSign`, `TurboPartner`, and `Deliverable`. For the flat-args form (`$apiKey`, `$orgId`, …) used in the quickstart, call `TurboWebhooks::configureFromCredentials(...)` instead.
- `testWebhook` and `notifyWebhook` currently route through the same backend handler and return identical shapes. Both are exposed for symmetry with the backend surface; prefer `testWebhook` in new code.
- The HMAC format the helper must verify: header `X-TurboDocx-Signature: sha256=<hex>`, signed string `${timestamp}.${rawBody}`, HMAC-SHA256, with a configurable timestamp tolerance (default 300s) to prevent replay attacks. Use the language's constant-time comparison primitive (`crypto.timingSafeEqual` / `hmac.compare_digest` / `hmac.Equal` / `hash_equals` / `MessageDigest.isEqual`).

## Naming Conventions by Language

| Language | Methods | Classes | Files | Constants |
|---|---|---|---|---|
| JS/TS | camelCase | PascalCase | kebab-case | UPPER_SNAKE |
| Python | snake_case | PascalCase | snake_case | UPPER_SNAKE |
| Go | PascalCase (exported) | PascalCase | snake_case | PascalCase |
| PHP | camelCase | PascalCase | PascalCase | UPPER_SNAKE |
| Java | camelCase | PascalCase | PascalCase | UPPER_SNAKE |
| Ruby | snake_case | PascalCase | snake_case | UPPER_SNAKE |

### Same operation, different casing — the canonical method-name mapping

Every public method is the **same logical operation across all SDKs**; only the casing changes to match each language's idiom. When you add or rename a method, name it the idiomatic form in **every** SDK, and use the same form in that SDK's docs/examples. A reader switching languages should be able to translate a method name mechanically.

The transform from the canonical (JS camelCase) name:

| Canonical (JS/TS, PHP, Java) | Python / Ruby (snake_case) | Go (exported PascalCase) |
|---|---|---|
| `generateDeliverable` | `generate_deliverable` | `GenerateDeliverable` |
| `sendSignature` | `send_signature` | `SendSignature` |
| `createWebhook` | `create_webhook` | `CreateWebhook` |
| `getWebhookStats` | `get_webhook_stats` | `GetWebhookStats` |
| `sendQuoteWithDeliverable` | `send_quote_with_deliverable` | `SendQuoteWithDeliverable` |

Rules:
- **Acronyms follow the language, not the canonical spelling.** Go exports initialisms upper-cased (`ID`, `API`, `PDF`, `URL`): `downloadQuotePdf` → Go `DownloadQuotePDF`, `documentId` (field) → Go `DocumentID`. JS/PHP/Java keep `Pdf`/`Id`; Python/Ruby use `pdf`/`id`.
- **Request-body keys do NOT get re-cased.** Method *names* are idiomatic per language, but the keys inside a request hash/object are passed to the API verbatim, so they stay **camelCase** (`documentName`, `recipientEmail`, `signingOrder`) in every language — including Python/Ruby. The SDKs do not snake→camel-convert request payloads. (This is a common doc bug: a Python example writing `document_name=` silently drops the value.)
- **Free functions** follow the same casing rule (`verifyWebhookSignature` / `verify_webhook_signature` / `VerifyWebhookSignature`); Java exposes it as a static method on a utility class (`WebhookSignatureVerifier.verify`) since Java has no free functions.

When documenting a method on a language page, use that language's form throughout — never copy a JS camelCase call into a Python/Ruby/Go example.

## Source of Truth: The Backend

The backend (`/home/nicolas/repos/RapidDocxBackend`) is the single source of truth — not the JS SDK. When porting or auditing:

1. **Verify against backend Joi schemas**, not just the JS types. The JS SDK itself may have gaps (e.g., missing enum values, wrong optionality).
2. **Check the handler response shape** to confirm what keys the API actually returns (`result` vs `results`, extra keys like `statusInfo`, `documentId`, `updatedCount`).
3. **Check null semantics on PATCH**: read the Joi schema for `.allow(null)` — that's how you know which fields can be null-cleared vs which reject null with a 400.
4. **Check query param validation**: some list endpoints accept `string | string[]` for filter params — the backend coerces both.

## Porting a New Endpoint — Checklist

When adding a method to any SDK:

1. Read the **backend route file** for the exact path, HTTP method, and middleware
2. Read the **backend Joi schema** for request body fields, types, required/optional, and `.allow(null)` annotations
3. Read the **backend handler** for the response shape (what keys, what nesting)
4. Check if the response is wrapped in `{ data: ... }` (all TurboQuote endpoints are)
5. Implement in the target SDK with correct types
6. Write tests that verify: correct HTTP method, correct path, correct request body serialization (including null handling for PATCH), correct response unwrapping
7. Port the same test to all other SDKs

## Common Pitfalls (Learned from Audits)

- **PATCH null semantics**: JS `JSON.stringify` includes explicit `null` values; Go/Java/Python serializers may omit them. SDKs must include `null` when the user explicitly sets a field to null, and omit fields the user didn't touch. This is critical for clearing nullable fields like `priceBookId`, `validUntil`, `taxRate`.
- **Request mutation**: Never mutate the caller's input object/hash/dict. Use spread/copy/dup before extracting or deleting keys. (Bug found in Ruby and Python `createAndSend`.)
- **Enum completeness**: Always derive enum/literal/const values from the backend constants file (`TurboQuotesConstants.ts`), not from the JS SDK types.
- **Multipart uploads**: Detect MIME type from magic bytes, don't hardcode. The backend validates image types server-side with `file-type`.
- **Integer vs Decimal**: Check the backend Joi schema — `Joi.number().integer()` means the SDK should use int, not float/double.
- **Response key flips**: Some endpoints return `result` (singular) for single-item input and `results` (plural) for array input. The SDK must handle both.

## New SDK Checklist

1. Create `packages/<lang>-sdk/` directory
2. Implement TurboSign with all operations above
3. Implement TurboPartner with all operations above
4. Implement TurboWebhooks with all operations above + `verifyWebhookSignature` helper
5. Implement TurboQuote with all operations (see JS SDK for method list)
6. Implement error hierarchy (TurboDocxError + 6 subtypes: Authentication, Authorization, Validation, NotFound, RateLimit, Network)
7. Implement response normalizer (boolean + decimal field coercion)
8. Write tests matching parity of existing SDKs
9. Add CI job to `.github/workflows/ci.yml`
10. Add publish workflow `.github/workflows/publish-<lang>.yml`
11. Create README with install, configure, and usage examples
