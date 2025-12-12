[![TurboDocx](./banner.png)](https://www.turbodocx.com)

<div align="center">

# TurboDocx SDKs

**Official multi-language SDKs for document generation, digital signatures, and AI-powered workflows**

[![CI](https://github.com/TurboDocx/SDK/actions/workflows/ci.yml/badge.svg)](https://github.com/TurboDocx/SDK/actions/workflows/ci.yml)
[![GitHub Stars](https://img.shields.io/github/stars/turbodocx/sdk?style=social)](https://github.com/turbodocx/sdk)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA?logo=discord&logoColor=white)](https://discord.gg/NYKwz4BcpX)
[![X](https://img.shields.io/badge/X-@TurboDocx-000?logo=x&logoColor=white)](https://twitter.com/TurboDocx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Documentation](https://docs.turbodocx.com) • [API Reference](https://docs.turbodocx.com/api) • [Discord](https://discord.gg/NYKwz4BcpX) • [Blog](https://www.turbodocx.com/blog)

</div>

---

## Why TurboDocx?

<table>
<tr>
<td width="50%">

### 🚀 Production-Ready
Battle-tested infrastructure processing **thousands of documents daily**. Enterprise-grade reliability with 99.9% uptime SLA.

### ⚡ Lightning Fast
Average API response time under **200ms**. Optimized for high-throughput document workflows.

### 🔒 Enterprise Security
End-to-end encryption. Your documents never stored longer than necessary.

</td>
<td width="50%">

### 🤖 AI-Native
Built from the ground up for AI agents and automation. Perfect for n8n, Zapier, Make, and custom integrations.

### 📝 eSignature Ready
Legally binding digital signatures with full audit trails. DocuSign alternative at a fraction of the cost.

### 🛠️ Developer First
Comprehensive SDKs, detailed documentation, and responsive support. Ship faster with less friction.

</td>
</tr>
</table>

---

## Available SDKs

| Language | Package | Install | Docs |
|:---------|:--------|:--------|:-----|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="20"/> **JavaScript/TypeScript** | [@turbodocx/sdk](./packages/js-sdk) | `npm install @turbodocx/sdk` | [View →](./packages/js-sdk#readme) |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="20"/> **Python** | [turbodocx-sdk](./packages/py-sdk) | `pip install turbodocx-sdk` | [View →](./packages/py-sdk#readme) |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg" width="20"/> **Go** | [turbodocx-sdk](./packages/go-sdk) | `go get github.com/turbodocx/sdk` | [View →](./packages/go-sdk#readme) |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg" width="20"/> **Java** | [com.turbodocx:sdk](./packages/java-sdk) | [Maven Central](https://search.maven.org/artifact/com.turbodocx/sdk) | [View →](./packages/java-sdk#readme) |

### Coming Soon

| Language | Status |
|:---------|:-------|
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg" width="20"/> **C# / .NET** | 🚧 In Progress |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg" width="20"/> **Ruby** | 🚧 In Progress |
| <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/powershell/powershell-original.svg" width="20"/> **PowerShell** | 🚧 In Progress |

## 🌐 Explore the TurboDocx Ecosystem

| Package | Links | Description |
|---------|-------|-------------|
| @turbodocx/html-to-docx | [![npm](https://img.shields.io/npm/v/@turbodocx/html-to-docx?logo=npm&logoColor=white&label=npm)](https://www.npmjs.com/package/@turbodocx/html-to-docx) [![GitHub](https://img.shields.io/github/stars/turbodocx/html-to-docx?style=social)](https://github.com/turbodocx/html-to-docx) | Convert HTML to DOCX with the fastest JavaScript library |
| n8n-nodes-turbodocx | [![npm](https://img.shields.io/npm/v/@turbodocx/n8n-nodes-turbodocx?logo=npm&logoColor=white&label=npm)](https://www.npmjs.com/package/@turbodocx/n8n-nodes-turbodocx) [![GitHub](https://img.shields.io/github/stars/turbodocx/n8n-nodes-turbodocx?style=social)](https://github.com/turbodocx/n8n-nodes-turbodocx) | n8n community node for TurboDocx API & TurboSign |
| TurboDocx Writer | [![AppSource](https://img.shields.io/badge/Microsoft-AppSource-blue?logo=microsoft)](https://appsource.microsoft.com/en-us/product/office/WA200007397) | Official Microsoft Word add-in for document automation |

---

## Quick Start

Get up and running in under 2 minutes:

### 1. Get your API key

Sign up at [turbodocx.com](https://www.turbodocx.com) and grab your API key from the dashboard.

### 2. Install your SDK

<details open>
<summary><strong>JavaScript / TypeScript</strong></summary>

```bash
npm install @turbodocx/sdk
# or
yarn add @turbodocx/sdk
# or
pnpm add @turbodocx/sdk
```
</details>

<details>
<summary><strong>Python</strong></summary>

```bash
pip install turbodocx-sdk
# or
poetry add turbodocx-sdk
```
</details>

<details>
<summary><strong>Go</strong></summary>

```bash
go get github.com/turbodocx/sdk
```
</details>

<details>
<summary><strong>Java</strong></summary>

```xml
<dependency>
    <groupId>com.turbodocx</groupId>
    <artifactId>sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```
</details>

### 3. Send your first document for signature

```typescript
import { TurboSign } from '@turbodocx/sdk';

// Configure once
TurboSign.configure({ apiKey: process.env.TURBODOCX_API_KEY });

// Send for signature
const { documentId, recipients } = await TurboSign.prepareForSigningSingle({
  fileLink: 'https://example.com/contract.pdf',
  recipients: [
    { name: 'John Doe', email: 'john@example.com', order: 1 }
  ],
  fields: [
    { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }
  ]
});

console.log(`✅ Document sent! Sign URL: ${recipients[0].signUrl}`);
```

---

## Core Capabilities

### TurboSign — Digital Signatures

Send documents for legally-binding eSignatures with full audit trails.

| Method | Description |
|:-------|:------------|
| `prepareForReview()` | Upload document for preview without sending emails |
| `prepareForSigningSingle()` | Upload and immediately send signature requests |
| `getStatus()` | Check document and recipient signing status |
| `download()` | Download the completed signed document |
| `void()` | Cancel/void a signature request |
| `resend()` | Resend signature request emails |

### TurboDocx — Document Generation *(Coming Soon)*

Generate documents from templates with dynamic data.

---

## Examples

### Method 1: Coordinate-Based Signature Fields

Specify exact positions for signature fields using page coordinates:

```typescript
const result = await TurboSign.prepareForSigningSingle({
  fileLink: 'https://example.com/contract.pdf',
  recipients: [
    { name: 'Alice Smith', email: 'alice@example.com', order: 1 },
    { name: 'Bob Johnson', email: 'bob@example.com', order: 2 }
  ],
  fields: [
    // Alice's signature and date on page 1
    { type: 'signature', page: 1, x: 100, y: 650, width: 200, height: 50, recipientOrder: 1 },
    { type: 'date', page: 1, x: 320, y: 650, width: 100, height: 30, recipientOrder: 1 },

    // Bob's signature and date on page 1
    { type: 'signature', page: 1, x: 100, y: 720, width: 200, height: 50, recipientOrder: 2 },
    { type: 'date', page: 1, x: 320, y: 720, width: 100, height: 30, recipientOrder: 2 },

    // Initials on page 2
    { type: 'initials', page: 2, x: 500, y: 750, width: 60, height: 30, recipientOrder: 1 },
    { type: 'initials', page: 2, x: 500, y: 780, width: 60, height: 30, recipientOrder: 2 }
  ],
  documentName: 'Service Agreement',
  senderName: 'Acme Corp',
  senderEmail: 'contracts@acme.com'
});
```

### Method 2: Template-Based Signature Fields

Use text anchors in your PDF to automatically position signature fields:

```typescript
const result = await TurboSign.prepareForSigningSingle({
  fileLink: 'https://example.com/contract-with-placeholders.pdf',
  recipients: [
    { name: 'Alice Smith', email: 'alice@example.com', order: 1 },
    { name: 'Bob Johnson', email: 'bob@example.com', order: 2 }
  ],
  fields: [
    // Fields anchored to text markers in the PDF
    { type: 'signature', anchor: '{SIGNATURE_ALICE}', width: 200, height: 50, recipientOrder: 1 },
    { type: 'date', anchor: '{DATE_ALICE}', width: 100, height: 30, recipientOrder: 1 },
    { type: 'signature', anchor: '{SIGNATURE_BOB}', width: 200, height: 50, recipientOrder: 2 },
    { type: 'date', anchor: '{DATE_BOB}', width: 100, height: 30, recipientOrder: 2 },

    // Text fields for additional info
    { type: 'text', anchor: '{TITLE_ALICE}', width: 150, height: 25, recipientOrder: 1 },
    { type: 'text', anchor: '{TITLE_BOB}', width: 150, height: 25, recipientOrder: 2 }
  ]
});
```

> **Tip:** Template-based fields are ideal when your PDF layout may change. Add text markers like `{SIGNATURE_1}` to your document, and the signature fields will automatically align to them.

### Complete Workflow Example

```typescript
import { TurboSign } from '@turbodocx/sdk';

TurboSign.configure({ apiKey: process.env.TURBODOCX_API_KEY });

// 1. Send document for signature
const { documentId } = await TurboSign.prepareForSigningSingle({
  fileLink: 'https://example.com/contract.pdf',
  recipients: [
    { name: 'Alice', email: 'alice@example.com', order: 1 },
    { name: 'Bob', email: 'bob@example.com', order: 2 }
  ],
  fields: [
    { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 },
    { type: 'signature', page: 1, x: 100, y: 600, width: 200, height: 50, recipientOrder: 2 }
  ]
});

console.log(`Document ID: ${documentId}`);

// 2. Check status
const status = await TurboSign.getStatus(documentId);
console.log(`Status: ${status.status}`);  // 'pending', 'completed', 'voided'

for (const recipient of status.recipients) {
  console.log(`  ${recipient.name}: ${recipient.status}`);
}

// 3. Download when complete
if (status.status === 'completed') {
  const signedPdf = await TurboSign.download(documentId);
  // Save to file, upload to S3, etc.
}

// 4. Void if needed
await TurboSign.void(documentId, 'Contract terms changed');

// 5. Resend to specific recipients
await TurboSign.resend(documentId, ['recipient-uuid']);
```

### Field Types

| Type | Description | Auto-filled |
|:-----|:------------|:------------|
| `signature` | Draw or type signature | No |
| `initials` | Initials field | No |
| `text` | Free-form text input | No |
| `date` | Date stamp | Yes (signing date) |
| `checkbox` | Checkbox / agreement | No |

---

## Requirements

| SDK | Minimum Version |
|:----|:----------------|
| JavaScript/TypeScript | Node.js 16+ |
| Python | Python 3.9+ |
| Go | Go 1.21+ |
| Java | Java 11+ |

---

## Contributing

We love contributions! Whether it's bug fixes, new features, or documentation improvements.

```bash
# Clone the repo
git clone https://github.com/TurboDocx/SDK.git

# Navigate to your SDK
cd SDK/packages/<sdk-name>

# Follow SDK-specific setup in its README
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

### SDK Maintainers Wanted!

We're looking for community maintainers for each SDK. Interested? [Open an issue](https://github.com/TurboDocx/SDK/issues/new?title=SDK%20Maintainer%20Interest) or reach out on [Discord](https://discord.gg/NYKwz4BcpX).

---

## Support

<table>
<tr>
<td align="center" width="33%">
<a href="https://docs.turbodocx.com">
<img src="https://cdn-icons-png.flaticon.com/512/2991/2991112.png" width="40"/><br/>
<strong>Documentation</strong>
</a>
</td>
<td align="center" width="33%">
<a href="https://discord.gg/NYKwz4BcpX">
<img src="https://cdn-icons-png.flaticon.com/512/5968/5968756.png" width="40"/><br/>
<strong>Discord</strong>
</a>
</td>
<td align="center" width="33%">
<a href="https://github.com/TurboDocx/SDK/issues">
<img src="https://cdn-icons-png.flaticon.com/512/733/733553.png" width="40"/><br/>
<strong>GitHub Issues</strong>
</a>
</td>
</tr>
</table>

---

## License

MIT License — see [LICENSE](./LICENSE) for details.

---

<div align="center">

**[Website](https://www.turbodocx.com)** • **[Documentation](https://docs.turbodocx.com)** • **[Discord](https://discord.gg/NYKwz4BcpX)** • **[Twitter/X](https://twitter.com/TurboDocx)**

<sub>Built with ❤️ by the TurboDocx team</sub>

[![TurboDocx](./footer.png)](https://www.turbodocx.com)

</div>
