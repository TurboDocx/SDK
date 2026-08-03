[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/py-sdk/banner.png)](https://www.turbodocx.com)

<div align="center">

# turbodocx-sdk

**Official Python SDK for TurboDocx**

The most developer-friendly **DocuSign & PandaDoc alternative** for **e-signatures** and **document generation**. Send documents for signature and automate document workflows programmatically.

[![PyPI Version](https://img.shields.io/pypi/v/turbodocx-sdk.svg)](https://pypi.org/project/turbodocx-sdk/)
[![PyPI Downloads](https://img.shields.io/pypi/dm/turbodocx-sdk)](https://pypi.org/project/turbodocx-sdk/)
[![Python Versions](https://img.shields.io/pypi/pyversions/turbodocx-sdk)](https://pypi.org/project/turbodocx-sdk/)
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
| `/turbodocx-sdk turboquote` | Build and send interactive price quotes with line items and price books |

The skill auto-detects your framework (FastAPI, Flask, Django, …) and follows your existing project conventions. Source: [github.com/TurboDocx/quickstart](https://github.com/TurboDocx/quickstart).

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
- ⚡ **Async-First** — Native asyncio support with `httpx`
- 🐍 **Pythonic API** — Idiomatic Python with type hints throughout
- 📝 **Full Type Hints** — Complete type annotations for IDE support
- 🤖 **100% n8n Parity** — Same operations as our n8n community nodes

---

## Installation

```bash
pip install turbodocx-sdk
```

<details>
<summary>Other package managers</summary>

```bash
# Poetry
poetry add turbodocx-sdk

# Pipenv
pipenv install turbodocx-sdk

# Conda
conda install -c conda-forge turbodocx-sdk
```
</details>

---

## Install via AI Agent Skill

Let an AI coding agent set up this SDK for you with the [TurboDocx Quickstart Agent Skill](https://github.com/TurboDocx/quickstart):

```bash
npx skills add TurboDocx/quickstart
```

Works with Claude Code, GitHub Copilot, Cursor, OpenCode, and other AI coding agents. The skill detects your language, installs the package, and generates working integration code.

---

## Quick Start

### Async (Recommended)

```python
import asyncio
import os
from turbodocx_sdk import TurboSign

async def main():
    # 1. Configure with your API key and sender information
    TurboSign.configure(
        api_key=os.getenv("TURBODOCX_API_KEY"),
        org_id=os.getenv("TURBODOCX_ORG_ID"),
        sender_email=os.getenv("TURBODOCX_SENDER_EMAIL"),  # REQUIRED
        sender_name=os.getenv("TURBODOCX_SENDER_NAME")      # OPTIONAL (but strongly recommended)
    )

    # 2. Send a document for signature
    with open("contract.pdf", "rb") as f:
        pdf_file = f.read()

    result = await TurboSign.send_signature(
        file=pdf_file,
        document_name="Partnership Agreement",
        recipients=[
            {"name": "John Doe", "email": "john@example.com", "signingOrder": 1}
        ],
        fields=[
            {
                "type": "signature",
                "recipientEmail": "john@example.com",
                "template": {"anchor": "{signature1}", "placement": "replace", "size": {"width": 100, "height": 30}}
            }
        ]
    )

    print(f"Document ID: {result['documentId']}")

asyncio.run(main())
```

### Sync (via asyncio.run)

```python
import asyncio
from turbodocx_sdk import TurboSign

TurboSign.configure(
    api_key="your-api-key",
    org_id="your-org-id",
    sender_email="you@company.com"
)

result = asyncio.run(TurboSign.send_signature(
    file_link="https://example.com/contract.pdf",
    recipients=[{"name": "John Doe", "email": "john@example.com", "signingOrder": 1}],
    fields=[{"type": "signature", "page": 1, "x": 100, "y": 500, "width": 200, "height": 50, "recipientEmail": "john@example.com"}]
))
```

---

## Configuration

```python
from turbodocx_sdk import TurboSign
import os

# Basic configuration (REQUIRED)
TurboSign.configure(
    api_key="your-api-key",           # REQUIRED
    org_id="your-org-id",             # REQUIRED
    sender_email="you@company.com",   # REQUIRED - reply-to address for signature requests
    sender_name="Your Company"        # OPTIONAL but strongly recommended
)

# With environment variables (recommended)
TurboSign.configure(
    api_key=os.environ["TURBODOCX_API_KEY"],
    org_id=os.environ["TURBODOCX_ORG_ID"],
    sender_email=os.environ["TURBODOCX_SENDER_EMAIL"],
    sender_name=os.environ["TURBODOCX_SENDER_NAME"]
)

# With custom base URL
TurboSign.configure(
    api_key=os.environ["TURBODOCX_API_KEY"],
    org_id=os.environ["TURBODOCX_ORG_ID"],
    sender_email=os.environ["TURBODOCX_SENDER_EMAIL"],
    sender_name=os.environ["TURBODOCX_SENDER_NAME"],
    base_url="https://custom-api.example.com",  # Optional
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

```python
from dotenv import load_dotenv
import os
load_dotenv()

TurboSign.configure(
    api_key=os.environ["TURBODOCX_API_KEY"],
    org_id=os.environ["TURBODOCX_ORG_ID"],
    sender_email=os.environ["TURBODOCX_SENDER_EMAIL"],
    sender_name=os.environ["TURBODOCX_SENDER_NAME"]
)
```

---

## API Reference

### TurboSign

#### `create_signature_review_link()`

Upload a document for review without sending signature emails.

```python
result = await TurboSign.create_signature_review_link(
    file_link="https://example.com/contract.pdf",
    recipients=[
        {"name": "John Doe", "email": "john@example.com", "signingOrder": 1}
    ],
    fields=[
        {"type": "signature", "page": 1, "x": 100, "y": 500, "width": 200, "height": 50, "recipientEmail": "john@example.com"}
    ],
    document_name="Service Agreement",        # Optional
    document_description="Q4 Contract",       # Optional
    sender_name="Acme Corp",                  # Optional
    sender_email="contracts@acme.com",        # Optional
    cc_emails=["legal@acme.com"]              # Optional
)

print(f"Preview URL: {result['previewUrl']}")
print(f"Document ID: {result['documentId']}")
```

#### `send_signature()`

Upload a document and immediately send signature request emails.

```python
result = await TurboSign.send_signature(
    file_link="https://example.com/contract.pdf",
    recipients=[
        {"name": "Alice", "email": "alice@example.com", "signingOrder": 1},
        {"name": "Bob", "email": "bob@example.com", "signingOrder": 2}
    ],
    fields=[
        {"type": "signature", "recipientEmail": "alice@example.com", "page": 1, "x": 100, "y": 500, "width": 200, "height": 50},
        {"type": "signature", "recipientEmail": "bob@example.com", "page": 1, "x": 100, "y": 600, "width": 200, "height": 50}
    ]
)

for recipient in result["recipients"]:
    print(f"{recipient['name']}: {recipient['signUrl']}")
```

#### `get_status()`

Check the document-level status. For per-recipient detail, use `get_recipients()`.

```python
status = await TurboSign.get_status("doc-uuid-here")

print(f"Status: {status['status']}")  # 'under_review', 'completed', 'voided', ...
```

#### `get_recipients()`

See who the document went to, who has signed, who you are still waiting on, and who sent it.

```python
result = await TurboSign.get_recipients("doc-uuid-here")

sender = result["document"]["sentBy"]
print(f"Sent by {sender['name']} <{sender['email']}>")

summary = result["summary"]
print(f"{summary['completed']} of {summary['total']} signed, {summary['pending']} not started")

for r in result["recipients"]:
    # 'pending' | 'viewed' | 'completed'
    print(f"{r['name']} <{r['email']}>: {r['status']}")
    if r["signedOn"]:
        print(f"  signed {r['signedOn']}")

# Who are we chasing?
waiting_on = [r for r in result["recipients"] if r["status"] != "completed"]
```

> **Overlay the document status.** Recipient status is only `pending` / `viewed` / `completed` —
> there is no per-recipient declined or expired state. On a voided or expired document every
> unsigned recipient still reads `pending`, so check `result["document"]["status"]` before
> treating someone as "still to sign".

#### `download()`

Download the signed document.

```python
pdf_bytes = await TurboSign.download("doc-uuid-here")

# Save to file
with open("signed-contract.pdf", "wb") as f:
    f.write(pdf_bytes)
```

#### `void_document()`

Cancel a signature request.

```python
await TurboSign.void_document("doc-uuid-here", reason="Contract terms changed")
```

#### `resend_email()`

Resend signature request emails.

```python
await TurboSign.resend_email("doc-uuid-here", recipient_ids=["recipient-uuid-1"])
```

#### `get_audit_trail()`

Get the complete audit trail for a document, including all events and timestamps.

```python
audit = await TurboSign.get_audit_trail("doc-uuid-here")

print(f"Document: {audit['document']['name']}")

for entry in audit["auditTrail"]:
    print(f"{entry['actionType']} - {entry['timestamp']}")
    if entry.get("user"):
        print(f"  By: {entry['user']['name']} ({entry['user']['email']})")
    if entry.get("recipient"):
        print(f"  Recipient: {entry['recipient']['name']}")
```

The audit trail includes a cryptographic hash chain for tamper-evidence verification.

---

### TurboPartner

Partner management for multi-tenant applications — manage organizations, users, API keys, and entitlements.

#### Configuration

```python
from turbodocx_sdk import TurboPartner
import os

TurboPartner.configure(
    partner_api_key=os.environ["TURBODOCX_PARTNER_API_KEY"],  # starts with TDXP-
    partner_id=os.environ["TURBODOCX_PARTNER_ID"],
)
```

#### Organization Management

```python
# Create an organization with entitlements
org = await TurboPartner.create_organization(
    "Acme Corporation",
    features={"maxUsers": 25, "maxSignatures": 500, "hasTDAI": True}
)
org_id = org["data"]["id"]

# List organizations
orgs = await TurboPartner.list_organizations(limit=10, search="acme")

# Get organization details (includes features + usage tracking)
details = await TurboPartner.get_organization_details(org_id)

# Update entitlements
await TurboPartner.update_organization_entitlements(
    org_id, features={"maxUsers": 50}
)

# Delete organization
await TurboPartner.delete_organization(org_id)
```

#### Organization User & API Key Management

```python
# Add user to organization
user = await TurboPartner.add_user_to_organization(
    org_id, email="admin@acme.com", role="admin"
)

# Create organization API key
api_key = await TurboPartner.create_organization_api_key(
    org_id, name="Production Key", role="admin"
)
print(api_key["data"]["key"])  # TDX-... (only shown once)
```

#### Partner API Keys & Users

```python
from turbodocx_sdk import SCOPE_ORG_READ, SCOPE_AUDIT_READ

# Create scoped partner API key
key = await TurboPartner.create_partner_api_key(
    name="Read-Only Key",
    scopes=[SCOPE_ORG_READ, SCOPE_AUDIT_READ]
)

# Add user to partner portal.
# All 7 permission keys are REQUIRED — a partial permissions object is a 400.
await TurboPartner.add_user_to_partner_portal(
    email="ops@company.com",
    role="member",  # partner roles: "admin" | "member" | "viewer"
    permissions={
        "canManageOrgs": True,
        "canManageOrgUsers": True,
        "canManagePartnerUsers": False,
        "canManageOrgAPIKeys": False,
        "canManagePartnerAPIKeys": False,
        "canUpdateEntitlements": False,
        "canViewAuditLogs": True,
    },
)

# Query audit logs
logs = await TurboPartner.get_partner_audit_logs(limit=10)
```

#### All 25 Methods

| Category | Method |
|:---------|:-------|
| **Organizations** | `create_organization()`, `list_organizations()`, `get_organization_details()`, `update_organization_info()`, `delete_organization()`, `update_organization_entitlements()` |
| **Org Users** | `add_user_to_organization()`, `list_organization_users()`, `update_organization_user_role()`, `remove_user_from_organization()`, `resend_organization_invitation_to_user()` |
| **Org API Keys** | `create_organization_api_key()`, `list_organization_api_keys()`, `update_organization_api_key()`, `revoke_organization_api_key()` |
| **Partner API Keys** | `create_partner_api_key()`, `list_partner_api_keys()`, `update_partner_api_key()`, `revoke_partner_api_key()` |
| **Partner Users** | `add_user_to_partner_portal()`, `list_partner_portal_users()`, `update_partner_user_permissions()`, `remove_user_from_partner_portal()`, `resend_partner_portal_invitation_to_user()` |
| **Audit Logs** | `get_partner_audit_logs()` |

---

### TurboWebhooks (Signature Webhook)

The `TurboWebhooks` module manages your organization's **signature webhook** — a single subscription to TurboDocx signature events. It also exposes a `verify_webhook_signature` helper for incoming webhook receivers.

> **One webhook per org.** The SDK manages a single fixed-name webhook (`signature`) per org so SDK-managed and UI-managed webhooks stay in sync — what you create here also appears in the dashboard's Signature Webhooks settings page. To manage multiple webhooks per org, call the REST API directly.
>
> **Requires administrator role.** All webhook routes require an admin TDX- API key.

#### The 7 signature events

Import the constants instead of hand-writing the wire strings — a typo becomes an import error rather than a webhook that silently never fires.

| Event | Constant | Fires when |
|---|---|---|
| `signature.document.sent` | `WEBHOOK_EVENT_SENT` | The document is dispatched to recipients |
| `signature.document.viewed` | `WEBHOOK_EVENT_VIEWED` | A recipient opens the document for the first time |
| `signature.document.recipient_signed` | `WEBHOOK_EVENT_RECIPIENT_SIGNED` | Any individual signer completes their signature — fires **once per signer**, and carries `is_final_signer` + `remaining_signers` |
| `signature.document.signed` | `WEBHOOK_EVENT_SIGNED` | A signer signs but the document is **not yet complete** (document-level partial progress) |
| `signature.document.completed` | `WEBHOOK_EVENT_COMPLETED` | All recipients have signed and the signed PDF is finalized |
| `signature.document.finalization_failed` | `WEBHOOK_EVENT_FINALIZATION_FAILED` | The signed PDF fails to finalize (e.g. a KMS signing error); the document is **not** completed |
| `signature.document.voided` | `WEBHOOK_EVENT_VOIDED` | The document is voided or cancelled |

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

`WEBHOOK_EVENTS` is a tuple of all 7 wire strings if you want to subscribe to everything. `events` stays a plain `list[str]`, so the backend can add events without an SDK release.

#### Configuration

```python
import os
from turbodocx_sdk import TurboWebhooks

TurboWebhooks.configure(
    api_key=os.environ["TURBODOCX_API_KEY"],
    org_id=os.environ["TURBODOCX_ORG_ID"],
    # base_url="http://localhost:3000",  # optional; defaults to https://api.turbodocx.com
)
```

Unlike `TurboSign`, `TurboWebhooks` does NOT require `sender_email` — webhook routes don't send signature emails.

#### Create the signature webhook (save the secret immediately)

```python
from turbodocx_sdk import (
    TurboWebhooks,
    WEBHOOK_EVENTS,
    WEBHOOK_EVENT_COMPLETED,
    WEBHOOK_EVENT_RECIPIENT_SIGNED,
    WEBHOOK_EVENT_SENT,
    WEBHOOK_EVENT_VIEWED,
    WEBHOOK_EVENT_VOIDED,
)

created = await TurboWebhooks.create_webhook(
    urls=["https://your-server.example.com/webhooks/turbodocx"],  # HTTPS only
    events=[
        WEBHOOK_EVENT_SENT,
        WEBHOOK_EVENT_VIEWED,
        WEBHOOK_EVENT_RECIPIENT_SIGNED,
        WEBHOOK_EVENT_COMPLETED,
        WEBHOOK_EVENT_VOIDED,
    ],
    # ...or subscribe to everything: events=list(WEBHOOK_EVENTS)
)
# `secret` is shown ONCE here. Store it securely; it cannot be retrieved later.
print(f"Save this secret: {created['secret']}")
```

If the signature webhook already exists, `create_webhook` raises `ValidationError`. Either update the existing one with `update_webhook` or `delete_webhook` first.

#### Get, update, delete

```python
webhook = await TurboWebhooks.get_webhook()
# `webhook["deliveryStats"]` and `webhook["availableEvents"]` are included

await TurboWebhooks.update_webhook(is_active=False)
await TurboWebhooks.delete_webhook()
```

#### Test deliveries and replay

```python
tested = await TurboWebhooks.test_webhook(
    event_type="signature.document.completed",
    payload={"documentId": "doc-xyz", "status": "completed"},
)
print(tested["summary"])  # {"total": ..., "successful": ..., "failed": ...}

deliveries = await TurboWebhooks.list_webhook_deliveries(limit=10)
replayed = await TurboWebhooks.replay_webhook_delivery(deliveries["results"][0]["id"])
```

#### Rotate the secret

```python
rotated = await TurboWebhooks.regenerate_webhook_secret()
# `rotated["secret"]` is the new secret. Old signatures will fail immediately.
```

#### Aggregate stats

```python
stats = await TurboWebhooks.get_webhook_stats(days=30)
print(stats["summary"]["successRate"], stats["eventBreakdown"])
```

#### Verify incoming webhook signatures (FastAPI example)

Webhook deliveries from TurboDocx are signed with HMAC-SHA256 over `f"{timestamp}.{raw_body}"` using your webhook secret. Use `verify_webhook_signature` in your receiver:

```python
import os
from fastapi import FastAPI, Header, HTTPException, Request
from turbodocx_sdk import verify_webhook_signature

app = FastAPI()

@app.post("/webhooks/turbodocx")
async def turbodocx_webhook(
    request: Request,
    x_turbodocx_signature: str = Header(...),
    x_turbodocx_timestamp: str = Header(...),
):
    # CRITICAL: read raw bytes. Do NOT use `request.json()` first — the signature
    # is over the exact bytes; re-serialization breaks verification.
    raw_body = await request.body()
    secret = os.environ["TURBODOCX_WEBHOOK_SECRET"]

    if not verify_webhook_signature(
        raw_body, x_turbodocx_signature, x_turbodocx_timestamp, secret
    ):
        raise HTTPException(status_code=401, detail="invalid signature")

    # Now safe to parse and process
    import json
    event = json.loads(raw_body)
    # ... process event ...
    return {"ok": True}
```

By default the helper enforces a 300-second timestamp tolerance to prevent replay attacks. Override with `tolerance_seconds=N` (0 disables the check — not recommended in production).

---

### TurboQuote (CPQ — Configure, Price, Quote)

The `TurboQuote` module manages your organization's full quoting workflow: products, bundles, price books, companies, contacts, and interactive PDF quotes.

> **No `sender_email` on the client.** Unlike `TurboSign`, `TurboQuote` takes no per-request sender — but sending a quote *does* create a signature request and email the recipient. The sender comes from your organization's quote template (Quote Settings); configure one there, or create/duplicate/send is rejected with `400 SenderEmailRequired`. Only `api_key` and `org_id` are needed on the client.

#### Configuration

```python
import os
from turbodocx_sdk import TurboQuote

TurboQuote.configure(
    api_key=os.environ["TURBODOCX_API_KEY"],
    org_id=os.environ["TURBODOCX_ORG_ID"],
    # base_url="http://localhost:3000",  # optional
)
```

#### Create a quote, add line items, and send

```python
import asyncio

async def main():
    # 1. Create a quote
    quote = await TurboQuote.create_quote({
        "name": "Enterprise License Q3",
        "companyId": "company-uuid",
        "contactId": "contact-uuid",
        "currency": "USD",
        "termDays": 30,
    })

    # 2. Add a custom line item (single dict auto-wrapped to array)
    #    No catalog product → productId must be present and explicitly None
    items = await TurboQuote.add_line_items(quote["id"], {
        "productId": None,
        "productName": "Platform License",
        "unitPrice": 500.00,
        "billingFrequency": "monthly",
        "quantity": 10,
        "discountType": "percent",
        "discountPercent": 15,
    })

    # 3. Send the quote
    result = await TurboQuote.send_quote(quote["id"])
    print(f"Sent: {result['quote']['status']}")  # sent

asyncio.run(main())
```

#### Download the quote as PDF

```python
pdf_bytes = await TurboQuote.download_quote_pdf(quote_id)
with open("quote.pdf", "wb") as f:
    f.write(pdf_bytes)
```

#### Sender identity — "Prepared by"

The quote's **"Prepared by"** name and email are resolved by the server, not by whoever
downloads or sends the quote. Precedence: the org **quote template's** sender fields first,
then the quote's **creator**.

A quote created with an **API key** has no mailbox of its own — so its sender email can only
come from the quote template. **If your org's quote template has no sender email set,
`create_quote` (and `duplicate_quote`) raise `ValidationError` (`400 SenderEmailRequired`)**
for an API-key caller. Set a sender email on the template once (via
`TurboQuote.update_template(id, {"senderEmail": ..., "senderName": ...})`) and every subsequent
create/duplicate/send resolves cleanly. Human (JWT) callers are never blocked — their own email
is the fallback.

`get_quote` returns the resolved identity under `preparedBy` — **prefer it over `creator`** for
any customer-facing display (`creator` may be the internal API service account):

```python
quote = await TurboQuote.get_quote(quote_id)
prepared = quote.get("preparedBy") or {}
print(prepared.get("name"))   # e.g. "Acme Billing Integration" or the template sender
print(prepared.get("email"))  # may be absent for an API-created quote — render a placeholder
```

#### All 47 methods

| Group | Methods |
|:------|:--------|
| **Quotes** | `list_quotes()`, `create_quote()`, `get_quote()`, `update_quote()`, `delete_quote()`, `duplicate_quote()` |
| **Quote status** | `send_quote()`, `send_quote_with_deliverable()`, `decline_quote()`, `void_quote()`, `handle_expired_quote()` |
| **Price book ops** | `apply_price_book()`, `remove_price_book()`, `download_quote_pdf()` |
| **Line items** | `list_line_items()`, `add_line_items()`, `add_bundle_line_items()`, `update_line_item()`, `remove_line_item()` |
| **Products** | `list_products()`, `create_product()`, `get_product()`, `update_product()`, `delete_product()`, `duplicate_product()`, `get_product_primary_images()` |
| **Price books** | `list_price_books()`, `create_price_book()`, `get_price_book()`, `update_price_book()`, `delete_price_book()`, `duplicate_price_book()`, `list_price_book_products()` |
| **Bundles** | `list_bundles()`, `create_bundle()`, `get_bundle()`, `update_bundle()`, `delete_bundle()`, `duplicate_bundle()` |
| **Companies** | `list_companies()`, `create_company()`, `get_company()`, `update_company()`, `delete_company()`, `list_company_contacts()` |
| **Contacts** | `list_contacts()`, `create_contact()`, `update_contact()`, `delete_contact()` |
| **Templates** | `list_templates()`, `get_template()`, `get_template_by_id()`, `create_template()`, `update_template()`, `delete_template()` |
| **Types** | `list_types()`, `create_type()`, `update_type()`, `delete_type()` |
| **Convenience** | `create_and_send()` |

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

## Examples

For complete, working examples including template anchors, advanced field types, and various workflows, see the [`examples/`](./examples/) directory:

- [`turbosign_send_simple.py`](./examples/turbosign_send_simple.py) - Send document directly with template anchors
- [`turbosign_basic.py`](./examples/turbosign_basic.py) - Create review link first, then send manually
- [`turbosign_advanced.py`](./examples/turbosign_advanced.py) - Advanced field types (checkbox, readonly, multiline text, etc.)
- [`turbopartner_basic.py`](./examples/turbopartner_basic.py) - Full organization lifecycle (create org, add users, create API keys)
- [`turbopartner_api_keys.py`](./examples/turbopartner_api_keys.py) - Partner API keys, portal users, and audit logs
- [`turboquote_basic.py`](./examples/turboquote_basic.py) - Full quote lifecycle (company, contact, quote, line items, PDF download)
- [`turboquote_products.py`](./examples/turboquote_products.py) - Product and bundle catalog management
- [`turboquote_pricebooks.py`](./examples/turboquote_pricebooks.py) - Price book CRUD, apply to quote, optional send-with-deliverable

### Sequential Signing

```python
result = await TurboSign.send_signature(
    file_link="https://example.com/contract.pdf",
    recipients=[
        {"name": "Employee", "email": "employee@company.com", "signingOrder": 1},
        {"name": "Manager", "email": "manager@company.com", "signingOrder": 2},
        {"name": "HR", "email": "hr@company.com", "signingOrder": 3}
    ],
    fields=[
        # Employee signs first
        {"type": "signature", "recipientEmail": "employee@company.com", "page": 1, "x": 100, "y": 400, "width": 200, "height": 50},
        {"type": "date", "recipientEmail": "employee@company.com", "page": 1, "x": 320, "y": 400, "width": 100, "height": 30},
        # Manager signs second
        {"type": "signature", "recipientEmail": "manager@company.com", "page": 1, "x": 100, "y": 500, "width": 200, "height": 50},
        # HR signs last
        {"type": "signature", "recipientEmail": "hr@company.com", "page": 1, "x": 100, "y": 600, "width": 200, "height": 50}
    ]
)
```

### Polling for Completion

```python
import asyncio

async def wait_for_completion(document_id: str, max_attempts: int = 60):
    for _ in range(max_attempts):
        status = await TurboSign.get_status(document_id)

        if status["status"] == "completed":
            return await TurboSign.download(document_id)

        if status["status"] == "voided":
            raise Exception("Document was voided")

        await asyncio.sleep(30)  # Wait 30 seconds

    raise TimeoutError("Timeout waiting for signatures")
```

### With FastAPI

```python
from fastapi import FastAPI, HTTPException
from turbodocx_sdk import TurboSign
import os

app = FastAPI()
TurboSign.configure(
    api_key=os.environ["TURBODOCX_API_KEY"],
    org_id=os.environ["TURBODOCX_ORG_ID"],
    sender_email=os.environ["TURBODOCX_SENDER_EMAIL"],
)

@app.post("/api/send-contract")
async def send_contract(pdf_url: str, recipients: list, fields: list):
    try:
        result = await TurboSign.send_signature(
            file_link=pdf_url,
            recipients=recipients,
            fields=fields
        )
        return {"success": True, "document_id": result["documentId"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### With Django

```python
import asyncio
from django.http import JsonResponse
from turbodocx_sdk import TurboSign
import os

TurboSign.configure(
    api_key=os.environ["TURBODOCX_API_KEY"],
    org_id=os.environ["TURBODOCX_ORG_ID"],
    sender_email=os.environ["TURBODOCX_SENDER_EMAIL"],
)

def send_contract(request):
    result = asyncio.run(TurboSign.send_signature(
        file_link=request.POST["pdf_url"],
        recipients=request.POST["recipients"],
        fields=request.POST["fields"]
    ))
    return JsonResponse({"document_id": result["documentId"]})
```

---

## Local Testing

The SDK includes a comprehensive manual test script to verify all functionality locally.

### Running Manual Tests

```bash
# Install dependencies
pip install -e .

# Run the manual test script
python manual_test.py
```

### What It Tests

The `manual_test.py` file tests all SDK methods:
- ✅ `create_signature_review_link()` - Document upload for review
- ✅ `send_signature()` - Send for signature
- ✅ `get_status()` - Check document status
- ✅ `get_recipients()` - Per-recipient signing status (who signed, who is pending)
- ✅ `download()` - Download signed document
- ✅ `void_document()` - Cancel signature request
- ✅ `resend_email()` - Resend signature emails
- ✅ `get_audit_trail()` - Get document audit trail

### Configuration

Before running, update the hardcoded values in `manual_test.py`:
- `API_KEY` - Your TurboDocx API key
- `BASE_URL` - API endpoint (default: `http://localhost:3000`)
- `ORG_ID` - Your organization UUID
- `TEST_PDF_PATH` - Path to a test PDF/DOCX file
- `TEST_EMAIL` - Email address for testing

### Expected Output

The script will:
1. Upload a test document
2. Send it for signature
3. Check the status
4. Test void and resend operations
5. Print results for each operation

---

## Error Handling

```python
from turbodocx_sdk import TurboSign, TurboDocxError

try:
    await TurboSign.get_status("invalid-id")
except TurboDocxError as e:
    print(f"Status: {e.status_code}")
    print(f"Message: {e}")
    print(f"Code: {e.code}")
except Exception as e:
    print(f"Unexpected error: {e}")
```

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

### Common Error Codes

| Status | Meaning |
|:-------|:--------|
| `400` | Bad request — check your parameters |
| `401` | Unauthorized — check your API key |
| `404` | Document not found |
| `429` | Rate limited — slow down requests |
| `500` | Server error — retry with backoff |

---

## Type Hints

The SDK includes type hints throughout for IDE autocompletion:

```python
from turbodocx_sdk import TurboSign, TurboPartner, TurboDocxError
from typing import Dict, List, Any

# All methods have full type annotations
result: Dict[str, Any] = await TurboSign.get_status("doc-uuid-here")

# Scope constants are typed strings
from turbodocx_sdk import SCOPE_ORG_READ, SCOPE_AUDIT_READ
scopes: List[str] = [SCOPE_ORG_READ, SCOPE_AUDIT_READ]
```

---

## Requirements

- Python 3.9+
- httpx (async HTTP client)

---

## Related Packages

| Package | Description |
|:--------|:------------|
| [@turbodocx/sdk (JS)](../js-sdk) | JavaScript/TypeScript SDK |
| [turbodocx (Go)](../go-sdk) | Go SDK |
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

[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/py-sdk/footer.png)](https://www.turbodocx.com)

</div>
