# Cross-SDK Feature Parity

All SDKs must implement the same operations. When adding a feature to one SDK, implement it in all others (or open tracking issues).

## Required TurboSign Operations

| Operation | JS | Py | Go | PHP | Java | CLI |
|---|---|---|---|---|---|---|
| configure | `configure()` | `configure()` | `Configure()` | `configure()` | `configure()` | `login` / `config set` |
| createSignatureReviewLink | `createSignatureReviewLink()` | `create_signature_review_link()` | `CreateSignatureReviewLink()` | `createSignatureReviewLink()` | `createSignatureReviewLink()` | `sign review` |
| sendSignature | `sendSignature()` | `send_signature()` | `SendSignature()` | `sendSignature()` | `sendSignature()` | `sign send` |
| getStatus | `getStatus()` | `get_status()` | `GetStatus()` | `getStatus()` | `getStatus()` | `sign status` |
| download | `download()` | `download()` | `Download()` | `download()` | `download()` | `sign download` |
| void | `void()` | `void_document()` | `VoidDocument()` | `voidDocument()` | `voidDocument()` | `sign void` |
| resend | `resend()` | `resend_email()` | `ResendEmail()` | `resend()` | `resendEmail()` | `sign resend` |
| getAuditTrail | `getAuditTrail()` | `get_audit_trail()` | `GetAuditTrail()` | `getAuditTrail()` | `getAuditTrail()` | `sign audit` |

## Required TurboPartner Operations

- Organization CRUD: create, list, getDetails, update, delete
- Organization entitlements: updateEntitlements
- Organization users: list, add, update role, remove, resend invitation
- Organization API keys: list, create, update, revoke
- Partner API keys: list, create, update, revoke
- Partner users: list, add, update permissions, remove, resend invitation
- Audit logs: list with filtering

| Operation | CLI |
|---|---|
| Organization create | `partner org create` |
| Organization list | `partner org list` |
| Organization get details | `partner org get` |
| Organization update | `partner org update` |
| Organization delete | `partner org delete` |
| Organization entitlements | `partner org entitlements` |
| Org user list | `partner org user list` |
| Org user add | `partner org user add` |
| Org user update role | `partner org user update` |
| Org user remove | `partner org user remove` |
| Org user resend invite | `partner org user resend-invite` |
| Org API key list | `partner org apikey list` |
| Org API key create | `partner org apikey create` |
| Org API key update | `partner org apikey update` |
| Org API key revoke | `partner org apikey revoke` |
| Partner API key list | `partner apikey list` |
| Partner API key create | `partner apikey create` |
| Partner API key update | `partner apikey update` |
| Partner API key revoke | `partner apikey revoke` |
| Partner user list | `partner user list` |
| Partner user add | `partner user add` |
| Partner user update | `partner user update` |
| Partner user remove | `partner user remove` |
| Partner user resend invite | `partner user resend-invite` |
| Audit logs | `partner audit list` |

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
