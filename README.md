[![TurboDocx](./banner.png)](https://www.turbodocx.com)

# TurboDocx SDKs

[![GitHub Stars](https://img.shields.io/github/stars/turbodocx/sdk?style=social)](https://github.com/turbodocx/sdk)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA?logo=discord)](https://discord.gg/NYKwz4BcpX)
[![X](https://img.shields.io/badge/X-@TurboDocx-1DA1F2?logo=x&logoColor=white)](https://twitter.com/TurboDocx)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official multi-language SDK repository for TurboDocx - Document generation, digital signatures, and AI-powered workflows.

## Available SDKs

| Language | Package | Install | Status |
|----------|---------|---------|--------|
| **JavaScript/TypeScript** | [@turbodocx/sdk](./packages/js-sdk) | `npm install @turbodocx/sdk` | [![npm](https://img.shields.io/badge/npm-ready-green)](https://npmjs.org/package/@turbodocx/sdk) |
| **Python** | [turbodocx-sdk](./packages/py-sdk) | `pip install turbodocx-sdk` | [![pypi](https://img.shields.io/badge/pypi-ready-green)](https://pypi.org/project/turbodocx-sdk) |
| **Go** | [turbodocx](./packages/go-sdk) | `go get github.com/TurboDocx/SDK/packages/go-sdk` | [![go](https://img.shields.io/badge/go-ready-green)](https://pkg.go.dev/github.com/TurboDocx/SDK/packages/go-sdk) |
| **C# / .NET** | [TurboDocx](./packages/dotnet-sdk) | `dotnet add package TurboDocx` | [![nuget](https://img.shields.io/badge/nuget-ready-green)](https://nuget.org/packages/TurboDocx) |
| **Java** | [turbodocx-sdk](./packages/java-sdk) | Maven Central | [![maven](https://img.shields.io/badge/maven-ready-green)](https://search.maven.org/artifact/com.turbodocx/turbodocx-sdk) |
| **Ruby** | [turbodocx](./packages/ruby-sdk) | `gem install turbodocx` | [![gem](https://img.shields.io/badge/rubygems-ready-green)](https://rubygems.org/gems/turbodocx) |

## Quick Start

### JavaScript / TypeScript

```typescript
import { TurboSign } from '@turbodocx/sdk';

TurboSign.configure({ apiKey: 'your-api-key' });

const result = await TurboSign.prepareForSigningSingle({
  fileLink: 'https://example.com/contract.pdf',
  recipients: [{ name: 'John Doe', email: 'john@example.com', order: 1 }],
  fields: [{ type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }]
});

console.log(result.recipients[0].signUrl);
```

### Python

```python
from turbodocx_sdk import TurboSign

TurboSign.configure(api_key='your-api-key')

result = await TurboSign.prepare_for_signing_single(
    file_link='https://example.com/contract.pdf',
    recipients=[{'name': 'John Doe', 'email': 'john@example.com', 'order': 1}],
    fields=[{'type': 'signature', 'page': 1, 'x': 100, 'y': 500, 'width': 200, 'height': 50, 'recipientOrder': 1}]
)

print(result['recipients'][0]['signUrl'])
```

### Go

```go
import "github.com/TurboDocx/SDK/packages/go-sdk"

client := turbodocx.NewClient("your-api-key")

result, _ := client.TurboSign.PrepareForSigningSingle(ctx, &turbodocx.PrepareForSigningRequest{
    FileLink:   "https://example.com/contract.pdf",
    Recipients: []turbodocx.Recipient{{Name: "John Doe", Email: "john@example.com", Order: 1}},
    Fields:     []turbodocx.Field{{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1}},
})

fmt.Println(result.Recipients[0].SignURL)
```

### C# / .NET

```csharp
using TurboDocx;

var client = new TurboDocxClient("your-api-key");

var result = await client.TurboSign.PrepareForSigningSingleAsync(new PrepareForSigningRequest {
    FileLink = "https://example.com/contract.pdf",
    Recipients = new[] { new Recipient { Name = "John Doe", Email = "john@example.com", Order = 1 } },
    Fields = new[] { new Field { Type = "signature", Page = 1, X = 100, Y = 500, Width = 200, Height = 50, RecipientOrder = 1 } }
});

Console.WriteLine(result.Recipients[0].SignUrl);
```

### Java

```java
import com.turbodocx.TurboDocxClient;
import com.turbodocx.models.*;

TurboDocxClient client = new TurboDocxClient.Builder()
    .apiKey("your-api-key")
    .build();

PrepareForSigningResponse result = client.turboSign().prepareForSigningSingle(
    new PrepareForSigningRequest.Builder()
        .fileLink("https://example.com/contract.pdf")
        .recipients(Arrays.asList(new Recipient("John Doe", "john@example.com", 1)))
        .fields(Arrays.asList(new Field("signature", 1, 100, 500, 200, 50, 1)))
        .build()
);

System.out.println(result.getRecipients().get(0).getSignUrl());
```

### Ruby

```ruby
require 'turbodocx'

client = TurboDocx::Client.new(api_key: 'your-api-key')

result = client.turbo_sign.prepare_for_signing_single(
  file_link: 'https://example.com/contract.pdf',
  recipients: [{ name: 'John Doe', email: 'john@example.com', order: 1 }],
  fields: [{ type: 'signature', page: 1, x: 100, y: 500, width: 200, height: 50, recipientOrder: 1 }]
)

puts result[:recipients][0][:signUrl]
```

## TurboSign Operations

All SDKs implement these digital signature operations with 100% API parity:

| Operation | Description |
|-----------|-------------|
| `prepareForReview` | Upload document for review without sending emails |
| `prepareForSigningSingle` | Upload document and send signature request emails |
| `getStatus` | Get document signing status |
| `download` | Download signed document |
| `voidDocument` | Cancel/void a signature request |
| `resendEmail` | Resend signature request emails |

## Development

Each SDK is independent. Clone the repo and navigate to your SDK:

```bash
git clone https://github.com/TurboDocx/SDK.git
cd SDK/packages/<sdk-name>
```

Then follow the SDK-specific setup instructions in its README.

## Contributing

We welcome contributions! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Setting up the development environment
- Running tests
- Submitting pull requests
- Adding new SDKs

## Support

- 📖 [Documentation](https://www.turbodocx.com/docs)
- 💬 [Discord Community](https://discord.gg/NYKwz4BcpX)
- 🐦 [Twitter/X](https://twitter.com/TurboDocx)
- 📧 [Email Support](mailto:support@turbodocx.com)
- 🐛 [Report Issues](https://github.com/TurboDocx/SDK/issues)

## License

MIT License - see [LICENSE](./LICENSE) for details.

## Contributors

<a href="https://github.com/TurboDocx/SDK/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=turbodocx/sdk" />
</a>

---

Built with ❤️ by the TurboDocx team
