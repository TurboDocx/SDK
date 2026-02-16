[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/py-sdk/banner.png)](https://www.turbodocx.com)

<div align="center">

# turbodocx-sdk

**Official Python SDK for TurboDocx**

The most developer-friendly **DocuSign & PandaDoc alternative** for **e-signatures** and **document generation**. Send documents for signature and automate document workflows programmatically.

[![PyPI Version](https://img.shields.io/pypi/v/turbodocx-sdk.svg)](https://pypi.org/project/turbodocx-sdk/)
[![PyPI Downloads](https://img.shields.io/pypi/dm/turbodocx-sdk)](https://pypi.org/project/turbodocx-sdk/)
[![Python Versions](https://img.shields.io/pypi/pyversions/turbodocx-sdk)](https://pypi.org/project/turbodocx-sdk/)
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
- ⚡ **Async-First** — Native asyncio support with sync wrappers available
- 🐍 **Pythonic API** — Idiomatic Python with type hints throughout
- 📝 **Full Type Hints** — Complete type annotations for IDE support
- 🛡️ **Pydantic Models** — Validated request/response models
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

### Sync

```python
from turbodocx_sdk import TurboSignSync

TurboSignSync.configure(api_key="your-api-key")

result = TurboSignSync.send_signature(
    file_link="https://example.com/contract.pdf",
    recipients=[{"name": "John Doe", "email": "john@example.com", "signingOrder": 1}],
    fields=[{"type": "signature", "page": 1, "x": 100, "y": 500, "width": 200, "height": 50, "recipientOrder": 1}]
)
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

# With custom options
TurboSign.configure(
    api_key=os.environ["TURBODOCX_API_KEY"],
    org_id=os.environ["TURBODOCX_ORG_ID"],
    sender_email=os.environ["TURBODOCX_SENDER_EMAIL"],
    sender_name=os.environ["TURBODOCX_SENDER_NAME"],
    base_url="https://custom-api.example.com",  # Optional
    timeout=30.0,                                # Optional: seconds
)
```

**Important:** `sender_email` is **REQUIRED**. This email will be used as the reply-to address for signature request emails. Without it, emails will default to "API Service User via TurboSign". The `sender_name` is optional but strongly recommended for a professional appearance.

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

Check the current status of a document.

```python
status = await TurboSign.get_status("doc-uuid-here")

print(f"Status: {status['status']}")  # 'pending', 'completed', 'voided'

for recipient in status["recipients"]:
    print(f"{recipient['name']}: {recipient['status']}")
```

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

# Add user to partner portal
await TurboPartner.add_user_to_partner_portal(
    email="ops@company.com",
    role="member",
    permissions={"canManageOrgs": True, "canViewAuditLogs": True}
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
TurboSign.configure(api_key=os.environ["TURBODOCX_API_KEY"])

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
from django.http import JsonResponse
from turbodocx_sdk import TurboSignSync
import os

TurboSignSync.configure(api_key=os.environ["TURBODOCX_API_KEY"])

def send_contract(request):
    result = TurboSignSync.send_signature(
        file_link=request.POST["pdf_url"],
        recipients=request.POST["recipients"],
        fields=request.POST["fields"]
    )
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
- ✅ `download()` - Download signed document
- ✅ `void_document()` - Cancel signature request
- ✅ `resend_email()` - Resend signature emails

### Configuration

Before running, update the hardcoded values in `manual_test.py`:
- `API_KEY` - Your TurboDocx API key
- `BASE_URL` - API endpoint (default: `http://localhost:3000`)
- `ORG_ID` - Your organization UUID
- `TEST_FILE_PATH` - Path to a test PDF/DOCX file
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
    print(f"Message: {e.message}")
    print(f"Code: {e.code}")
except Exception as e:
    print(f"Unexpected error: {e}")
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

## Type Hints

Full type hint support for IDE autocompletion:

```python
from turbodocx_sdk import TurboSign
from turbodocx_sdk.types import (
    PrepareForSigningOptions,
    Recipient,
    Field,
    DocumentStatus
)

recipients: list[Recipient] = [
    {"name": "John", "email": "john@example.com", "order": 1}
]

fields: list[Field] = [
    {"type": "signature", "page": 1, "x": 100, "y": 500, "width": 200, "height": 50, "recipientOrder": 1}
]
```

---

## Requirements

- Python 3.9+
- aiohttp (for async)
- requests (for sync)

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
