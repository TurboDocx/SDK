[![TurboDocx](./banner.png)](https://www.turbodocx.com)

<div align="center">

# turbodocx-sdk

**Official Go SDK for TurboDocx**

[![Go Reference](https://pkg.go.dev/badge/github.com/turbodocx/sdk.svg)](https://pkg.go.dev/github.com/turbodocx/sdk)
[![Go Report Card](https://goreportcard.com/badge/github.com/turbodocx/sdk)](https://goreportcard.com/report/github.com/turbodocx/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[Documentation](https://www.turbodocx.com/docs) • [API Reference](https://www.turbodocx.com/docs/api) • [Examples](#examples) • [Discord](https://discord.gg/NYKwz4BcpX)

</div>

---

## Features

- 🚀 **Production-Ready** — Battle-tested, processing thousands of documents daily
- ⚡ **Context Support** — Full context.Context support for cancellation and timeouts
- 🔒 **Type-Safe** — Strongly typed request/response structs
- 🧵 **Concurrent Safe** — Safe for use across goroutines
- 📦 **Zero Dependencies** — Only standard library
- 🤖 **100% n8n Parity** — Same operations as our n8n community nodes

---

## Installation

```bash
go get github.com/turbodocx/sdk
```

---

## Quick Start

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"

    turbodocx "github.com/turbodocx/sdk"
)

func main() {
    // 1. Create client with sender configuration
    client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
        APIKey:      os.Getenv("TURBODOCX_API_KEY"),      // REQUIRED
        OrgID:       os.Getenv("TURBODOCX_ORG_ID"),       // REQUIRED
        SenderEmail: os.Getenv("TURBODOCX_SENDER_EMAIL"), // REQUIRED
        SenderName:  os.Getenv("TURBODOCX_SENDER_NAME"),  // OPTIONAL (but strongly recommended)
    })
    if err != nil {
        log.Fatal(err)
    }

    // 2. Read PDF file
    pdfFile, err := os.ReadFile("contract.pdf")
    if err != nil {
        log.Fatal(err)
    }

    // 3. Send document for signature
    result, err := client.TurboSign.SendSignature(context.Background(), &turbodocx.SendSignatureRequest{
        File:         pdfFile,
        FileName:     "contract.pdf",
        DocumentName: "Partnership Agreement",
        Recipients: []turbodocx.Recipient{
            {Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
        },
        Fields: []turbodocx.Field{
            {
                Type:           "signature",
                RecipientEmail: "john@example.com",
                Template: &turbodocx.FieldTemplate{
                    Anchor:    "{signature1}",
                    Placement: "replace",
                    Size:      &turbodocx.FieldSize{Width: 100, Height: 30},
                },
            },
        },
    })
    if err != nil {
        log.Fatal(err)
    }

    fmt.Printf("Document ID: %s\n", result.DocumentID)
}
```

---

## Configuration

```go
// Basic client configuration (REQUIRED)
client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
    APIKey:      "your-api-key",      // REQUIRED
    OrgID:       "your-org-id",       // REQUIRED
    SenderEmail: "you@company.com",   // REQUIRED - reply-to address for signature requests
    SenderName:  "Your Company",      // OPTIONAL but strongly recommended
})

// With environment variables (recommended)
client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
    APIKey:      os.Getenv("TURBODOCX_API_KEY"),
    OrgID:       os.Getenv("TURBODOCX_ORG_ID"),
    SenderEmail: os.Getenv("TURBODOCX_SENDER_EMAIL"),
    SenderName:  os.Getenv("TURBODOCX_SENDER_NAME"),
})

// With custom options
client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
    APIKey:      os.Getenv("TURBODOCX_API_KEY"),
    OrgID:       os.Getenv("TURBODOCX_ORG_ID"),
    SenderEmail: os.Getenv("TURBODOCX_SENDER_EMAIL"),
    SenderName:  os.Getenv("TURBODOCX_SENDER_NAME"),
    BaseURL:     "https://custom-api.example.com",  // Optional
    Timeout:     30 * time.Second,                   // Optional
})
```

**Important:** `SenderEmail` is **REQUIRED**. This email will be used as the reply-to address for signature request emails. Without it, emails will default to "API Service User via TurboSign". The `SenderName` is optional but strongly recommended for a professional appearance.

**Environment Variables:**

```bash
# .env or shell environment
export TURBODOCX_API_KEY=your-api-key
export TURBODOCX_ORG_ID=your-org-id
export TURBODOCX_SENDER_EMAIL=you@company.com
export TURBODOCX_SENDER_NAME="Your Company Name"
```

---

## API Reference

### TurboSign

#### `PrepareForReview`

Upload a document for review without sending signature emails.

```go
result, err := client.TurboSign.PrepareForReview(ctx, &turbodocx.PrepareForReviewRequest{
    FileLink: "https://example.com/contract.pdf",
    Recipients: []turbodocx.Recipient{
        {Name: "John Doe", Email: "john@example.com", Order: 1},
    },
    Fields: []turbodocx.Field{
        {Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1},
    },
    DocumentName: "Service Agreement",       // Optional
    SenderName:   "Acme Corp",               // Optional
    SenderEmail:  "contracts@acme.com",      // Optional
})

fmt.Printf("Preview URL: %s\n", result.PreviewURL)
fmt.Printf("Document ID: %s\n", result.DocumentID)
```

#### `PrepareForSigningSingle`

Upload a document and immediately send signature request emails.

```go
result, err := client.TurboSign.PrepareForSigningSingle(ctx, &turbodocx.PrepareForSigningRequest{
    FileLink: "https://example.com/contract.pdf",
    Recipients: []turbodocx.Recipient{
        {Name: "Alice", Email: "alice@example.com", Order: 1},
        {Name: "Bob", Email: "bob@example.com", Order: 2},
    },
    Fields: []turbodocx.Field{
        {Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1},
        {Type: "signature", Page: 1, X: 100, Y: 600, Width: 200, Height: 50, RecipientOrder: 2},
    },
})

for _, r := range result.Recipients {
    fmt.Printf("%s: %s\n", r.Name, r.SignURL)
}
```

#### `GetStatus`

Check the current status of a document.

```go
status, err := client.TurboSign.GetStatus(ctx, "doc-uuid-here")

fmt.Printf("Status: %s\n", status.Status)  // "pending", "completed", "voided"

for _, r := range status.Recipients {
    fmt.Printf("%s: %s\n", r.Name, r.Status)
}
```

#### `Download`

Download the signed document.

```go
pdfBytes, err := client.TurboSign.Download(ctx, "doc-uuid-here")

// Save to file
err = os.WriteFile("signed-contract.pdf", pdfBytes, 0644)
```

#### `Void`

Cancel a signature request.

```go
err := client.TurboSign.Void(ctx, "doc-uuid-here", "Contract terms changed")
```

#### `Resend`

Resend signature request emails.

```go
err := client.TurboSign.Resend(ctx, "doc-uuid-here", []string{"recipient-uuid-1"})
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

For complete, working examples including template anchors, advanced field types, and various workflows, see the [`examples/`](./examples/) directory:

- [`turbosign_send_simple.go`](./examples/turbosign_send_simple.go) - Send document directly with template anchors
- [`turbosign_basic.go`](./examples/turbosign_basic.go) - Create review link first, then send manually
- [`turbosign_advanced.go`](./examples/turbosign_advanced.go) - Advanced field types (checkbox, readonly, multiline text, etc.)

### Sequential Signing

```go
result, _ := client.TurboSign.PrepareForSigningSingle(ctx, &turbodocx.PrepareForSigningRequest{
    FileLink: "https://example.com/contract.pdf",
    Recipients: []turbodocx.Recipient{
        {Name: "Employee", Email: "employee@company.com", Order: 1},
        {Name: "Manager", Email: "manager@company.com", Order: 2},
        {Name: "HR", Email: "hr@company.com", Order: 3},
    },
    Fields: []turbodocx.Field{
        {Type: "signature", Page: 1, X: 100, Y: 400, Width: 200, Height: 50, RecipientOrder: 1},
        {Type: "date", Page: 1, X: 320, Y: 400, Width: 100, Height: 30, RecipientOrder: 1},
        {Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 2},
        {Type: "signature", Page: 1, X: 100, Y: 600, Width: 200, Height: 50, RecipientOrder: 3},
    },
})
```

### With Context Timeout

```go
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

result, err := client.TurboSign.PrepareForSigningSingle(ctx, request)
if err != nil {
    if errors.Is(err, context.DeadlineExceeded) {
        log.Println("Request timed out")
    }
}
```

### Polling for Completion

```go
func waitForCompletion(ctx context.Context, client *turbodocx.Client, documentID string) ([]byte, error) {
    ticker := time.NewTicker(30 * time.Second)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return nil, ctx.Err()
        case <-ticker.C:
            status, err := client.TurboSign.GetStatus(ctx, documentID)
            if err != nil {
                return nil, err
            }

            switch status.Status {
            case "completed":
                return client.TurboSign.Download(ctx, documentID)
            case "voided":
                return nil, errors.New("document was voided")
            }
        }
    }
}
```

### With HTTP Handler

```go
func sendContractHandler(w http.ResponseWriter, r *http.Request) {
    client := turbodocx.NewClient(os.Getenv("TURBODOCX_API_KEY"))

    var req struct {
        PDFUrl     string               `json:"pdfUrl"`
        Recipients []turbodocx.Recipient `json:"recipients"`
        Fields     []turbodocx.Field     `json:"fields"`
    }
    json.NewDecoder(r.Body).Decode(&req)

    result, err := client.TurboSign.PrepareForSigningSingle(r.Context(), &turbodocx.PrepareForSigningRequest{
        FileLink:   req.PDFUrl,
        Recipients: req.Recipients,
        Fields:     req.Fields,
    })
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    json.NewEncoder(w).Encode(map[string]string{
        "documentId": result.DocumentID,
    })
}
```

---

## Local Testing

The SDK includes a comprehensive manual test program to verify all functionality locally.

### Running Manual Tests

```bash
# Navigate to the SDK directory
cd packages/go-sdk

# Run the manual test program
go run cmd/manual/main.go
```

### What It Tests

The `cmd/manual/main.go` program tests all SDK methods:
- ✅ `PrepareForReview()` - Document upload for review
- ✅ `PrepareForSigningSingle()` - Send for signature
- ✅ `GetStatus()` - Check document status
- ✅ `Download()` - Download signed document
- ✅ `Void()` - Cancel signature request
- ✅ `Resend()` - Resend signature emails

### Configuration

Before running, update the hardcoded values in `cmd/manual/main.go`:
- `apiKey` - Your TurboDocx API key
- `baseURL` - API endpoint (default: `http://localhost:3000`)
- `orgID` - Your organization UUID
- `testFilePath` - Path to a test PDF/DOCX file
- `testEmail` - Email address for testing

### Expected Output

The test program will:
1. Upload a test document
2. Send it for signature
3. Check the status
4. Test void and resend operations
5. Print results for each operation

---

## Error Handling

```go
result, err := client.TurboSign.GetStatus(ctx, "invalid-id")
if err != nil {
    var apiErr *turbodocx.APIError
    if errors.As(err, &apiErr) {
        fmt.Printf("Status: %d\n", apiErr.StatusCode)
        fmt.Printf("Message: %s\n", apiErr.Message)
        fmt.Printf("Code: %s\n", apiErr.Code)
    } else {
        fmt.Printf("Unexpected error: %v\n", err)
    }
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

- Go 1.21+

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
