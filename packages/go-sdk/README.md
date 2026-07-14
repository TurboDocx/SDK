[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/go-sdk/banner.png)](https://www.turbodocx.com)

<div align="center">

# turbodocx-sdk

**Official Go SDK for TurboDocx**

The most developer-friendly **DocuSign & PandaDoc alternative** for **e-signatures**, **document generation**, and **partner management**. Send documents for signature, automate document workflows, and manage partner organizations programmatically.

[![Go Reference](https://pkg.go.dev/badge/github.com/turbodocx/sdk.svg)](https://pkg.go.dev/github.com/turbodocx/sdk)
[![Go Report Card](https://goreportcard.com/badge/github.com/turbodocx/sdk)](https://goreportcard.com/report/github.com/turbodocx/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-agentskills.io-8A2BE2)](https://agentskills.io)
[![Quickstart Skill](https://skills.sh/b/TurboDocx/quickstart)](https://github.com/TurboDocx/quickstart)

[Documentation](https://docs.turbodocx.com/docs) • [API Reference](https://docs.turbodocx.com/docs/SDKs/) • [Examples](#examples) • [Discord](https://discord.gg/NYKwz4BcpX)

</div>

---

## ⚡ Skip the boilerplate — let an agent scaffold it for you

Have an AI coding agent (Claude Code, Cursor, Copilot, Codex, Gemini CLI, OpenCode) install this SDK, configure your env, write working route handlers, and wire them into your app:

```bash
npx skills add TurboDocx/quickstart
```

Then run `/turbodocx-sdk` inside your agent — or one of the focused shortcuts:

| Shortcut | What it scaffolds |
|---|---|
| `/turbodocx-sdk turbosign` | Send documents for e-signature, check status, download signed PDF |
| `/turbodocx-sdk deliverable` | Generate documents from templates with variable substitution |
| `/turbodocx-sdk turbopartner` | Provision and manage customer organizations (partner accounts) |
| `/turbodocx-sdk turbowebhooks` | Subscribe to `signature.document.completed` events + verify HMAC |
| `/turbodocx-sdk turboquote` | Create and send quotes, manage products, price books, and bundles |

The skill auto-detects your framework (net/http, Gin, Echo, Fiber, …) and follows your existing project conventions. Source: [github.com/TurboDocx/quickstart](https://github.com/TurboDocx/quickstart).

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
- 🏢 **TurboPartner** — Full partner portal API for managing organizations, users, API keys, and entitlements

---

## Installation

```bash
go get github.com/turbodocx/sdk
```

---

## Install via AI Agent Skill

Let an AI coding agent set up this SDK for you with the [TurboDocx Quickstart Agent Skill](https://github.com/TurboDocx/quickstart):

```bash
npx skills add TurboDocx/quickstart
```

Works with Claude Code, GitHub Copilot, Cursor, OpenCode, and other AI coding agents. The skill detects your language, installs the package, and generates working integration code.

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
})

// With OAuth2 access token (alternative to API key)
client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
    AccessToken: os.Getenv("TURBODOCX_ACCESS_TOKEN"),  // Use instead of APIKey
    OrgID:       os.Getenv("TURBODOCX_ORG_ID"),
    SenderEmail: os.Getenv("TURBODOCX_SENDER_EMAIL"),
    SenderName:  os.Getenv("TURBODOCX_SENDER_NAME"),
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

### TurboPartner

TurboPartner provides partner portal API access for managing organizations, users, API keys, and entitlements. It uses a separate client with partner-level authentication.

#### Configuration

```go
partner, err := turbodocx.NewPartnerClient(turbodocx.PartnerConfig{
    PartnerAPIKey: os.Getenv("TURBODOCX_PARTNER_API_KEY"), // REQUIRED (TDXP-* prefix)
    PartnerID:     os.Getenv("TURBODOCX_PARTNER_ID"),      // REQUIRED
})
```

**Environment Variables:**

```bash
export TURBODOCX_PARTNER_API_KEY=TDXP-your-partner-key
export TURBODOCX_PARTNER_ID=your-partner-uuid
```

#### Organization Management

```go
// Create organization with entitlements
org, err := partner.CreateOrganization(ctx, &turbodocx.CreateOrganizationRequest{
    Name: "Acme Corp",
    Features: &turbodocx.Features{
        MaxUsers:    turbodocx.IntPtr(25),
        MaxStorage:  turbodocx.Int64Ptr(5 * 1024 * 1024 * 1024), // 5 GB
        HasTDAI:     turbodocx.BoolPtr(true),
    },
})

// List organizations
orgs, err := partner.ListOrganizations(ctx, &turbodocx.ListOrganizationsRequest{
    Limit:  turbodocx.IntPtr(10),
    Search: "acme",
})

// Get full details (includes features + usage tracking)
details, err := partner.GetOrganizationDetails(ctx, orgID)

// Update organization name
updated, err := partner.UpdateOrganizationInfo(ctx, orgID, &turbodocx.UpdateOrganizationRequest{
    Name: "Acme Corporation",
})

// Update entitlements
entitlements, err := partner.UpdateOrganizationEntitlements(ctx, orgID, &turbodocx.UpdateEntitlementsRequest{
    Features: &turbodocx.Features{
        MaxUsers:      turbodocx.IntPtr(50),
        MaxSignatures: turbodocx.IntPtr(1000),
    },
})

// Delete organization
_, err := partner.DeleteOrganization(ctx, orgID)
```

#### Organization User Management

> **Org roles are not partner roles.** Organization users and organization API keys accept
> `admin`, `contributor`, `user`, or `viewer`. Partner portal users use a *different* enum:
> `admin`, `member`, or `viewer`. `member` is not a valid organization role, and
> `contributor` / `user` are not valid partner roles — mixing them returns a 400.

```go
// Add user to organization — role: admin | contributor | user | viewer
user, err := partner.AddUserToOrganization(ctx, orgID, &turbodocx.AddOrgUserRequest{
    Email: "admin@acme.com",
    Role:  "admin",
})

// List users
users, err := partner.ListOrganizationUsers(ctx, orgID, nil)

// Update user role
_, err := partner.UpdateOrganizationUserRole(ctx, orgID, userID, &turbodocx.UpdateOrgUserRequest{
    Role: "contributor",
})

// Remove user
_, err := partner.RemoveUserFromOrganization(ctx, orgID, userID)

// Resend invitation
_, err := partner.ResendOrganizationInvitationToUser(ctx, orgID, userID)
```

#### Organization API Key Management

```go
// Create API key — role: admin | contributor | user | viewer (same enum as org users)
key, err := partner.CreateOrganizationAPIKey(ctx, orgID, &turbodocx.CreateOrgAPIKeyRequest{
    Name: "Production Key",
    Role: "admin",
})
fmt.Printf("API Key: %s\n", key.Data.Key)

// List API keys
keys, err := partner.ListOrganizationAPIKeys(ctx, orgID, nil)

// Update API key
_, err := partner.UpdateOrganizationAPIKey(ctx, orgID, keyID, &turbodocx.UpdateOrgAPIKeyRequest{
    Name: "Updated Key Name",
})

// Revoke API key
_, err := partner.RevokeOrganizationAPIKey(ctx, orgID, keyID)
```

#### Partner API Key Management

```go
// Create scoped partner API key
key, err := partner.CreatePartnerAPIKey(ctx, &turbodocx.CreatePartnerAPIKeyRequest{
    Name:        "Monitoring Key",
    Description: "Read-only access for dashboard",
    Scopes:      []string{turbodocx.ScopeOrgRead, turbodocx.ScopeAuditRead},
})

// List partner API keys
keys, err := partner.ListPartnerAPIKeys(ctx, nil)

// Update partner API key
_, err := partner.UpdatePartnerAPIKey(ctx, keyID, &turbodocx.UpdatePartnerAPIKeyRequest{
    Name:   "Updated Key",
    Scopes: []string{turbodocx.ScopeOrgRead, turbodocx.ScopeOrgUpdate},
})

// Revoke partner API key
_, err := partner.RevokePartnerAPIKey(ctx, keyID)
```

#### Partner User Management

> **All 7 permission keys are required.** The API rejects a partial `permissions` object with a 400 —
> there is no partial update. `PartnerPermissions` is a plain struct, so every key is always sent
> (omitted fields serialize as `false`); set each one explicitly so the grant is unambiguous.

```go
// Add partner portal user — role: admin | member | viewer
user, err := partner.AddUserToPartnerPortal(ctx, &turbodocx.AddPartnerUserRequest{
    Email: "ops@yourcompany.com",
    Role:  "member",
    Permissions: turbodocx.PartnerPermissions{
        CanManageOrgs:           true,
        CanManageOrgUsers:       true,
        CanManagePartnerUsers:   false,
        CanManageOrgAPIKeys:     false,
        CanManagePartnerAPIKeys: false,
        CanUpdateEntitlements:   false,
        CanViewAuditLogs:        true,
    },
})

// List partner users
users, err := partner.ListPartnerPortalUsers(ctx, nil)

// Update permissions
_, err := partner.UpdatePartnerUserPermissions(ctx, userID, &turbodocx.UpdatePartnerUserRequest{
    Role: "admin",
    Permissions: &turbodocx.PartnerPermissions{
        CanManageOrgs:          true,
        CanManageOrgUsers:      true,
        CanManagePartnerUsers:  true,
        CanManageOrgAPIKeys:    true,
        CanManagePartnerAPIKeys: true,
        CanUpdateEntitlements:  true,
        CanViewAuditLogs:       true,
    },
})

// Remove partner user
_, err := partner.RemoveUserFromPartnerPortal(ctx, userID)

// Resend invitation
_, err := partner.ResendPartnerPortalInvitationToUser(ctx, userID)
```

#### Audit Logs

```go
// Get recent audit logs
logs, err := partner.GetPartnerAuditLogs(ctx, &turbodocx.ListAuditLogsRequest{
    Limit: turbodocx.IntPtr(50),
})

// Filter by action and date range
logs, err := partner.GetPartnerAuditLogs(ctx, &turbodocx.ListAuditLogsRequest{
    Action:       "org:create",
    ResourceType: "organization",
    StartDate:    "2024-01-01",
    EndDate:      "2024-12-31",
    Success:      turbodocx.BoolPtr(true),
})
```

#### Available Scopes

| Scope | Description |
|:------|:------------|
| `org:create` | Create organizations |
| `org:read` | View organizations |
| `org:update` | Update organizations |
| `org:delete` | Delete organizations |
| `entitlements:update` | Update organization entitlements |
| `org-users:create` | Add users to organizations |
| `org-users:read` | View organization users |
| `org-users:update` | Update organization users |
| `org-users:delete` | Remove organization users |
| `org-apikeys:create` | Create organization API keys |
| `org-apikeys:read` | View organization API keys |
| `org-apikeys:update` | Update organization API keys |
| `org-apikeys:delete` | Revoke organization API keys |
| `partner-apikeys:create` | Create partner API keys |
| `partner-apikeys:read` | View partner API keys |
| `partner-apikeys:update` | Update partner API keys |
| `partner-apikeys:delete` | Revoke partner API keys |
| `partner-users:create` | Add partner portal users |
| `partner-users:read` | View partner portal users |
| `partner-users:update` | Update partner portal users |
| `partner-users:delete` | Remove partner portal users |
| `audit:read` | View audit logs |

---

### TurboWebhooks (Signature Webhook)

The `WebhooksClient` manages your organization's **signature webhook** — a single subscription to TurboDocx signature events (`signature.document.completed`, `signature.document.voided`). The package also exposes `VerifyWebhookSignature` for incoming webhook receivers.

> **One webhook per org.** The SDK manages a single fixed-name webhook (`signature`) per org so SDK-managed and UI-managed webhooks stay in sync — what you create here also appears in the dashboard's Signature Webhooks settings page. To manage multiple webhooks per org, call the REST API directly.
>
> **Requires administrator role.** All webhook routes require an admin TDX- API key.

#### Configuration

```go
import turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"

client, err := turbodocx.NewWebhooksClientWithConfig(turbodocx.ClientConfig{
    APIKey:  os.Getenv("TURBODOCX_API_KEY"),
    OrgID:   os.Getenv("TURBODOCX_ORG_ID"),
    // BaseURL: "http://localhost:3000", // optional; defaults to https://api.turbodocx.com
})
if err != nil {
    log.Fatal(err)
}
```

Unlike the main `NewClientWithConfig`, this constructor does NOT require `SenderEmail` — webhook routes don't send signature emails.

#### Create the signature webhook (save the secret immediately)

```go
ctx := context.Background()
created, err := client.CreateWebhook(ctx, turbodocx.CreateWebhookRequest{
    URLs:   []string{"https://your-server.example.com/webhooks/turbodocx"}, // HTTPS only; 1-10 URLs
    Events: []string{"signature.document.completed", "signature.document.voided"}, // at least 1
})
// `created.Secret` is shown ONCE here. Store it securely.
fmt.Println("Save this secret:", created.Secret)
```

`URLs` accepts **1 to 10** HTTPS endpoints and `Events` requires **at least 1** event. Empty lists return a 400.

#### Get, update, delete

```go
webhook, err := client.GetWebhook(ctx)
// webhook["deliveryStats"] and webhook["availableEvents"] are included

isActive := false
client.UpdateWebhook(ctx, turbodocx.UpdateWebhookRequest{IsActive: &isActive})

client.DeleteWebhook(ctx)
```

`UpdateWebhook` patches only the fields you set. The `URLs` / `Events` minimums still apply on update —
leave a field nil to keep it unchanged. An empty list is not a "clear": it cannot be used to remove all
URLs or events.

#### Test deliveries and replay

```go
tested, _ := client.TestWebhook(ctx, turbodocx.TestWebhookRequest{
    EventType: "signature.document.completed",
    Payload:   map[string]interface{}{"documentId": "doc-xyz", "status": "completed"},
})

deliveries, _ := client.ListWebhookDeliveries(ctx, turbodocx.ListDeliveriesRequest{})
results := deliveries["results"].([]interface{})
firstID := results[0].(map[string]interface{})["id"].(string)
replayed, _ := client.ReplayWebhookDelivery(ctx, firstID)
```

#### Rotate the secret

```go
rotated, _ := client.RegenerateWebhookSecret(ctx)
// rotated["secret"] is the new secret. Old signatures will fail immediately.
```

#### Aggregate stats

```go
stats, _ := client.GetWebhookStats(ctx, 30) // last 30 days
// stats["summary"], stats["eventBreakdown"]
```

#### Verify incoming webhook signatures (`net/http` example)

Webhook deliveries from TurboDocx are signed with HMAC-SHA256 over `timestamp + "." + rawBody` using your webhook secret. Use `VerifyWebhookSignature` in your receiver:

```go
import (
    "io"
    "net/http"
    "os"

    turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
)

func webhookHandler(w http.ResponseWriter, r *http.Request) {
    rawBody, err := io.ReadAll(r.Body) // raw bytes; do NOT parse JSON first
    if err != nil {
        http.Error(w, "bad body", http.StatusBadRequest)
        return
    }
    signature := r.Header.Get("X-TurboDocx-Signature")
    timestamp := r.Header.Get("X-TurboDocx-Timestamp")
    secret := os.Getenv("TURBODOCX_WEBHOOK_SECRET")

    if !turbodocx.VerifyWebhookSignature(rawBody, signature, timestamp, secret, nil) {
        http.Error(w, "invalid signature", http.StatusUnauthorized)
        return
    }

    // Now safe to parse and process
    w.WriteHeader(http.StatusOK)
}
```

By default the helper enforces a 300-second timestamp tolerance to prevent replay attacks. Override via `&turbodocx.VerifyWebhookSignatureOptions{ToleranceSeconds: N}` (a negative value disables the check — not recommended in production).

---

### TurboQuote (CPQ — Configure, Price, Quote)

The `QuoteClient` manages your organization's **quoting workflow** — companies, contacts, products, bundles, price books, and quotes. Create quotes, attach line items, apply price-book discounts, and send to prospects.

#### Configuration

```go
import turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"

client, err := turbodocx.NewQuoteClient(turbodocx.QuoteClientConfig{
    APIKey: os.Getenv("TURBODOCX_API_KEY"),
    OrgID:  os.Getenv("TURBODOCX_ORG_ID"),
    // BaseURL: "http://localhost:3000", // optional; defaults to https://api.turbodocx.com
})
if err != nil {
    log.Fatal(err)
}
```

No `SenderEmail` required — quote operations do not send signature emails.

#### Method Groups

| Group | Methods |
|---|---|
| **Quotes** | `ListQuotes`, `CreateQuote`, `GetQuote`, `UpdateQuote`, `DeleteQuote`, `DuplicateQuote`, `DownloadQuotePdf` |
| **Quote status** | `SendQuote`, `SendQuoteWithDeliverable`, `DeclineQuote`, `VoidQuote`, `HandleExpiredQuote` (void/decline an expired quote and reissue it) |
| **Price book application** | `ApplyPriceBook`, `RemovePriceBook` |
| **Line items** | `ListLineItems`, `AddLineItems`, `AddBundleLineItems`, `UpdateLineItem`, `RemoveLineItem` |
| **Products** | `ListProducts`, `CreateProduct`, `GetProduct`, `UpdateProduct`, `DeleteProduct`, `DuplicateProduct`, `GetProductPrimaryImages` |
| **Price books** | `ListPriceBooks`, `CreatePriceBook`, `GetPriceBook`, `UpdatePriceBook`, `DeletePriceBook`, `DuplicatePriceBook`, `ListPriceBookProducts` |
| **Bundles** | `ListBundles`, `CreateBundle`, `GetBundle`, `UpdateBundle`, `DeleteBundle`, `DuplicateBundle` |
| **Companies** | `ListCompanies`, `CreateCompany`, `GetCompany`, `UpdateCompany`, `DeleteCompany`, `ListCompanyContacts` |
| **Contacts** | `ListContacts`, `CreateContact`, `UpdateContact`, `DeleteContact` |
| **Templates** | `ListTemplates`, `GetTemplate`, `GetTemplateByID`, `CreateTemplate`, `UpdateTemplate`, `DeleteTemplate` |
| **Types/categories** | `ListTypes`, `CreateType`, `UpdateType`, `DeleteType` |
| **Convenience** | `CreateAndSend` |

#### Create a quote and add line items

```go
ctx := context.Background()

// Create the quote (TermDays defaults to 60 when omitted)
quote, err := client.CreateQuote(ctx, &turbodocx.CreateQuoteRequest{
    Name:      "Acme Annual Subscription",
    CompanyID: companyID,
    ContactID: contactID,
})
if err != nil {
    log.Fatal(err)
}

// Add product line items (variadic — pass one or many, max 50 per call).
// ProductName, UnitPrice and BillingFrequency are required. ProductID is a required
// key too, but its value may be nil — that marks an ad-hoc item with no catalog product.
qty := 3
items, err := client.AddLineItems(ctx, quote.ID, turbodocx.AddLineItemRequest{
    ProductID:        nil, // or &productID to link a catalog product
    ProductName:      "Professional License",
    UnitPrice:        499.00,
    BillingFrequency: "annual",
    Quantity:         &qty,
})
```

#### Quote terms and auto-renewal

`TermDays` is optional and **defaults to 60** (max 3650). The special value `-1` means auto-renewal.
`RenewalPeriod` is coupled to it:

- `TermDays: -1` → `RenewalPeriod` is **required** (`weekly`, `monthly`, `quarterly`, or `annually`)
- any other `TermDays` → `RenewalPeriod` must be **omitted**; sending it returns a 400

```go
termDays := -1
renewal := "annually"
quote, err := client.CreateQuote(ctx, &turbodocx.CreateQuoteRequest{
    Name:          "Auto-Renewing Subscription",
    CompanyID:     companyID,
    ContactID:     contactID,
    TermDays:      &termDays,
    RenewalPeriod: &renewal,
})
```

#### Resolve an expired quote

`HandleExpiredQuote` closes out a sent quote whose `validUntil` has passed — it voids or declines the
original and returns a duplicate carrying the new `validUntil` date.

The only valid actions are **`void`** and **`decline`**; there is no "extend" or "re-send" action.
`Action`, `Reason`, and `NewValidUntil` are **all three required**.

```go
reissued, err := client.HandleExpiredQuote(ctx, quote.ID, &turbodocx.HandleExpiredQuoteRequest{
    Action:        "void",                                  // "void" or "decline" — nothing else
    Reason:        "Pricing refreshed for the new term",    // required, max 190 chars
    NewValidUntil: time.Now().AddDate(0, 0, 30).Format("2006-01-02"), // required
})
```

#### Apply a price book and download the PDF

```go
// Apply an existing price book to get discounted pricing
applyResp, err := client.ApplyPriceBook(ctx, quote.ID, priceBookID)
fmt.Printf("Updated %d items, skipped %d\n", applyResp.UpdatedCount, applyResp.SkippedCount)

// Download as PDF
pdf, err := client.DownloadQuotePdf(ctx, quote.ID)
if err == nil {
    os.WriteFile("quote.pdf", pdf, 0600)
}
```

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
    Success    bool              `json:"success"`
    DocumentID string            `json:"documentId"`
    Status     string            `json:"status"`
    Message    string            `json:"message"`
    Recipients []ReviewRecipient `json:"recipients,omitempty"`
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

For complete, working examples see the [`examples/`](./examples/) directory:

**TurboSign:**
- [`turbosign_send_simple.go`](./examples/turbosign_send_simple.go) - Send document directly with template anchors
- [`turbosign_basic.go`](./examples/turbosign_basic.go) - Create review link first, then send manually
- [`turbosign_advanced.go`](./examples/turbosign_advanced.go) - Advanced field types (checkbox, readonly, multiline text, etc.)

**TurboPartner:**
- [`turbopartner_basic.go`](./examples/turbopartner_basic.go) - Full organization lifecycle (create, users, API keys)
- [`turbopartner_api_keys.go`](./examples/turbopartner_api_keys.go) - Partner API keys, portal users, and audit logs

**TurboQuote:**
- [`turboquote_basic.go`](./examples/turboquote_basic.go) - Full quote lifecycle (company, contact, quote, line items, PDF download)
- [`turboquote_products.go`](./examples/turboquote_products.go) - Product catalog and bundle management
- [`turboquote_pricebooks.go`](./examples/turboquote_pricebooks.go) - Price book CRUD and apply to quote

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
