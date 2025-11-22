# TurboDocx Ruby SDK

Official Ruby SDK for TurboDocx API - Document generation and digital signatures.

## Installation

Add to your Gemfile:

```ruby
gem 'turbodocx'
```

Then run:

```bash
bundle install
```

Or install directly:

```bash
gem install turbodocx
```

## Quick Start

```ruby
require 'turbodocx'

# Initialize the client
client = TurboDocx::Client.new(api_key: 'your-api-key')

# Prepare document for signing
result = client.turbo_sign.prepare_for_signing_single(
  file_link: 'https://example.com/contract.pdf',
  recipients: [
    { name: 'John Doe', email: 'john@example.com', order: 1 }
  ],
  fields: [
    { type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }
  ]
)

puts "Document ID: #{result[:documentId]}"
puts "Sign URL: #{result[:recipients][0][:signUrl]}"
```

## Configuration

### Global Configuration

```ruby
TurboDocx.configure do |config|
  config.api_key = 'your-api-key'
  config.base_url = 'https://api.turbodocx.com'  # optional
end

client = TurboDocx::Client.new
```

### Per-Client Configuration

```ruby
client = TurboDocx::Client.new(
  api_key: 'your-api-key',
  base_url: 'https://custom-api.example.com'
)
```

## TurboSign Operations

### Prepare for Review

Upload a document for review without sending signature emails:

```ruby
result = client.turbo_sign.prepare_for_review(
  file_link: 'https://storage.example.com/contract.pdf',
  recipients: recipients,
  fields: fields,
  document_name: 'Contract Agreement'
)
```

### Prepare for Signing

Upload a document and send signature request emails:

```ruby
result = client.turbo_sign.prepare_for_signing_single(
  file: File.read('contract.pdf'),
  file_name: 'contract.pdf',
  recipients: recipients,
  fields: fields
)
```

### Get Document Status

```ruby
status = client.turbo_sign.get_status('doc-123')
puts "Status: #{status[:status]}"
```

### Download Signed Document

```ruby
pdf_content = client.turbo_sign.download('doc-123')
File.write('signed-document.pdf', pdf_content)
```

### Void Document

```ruby
result = client.turbo_sign.void_document('doc-123', 'Document needs revision')
```

### Resend Email

```ruby
result = client.turbo_sign.resend_email('doc-123', ['rec-1', 'rec-2'])
```

## Error Handling

```ruby
begin
  client.turbo_sign.get_status('invalid-doc')
rescue TurboDocx::Error => e
  puts "Error: #{e.message}"
  puts "Status Code: #{e.status_code}"
  puts "Error Code: #{e.code}"
end
```

## Requirements

- Ruby 3.0 or higher

## License

MIT License
