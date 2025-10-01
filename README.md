[![TurboDocx](./banner.png)](https://www.turbodocx.com)

@turbodocx/sdk
====================
[![GitHub Stars](https://img.shields.io/github/stars/turbodocx/sdk?style=social)](https://github.com/turbodocx/sdk)
[![Type Script](https://shields.io/badge/TypeScript-3178C6?logo=TypeScript&logoColor=FFF&style=flat-square)](https://typescript.org)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA?logo=discord)](https://discord.gg/NYKwz4BcpX)
[![X](https://img.shields.io/badge/X-@TurboDocx-1DA1F2?logo=x&logoColor=white)](https://twitter.com/TurboDocx)
[![Embed TurboDocx in Your App in Minutes](https://img.shields.io/badge/Embed%20TurboDocx%20in%20Your%20App%20in%20Minutes-8A2BE2)](https://www.turbodocx.com/use-cases/embedded-api?utm_source=github&utm_medium=repo&utm_campaign=open_source)

Official SDK monorepo for TurboDocx - Build powerful document generation and manipulation tools with JavaScript and TypeScript. From HTML to DOCX conversion to advanced document processing, our SDKs provide the building blocks for modern document workflows.

## Why TurboDocx SDKs?

🚀 **Production-Ready** - Battle-tested libraries used in production environments processing thousands of documents daily.

🔄 **Active Maintenance** - Backed by TurboDocx with regular updates, bug fixes, and feature enhancements. Long-term support guaranteed.

🤖 **AI-Optimized** - Designed for modern AI workflows where speed and reliability matter. Perfect for AI-powered document generation.

⚡ **Zero External Dependencies** - Pure JavaScript/TypeScript implementations that work in any environment without external binaries.

🛠️ **Developer First** - Full TypeScript support, comprehensive documentation, and extensive examples to get you started quickly.

🎯 **Enterprise Grade** - Used by enterprises worldwide for mission-critical document processing workflows.

## Packages

This monorepo contains the following SDK packages:

### [@turbodocx/html-to-docx](./packages/html-to-docx)
[![NPM Version](https://img.shields.io/npm/v/@turbodocx/html-to-docx.svg)](https://npmjs.org/package/@turbodocx/html-to-docx)
[![npm](https://img.shields.io/npm/dm/@turbodocx/html-to-docx)](https://www.npmjs.com/package/@turbodocx/html-to-docx)

Convert HTML to Word, Google Docs, and DOCX files with the fastest, most reliable JavaScript library available. Perfect for AI-powered document generation and enterprise reporting systems.

```bash
npm install @turbodocx/html-to-docx
```

**Key Features:**
- Pure JavaScript implementation - no browser automation required
- Full TypeScript support with comprehensive type definitions
- Advanced formatting: headers, footers, page numbers, margins
- RTL language support (Arabic, Hebrew)
- Table formatting with border controls
- Custom fonts and styling

### More SDKs Coming Soon

We're actively developing additional SDKs for the TurboDocx ecosystem:
- PDF generation and manipulation
- DOCX to HTML conversion
- Template engine SDK
- And more...

## Installation

Each package can be installed independently:

```bash
# HTML to DOCX converter
npm install @turbodocx/html-to-docx

# More packages coming soon...
```

## Quick Start

### HTML to DOCX

```typescript
import HtmlToDocx from "@turbodocx/html-to-docx";

const htmlString = `<!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <title>Document</title>
        </head>
        <body>
            <h1>Hello world</h1>
            <p>This is a sample document.</p>
        </body>
    </html>`;

// Convert HTML to DOCX
const docx = await HtmlToDocx(htmlString, null, {
  title: "My Document",
  creator: "TurboDocx",
  orientation: "portrait"
});

// Save or process the docx buffer/blob
```

## Documentation

Each package in this monorepo has its own detailed documentation:

- [HTML to DOCX Documentation](./packages/html-to-docx/README.md)

For comprehensive guides and API references, visit our [Documentation Site](https://www.turbodocx.com/docs).

## Repository Structure

This is a monorepo containing multiple SDK packages:

```
SDK/
├── packages/
│   ├── html-to-docx/      # HTML to DOCX converter
│   └── [future packages]
├── examples/              # Shared examples across SDKs
└── docs/                  # Shared documentation
```

## Development

### Prerequisites

- Node.js 16+ (18+ recommended)
- npm or yarn

### Setup

```bash
# Clone the repository
git clone git@github.com:TurboDocx/SDK.git
cd SDK

# Install dependencies for all packages
npm install

# Build all packages
npm run build

# Run tests
npm test
```

### Working with Individual Packages

Each package can be developed independently:

```bash
cd packages/html-to-docx
npm install
npm run build
npm test
```

## TypeScript Support

All packages in this monorepo include first-class TypeScript support with comprehensive type definitions. No additional installation required.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

Please make sure to:
- Branch new features off of `develop`
- Update tests as appropriate
- Follow existing code style and conventions
- Update documentation for any API changes

### Development Workflow

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Use Cases

Our SDKs power a wide range of document processing workflows:

- **AI Document Generation** - Generate documents from AI-generated content
- **Report Automation** - Automate business reports and analytics documents
- **Template Systems** - Build dynamic document template systems
- **Content Management** - Convert web content to downloadable documents
- **Enterprise Applications** - Integrate document generation into enterprise software
- **Data Export** - Export application data to professional documents

## Support

**Proudly Sponsored by TurboDocx**
[!["Proudly Sponsored by TurboDocx"](https://image.typedream.com/cdn-cgi/image/width=1920,format=auto,fit=scale-down,quality=100/https://api.typedream.com/v0/document/public/de39171b-a5c9-49c5-bd9c-c2dfd5d632a2/2PZxyx12UwC5HrIA3p6lo16fCms_Group_16_1_.png)](https://www.TurboDocx.com)

### Get Help

- 📖 [Documentation](https://www.turbodocx.com/docs)
- 💬 [Discord Community](https://discord.gg/NYKwz4BcpX)
- 🐦 [Twitter/X](https://twitter.com/TurboDocx)
- 📧 [Email Support](mailto:support@turbodocx.com)
- 🐛 [Report Issues](https://github.com/TurboDocx/SDK/issues)

## License

MIT

## Contributors

<a href="https://github.com/TurboDocx/SDK/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=turbodocx/sdk" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

---

Built with ❤️ by the TurboDocx team
