# @turbodocx/sdk

Official JavaScript/TypeScript SDK for TurboDocx APIs.

## Installation

```bash
npm install @turbodocx/sdk
```

## Quick Start

### ✨ TurboSign - Digital Signatures Made Simple

The easiest way to get documents signed:

```typescript
import { TurboSign } from '@turbodocx/sdk';

// Configure with your API key
TurboSign.configure({
  apiKey: process.env.TURBODOCX_API_KEY
});

// 🎉 That's it! One method call does everything:
const result = await TurboSign.send({
  file: pdfBuffer,
  recipients: [
    { email: 'john@example.com', name: 'John Doe' },
    { email: 'jane@example.com', name: 'Jane Smith' }
  ],
  fields: [
    { type: 'signature', page: 1, x: 100, y: 650, recipientIndex: 0 },
    { type: 'date', page: 1, x: 100, y: 600, recipientIndex: 0 },
    { type: 'signature', page: 1, x: 350, y: 650, recipientIndex: 1 }
  ]
});

console.log('Sign URL:', result.recipients[0].signUrl);
```

**What just happened? 🤔**
- ✅ Document uploaded
- ✅ Recipients added with beautiful auto-generated colors
- ✅ Signing order auto-assigned based on array position (no manual ordering!)
- ✅ Field sizes auto-filled with smart defaults
- ✅ Emails sent to all recipients
- ✅ Ready to sign!

**Want more control?** You can override any defaults:

```typescript
const result = await TurboSign.send({
  file: pdfBuffer,
  fileName: 'Partnership Agreement',  // Custom name
  description: 'Q1 2025 Partnership Agreement',
  recipients: [
    {
      email: 'ceo@company.com',
      name: 'Jane CEO',
      color: 'hsl(200, 75%, 50%)',  // Custom color
      lightColor: 'hsl(200, 75%, 93%)'
    }
  ],
  fields: [
    {
      type: 'signature',
      page: 1,
      x: 100,
      y: 650,
      width: 250,  // Custom width
      height: 60,  // Custom height
      recipientEmail: 'ceo@company.com'  // Use email instead of index
    }
  ],
  webhookUrl: 'https://your-app.com/webhook',
  sendEmails: false  // Don't send emails yet
});
```

## Features

- **TurboSign**: Digital signature workflows
  - Upload documents
  - Add recipients
  - Place signature fields
  - Track signing status
  - Download signed documents
  - Audit trails

## Authentication

Set your API key via configuration:

```typescript
TurboSign.configure({ apiKey: 'your-api-key' });
```

Or use environment variables:

```bash
export TURBODOCX_API_KEY=your-api-key
```

## Documentation

For detailed documentation and examples, see:

- [Examples](./examples) - Complete working examples
- [TurboDocx Documentation](https://docs.turbodocx.com)

## TypeScript Support

This SDK is written in TypeScript and includes comprehensive type definitions.

```typescript
import type { SignatureField, PrepareSigningRequest } from '@turbodocx/sdk';
```

## Examples

See the [examples](./examples) directory for complete working examples:

- `turbosign-send-simple.ts` - ✨ **Magical one-liner** (recommended for most use cases)
- `turbosign-send-with-emails.ts` - Using recipientEmail for explicit field assignment
- `turbosign-basic.ts` - Manual 3-step signature workflow
- `turbosign-complete-workflow.ts` - Alternative single-call workflow
- `turbosign-from-deliverable.ts` - Creating signature docs from existing deliverables
- `turbosign-advanced.ts` - Status checking, downloading, and management

### API Methods

**Recommended (Simplest):**
- `TurboSign.send()` - ✨ Magical one-liner with intelligent defaults

**Advanced (More Control):**
- `TurboSign.uploadDocument()` - Upload a PDF
- `TurboSign.saveDocumentDetails()` - Add/update recipients
- `TurboSign.prepareForSigning()` - Place fields and send
- `TurboSign.createFromDeliverable()` - Create from existing document
- `TurboSign.getStatus()` - Check document status
- `TurboSign.download()` - Get signed PDF
- `TurboSign.getAuditTrail()` - Download audit trail
- `TurboSign.void()` - Cancel signature request
- `TurboSign.resend()` - Resend to recipients

## License

MIT

## Support

- 📖 [Documentation](https://docs.turbodocx.com)
- 💬 [Discord Community](https://discord.gg/NYKwz4BcpX)
- 🐛 [Report Issues](https://github.com/TurboDocx/SDK/issues)
