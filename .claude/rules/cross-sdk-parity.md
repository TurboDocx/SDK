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
4. Implement error hierarchy (TurboDocxError + 5 subtypes)
5. Write tests matching parity of existing SDKs
6. Add CI job to `.github/workflows/ci.yml`
7. Add publish workflow `.github/workflows/publish-<lang>.yml`
8. Create README with install, configure, and usage examples
