# TurboDocx Go SDK

Official Go SDK for TurboDocx API - Digital signatures, document generation, and AI-powered workflows.

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
    "log"

    turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
)

func main() {
    // Create client with API key
    client := turbodocx.NewClient("your-api-key")

    // Prepare document for signing
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
        log.Fatal(err)
    }

    fmt.Printf("Document ID: %s\n", result.DocumentID)
    fmt.Printf("Sign URL: %s\n", result.Recipients[0].SignURL)
}
```

## TurboSign Operations

### Prepare for Review (without sending emails)

```go
result, err := client.TurboSign.PrepareForReview(ctx, &turbodocx.PrepareForReviewRequest{
    FileLink: "https://example.com/contract.pdf",
    Recipients: []turbodocx.Recipient{
        {Name: "John Doe", Email: "john@example.com", Order: 1},
    },
    Fields: []turbodocx.Field{
        {Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1},
    },
    DocumentName: "Contract Agreement",
})
```

### Prepare for Signing (sends emails immediately)

```go
result, err := client.TurboSign.PrepareForSigningSingle(ctx, &turbodocx.PrepareForSigningRequest{
    File:     pdfBytes, // Or use FileLink, DeliverableID, TemplateID
    FileName: "contract.pdf",
    Recipients: []turbodocx.Recipient{
        {Name: "John Doe", Email: "john@example.com", Order: 1},
        {Name: "Jane Smith", Email: "jane@example.com", Order: 2},
    },
    Fields: []turbodocx.Field{
        {Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1},
        {Type: "signature", Page: 1, X: 100, Y: 600, Width: 200, Height: 50, RecipientOrder: 2},
    },
})
```

### Get Document Status

```go
status, err := client.TurboSign.GetStatus(ctx, "document-id")
fmt.Printf("Status: %s\n", status.Status)
```

### Download Signed Document

```go
pdfBytes, err := client.TurboSign.Download(ctx, "document-id")
os.WriteFile("signed.pdf", pdfBytes, 0644)
```

### Void Document

```go
result, err := client.TurboSign.VoidDocument(ctx, "document-id", "Document needs revision")
```

### Resend Email

```go
result, err := client.TurboSign.ResendEmail(ctx, "document-id", []string{"recipient-id-1"})
```

## Configuration

```go
// With access token instead of API key
client := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
    AccessToken: "your-oauth-token",
    BaseURL:     "https://custom-api.example.com", // Optional
})
```

## Error Handling

```go
result, err := client.TurboSign.GetStatus(ctx, "invalid-doc")
if err != nil {
    if apiErr, ok := err.(*turbodocx.TurboDocxError); ok {
        fmt.Printf("API Error: %s (code: %s, status: %d)\n",
            apiErr.Message, apiErr.Code, apiErr.StatusCode)
    }
}
```

## License

MIT
