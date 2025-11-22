[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/banner.png)](https://www.turbodocx.com)

turbodocx-go
====================
[![Go Reference](https://pkg.go.dev/badge/github.com/TurboDocx/SDK/packages/go-sdk.svg)](https://pkg.go.dev/github.com/TurboDocx/SDK/packages/go-sdk)
[![GitHub Stars](https://img.shields.io/github/stars/turbodocx/sdk?style=social)](https://github.com/turbodocx/sdk)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go&logoColor=white)](https://golang.org)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA?logo=discord)](https://discord.gg/NYKwz4BcpX)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official Go SDK for TurboDocx API - Digital signatures, document generation, and AI-powered workflows. Idiomatic Go with context support.

## Why turbodocx-go?

🚀 **Production-Ready** - Battle-tested in production environments processing thousands of documents daily.

🔄 **Active Maintenance** - Backed by TurboDocx with regular updates, bug fixes, and feature enhancements.

🤖 **AI-Optimized** - Designed for modern AI workflows where speed and reliability matter.

🐹 **Idiomatic Go** - Context-aware, proper error handling, and clean API design.

⚡ **100% n8n Parity** - Same operations available in our n8n community nodes.

## Installation

```bash
go get github.com/TurboDocx/SDK/packages/go-sdk
```

## Quick Start

```go
package main

import (
    "context"
    "fmt"
    turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
)

func main() {
    client := turbodocx.NewClient("your-api-key")

    result, err := client.TurboSign.PrepareForSigningSingle(context.Background(), &turbodocx.PrepareForSigningRequest{
        FileLink: "https://example.com/contract.pdf",
        Recipients: []turbodocx.Recipient{
            {Name: "John Doe", Email: "john@example.com", Order: 1},
        },
        Fields: []turbodocx.Field{
            {Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1},
        },
    })
    if err != nil {
        panic(err)
    }

    fmt.Println("Sign URL:", result.Recipients[0].SignURL)
}
```

## TurboSign API

### Configuration

```go
// With API key
client := turbodocx.NewClient("your-api-key")

// With custom base URL
client := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
    APIKey:  "your-api-key",
    BaseURL: "https://custom-api.example.com",
})
```

### Prepare for Review

```go
result, err := client.TurboSign.PrepareForReview(ctx, &turbodocx.PrepareForReviewRequest{
    FileLink:   "https://example.com/contract.pdf",
    Recipients: []turbodocx.Recipient{{Name: "John Doe", Email: "john@example.com", Order: 1}},
    Fields:     []turbodocx.Field{{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1}},
})
```

### Prepare for Signing

```go
result, err := client.TurboSign.PrepareForSigningSingle(ctx, &turbodocx.PrepareForSigningRequest{
    FileLink:   "https://example.com/contract.pdf",
    Recipients: []turbodocx.Recipient{{Name: "John Doe", Email: "john@example.com", Order: 1}},
    Fields:     []turbodocx.Field{{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1}},
})
```

### Get Document Status

```go
status, err := client.TurboSign.GetStatus(ctx, "document-id")
fmt.Println("Status:", status.Status)
```

### Download Signed Document

```go
pdfBytes, err := client.TurboSign.Download(ctx, "document-id")
os.WriteFile("signed.pdf", pdfBytes, 0644)
```

### Void Document

```go
_, err := client.TurboSign.VoidDocument(ctx, "document-id", "Document needs revision")
```

### Resend Email

```go
_, err := client.TurboSign.ResendEmail(ctx, "document-id", []string{"recipient-id-1"})
```

## Error Handling

```go
result, err := client.TurboSign.GetStatus(ctx, "invalid-id")
if err != nil {
    if apiErr, ok := err.(*turbodocx.TurboDocxError); ok {
        fmt.Println("Status:", apiErr.StatusCode)
        fmt.Println("Message:", apiErr.Message)
    }
}
```

## Requirements

- Go 1.21+

## Support

- 📖 [Documentation](https://www.turbodocx.com/docs)
- 💬 [Discord](https://discord.gg/NYKwz4BcpX)
- 🐛 [Issues](https://github.com/TurboDocx/SDK/issues)

## License

MIT - see [LICENSE](./LICENSE)
