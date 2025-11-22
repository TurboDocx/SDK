[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/banner.png)](https://www.turbodocx.com)

turbodocx-sdk
====================
[![PyPI Version](https://img.shields.io/pypi/v/turbodocx-sdk.svg)](https://pypi.org/project/turbodocx-sdk/)
[![PyPI Downloads](https://img.shields.io/pypi/dm/turbodocx-sdk)](https://pypi.org/project/turbodocx-sdk/)
[![GitHub Stars](https://img.shields.io/github/stars/turbodocx/sdk?style=social)](https://github.com/turbodocx/sdk)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA?logo=discord)](https://discord.gg/NYKwz4BcpX)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official Python SDK for TurboDocx API - Digital signatures, document generation, and AI-powered workflows. Async-first design with full type hints.

## Why turbodocx-sdk?

🚀 **Production-Ready** - Battle-tested in production environments processing thousands of documents daily.

🔄 **Active Maintenance** - Backed by TurboDocx with regular updates, bug fixes, and feature enhancements.

🤖 **AI-Optimized** - Designed for modern AI workflows where speed and reliability matter.

🐍 **Pythonic Design** - Async-first with full type hints for excellent IDE support.

⚡ **100% n8n Parity** - Same operations available in our n8n community nodes.

## Installation

```bash
pip install turbodocx-sdk
```

## Quick Start

```python
from turbodocx_sdk import TurboSign

# Configure with your API key
TurboSign.configure(api_key='your-api-key')

# Send a document for signature
result = await TurboSign.prepare_for_signing_single(
    file_link='https://example.com/contract.pdf',
    recipients=[
        {'name': 'John Doe', 'email': 'john@example.com', 'order': 1}
    ],
    fields=[
        {'type': 'signature', 'page': 1, 'x': 100, 'y': 500, 'width': 200, 'height': 50, 'recipientOrder': 1}
    ]
)

print('Sign URL:', result['recipients'][0]['signUrl'])
```

## TurboSign API

### Configuration

```python
# With API key
TurboSign.configure(api_key='your-api-key')

# With custom base URL
TurboSign.configure(
    api_key='your-api-key',
    base_url='https://custom-api.example.com'
)
```

### Prepare for Review

```python
result = await TurboSign.prepare_for_review(
    file_link='https://example.com/contract.pdf',
    recipients=[{'name': 'John Doe', 'email': 'john@example.com', 'order': 1}],
    fields=[{'type': 'signature', 'page': 1, 'x': 100, 'y': 500, 'width': 200, 'height': 50, 'recipientOrder': 1}],
    document_name='Contract Agreement'
)
```

### Prepare for Signing

```python
result = await TurboSign.prepare_for_signing_single(
    file_link='https://example.com/contract.pdf',
    recipients=[{'name': 'John Doe', 'email': 'john@example.com', 'order': 1}],
    fields=[{'type': 'signature', 'page': 1, 'x': 100, 'y': 500, 'width': 200, 'height': 50, 'recipientOrder': 1}]
)
```

### Get Document Status

```python
status = await TurboSign.get_status('document-id')
print('Status:', status['status'])
```

### Download Signed Document

```python
pdf_content = await TurboSign.download('document-id')
with open('signed.pdf', 'wb') as f:
    f.write(pdf_content)
```

### Void Document

```python
await TurboSign.void_document('document-id', 'Document needs revision')
```

### Resend Email

```python
await TurboSign.resend_email('document-id', ['recipient-id-1'])
```

## Error Handling

```python
from turbodocx_sdk import TurboDocxError

try:
    await TurboSign.get_status('invalid-id')
except TurboDocxError as e:
    print('Status:', e.status_code)
    print('Message:', e.message)
```

## Requirements

- Python 3.9+

## Support

- 📖 [Documentation](https://www.turbodocx.com/docs)
- 💬 [Discord](https://discord.gg/NYKwz4BcpX)
- 🐛 [Issues](https://github.com/TurboDocx/SDK/issues)

## License

MIT - see [LICENSE](./LICENSE)
