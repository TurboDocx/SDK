[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/js-sdk/banner.png)](https://www.turbodocx.com)

<div align="center">

# turbodocx-sdk (Ruby)

**Official Ruby SDK for TurboDocx**

The most developer-friendly **DocuSign & PandaDoc alternative** for **e-signatures** and **document generation**. Send documents for signature and automate document workflows programmatically.

[![Gem Version](https://img.shields.io/gem/v/turbodocx-sdk.svg)](https://rubygems.org/gems/turbodocx-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-agentskills.io-8A2BE2)](https://agentskills.io)
[![Quickstart Skill](https://skills.sh/b/TurboDocx/quickstart)](https://github.com/TurboDocx/quickstart)

[Documentation](https://docs.turbodocx.com/docs) • [API Reference](https://docs.turbodocx.com/docs/SDKs/) • [Examples](#examples) • [Discord](https://discord.gg/NYKwz4BcpX)

</div>

---

## Skip the boilerplate — let an agent scaffold it for you

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
| `/turbodocx-sdk turboquote` | Build and send sales quotes with line items, bundles, and price books |

The skill auto-detects your framework (Rails, Sinatra, Rack, …) and follows your existing project conventions. Source: [github.com/TurboDocx/quickstart](https://github.com/TurboDocx/quickstart).

---

## Installation

Add to your `Gemfile`:

```ruby
gem "turbodocx-sdk"
```

Then run:

```bash
bundle install
```

Or install directly:

```bash
gem install turbodocx-sdk
```

---

## Quick Start

```ruby
require "turbodocx_sdk"

# 1. Configure with your API key and sender information
TurboDocxSdk::TurboSign.configure(
  api_key:      ENV["TURBODOCX_API_KEY"],
  org_id:       ENV["TURBODOCX_ORG_ID"],
  sender_email: ENV["TURBODOCX_SENDER_EMAIL"],  # REQUIRED
  sender_name:  ENV["TURBODOCX_SENDER_NAME"]    # OPTIONAL
)

# 2. Send a document for signature
result = TurboDocxSdk::TurboSign.send_signature(
  file_link:     "https://example.com/contract.pdf",
  document_name: "Partnership Agreement",
  recipients: [
    { name: "John Doe", email: "john@example.com", signing_order: 1 }
  ],
  fields: [
    {
      type:             "signature",
      recipient_email:  "john@example.com",
      template:         { anchor: "{signature1}", placement: "replace",
                          size: { width: 100, height: 30 } }
    }
  ]
)

puts "Document ID: #{result['documentId']}"
```

---

## Configuration

```ruby
require "turbodocx_sdk"

TurboDocxSdk::TurboSign.configure(
  api_key:      "your-api-key",         # REQUIRED
  org_id:       "your-org-id",          # REQUIRED
  sender_email: "you@company.com",      # REQUIRED — reply-to for signature emails
  sender_name:  "Your Company"          # OPTIONAL but strongly recommended
)
```

**Important:** `sender_email` is **REQUIRED**. This email is used as the reply-to address for signature request emails. The `sender_name` is optional but strongly recommended for a professional appearance.

### Environment Variables

```bash
# .env
TURBODOCX_API_KEY=your-api-key
TURBODOCX_ORG_ID=your-org-id
TURBODOCX_SENDER_EMAIL=you@company.com
TURBODOCX_SENDER_NAME=Your Company Name
```

---

## API Reference

### TurboSign

#### `configure(api_key:, org_id:, sender_email:, sender_name: nil, base_url: nil)`

Configure the TurboSign module. `sender_email` is required.

#### `send_signature(options)`

Upload a document and send signature request emails.

```ruby
result = TurboDocxSdk::TurboSign.send_signature(
  file_link:  "https://example.com/contract.pdf",
  recipients: [
    { name: "Alice", email: "alice@example.com", order: 1 },
    { name: "Bob",   email: "bob@example.com",   order: 2 }
  ],
  fields: [
    { type: "signature", page: 1, x: 100, y: 500, width: 200, height: 50, recipient_order: 1 },
    { type: "signature", page: 1, x: 100, y: 600, width: 200, height: 50, recipient_order: 2 }
  ]
)

result["recipients"].each do |r|
  puts "#{r['name']}: #{r['signUrl']}"
end
```

#### `get_status(document_id)`

Check the status of a document.

```ruby
status = TurboDocxSdk::TurboSign.get_status("doc-uuid")
puts "Status: #{status['status']}"  # "pending" | "completed" | "voided"
```

#### `download(document_id)`

Download the signed document as raw bytes.

```ruby
pdf_bytes = TurboDocxSdk::TurboSign.download("doc-uuid")
File.binwrite("signed-contract.pdf", pdf_bytes)
```

#### `void(document_id, reason)`

Cancel a signature request.

```ruby
TurboDocxSdk::TurboSign.void("doc-uuid", "Contract terms changed")
```

#### `resend(document_id, recipient_ids)`

Resend signature emails to specific recipients.

```ruby
TurboDocxSdk::TurboSign.resend("doc-uuid", ["recipient-uuid-1"])
```

#### `get_audit_trail(document_id)`

Get the complete audit trail for a document.

```ruby
audit = TurboDocxSdk::TurboSign.get_audit_trail("doc-uuid")
audit["auditTrail"].each do |entry|
  puts "#{entry['actionType']} at #{entry['timestamp']}"
end
```

---

### TurboPartner (Partner API)

The `TurboPartner` module provides partner portal operations for managing organizations, users, API keys, and audit logs.

#### Configuration

```ruby
require "turbodocx_sdk"

TurboDocxSdk::TurboPartner.configure(
  partner_api_key: ENV["TURBODOCX_PARTNER_API_KEY"],  # Must start with TDXP-
  partner_id:      ENV["TURBODOCX_PARTNER_ID"]        # UUID format
)
```

**Environment Variables:**

```bash
TURBODOCX_PARTNER_API_KEY=TDXP-your-partner-api-key
TURBODOCX_PARTNER_ID=your-partner-uuid
```

#### Organization Management

```ruby
# Create an organization
org = TurboDocxSdk::TurboPartner.create_organization(
  name:     "Acme Corp",
  features: { maxUsers: 50, hasTDAI: true }
)
puts "Org ID: #{org['data']['id']}"

# List organizations
orgs = TurboDocxSdk::TurboPartner.list_organizations(limit: 10, search: "acme")

# Get organization details
details = TurboDocxSdk::TurboPartner.get_organization_details("org-uuid")

# Update organization
TurboDocxSdk::TurboPartner.update_organization_info("org-uuid", name: "New Name")

# Delete organization
TurboDocxSdk::TurboPartner.delete_organization("org-uuid")

# Update entitlements
TurboDocxSdk::TurboPartner.update_organization_entitlements("org-uuid",
  features: { maxUsers: 100, hasTDAI: true }
)
```

#### Organization User Management

```ruby
# List users
users = TurboDocxSdk::TurboPartner.list_organization_users("org-uuid")

# Add a user
TurboDocxSdk::TurboPartner.add_user_to_organization("org-uuid",
  email: "user@example.com", role: "contributor"
)

# Update role
TurboDocxSdk::TurboPartner.update_organization_user_role("org-uuid", "user-uuid",
  role: "admin"
)

# Remove user
TurboDocxSdk::TurboPartner.remove_user_from_organization("org-uuid", "user-uuid")
```

#### Organization API Key Management

```ruby
# List keys
keys = TurboDocxSdk::TurboPartner.list_organization_api_keys("org-uuid")

# Create key (full value returned only on creation)
key = TurboDocxSdk::TurboPartner.create_organization_api_key("org-uuid",
  name: "Production Key", role: "admin"
)
puts "Key: #{key['data']['key']}"

# Revoke key
TurboDocxSdk::TurboPartner.revoke_organization_api_key("org-uuid", "key-uuid")
```

#### Audit Logs

```ruby
logs = TurboDocxSdk::TurboPartner.get_partner_audit_logs(
  action:    "org.created",
  startDate: "2025-01-01",
  endDate:   "2025-12-31",
  limit:     100
)

logs["data"]["results"].each do |entry|
  puts "#{entry['action']} - #{entry['createdOn']}"
end
```

---

### TurboWebhooks (Signature Webhook)

The `TurboWebhooks` module manages your organization's **signature webhook** and exposes a `verify_webhook_signature` helper for incoming webhook receivers.

> **One webhook per org.** The SDK manages a single fixed-name webhook (`signature`) per org. Requires an administrator TDX- API key.

#### Configuration

```ruby
require "turbodocx_sdk"

TurboDocxSdk::TurboWebhooks.configure(
  api_key: ENV["TURBODOCX_API_KEY"],
  org_id:  ENV["TURBODOCX_ORG_ID"]
)
```

#### Create the signature webhook (save the secret immediately)

```ruby
created = TurboDocxSdk::TurboWebhooks.create_webhook(
  urls:   ["https://your-server.example.com/webhooks/turbodocx"],
  events: ["signature.document.completed", "signature.document.voided"]
)

# `secret` is shown ONCE — store it securely
puts "Save this secret: #{created['secret']}"
```

#### Get, update, delete

```ruby
webhook = TurboDocxSdk::TurboWebhooks.get_webhook
TurboDocxSdk::TurboWebhooks.update_webhook(is_active: false)
TurboDocxSdk::TurboWebhooks.delete_webhook
```

#### Verify incoming webhook signatures

```ruby
# In your Rack/Rails webhook handler:
raw_body  = request.body.read
signature = request.get_header("HTTP_X_TURBODOCX_SIGNATURE") || ""
timestamp = request.get_header("HTTP_X_TURBODOCX_TIMESTAMP") || ""
secret    = ENV["TURBODOCX_WEBHOOK_SECRET"]

unless TurboDocxSdk.verify_webhook_signature(raw_body, signature, timestamp, secret)
  return [401, {}, ["invalid signature"]]
end

event = JSON.parse(raw_body)
# ... process event ...
[200, {}, ["ok"]]
```

---

### TurboQuote (Sales Quoting)

The `TurboQuote` module provides end-to-end sales quoting: manage your product catalog, assemble quotes with line items, and send them to customers.

#### Configuration

```ruby
require "turbodocx_sdk"

TurboDocxSdk::TurboQuote.configure(
  api_key: ENV["TURBODOCX_API_KEY"],  # REQUIRED (or access_token)
  org_id:  ENV["TURBODOCX_ORG_ID"]   # REQUIRED
  # base_url: "https://api.turbodocx.com"  # optional
)
```

`TurboQuote` does **not** require `sender_email` — use `api_key` + `org_id` only.

#### Methods

| Group | Methods |
|---|---|
| **Configuration** | `configure` |
| **Quotes** | `create_quote`, `get_quote`, `list_quotes`, `update_quote`, `delete_quote` |
| **Quote status transitions** | `send_quote`, `decline_quote`, `void_quote`, `handle_expired_quote`, `duplicate_quote` |
| **Quote extras** | `send_quote_with_deliverable`, `apply_price_book`, `remove_price_book`, `download_quote_pdf`, `create_and_send` |
| **Line items** | `add_line_items`, `add_bundle_line_items`, `list_line_items`, `update_line_item`, `remove_line_item` |
| **Products** | `create_product`, `get_product`, `list_products`, `update_product`, `delete_product`, `duplicate_product`, `get_product_primary_images` |
| **Bundles** | `create_bundle`, `get_bundle`, `list_bundles`, `update_bundle`, `delete_bundle`, `duplicate_bundle` |
| **Price books** | `create_price_book`, `get_price_book`, `list_price_books`, `update_price_book`, `delete_price_book`, `duplicate_price_book`, `list_price_book_products` |
| **Quote templates** | `get_template`, `get_template_by_id`, `list_templates`, `create_template`, `update_template`, `delete_template` |
| **Types / categories** | `create_type`, `list_types`, `update_type`, `delete_type` |
| **Companies** | `create_company`, `get_company`, `list_companies`, `update_company`, `delete_company`, `list_company_contacts` |
| **Contacts** | `create_contact`, `list_contacts`, `update_contact`, `delete_contact` |

#### Create a quote, add line items, and send

```ruby
require "turbodocx_sdk"

TurboDocxSdk::TurboQuote.configure(
  api_key: ENV["TURBODOCX_API_KEY"],
  org_id:  ENV["TURBODOCX_ORG_ID"]
)

# 1. Create the quote
quote = TurboDocxSdk::TurboQuote.create_quote(
  "name"      => "Professional Services Q3 2026",
  "companyId" => "company-uuid",
  "contactId" => "contact-uuid",
  "currency"  => "USD",
  "validUntil" => "2026-09-30"
)
puts "Quote number: #{quote['quoteNumber']}"

# 2. Add a product line item with a percent discount
items = TurboDocxSdk::TurboQuote.add_line_items(quote["id"],
  "productId"        => "product-uuid",
  "productName"      => "Consulting Service",
  "unitPrice"        => 500,
  "billingFrequency" => TurboDocxSdk::BillingFrequency::MONTHLY,
  "quantity"         => 3,
  "discountType"     => TurboDocxSdk::DiscountType::PERCENT,
  "discountPercent"  => 10
)
puts "Line item ID: #{items[0]['id']}"

# 3. Send the quote
sent = TurboDocxSdk::TurboQuote.send_quote(quote["id"])
puts sent["message"]
```

#### Download a quote as PDF

```ruby
pdf_bytes = TurboDocxSdk::TurboQuote.download_quote_pdf(quote["id"])
File.binwrite("quote.pdf", pdf_bytes)
```

---

## Constants

The SDK exposes idiomatic constants to avoid hard-coding string literals:

```ruby
TurboDocxSdk::QuoteStatus::DRAFT          # "draft"
TurboDocxSdk::QuoteStatus::SENT           # "sent"
TurboDocxSdk::BillingFrequency::MONTHLY   # "monthly"
TurboDocxSdk::BillingFrequency::ANNUAL    # "annual"
TurboDocxSdk::DiscountType::PERCENT       # "percent"
TurboDocxSdk::DiscountType::AMOUNT        # "amount"
TurboDocxSdk::Currency::USD               # "USD"
TurboDocxSdk::LineItemType::PRODUCT       # "product"
TurboDocxSdk::CategoryType::PRODUCT_CATEGORY  # "product_category"
```

---

## Examples

For complete, working examples, see the [`examples/`](./examples/) directory:

- [`turboquote_basic.rb`](./examples/turboquote_basic.rb) — Full quote lifecycle: create company, quote, line items, download PDF, send
- [`turboquote_products.rb`](./examples/turboquote_products.rb) — Products and bundles catalog management
- [`turboquote_pricebooks.rb`](./examples/turboquote_pricebooks.rb) — Price books with per-product overrides, apply to quote

---

## Error Handling

```ruby
require "turbodocx_sdk"

begin
  TurboDocxSdk::TurboSign.get_status("invalid-id")
rescue TurboDocxSdk::NotFoundError => e
  puts "Not found: #{e.message}"
rescue TurboDocxSdk::AuthenticationError => e
  puts "Auth failed (#{e.status_code}): #{e.message}"
rescue TurboDocxSdk::ValidationError => e
  puts "Validation error: #{e.message}"
rescue TurboDocxSdk::RateLimitError
  puts "Rate limited — slow down requests"
rescue TurboDocxSdk::TurboDocxError => e
  puts "TurboDocx error (#{e.status_code}): #{e.message}"
end
```

### Error Hierarchy

| Class | HTTP Status |
|:------|:------------|
| `TurboDocxSdk::AuthenticationError` | 401 |
| `TurboDocxSdk::AuthorizationError` | 403 |
| `TurboDocxSdk::ValidationError` | 400 |
| `TurboDocxSdk::NotFoundError` | 404 |
| `TurboDocxSdk::ConflictError` | 409 |
| `TurboDocxSdk::RateLimitError` | 429 |
| `TurboDocxSdk::NetworkError` | (no status) |
| `TurboDocxSdk::TurboDocxError` | base class |

---

## Requirements

- Ruby 2.7+

---

## Related Packages

| Package | Description |
|:--------|:------------|
| [@turbodocx/sdk (JavaScript)](../js-sdk) | JavaScript/TypeScript SDK |
| [turbodocx-sdk (Python)](../py-sdk) | Python SDK |
| [turbodocx (Go)](../go-sdk) | Go SDK |

---

## Support

- [Documentation](https://docs.turbodocx.com/docs)
- [Discord](https://discord.gg/NYKwz4BcpX)
- [GitHub Issues](https://github.com/TurboDocx/SDK/issues)

---

## License

MIT — see [LICENSE](./LICENSE)

---

<div align="center">

[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/js-sdk/footer.png)](https://www.turbodocx.com)

</div>
