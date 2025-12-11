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
from turbodocx_sdk import TurboSign

async def main():
    # 1. Configure with your API key
    TurboSign.configure(api_key="your-api-key")

    # 2. Send a document for signature
    result = await TurboSign.prepare_for_signing_single(
        file_link="https://example.com/contract.pdf",
        recipients=[
            {"name": "John Doe", "email": "john@example.com", "order": 1}
        ],
        fields=[
            {"type": "signature", "page": 1, "x": 100, "y": 500, "width": 200, "height": 50, "recipientOrder": 1}
        ]
    )

    print(f"Sign URL: {result['recipients'][0]['signUrl']}")

asyncio.run(main())
```

### Sync

```python
from turbodocx_sdk import TurboSignSync

TurboSignSync.configure(api_key="your-api-key")

result = TurboSignSync.prepare_for_signing_single(
    file_link="https://example.com/contract.pdf",
    recipients=[{"name": "John Doe", "email": "john@example.com", "order": 1}],
    fields=[{"type": "signature", "page": 1, "x": 100, "y": 500, "width": 200, "height": 50, "recipientOrder": 1}]
)
```

---

## Configuration

```python
from turbodocx_sdk import TurboSign
import os

# Basic configuration
TurboSign.configure(api_key="your-api-key")

# With environment variable (recommended)
TurboSign.configure(api_key=os.environ["TURBODOCX_API_KEY"])

# With custom options
TurboSign.configure(
    api_key=os.environ["TURBODOCX_API_KEY"],
    base_url="https://custom-api.example.com",  # Optional
    timeout=30.0,                                # Optional: seconds
)
```

### Environment Variables

```bash
# .env
TURBODOCX_API_KEY=your-api-key
```

```python
from dotenv import load_dotenv
load_dotenv()

TurboSign.configure(api_key=os.environ["TURBODOCX_API_KEY"])
```

---

## API Reference

### TurboSign

#### `prepare_for_review()`

Upload a document for review without sending signature emails.

```python
result = await TurboSign.prepare_for_review(
    file_link="https://example.com/contract.pdf",
    recipients=[
        {"name": "John Doe", "email": "john@example.com", "order": 1}
    ],
    fields=[
        {"type": "signature", "page": 1, "x": 100, "y": 500, "width": 200, "height": 50, "recipientOrder": 1}
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

#### `prepare_for_signing_single()`

Upload a document and immediately send signature request emails.

```python
result = await TurboSign.prepare_for_signing_single(
    file_link="https://example.com/contract.pdf",
    recipients=[
        {"name": "Alice", "email": "alice@example.com", "order": 1},
        {"name": "Bob", "email": "bob@example.com", "order": 2}
    ],
    fields=[
        {"type": "signature", "page": 1, "x": 100, "y": 500, "width": 200, "height": 50, "recipientOrder": 1},
        {"type": "signature", "page": 1, "x": 100, "y": 600, "width": 200, "height": 50, "recipientOrder": 2}
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

#### `void()`

Cancel a signature request.

```python
await TurboSign.void("doc-uuid-here", reason="Contract terms changed")
```

#### `resend()`

Resend signature request emails.

```python
await TurboSign.resend("doc-uuid-here", recipient_ids=["recipient-uuid-1"])
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

### Sequential Signing

```python
result = await TurboSign.prepare_for_signing_single(
    file_link="https://example.com/contract.pdf",
    recipients=[
        {"name": "Employee", "email": "employee@company.com", "order": 1},
        {"name": "Manager", "email": "manager@company.com", "order": 2},
        {"name": "HR", "email": "hr@company.com", "order": 3}
    ],
    fields=[
        # Employee signs first
        {"type": "signature", "page": 1, "x": 100, "y": 400, "width": 200, "height": 50, "recipientOrder": 1},
        {"type": "date", "page": 1, "x": 320, "y": 400, "width": 100, "height": 30, "recipientOrder": 1},
        # Manager signs second
        {"type": "signature", "page": 1, "x": 100, "y": 500, "width": 200, "height": 50, "recipientOrder": 2},
        # HR signs last
        {"type": "signature", "page": 1, "x": 100, "y": 600, "width": 200, "height": 50, "recipientOrder": 3}
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
        result = await TurboSign.prepare_for_signing_single(
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
    result = TurboSignSync.prepare_for_signing_single(
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
- ✅ `prepare_for_review()` - Document upload for review
- ✅ `prepare_for_signing_single()` - Send for signature
- ✅ `get_status()` - Check document status
- ✅ `download()` - Download signed document
- ✅ `void()` - Cancel signature request
- ✅ `resend()` - Resend signature emails

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
