[![TurboDocx](./banner.png)](https://www.turbodocx.com)

<div align="center">

# turbodocx-sdk

**Official Python SDK for TurboDocx**

[![PyPI Version](https://img.shields.io/pypi/v/turbodocx-sdk.svg)](https://pypi.org/project/turbodocx-sdk/)
[![PyPI Downloads](https://img.shields.io/pypi/dm/turbodocx-sdk)](https://pypi.org/project/turbodocx-sdk/)
[![Python Versions](https://img.shields.io/pypi/pyversions/turbodocx-sdk)](https://pypi.org/project/turbodocx-sdk/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[Documentation](https://www.turbodocx.com/docs) • [API Reference](https://www.turbodocx.com/docs/api) • [Examples](#examples) • [Discord](https://discord.gg/NYKwz4BcpX)

</div>

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

---

### TurboTemplate

Generate documents from templates with advanced variable substitution.

#### `TurboTemplate.configure()`

Configure the TurboTemplate module (same configuration as TurboSign).

```python
from turbodocx_sdk import TurboTemplate
import os

TurboTemplate.configure(
    api_key=os.environ["TURBODOCX_API_KEY"],
    org_id=os.environ["TURBODOCX_ORG_ID"],
)
```

#### `TurboTemplate.generate()`

Generate a document from a template with variables.

```python
result = await TurboTemplate.generate({
    "templateId": "your-template-uuid",
    "name": "Generated Contract",
    "description": "Contract for Q4 2024",
    "variables": [
        {"placeholder": "{customer_name}", "name": "customer_name", "value": "Acme Corp"},
        {"placeholder": "{contract_date}", "name": "contract_date", "value": "2024-01-15"},
        {"placeholder": "{total_amount}", "name": "total_amount", "value": 50000},
    ],
})

print(f"Document ID: {result['deliverableId']}")
```

#### Helper Functions

Use helper functions for cleaner variable creation:

```python
from turbodocx_sdk import TurboTemplate

result = await TurboTemplate.generate({
    "templateId": "invoice-template-uuid",
    "name": "Invoice #1234",
    "description": "Monthly invoice",
    "variables": [
        # Simple text/number variables
        TurboTemplate.create_simple_variable("invoice_number", "INV-2024-001"),
        TurboTemplate.create_simple_variable("total", 1500),

        # Advanced engine variable (access with dot notation: {customer.name}, {customer.address.city})
        TurboTemplate.create_advanced_engine_variable("customer", {
            "name": "Acme Corp",
            "email": "billing@acme.com",
            "address": {
                "street": "123 Main St",
                "city": "New York",
                "state": "NY",
            },
        }),

        # Arrays for loops ({#items}...{/items})
        TurboTemplate.create_loop_variable("items", [
            {"name": "Widget A", "quantity": 5, "price": 100},
            {"name": "Widget B", "quantity": 3, "price": 200},
        ]),

        # Conditionals ({#is_premium}...{/is_premium})
        TurboTemplate.create_conditional_variable("is_premium", True),

        # Images
        TurboTemplate.create_image_variable("logo", "https://example.com/logo.png"),
    ],
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

| Property | Type | Required | Description |
|:---------|:-----|:---------|:------------|
| `placeholder` | str | Yes | The placeholder in template (e.g., `{name}`) |
| `name` | str | Yes | Variable name for the templating engine |
| `value` | any | Yes* | The value to substitute |
| `mimeType` | str | Yes | `text`, `json`, `html`, `image`, `markdown` |
| `usesAdvancedTemplatingEngine` | bool | No | Enable for loops, conditionals, expressions |

*Either `value` or `text` must be provided.

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

- [`turbosign_send_simple.py`](./examples/turbosign_send_simple.py) - Send document directly with template anchors
- [`turbosign_basic.py`](./examples/turbosign_basic.py) - Create review link first, then send manually
- [`turbosign_advanced.py`](./examples/turbosign_advanced.py) - Advanced field types (checkbox, readonly, multiline text, etc.)

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
