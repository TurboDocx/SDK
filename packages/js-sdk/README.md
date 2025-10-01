# @turbodocx/sdk

Official JavaScript/TypeScript SDK for TurboDocx APIs.

## Installation

```bash
npm install @turbodocx/sdk
```

## Quick Start

### TurboSign - Digital Signatures

```typescript
import { TurboSign } from '@turbodocx/sdk';

// Configure with your API key
TurboSign.configure({
  apiKey: process.env.TURBODOCX_API_KEY
});

// Upload document and get it signed
const result = await TurboSign.createSignatureRequest({
  file: pdfBuffer,
  recipients: [
    { email: 'john@example.com', name: 'John Doe' }
  ],
  fields: [
    {
      type: 'signature',
      recipientId: 'john@example.com',
      page: 1,
      x: 100,
      y: 650
    }
  ]
});

console.log('Sign URL:', result.recipients[0].signUrl);
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

- `turbosign-basic.ts` - Basic 3-step signature workflow
- `turbosign-complete-workflow.ts` - Streamlined single-call workflow
- `turbosign-advanced.ts` - Status checking, downloading, and management

## License

MIT

## Support

- 📖 [Documentation](https://docs.turbodocx.com)
- 💬 [Discord Community](https://discord.gg/NYKwz4BcpX)
- 🐛 [Report Issues](https://github.com/TurboDocx/SDK/issues)
