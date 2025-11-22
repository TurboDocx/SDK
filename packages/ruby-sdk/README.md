[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/banner.png)](https://www.turbodocx.com)

turbodocx
====================
[![Gem Version](https://img.shields.io/gem/v/turbodocx.svg)](https://rubygems.org/gems/turbodocx)
[![Gem Downloads](https://img.shields.io/gem/dt/turbodocx)](https://rubygems.org/gems/turbodocx)
[![GitHub Stars](https://img.shields.io/github/stars/turbodocx/sdk?style=social)](https://github.com/turbodocx/sdk)
[![Ruby](https://img.shields.io/badge/Ruby-3.0+-CC342D?logo=ruby&logoColor=white)](https://ruby-lang.org)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA?logo=discord)](https://discord.gg/NYKwz4BcpX)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official Ruby SDK for TurboDocx API - Digital signatures, document generation, and AI-powered workflows. Clean, idiomatic Ruby with symbol-based responses.

## Why turbodocx?

🚀 **Production-Ready** - Battle-tested in production environments processing thousands of documents daily.

🔄 **Active Maintenance** - Backed by TurboDocx with regular updates, bug fixes, and feature enhancements.

🤖 **AI-Optimized** - Designed for modern AI workflows where speed and reliability matter.

💎 **Idiomatic Ruby** - Keyword arguments, symbol keys, and clean exception handling.

⚡ **100% n8n Parity** - Same operations available in our n8n community nodes.

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

client = TurboDocx::Client.new(api_key: 'your-api-key')

result = client.turbo_sign.prepare_for_signing_single(
  file_link: 'https://example.com/contract.pdf',
  recipients: [{ name: 'John Doe', email: 'john@example.com', order: 1 }],
  fields: [{ type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }]
)

puts "Sign URL: #{result[:recipients][0][:signUrl]}"
```

## TurboSign API

### Configuration

```ruby
# With API key
client = TurboDocx::Client.new(api_key: 'your-api-key')

# With custom base URL
client = TurboDocx::Client.new(
  api_key: 'your-api-key',
  base_url: 'https://custom-api.example.com'
)

# Global configuration
TurboDocx.configure do |config|
  config.api_key = 'your-api-key'
end
client = TurboDocx::Client.new
```

### Prepare for Review

```ruby
result = client.turbo_sign.prepare_for_review(
  file_link: 'https://example.com/contract.pdf',
  recipients: [{ name: 'John Doe', email: 'john@example.com', order: 1 }],
  fields: [{ type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }],
  document_name: 'Contract Agreement'
)
```

### Prepare for Signing

```ruby
result = client.turbo_sign.prepare_for_signing_single(
  file_link: 'https://example.com/contract.pdf',
  recipients: [{ name: 'John Doe', email: 'john@example.com', order: 1 }],
  fields: [{ type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }]
)
```

### Get Document Status

```ruby
status = client.turbo_sign.get_status('document-id')
puts "Status: #{status[:status]}"
```

### Download Signed Document

```ruby
pdf_content = client.turbo_sign.download('document-id')
File.write('signed.pdf', pdf_content)
```

### Void Document

```ruby
client.turbo_sign.void_document('document-id', 'Document needs revision')
```

### Resend Email

```ruby
client.turbo_sign.resend_email('document-id', ['recipient-id-1'])
```

## Error Handling

```ruby
begin
  client.turbo_sign.get_status('invalid-id')
rescue TurboDocx::Error => e
  puts "Status: #{e.status_code}"
  puts "Message: #{e.message}"
end
```

## Requirements

- Ruby 3.0+

## Support

- 📖 [Documentation](https://www.turbodocx.com/docs)
- 💬 [Discord](https://discord.gg/NYKwz4BcpX)
- 🐛 [Issues](https://github.com/TurboDocx/SDK/issues)

## License

MIT - see [LICENSE](./LICENSE)
