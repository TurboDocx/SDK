# Cross-SDK Feature Parity

All SDKs must implement the same operations. When adding a feature to one SDK, implement it in all others (or open tracking issues).

## Required TurboSign Operations

| Operation | JS | Py | Go | PHP | Java | Ruby |
|---|---|---|---|---|---|---|
| configure | `configure()` | `configure()` | constructor (`NewTurboSignClient`) | `configure()` | constructor/builder | `configure()` |
| createSignatureReviewLink | `createSignatureReviewLink()` | `create_signature_review_link()` | `CreateSignatureReviewLink()` | `createSignatureReviewLink()` | `createSignatureReviewLink()` | `create_signature_review_link()` |
| sendSignature | `sendSignature()` | `send_signature()` | `SendSignature()` | `sendSignature()` | `sendSignature()` | `send_signature()` |
| getStatus | `getStatus()` | `get_status()` | `GetStatus()` | `getStatus()` | `getStatus()` | `get_status()` |
| download | `download()` | `download()` | `Download()` | `download()` | `download()` | `download()` |
| void | `void()` | `void_document()` | `VoidDocument()` | `void()` | `voidDocument()` | `void_document()` |
| resend | `resend()` | `resend_email()` | `ResendEmail()` | `resend()` | `resendEmail()` | `resend_email()` |
| getAuditTrail | `getAuditTrail()` | `get_audit_trail()` | `GetAuditTrail()` | `getAuditTrail()` | `getAuditTrail()` | `get_audit_trail()` |
| sendReminder | `sendReminder()` | `send_reminder()` | `SendReminder()` | `sendReminder()` | `sendReminder()` | `send_reminder()` |

**sendReminder note:** a standalone nudge, deliberately decoupled from the automatic reminder
schedule — it ignores the configured cadence, works when reminders are disabled or the per-signer
cap is spent, and does not consume that cap. Only CURRENT-signing-order signers are emailed; a
later-order or already-signed recipient comes back as a `skipped_*` result rather than being
dropped. `recipientIds` is optional (omit to remind everyone eligible); when supplied the API is
all-or-nothing. Every SDK omits the key entirely for an empty list — the API requires at least one
id when the key is present, so sending `[]` would guarantee a 400.

**Schedule overrides:** both send paths (`createSignatureReviewLink`, `sendSignature`) accept the
eight per-document reminder/expiration fields. Two rules every SDK follows:
1. **Durations are JSON-encoded on BOTH paths.** `multipart/form-data` cannot carry a nested
   `{value, unit}`, and the API decodes a JSON-string duration on either content type — so one
   code path serves multipart and JSON, exactly as `recipients`/`fields` are already handled.
2. **Presence is null-checked, never truthiness.** `false` (feature off), `0` (no reminders /
   never warn) and `-1` (unlimited) are all meaningful. Go uses pointer fields and Java boxed
   types specifically so "unset" stays distinguishable from a deliberate zero value; a truthiness
   check would drop them and silently fall back to the org default.

**Configure note:** Go and Java do NOT expose a named `configure()` — Go configures via per-module
constructors (`NewTurboSignClient`, `NewQuoteClient`, `NewWebhooksClient`, …) and Java via
constructors/builders (`new TurboSign(httpClient)`, `TurboQuoteClient.builder()…build()`). That is
the sanctioned idiomatic form, not a parity gap.

**PHP void note:** PHP ships `TurboSign::void()` (not `voidDocument()`) — `void` is a valid PHP
method name and the method is published; renaming would break users. The table above reflects the
shipped name.

## Required TurboPartner Operations

- Organization CRUD: create, list, getDetails, update, delete
- Organization entitlements: updateEntitlements
- Organization users: list, add, update role, remove, resend invitation
- Organization API keys: list, create, update, revoke
- Partner API keys: list, create, update, revoke
- Partner users: list, add, update permissions, remove, resend invitation
- Audit logs: list with filtering

## Required TurboWebhooks Operations

| Operation | JS | Py | Go | PHP | Java | Ruby |
|---|---|---|---|---|---|---|
| configure | `configure()` | `configure()` | constructor (`NewWebhooksClient` / `NewWebhooksClientWithConfig`) | `configure()` / `configureFromCredentials()` | constructor/builder | `configure()` |
| createWebhook | `createWebhook()` | `create_webhook()` | `CreateWebhook()` | `createWebhook()` | `createWebhook()` | `create_webhook()` |
| getWebhook | `getWebhook()` | `get_webhook()` | `GetWebhook()` | `getWebhook()` | `getWebhook()` | `get_webhook()` |
| updateWebhook | `updateWebhook()` | `update_webhook()` | `UpdateWebhook()` | `updateWebhook()` | `updateWebhook()` | `update_webhook()` |
| deleteWebhook | `deleteWebhook()` | `delete_webhook()` | `DeleteWebhook()` | `deleteWebhook()` | `deleteWebhook()` | `delete_webhook()` |
| testWebhook | `testWebhook()` | `test_webhook()` | `TestWebhook()` | `testWebhook()` | `testWebhook()` | `test_webhook()` |
| notifyWebhook | `notifyWebhook()` | `notify_webhook()` | `NotifyWebhook()` | `notifyWebhook()` | `notifyWebhook()` | `notify_webhook()` |
| regenerateWebhookSecret | `regenerateWebhookSecret()` | `regenerate_webhook_secret()` | `RegenerateWebhookSecret()` | `regenerateWebhookSecret()` | `regenerateWebhookSecret()` | `regenerate_webhook_secret()` |
| listWebhookDeliveries | `listWebhookDeliveries()` | `list_webhook_deliveries()` | `ListWebhookDeliveries()` | `listWebhookDeliveries()` | `listWebhookDeliveries()` | `list_webhook_deliveries()` |
| replayWebhookDelivery | `replayWebhookDelivery()` | `replay_webhook_delivery()` | `ReplayWebhookDelivery()` | `replayWebhookDelivery()` | `replayWebhookDelivery()` | `replay_webhook_delivery()` |
| getWebhookStats | `getWebhookStats()` | `get_webhook_stats()` | `GetWebhookStats()` | `getWebhookStats()` | `getWebhookStats()` | `get_webhook_stats()` |
| verifyWebhookSignature (free function helper) | `verifyWebhookSignature()` | `verify_webhook_signature()` | `VerifyWebhookSignature()` | `verifyWebhookSignature()` | `WebhookSignatureVerifier.verify()` | `TurboDocxSdk.verify_webhook_signature` |

**Notes:**
- All TurboWebhooks methods require an **administrator** TDX- key (the backend route gate is `requireOrgRole(administrator)`).
- **No `listWebhooks` by design.** The SDK is locked to a single fixed-name webhook per org (`signature`) so it stays in sync with the UI's Signature Webhooks settings page. A list method would either return `[]` / `[the-one-webhook]` (useless) or surface webhooks the SDK can't act on (the other methods are hardcoded to `/api/webhooks/signature`). Users who need multi-webhook management call the REST API directly.
- `verifyWebhookSignature` is a free function, not a method on `TurboWebhooks` — it has no `apiKey` / `orgId` dependency and is used by webhook *receivers*.
- **Java has no free functions.** The webhook signature helper is exposed as `WebhookSignatureVerifier.verify(...)`, a static method on a final utility class. Semantically equivalent to the free-function form used in JS / Py / Go / PHP — just expressed in idiomatic Java.
- **PHP `TurboWebhooks::configure()` takes a typed config object** (`HttpClientConfig`), matching the SDK-wide PHP convention used by `TurboSign`, `TurboPartner`, and `Deliverable`. For the flat-args form (`$apiKey`, `$orgId`, …) used in the quickstart, call `TurboWebhooks::configureFromCredentials(...)` instead.
- `testWebhook` and `notifyWebhook` currently route through the same backend handler and return identical shapes. Both are exposed for symmetry with the backend surface; prefer `testWebhook` in new code.
- The HMAC format the helper must verify: header `X-TurboDocx-Signature: sha256=<hex>`, signed string `${timestamp}.${rawBody}`, HMAC-SHA256, with a configurable timestamp tolerance (default 300s) to prevent replay attacks. Use the language's constant-time comparison primitive (`crypto.timingSafeEqual` / `hmac.compare_digest` / `hmac.Equal` / `hash_equals` / `MessageDigest.isEqual`).

## Client Context (Audit-Trail Device/Location Headers)

Every SDK auto-attaches request headers describing the calling environment so the
TurboSign **audit trail** records real device/location instead of "Unknown" when
the caller is a container/VM. This is wired into the shared HTTP client (so it
covers JSON, multipart upload, and raw-download paths) and exposed for overrides
via a `clientContext` option on the TurboSign config/constructor.

| Header | Source | Notes |
|---|---|---|
| `User-Agent` | auto | **Must** start with the canonical `@turbodocx/sdk/<version>` token — the backend `parseTurboDocxSdkUserAgent` only classifies a request as an SDK call on that exact prefix. Suffix is language-specific: `(Runtime/x; OS; arch; host=<hostname>)`. |
| `X-Timezone` | auto | Host timezone (IANA where available, abbreviation otherwise). |
| `Accept-Language` | auto | Host BCP-47 tag (e.g. `en-US`). Backend surfaces it as audit `language` for SDK calls (validated as a BCP-47 tag server-side; non-language `C`/`POSIX` locales are dropped). |
| `X-Device-Fingerprint` | auto | Stable SHA-256 of hostname/OS/arch. |
| `X-Forwarded-For` | **opt-in** | Sent only when the caller sets `ipAddress`. Never auto-filled: the host only sees a private IP. **The backend ignores it** — see below. |

**`ipAddress` does not change the recorded IP.** The backend's `getTrustedClientIp` takes the
entry its own load balancer *appended* (rightmost-wins), not the leftmost — that is deliberate,
because the leftmost entry is caller-controlled and was how the audit IP used to be spoofable.
So a caller-supplied `X-Forwarded-For` is read and discarded. This is the correct security
posture and callers rarely need the override: the backend already resolves the real public IP
from the connection itself, which is what a datacenter caller (Postman, n8n, a CI runner) wants.
The field is kept for API compatibility; treat it as a no-op for the audit trail rather than a
way to attribute a send to another IP.

Override fields (idiomatic casing per language): `userAgent` / `user_agent`, `ipAddress` / `ip_address`, `timezone`, `language`, `deviceFingerprint` / `device_fingerprint`. The auto-generated values are computed once at client construction. In browsers, `User-Agent` is a forbidden fetch header, so the JS SDK's value is dropped and the real browser UA is sent (and handled by the backend's normal UA path).

Per-SDK location: `client-context.ts` (JS), `utils/client_context.py` (Py), `client_context.go` (Go), `Utils/ClientContext.php` (PHP), `ClientContext.java` (Java), `client_context.rb` (Ruby).

**All six SDKs send these headers on every path, including TurboPartner.** JS, Go, PHP and
Ruby route partner/webhooks/deliverable through the single shared HTTP client, so those paths
get the headers for free. Java and Python each have a *separate* `PartnerHttpClient`; both now
accept a client context (`TurboPartnerClient.Builder.clientContext(...)` in Java,
`TurboPartner.configure(client_context=...)` in Python, each defaulting to auto-detect) and
merge the resolved context headers into their header builder ahead of `Authorization` +
`Content-Type`, so the SDK's own protocol headers still win. The partner **audit log** records
`userAgent` (`handlers/Partner/auditLogging.ts`), so a partner call from any SDK is now logged
with the canonical `@turbodocx/sdk/…` token.

## Required Deliverable Operations

Canonical (JS) names; every SDK implements all 7 with its idiomatic casing (see the mapping below).

| Operation | Endpoint |
|---|---|
| `listDeliverables` | GET `/v1/deliverable` |
| `generateDeliverable` | POST `/v1/deliverable` |
| `getDeliverableDetails` | GET `/v1/deliverable/{id}` |
| `updateDeliverableInfo` | PATCH `/v1/deliverable/{id}` |
| `deleteDeliverable` | DELETE `/v1/deliverable/{id}` |
| `downloadSourceFile` | GET `/v1/deliverable/file/{id}` |
| `downloadPDF` | GET `/v1/deliverable/file/pdf/{id}` |

## Required TurboQuote Operations

Canonical (JS) names grouped by sub-resource; every SDK implements ALL of these with its
idiomatic casing (Python/Ruby snake_case, Go PascalCase with upper-cased initialisms).
68 operations total.

- **Number config (admin only):** `getQuoteNumberConfig`, `updateQuoteNumberConfig`
- **Quotes CRUD:** `listQuotes`, `createQuote`, `getQuote`, `updateQuote`, `deleteQuote`,
  `duplicateQuote`, `applyPriceBook`, `removePriceBook`, `downloadQuotePdf`
- **Quote status transitions:** `sendQuote`, `sendQuoteWithDeliverable`, `declineQuote`,
  `voidQuote`, `handleExpiredQuote`
- **Line items:** `listLineItems`, `addLineItems`, `addBundleLineItems`, `updateLineItem`,
  `removeLineItem`
- **Products:** `listProducts`, `createProduct`, `bulkCreateProducts`, `getProduct`,
  `updateProduct`, `deleteProduct`, `duplicateProduct`, `getProductPrimaryImages`
- **Price books:** `listPriceBooks`, `createPriceBook`, `bulkCreatePriceBooks`, `getPriceBook`,
  `updatePriceBook`, `deletePriceBook`, `duplicatePriceBook`, `listPriceBookProducts`
- **Bundles:** `listBundles`, `createBundle`, `bulkCreateBundles`, `getBundle`, `updateBundle`,
  `deleteBundle`, `duplicateBundle`
- **Companies:** `listCompanies`, `createCompany`, `bulkCreateCompanies`, `getCompany`,
  `updateCompany`, `deleteCompany`, `listCompanyContacts`
- **Contacts:** `listContacts`, `createContact`, `bulkCreateContacts`, `updateContact`,
  `deleteContact`
- **Quote templates:** `listTemplates`, `getTemplate` (org default, singular endpoint),
  `getTemplateById`, `createTemplate`, `updateTemplate`, `deleteTemplate`
- **Types/categories:** `listTypes`, `createType`, `bulkCreateTypes`, `updateType`, `deleteType`
- **Convenience:** `createAndSend` (composite: create → add items → send)

**Bulk creates** (`bulkCreate*`): POST `{resource}/bulk` with a `{ rows: [...] }` envelope; rows
use the single-create request shape. Response is a partial-success report
`{ imported, failed: [{row, reason}], adjusted: [{row, reason}] }` (`row` is 1-indexed); a failed
row does NOT throw and does not roll back earlier rows. Max 500 rows per request (400 above the
cap). Admin + contributor roles. SDKs do NOT validate rows or the cap client-side.

## Deliberate Exclusions (do not re-add without a decision)

Backend endpoints in SDK domains that are intentionally NOT wrapped — the UI-flow rule
(precedent: quote-number `preview-floor`, a frontend live-preview helper):

- **TurboQuote:** `POST /v1/quotes/number-config/preview-floor` (UI preview);
  `POST /v1/quotes/:id/items/reorder` + `/items/category-order` (drag-and-drop presentation);
  the **approval workflow** family (`/v1/quotes/workflows*`, `/:id/approve`,
  `/approval-requests`, `/:id/approval-activity`) — backend feature not yet
  production-complete; revisit when it ships.
- **TurboSign:** `GET /turbosign/documents/signature-documents` (list) and the
  `/turbosign/bulk/*` mail-merge family — deferred to a future pass, not rejected;
  the two-step prep flow (`upload` / `from-deliverable` / `from-template` /
  `update-with-recipients` / per-doc `prepare-for-*`) — the single-step endpoints the SDK
  wraps accept file/fileLink/deliverableId/templateId and cover the API use case.
- **Deliverable:** `/deliverable-folder` + `/deliverable-item` (unversioned, org-content
  organization), `previewpdflink`, `pdf/:filename` (UI).
- **TurboPartner:** `/partner/access` + `/partner/:id/context` (UI bootstrap/dashboard).
- **TurboWebhooks:** `GET /api/webhooks` list — see the "No `listWebhooks` by design" note.

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
