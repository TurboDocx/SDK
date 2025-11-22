# TurboDocx .NET SDK

Official .NET SDK for TurboDocx API - Digital signatures, document generation, and AI-powered workflows.

## Installation

```bash
dotnet add package TurboDocx.SDK
```

Or via NuGet Package Manager:

```powershell
Install-Package TurboDocx.SDK
```

## Quick Start

```csharp
using TurboDocx;

// Create client with API key
using var client = new TurboDocxClient("your-api-key");

// Prepare document for signing
var result = await client.TurboSign.PrepareForSigningSingleAsync(new PrepareForSigningRequest
{
    FileLink = "https://example.com/contract.pdf",
    Recipients = new[]
    {
        new Recipient { Name = "John Doe", Email = "john@example.com", Order = 1 }
    },
    Fields = new[]
    {
        new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 1 }
    }
});

Console.WriteLine($"Document ID: {result.DocumentId}");
Console.WriteLine($"Sign URL: {result.Recipients[0].SignUrl}");
```

## TurboSign Operations

### Prepare for Review (without sending emails)

```csharp
var result = await client.TurboSign.PrepareForReviewAsync(new PrepareForReviewRequest
{
    FileLink = "https://example.com/contract.pdf",
    Recipients = new[]
    {
        new Recipient { Name = "John Doe", Email = "john@example.com", Order = 1 }
    },
    Fields = new[]
    {
        new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 1 }
    },
    DocumentName = "Contract Agreement"
});
```

### Prepare for Signing (sends emails immediately)

```csharp
var result = await client.TurboSign.PrepareForSigningSingleAsync(new PrepareForSigningRequest
{
    File = pdfBytes, // Or use FileLink, DeliverableId, TemplateId
    FileName = "contract.pdf",
    Recipients = new[]
    {
        new Recipient { Name = "John Doe", Email = "john@example.com", Order = 1 },
        new Recipient { Name = "Jane Smith", Email = "jane@example.com", Order = 2 }
    },
    Fields = new[]
    {
        new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 1 },
        new Field { Type = "signature", Page = 1, X = 100, Y = 600, Width = 200, Height = 50, RecipientOrder = 2 }
    }
});
```

### Get Document Status

```csharp
var status = await client.TurboSign.GetStatusAsync("document-id");
Console.WriteLine($"Status: {status.Status}");
```

### Download Signed Document

```csharp
var pdfBytes = await client.TurboSign.DownloadAsync("document-id");
await File.WriteAllBytesAsync("signed.pdf", pdfBytes);
```

### Void Document

```csharp
var result = await client.TurboSign.VoidDocumentAsync("document-id", "Document needs revision");
```

### Resend Email

```csharp
var result = await client.TurboSign.ResendEmailAsync("document-id", new[] { "recipient-id-1" });
```

## Configuration

```csharp
// With access token instead of API key
using var client = new TurboDocxClient(new TurboDocxClientConfig
{
    AccessToken = "your-oauth-token",
    BaseUrl = "https://custom-api.example.com" // Optional
});
```

## Error Handling

```csharp
try
{
    var status = await client.TurboSign.GetStatusAsync("invalid-doc");
}
catch (TurboDocxException ex)
{
    Console.WriteLine($"API Error: {ex.Message}");
    Console.WriteLine($"Status Code: {ex.StatusCode}");
    Console.WriteLine($"Error Code: {ex.Code}");
}
```

## Supported Frameworks

- .NET 6.0
- .NET 7.0
- .NET 8.0

## License

MIT
