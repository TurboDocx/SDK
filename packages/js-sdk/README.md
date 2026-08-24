[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/js-sdk/banner.png)](https://www.turbodocx.com)

<div align="center">

# @turbodocx/sdk

**Official JavaScript/TypeScript SDK for TurboDocx**

The most developer-friendly **DocuSign & PandaDoc alternative** for **e-signatures** and **document generation**. Send documents for signature and automate document workflows programmatically.

[![NPM Version](https://img.shields.io/npm/v/@turbodocx/sdk.svg)](https://npmjs.org/package/@turbodocx/sdk)
[![npm downloads](https://img.shields.io/npm/dm/@turbodocx/sdk)](https://www.npmjs.com/package/@turbodocx/sdk)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@turbodocx/sdk)](https://bundlephobia.com/package/@turbodocx/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-agentskills.io-8A2BE2)](https://agentskills.io)
[![Quickstart Skill](https://skills.sh/b/TurboDocx/quickstart)](https://github.com/TurboDocx/quickstart)

[Documentation](https://docs.turbodocx.com/docs) • [API Reference](https://docs.turbodocx.com/docs/SDKs/) • [Examples](#examples) • [Discord](https://discord.gg/NYKwz4BcpX)

</div>

---

## ⚡ Skip the boilerplate — let an agent scaffold it for you

Have an AI coding agent (Claude Code, Cursor, Copilot, Codex, Gemini CLI, OpenCode) install this SDK, configure your env, write working route handlers, and wire them into your app:

```bash
npx skills add TurboDocx/quickstart
```

Then run `/turbodocx-sdk` inside your agent — or one of the focused shortcuts:

| Shortcut | What it scaffolds |
|---|---|
| `/turbodocx-sdk turbosign` | Send documents for e-signature, check status, download signed PDF |
| `/turbodocx-sdk deliverable` | Generate documents from templates with variable substitution |
| `/turbodocx-sdk turbopartner` | Provision and manage customer organizations (partner accounts) |
| `/turbodocx-sdk turbowebhooks` | Subscribe to `signature.document.completed` events + verify HMAC |
| `/turbodocx-sdk turboquote` | Build and send sales quotes with line items, bundles, and price books |

The skill auto-detects your framework (Express, NestJS, Next.js, Fastify, …) and follows your existing project conventions. Source: [github.com/TurboDocx/quickstart](https://github.com/TurboDocx/quickstart).

---

## Why TurboDocx?

A modern, developer-first alternative to legacy e-signature platforms:

| Looking for... | TurboDocx offers |
|----------------|------------------|
| DocuSign API alternative | Simple REST API, transparent pricing |
| PandaDoc alternative | Document generation + e-signatures in one SDK |
| HelloSign/Dropbox Sign alternative | Full API access, modern DX |
| Adobe Sign alternative | Quick integration, developer-friendly docs |
| SignNow alternative | Predictable costs, responsive support |
| Documint alternative | DOCX/PDF generation from templates |
| WebMerge alternative | Data-driven document automation |

**Other platforms we compare to:** SignRequest, SignEasy, Zoho Sign, Eversign, SignWell, Formstack Documents

### TurboDocx Ecosystem

| Package | Description |
|---------|-------------|
| [@turbodocx/html-to-docx](https://github.com/turbodocx/html-to-docx) | Convert HTML to DOCX - fastest JS library |
| [@turbodocx/n8n-nodes-turbodocx](https://github.com/turbodocx/n8n-nodes-turbodocx) | n8n community nodes for TurboDocx |
| [TurboDocx Writer](https://appsource.microsoft.com/product/office/WA200007397) | Microsoft Word add-in |

---

## Features

- 🚀 **Production-Ready** — Battle-tested, processing thousands of documents daily
- 📝 **Full TypeScript Support** — Comprehensive type definitions with IntelliSense
- ⚡ **Lightweight** — Zero dependencies, tree-shakeable
- 🔄 **Promise-based** — Modern async/await API
- 🛡️ **Type-safe** — Catch errors at compile time, not runtime
- 🤖 **100% n8n Parity** — Same operations as our n8n community nodes

---

## Installation

```bash
npm install @turbodocx/sdk
```

<details>
<summary>Other package managers</summary>

```bash
# Yarn
yarn add @turbodocx/sdk

# pnpm
pnpm add @turbodocx/sdk

# Bun
bun add @turbodocx/sdk
```
</details>

---

## Install via AI Agent Skill

Let an AI coding agent set up this SDK for you with the [TurboDocx Quickstart Agent Skill](https://github.com/TurboDocx/quickstart):

```bash
npx skills add TurboDocx/quickstart
```

Works with Claude Code, GitHub Copilot, Cursor, OpenCode, and other AI coding agents. The skill detects your language, installs the package, and generates working integration code.

---

## Quick Start

```typescript
import { TurboSign } from '@turbodocx/sdk';

// 1. Configure with your API key and sender information
TurboSign.configure({
  apiKey: process.env.TURBODOCX_API_KEY,
  orgId: process.env.TURBODOCX_ORG_ID,
  senderEmail: process.env.TURBODOCX_SENDER_EMAIL,  // REQUIRED
  senderName: process.env.TURBODOCX_SENDER_NAME     // OPTIONAL (but strongly recommended)
});

// 2. Send a document for signature
const result = await TurboSign.sendSignature({
  file: pdfBuffer,
  documentName: 'Partnership Agreement',
  recipients: [
    { name: 'John Doe', email: 'john@example.com', signingOrder: 1 }
  ],
  fields: [
    {
      type: 'signature',
      recipientEmail: 'john@example.com',
      template: { anchor: '{signature1}', placement: 'replace', size: { width: 100, height: 30 } }
    }
  ]
});

console.log('Document ID:', result.documentId);
```

---

## Configuration

```typescript
import { TurboSign } from '@turbodocx/sdk';

// Basic configuration (REQUIRED)
TurboSign.configure({
  apiKey: 'your-api-key',           // REQUIRED
  orgId: 'your-org-id',             // REQUIRED
  senderEmail: 'you@company.com',   // REQUIRED - reply-to address for signature requests
  senderName: 'Your Company'        // OPTIONAL but strongly recommended
});

// With custom options
TurboSign.configure({
  apiKey: 'your-api-key',
  orgId: 'your-org-id',
  senderEmail: 'you@company.com',
  senderName: 'Your Company',
  baseUrl: 'https://custom-api.example.com',  // Optional: custom API endpoint
});
```

**Important:** `senderEmail` is **REQUIRED**. It is used as the reply-to address for signature request emails and recorded as the sender in the audit trail. An API key has no mailbox of its own, so the API rejects a send without it rather than mailing from an unmonitored address. `senderName` is optional — it defaults to the name of your API key.

### Environment Variables

We recommend using environment variables for your configuration:

```bash
# .env
TURBODOCX_API_KEY=your-api-key
TURBODOCX_ORG_ID=your-org-id
TURBODOCX_SENDER_EMAIL=you@company.com
TURBODOCX_SENDER_NAME=Your Company Name
```

```typescript
TurboSign.configure({
  apiKey: process.env.TURBODOCX_API_KEY,
  orgId: process.env.TURBODOCX_ORG_ID,
  senderEmail: process.env.TURBODOCX_SENDER_EMAIL,
  senderName: process.env.TURBODOCX_SENDER_NAME
});
```

---

## API Reference

### TurboSign

#### `createSignatureReviewLink(options)`

Upload a document for review without sending signature emails. Returns a preview URL.

```typescript
const result = await TurboSign.createSignatureReviewLink({
  fileLink: 'https://example.com/contract.pdf',
  recipients: [
    { name: 'John Doe', email: 'john@example.com', order: 1 }
  ],
  fields: [
    { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }
  ],
  documentName: 'Service Agreement',        // Optional
  documentDescription: 'Q4 Contract',       // Optional
  senderName: 'Acme Corp',                  // Optional
  senderEmail: 'contracts@acme.com',        // Optional
  ccEmails: ['legal@acme.com']              // Optional
});

console.log('Preview URL:', result.previewUrl);
console.log('Document ID:', result.documentId);
```

#### `sendSignature(options)`

Upload a document and immediately send signature request emails.

```typescript
const result = await TurboSign.sendSignature({
  fileLink: 'https://example.com/contract.pdf',
  recipients: [
    { name: 'Alice', email: 'alice@example.com', order: 1 },
    { name: 'Bob', email: 'bob@example.com', order: 2 }  // Signs after Alice
  ],
  fields: [
    { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 },
    { type: 'signature', page: 1, x: 100, y: 600, width: 200, height: 50, recipientOrder: 2 }
  ]
});

// The created recipients come back on the send result (id, name, email).
// Signing links are emailed to them — they are not returned here.
result.recipients?.forEach(r => {
  console.log(`${r.name} <${r.email}> — ${r.id}`);
});

// For signing progress afterwards, use getRecipients().
```

#### `sendReminder(documentId, recipientIds?)`

Send a standalone reminder to whoever's turn it is to sign. It is independent of the automatic
reminder cadence — it works even when reminders are disabled or the cap is spent, does not
consume that cap, and only emails signers at the CURRENT signing order. Omit the recipient ids
to remind everyone eligible; do not pass an empty array, which the API rejects.

```typescript
const { results } = await TurboSign.sendReminder('doc-uuid-here');

results.forEach(r => {
  // Anyone not emailed comes back as a skipped_* status, so you can tell who was reached.
  console.log(`${r.recipientId}: ${r.status}`);  // e.g. 'sent', 'skipped_wrong_order'
});
```

Reminders and expiration can also be scheduled when you send. `sendSignature` accepts optional
`remindersEnabled` / `reminderDelay` / `reminderInterval` / `maxReminders` and
`expirationEnabled` / `expireAfter` / `expirationWarning` / `expirationWarningInterval` fields —
both features are OFF by default, so omitting them preserves the original send behavior.
Durations are `{ value, unit }` (`unit` is `'hours'` or `'days'`). The deadline is frozen onto
the document at send time and is then readable via `getStatus().expiresAt`. See the runnable
example in [`examples/turbosign-reminders-expiration.ts`](examples/turbosign-reminders-expiration.ts).

```typescript
const result = await TurboSign.sendSignature({
  // ...recipients, fields, etc.
  remindersEnabled: true,
  reminderDelay: { value: 2, unit: 'days' },
  expirationEnabled: true,
  expireAfter: { value: 14, unit: 'days' }
});
```

#### `getStatus(documentId)`

Check the document-level status. For per-recipient detail, use
[`getRecipients()`](#getrecipientsdocumentid).

```typescript
const status = await TurboSign.getStatus('doc-uuid-here');

console.log('Document Status:', status.status);  // 'under_review' | 'completed' | 'voided' | 'expired' | ...
// expiresAt is the signing-window deadline (ISO 8601), or undefined when expiration is off.
console.log('Expires:', status.expiresAt ?? 'never');
```

#### `getRecipients(documentId)`

See who the document went to, who has signed, who you are still waiting on, and who sent it.

```typescript
const { document, recipients, summary } = await TurboSign.getRecipients('doc-uuid-here');

console.log(`Sent by ${document.sentBy.name} <${document.sentBy.email}>`);
console.log(`Sent on ${document.sentOn ?? 'not sent yet'}`);
console.log(`${summary.completed} of ${summary.total} signed, still waiting on ${summary.waitingOn}`);

recipients.forEach(r => {
  // 'pending' | 'viewed' | 'completed' | 'voided' | 'expired'
  console.log(`${r.name} <${r.email}>: ${r.effectiveStatus}`);
  if (r.signedOn) console.log(`  signed ${r.signedOn}`);
  console.log(`  emailed ${r.delivery.totalSent}x, last ${r.delivery.lastSentOn ?? 'never'}`);
  if (r.delivery.reminderCount) console.log(`  reminded ${r.delivery.reminderCount}x`);
});

// Who are we chasing?
const chasing = recipients.filter(r => r.effectiveStatus === 'pending' || r.effectiveStatus === 'viewed');
```

**Two status fields, and they differ on purpose:**

| Field | Values | Use it for |
|---|---|---|
| `status` | `pending`, `viewed`, `completed` | The raw database value |
| `effectiveStatus` | `pending`, `viewed`, `completed`, `voided`, `expired` | Display |

The database has no per-recipient declined/voided/expired state, so on a voided or expired
document an unsigned signer still reads `pending` in `status`. `effectiveStatus` layers the
document's outcome on top — that's the one to show a user. A completed signature is never
revoked: someone who signed before the document was voided still reads `completed`.

`summary` counts by `effectiveStatus`, and `waitingOn` (pending + viewed) drops to zero once
the document is terminal.

**`delivery`** is that recipient's email history — `firstSentOn`, `lastSentOn`, `totalSent`,
`reminderCount`, `lastRemindedAt`, `warningCount`, `lastWarningAt`. It counts the signature
request, resends, reminders, expiry warnings and terminal notices. CC notifications are
excluded, since a CC address is not a signer.

Two `delivery` fields are easy to misread:

| Field | What it actually means |
|---|---|
| `reminderCount` | **Automatic (scheduled) reminders only** — the counter `maxReminders` caps. A manual "remind now" does **not** increment it (it must not consume the cap budget), though it does land in `totalSent`. So it can read `0` while reminder emails have genuinely been sent. |
| `lastRemindedAt` | **When the reminder cadence clock was last reset** — not necessarily when a reminder was sent. The initial signature-request send, each scheduled reminder, each manual "remind now" and each expiry warning all stamp it. A freshly-sent document therefore normally reads a non-null `lastRemindedAt` alongside `reminderCount` of `0`. |

`warningCount` and `lastWarningAt` are touched only by an expiry warning.

#### `download(documentId)`

Download the signed document as a Buffer/Blob.

```typescript
const signedPdf = await TurboSign.download('doc-uuid-here');

// Node.js: Save to file
import { writeFileSync } from 'fs';
writeFileSync('signed-contract.pdf', signedPdf);

// Browser: Trigger download
const blob = new Blob([signedPdf], { type: 'application/pdf' });
const url = URL.createObjectURL(blob);
window.open(url);
```

#### `void(documentId, reason)`

Cancel a signature request.

```typescript
await TurboSign.void('doc-uuid-here', 'Contract terms changed');
```

#### `resend(documentId, recipientIds)`

Resend signature request emails to specific recipients.

```typescript
await TurboSign.resend('doc-uuid-here', ['recipient-uuid-1', 'recipient-uuid-2']);
```

#### `getAuditTrail(documentId)`

Get the complete audit trail for a document, including all events and timestamps.

```typescript
const audit = await TurboSign.getAuditTrail('doc-uuid-here');

console.log('Document:', audit.document.name);

for (const entry of audit.auditTrail) {
  console.log(`${entry.actionType} - ${entry.timestamp}`);
  if (entry.user) {
    console.log(`  By: ${entry.user.name} (${entry.user.email})`);
  }
  if (entry.recipient) {
    console.log(`  Recipient: ${entry.recipient.name}`);
  }
}
```

The audit trail includes a cryptographic hash chain for tamper-evidence verification.

---

### TurboPartner (Partner API)

The `TurboPartner` module provides partner portal operations for managing organizations, users, API keys, and audit logs.

#### Configuration

```typescript
import { TurboPartner } from '@turbodocx/sdk';

TurboPartner.configure({
  partnerApiKey: process.env.TURBODOCX_PARTNER_API_KEY,  // Must start with TDXP-
  partnerId: process.env.TURBODOCX_PARTNER_ID,           // UUID format
});
```

**Environment Variables:**

```bash
# .env
TURBODOCX_PARTNER_API_KEY=TDXP-your-partner-api-key
TURBODOCX_PARTNER_ID=your-partner-uuid
```

#### Organization Management

```typescript
// Create an organization
const org = await TurboPartner.createOrganization({
  name: 'Acme Corp',
  metadata: { industry: 'Technology' },
  features: { maxUsers: 50, hasTDAI: true },
});
console.log('Org ID:', org.data.id);

// List organizations
const orgs = await TurboPartner.listOrganizations({ limit: 10, search: 'acme' });

// Get organization details (includes features and tracking)
const details = await TurboPartner.getOrganizationDetails('org-uuid');
console.log('Features:', details.data.features);
console.log('Tracking:', details.data.tracking);

// Update organization name
await TurboPartner.updateOrganizationInfo('org-uuid', { name: 'New Name' });

// Delete an organization
await TurboPartner.deleteOrganization('org-uuid');

// Update organization entitlements
await TurboPartner.updateOrganizationEntitlements('org-uuid', {
  features: { maxUsers: 100, hasTDAI: true },
});

// Read an organization's TurboSign display preferences
// (returns only the partner-settable keys, with defaults applied)
const { data } = await TurboPartner.getOrganizationPreferences('org-uuid');
console.log(data.preferences.lockedFieldsBackground); // true by default

// Update them — pass only the keys you want to change; every other
// organization setting is preserved
await TurboPartner.updateOrganizationPreferences('org-uuid', {
  lockedFieldsBackground: false, // render locked fields as plain text
  allowDownloadBeforeSigning: true, // let signers download the unsigned PDF
});
```

**Partner-settable display preferences**

| Key | Default | Effect |
|-----|---------|--------|
| `hideSignatureOutline` | `false` | Hide the outline/label drawn around signed fields |
| `hideSignatureHash` | `false` | Hide the verification hash printed on signed fields |
| `lockedFieldsBackground` | `true` | Grey box behind locked fields (`false` = plain text) |
| `allowDownloadBeforeSigning` | `false` | When enabled, a signer can download the unsigned PDF from the signing page before they sign it (for example, to review it with their legal team). Defaults to off. |

#### Organization User Management

```typescript
// List users in an organization
const users = await TurboPartner.listOrganizationUsers('org-uuid', { limit: 25 });

// Add a user to an organization
const user = await TurboPartner.addUserToOrganization('org-uuid', {
  email: 'user@example.com',
  role: 'contributor',  // 'admin' | 'contributor' | 'user' | 'viewer'
});

// Update a user's role
await TurboPartner.updateOrganizationUserRole('org-uuid', 'user-uuid', {
  role: 'admin',
});

// Remove a user from an organization
await TurboPartner.removeUserFromOrganization('org-uuid', 'user-uuid');

// Resend invitation email
await TurboPartner.resendOrganizationInvitationToUser('org-uuid', 'user-uuid');
```

#### Organization API Key Management

```typescript
// List API keys
const keys = await TurboPartner.listOrganizationApiKeys('org-uuid');

// Create an API key (full key value is only returned on creation)
const key = await TurboPartner.createOrganizationApiKey('org-uuid', {
  name: 'Production Key',
  role: 'admin',
});
console.log('Key:', key.data.key);

// Update an API key
await TurboPartner.updateOrganizationApiKey('org-uuid', 'key-uuid', {
  name: 'Updated Key Name',
});

// Revoke an API key
await TurboPartner.revokeOrganizationApiKey('org-uuid', 'key-uuid');
```

#### Partner API Key Management

```typescript
// List partner API keys
const partnerKeys = await TurboPartner.listPartnerApiKeys();

// Create a partner API key with scopes
const partnerKey = await TurboPartner.createPartnerApiKey({
  name: 'CI/CD Key',
  scopes: ['org:create', 'org:read', 'org:update'],
  description: 'Key for automated deployments',
});

// Update a partner API key
await TurboPartner.updatePartnerApiKey('key-uuid', {
  name: 'Updated Name',
  scopes: ['org:create', 'org:read'],
});

// Revoke a partner API key
await TurboPartner.revokePartnerApiKey('key-uuid');
```

#### Partner User Management

```typescript
// List partner portal users
const partnerUsers = await TurboPartner.listPartnerPortalUsers();

// Add a user to the partner portal
const partnerUser = await TurboPartner.addUserToPartnerPortal({
  email: 'admin@partner.com',
  role: 'admin',  // 'admin' | 'member' | 'viewer'
  permissions: {
    canManageOrgs: true,
    canManageOrgUsers: true,
    canManagePartnerUsers: false,
    canManageOrgAPIKeys: true,
    canManagePartnerAPIKeys: false,
    canUpdateEntitlements: true,
    canViewAuditLogs: true,
  },
});

// Update partner user permissions.
// `permissions` is optional — but if you send it, send all 7 keys. The API has no partial
// permissions update; omitted keys return 400.
await TurboPartner.updatePartnerUserPermissions('user-uuid', {
  role: 'member',
  permissions: {
    canManageOrgs: false,
    canManageOrgUsers: true,
    canManagePartnerUsers: false,
    canManageOrgAPIKeys: false,
    canManagePartnerAPIKeys: false,
    canUpdateEntitlements: false,
    canViewAuditLogs: true,
  },
});

// Remove a partner user
await TurboPartner.removeUserFromPartnerPortal('user-uuid');

// Resend partner portal invitation
await TurboPartner.resendPartnerPortalInvitationToUser('user-uuid');
```

#### Audit Logs

```typescript
// Get audit logs with filters
const logs = await TurboPartner.getPartnerAuditLogs({
  action: 'org.created',
  startDate: '2025-01-01',
  endDate: '2025-12-31',
  limit: 100,
});

for (const entry of logs.data.results) {
  console.log(`${entry.action} - ${entry.resourceType} - ${entry.createdOn}`);
}
```

---

### TurboWebhooks (Signature Webhook)

The `TurboWebhooks` module manages your organization's **signature webhook** — a single subscription to TurboDocx signature events. It also exposes a `verifyWebhookSignature` helper for incoming webhook receivers.

> **One webhook per org.** The SDK manages a single fixed-name webhook (`signature`) per org so SDK-managed and UI-managed webhooks stay in sync — what you create here also appears in the dashboard's Signature Webhooks settings page. To manage multiple webhooks per org, call the REST API directly.
>
> **Requires administrator role.** All webhook routes require an admin TDX- API key.

#### The 7 signature events

Import the `WebhookEvents` constants instead of hand-writing the wire strings — a typo becomes a compile error rather than a webhook that silently never fires.

| Event | Constant | Fires when |
|---|---|---|
| `signature.document.sent` | `WebhookEvents.SENT` | The document is dispatched to recipients |
| `signature.document.viewed` | `WebhookEvents.VIEWED` | A recipient opens the document for the first time |
| `signature.document.recipient_signed` | `WebhookEvents.RECIPIENT_SIGNED` | Any individual signer completes their signature — fires **once per signer**, and carries `is_final_signer` + `remaining_signers` |
| `signature.document.signed` | `WebhookEvents.SIGNED` | A signer signs but the document is **not yet complete** (document-level partial progress) |
| `signature.document.completed` | `WebhookEvents.COMPLETED` | All recipients have signed and the signed PDF is finalized |
| `signature.document.finalization_failed` | `WebhookEvents.FINALIZATION_FAILED` | The signed PDF fails to finalize (e.g. a KMS signing error); the document is **not** completed |
| `signature.document.voided` | `WebhookEvents.VOIDED` | The document is voided or cancelled |

On every signature, `recipient_signed` fires first, then **exactly one** document-level event:

```
Recipient signs
   │
   ├─ signature.document.recipient_signed   (always — one per signer)
   │
   └─ more signers remaining?
        ├─ yes → signature.document.signed                 (partial progress)
        └─ no  → signature.document.completed              (finalized OK)
                 or signature.document.finalization_failed (finalization failed)
```

> **`signed` never fires on the final signature.** To detect "the whole document is done", subscribe to `completed` (or to `recipient_signed` and check `is_final_signer: true`) — **not** `signed`.
>
> **A single-signer document never emits `signed` at all.** It emits `recipient_signed` (with `is_final_signer: true`), then `completed`.

`WEBHOOK_EVENTS` is exported as a readonly array of all 7 wire strings if you want to subscribe to everything. The `WebhookEvent` type autocompletes to the known events but still accepts any string, so the backend can add events without an SDK release.

#### Configuration

```typescript
import { TurboWebhooks } from '@turbodocx/sdk';

TurboWebhooks.configure({
  apiKey: process.env.TURBODOCX_API_KEY,
  orgId: process.env.TURBODOCX_ORG_ID,
  // baseUrl: 'http://localhost:3000',  // optional, defaults to https://api.turbodocx.com
});
```

`TurboWebhooks` does not require `senderEmail` (unlike `TurboSign`) — webhook routes don't send signature emails.

#### Create the signature webhook (save the secret immediately)

```typescript
import { TurboWebhooks, WebhookEvents, WEBHOOK_EVENTS } from '@turbodocx/sdk';

const created = await TurboWebhooks.createWebhook({
  urls: ['https://your-server.example.com/webhooks/turbodocx'], // HTTPS only
  events: [
    WebhookEvents.SENT,
    WebhookEvents.VIEWED,
    WebhookEvents.RECIPIENT_SIGNED,
    WebhookEvents.COMPLETED,
    WebhookEvents.VOIDED,
  ],
  // ...or subscribe to everything: events: [...WEBHOOK_EVENTS]
});

// `secret` is shown ONCE here — store it securely. It cannot be retrieved later.
console.log(`Save this secret: ${created.secret}`);
```

If the signature webhook already exists, `createWebhook` returns 400 `ValidationError`. Either update the existing one with `updateWebhook` or `deleteWebhook` first.

#### Get, update, delete

```typescript
const webhook = await TurboWebhooks.getWebhook();
// `webhook.deliveryStats` and `webhook.availableEvents` are included

await TurboWebhooks.updateWebhook({ isActive: false });
await TurboWebhooks.deleteWebhook();
```

#### Test deliveries and replay

```typescript
const tested = await TurboWebhooks.testWebhook({
  eventType: 'signature.document.completed',
  payload: { documentId: 'doc-xyz', status: 'completed' },
});
console.log(tested.summary); // { total, successful, failed }

const deliveries = await TurboWebhooks.listWebhookDeliveries({ limit: 10 });

// Retry a specific past delivery
const replayed = await TurboWebhooks.replayWebhookDelivery(deliveries.results[0].id);
```

#### Rotate the secret

```typescript
const rotated = await TurboWebhooks.regenerateWebhookSecret();
// `rotated.secret` is the new secret. Old signatures will fail from this moment on.
```

#### Aggregate stats

```typescript
const stats = await TurboWebhooks.getWebhookStats({ days: 30 });
console.log(stats.summary.successRate, stats.eventBreakdown);
```

#### Verify incoming webhook signatures

Webhook deliveries from TurboDocx are signed with HMAC-SHA256 over `${timestamp}.${rawBody}` using your webhook secret. Use the `verifyWebhookSignature` helper to verify them in your receiver:

```typescript
import express from 'express';
import { verifyWebhookSignature } from '@turbodocx/sdk';

const app = express();

// CRITICAL: use raw body parser on the webhook route, NOT express.json().
// The signature is over the exact bytes — re-stringifying breaks verification.
app.post(
  '/webhooks/turbodocx',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.header('X-TurboDocx-Signature') ?? '';
    const timestamp = req.header('X-TurboDocx-Timestamp') ?? '';
    const secret = process.env.TURBODOCX_WEBHOOK_SECRET!;

    if (!verifyWebhookSignature(req.body, signature, timestamp, secret)) {
      return res.status(401).send('invalid signature');
    }

    const event = JSON.parse(req.body.toString('utf8'));
    // ... process event ...
    res.status(200).send('ok');
  },
);
```

By default the helper enforces a 300-second timestamp tolerance to prevent replay attacks. Override with `{ toleranceSeconds: N }` (0 disables the check — not recommended in production).

---

### TurboQuote (Sales Quoting)

The `TurboQuote` module provides end-to-end sales quoting: build quote templates, manage your product catalog, assemble quotes with line items, and send them to customers.

#### Configuration

```typescript
import { TurboQuote } from '@turbodocx/sdk';

TurboQuote.configure({
  apiKey: process.env.TURBODOCX_API_KEY,  // REQUIRED (or accessToken)
  orgId: process.env.TURBODOCX_ORG_ID,   // REQUIRED
  // baseUrl: 'https://api.turbodocx.com' // optional
});
```

`TurboQuote` does **not** require `senderEmail` — use `apiKey` + `orgId` only.

#### Methods

| Group | Methods |
|---|---|
| **Configuration** | `configure()` |
| **Quotes** | `createQuote()`, `getQuote()`, `listQuotes()`, `updateQuote()`, `deleteQuote()` |
| **Quote status transitions** | `sendQuote()`, `sendQuoteWithDeliverable()`, `declineQuote()`, `voidQuote()`, `handleExpiredQuote()`, `duplicateQuote()` |
| **Quote downloads** | `downloadQuotePdf()` |
| **Line items** | `addLineItems()`, `addBundleLineItems()`, `listLineItems()`, `updateLineItem()`, `removeLineItem()` |
| **Products** | `createProduct()`, `getProduct()`, `listProducts()`, `updateProduct()`, `deleteProduct()`, `duplicateProduct()`, `getProductPrimaryImages()` |
| **Bundles** | `createBundle()`, `getBundle()`, `listBundles()`, `updateBundle()`, `deleteBundle()`, `duplicateBundle()` |
| **Price books** | `createPriceBook()`, `getPriceBook()`, `listPriceBooks()`, `updatePriceBook()`, `deletePriceBook()`, `duplicatePriceBook()`, `applyPriceBook()`, `removePriceBook()`, `listPriceBookProducts()` |
| **Quote template** | `getTemplate()`, `getTemplateById()`, `listTemplates()`, `createTemplate()`, `updateTemplate()`, `deleteTemplate()` |
| **Types / categories** | `createType()`, `listTypes()`, `updateType()`, `deleteType()` |
| **Companies** | `createCompany()`, `getCompany()`, `listCompanies()`, `updateCompany()`, `deleteCompany()` |
| **Contacts** | `createContact()`, `listCompanyContacts()`, `updateContact()`, `deleteContact()` |

#### Create a quote, add line items, and send

```typescript
// 1. Create the quote
const quote = await TurboQuote.createQuote({
  name: 'Professional Services — Q3 2026',
  companyId: 'company-uuid',
  contactId: 'contact-uuid',
  currency: 'USD',
  validUntil: '2026-09-30',
});
console.log('Quote number:', quote.quoteNumber);

// 2. Add a product line item
const items = await TurboQuote.addLineItems(quote.id, {
  productId: 'product-uuid',
  productName: 'Consulting Service',
  unitPrice: 500,
  billingFrequency: 'monthly',
  quantity: 3,
  discountType: 'percent',
  discountPercent: 10,
});
console.log('Line item ID:', items[0].id);

// 3. Send the quote to the customer
const sent = await TurboQuote.sendQuote(quote.id);
console.log(sent.message);
```

#### Scheduling — reminders & expiration on send

Both `sendQuote()` and `sendQuoteWithDeliverable()` accept the same eight per-document
reminder/expiration overrides as `sendSignature()`. They layer over your org defaults; omit
them to inherit the org policy as it stands at send time. Because quote send is a JSON endpoint,
durations are plain `{ value, unit }` objects (no JSON-string encoding).

```typescript
const sent = await TurboQuote.sendQuote(quote.id, {
  ccEmails: ['legal@acme.com'],
  validUntil: '2026-09-30',
  remindersEnabled: true,
  reminderDelay: { value: 2, unit: 'days' },       // first nudge 2 days after sending
  reminderInterval: { value: 3, unit: 'days' },    // then every 3 days
  maxReminders: 4,                                  // -1 = unlimited, 0 = none
  expirationEnabled: true,
  expirationWarning: { value: 2, unit: 'days' },   // warn starting 2 days before expiry
  expirationWarningInterval: { value: 1, unit: 'days' },
});
```

**Constraint — quote expiry is pinned to `validUntil`.** The backend anchors a quote's
expiration to its `validUntil` date, so **`expireAfter` is ignored** when expiration is on
(`expirationEnabled` still toggles expiration on/off). The reminder and expiration-warning
cadence must fit **within** `validUntil` or the send is rejected — schedule reminders/warnings
that all fall before the quote's valid-until date.

#### Download a quote as PDF

```typescript
import { writeFileSync } from 'fs';

const pdf = await TurboQuote.downloadQuotePdf(quote.id);  // returns ArrayBuffer
writeFileSync('quote.pdf', Buffer.from(pdf));
```

#### Sender identity — "Prepared by"

The quote's **"Prepared by"** name and email are resolved by the server, not by whoever
downloads or sends the quote. Precedence: the org **quote template's** sender fields first,
then the quote's **creator**.

A quote created with an **API key** has no mailbox of its own — so its sender email can only
come from the quote template. **If your org's quote template has no sender email set,
`createQuote` (and `duplicateQuote`) return `400 SenderEmailRequired`** for an API-key caller.
Set a sender email on the template once (via `TurboQuote.updateTemplate({ senderEmail, senderName })`)
and every subsequent create/duplicate/send resolves cleanly. Human (JWT) callers are never
blocked — their own email is the fallback.

`getQuote` returns the resolved identity as `preparedBy` — **prefer it over `creator`** for
any customer-facing display (`creator` may be the internal API service account):

```typescript
const quote = await TurboQuote.getQuote(quoteId);
console.log(quote.preparedBy?.name);   // e.g. "Acme Billing Integration" or the template sender
console.log(quote.preparedBy?.email);  // may be undefined for an API-created quote — render a placeholder
```

---

## Field Types

| Type | Description |
|:-----|:------------|
| `signature` | Signature field (draw or type) |
| `initials` | Initials field |
| `text` | Free-form text input |
| `date` | Date stamp |
| `checkbox` | Checkbox / agreement |
| `full_name` | Full name |
| `first_name` | First name |
| `last_name` | Last name |
| `email` | Email address |
| `title` | Job title |
| `company` | Company name |

The `checkbox` type doubles as the **controlling** field for conditional logic (see below).

### Field Positioning

```typescript
{
  type: 'signature',
  page: 1,              // Page number (1-indexed)
  x: 100,               // X position from left (pixels)
  y: 500,               // Y position from top (pixels)
  width: 200,           // Field width (pixels)
  height: 50,           // Field height (pixels)
  recipientOrder: 1,    // Which recipient this field belongs to
  required: true        // Optional: default true for signature/initials
}
```

### Conditional (IF/THEN) Fields

Any field may carry an optional `metadata` object that drives conditional logic. Set
`metadata.fieldKey` on a **controlling** `checkbox` to give it a stable id, then set
`metadata.conditional` on a **dependent** field that references that id:

```typescript
fields: [
  // Controlling checkbox — carries the fieldKey dependents reference
  {
    type: 'checkbox',
    recipientEmail: 'john@example.com',
    template: { anchor: '{request_changes}', placement: 'replace', size: { width: 20, height: 20 } },
    metadata: { fieldKey: 'request_changes' }
  },
  // Dependent text field — hidden until the checkbox is checked ("If checked, explain")
  {
    type: 'text',
    recipientEmail: 'john@example.com',
    isMultiline: true,
    template: { anchor: '{change_details}', placement: 'replace', size: { width: 200, height: 50 } },
    metadata: {
      conditional: {
        controllingFieldKey: 'request_changes', // must equal the checkbox's metadata.fieldKey
        operator: 'is_checked',                 // 'is_checked' | 'is_not_checked'
        action: 'show'                          // 'show' (hidden until met) | 'unlock' (read-only until met)
      }
    }
  }
]
```

| `metadata` field | Set on | Meaning |
|:-----------------|:-------|:--------|
| `fieldKey` | controlling `checkbox` | Stable client id (≤100 chars) that dependents reference |
| `conditional.controllingFieldKey` | dependent field | Must equal the controlling checkbox's `fieldKey` |
| `conditional.operator` | dependent field | `is_checked` or `is_not_checked` |
| `conditional.action` | dependent field | `show` (hidden until met) or `unlock` (visible but read-only until met) |

---

## Examples

For complete, working examples including template anchors, advanced field types, and various workflows, see the [`examples/`](./examples/) directory:

- [`turbosign-send-simple.ts`](./examples/turbosign-send-simple.ts) - Send document directly with template anchors
- [`turbosign-basic.ts`](./examples/turbosign-basic.ts) - Create review link first, then send manually
- [`turbosign-advanced.ts`](./examples/turbosign-advanced.ts) - Advanced field types (checkbox, readonly, multiline text, etc.)

### Sequential Signing (Multiple Recipients)

```typescript
const result = await TurboSign.sendSignature({
  fileLink: 'https://example.com/contract.pdf',
  recipients: [
    { name: 'Employee', email: 'employee@company.com', order: 1 },
    { name: 'Manager', email: 'manager@company.com', order: 2 },
    { name: 'HR', email: 'hr@company.com', order: 3 }
  ],
  fields: [
    // Employee signs first
    { type: 'signature', page: 1, x: 100, y: 400, width: 200, height: 50, recipientOrder: 1 },
    { type: 'date', page: 1, x: 320, y: 400, width: 100, height: 30, recipientOrder: 1 },
    // Manager signs second
    { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 2 },
    { type: 'date', page: 1, x: 320, y: 500, width: 100, height: 30, recipientOrder: 2 },
    // HR signs last
    { type: 'signature', page: 1, x: 100, y: 600, width: 200, height: 50, recipientOrder: 3 },
    { type: 'date', page: 1, x: 320, y: 600, width: 100, height: 30, recipientOrder: 3 }
  ]
});
```

### Polling for Completion

```typescript
async function waitForCompletion(documentId: string, maxAttempts = 60) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await TurboSign.getStatus(documentId);

    if (status.status === 'completed') {
      return await TurboSign.download(documentId);
    }

    if (status.status === 'voided') {
      throw new Error('Document was voided');
    }

    // Wait 30 seconds between checks
    await new Promise(r => setTimeout(r, 30000));
  }

  throw new Error('Timeout waiting for signatures');
}
```

### With Express.js

```typescript
import express from 'express';
import { TurboSign } from '@turbodocx/sdk';

const app = express();

TurboSign.configure({ apiKey: process.env.TURBODOCX_API_KEY });

app.post('/api/send-contract', async (req, res) => {
  try {
    const result = await TurboSign.sendSignature({
      fileLink: req.body.pdfUrl,
      recipients: req.body.recipients,
      fields: req.body.fields
    });

    res.json({ success: true, documentId: result.documentId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Local Testing

The SDK includes a comprehensive manual test script to verify all functionality locally.

### Running Manual Tests

```bash
# Install dependencies
npm install

# Run the manual test script
npx tsx manual-test.ts
```

### What It Tests

The `manual-test.ts` file tests all SDK methods:
- ✅ `createSignatureReviewLink()` - Document upload for review
- ✅ `sendSignature()` - Send for signature
- ✅ `getStatus()` - Check document status
- ✅ `getRecipients()` - Per-recipient signing status (who signed, who is pending)
- ✅ `download()` - Download signed document
- ✅ `void()` - Cancel signature request
- ✅ `resend()` - Resend signature emails

### Configuration

Before running, update the hardcoded values in `manual-test.ts`:
- `API_KEY` - Your TurboDocx API key
- `BASE_URL` - API endpoint (default: `http://localhost:3000`)
- `ORG_ID` - Your organization UUID
- `TEST_FILE_PATH` - Path to a test PDF/DOCX file
- `TEST_EMAIL` - Email address for testing

### Expected Output

The script will:
1. Upload a test document
2. Send it for signature
3. Check the status
4. Test void and resend operations
5. Print results for each operation

---

## Error Handling

```typescript
import { TurboSign, TurboDocxError } from '@turbodocx/sdk';

try {
  await TurboSign.getStatus('invalid-id');
} catch (error) {
  if (error instanceof TurboDocxError) {
    console.error('Status:', error.statusCode);   // HTTP status code
    console.error('Message:', error.message);     // Error message
    console.error('Code:', error.code);           // Error code (if available)
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Error Codes

`code` is **always populated** — an API-supplied code when there is one, otherwise the error
class's default (`VALIDATION_ERROR`, `AUTHENTICATION_ERROR`, `AUTHORIZATION_ERROR`,
`NOT_FOUND`, `CONFLICT`, `RATE_LIMIT_EXCEEDED`, `NETWORK_ERROR`). Branch on it without a null
check.

The API also returns more specific codes, passed through unchanged:

| Code | Status | Meaning |
|:-----|:-------|:--------|
| `SenderEmailRequired` | 400 | No sender email resolvable. TurboSign: set `senderEmail` on the request. TurboQuote: configure one on the org quote template (Quote Settings). |
| `SenderNameRequired` | 400 | No sender name resolvable — the API key has no usable name. |
| `QuoteHasNoLineItems` | 400 | The quote has no line items. Add at least one before sending. |
| `QuoteExpired` | 400 | The quote is past its `validUntil` date. |
| `QuoteValidUntilRequired` | 400 | The quote has no `validUntil` date set. |
| `QuoteNotSendable` | 400 | Only draft quotes can be sent. |
| `QuoteContactRequired` | 400 | The quote's contact is missing a name or email. |
| `QuoteCustomerInactive` | 400 | The quote's company or contact was deleted or deactivated. |

Error **messages** carry the actionable reason, not a generic envelope — multiple field errors
are joined with `"; "`, e.g. `"name" is not allowed to be empty; "companyId" must be a valid GUID`.

### Common Error Codes

| Status | Meaning |
|:-------|:--------|
| `400` | Bad request — check your parameters |
| `401` | Unauthorized — check your API key |
| `404` | Document not found |
| `429` | Rate limited — slow down requests |
| `500` | Server error — retry with backoff |

---

## TypeScript

Full TypeScript support with exported types:

```typescript
import {
  TurboSign,
  SendSignatureRequest,
  CreateSignatureReviewLinkRequest,
  Recipient,
  Field,
  DocumentStatus,
  TurboDocxError
} from '@turbodocx/sdk';

// Type-safe options
const options: SendSignatureRequest = {
  fileLink: 'https://example.com/contract.pdf',
  recipients: [{ name: 'John', email: 'john@example.com', signingOrder: 1 }],
  fields: [{ type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientEmail: 'john@example.com' }]
};

const result = await TurboSign.sendSignature(options);
```

---

## Requirements

- Node.js 16+
- TypeScript 4.7+ (if using TypeScript)

---

## Related Packages

| Package | Description |
|:--------|:------------|
| [@turbodocx/n8n-nodes-turbodocx](https://www.npmjs.com/package/@turbodocx/n8n-nodes-turbodocx) | n8n community nodes |
| [turbodocx-sdk (Python)](../py-sdk) | Python SDK |
| [turbodocx (Go)](../go-sdk) | Go SDK |

---

## Support

- 📖 [Documentation](https://docs.turbodocx.com/docs)
- 💬 [Discord](https://discord.gg/NYKwz4BcpX)
- 🐛 [GitHub Issues](https://github.com/TurboDocx/SDK/issues)

---

## License

MIT — see [LICENSE](./LICENSE)

---

<div align="center">

[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/js-sdk/footer.png)](https://www.turbodocx.com)

</div>
