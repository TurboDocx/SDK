[![TurboDocx](./banner.png)](https://www.turbodocx.com)

<div align="center">

# @turbodocx/sdk

**Official JavaScript/TypeScript SDK for TurboDocx**

[![NPM Version](https://img.shields.io/npm/v/@turbodocx/sdk.svg)](https://npmjs.org/package/@turbodocx/sdk)
[![npm downloads](https://img.shields.io/npm/dm/@turbodocx/sdk)](https://www.npmjs.com/package/@turbodocx/sdk)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@turbodocx/sdk)](https://bundlephobia.com/package/@turbodocx/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[Documentation](https://www.turbodocx.com/docs) • [API Reference](https://www.turbodocx.com/docs/api) • [Examples](#examples) • [Discord](https://discord.gg/NYKwz4BcpX)

</div>

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

## Quick Start

```typescript
import { TurboSign } from '@turbodocx/sdk';

// 1. Configure with your API key
TurboSign.configure({
  apiKey: process.env.TURBODOCX_API_KEY
});

// 2. Send a document for signature
const result = await TurboSign.prepareForSigningSingle({
  fileLink: 'https://example.com/contract.pdf',
  recipients: [
    { name: 'John Doe', email: 'john@example.com', order: 1 }
  ],
  fields: [
    { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }
  ]
});

console.log('Sign URL:', result.recipients[0].signUrl);
```

---

## Configuration

```typescript
import { TurboSign } from '@turbodocx/sdk';

// Basic configuration
TurboSign.configure({
  apiKey: 'your-api-key'
});

// With custom options
TurboSign.configure({
  apiKey: 'your-api-key',
  baseUrl: 'https://custom-api.example.com',  // Optional: custom API endpoint
  timeout: 30000,                              // Optional: request timeout (ms)
});
```

### Environment Variables

We recommend using environment variables for your API key:

```bash
# .env
TURBODOCX_API_KEY=your-api-key
```

```typescript
TurboSign.configure({
  apiKey: process.env.TURBODOCX_API_KEY
});
```

---

## API Reference

### TurboSign

#### `prepareForReview(options)`

Upload a document for review without sending signature emails. Returns a preview URL.

```typescript
const result = await TurboSign.prepareForReview({
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

#### `prepareForSigningSingle(options)`

Upload a document and immediately send signature request emails.

```typescript
const result = await TurboSign.prepareForSigningSingle({
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

// Each recipient gets a unique signing URL
result.recipients.forEach(r => {
  console.log(`${r.name}: ${r.signUrl}`);
});
```

#### `getStatus(documentId)`

Check the current status of a document.

```typescript
const status = await TurboSign.getStatus('doc-uuid-here');

console.log('Document Status:', status.status);  // 'pending' | 'completed' | 'voided'
console.log('Recipients:', status.recipients);

// Check individual recipient status
status.recipients.forEach(r => {
  console.log(`${r.name}: ${r.status}`);  // 'pending' | 'signed' | 'declined'
});
```

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

---

## Field Types

| Type | Description | Required | Auto-filled |
|:-----|:------------|:---------|:------------|
| `signature` | Signature field (draw or type) | Yes | No |
| `initials` | Initials field | Yes | No |
| `text` | Free-form text input | No | No |
| `date` | Date stamp | No | Yes (signing date) |
| `checkbox` | Checkbox / agreement | No | No |

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

---

## Examples

### Sequential Signing (Multiple Recipients)

```typescript
const result = await TurboSign.prepareForSigningSingle({
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
    const result = await TurboSign.prepareForSigningSingle({
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
- ✅ `prepareForReview()` - Document upload for review
- ✅ `prepareForSigningSingle()` - Send for signature
- ✅ `getStatus()` - Check document status
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
  PrepareForSigningOptions,
  PrepareForReviewOptions,
  Recipient,
  Field,
  DocumentStatus,
  TurboDocxError
} from '@turbodocx/sdk';

// Type-safe options
const options: PrepareForSigningOptions = {
  fileLink: 'https://example.com/contract.pdf',
  recipients: [{ name: 'John', email: 'john@example.com', order: 1 }],
  fields: [{ type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }]
};

const result = await TurboSign.prepareForSigningSingle(options);
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

- 📖 [Documentation](https://www.turbodocx.com/docs)
- 💬 [Discord](https://discord.gg/NYKwz4BcpX)
- 🐛 [GitHub Issues](https://github.com/TurboDocx/SDK/issues)
- 📧 [Email Support](mailto:support@turbodocx.com)

---

## License

MIT — see [LICENSE](./LICENSE)

---

<div align="center">

[![TurboDocx](./footer.png)](https://www.turbodocx.com)

</div>
