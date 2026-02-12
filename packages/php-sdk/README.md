[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/php-sdk/banner.png)](https://www.turbodocx.com)

# TurboDocx PHP SDK

**Official PHP SDK for TurboDocx - Digital signatures, document generation, and AI-powered workflows**

The most developer-friendly **DocuSign & PandaDoc alternative** for **e-signatures** and **document generation**. Send documents for signature and automate document workflows programmatically.

[![Packagist Version](https://img.shields.io/packagist/v/turbodocx/sdk)](https://packagist.org/packages/turbodocx/sdk)
[![PHP Version](https://img.shields.io/packagist/php-v/turbodocx/sdk)](https://packagist.org/packages/turbodocx/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[Website](https://www.turbodocx.com) • [Documentation](https://docs.turbodocx.com/docs) • [API & SDK](https://www.turbodocx.com/products/api-and-sdk) • [Examples](#examples) • [Discord](https://discord.gg/NYKwz4BcpX)

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
- ✍️ **TurboSign** — Digital signature workflows with comprehensive field types
- 📄 **TurboTemplate** — Advanced document generation with templating

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

### TurboSign - Digital Signatures

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

### TurboTemplate - Document Generation

```php
<?php

use TurboDocx\TurboTemplate;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Types\TemplateVariable;
use TurboDocx\Types\VariableMimeType;
use TurboDocx\Types\OutputFormat;
use TurboDocx\Types\Requests\GenerateTemplateRequest;

// 1. Configure with your API key
TurboTemplate::configure(new HttpClientConfig(
    apiKey: $_ENV['TURBODOCX_API_KEY'],
    orgId: $_ENV['TURBODOCX_ORG_ID']
));

// 2. Generate a document from a template
$result = TurboTemplate::generate(
    new GenerateTemplateRequest(
        templateId: 'template-uuid',
        variables: [
            new TemplateVariable(
                placeholder: '{name}',
                name: 'name',
                value: 'John Doe',
                mimeType: VariableMimeType::TEXT
            ),
            new TemplateVariable(
                placeholder: '{company}',
                name: 'company',
                value: 'Acme Corporation',
                mimeType: VariableMimeType::TEXT
            ),
        ],
        outputFormat: OutputFormat::PDF,
        outputFilename: 'contract.pdf'
    )
);

echo "Deliverable ID: {$result->deliverableId}\n";
echo "Download URL: {$result->downloadUrl}\n";
```

---

## Configuration

```php
use TurboDocx\TurboSign;
use TurboDocx\Config\HttpClientConfig;

// Basic configuration
TurboSign::configure(new HttpClientConfig(
    apiKey: 'your-api-key',           // REQUIRED
    orgId: 'your-org-id',             // REQUIRED
    senderEmail: 'you@company.com',   // REQUIRED for TurboSign operations
    senderName: 'Your Company'        // OPTIONAL (recommended for TurboSign)
));

// For TurboTemplate only (no senderEmail needed)
TurboTemplate::configure(new HttpClientConfig(
    apiKey: getenv('TURBODOCX_API_KEY'),
    orgId: getenv('TURBODOCX_ORG_ID')
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

**Important:** `senderEmail` is **REQUIRED for TurboSign operations**. This email will be used as the reply-to address for signature request emails. For TurboTemplate-only usage, `senderEmail` is not required. The `senderName` is optional but strongly recommended for a professional appearance in signature emails.

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

## TurboTemplate

### `generate()`

Generate a document from a template with variable substitution.

```php
use TurboDocx\TurboTemplate;
use TurboDocx\Types\Requests\GenerateTemplateRequest;
use TurboDocx\Types\TemplateVariable;
use TurboDocx\Types\VariableMimeType;
use TurboDocx\Types\OutputFormat;

$result = TurboTemplate::generate(
    new GenerateTemplateRequest(
        templateId: 'template-uuid',
        variables: [
            new TemplateVariable(
                placeholder: '{customer_name}',
                name: 'customer_name',
                value: 'John Doe',
                mimeType: VariableMimeType::TEXT
            ),
            new TemplateVariable(
                placeholder: '{order_date}',
                name: 'order_date',
                value: '2024-01-15',
                mimeType: VariableMimeType::TEXT
            ),
        ],
        outputFormat: OutputFormat::PDF,
        outputFilename: 'invoice.pdf',
        name: 'Customer Invoice',
        description: 'Q1 2024 Invoice'
    )
);

echo "Deliverable ID: {$result->deliverableId}\n";
echo "Download URL: {$result->downloadUrl}\n";
```

### Variable Types

#### Simple Text Variables

```php
new TemplateVariable(
    placeholder: '{name}',
    name: 'name',
    value: 'John Doe',
    mimeType: VariableMimeType::TEXT
)
```

#### HTML Variables

```php
new TemplateVariable(
    placeholder: '{content}',
    name: 'content',
    value: '<h1>Hello</h1><p>This is <strong>bold</strong> text</p>',
    mimeType: VariableMimeType::HTML,
    allowRichTextInjection: true
)
```

#### Image Variables

```php
// From URL
new TemplateVariable(
    placeholder: '{logo}',
    name: 'logo',
    value: 'https://example.com/logo.png',
    mimeType: VariableMimeType::IMAGE
)

// From base64
new TemplateVariable(
    placeholder: '{signature}',
    name: 'signature',
    value: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
    mimeType: VariableMimeType::IMAGE
)
```

### Advanced Templating

#### Nested Objects

```php
new TemplateVariable(
    placeholder: '{client}',
    name: 'client',
    value: [
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'address' => [
            'street' => '123 Main St',
            'city' => 'New York',
            'zip' => '10001',
        ],
    ],
    mimeType: VariableMimeType::JSON,
    usesAdvancedTemplatingEngine: true
)
```

In your template: `{{client.name}}`, `{{client.address.city}}`, etc.

#### Array Loops

```php
new TemplateVariable(
    placeholder: '{items}',
    name: 'items',
    value: [
        [
            'name' => 'Product A',
            'price' => 99.99,
            'quantity' => 2,
        ],
        [
            'name' => 'Product B',
            'price' => 149.99,
            'quantity' => 1,
        ],
    ],
    mimeType: VariableMimeType::JSON,
    usesAdvancedTemplatingEngine: true
)
```

In your template:
```
{{#each items}}
  {{name}} - ${{price}} x {{quantity}}
{{/each}}
```

#### Conditionals

```php
new TemplateVariable(
    placeholder: '{customer_type}',
    name: 'customer_type',
    value: 'premium',
    mimeType: VariableMimeType::JSON,
    usesAdvancedTemplatingEngine: true
),
new TemplateVariable(
    placeholder: '{discount}',
    name: 'discount',
    value: '20%',
    mimeType: VariableMimeType::TEXT
)
```

In your template:
```
{{#if customer_type == "premium"}}
  Special discount: {{discount}}
{{/if}}
```

#### Expressions

```php
new TemplateVariable(
    placeholder: '{price}',
    name: 'price',
    value: 100,
    mimeType: VariableMimeType::JSON,
    usesAdvancedTemplatingEngine: true
),
new TemplateVariable(
    placeholder: '{quantity}',
    name: 'quantity',
    value: 5,
    mimeType: VariableMimeType::JSON,
    usesAdvancedTemplatingEngine: true
),
new TemplateVariable(
    placeholder: '{tax_rate}',
    name: 'tax_rate',
    value: 0.08,
    mimeType: VariableMimeType::JSON,
    usesAdvancedTemplatingEngine: true
)
```

In your template:
```
Subtotal: {{price * quantity}}
Tax: {{price * quantity * tax_rate}}
Total: {{price * quantity * (1 + tax_rate)}}
```

### Output Formats

```php
// Generate as PDF
$result = TurboTemplate::generate(
    new GenerateTemplateRequest(
        templateId: 'template-uuid',
        variables: $variables,
        outputFormat: OutputFormat::PDF,
        outputFilename: 'document.pdf'
    )
);

// Generate as DOCX
$result = TurboTemplate::generate(
    new GenerateTemplateRequest(
        templateId: 'template-uuid',
        variables: $variables,
        outputFormat: OutputFormat::DOCX,
        outputFilename: 'document.docx'
    )
);
```

### Integration with TurboSign

Generate a document and send it for signature:

```php
// 1. Generate document with TurboTemplate
$templateResult = TurboTemplate::generate(
    new GenerateTemplateRequest(
        templateId: 'template-uuid',
        variables: [
            new TemplateVariable(
                placeholder: '{client_name}',
                name: 'client_name',
                value: 'John Doe',
                mimeType: VariableMimeType::TEXT
            ),
        ],
        outputFormat: OutputFormat::PDF,
        outputFilename: 'contract.pdf'
    )
);

// 2. Send for signature using the deliverable ID
$signResult = TurboSign::sendSignature(
    new SendSignatureRequest(
        deliverableId: $templateResult->deliverableId,
        recipients: [
            new Recipient('John Doe', 'john@example.com', 1)
        ],
        fields: [
            new Field(
                type: SignatureFieldType::SIGNATURE,
                recipientEmail: 'john@example.com',
                template: new TemplateConfig(
                    anchor: '{ClientSignature}',
                    placement: FieldPlacement::REPLACE,
                    size: ['width' => 100, 'height' => 30]
                )
            )
        ],
        documentName: 'Contract'
    )
);

echo "Sent for signature: {$signResult->documentId}\n";
```

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

