[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/banner.png)](https://www.turbodocx.com)

TurboDocx .NET SDK
====================
[![NuGet Version](https://img.shields.io/nuget/v/TurboDocx.svg)](https://nuget.org/packages/TurboDocx)
[![NuGet Downloads](https://img.shields.io/nuget/dt/TurboDocx)](https://nuget.org/packages/TurboDocx)
[![GitHub Stars](https://img.shields.io/github/stars/turbodocx/sdk?style=social)](https://github.com/turbodocx/sdk)
[![.NET](https://img.shields.io/badge/.NET-6.0+-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA?logo=discord)](https://discord.gg/NYKwz4BcpX)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official .NET SDK for TurboDocx API - Digital signatures, document generation, and AI-powered workflows. Async-first with full nullable reference type support.

## Why TurboDocx .NET SDK?

🚀 **Production-Ready** - Battle-tested in production environments processing thousands of documents daily.

🔄 **Active Maintenance** - Backed by TurboDocx with regular updates, bug fixes, and feature enhancements.

🤖 **AI-Optimized** - Designed for modern AI workflows where speed and reliability matter.

💜 **Modern .NET** - Async/await, nullable reference types, and clean API design.

⚡ **100% n8n Parity** - Same operations available in our n8n community nodes.

## Installation

```bash
dotnet add package TurboDocx
```

## Quick Start

```csharp
using TurboDocx;

var client = new TurboDocxClient("your-api-key");

var result = await client.TurboSign.PrepareForSigningSingleAsync(new PrepareForSigningRequest
{
    FileLink = "https://example.com/contract.pdf",
    Recipients = new[] { new Recipient { Name = "John Doe", Email = "john@example.com", Order = 1 } },
    Fields = new[] { new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 1 } }
});

Console.WriteLine($"Sign URL: {result.Recipients[0].SignUrl}");
```

## TurboSign API

### Configuration

```csharp
// With API key
var client = new TurboDocxClient("your-api-key");

// With custom base URL
var client = new TurboDocxClient(new TurboDocxClientConfig
{
    ApiKey = "your-api-key",
    BaseUrl = "https://custom-api.example.com"
});
```

### Prepare for Review

```csharp
var result = await client.TurboSign.PrepareForReviewAsync(new PrepareForReviewRequest
{
    FileLink = "https://example.com/contract.pdf",
    Recipients = new[] { new Recipient { Name = "John Doe", Email = "john@example.com", Order = 1 } },
    Fields = new[] { new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 1 } }
});
```

### Prepare for Signing

```csharp
var result = await client.TurboSign.PrepareForSigningSingleAsync(new PrepareForSigningRequest
{
    FileLink = "https://example.com/contract.pdf",
    Recipients = new[] { new Recipient { Name = "John Doe", Email = "john@example.com", Order = 1 } },
    Fields = new[] { new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 1 } }
});
```

### Get Document Status

```csharp
var status = await client.TurboSign.GetStatusAsync("document-id");
Console.WriteLine($"Status: {status.Status}");
```

### Download Signed Document

```csharp
byte[] pdfBytes = await client.TurboSign.DownloadAsync("document-id");
File.WriteAllBytes("signed.pdf", pdfBytes);
```

### Void Document

```csharp
await client.TurboSign.VoidDocumentAsync("document-id", "Document needs revision");
```

### Resend Email

```csharp
await client.TurboSign.ResendEmailAsync("document-id", new[] { "recipient-id-1" });
```

## Error Handling

```csharp
try
{
    await client.TurboSign.GetStatusAsync("invalid-id");
}
catch (TurboDocxException ex)
{
    Console.WriteLine($"Status: {ex.StatusCode}");
    Console.WriteLine($"Message: {ex.Message}");
}
```

## Requirements

- .NET 6.0+

## Support

- 📖 [Documentation](https://www.turbodocx.com/docs)
- 💬 [Discord](https://discord.gg/NYKwz4BcpX)
- 🐛 [Issues](https://github.com/TurboDocx/SDK/issues)

## License

MIT - see [LICENSE](./LICENSE)
