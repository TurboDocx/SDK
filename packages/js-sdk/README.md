[![TurboDocx](./banner.png)](https://www.turbodocx.com)

@turbodocx/sdk
====================
[![NPM Version](https://img.shields.io/npm/v/@turbodocx/sdk.svg)](https://npmjs.org/package/@turbodocx/sdk)
[![npm](https://img.shields.io/npm/dm/@turbodocx/sdk)](https://www.npmjs.com/package/@turbodocx/sdk)
[![GitHub Stars](https://img.shields.io/github/stars/turbodocx/sdk?style=social)](https://github.com/turbodocx/sdk)
[![TypeScript](https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=flat-square)](https://typescript.org)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA?logo=discord)](https://discord.gg/NYKwz4BcpX)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official JavaScript/TypeScript SDK for TurboDocx API - Digital signatures, document generation, and AI-powered workflows. Full TypeScript support with comprehensive type definitions.

## Why @turbodocx/sdk?

🚀 **Production-Ready** - Battle-tested in production environments processing thousands of documents daily.

🔄 **Active Maintenance** - Backed by TurboDocx with regular updates, bug fixes, and feature enhancements.

🤖 **AI-Optimized** - Designed for modern AI workflows where speed and reliability matter.

🛠️ **Full TypeScript Support** - Comprehensive type definitions for excellent IDE support and type safety.

⚡ **100% n8n Parity** - Same operations available in our n8n community nodes, ensuring consistency across platforms.

## Installation

```bash
npm install @turbodocx/sdk
```

## Quick Start

```typescript
import { TurboSign } from '@turbodocx/sdk';

// Configure with your API key
TurboSign.configure({ apiKey: 'your-api-key' });

// Send a document for signature
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

## TurboSign API

### Configuration

```typescript
// With API key
TurboSign.configure({ apiKey: 'your-api-key' });

// With custom base URL
TurboSign.configure({
  apiKey: 'your-api-key',
  baseUrl: 'https://custom-api.example.com'
});
```

### Prepare for Review

Upload a document for review without sending signature emails:

```typescript
const result = await TurboSign.prepareForReview({
  fileLink: 'https://example.com/contract.pdf',
  recipients: [
    { name: 'John Doe', email: 'john@example.com', order: 1 }
  ],
  fields: [
    { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }
  ],
  documentName: 'Contract Agreement'
});

console.log('Preview URL:', result.previewUrl);
```

### Prepare for Signing

Upload a document and send signature request emails:

```typescript
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

### Get Document Status

```typescript
const status = await TurboSign.getStatus('document-id');
console.log('Status:', status.status); // 'pending', 'completed', 'voided'
```

### Download Signed Document

```typescript
const pdfBlob = await TurboSign.download('document-id');
```

### Void Document

```typescript
await TurboSign.void('document-id', 'Document needs revision');
```

### Resend Email

```typescript
await TurboSign.resend('document-id', ['recipient-id-1']);
```

## Field Types

| Type | Description |
|------|-------------|
| `signature` | Signature field |
| `initials` | Initials field |
| `date` | Date field (auto-filled) |
| `text` | Text input field |
| `checkbox` | Checkbox field |

## Error Handling

```typescript
try {
  await TurboSign.getStatus('invalid-id');
} catch (error) {
  console.error('Status:', error.statusCode);
  console.error('Message:', error.message);
}
```

## Requirements

- Node.js 16+

## Support

- 📖 [Documentation](https://www.turbodocx.com/docs)
- 💬 [Discord](https://discord.gg/NYKwz4BcpX)
- 🐛 [Issues](https://github.com/TurboDocx/SDK/issues)

## License

MIT - see [LICENSE](./LICENSE)
