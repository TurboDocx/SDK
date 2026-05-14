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
| listWebhooks | `listWebhooks()` | `list_webhooks()` | `ListWebhooks()` | `listWebhooks()` | `listWebhooks()` |
| getWebhook | `getWebhook()` | `get_webhook()` | `GetWebhook()` | `getWebhook()` | `getWebhook()` |
| updateWebhook | `updateWebhook()` | `update_webhook()` | `UpdateWebhook()` | `updateWebhook()` | `updateWebhook()` |
| deleteWebhook | `deleteWebhook()` | `delete_webhook()` | `DeleteWebhook()` | `deleteWebhook()` | `deleteWebhook()` |
| testWebhook | `testWebhook()` | `test_webhook()` | `TestWebhook()` | `testWebhook()` | `testWebhook()` |
| notifyWebhook | `notifyWebhook()` | `notify_webhook()` | `NotifyWebhook()` | `notifyWebhook()` | `notifyWebhook()` |
| regenerateWebhookSecret | `regenerateWebhookSecret()` | `regenerate_webhook_secret()` | `RegenerateWebhookSecret()` | `regenerateWebhookSecret()` | `regenerateWebhookSecret()` |
| listWebhookDeliveries | `listWebhookDeliveries()` | `list_webhook_deliveries()` | `ListWebhookDeliveries()` | `listWebhookDeliveries()` | `listWebhookDeliveries()` |
| replayWebhookDelivery | `replayWebhookDelivery()` | `replay_webhook_delivery()` | `ReplayWebhookDelivery()` | `replayWebhookDelivery()` | `replayWebhookDelivery()` |
| getWebhookStats | `getWebhookStats()` | `get_webhook_stats()` | `GetWebhookStats()` | `getWebhookStats()` | `getWebhookStats()` |
| verifyWebhookSignature (free function helper) | `verifyWebhookSignature()` | `verify_webhook_signature()` | `VerifyWebhookSignature()` | `verifyWebhookSignature()` | `verifyWebhookSignature()` |

**Notes:**
- All TurboWebhooks methods require an **administrator** TDX- key (the backend route gate is `requireOrgRole(administrator)`).
- `verifyWebhookSignature` is a free function, not a method on `TurboWebhooks` — it has no `apiKey` / `orgId` dependency and is used by webhook *receivers*.
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

## New SDK Checklist

1. Create `packages/<lang>-sdk/` directory
2. Implement TurboSign with all operations above
3. Implement TurboPartner with all operations above
4. Implement TurboWebhooks with all operations above + `verifyWebhookSignature` helper
5. Implement error hierarchy (TurboDocxError + 6 subtypes: Authentication, Authorization, Validation, NotFound, RateLimit, Network)
6. Write tests matching parity of existing SDKs
7. Add CI job to `.github/workflows/ci.yml`
8. Add publish workflow `.github/workflows/publish-<lang>.yml`
9. Create README with install, configure, and usage examples
