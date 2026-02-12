[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/go-sdk/banner.png)](https://www.turbodocx.com)

<div align="center">

# turbodocx-sdk

**Official Go SDK for TurboDocx**

The most developer-friendly **DocuSign & PandaDoc alternative** for **e-signatures** and **document generation**. Send documents for signature and automate document workflows programmatically.

[![Go Reference](https://pkg.go.dev/badge/github.com/turbodocx/sdk.svg)](https://pkg.go.dev/github.com/turbodocx/sdk)
[![Go Report Card](https://goreportcard.com/badge/github.com/turbodocx/sdk)](https://goreportcard.com/report/github.com/turbodocx/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[Documentation](https://docs.turbodocx.com/docs) • [API Reference](https://docs.turbodocx.com/docs/SDKs/) • [Examples](#examples) • [Discord](https://discord.gg/NYKwz4BcpX)

</div>

---

## Why TurboDocx?

A modern, developer-first alternative to legacy e-signature platforms:

| Looking for... | TurboDocx offers |
|----------------|------------------|
| DocuSign API alternative | Simple REST API, transparent pricing |
| PandaDoc alternative | Document generation + e-signatures in one SDK |
| HelloSign/Dropbox Sign alternative | Full API access, modern DX |
| Adobe Sign alternative | Quick integration, developer-friendly docs |
| SignNow alternative | Predictable costs, responsive support |
| Documint alternative | DOCX/PDF generation from templates |
| WebMerge alternative | Data-driven document automation |

**Other platforms we compare to:** SignRequest, SignEasy, Zoho Sign, Eversign, SignWell, Formstack Documents

### TurboDocx Ecosystem

| Package | Description |
|---------|-------------|
| [@turbodocx/html-to-docx](https://github.com/turbodocx/html-to-docx) | Convert HTML to DOCX - fastest JS library |
| [@turbodocx/n8n-nodes-turbodocx](https://github.com/turbodocx/n8n-nodes-turbodocx) | n8n community nodes for TurboDocx |
| [TurboDocx Writer](https://appsource.microsoft.com/product/office/WA200007397) | Microsoft Word add-in |

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
    // 1. Create client with configuration
    client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
        APIKey:      os.Getenv("TURBODOCX_API_KEY"),      // REQUIRED
        OrgID:       os.Getenv("TURBODOCX_ORG_ID"),       // REQUIRED
        SenderEmail: os.Getenv("TURBODOCX_SENDER_EMAIL"), // REQUIRED for TurboSign operations
        SenderName:  os.Getenv("TURBODOCX_SENDER_NAME"),  // OPTIONAL (but recommended for TurboSign)
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
                Template: &turbodocx.TemplateAnchor{
                    Anchor:    "{signature1}",
                    Placement: "replace",
                    Size:      &turbodocx.Size{Width: 100, Height: 30},
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
// Basic client configuration
client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
    APIKey:      "your-api-key",      // REQUIRED
    OrgID:       "your-org-id",       // REQUIRED
    SenderEmail: "you@company.com",   // REQUIRED for TurboSign operations
    SenderName:  "Your Company",      // OPTIONAL (recommended for TurboSign)
})

// For TurboTemplate only (no SenderEmail needed)
client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
    APIKey: os.Getenv("TURBODOCX_API_KEY"),
    OrgID:  os.Getenv("TURBODOCX_ORG_ID"),
})

// With environment variables (recommended for TurboSign)
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
})

// With OAuth2 access token (alternative to API key)
client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
    AccessToken: os.Getenv("TURBODOCX_ACCESS_TOKEN"),  // Use instead of APIKey
    OrgID:       os.Getenv("TURBODOCX_ORG_ID"),
    SenderEmail: os.Getenv("TURBODOCX_SENDER_EMAIL"),
    SenderName:  os.Getenv("TURBODOCX_SENDER_NAME"),
})
```

**Important:** `SenderEmail` is **REQUIRED for TurboSign operations**. This email will be used as the reply-to address for signature request emails. For TurboTemplate-only usage, `SenderEmail` is not required. The `SenderName` is optional but strongly recommended for a professional appearance in signature emails.

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

#### `CreateSignatureReviewLink`

Upload a document for review without sending signature emails.

```go
result, err := client.TurboSign.CreateSignatureReviewLink(ctx, &turbodocx.CreateSignatureReviewLinkRequest{
    FileLink: "https://example.com/contract.pdf",
    Recipients: []turbodocx.Recipient{
        {Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
    },
    Fields: []turbodocx.Field{
        {Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
    },
    DocumentName: "Service Agreement",       // Optional
    SenderName:   "Acme Corp",               // Optional
    SenderEmail:  "contracts@acme.com",      // Optional
})

fmt.Printf("Preview URL: %s\n", result.PreviewURL)
fmt.Printf("Document ID: %s\n", result.DocumentID)
```

#### `SendSignature`

Upload a document and immediately send signature request emails.

```go
result, err := client.TurboSign.SendSignature(ctx, &turbodocx.SendSignatureRequest{
    FileLink: "https://example.com/contract.pdf",
    Recipients: []turbodocx.Recipient{
        {Name: "Alice", Email: "alice@example.com", SigningOrder: 1},
        {Name: "Bob", Email: "bob@example.com", SigningOrder: 2},
    },
    Fields: []turbodocx.Field{
        {Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "alice@example.com"},
        {Type: "signature", Page: 1, X: 100, Y: 600, Width: 200, Height: 50, RecipientEmail: "bob@example.com"},
    },
})

fmt.Printf("Document ID: %s\n", result.DocumentID)
fmt.Printf("Message: %s\n", result.Message)
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

#### `VoidDocument`

Cancel a signature request.

```go
result, err := client.TurboSign.VoidDocument(ctx, "doc-uuid-here", "Contract terms changed")

fmt.Printf("Document %s voided at %s\n", result.ID, result.VoidedAt)
```

#### `ResendEmail`

Resend signature request emails.

```go
result, err := client.TurboSign.ResendEmail(ctx, "doc-uuid-here", []string{"recipient-uuid-1"})

fmt.Printf("Resent to %d recipients\n", result.RecipientCount)
```

#### `GetAuditTrail`

Get the complete audit trail for a document, including all events and timestamps.

```go
audit, err := client.TurboSign.GetAuditTrail(ctx, "doc-uuid-here")
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Document: %s\n", audit.Document.Name)

for _, entry := range audit.AuditTrail {
    fmt.Printf("%s - %s\n", entry.ActionType, entry.Timestamp)
    if entry.User != nil {
        fmt.Printf("  By: %s (%s)\n", entry.User.Name, entry.User.Email)
    }
    if entry.Recipient != nil {
        fmt.Printf("  Recipient: %s\n", entry.Recipient.Name)
    }
}
```

The audit trail includes a cryptographic hash chain for tamper-evidence verification.

---

### TurboTemplate

Generate documents from templates with advanced variable substitution.

#### `TurboTemplate.Generate`

Generate a document from a template with variables.

```go
result, err := client.TurboTemplate.Generate(ctx, &turbodocx.GenerateTemplateRequest{
    TemplateID: "your-template-uuid",
    Name:       stringPtr("Generated Contract"),
    Description: stringPtr("Contract for Q4 2024"),
    Variables: []turbodocx.TemplateVariable{
        {Placeholder: "{customer_name}", Name: "customer_name", Value: "Acme Corp", MimeType: turbodocx.MimeTypeText},
        {Placeholder: "{contract_date}", Name: "contract_date", Value: "2024-01-15", MimeType: turbodocx.MimeTypeText},
        {Placeholder: "{total_amount}", Name: "total_amount", Value: 50000, MimeType: turbodocx.MimeTypeText},
    },
})

fmt.Printf("Document ID: %s\n", *result.ID)
```

#### Helper Functions

Use helper functions for cleaner variable creation:

```go
// Helper functions return (TemplateVariable, error) - use must() helper for cleaner code
must := func(v turbodocx.TemplateVariable, err error) turbodocx.TemplateVariable {
    if err != nil { panic(err) }
    return v
}

result, err := client.TurboTemplate.Generate(ctx, &turbodocx.GenerateTemplateRequest{
    TemplateID: "invoice-template-uuid",
    Name:       stringPtr("Invoice #1234"),
    Description: stringPtr("Monthly invoice"),
    Variables: []turbodocx.TemplateVariable{
        // Simple text/number variables (placeholder, name, value, mimeType)
        must(turbodocx.NewSimpleVariable("{invoice_number}", "invoice_number", "INV-2024-001", turbodocx.MimeTypeText)),
        must(turbodocx.NewSimpleVariable("{total}", "total", 1500, turbodocx.MimeTypeText)),

        // Advanced engine variable (placeholder, name, value) - for nested objects with dot notation
        must(turbodocx.NewAdvancedEngineVariable("{customer}", "customer", map[string]interface{}{
            "name":  "Acme Corp",
            "email": "billing@acme.com",
            "address": map[string]interface{}{
                "street": "123 Main St",
                "city":   "New York",
                "state":  "NY",
            },
        })),

        // Arrays for loops (placeholder, name, value) - use {#items}...{/items} in template
        must(turbodocx.NewLoopVariable("{items}", "items", []interface{}{
            map[string]interface{}{"name": "Widget A", "quantity": 5, "price": 100},
            map[string]interface{}{"name": "Widget B", "quantity": 3, "price": 200},
        })),

        // Conditionals (placeholder, name, value) - use {#is_premium}...{/is_premium} in template
        must(turbodocx.NewConditionalVariable("{is_premium}", "is_premium", true)),

        // Images (placeholder, name, imageURL)
        must(turbodocx.NewImageVariable("{logo}", "logo", "https://example.com/logo.png")),
    },
})
```

#### Advanced Templating Features

TurboTemplate supports Angular-like expressions:

| Feature | Template Syntax | Example |
|:--------|:----------------|:--------|
| Simple substitution | `{variable}` | `{customer_name}` |
| Nested objects | `{object.property}` | `{user.address.city}` |
| Loops | `{#array}...{/array}` | `{#items}{name}: ${price}{/items}` |
| Conditionals | `{#condition}...{/condition}` | `{#is_premium}Premium Member{/is_premium}` |
| Expressions | `{expression}` | `{price * quantity}` |

#### Variable Configuration

| Field | Type | Required | Description |
|:------|:-----|:---------|:------------|
| `Placeholder` | string | Yes | The placeholder in template (e.g., `{name}`) |
| `Name` | string | Yes | Variable name for the templating engine |
| `Value` | interface{} | Yes* | The value to substitute |
| `MimeType` | VariableMimeType | Yes | `MimeTypeText`, `MimeTypeJSON`, `MimeTypeHTML`, `MimeTypeImage`, `MimeTypeMarkdown` |
| `UsesAdvancedTemplatingEngine` | *bool | No | Enable for loops, conditionals, expressions |

*Either `Value` or `Text` must be provided.

---

## Field Types

| Type | Description |
|:-----|:------------|
| `signature` | Signature field (draw or type) |
| `initials` | Initials field |
| `text` | Free-form text input |
| `date` | Date stamp |
| `checkbox` | Checkbox / agreement |
| `full_name` | Full name |
| `first_name` | First name |
| `last_name` | Last name |
| `email` | Email address |
| `title` | Job title |
| `company` | Company name |

---

## Type Reference

### Core Types

#### `Recipient`

```go
type Recipient struct {
    Name         string `json:"name"`
    Email        string `json:"email"`
    SigningOrder int    `json:"signingOrder"`
}
```

#### `Field`

```go
type Field struct {
    Type            string          `json:"type"`                      // signature, initials, text, date, checkbox
    Page            int             `json:"page,omitempty"`            // Page number (1-indexed)
    X               int             `json:"x,omitempty"`               // X coordinate
    Y               int             `json:"y,omitempty"`               // Y coordinate
    Width           int             `json:"width,omitempty"`           // Field width
    Height          int             `json:"height,omitempty"`          // Field height
    RecipientEmail  string          `json:"recipientEmail"`            // Email of the recipient who fills this field
    DefaultValue    string          `json:"defaultValue,omitempty"`    // Pre-filled value (text fields)
    IsMultiline     bool            `json:"isMultiline,omitempty"`     // Allow multiple lines (text fields)
    IsReadonly      bool            `json:"isReadonly,omitempty"`      // Read-only field
    Required        bool            `json:"required,omitempty"`        // Field is required
    BackgroundColor string          `json:"backgroundColor,omitempty"` // Background color (hex)
    Template        *TemplateAnchor `json:"template,omitempty"`        // Template anchor for dynamic positioning
}
```

#### `TemplateAnchor`

Use template anchors for dynamic field positioning based on text in the document:

```go
type TemplateAnchor struct {
    Anchor        string `json:"anchor,omitempty"`        // Text to search for
    SearchText    string `json:"searchText,omitempty"`    // Alternative to Anchor
    Placement     string `json:"placement,omitempty"`     // replace, before, after, above, below
    Size          *Size  `json:"size,omitempty"`          // Field dimensions
    Offset        *Point `json:"offset,omitempty"`        // Offset from anchor position
    CaseSensitive bool   `json:"caseSensitive,omitempty"` // Case-sensitive search
    UseRegex      bool   `json:"useRegex,omitempty"`      // Use regex for search
}
```

#### `Size` and `Point`

```go
type Size struct {
    Width  int `json:"width"`
    Height int `json:"height"`
}

type Point struct {
    X int `json:"x"`
    Y int `json:"y"`
}
```

### Alternative File Sources

Instead of providing `File` bytes, you can use these alternative file sources:

```go
// From URL
request := &turbodocx.SendSignatureRequest{
    FileLink: "https://example.com/contract.pdf",
    // ...
}

// From TurboDocx Deliverable
request := &turbodocx.SendSignatureRequest{
    DeliverableID: "deliverable-uuid",
    // ...
}

// From TurboDocx Template
request := &turbodocx.SendSignatureRequest{
    TemplateID: "template-uuid",
    // ...
}
```

### Response Types

#### `SendSignatureResponse`

```go
type SendSignatureResponse struct {
    Success    bool   `json:"success"`
    DocumentID string `json:"documentId"`
    Message    string `json:"message"`
}
```

#### `CreateSignatureReviewLinkResponse`

```go
type CreateSignatureReviewLinkResponse struct {
    Success    bool              `json:"success"`
    DocumentID string            `json:"documentId"`
    Status     string            `json:"status"`
    PreviewURL string            `json:"previewUrl,omitempty"`
    Message    string            `json:"message"`
    Recipients []ReviewRecipient `json:"recipients,omitempty"`
}

type ReviewRecipient struct {
    ID       string                 `json:"id"`
    Name     string                 `json:"name"`
    Email    string                 `json:"email"`
    Metadata map[string]interface{} `json:"metadata,omitempty"`
}
```

#### `VoidDocumentResponse`

```go
type VoidDocumentResponse struct {
    ID         string `json:"id"`
    Name       string `json:"name"`
    Status     string `json:"status"`
    VoidReason string `json:"voidReason,omitempty"`
    VoidedAt   string `json:"voidedAt,omitempty"`
}
```

#### `ResendEmailResponse`

```go
type ResendEmailResponse struct {
    Success        bool `json:"success"`
    RecipientCount int  `json:"recipientCount"`
}
```

---

## Examples

For complete, working examples including template anchors, advanced field types, and various workflows, see the [`examples/`](./examples/) directory:

- [`turbosign_send_simple.go`](./examples/turbosign_send_simple.go) - Send document directly with template anchors
- [`turbosign_basic.go`](./examples/turbosign_basic.go) - Create review link first, then send manually
- [`turbosign_advanced.go`](./examples/turbosign_advanced.go) - Advanced field types (checkbox, readonly, multiline text, etc.)

### Sequential Signing

```go
result, _ := client.TurboSign.SendSignature(ctx, &turbodocx.SendSignatureRequest{
    FileLink: "https://example.com/contract.pdf",
    Recipients: []turbodocx.Recipient{
        {Name: "Employee", Email: "employee@company.com", SigningOrder: 1},
        {Name: "Manager", Email: "manager@company.com", SigningOrder: 2},
        {Name: "HR", Email: "hr@company.com", SigningOrder: 3},
    },
    Fields: []turbodocx.Field{
        {Type: "signature", Page: 1, X: 100, Y: 400, Width: 200, Height: 50, RecipientEmail: "employee@company.com"},
        {Type: "date", Page: 1, X: 320, Y: 400, Width: 100, Height: 30, RecipientEmail: "employee@company.com"},
        {Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "manager@company.com"},
        {Type: "signature", Page: 1, X: 100, Y: 600, Width: 200, Height: 50, RecipientEmail: "hr@company.com"},
    },
})
```

### With Context Timeout

```go
ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
defer cancel()

result, err := client.TurboSign.SendSignature(ctx, request)
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
    client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
        APIKey:      os.Getenv("TURBODOCX_API_KEY"),
        OrgID:       os.Getenv("TURBODOCX_ORG_ID"),
        SenderEmail: os.Getenv("TURBODOCX_SENDER_EMAIL"),
        SenderName:  os.Getenv("TURBODOCX_SENDER_NAME"),
    })
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }

    var req struct {
        PDFUrl     string               `json:"pdfUrl"`
        Recipients []turbodocx.Recipient `json:"recipients"`
        Fields     []turbodocx.Field     `json:"fields"`
    }
    json.NewDecoder(r.Body).Decode(&req)

    result, err := client.TurboSign.SendSignature(r.Context(), &turbodocx.SendSignatureRequest{
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
- ✅ `CreateSignatureReviewLink()` - Document upload for review
- ✅ `SendSignature()` - Send for signature
- ✅ `GetStatus()` - Check document status
- ✅ `Download()` - Download signed document
- ✅ `VoidDocument()` - Cancel signature request
- ✅ `ResendEmail()` - Resend signature emails
- ✅ `GetAuditTrail()` - Get document audit trail

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

The SDK provides typed errors for different failure scenarios:

```go
result, err := client.TurboSign.GetStatus(ctx, "invalid-id")
if err != nil {
    // Check for specific error types
    var validationErr *turbodocx.ValidationError
    var authErr *turbodocx.AuthenticationError
    var notFoundErr *turbodocx.NotFoundError
    var rateLimitErr *turbodocx.RateLimitError
    var networkErr *turbodocx.NetworkError

    switch {
    case errors.As(err, &validationErr):
        fmt.Printf("Validation error: %s\n", validationErr.Message)
    case errors.As(err, &authErr):
        fmt.Printf("Authentication failed: %s\n", authErr.Message)
    case errors.As(err, &notFoundErr):
        fmt.Printf("Not found: %s\n", notFoundErr.Message)
    case errors.As(err, &rateLimitErr):
        fmt.Printf("Rate limited: %s\n", rateLimitErr.Message)
    case errors.As(err, &networkErr):
        fmt.Printf("Network error: %s\n", networkErr.Message)
    default:
        // Base error type
        var apiErr *turbodocx.TurboDocxError
        if errors.As(err, &apiErr) {
            fmt.Printf("Status: %d\n", apiErr.StatusCode)
            fmt.Printf("Message: %s\n", apiErr.Message)
            fmt.Printf("Code: %s\n", apiErr.Code)
        } else {
            fmt.Printf("Unexpected error: %v\n", err)
        }
    }
}
```

### Error Types

| Type | HTTP Status | Description |
|:-----|:------------|:------------|
| `ValidationError` | 400 | Invalid request parameters |
| `AuthenticationError` | 401 | Invalid API key or access token |
| `NotFoundError` | 404 | Document or resource not found |
| `RateLimitError` | 429 | Too many requests |
| `NetworkError` | N/A | Network or connection failure |
| `TurboDocxError` | Any | Base error type for other status codes |

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

- 📖 [Documentation](https://docs.turbodocx.com/docs)
- 💬 [Discord](https://discord.gg/NYKwz4BcpX)
- 🐛 [GitHub Issues](https://github.com/TurboDocx/SDK/issues)

---

## License

MIT — see [LICENSE](./LICENSE)

---

<div align="center">

[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/go-sdk/footer.png)](https://www.turbodocx.com)

</div>
