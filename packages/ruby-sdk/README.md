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

- **Production-Ready** — Battle-tested, processing thousands of documents daily
- **Zero runtime dependencies** — Pure Ruby stdlib (`net/http`, `json`, `openssl`); nothing else to install
- **Idiomatic Ruby** — snake_case methods, keyword arguments, typed exception hierarchy
- **Static class pattern** — `configure` once, then call class methods; no instantiation required
- **Five modules** — TurboSign (e-signatures), Deliverable (document generation), TurboPartner (partner portal), TurboWebhooks (signature webhook), TurboQuote (CPQ)

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

## Install via AI Agent Skill

Let an AI coding agent set up this SDK for you with the [TurboDocx Quickstart Agent Skill](https://github.com/TurboDocx/quickstart):

```bash
npx skills add TurboDocx/quickstart
```

Works with Claude Code, GitHub Copilot, Cursor, OpenCode, and other AI coding agents. The skill detects your language, installs the gem, and generates working integration code.

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
  # Request-hash keys are camelCase — the SDK forwards the hash to the API
  # as-is and does NOT convert snake_case. (Only method keyword args like
  # configure(api_key:, sender_email:) are snake_case.)
  fileLink:     "https://example.com/contract.pdf",
  documentName: "Partnership Agreement",
  recipients: [
    { name: "John Doe", email: "john@example.com", signingOrder: 1 }
  ],
  fields: [
    {
      type:           "signature",
      recipientEmail: "john@example.com",
      template:       { anchor: "{signature1}", placement: "replace",
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

**Important:** `sender_email` is **REQUIRED**. It is used as the reply-to address for signature request emails and recorded as the sender in the audit trail. An API key has no mailbox of its own, so the API rejects a send without it rather than mailing from an unmonitored address. `sender_name` is optional — it defaults to the name of your API key.

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

#### `create_signature_review_link(request)`

Upload a document for review **without** sending signature emails. Returns a preview URL you can share manually. Accepts the same request hash as `send_signature` (`file`, `fileLink`, `deliverableId`, or `templateId` as document source).

```ruby
result = TurboDocxSdk::TurboSign.create_signature_review_link(
  fileLink: "https://example.com/contract.pdf",
  recipients: [
    { name: "John Doe", email: "john@example.com", signingOrder: 1 }
  ],
  fields: [
    { type: "signature", page: 1, x: 100, y: 500, width: 200, height: 50, recipientEmail: "john@example.com" }
  ],
  documentName:        "Service Agreement",   # Optional
  documentDescription: "Q4 Contract",         # Optional
  ccEmails:            ["legal@acme.com"]     # Optional
)

puts "Preview URL: #{result['previewUrl']}"
puts "Document ID: #{result['documentId']}"
```

#### `send_signature(request)`

Upload a document and immediately send signature request emails. The request hash uses **camelCase** keys (`fileLink`, `documentName`, and inner `recipients`/`fields` keys like `signingOrder`/`recipientEmail`) — the SDK forwards them to the API unchanged and does not convert snake_case. Fields bind to a recipient via `recipientEmail`.

```ruby
result = TurboDocxSdk::TurboSign.send_signature(
  fileLink:   "https://example.com/contract.pdf",
  recipients: [
    { name: "Alice", email: "alice@example.com", signingOrder: 1 },
    { name: "Bob",   email: "bob@example.com",   signingOrder: 2 }
  ],
  fields: [
    { type: "signature", page: 1, x: 100, y: 500, width: 200, height: 50, recipientEmail: "alice@example.com" },
    { type: "signature", page: 1, x: 100, y: 600, width: 200, height: 50, recipientEmail: "bob@example.com" }
  ]
)

# The created recipients come back on the send result — each carries id, name and email.
# Signing links are emailed to them; they are not returned here.
result["recipients"].each do |r|
  puts "#{r['name']} <#{r['email']}> — #{r['id']}"
end

# For signing progress afterwards, use get_recipients.
```

The document source can also be raw bytes or a local file path (`file: File.binread("contract.pdf")` or `file: "contract.pdf"` — the file type is detected from magic bytes), a TurboDocx deliverable (`deliverableId:`), or a TurboSign template (`templateId:`).

#### `get_status(document_id)`

Check the document-level status. For per-recipient detail, use `get_recipients`.

```ruby
status = TurboDocxSdk::TurboSign.get_status("doc-uuid")
puts "Status: #{status['status']}"  # "under_review" | "completed" | "voided" | ...
```

#### `get_recipients(document_id)`

See who the document went to, who has signed, who you are still waiting on, and who sent it.

```ruby
result = TurboDocxSdk::TurboSign.get_recipients("doc-uuid")

sender = result["document"]["sentBy"]
puts "Sent by #{sender['name']} <#{sender['email']}>"

summary = result["summary"]
puts "#{summary['completed']} of #{summary['total']} signed, waiting on #{summary['waitingOn']}"

result["recipients"].each do |r|
  # "pending" | "viewed" | "completed" | "voided" | "expired"
  puts "#{r['name']} <#{r['email']}>: #{r['effectiveStatus']}"
  puts "  signed #{r['signedOn']}" if r["signedOn"]
  puts "  emailed #{r['delivery']['totalSent']}x"
end

# Who are we chasing?
chasing = result["recipients"].select { |r| %w[pending viewed].include?(r["effectiveStatus"]) }
```

**Two status fields, and they differ on purpose:**

| Field | Values | Use it for |
|---|---|---|
| `status` | `pending`, `viewed`, `completed` | The raw database value |
| `effectiveStatus` | `pending`, `viewed`, `completed`, `voided`, `expired` | Display |

The database has no per-recipient declined/voided/expired state, so on a voided or expired
document an unsigned signer still reads `pending` in `status`. `effectiveStatus` layers the
document's outcome on top — that's the one to show a user. A completed signature is never
revoked: someone who signed before the document was voided still reads `completed`.

`summary` counts by `effectiveStatus`, and `waitingOn` (pending + viewed) drops to zero once
the document is terminal.

**`delivery`** is that recipient's email history — `firstSentOn`, `lastSentOn`, `totalSent`,
`reminderCount`, `lastRemindedAt`, `warningCount`, `lastWarningAt`. It counts the signature
request, resends, reminders, expiry warnings and terminal notices. CC notifications are
excluded, since a CC address is not a signer.

#### `download(document_id)`

Download the signed document as raw bytes.

```ruby
pdf_bytes = TurboDocxSdk::TurboSign.download("doc-uuid")
File.binwrite("signed-contract.pdf", pdf_bytes)
```

#### `void_document(document_id, reason)`

Cancel a signature request.

```ruby
TurboDocxSdk::TurboSign.void_document("doc-uuid", "Contract terms changed")
```

#### `resend_email(document_id, recipient_ids)`

Resend signature emails to specific recipients.

```ruby
TurboDocxSdk::TurboSign.resend_email("doc-uuid", ["recipient-uuid-1"])
```

#### `get_audit_trail(document_id)`

Get the complete audit trail for a document, including all events and timestamps.

```ruby
audit = TurboDocxSdk::TurboSign.get_audit_trail("doc-uuid")

puts "Document: #{audit['document']['name']}"

audit["auditTrail"].each do |entry|
  puts "#{entry['actionType']} at #{entry['timestamp']}"
  puts "  By: #{entry['user']['name']} (#{entry['user']['email']})" if entry["user"]
  puts "  Recipient: #{entry['recipient']['name']}" if entry["recipient"]
end
```

The audit trail includes a cryptographic hash chain for tamper-evidence verification.

---

### Deliverable (Document Generation)

The `Deliverable` module generates documents from TurboDocx templates with variable substitution, and manages/downloads the resulting deliverables.

#### Configuration

```ruby
require "turbodocx_sdk"

TurboDocxSdk::Deliverable.configure(
  api_key: ENV["TURBODOCX_API_KEY"],  # REQUIRED (or access_token)
  org_id:  ENV["TURBODOCX_ORG_ID"]    # REQUIRED
  # base_url: "https://api.turbodocx.com"  # optional
)
```

`Deliverable` does **not** require `sender_email` — it never sends signature emails.

#### `generate_deliverable(request)`

Generate a new document from a template with variable substitution. Request-hash keys are camelCase (`templateId`).

```ruby
result = TurboDocxSdk::Deliverable.generate_deliverable(
  "templateId" => "template-uuid",
  "name"       => "Q3 Statement of Work",
  "variables"  => [
    { "placeholder" => "{ClientName}", "text" => "Acme Corp" },
    { "placeholder" => "{StartDate}",  "text" => "2026-08-01" }
  ],
  "description" => "SOW for Acme",     # Optional
  "tags"        => ["sow", "acme"]     # Optional
)

deliverable = result["results"]["deliverable"]
puts "Deliverable ID: #{deliverable['id']}"
```

#### `list_deliverables(options = nil)`

List deliverables with pagination, search, and tag filtering.

```ruby
page = TurboDocxSdk::Deliverable.list_deliverables(limit: 25, offset: 0, query: "sow", show_tags: true)
puts "Total: #{page['totalRecords']}"
page["results"].each { |d| puts d["name"] }
```

#### `get_deliverable_details(id, options = nil)`

Get full details of a single deliverable, including variables, fonts, and template info.

```ruby
deliverable = TurboDocxSdk::Deliverable.get_deliverable_details("deliverable-uuid", show_tags: true)
puts deliverable["name"]
```

#### `update_deliverable_info(id, request)`

Update a deliverable's name, description, or tags. **Note:** when `tags` is provided, all existing tags are replaced.

```ruby
TurboDocxSdk::Deliverable.update_deliverable_info("deliverable-uuid",
  "name"        => "Q3 SOW (final)",
  "description" => "Signed-off version"
)
```

#### `delete_deliverable(id)`

Soft-delete a deliverable.

```ruby
TurboDocxSdk::Deliverable.delete_deliverable("deliverable-uuid")
```

#### `download_source_file(deliverable_id)`

Download the original source file (DOCX or PPTX) as raw bytes.

```ruby
docx_bytes = TurboDocxSdk::Deliverable.download_source_file("deliverable-uuid")
File.binwrite("sow.docx", docx_bytes)
```

#### `download_pdf(deliverable_id)`

Download the PDF version as raw bytes.

```ruby
pdf_bytes = TurboDocxSdk::Deliverable.download_pdf("deliverable-uuid")
File.binwrite("sow.pdf", pdf_bytes)
```

#### Generate, then send for signature

`Deliverable` pairs naturally with `TurboSign` — generate a document, then send it without downloading:

```ruby
result = TurboDocxSdk::Deliverable.generate_deliverable(
  "templateId" => "template-uuid",
  "name"       => "Consulting Agreement",
  "variables"  => [{ "placeholder" => "{ClientName}", "text" => "Acme Corp" }]
)

TurboDocxSdk::TurboSign.send_signature(
  deliverableId: result["results"]["deliverable"]["id"],
  recipients: [{ name: "John Doe", email: "john@example.com", signingOrder: 1 }],
  fields: [
    { type: "signature", recipientEmail: "john@example.com",
      template: { anchor: "{signature1}", placement: "replace", size: { width: 100, height: 30 } } }
  ]
)
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

# Get organization details (includes features + usage tracking)
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

# Resend the org invitation email
TurboDocxSdk::TurboPartner.resend_organization_invitation_to_user("org-uuid", "user-uuid")
```

#### Organization API Key Management

```ruby
# List keys
keys = TurboDocxSdk::TurboPartner.list_organization_api_keys("org-uuid")

# Create key (full value returned only on creation)
key = TurboDocxSdk::TurboPartner.create_organization_api_key("org-uuid",
  name: "Production Key", role: "admin"
)
puts "Key: #{key['data']['key']}"  # TDX-... (only shown once)

# Update key
TurboDocxSdk::TurboPartner.update_organization_api_key("org-uuid", "key-uuid", name: "Renamed Key")

# Revoke key
TurboDocxSdk::TurboPartner.revoke_organization_api_key("org-uuid", "key-uuid")
```

#### Partner API Keys & Partner Portal Users

```ruby
# Create a scoped partner API key (full key value returned only on creation)
key = TurboDocxSdk::TurboPartner.create_partner_api_key(
  name:   "Read-Only Key",
  scopes: ["org:read", "audit:read"]
)

# List / update / revoke partner API keys
TurboDocxSdk::TurboPartner.list_partner_api_keys(limit: 10)
TurboDocxSdk::TurboPartner.update_partner_api_key("key-uuid", name: "Renamed")
TurboDocxSdk::TurboPartner.revoke_partner_api_key("key-uuid")

# Add a user to the partner portal.
# `permissions` is all-or-nothing: every one of the seven keys must be present.
# A partial permissions hash is rejected with a 400.
TurboDocxSdk::TurboPartner.add_user_to_partner_portal(
  email:       "ops@company.com",
  role:        "member",  # partner roles: "admin" | "member" | "viewer"
  permissions: {
    canManageOrgs:           true,
    canManageOrgUsers:       true,
    canManagePartnerUsers:   false,
    canManageOrgAPIKeys:     false,
    canManagePartnerAPIKeys: false,
    canUpdateEntitlements:   false,
    canViewAuditLogs:        true
  }
)

# List / update / remove / re-invite partner portal users
TurboDocxSdk::TurboPartner.list_partner_portal_users(search: "ops")

# The `permissions` object is optional on update — but if you send it, send all
# seven keys. There is no partial permissions update.
TurboDocxSdk::TurboPartner.update_partner_user_permissions("user-uuid",
  permissions: {
    canManageOrgs:           false,
    canManageOrgUsers:       true,
    canManagePartnerUsers:   false,
    canManageOrgAPIKeys:     false,
    canManagePartnerAPIKeys: false,
    canUpdateEntitlements:   false,
    canViewAuditLogs:        true
  }
)
TurboDocxSdk::TurboPartner.remove_user_from_partner_portal("user-uuid")
TurboDocxSdk::TurboPartner.resend_partner_portal_invitation_to_user("user-uuid")
```

**Partner permissions** — all seven keys are required whenever `permissions` is sent (booleans):

| Key | Grants |
|:----|:-------|
| `canManageOrgs` | Create / update / delete organizations |
| `canManageOrgUsers` | Manage users inside organizations |
| `canManagePartnerUsers` | Manage partner portal users |
| `canManageOrgAPIKeys` | Manage organization API keys |
| `canManagePartnerAPIKeys` | Manage partner API keys |
| `canUpdateEntitlements` | Update organization entitlements |
| `canViewAuditLogs` | Read the partner audit log |

**Role enums are different for orgs and partners** — do not mix them:

| Scope | Valid roles |
|:------|:------------|
| Org users, org API keys | `admin`, `contributor`, `user`, `viewer` |
| Partner portal users | `admin`, `member`, `viewer` |

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

#### All 25 Methods

| Category | Methods |
|:---------|:--------|
| **Organizations** | `create_organization`, `list_organizations`, `get_organization_details`, `update_organization_info`, `delete_organization`, `update_organization_entitlements` |
| **Org Users** | `add_user_to_organization`, `list_organization_users`, `update_organization_user_role`, `remove_user_from_organization`, `resend_organization_invitation_to_user` |
| **Org API Keys** | `create_organization_api_key`, `list_organization_api_keys`, `update_organization_api_key`, `revoke_organization_api_key` |
| **Partner API Keys** | `create_partner_api_key`, `list_partner_api_keys`, `update_partner_api_key`, `revoke_partner_api_key` |
| **Partner Users** | `add_user_to_partner_portal`, `list_partner_portal_users`, `update_partner_user_permissions`, `remove_user_from_partner_portal`, `resend_partner_portal_invitation_to_user` |
| **Audit Logs** | `get_partner_audit_logs` |

---

### TurboWebhooks (Signature Webhook)

The `TurboWebhooks` module manages your organization's **signature webhook** — a single subscription to TurboDocx signature events. It also pairs with the `TurboDocxSdk.verify_webhook_signature` helper for incoming webhook receivers.

> **One webhook per org.** The SDK manages a single fixed-name webhook (`signature`) per org so SDK-managed and UI-managed webhooks stay in sync — what you create here also appears in the dashboard's Signature Webhooks settings page. To manage multiple webhooks per org, call the REST API directly.
>
> **Requires administrator role.** All webhook routes require an admin TDX- API key.

#### The 7 signature events

Use the `TurboDocxSdk::WebhookEvent` constants instead of hand-writing the wire strings — a typo becomes a `NameError` rather than a webhook that silently never fires.

| Event | Constant | Fires when |
|---|---|---|
| `signature.document.sent` | `WebhookEvent::SENT` | The document is dispatched to recipients |
| `signature.document.viewed` | `WebhookEvent::VIEWED` | A recipient opens the document for the first time |
| `signature.document.recipient_signed` | `WebhookEvent::RECIPIENT_SIGNED` | Any individual signer completes their signature — fires **once per signer**, and carries `is_final_signer` + `remaining_signers` |
| `signature.document.signed` | `WebhookEvent::SIGNED` | A signer signs but the document is **not yet complete** (document-level partial progress) |
| `signature.document.completed` | `WebhookEvent::COMPLETED` | All recipients have signed and the signed PDF is finalized |
| `signature.document.finalization_failed` | `WebhookEvent::FINALIZATION_FAILED` | The signed PDF fails to finalize (e.g. a KMS signing error); the document is **not** completed |
| `signature.document.voided` | `WebhookEvent::VOIDED` | The document is voided or cancelled |

On every signature, `recipient_signed` fires first, then **exactly one** document-level event:

```
Recipient signs
   │
   ├─ signature.document.recipient_signed   (always — one per signer)
   │
   └─ more signers remaining?
        ├─ yes → signature.document.signed                 (partial progress)
        └─ no  → signature.document.completed              (finalized OK)
                 or signature.document.finalization_failed (finalization failed)
```

> **`signed` never fires on the final signature.** To detect "the whole document is done", subscribe to `completed` (or to `recipient_signed` and check `is_final_signer: true`) — **not** `signed`.
>
> **A single-signer document never emits `signed` at all.** It emits `recipient_signed` (with `is_final_signer: true`), then `completed`.

`TurboDocxSdk::WebhookEvent::ALL` is a frozen array of all 7 wire strings if you want to subscribe to everything. `events:` stays an array of plain strings, so the backend can add events without a gem release.

#### Configuration

```ruby
require "turbodocx_sdk"

TurboDocxSdk::TurboWebhooks.configure(
  api_key: ENV["TURBODOCX_API_KEY"],
  org_id:  ENV["TURBODOCX_ORG_ID"]
  # base_url: "https://api.turbodocx.com"  # optional
)
```

Unlike `TurboSign`, `TurboWebhooks` does NOT require `sender_email` — webhook routes don't send signature emails.

#### Create the signature webhook (save the secret immediately)

```ruby
Events = TurboDocxSdk::WebhookEvent

created = TurboDocxSdk::TurboWebhooks.create_webhook(
  urls:   ["https://your-server.example.com/webhooks/turbodocx"],  # HTTPS only, 1-10 urls
  events: [
    Events::SENT,
    Events::VIEWED,
    Events::RECIPIENT_SIGNED,
    Events::COMPLETED,
    Events::VOIDED
  ]
  # ...or subscribe to everything: events: TurboDocxSdk::WebhookEvent::ALL
)

# `secret` is shown ONCE here. Store it securely; it cannot be retrieved later.
puts "Save this secret: #{created['secret']}"
```

If the signature webhook already exists, `create_webhook` raises `TurboDocxSdk::ConflictError` (409). Either update the existing one with `update_webhook` or `delete_webhook` first.

#### Get, update, delete

```ruby
webhook = TurboDocxSdk::TurboWebhooks.get_webhook
# webhook["deliveryStats"] and webhook["availableEvents"] are included

# Only the keywords you pass are sent; the rest are left untouched.
TurboDocxSdk::TurboWebhooks.update_webhook(is_active: false)
TurboDocxSdk::TurboWebhooks.update_webhook(
  urls:   ["https://new-endpoint.example.com/webhooks/turbodocx"],
  events: ["signature.document.completed"]
)
TurboDocxSdk::TurboWebhooks.delete_webhook
```

> **`urls` and `events` can never be empty.** They stay `min(1)` on the backend even on update, so `urls: []` is a 400, not a "clear this field" instruction — and there is no way to remove every URL from a webhook. `update_webhook` raises `TurboDocxSdk::ValidationError` before hitting the wire if you pass an empty or `nil` array. To leave a field unchanged, just omit the keyword. `urls` accepts **1-10** entries.

#### Test deliveries and replay

```ruby
tested = TurboDocxSdk::TurboWebhooks.test_webhook(
  event_type: "signature.document.completed",
  payload:    { "documentId" => "doc-xyz", "status" => "completed" }
)
puts tested["summary"]  # { "total" => ..., "successful" => ..., "failed" => ... }

deliveries = TurboDocxSdk::TurboWebhooks.list_webhook_deliveries(limit: 10)
replayed   = TurboDocxSdk::TurboWebhooks.replay_webhook_delivery(deliveries["results"][0]["id"])
```

`list_webhook_deliveries` accepts `limit:`, `offset:`, `event_type:`, `is_delivered:`, and `http_status:` filters. `notify_webhook(event_type:, payload:)` is also available and currently behaves identically to `test_webhook` — prefer `test_webhook` in new code.

#### Rotate the secret

```ruby
rotated = TurboDocxSdk::TurboWebhooks.regenerate_webhook_secret
# rotated["secret"] is the new secret. Old signatures will fail immediately.
```

#### Aggregate stats

```ruby
stats = TurboDocxSdk::TurboWebhooks.get_webhook_stats(days: 30)
puts stats["summary"]["successRate"]
puts stats["eventBreakdown"]
```

#### Verify incoming webhook signatures

Webhook deliveries from TurboDocx are signed with HMAC-SHA256 over `"#{timestamp}.#{raw_body}"` using your webhook secret. Use the free module function `TurboDocxSdk.verify_webhook_signature` in your receiver:

```ruby
# In your Rack/Rails webhook handler:
# CRITICAL: read the RAW body bytes. Do NOT parse-then-reserialize JSON first —
# the signature is over the exact bytes; re-serialization breaks verification.
raw_body  = request.body.read
signature = request.get_header("HTTP_X_TURBODOCX_SIGNATURE") || ""
timestamp = request.get_header("HTTP_X_TURBODOCX_TIMESTAMP") || ""
secret    = ENV["TURBODOCX_WEBHOOK_SECRET"]

unless TurboDocxSdk.verify_webhook_signature(
  payload: raw_body,
  signature_header: signature,
  timestamp_header: timestamp,
  secret: secret
)
  return [401, {}, ["invalid signature"]]
end

event = JSON.parse(raw_body)
# ... process event ...
[200, {}, ["ok"]]
```

By default the helper enforces a 300-second timestamp tolerance to prevent replay attacks. Override with `tolerance_seconds: N` (`0` disables the check — not recommended in production). Comparison uses constant-time equality.

#### All Methods

| Category | Methods |
|:---------|:--------|
| **Configuration** | `configure` |
| **Webhook CRUD** | `create_webhook`, `get_webhook`, `update_webhook`, `delete_webhook` |
| **Testing** | `test_webhook`, `notify_webhook` |
| **Secret** | `regenerate_webhook_secret` |
| **Deliveries** | `list_webhook_deliveries`, `replay_webhook_delivery`, `get_webhook_stats` |
| **Receiver helper** | `TurboDocxSdk.verify_webhook_signature` (free module function — no API key needed) |

---

### TurboQuote (CPQ — Configure, Price, Quote)

The `TurboQuote` module provides end-to-end sales quoting: manage your product catalog (products, bundles, price books), companies and contacts, and assemble/send quotes with line items.

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

#### All 68 Methods

| Group | Methods |
|---|---|
| **Configuration** | `configure` |
| **Quotes** | `create_quote`, `get_quote`, `list_quotes`, `update_quote`, `delete_quote`, `duplicate_quote` |
| **Quote status transitions** | `send_quote`, `decline_quote`, `void_quote`, `handle_expired_quote` |
| **Quote extras** | `send_quote_with_deliverable`, `apply_price_book`, `remove_price_book`, `download_quote_pdf` |
| **Line items** | `add_line_items`, `add_bundle_line_items`, `list_line_items`, `update_line_item`, `remove_line_item` |
| **Products** | `create_product`, `bulk_create_products`, `get_product`, `list_products`, `update_product`, `delete_product`, `duplicate_product`, `get_product_primary_images` |
| **Bundles** | `create_bundle`, `bulk_create_bundles`, `get_bundle`, `list_bundles`, `update_bundle`, `delete_bundle`, `duplicate_bundle` |
| **Price books** | `create_price_book`, `bulk_create_price_books`, `get_price_book`, `list_price_books`, `update_price_book`, `delete_price_book`, `duplicate_price_book`, `list_price_book_products` |
| **Quote templates** | `get_template`, `get_template_by_id`, `list_templates`, `create_template`, `update_template`, `delete_template` |
| **Types / categories** | `create_type`, `bulk_create_types`, `list_types`, `update_type`, `delete_type` |
| **Companies** | `create_company`, `bulk_create_companies`, `get_company`, `list_companies`, `update_company`, `delete_company`, `list_company_contacts` |
| **Contacts** | `create_contact`, `bulk_create_contacts`, `list_contacts`, `update_contact`, `delete_contact` |
| **Quote number config (admin)** | `get_quote_number_config`, `update_quote_number_config` |
| **Convenience** | `create_and_send` |

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
  "termDays"  => 90,           # optional; defaults to 60, max 3650
  "validUntil" => "2026-09-30"
)
puts "Quote number: #{quote['quoteNumber']}"

# 2. Add a product line item with a percent discount
#    (single hash is auto-wrapped into an array; 1-50 items per call)
#    productId, productName, unitPrice and billingFrequency are all REQUIRED.
#    productId may be nil for an ad-hoc item, but the key must be present.
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

#### Sender identity — "Prepared by"

The quote's **"Prepared by"** name and email are resolved by the server, not by whoever
downloads or sends the quote. Precedence: the org **quote template's** sender fields first,
then the quote's **creator**.

A quote created with an **API key** has no mailbox of its own — so its sender email can only
come from the quote template. **If your org's quote template has no sender email set,
`create_quote` (and `duplicate_quote`) raise `ValidationError` (`400 SenderEmailRequired`)** for
an API-key caller. Set a sender email on the template once (via `update_template`) and every
subsequent create/duplicate/send resolves cleanly. Human (JWT) callers are never blocked — their
own email is the fallback.

`get_quote` returns the resolved identity under `"preparedBy"` — **prefer it over `"creator"`**
for any customer-facing display (`"creator"` may be the internal API service account). The
`"email"` key may be absent for an API-created quote:

```ruby
quote = TurboDocxSdk::TurboQuote.get_quote(quote_id)
prepared = quote["preparedBy"] || {}
puts prepared["name"]   # e.g. "Acme Billing Integration" or the template sender
puts prepared["email"]  # may be nil — render a placeholder
```

#### Quote terms and auto-renewal

`termDays` defaults to **60** and accepts up to **3650** (10 years). The special value **`-1`** means auto-renewal, and it is the only case where `renewalPeriod` is allowed — in fact it is then **required**:

```ruby
# Auto-renewing quote: termDays == -1 REQUIRES renewalPeriod
TurboDocxSdk::TurboQuote.create_quote(
  "name"          => "Managed Services (auto-renew)",
  "companyId"     => "company-uuid",
  "contactId"     => "contact-uuid",
  "termDays"      => -1,
  "renewalPeriod" => TurboDocxSdk::RenewalPeriod::MONTHLY  # weekly | monthly | quarterly | annually
)
```

For any other `termDays`, `renewalPeriod` must be omitted (or `nil`) — sending it is a 400.

#### Handling an expired quote

`handle_expired_quote` voids or declines an expired **sent** quote and creates a duplicate carrying the new validity date. All three keys are required, and `action` accepts **only** `"void"` or `"decline"`:

```ruby
replacement = TurboDocxSdk::TurboQuote.handle_expired_quote(quote["id"],
  "action"        => "void",          # "void" or "decline" — nothing else is accepted
  "reason"        => "Pricing refreshed for Q4",  # REQUIRED, max 190 chars
  "newValidUntil" => "2026-12-31"     # REQUIRED, ISO 8601
)
puts replacement["quoteNumber"]  # the new duplicate quote
```

#### Download a quote as PDF

```ruby
pdf_bytes = TurboDocxSdk::TurboQuote.download_quote_pdf(quote["id"])
File.binwrite("quote.pdf", pdf_bytes)
```

#### Create and send in one call

```ruby
result = TurboDocxSdk::TurboQuote.create_and_send(
  "name"      => "Enterprise License",
  "companyId" => "company-uuid",
  "contactId" => "contact-uuid",
  "items"     => [
    { "productId" => "product-uuid", "productName" => "Platform License",
      "unitPrice" => 1200, "quantity" => 5, "billingFrequency" => "annual" }
  ]
  # "bundleItems" => [...],  # optional bundle line items
  # "send"        => {...}   # optional send options
)
puts result["quote"]["status"]  # "sent"
```

#### Bulk create (CSV-style imports)

Six catalog resources support bulk creation: `bulk_create_products`, `bulk_create_bundles`, `bulk_create_price_books`, `bulk_create_companies`, `bulk_create_contacts`, and `bulk_create_types`. Each takes an **array of row hashes** (same field shapes as the corresponding single `create_*` method); the SDK wraps them in the `{ "rows" => [...] }` envelope the API expects.

```ruby
# Every product row requires name, categoryId, listPrice and billingFrequency.
# `categoryId` is a TurboQuote type UUID — there is no `categoryName` shorthand;
# resolve or create the category first (`list_types` / `create_type`) and pass its ID.
category = TurboDocxSdk::TurboQuote.create_type(
  "name"         => "Plans",
  "categoryType" => TurboDocxSdk::CategoryType::PRODUCT_CATEGORY
)

report = TurboDocxSdk::TurboQuote.bulk_create_products([
  { "name" => "Basic Plan",   "categoryId" => category["id"], "listPrice" => 10,  "billingFrequency" => "monthly" },
  { "name" => "Premium Plan", "categoryId" => category["id"], "listPrice" => 100, "billingFrequency" => "monthly" }
])

puts "Imported: #{report['imported']}"

report["failed"].each do |f|
  puts "Row #{f['row']} failed: #{f['reason']}"     # "row" is 1-indexed
end

report["adjusted"].each do |a|
  puts "Row #{a['row']} adjusted: #{a['reason']}"   # server tweaked the row (e.g. defaults)
end
```

Bulk-create semantics:

- **Partial success** — a failed row does NOT raise and does NOT roll back earlier rows; it is reported in `"failed"` with a 1-indexed `"row"` and a `"reason"`. Server-adjusted rows appear in `"adjusted"`.
- **500-row cap** per request — the API returns a 400 (`ValidationError`) above the cap. The SDK does not validate rows or the cap client-side.
- **Roles** — available to administrator and contributor API keys.

#### Quote number configuration (admin only)

Read and update the org-wide quote-number format. Both methods return `{ "format" => {...}, "currentFloor" => Integer }`.

```ruby
config = TurboDocxSdk::TurboQuote.get_quote_number_config
puts config["format"]["prefix"]
puts config["currentFloor"]

# update_quote_number_config takes the FULL format hash — all keys required, camelCase
updated = TurboDocxSdk::TurboQuote.update_quote_number_config(
  "prefix"       => "Q",
  "yearToken"    => TurboDocxSdk::QuoteNumberYearToken::FOUR,     # "none" | "two" | "four"
  "monthToken"   => TurboDocxSdk::QuoteNumberMonthToken::TWO,     # "off" | "two"
  "separator"    => "-",
  "padWidth"     => 4,                                            # 0-12
  "suffix"       => "",
  "startNumber"  => 1,                                            # >= 0
  "resetCadence" => TurboDocxSdk::QuoteNumberResetCadence::YEARLY # "never" | "yearly" | "monthly"
)
```

Non-admin callers receive `TurboDocxSdk::AuthorizationError`.

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

# Quote number configuration
TurboDocxSdk::QuoteNumberYearToken::FOUR      # "four"
TurboDocxSdk::QuoteNumberMonthToken::TWO      # "two"
TurboDocxSdk::QuoteNumberResetCadence::NEVER  # "never"

# Partner API key permission scopes
TurboDocxSdk::PartnerScope::ORG_READ          # "org:read"
TurboDocxSdk::PartnerScope::AUDIT_READ        # "audit:read"
```

Each constants module also exposes an `ALL` array of its valid values (e.g. `TurboDocxSdk::DiscountType::ALL`).

---

## Examples

For complete, working examples, see the [`examples/`](./examples/) directory:

- [`turbosign_basic.rb`](./examples/turbosign_basic.rb) — Send a document for signature, poll status, download the signed PDF
- [`turbowebhooks_crud.rb`](./examples/turbowebhooks_crud.rb) — Create/get/update/delete the signature webhook + verify HMAC signatures
- [`turboquote_basic.rb`](./examples/turboquote_basic.rb) — Full quote lifecycle: create company, quote, line items, download PDF, send
- [`turboquote_products.rb`](./examples/turboquote_products.rb) — Products and bundles catalog management
- [`turboquote_pricebooks.rb`](./examples/turboquote_pricebooks.rb) — Price books with per-product overrides, apply to quote

### Sequential Signing

```ruby
result = TurboDocxSdk::TurboSign.send_signature(
  fileLink: "https://example.com/contract.pdf",
  recipients: [
    { name: "Employee", email: "employee@company.com", signingOrder: 1 },
    { name: "Manager",  email: "manager@company.com",  signingOrder: 2 },
    { name: "HR",       email: "hr@company.com",       signingOrder: 3 }
  ],
  fields: [
    # Employee signs first
    { type: "signature", recipientEmail: "employee@company.com", page: 1, x: 100, y: 400, width: 200, height: 50 },
    { type: "date",      recipientEmail: "employee@company.com", page: 1, x: 320, y: 400, width: 100, height: 30 },
    # Manager signs second
    { type: "signature", recipientEmail: "manager@company.com",  page: 1, x: 100, y: 500, width: 200, height: 50 },
    # HR signs last
    { type: "signature", recipientEmail: "hr@company.com",       page: 1, x: 100, y: 600, width: 200, height: 50 }
  ]
)
```

### Polling for Completion

```ruby
def wait_for_completion(document_id, max_attempts: 60)
  max_attempts.times do
    status = TurboDocxSdk::TurboSign.get_status(document_id)

    return TurboDocxSdk::TurboSign.download(document_id) if status["status"] == "completed"
    raise "Document was voided" if status["status"] == "voided"

    sleep 30
  end

  raise "Timeout waiting for signatures"
end
```

### With Rails

```ruby
# config/initializers/turbodocx.rb
require "turbodocx_sdk"

TurboDocxSdk::TurboSign.configure(
  api_key:      ENV["TURBODOCX_API_KEY"],
  org_id:       ENV["TURBODOCX_ORG_ID"],
  sender_email: ENV["TURBODOCX_SENDER_EMAIL"]
)

# app/controllers/contracts_controller.rb
class ContractsController < ApplicationController
  def create
    result = TurboDocxSdk::TurboSign.send_signature(
      fileLink:   params[:pdf_url],
      recipients: params[:recipients],
      fields:     params[:fields]
    )
    render json: { success: true, document_id: result["documentId"] }
  rescue TurboDocxSdk::TurboDocxError => e
    render json: { error: e.message }, status: e.status_code || 500
  end
end
```

### With Sinatra

```ruby
require "sinatra"
require "json"
require "turbodocx_sdk"

TurboDocxSdk::TurboSign.configure(
  api_key:      ENV["TURBODOCX_API_KEY"],
  org_id:       ENV["TURBODOCX_ORG_ID"],
  sender_email: ENV["TURBODOCX_SENDER_EMAIL"]
)

post "/api/send-contract" do
  body = JSON.parse(request.body.read)
  result = TurboDocxSdk::TurboSign.send_signature(
    fileLink:   body["pdf_url"],
    recipients: body["recipients"],
    fields:     body["fields"]
  )
  json_response = { success: true, document_id: result["documentId"] }
  content_type :json
  json_response.to_json
end
```

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

### Error Codes

`code` is **always populated** — an API-supplied code when there is one, otherwise the error
class's default (`VALIDATION_ERROR`, `AUTHENTICATION_ERROR`, `AUTHORIZATION_ERROR`,
`NOT_FOUND`, `CONFLICT`, `RATE_LIMIT_EXCEEDED`, `NETWORK_ERROR`). Branch on it without a null
check.

The API also returns more specific codes, passed through unchanged:

| Code | Status | Meaning |
|:-----|:-------|:--------|
| `SenderEmailRequired` | 400 | No sender email resolvable. TurboSign: set `senderEmail` on the request. TurboQuote: configure one on the org quote template (Quote Settings). |
| `SenderNameRequired` | 400 | No sender name resolvable — the API key has no usable name. |
| `QuoteHasNoLineItems` | 400 | The quote has no line items. Add at least one before sending. |
| `QuoteExpired` | 400 | The quote is past its `validUntil` date. |
| `QuoteValidUntilRequired` | 400 | The quote has no `validUntil` date set. |
| `QuoteNotSendable` | 400 | Only draft quotes can be sent. |
| `QuoteContactRequired` | 400 | The quote's contact is missing a name or email. |
| `QuoteCustomerInactive` | 400 | The quote's company or contact was deleted or deactivated. |

Error **messages** carry the actionable reason, not a generic envelope — multiple field errors
are joined with `"; "`, e.g. `"name" is not allowed to be empty; "companyId" must be a valid GUID`.

## Requirements

- Ruby 2.7+
- Zero runtime dependencies — the SDK uses only the Ruby standard library (`net/http`, `json`, `openssl`)

---

## Related Packages

| Package | Description |
|:--------|:------------|
| [@turbodocx/sdk (JavaScript)](../js-sdk) | JavaScript/TypeScript SDK |
| [turbodocx-sdk (Python)](../py-sdk) | Python SDK |
| [turbodocx (Go)](../go-sdk) | Go SDK |
| [@turbodocx/n8n-nodes-turbodocx](https://www.npmjs.com/package/@turbodocx/n8n-nodes-turbodocx) | n8n community nodes |

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
