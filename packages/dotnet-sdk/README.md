[![TurboDocx](./banner.png)](https://www.turbodocx.com)

<div align="center">

# TurboDocx.Sdk

**Official .NET SDK for TurboDocx**

[![NuGet Version](https://img.shields.io/nuget/v/TurboDocx.Sdk.svg)](https://nuget.org/packages/TurboDocx.Sdk)
[![NuGet Downloads](https://img.shields.io/nuget/dt/TurboDocx.Sdk)](https://nuget.org/packages/TurboDocx.Sdk)
[![.NET](https://img.shields.io/badge/.NET-6.0+-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[Documentation](https://www.turbodocx.com/docs) • [API Reference](https://www.turbodocx.com/docs/api) • [Examples](#examples) • [Discord](https://discord.gg/NYKwz4BcpX)

</div>

---

## Features

- 🚀 **Production-Ready** — Battle-tested, processing thousands of documents daily
- ⚡ **Async-First** — Native async/await with ConfigureAwait support
- 🔒 **Type-Safe** — Full nullable reference type support
- 📝 **IntelliSense** — Comprehensive XML documentation
- 🧵 **Thread-Safe** — Safe for concurrent use with HttpClient pooling
- 🤖 **100% n8n Parity** — Same operations as our n8n community nodes

---

## Installation

```bash
dotnet add package TurboDocx.Sdk
```

<details>
<summary>Other methods</summary>

```bash
# Package Manager Console
Install-Package TurboDocx.Sdk

# PackageReference
<PackageReference Include="TurboDocx.Sdk" Version="1.0.0" />

# Paket
paket add TurboDocx.Sdk
```
</details>

---

## Quick Start

```csharp
using TurboDocx.Sdk;

// 1. Create client
var client = new TurboDocxClient("your-api-key");

// 2. Send document for signature
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

Console.WriteLine($"Sign URL: {result.Recipients[0].SignUrl}");
```

---

## Configuration

```csharp
// Basic client
var client = new TurboDocxClient("your-api-key");

// With options
var client = new TurboDocxClient(new TurboDocxOptions
{
    ApiKey = Environment.GetEnvironmentVariable("TURBODOCX_API_KEY"),
    BaseUrl = "https://custom-api.example.com",  // Optional
    Timeout = TimeSpan.FromSeconds(30)           // Optional
});

// With dependency injection (ASP.NET Core)
services.AddTurboDocx(options =>
{
    options.ApiKey = Configuration["TurboDocx:ApiKey"];
});
```

### Dependency Injection

```csharp
// Startup.cs / Program.cs
builder.Services.AddTurboDocx(options =>
{
    options.ApiKey = builder.Configuration["TurboDocx:ApiKey"];
});

// In your service/controller
public class ContractService
{
    private readonly ITurboDocxClient _client;

    public ContractService(ITurboDocxClient client)
    {
        _client = client;
    }

    public async Task<string> SendContractAsync(string pdfUrl)
    {
        var result = await _client.TurboSign.PrepareForSigningSingleAsync(...);
        return result.DocumentId;
    }
}
```

---

## API Reference

### TurboSign

#### `PrepareForReviewAsync`

Upload a document for review without sending signature emails.

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
    DocumentName = "Service Agreement",       // Optional
    SenderName = "Acme Corp",                 // Optional
    SenderEmail = "contracts@acme.com"        // Optional
});

Console.WriteLine($"Preview URL: {result.PreviewUrl}");
Console.WriteLine($"Document ID: {result.DocumentId}");
```

#### `PrepareForSigningSingleAsync`

Upload a document and immediately send signature request emails.

```csharp
var result = await client.TurboSign.PrepareForSigningSingleAsync(new PrepareForSigningRequest
{
    FileLink = "https://example.com/contract.pdf",
    Recipients = new[]
    {
        new Recipient { Name = "Alice", Email = "alice@example.com", Order = 1 },
        new Recipient { Name = "Bob", Email = "bob@example.com", Order = 2 }
    },
    Fields = new[]
    {
        new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 1 },
        new Field { Type = "signature", Page = 1, X = 100, Y = 600, Width = 200, Height = 50, RecipientOrder = 2 }
    }
});

foreach (var recipient in result.Recipients)
{
    Console.WriteLine($"{recipient.Name}: {recipient.SignUrl}");
}
```

#### `GetStatusAsync`

Check the current status of a document.

```csharp
var status = await client.TurboSign.GetStatusAsync("doc-uuid-here");

Console.WriteLine($"Status: {status.Status}");  // "pending", "completed", "voided"

foreach (var recipient in status.Recipients)
{
    Console.WriteLine($"{recipient.Name}: {recipient.Status}");
}
```

#### `DownloadAsync`

Download the signed document.

```csharp
var pdfBytes = await client.TurboSign.DownloadAsync("doc-uuid-here");

// Save to file
await File.WriteAllBytesAsync("signed-contract.pdf", pdfBytes);

// Or return as stream
var stream = new MemoryStream(pdfBytes);
```

#### `VoidAsync`

Cancel a signature request.

```csharp
await client.TurboSign.VoidAsync("doc-uuid-here", "Contract terms changed");
```

#### `ResendAsync`

Resend signature request emails.

```csharp
await client.TurboSign.ResendAsync("doc-uuid-here", new[] { "recipient-uuid-1" });
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

---

## Examples

### Sequential Signing

```csharp
var result = await client.TurboSign.PrepareForSigningSingleAsync(new PrepareForSigningRequest
{
    FileLink = "https://example.com/contract.pdf",
    Recipients = new[]
    {
        new Recipient { Name = "Employee", Email = "employee@company.com", Order = 1 },
        new Recipient { Name = "Manager", Email = "manager@company.com", Order = 2 },
        new Recipient { Name = "HR", Email = "hr@company.com", Order = 3 }
    },
    Fields = new[]
    {
        // Employee signs first
        new Field { Type = "signature", Page = 1, X = 100, Y = 400, Width = 200, Height = 50, RecipientOrder = 1 },
        new Field { Type = "date", Page = 1, X = 320, Y = 400, Width = 100, Height = 30, RecipientOrder = 1 },
        // Manager signs second
        new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 2 },
        // HR signs last
        new Field { Type = "signature", Page = 1, X = 100, Y = 600, Width = 200, Height = 50, RecipientOrder = 3 }
    }
});
```

### With Cancellation Token

```csharp
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(30));

try
{
    var result = await client.TurboSign.PrepareForSigningSingleAsync(request, cts.Token);
}
catch (OperationCanceledException)
{
    Console.WriteLine("Request was cancelled");
}
```

### Polling for Completion

```csharp
public async Task<byte[]> WaitForCompletionAsync(string documentId, CancellationToken ct = default)
{
    while (!ct.IsCancellationRequested)
    {
        var status = await client.TurboSign.GetStatusAsync(documentId, ct);

        switch (status.Status)
        {
            case "completed":
                return await client.TurboSign.DownloadAsync(documentId, ct);
            case "voided":
                throw new InvalidOperationException("Document was voided");
        }

        await Task.Delay(TimeSpan.FromSeconds(30), ct);
    }

    throw new OperationCanceledException();
}
```

### ASP.NET Core Controller

```csharp
[ApiController]
[Route("api/[controller]")]
public class ContractsController : ControllerBase
{
    private readonly ITurboDocxClient _client;

    public ContractsController(ITurboDocxClient client)
    {
        _client = client;
    }

    [HttpPost("send")]
    public async Task<IActionResult> SendContract([FromBody] SendContractRequest request)
    {
        var result = await _client.TurboSign.PrepareForSigningSingleAsync(new PrepareForSigningRequest
        {
            FileLink = request.PdfUrl,
            Recipients = request.Recipients,
            Fields = request.Fields
        });

        return Ok(new { DocumentId = result.DocumentId });
    }
}
```

---

## Error Handling

```csharp
try
{
    var result = await client.TurboSign.GetStatusAsync("invalid-id");
}
catch (TurboDocxException ex)
{
    Console.WriteLine($"Status: {ex.StatusCode}");
    Console.WriteLine($"Message: {ex.Message}");
    Console.WriteLine($"Code: {ex.ErrorCode}");
}
catch (Exception ex)
{
    Console.WriteLine($"Unexpected error: {ex.Message}");
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

## Requirements

- .NET 6.0+

---

## Related Packages

| Package | Description |
|:--------|:------------|
| [@turbodocx/sdk (JS)](../js-sdk) | JavaScript/TypeScript SDK |
| [turbodocx-sdk (Python)](../py-sdk) | Python SDK |
| [@turbodocx/n8n-nodes-turbodocx](https://www.npmjs.com/package/@turbodocx/n8n-nodes-turbodocx) | n8n community nodes |

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
