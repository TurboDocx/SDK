[![TurboDocx](./banner.png)](https://www.turbodocx.com)

<div align="center">

# turbodocx-sdk

**Official Ruby SDK for TurboDocx**

[![Gem Version](https://img.shields.io/gem/v/turbodocx-sdk.svg)](https://rubygems.org/gems/turbodocx-sdk)
[![Gem Downloads](https://img.shields.io/gem/dt/turbodocx-sdk)](https://rubygems.org/gems/turbodocx-sdk)
[![Ruby](https://img.shields.io/badge/Ruby-3.0+-CC342D?logo=ruby&logoColor=white)](https://ruby-lang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[Documentation](https://www.turbodocx.com/docs) • [API Reference](https://www.turbodocx.com/docs/api) • [Examples](#examples) • [Discord](https://discord.gg/NYKwz4BcpX)

</div>

---

## Features

- 🚀 **Production-Ready** — Battle-tested, processing thousands of documents daily
- 💎 **Idiomatic Ruby** — Clean, Ruby-style API with symbol-based responses
- 🔒 **Type-Safe** — Sorbet type signatures (RBI files included)
- 📝 **YARD Docs** — Comprehensive documentation
- 🧵 **Thread-Safe** — Safe for concurrent use
- 🤖 **100% n8n Parity** — Same operations as our n8n community nodes

---

## Installation

```bash
gem install turbodocx-sdk
```

Or add to your Gemfile:

```ruby
gem 'turbodocx-sdk'
```

Then run:

```bash
bundle install
```

---

## Quick Start

```ruby
require 'turbodocx-sdk'

# 1. Create client
client = TurboDocx::Client.new(api_key: 'your-api-key')

# 2. Send document for signature
result = client.turbo_sign.prepare_for_signing_single(
  file_link: 'https://example.com/contract.pdf',
  recipients: [
    { name: 'John Doe', email: 'john@example.com', order: 1 }
  ],
  fields: [
    { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }
  ]
)

puts "Sign URL: #{result[:recipients][0][:sign_url]}"
```

---

## Configuration

```ruby
# Basic client
client = TurboDocx::Client.new(api_key: 'your-api-key')

# With options
client = TurboDocx::Client.new(
  api_key: ENV['TURBODOCX_API_KEY'],
  base_url: 'https://custom-api.example.com',  # Optional
  timeout: 30                                   # Optional (seconds)
)

# Global configuration
TurboDocx.configure do |config|
  config.api_key = ENV['TURBODOCX_API_KEY']
  config.timeout = 30
end

client = TurboDocx::Client.new
```

---

## API Reference

### TurboSign

#### `prepare_for_review`

Upload a document for review without sending signature emails.

```ruby
result = client.turbo_sign.prepare_for_review(
  file_link: 'https://example.com/contract.pdf',
  recipients: [
    { name: 'John Doe', email: 'john@example.com', order: 1 }
  ],
  fields: [
    { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }
  ],
  document_name: 'Service Agreement',       # Optional
  sender_name: 'Acme Corp',                 # Optional
  sender_email: 'contracts@acme.com'        # Optional
)

puts "Preview URL: #{result[:preview_url]}"
puts "Document ID: #{result[:document_id]}"
```

#### `prepare_for_signing_single`

Upload a document and immediately send signature request emails.

```ruby
result = client.turbo_sign.prepare_for_signing_single(
  file_link: 'https://example.com/contract.pdf',
  recipients: [
    { name: 'Alice', email: 'alice@example.com', order: 1 },
    { name: 'Bob', email: 'bob@example.com', order: 2 }
  ],
  fields: [
    { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 },
    { type: 'signature', page: 1, x: 100, y: 600, width: 200, height: 50, recipientOrder: 2 }
  ]
)

result[:recipients].each do |r|
  puts "#{r[:name]}: #{r[:sign_url]}"
end
```

#### `get_status`

Check the current status of a document.

```ruby
status = client.turbo_sign.get_status('doc-uuid-here')

puts "Status: #{status[:status]}"  # 'pending', 'completed', 'voided'

status[:recipients].each do |r|
  puts "#{r[:name]}: #{r[:status]}"
end
```

#### `download`

Download the signed document.

```ruby
pdf_bytes = client.turbo_sign.download('doc-uuid-here')

# Save to file
File.write('signed-contract.pdf', pdf_bytes, mode: 'wb')
```

#### `void`

Cancel a signature request.

```ruby
client.turbo_sign.void('doc-uuid-here', reason: 'Contract terms changed')
```

#### `resend`

Resend signature request emails.

```ruby
client.turbo_sign.resend('doc-uuid-here', recipient_ids: ['recipient-uuid-1'])
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

```ruby
result = client.turbo_sign.prepare_for_signing_single(
  file_link: 'https://example.com/contract.pdf',
  recipients: [
    { name: 'Employee', email: 'employee@company.com', order: 1 },
    { name: 'Manager', email: 'manager@company.com', order: 2 },
    { name: 'HR', email: 'hr@company.com', order: 3 }
  ],
  fields: [
    # Employee signs first
    { type: 'signature', page: 1, x: 100, y: 400, width: 200, height: 50, recipientOrder: 1 },
    { type: 'date', page: 1, x: 320, y: 400, width: 100, height: 30, recipientOrder: 1 },
    # Manager signs second
    { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 2 },
    # HR signs last
    { type: 'signature', page: 1, x: 100, y: 600, width: 200, height: 50, recipientOrder: 3 }
  ]
)
```

### Polling for Completion

```ruby
def wait_for_completion(client, document_id, max_attempts: 60)
  max_attempts.times do
    status = client.turbo_sign.get_status(document_id)

    case status[:status]
    when 'completed'
      return client.turbo_sign.download(document_id)
    when 'voided'
      raise 'Document was voided'
    end

    sleep 30  # Wait 30 seconds
  end

  raise 'Timeout waiting for signatures'
end
```

### With Rails

```ruby
# config/initializers/turbodocx.rb
TurboDocx.configure do |config|
  config.api_key = Rails.application.credentials.turbodocx_api_key
end

# app/services/contract_service.rb
class ContractService
  def initialize
    @client = TurboDocx::Client.new
  end

  def send_for_signature(pdf_url:, recipients:, fields:)
    @client.turbo_sign.prepare_for_signing_single(
      file_link: pdf_url,
      recipients: recipients,
      fields: fields
    )
  end
end

# app/controllers/contracts_controller.rb
class ContractsController < ApplicationController
  def create
    service = ContractService.new
    result = service.send_for_signature(
      pdf_url: params[:pdf_url],
      recipients: params[:recipients],
      fields: params[:fields]
    )

    render json: { document_id: result[:document_id] }
  end
end
```

### With Sidekiq

```ruby
class SendContractJob
  include Sidekiq::Job

  def perform(pdf_url, recipients, fields)
    client = TurboDocx::Client.new(api_key: ENV['TURBODOCX_API_KEY'])

    result = client.turbo_sign.prepare_for_signing_single(
      file_link: pdf_url,
      recipients: recipients.map(&:symbolize_keys),
      fields: fields.map(&:symbolize_keys)
    )

    # Schedule status check job
    CheckSignatureStatusJob.perform_in(30.seconds, result[:document_id])
  end
end
```

---

## Error Handling

```ruby
begin
  result = client.turbo_sign.get_status('invalid-id')
rescue TurboDocx::Error => e
  puts "Status: #{e.status_code}"
  puts "Message: #{e.message}"
  puts "Code: #{e.error_code}"
rescue => e
  puts "Unexpected error: #{e.message}"
end
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

- Ruby 3.0+
- Faraday 2.x (included as dependency)

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
