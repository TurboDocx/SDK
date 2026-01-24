# TurboDocx PHP SDK

**Official PHP SDK for TurboDocx - Digital signatures, document generation, and AI-powered workflows**

[![Packagist Version](https://img.shields.io/packagist/v/turbodocx/sdk)](https://packagist.org/packages/turbodocx/sdk)
[![PHP Version](https://img.shields.io/packagist/php-v/turbodocx/sdk)](https://packagist.org/packages/turbodocx/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[Website](https://www.turbodocx.com) • [Documentation](https://docs.turbodocx.com/docs) • [API Reference](https://docs.turbodocx.com/docs/api) • [Examples](#examples) • [Discord](https://discord.gg/NYKwz4BcpX)

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

**Important:** `senderEmail` is **REQUIRED**. This email will be used as the reply-to address for signature request emails. Without it, emails will default to "API Service User via TurboSign". The `senderName` is optional but strongly recommended for a professional appearance.

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

// Get recipient sign URLs
$status = TurboSign::getStatus($result->documentId);
foreach ($status->recipients as $recipient) {
    echo "{$recipient->name}: {$recipient->signUrl}\n";
}
```

#### `getStatus()`

Check the current status of a document.

```php
$status = TurboSign::getStatus('doc-uuid-here');

echo "Document Status: {$status->status->value}\n";  // 'pending', 'completed', 'voided'
echo "Recipients:\n";

// Check individual recipient status
foreach ($status->recipients as $recipient) {
    echo "  {$recipient->name}: {$recipient->status->value}\n";
    if ($recipient->signedAt) {
        echo "    Signed at: {$recipient->signedAt}\n";
    }
}
```

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

Get the complete audit trail for a document.

```php
$audit = TurboSign::getAuditTrail('doc-uuid-here');

echo "Audit Trail:\n";
foreach ($audit->entries as $entry) {
    echo "  {$entry->timestamp} - {$entry->event} by {$entry->actor}\n";
    if ($entry->ipAddress) {
        echo "    IP: {$entry->ipAddress}\n";
    }
}
```

---

## Field Types

TurboSign supports 11 different field types:

```php
use TurboDocx\Types\SignatureFieldType;

SignatureFieldType::SIGNATURE    // Signature field
SignatureFieldType::INITIAL       // Initial field
SignatureFieldType::DATE          // Date stamp (auto-filled when signed)
SignatureFieldType::TEXT          // Free text input
SignatureFieldType::FULL_NAME     // Full name (auto-filled from recipient)
SignatureFieldType::FIRST_NAME    // First name
SignatureFieldType::LAST_NAME     // Last name
SignatureFieldType::EMAIL         // Email address
SignatureFieldType::TITLE         // Job title
SignatureFieldType::COMPANY       // Company name
SignatureFieldType::CHECKBOX      // Checkbox field
```

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

## TypeScript → PHP Equivalents

| TypeScript | PHP 8.1+ Equivalent |
|------------|---------------------|
| `type FieldType = 'signature' \| 'date'` | `enum SignatureFieldType: string { case SIGNATURE = 'signature'; }` |
| `interface Recipient { name: string }` | `final readonly class Recipient { public function __construct(public string $name) {} }` |
| `optional?: string` | `public ?string $optional = null` |
| `static configure(config)` | `public static function configure(HttpClientConfig $config): void` |
| `Promise<T>` | No promises in PHP, uses synchronous calls with exceptions |

---

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

