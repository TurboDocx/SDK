[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/php-sdk/banner.png)](https://www.turbodocx.com)

# TurboDocx PHP SDK

**Official PHP SDK for TurboDocx - Digital signatures, document generation, and AI-powered workflows**

The most developer-friendly **DocuSign & PandaDoc alternative** for **e-signatures** and **document generation**. Send documents for signature and automate document workflows programmatically.

[![Packagist Version](https://img.shields.io/packagist/v/turbodocx/sdk)](https://packagist.org/packages/turbodocx/sdk)
[![PHP Version](https://img.shields.io/packagist/php-v/turbodocx/sdk)](https://packagist.org/packages/turbodocx/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-agentskills.io-8A2BE2)](https://agentskills.io)
[![Quickstart Skill](https://skills.sh/b/TurboDocx/quickstart)](https://github.com/TurboDocx/quickstart)

[Website](https://www.turbodocx.com) • [Documentation](https://docs.turbodocx.com/docs) • [API & SDK](https://www.turbodocx.com/products/api-and-sdk) • [Examples](#examples) • [Discord](https://discord.gg/NYKwz4BcpX)

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
| `/turbodocx-sdk turboquote` | Create and send quotes, manage products, bundles, and price books |

The skill auto-detects your framework (Laravel, Symfony, …) and follows your existing project conventions. Source: [github.com/TurboDocx/quickstart](https://github.com/TurboDocx/quickstart).

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
- 📝 **Strong Typing** — PHP 8.1+ enums and typed properties with PHPStan level 8
- ⚡ **Modern PHP** — Readonly classes, named parameters, match expressions
- 🔄 **Industry Standard** — Guzzle HTTP client, PSR standards compliance
- 🛡️ **Type-safe** — Catch errors at development time with static analysis
- 🤖 **100% n8n Parity** — Same operations as our n8n community nodes

---

## Requirements

- PHP 8.1 or higher
- Composer
- ext-json
- ext-fileinfo

---

## Installation

```bash
composer require turbodocx/sdk
```

---

## Install via AI Agent Skill

Let an AI coding agent set up this SDK for you with the [TurboDocx Quickstart Agent Skill](https://github.com/TurboDocx/quickstart):

```bash
npx skills add TurboDocx/quickstart
```

Works with Claude Code, GitHub Copilot, Cursor, OpenCode, and other AI coding agents. The skill detects your language, installs the package, and generates working integration code.

---

## Quick Start

```php
<?php

use TurboDocx\TurboSign;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Types\Recipient;
use TurboDocx\Types\Field;
use TurboDocx\Types\SignatureFieldType;
use TurboDocx\Types\TemplateConfig;
use TurboDocx\Types\FieldPlacement;
use TurboDocx\Types\Requests\SendSignatureRequest;

// 1. Configure with your API key and sender information
TurboSign::configure(new HttpClientConfig(
    apiKey: $_ENV['TURBODOCX_API_KEY'],
    orgId: $_ENV['TURBODOCX_ORG_ID'],
    senderEmail: $_ENV['TURBODOCX_SENDER_EMAIL'],  // REQUIRED
    senderName: $_ENV['TURBODOCX_SENDER_NAME']     // OPTIONAL (but strongly recommended)
));

// 2. Send a document for signature
$result = TurboSign::sendSignature(
    new SendSignatureRequest(
        recipients: [
            new Recipient('John Doe', 'john@example.com', 1)
        ],
        fields: [
            new Field(
                type: SignatureFieldType::SIGNATURE,
                recipientEmail: 'john@example.com',
                template: new TemplateConfig(
                    anchor: '{signature1}',
                    placement: FieldPlacement::REPLACE,
                    size: ['width' => 100, 'height' => 30]
                )
            )
        ],
        file: file_get_contents('contract.pdf'),
        documentName: 'Partnership Agreement'
    )
);

echo "Document ID: {$result->documentId}\n";
```

---

## Configuration

```php
use TurboDocx\TurboSign;
use TurboDocx\Config\HttpClientConfig;

// Basic configuration (REQUIRED)
TurboSign::configure(new HttpClientConfig(
    apiKey: 'your-api-key',           // REQUIRED
    orgId: 'your-org-id',             // REQUIRED
    senderEmail: 'you@company.com',   // REQUIRED - reply-to address for signature requests
    senderName: 'Your Company'        // OPTIONAL but strongly recommended
));

// With custom options
TurboSign::configure(new HttpClientConfig(
    apiKey: 'your-api-key',
    orgId: 'your-org-id',
    senderEmail: 'you@company.com',
    senderName: 'Your Company',
    baseUrl: 'https://custom-api.example.com'  // Optional: custom API endpoint
));
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

```php
TurboSign::configure(new HttpClientConfig(
    apiKey: getenv('TURBODOCX_API_KEY'),
    orgId: getenv('TURBODOCX_ORG_ID'),
    senderEmail: getenv('TURBODOCX_SENDER_EMAIL'),
    senderName: getenv('TURBODOCX_SENDER_NAME')
));

// Or use auto-configuration from environment
TurboSign::configure(HttpClientConfig::fromEnvironment());
```

---

## API Reference

### TurboSign

#### `createSignatureReviewLink()`

Upload a document for review without sending signature emails. Returns a preview URL.

```php
use TurboDocx\Types\Requests\CreateSignatureReviewLinkRequest;

$result = TurboSign::createSignatureReviewLink(
    new CreateSignatureReviewLinkRequest(
        recipients: [
            new Recipient('John Doe', 'john@example.com', 1)
        ],
        fields: [
            new Field(
                type: SignatureFieldType::SIGNATURE,
                recipientEmail: 'john@example.com',
                page: 1,
                x: 100,
                y: 500,
                width: 200,
                height: 50
            )
        ],
        fileLink: 'https://example.com/contract.pdf',  // Or use file: for upload
        documentName: 'Service Agreement',              // Optional
        documentDescription: 'Q4 Contract',             // Optional
        ccEmails: ['legal@acme.com']                    // Optional
    )
);

echo "Preview URL: {$result->previewUrl}\n";
echo "Document ID: {$result->documentId}\n";
```

#### `sendSignature()`

Upload a document and immediately send signature request emails.

```php
use TurboDocx\Types\Requests\SendSignatureRequest;

$result = TurboSign::sendSignature(
    new SendSignatureRequest(
        recipients: [
            new Recipient('Alice', 'alice@example.com', 1),
            new Recipient('Bob', 'bob@example.com', 2)  // Signs after Alice
        ],
        fields: [
            new Field(
                type: SignatureFieldType::SIGNATURE,
                recipientEmail: 'alice@example.com',
                page: 1,
                x: 100,
                y: 500,
                width: 200,
                height: 50
            ),
            new Field(
                type: SignatureFieldType::SIGNATURE,
                recipientEmail: 'bob@example.com',
                page: 1,
                x: 100,
                y: 600,
                width: 200,
                height: 50
            )
        ],
        file: file_get_contents('contract.pdf')
    )
);

// The created recipients come back on the send result itself, as a plain array of
// associative arrays (not objects). Each carries id, name and email.
if ($result->recipients !== null) {
    foreach ($result->recipients as $recipient) {
        echo "{$recipient['name']} <{$recipient['email']}> — {$recipient['id']}\n";
    }
}

// For signing progress afterwards, use getRecipients():
$progress = TurboSign::getRecipients($result->documentId);
```

#### `getStatus()`

Check the document-level status. For per-recipient detail, use `getRecipients()`.

```php
$status = TurboSign::getStatus('doc-uuid-here');

echo "Document Status: {$status->status}\n";  // 'under_review', 'completed', 'voided', ...
```

#### `getRecipients()`

See who the document went to, who has signed, who you are still waiting on, and who sent it.

```php
$result = TurboSign::getRecipients('doc-uuid-here');

echo "Sent by {$result->document->sentBy->name} <{$result->document->sentBy->email}>\n";
echo "{$result->summary->completed} of {$result->summary->total} signed, ";
echo "still waiting on {$result->summary->waitingOn}\n";

foreach ($result->recipients as $recipient) {
    // 'pending' | 'viewed' | 'completed' | 'voided' | 'expired'
    echo "  {$recipient->name} <{$recipient->email}>: {$recipient->effectiveStatus}\n";
    if ($recipient->signedOn !== null) {
        echo "    Signed on: {$recipient->signedOn}\n";
    }
    echo "    Emailed {$recipient->delivery->totalSent}x\n";
}
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

#### `download()`

Download the signed PDF document.

```php
$pdfContent = TurboSign::download('doc-uuid-here');

// Save to file
file_put_contents('signed-contract.pdf', $pdfContent);

// Or send as HTTP response
header('Content-Type: application/pdf');
header('Content-Disposition: attachment; filename="signed.pdf"');
echo $pdfContent;
```

#### `void()`

Cancel a signature request that hasn't been completed.

```php
use TurboDocx\Types\Responses\VoidDocumentResponse;

$result = TurboSign::void('doc-uuid-here', 'Document needs to be revised');

echo "Status: {$result->status}\n";
echo "Voided at: {$result->voidedAt}\n";
```

#### `resend()`

Resend signature request emails to specific recipients (or all).

```php
// Resend to specific recipients
$result = TurboSign::resend('doc-uuid-here', ['recipient-id-1', 'recipient-id-2']);

// Resend to all recipients
$result = TurboSign::resend('doc-uuid-here', []);

echo "Message: {$result->message}\n";
```

#### `getAuditTrail()`

Get the complete audit trail for a document, including all events and timestamps.

```php
$audit = TurboSign::getAuditTrail('doc-uuid-here');

echo "Document: {$audit->document->name}\n";
echo "Audit Trail:\n";

foreach ($audit->auditTrail as $entry) {
    echo "  {$entry->actionType} - {$entry->timestamp}\n";
    if ($entry->user) {
        echo "    By: {$entry->user->name} ({$entry->user->email})\n";
    }
    if ($entry->recipient) {
        echo "    Recipient: {$entry->recipient->name}\n";
    }
}
```

The audit trail includes a cryptographic hash chain for tamper-evidence verification.

---

### TurboWebhooks (Signature Webhook)

The `TurboWebhooks` class manages your organization's **signature webhook** — a single subscription to TurboDocx signature events. It also exposes a `verifyWebhookSignature` helper for incoming webhook receivers.

> **One webhook per org.** The SDK manages a single fixed-name webhook (`signature`) per org so SDK-managed and UI-managed webhooks stay in sync — what you create here also appears in the dashboard's Signature Webhooks settings page. To manage multiple webhooks per org, call the REST API directly.
>
> **Requires administrator role.** All webhook routes require an admin TDX- API key.

#### The 7 signature events

Use the `WebhookEvent` enum instead of hand-writing the wire strings — a typo becomes a fatal error rather than a webhook that silently never fires.

| Event | Enum case | Fires when |
|---|---|---|
| `signature.document.sent` | `WebhookEvent::SENT` | The document is dispatched to recipients |
| `signature.document.viewed` | `WebhookEvent::VIEWED` | A recipient opens the document for the first time |
| `signature.document.recipient_signed` | `WebhookEvent::RECIPIENT_SIGNED` | Any individual signer completes their signature — fires **once per signer**, and carries `is_final_signer` + `remaining_signers` |
| `signature.document.signed` | `WebhookEvent::SIGNED` | A signer signs but the document is **not yet complete** (document-level partial progress) |
| `signature.document.completed` | `WebhookEvent::COMPLETED` | All recipients have signed and the signed PDF is finalized |
| `signature.document.finalization_failed` | `WebhookEvent::FINALIZATION_FAILED` | The signed PDF fails to finalize (e.g. a KMS signing error); the document is **not** completed |
| `signature.document.voided` | `WebhookEvent::VOIDED` | The document is voided or cancelled |

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

`WebhookEvent::all()` returns every wire string if you want to subscribe to everything. `events` stays `array<int, string>`, so the backend can add events without an SDK release.

#### Configuration

```php
use TurboDocx\TurboWebhooks;

TurboWebhooks::configureFromCredentials(
    apiKey: getenv('TURBODOCX_API_KEY'),
    orgId: getenv('TURBODOCX_ORG_ID'),
    // baseUrl: 'http://localhost:3000', // optional, defaults to https://api.turbodocx.com
);
```

Unlike `TurboSign`, `TurboWebhooks` does NOT require `senderEmail` — webhook routes don't send signature emails.

#### Create the signature webhook (save the secret immediately)

```php
use TurboDocx\Types\Enums\WebhookEvent;

$created = TurboWebhooks::createWebhook(
    urls: ['https://your-server.example.com/webhooks/turbodocx'],  // HTTPS only; 1-10 URLs
    events: [  // at least 1
        WebhookEvent::SENT->value,
        WebhookEvent::VIEWED->value,
        WebhookEvent::RECIPIENT_SIGNED->value,
        WebhookEvent::COMPLETED->value,
        WebhookEvent::VOIDED->value,
    ],
    // ...or subscribe to everything: events: WebhookEvent::all()
);
// `secret` is shown ONCE here. Store it securely; it cannot be retrieved later.
echo "Save this secret: {$created['secret']}";
```

`urls` accepts **1 to 10** HTTPS endpoints and `events` requires **at least 1** event. Empty arrays return a 400.

If the signature webhook already exists, `createWebhook` throws `ConflictException` (HTTP 409). Either update the existing one with `updateWebhook` or `deleteWebhook` first.

#### Get, update, delete

```php
$webhook = TurboWebhooks::getWebhook();
// $webhook['deliveryStats'] and $webhook['availableEvents'] are included

TurboWebhooks::updateWebhook(isActive: false);
TurboWebhooks::deleteWebhook();
```

`updateWebhook` patches only the arguments you pass. The `urls` and `events` minimums still apply on
update — to leave a list unchanged, **omit the argument** (leave it `null`). Passing `urls: []` or
`events: []` sends an empty array and returns a 400; it does not clear the list.

#### Test deliveries and replay

```php
$tested = TurboWebhooks::testWebhook(
    eventType: 'signature.document.completed',
    payload: ['documentId' => 'doc-xyz', 'status' => 'completed'],
);
// $tested['summary']: ['total' => N, 'successful' => N, 'failed' => N]

$deliveries = TurboWebhooks::listWebhookDeliveries(limit: 10);
$replayed = TurboWebhooks::replayWebhookDelivery($deliveries['results'][0]['id']);
```

#### Rotate the secret

```php
$rotated = TurboWebhooks::regenerateWebhookSecret();
// $rotated['secret'] is the new secret. Old signatures will fail immediately.
```

#### Aggregate stats

```php
$stats = TurboWebhooks::getWebhookStats(days: 30);
// $stats['summary']['successRate'], $stats['eventBreakdown']
```

#### Verify incoming webhook signatures

Webhook deliveries from TurboDocx are signed with HMAC-SHA256 over `"{$timestamp}.{$rawBody}"` using your webhook secret. Use `verifyWebhookSignature` to verify them in your receiver:

```php
use function TurboDocx\Utils\verifyWebhookSignature;

// In your webhook endpoint:
$rawBody = file_get_contents('php://input');  // CRITICAL: raw bytes only.
                                              // Do NOT json_decode first; the
                                              // signature is over the exact bytes.
$signature = $_SERVER['HTTP_X_TURBODOCX_SIGNATURE'] ?? '';
$timestamp = $_SERVER['HTTP_X_TURBODOCX_TIMESTAMP'] ?? '';
$secret = getenv('TURBODOCX_WEBHOOK_SECRET');

if (!verifyWebhookSignature($rawBody, $signature, $timestamp, $secret)) {
    http_response_code(401);
    exit('invalid signature');
}

$event = json_decode($rawBody, true);
// ... process event ...
```

By default the helper enforces a 300-second timestamp tolerance to prevent replay attacks. Pass `toleranceSeconds: N` (0 disables the check — not recommended in production).

---

## Field Types

TurboSign supports 11 different field types:

```php
use TurboDocx\Types\SignatureFieldType;

SignatureFieldType::SIGNATURE    // Signature field
SignatureFieldType::INITIAL       // Initial field
SignatureFieldType::DATE          // Date stamp
SignatureFieldType::TEXT          // Free text input
SignatureFieldType::FULL_NAME     // Full name
SignatureFieldType::FIRST_NAME    // First name
SignatureFieldType::LAST_NAME     // Last name
SignatureFieldType::EMAIL         // Email address
SignatureFieldType::TITLE         // Job title
SignatureFieldType::COMPANY       // Company name
SignatureFieldType::CHECKBOX      // Checkbox field (also the controlling field for conditional logic)
```

### Conditional (IF/THEN) Fields

Any field may carry an optional `FieldMetadata` that drives conditional logic. Set a `fieldKey` on
a **controlling** `CHECKBOX` to give it a stable id, then set a `FieldConditional` on a
**dependent** field that references that id:

```php
use TurboDocx\Types\Field;
use TurboDocx\Types\SignatureFieldType;
use TurboDocx\Types\TemplateConfig;
use TurboDocx\Types\FieldPlacement;
use TurboDocx\Types\FieldMetadata;
use TurboDocx\Types\FieldConditional;
use TurboDocx\Types\ConditionalOperator;
use TurboDocx\Types\ConditionalAction;

$fields = [
    // Controlling checkbox — carries the fieldKey dependents reference
    new Field(
        type: SignatureFieldType::CHECKBOX,
        recipientEmail: 'john@example.com',
        template: new TemplateConfig(anchor: '{request_changes}', placement: FieldPlacement::REPLACE, size: ['width' => 20, 'height' => 20]),
        metadata: new FieldMetadata(fieldKey: 'request_changes')
    ),
    // Dependent text field — hidden until the checkbox is checked ("If checked, explain")
    new Field(
        type: SignatureFieldType::TEXT,
        recipientEmail: 'john@example.com',
        isMultiline: true,
        template: new TemplateConfig(anchor: '{change_details}', placement: FieldPlacement::REPLACE, size: ['width' => 200, 'height' => 50]),
        metadata: new FieldMetadata(
            conditional: new FieldConditional(
                controllingFieldKey: 'request_changes',        // must equal the checkbox's fieldKey
                operator: ConditionalOperator::IS_CHECKED,      // IS_CHECKED | IS_NOT_CHECKED
                action: ConditionalAction::SHOW                 // SHOW (hidden until met) | UNLOCK (read-only until met)
            )
        )
    ),
];
```

| `FieldMetadata` field | Set on | Meaning |
|:----------------------|:-------|:--------|
| `fieldKey` | controlling `CHECKBOX` | Stable client id (≤100 chars) that dependents reference |
| `conditional->controllingFieldKey` | dependent field | Must equal the controlling checkbox's `fieldKey` |
| `conditional->operator` | dependent field | `ConditionalOperator::IS_CHECKED` (`"is_checked"`) or `IS_NOT_CHECKED` (`"is_not_checked"`) |
| `conditional->action` | dependent field | `ConditionalAction::SHOW` (hidden until met) or `UNLOCK` (visible but read-only until met) |

### Field Positioning

TurboSign supports two ways to position fields:

#### 1. Coordinate-based (Pixel Perfect)

```php
new Field(
    type: SignatureFieldType::SIGNATURE,
    recipientEmail: 'john@example.com',
    page: 1,          // Page number (1-indexed)
    x: 100,           // X coordinate
    y: 500,           // Y coordinate
    width: 200,       // Width in pixels
    height: 50        // Height in pixels
)
```

#### 2. Template Anchors (Dynamic)

```php
new Field(
    type: SignatureFieldType::SIGNATURE,
    recipientEmail: 'john@example.com',
    template: new TemplateConfig(
        anchor: '{signature1}',                // Text to find in PDF
        placement: FieldPlacement::REPLACE,    // How to place the field
        size: ['width' => 100, 'height' => 30]
    )
)
```

**Placement Options:**
- `FieldPlacement::REPLACE` - Replace the anchor text
- `FieldPlacement::BEFORE` - Place before the anchor
- `FieldPlacement::AFTER` - Place after the anchor
- `FieldPlacement::ABOVE` - Place above the anchor
- `FieldPlacement::BELOW` - Place below the anchor

### Advanced Field Options

```php
// Checkbox (pre-checked, readonly)
new Field(
    type: SignatureFieldType::CHECKBOX,
    recipientEmail: 'john@example.com',
    page: 1,
    x: 100,
    y: 600,
    width: 20,
    height: 20,
    defaultValue: 'true',     // Pre-checked
    isReadonly: true          // Cannot be unchecked
)

// Multiline text field
new Field(
    type: SignatureFieldType::TEXT,
    recipientEmail: 'john@example.com',
    page: 1,
    x: 100,
    y: 200,
    width: 400,
    height: 100,
    isMultiline: true,        // Allow multiple lines
    required: true,           // Field is required
    backgroundColor: '#f0f0f0' // Background color
)

// Readonly text (pre-filled, non-editable)
new Field(
    type: SignatureFieldType::TEXT,
    recipientEmail: 'john@example.com',
    page: 1,
    x: 100,
    y: 300,
    width: 300,
    height: 30,
    defaultValue: 'This text is pre-filled',
    isReadonly: true
)
```

---

## File Input Methods

TurboSign supports three ways to provide the document:

### 1. Direct File Upload

```php
$result = TurboSign::sendSignature(
    new SendSignatureRequest(
        file: file_get_contents('contract.pdf'),
        fileName: 'contract.pdf',  // Optional
        // ...
    )
);
```

### 2. File URL

```php
$result = TurboSign::sendSignature(
    new SendSignatureRequest(
        fileLink: 'https://example.com/contract.pdf',
        // ...
    )
);
```

### 3. TurboDocx Deliverable ID

```php
$result = TurboSign::sendSignature(
    new SendSignatureRequest(
        deliverableId: 'deliverable-uuid-from-turbodocx',
        // ...
    )
);
```

---

## Examples

### Example 1: Simple Template Anchors

```php
$result = TurboSign::sendSignature(
    new SendSignatureRequest(
        recipients: [
            new Recipient('John Doe', 'john@example.com', 1)
        ],
        fields: [
            new Field(
                type: SignatureFieldType::SIGNATURE,
                recipientEmail: 'john@example.com',
                template: new TemplateConfig(
                    anchor: '{signature1}',
                    placement: FieldPlacement::REPLACE,
                    size: ['width' => 100, 'height' => 30]
                )
            )
        ],
        file: file_get_contents('contract.pdf')
    )
);
```

### Example 2: Sequential Signing

```php
$result = TurboSign::sendSignature(
    new SendSignatureRequest(
        recipients: [
            new Recipient('Alice', 'alice@example.com', 1),  // Signs first
            new Recipient('Bob', 'bob@example.com', 2),      // Signs after Alice
            new Recipient('Carol', 'carol@example.com', 3)   // Signs last
        ],
        fields: [
            // Fields for each recipient...
        ],
        file: file_get_contents('contract.pdf')
    )
);
```

### Example 3: Status Polling

```php
$result = TurboSign::sendSignature(/* ... */);

// Poll for completion
while (true) {
    sleep(2);
    $status = TurboSign::getStatus($result->documentId);

    if ($status->status === 'completed') {
        echo "Document completed!\n";

        // Download signed document
        $signedPdf = TurboSign::download($result->documentId);
        file_put_contents('signed.pdf', $signedPdf);
        break;
    }

    echo "Status: {$status->status}\n";
}
```

For more examples, see the [`examples/`](./examples) directory.

---

## TurboPartner (Partner API)

TurboPartner provides partner-level management capabilities for multi-tenant applications. Use this to programmatically manage organizations, users, API keys, and entitlements.

### Partner Configuration

```php
use TurboDocx\TurboPartner;
use TurboDocx\Config\PartnerClientConfig;

TurboPartner::configure(new PartnerClientConfig(
    partnerApiKey: getenv('TURBODOCX_PARTNER_API_KEY'),  // REQUIRED - must start with TDXP-
    partnerId: getenv('TURBODOCX_PARTNER_ID'),           // REQUIRED - your partner UUID
    baseUrl: 'https://api.turbodocx.com'                 // Optional
));

// Or use auto-configuration from environment
TurboPartner::configure(PartnerClientConfig::fromEnvironment());
```

### Partner Environment Variables

```bash
# .env
TURBODOCX_PARTNER_API_KEY=TDXP-your-partner-api-key
TURBODOCX_PARTNER_ID=your-partner-uuid
TURBODOCX_BASE_URL=https://api.turbodocx.com
```

### Organization Management

#### `createOrganization()`

Create a new organization under your partner account.

```php
use TurboDocx\Types\Requests\Partner\CreateOrganizationRequest;

$result = TurboPartner::createOrganization(
    new CreateOrganizationRequest(
        name: 'Acme Corporation',
        features: ['maxUsers' => 50]  // Optional entitlements override
    )
);

echo "Organization ID: {$result->data->id}\n";
```

#### `listOrganizations()`

List all organizations with pagination and search.

```php
use TurboDocx\Types\Requests\Partner\ListOrganizationsRequest;

$result = TurboPartner::listOrganizations(
    new ListOrganizationsRequest(
        limit: 25,
        offset: 0,
        search: 'Acme'  // Optional search by name
    )
);

echo "Total: {$result->totalRecords}\n";
foreach ($result->results as $org) {
    echo "- {$org->name} (ID: {$org->id})\n";
}
```

#### `getOrganizationDetails()`

Get full details including features and tracking for an organization.

```php
$result = TurboPartner::getOrganizationDetails('org-uuid-here');

echo "Name: {$result->organization->name}\n";
if ($result->features) {
    echo "Max Users: {$result->features->maxUsers}\n";
}
```

#### `updateOrganizationInfo()`

Update an organization's name.

```php
use TurboDocx\Types\Requests\Partner\UpdateOrganizationRequest;

$result = TurboPartner::updateOrganizationInfo(
    'org-uuid-here',
    new UpdateOrganizationRequest(name: 'Acme Corp (Updated)')
);
```

#### `updateOrganizationEntitlements()`

Update an organization's features and tracking limits.

```php
use TurboDocx\Types\Requests\Partner\UpdateEntitlementsRequest;

$result = TurboPartner::updateOrganizationEntitlements(
    'org-uuid-here',
    new UpdateEntitlementsRequest(
        features: [
            'maxUsers' => 100,
            'maxStorage' => 10737418240,  // 10GB
            'maxSignatures' => 500,
            'hasTDAI' => true,
            'hasFileDownload' => true,
        ]
    )
);
```

#### `getOrganizationPreferences()`

Read an organization's TurboSign display preferences. Returns only the partner-settable keys, each with its effective value (defaults applied for keys the org never set) — never the organization's other settings.

```php
$prefs = TurboPartner::getOrganizationPreferences('org-uuid-here')->preferences;

var_dump($prefs->hideSignatureOutline);   // false by default
var_dump($prefs->hideSignatureHash);      // false by default
var_dump($prefs->lockedFieldsBackground); // true by default
var_dump($prefs->allowDownloadBeforeSigning); // false by default
```

#### `updateOrganizationPreferences()`

Set an organization's TurboSign display preferences. Pass only the keys you want to change as a plain camelCase array — the SDK wraps them under `preferences`, and every other organization setting is preserved.

```php
$result = TurboPartner::updateOrganizationPreferences('org-uuid-here', [
    'lockedFieldsBackground' => false,  // render locked fields as plain text
]);

var_dump($result->preferences->lockedFieldsBackground); // false
```

| Key | Default | Effect |
|-----|---------|--------|
| `hideSignatureOutline` | `false` | Hide the outline/label drawn around signed fields |
| `hideSignatureHash` | `false` | Hide the verification hash printed on signed fields |
| `lockedFieldsBackground` | `true` | Grey box behind locked fields (`false` = plain text) |
| `allowDownloadBeforeSigning` | `false` | When enabled, a signer can download the unsigned PDF from the signing page before they sign it (for example, to review it with their legal team). Defaults to off. |

#### `deleteOrganization()`

Delete an organization (use with caution).

```php
$result = TurboPartner::deleteOrganization('org-uuid-here');
echo "Success: " . ($result->success ? 'Yes' : 'No') . "\n";
```

### Organization User Management

> **Org roles are not partner roles.** Organization users and organization API keys use
> `OrgUserRole`: `admin | contributor | user | viewer`. Partner portal users use a *different* enum,
> `PartnerUserRole`: `admin | member | viewer`. `member` is not a valid organization role, and
> `contributor` / `user` are not valid partner roles — mixing them returns a 400.

#### `addUserToOrganization()`

Add a user to an organization with a specific role.

```php
use TurboDocx\Types\Requests\Partner\AddOrgUserRequest;
use TurboDocx\Types\Enums\OrgUserRole;

$result = TurboPartner::addUserToOrganization(
    'org-uuid-here',
    new AddOrgUserRequest(
        email: 'user@example.com',
        role: OrgUserRole::ADMIN  // ADMIN, CONTRIBUTOR, USER, or VIEWER
    )
);

echo "User ID: {$result->data->id}\n";
```

#### `listOrganizationUsers()`

List all users in an organization.

```php
use TurboDocx\Types\Requests\Partner\ListOrgUsersRequest;

$result = TurboPartner::listOrganizationUsers(
    'org-uuid-here',
    new ListOrgUsersRequest(limit: 50, offset: 0)
);

echo "User Limit: {$result->userLimit}\n";
foreach ($result->results as $user) {
    echo "- {$user->email} ({$user->role})\n";
}
```

#### `updateOrganizationUserRole()`

Change a user's role within an organization.

```php
use TurboDocx\Types\Requests\Partner\UpdateOrgUserRequest;
use TurboDocx\Types\Enums\OrgUserRole;

$result = TurboPartner::updateOrganizationUserRole(
    'org-uuid-here',
    'user-uuid-here',
    new UpdateOrgUserRequest(role: OrgUserRole::CONTRIBUTOR)
);
```

#### `resendOrganizationInvitationToUser()`

Resend the invitation email to a pending user.

```php
$result = TurboPartner::resendOrganizationInvitationToUser(
    'org-uuid-here',
    'user-uuid-here'
);
```

#### `removeUserFromOrganization()`

Remove a user from an organization.

```php
$result = TurboPartner::removeUserFromOrganization(
    'org-uuid-here',
    'user-uuid-here'
);
```

### Organization API Key Management

#### `createOrganizationApiKey()`

Create an API key for an organization.

```php
use TurboDocx\Types\Requests\Partner\CreateOrgApiKeyRequest;

$result = TurboPartner::createOrganizationApiKey(
    'org-uuid-here',
    new CreateOrgApiKeyRequest(
        name: 'Production API Key',
        role: 'admin'  // admin, contributor, or viewer
    )
);

echo "Key ID: {$result->data->id}\n";
echo "Full Key: {$result->data->key}\n";  // Only shown once!
```

#### `listOrganizationApiKeys()`

List all API keys for an organization.

```php
use TurboDocx\Types\Requests\Partner\ListOrgApiKeysRequest;

$result = TurboPartner::listOrganizationApiKeys(
    'org-uuid-here',
    new ListOrgApiKeysRequest(limit: 50)
);
```

#### `updateOrganizationApiKey()`

Update an organization API key's name or role.

```php
use TurboDocx\Types\Requests\Partner\UpdateOrgApiKeyRequest;

$result = TurboPartner::updateOrganizationApiKey(
    'org-uuid-here',
    'api-key-uuid-here',
    new UpdateOrgApiKeyRequest(name: 'Updated Key Name', role: 'contributor')
);
```

#### `revokeOrganizationApiKey()`

Revoke (delete) an organization API key.

```php
$result = TurboPartner::revokeOrganizationApiKey(
    'org-uuid-here',
    'api-key-uuid-here'
);
```

### Partner API Key Management

#### `createPartnerApiKey()`

Create a new partner-level API key with specific scopes. The full key is only returned once in the response — save it securely. Subsequent list calls return a masked preview only.

```php
use TurboDocx\Types\Requests\Partner\CreatePartnerApiKeyRequest;
use TurboDocx\Types\Enums\PartnerScope;

$result = TurboPartner::createPartnerApiKey(
    new CreatePartnerApiKeyRequest(
        name: 'Integration API Key',
        scopes: [
            PartnerScope::ORG_CREATE,
            PartnerScope::ORG_READ,
            PartnerScope::ORG_UPDATE,
            PartnerScope::ENTITLEMENTS_UPDATE,
            PartnerScope::AUDIT_READ,
        ],
        description: 'For third-party integration',
    )
);

echo "Key ID: {$result->data->id}\n";
echo "Full Key: {$result->data->key}\n";  // Only shown once!
```

#### `listPartnerApiKeys()`

List all partner API keys. Listed keys contain a masked preview (e.g. `TDXP-a1b2...5e6f`), never the full key.

```php
use TurboDocx\Types\Requests\Partner\ListPartnerApiKeysRequest;

$result = TurboPartner::listPartnerApiKeys(
    new ListPartnerApiKeysRequest(limit: 50)
);

foreach ($result->results as $key) {
    echo "{$key->name}: {$key->key}\n"; // Shows masked preview
}
```

#### `updatePartnerApiKey()`

Update a partner API key.

```php
use TurboDocx\Types\Requests\Partner\UpdatePartnerApiKeyRequest;

$result = TurboPartner::updatePartnerApiKey(
    'partner-key-uuid-here',
    new UpdatePartnerApiKeyRequest(
        name: 'Updated Integration Key',
        description: 'Updated description'
    )
);
```

#### `revokePartnerApiKey()`

Revoke a partner API key.

```php
$result = TurboPartner::revokePartnerApiKey('partner-key-uuid-here');
```

### Partner User Management

#### `addUserToPartnerPortal()`

Add a user to the partner portal with specific permissions.

```php
use TurboDocx\Types\Requests\Partner\AddPartnerUserRequest;
use TurboDocx\Types\Partner\PartnerPermissions;

$result = TurboPartner::addUserToPartnerPortal(
    new AddPartnerUserRequest(
        email: 'admin@partner.com',
        role: 'admin',  // admin, member, or viewer
        permissions: new PartnerPermissions(
            canManageOrgs: true,
            canManageOrgUsers: true,
            canManagePartnerUsers: false,
            canManageOrgAPIKeys: false,
            canManagePartnerAPIKeys: false,
            canUpdateEntitlements: true,
            canViewAuditLogs: true
        )
    )
);
```

#### `listPartnerPortalUsers()`

List all partner portal users.

```php
use TurboDocx\Types\Requests\Partner\ListPartnerUsersRequest;

$result = TurboPartner::listPartnerPortalUsers(
    new ListPartnerUsersRequest(limit: 50)
);
```

#### `updatePartnerUserPermissions()`

Update a partner user's role and permissions.

```php
use TurboDocx\Types\Requests\Partner\UpdatePartnerUserRequest;
use TurboDocx\Types\Partner\PartnerPermissions;

$result = TurboPartner::updatePartnerUserPermissions(
    'partner-user-uuid-here',
    new UpdatePartnerUserRequest(
        role: 'admin',
        permissions: new PartnerPermissions(
            canManageOrgs: true,
            canManageOrgUsers: true,
            canManagePartnerUsers: true,
            canManageOrgAPIKeys: true,
            canManagePartnerAPIKeys: true,
            canUpdateEntitlements: true,
            canViewAuditLogs: true
        )
    )
);
```

#### `resendPartnerPortalInvitationToUser()`

Resend the invitation email to a pending partner user.

```php
$result = TurboPartner::resendPartnerPortalInvitationToUser('partner-user-uuid-here');
```

#### `removeUserFromPartnerPortal()`

Remove a user from the partner portal.

```php
$result = TurboPartner::removeUserFromPartnerPortal('partner-user-uuid-here');
```

### Audit Logs

#### `getPartnerAuditLogs()`

Get audit logs for all partner activities with filtering.

```php
use TurboDocx\Types\Requests\Partner\ListAuditLogsRequest;

$result = TurboPartner::getPartnerAuditLogs(
    new ListAuditLogsRequest(
        limit: 50,
        offset: 0,
        action: 'ORG_CREATED',           // Optional filter
        resourceType: 'organization',    // Optional filter
        success: true,                   // Optional filter
        startDate: '2024-01-01',        // Optional filter
        endDate: '2024-12-31'           // Optional filter
    )
);

foreach ($result->results as $entry) {
    echo "{$entry->action} - {$entry->createdOn}\n";
}
```

For more TurboPartner examples, see:
- [`examples/turbopartner-organizations.php`](./examples/turbopartner-organizations.php)
- [`examples/turbopartner-users.php`](./examples/turbopartner-users.php)
- [`examples/turbopartner-api-keys.php`](./examples/turbopartner-api-keys.php)

---

## TurboQuote (Quoting)

TurboQuote provides a complete quoting workflow: manage companies, contacts, products, bundles, price books, and quotes — then send them to customers for acceptance.

### Quote Configuration

```php
use TurboDocx\TurboQuote;
use TurboDocx\Config\QuoteClientConfig;

TurboQuote::configure(new QuoteClientConfig(
    apiKey: getenv('TURBODOCX_API_KEY'),  // REQUIRED
    orgId: getenv('TURBODOCX_ORG_ID'),    // REQUIRED
    // baseUrl: 'https://api.turbodocx.com', // Optional
));

// Or auto-configure from environment
TurboQuote::configure(QuoteClientConfig::fromEnvironment());
```

Unlike `TurboSign`, `TurboQuote` does NOT require `senderEmail`.

### Quote Environment Variables

```bash
# .env
TURBODOCX_API_KEY=your-api-key
TURBODOCX_ORG_ID=your-org-id
```

### Method Reference

| Group | Method | Description |
|-------|--------|-------------|
| **Quotes** | `listQuotes(?ListQuotesRequest)` | List quotes with pagination, filters, and stats |
| | `createQuote(CreateQuoteRequest)` | Create a new quote |
| | `getQuote(id)` | Get quote by ID (includes `statusInfo` and `preparedBy`) |
| | `updateQuote(id, UpdateQuoteRequest)` | Update quote fields |
| | `deleteQuote(id)` | Delete a quote |
| | `duplicateQuote(id)` | Duplicate a quote |
| | `downloadQuotePdf(id)` | Download quote as PDF (raw bytes) |
| **Quote Actions** | `sendQuote(id, ?SendQuoteRequest)` | Send a quote to the contact |
| | `sendQuoteWithDeliverable(id, SendQuoteWithDeliverableRequest)` | Send with a TurboDocx-generated document attached |
| | `declineQuote(id, DeclineQuoteRequest)` | Mark a quote as declined |
| | `voidQuote(id, VoidQuoteRequest)` | Void a quote |
| | `handleExpiredQuote(id, HandleExpiredQuoteRequest)` | Void or decline an expired quote and reissue it with a new `validUntil` |
| | `applyPriceBook(quoteId, priceBookId)` | Apply a price book, repricing line items |
| | `removePriceBook(quoteId)` | Remove the applied price book |
| **Line Items** | `listLineItems(quoteId, ?ListLineItemsRequest)` | List items on a quote |
| | `addLineItems(quoteId, AddLineItemRequest\|array)` | Add one or more product line items |
| | `addBundleLineItems(quoteId, AddBundleLineItemRequest\|array)` | Add one or more bundle line items |
| | `updateLineItem(quoteId, itemId, UpdateLineItemRequest)` | Update a line item |
| | `removeLineItem(quoteId, itemId)` | Remove a line item |
| **Products** | `listProducts(?ListProductsRequest)` | List catalog products |
| | `createProduct(CreateProductRequest)` | Create a product (supports image upload) |
| | `getProduct(id)` | Get product by ID |
| | `updateProduct(id, UpdateProductRequest)` | Update a product |
| | `deleteProduct(id)` | Delete a product |
| | `duplicateProduct(id)` | Duplicate a product |
| | `getProductPrimaryImages(productIds[])` | Batch-fetch primary images for product IDs |
| **Price Books** | `listPriceBooks(?ListPriceBooksRequest)` | List price books |
| | `createPriceBook(CreatePriceBookRequest)` | Create a price book |
| | `getPriceBook(id)` | Get price book by ID |
| | `updatePriceBook(id, UpdatePriceBookRequest)` | Update a price book |
| | `deletePriceBook(id)` | Delete a price book |
| | `duplicatePriceBook(id)` | Duplicate a price book |
| | `listPriceBookProducts(id, ?ListPriceBookProductsRequest)` | List products with custom pricing in a price book |
| **Bundles** | `listBundles(?ListBundlesRequest)` | List catalog bundles |
| | `createBundle(CreateBundleRequest)` | Create a bundle |
| | `getBundle(id)` | Get bundle by ID |
| | `updateBundle(id, UpdateBundleRequest)` | Update a bundle |
| | `deleteBundle(id)` | Delete a bundle |
| | `duplicateBundle(id)` | Duplicate a bundle |
| **Companies** | `listCompanies(?ListCompaniesRequest)` | List companies |
| | `createCompany(CreateCompanyRequest)` | Create a company |
| | `getCompany(id)` | Get company by ID |
| | `updateCompany(id, UpdateCompanyRequest)` | Update a company |
| | `deleteCompany(id)` | Delete a company |
| | `listCompanyContacts(companyId, ?ListContactsRequest)` | List contacts for a company |
| **Contacts** | `listContacts(?ListContactsRequest)` | List contacts |
| | `createContact(CreateContactRequest)` | Create a contact |
| | `updateContact(id, UpdateContactRequest)` | Update a contact |
| | `deleteContact(id)` | Delete a contact |
| **Templates** | `listTemplates(?ListTemplatesRequest)` | List quote templates |
| | `getTemplate()` | Get the org's active quote template |
| | `getTemplateById(id)` | Get a template by ID |
| | `createTemplate(CreateQuoteTemplateRequest)` | Create a quote template |
| | `updateTemplate(id, UpdateQuoteTemplateRequest)` | Update a quote template |
| | `deleteTemplate(id)` | Delete a quote template |
| **Types** | `listTypes(?ListTypesRequest)` | List quote types/categories |
| | `createType(CreateQuoteTypeRequest)` | Create a type/category |
| | `updateType(id, UpdateQuoteTypeRequest)` | Update a type/category |
| | `deleteType(id)` | Delete a type/category |
| **Convenience** | `createAndSend(CreateAndSendRequest)` | Create quote + add items + send in one call |

### Basic Usage

```php
use TurboDocx\TurboQuote;
use TurboDocx\Config\QuoteClientConfig;
use TurboDocx\Types\Requests\Quote\CreateCompanyRequest;
use TurboDocx\Types\Requests\Quote\CreateContactRequest;
use TurboDocx\Types\Requests\Quote\CreateQuoteRequest;
use TurboDocx\Types\Requests\Quote\AddLineItemRequest;
use TurboDocx\Types\Requests\Quote\SendQuoteRequest;

TurboQuote::configure(new QuoteClientConfig(
    apiKey: getenv('TURBODOCX_API_KEY'),
    orgId: getenv('TURBODOCX_ORG_ID'),
));

// Create company + contact
$company = TurboQuote::createCompany(new CreateCompanyRequest(
    name: 'Acme Corp',
    contacts: [['name' => 'Jane Smith', 'email' => 'jane@acme.com']],
));
$contact = TurboQuote::createContact(new CreateContactRequest(
    name: 'Jane Smith',
    companyId: $company->id,
    email: 'jane@acme.com',
));

// Create quote
$quote = TurboQuote::createQuote(new CreateQuoteRequest(
    name: 'Enterprise License Q3',
    companyId: $company->id,
    contactId: $contact->id,
    currency: 'USD',
    termDays: 60,  // Optional — defaults to 60
));

// Add line items
TurboQuote::addLineItems($quote->id, [
    new AddLineItemRequest(
        productId: null,
        productName: 'Platform Subscription',
        unitPrice: 499.00,
        billingFrequency: 'monthly',
        quantity: 1,
    ),
    new AddLineItemRequest(
        productId: null,
        productName: 'Professional Services',
        unitPrice: 2500.00,
        billingFrequency: 'one-time',
        quantity: 5,
        discountType: 'percent',
        discountPercent: 10,
    ),
]);

// Send to customer
$result = TurboQuote::sendQuote($quote->id, new SendQuoteRequest(
    validUntil: date('Y-m-d', strtotime('+30 days')),
));

echo "Quote sent! Status: {$result->quote->status}\n";
```

### Sender Identity — "Prepared by"

The quote's **"Prepared by"** name and email are resolved by the server, not by whoever
downloads or sends the quote. Precedence: the org **quote template's** sender fields first,
then the quote's **creator**.

A quote created with an **API key** has no mailbox of its own — so its sender email can only
come from the quote template. **If your org's quote template has no sender email set,
`createQuote()` (and `duplicateQuote()`) throw `ValidationException` (`400 SenderEmailRequired`)**
for an API-key caller. Set a sender email on the template once (via `updateTemplate()`) and every
subsequent create/duplicate/send resolves cleanly. Human (JWT) callers are never blocked — their
own email is the fallback.

`getQuote()` returns the resolved identity as `preparedBy` (`['name' => ?, 'email' => ?]`) —
**prefer it over `creator`** for any customer-facing display (`creator` may be the internal API
service account). The `email` key may be absent for an API-created quote.

```php
$quote = TurboQuote::getQuote($quoteId);
$prepared = $quote->preparedBy ?? [];
echo $prepared['name'] ?? '';   // e.g. "Acme Billing Integration" or the template sender
echo $prepared['email'] ?? '';  // may be absent — render a placeholder
```

### Quote Terms and Auto-Renewal

`termDays` is optional and **defaults to 60** (max 3650). The special value `-1` means auto-renewal.

`renewalPeriod` is coupled to `termDays`:

- `termDays: -1` → `renewalPeriod` is **required** (`weekly`, `monthly`, `quarterly`, or `annually`)
- any other `termDays` → `renewalPeriod` must be **omitted or null**; sending it returns a 400

```php
use TurboDocx\Types\Requests\Quote\CreateQuoteRequest;
use TurboDocx\Types\Enums\RenewalPeriod;

// Fixed term (default 60 days) — do NOT send renewalPeriod
TurboQuote::createQuote(new CreateQuoteRequest(
    name: 'Fixed Term Quote',
    companyId: $company->id,
    contactId: $contact->id,
    termDays: 90,
));

// Auto-renewing quote — renewalPeriod is required
TurboQuote::createQuote(new CreateQuoteRequest(
    name: 'Auto-Renewing Subscription',
    companyId: $company->id,
    contactId: $contact->id,
    termDays: -1,
    renewalPeriod: RenewalPeriod::ANNUALLY->value,
));
```

### Expired Quotes

`handleExpiredQuote()` resolves a sent quote whose `validUntil` has passed. It closes out the original
(voiding or declining it) and creates a duplicate carrying the new `validUntil` date.

The only valid actions are **`void`** and **`decline`** — there is no "extend" or "re-send" action.
`action`, `reason`, and `newValidUntil` are **all three required**.

```php
use TurboDocx\Types\Requests\Quote\HandleExpiredQuoteRequest;

$reissued = TurboQuote::handleExpiredQuote($quote->id, new HandleExpiredQuoteRequest(
    action: 'void',                                           // 'void' or 'decline' — nothing else
    reason: 'Pricing refreshed for the new fiscal year',      // required, max 190 chars
    newValidUntil: date('Y-m-d', strtotime('+30 days')),      // required, ISO date
));

echo "Reissued as quote {$reissued->quoteNumber}\n";
```

### Discount Types

Line items, bundle line items, and bundles support two discount modes:

```php
use TurboDocx\Types\Enums\DiscountType;

// Percent discount (default)
new AddLineItemRequest(
    productId: 'prod-uuid',
    productName: 'Widget',
    unitPrice: 100.00,
    billingFrequency: 'monthly',
    discountType: DiscountType::PERCENT->value,  // 'percent'
    discountPercent: 15,                          // 15% off
);

// Fixed-dollar discount
new AddLineItemRequest(
    productId: 'prod-uuid',
    productName: 'Widget',
    unitPrice: 100.00,
    billingFrequency: 'monthly',
    discountType: DiscountType::AMOUNT->value,    // 'amount'
    discountAmount: 25.00,                        // $25 off per unit
);
```

### Price Books

```php
use TurboDocx\Types\Requests\Quote\CreatePriceBookRequest;

$priceBook = TurboQuote::createPriceBook(new CreatePriceBookRequest(
    name: 'Partner Tier A',
    priceBookTypeId: 'pbt-uuid-here',
    validFrom: '2026-01-01',
    discountPercent: 15.0,
    productPricing: [
        // Per-product overrides
        [
            'productId' => 'prod-uuid',
            'discountType' => 'amount',
            'discountAmount' => 50.00,
        ],
    ],
));

// Apply to a quote
TurboQuote::applyPriceBook($quote->id, $priceBook->id);
```

For more examples, see:
- [`examples/turboquote-basic.php`](./examples/turboquote-basic.php) — full quote lifecycle
- [`examples/turboquote-products.php`](./examples/turboquote-products.php) — products and bundles catalog CRUD
- [`examples/turboquote-pricebooks.php`](./examples/turboquote-pricebooks.php) — price book management

---

## Error Handling

The SDK provides typed exceptions for different error scenarios:

```php
use TurboDocx\Exceptions\AuthenticationException;
use TurboDocx\Exceptions\ValidationException;
use TurboDocx\Exceptions\NotFoundException;
use TurboDocx\Exceptions\RateLimitException;
use TurboDocx\Exceptions\NetworkException;

try {
    $result = TurboSign::sendSignature(/* ... */);
} catch (AuthenticationException $e) {
    // 401 - Invalid API key or access token
    echo "Authentication failed: {$e->getMessage()}\n";
} catch (ValidationException $e) {
    // 400 - Invalid request data
    echo "Validation error: {$e->getMessage()}\n";
} catch (NotFoundException $e) {
    // 404 - Document not found
    echo "Not found: {$e->getMessage()}\n";
} catch (RateLimitException $e) {
    // 429 - Rate limit exceeded
    echo "Rate limit: {$e->getMessage()}\n";
} catch (NetworkException $e) {
    // Network/connection error
    echo "Network error: {$e->getMessage()}\n";
}
```

All exceptions extend `TurboDocxException` and include:
- `statusCode` (HTTP status code, if applicable)
- `errorCode` (Error code string, e.g., 'AUTHENTICATION_ERROR')
- `message` (Human-readable error message)

---

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

## License

MIT

---

## Support

- 🌐 [TurboDocx](https://www.turbodocx.com)
- 📚 [Documentation](https://docs.turbodocx.com/docs)
- 💬 [Discord Community](https://discord.gg/NYKwz4BcpX)
- 🐛 [GitHub Issues](https://github.com/TurboDocx/SDK/issues)

---

## Related Packages

- [@turbodocx/html-to-docx](https://github.com/turbodocx/html-to-docx) - Convert HTML to DOCX
- [@turbodocx/n8n-nodes-turbodocx](https://github.com/turbodocx/n8n-nodes-turbodocx) - n8n integration
- [TurboDocx Writer](https://appsource.microsoft.com/product/office/WA200007397) - Microsoft Word add-in

