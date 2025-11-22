[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/banner.png)](https://www.turbodocx.com)

TurboDocx Java SDK
====================
[![Maven Central](https://img.shields.io/maven-central/v/com.turbodocx/turbodocx-sdk.svg)](https://search.maven.org/artifact/com.turbodocx/turbodocx-sdk)
[![GitHub Stars](https://img.shields.io/github/stars/turbodocx/sdk?style=social)](https://github.com/turbodocx/sdk)
[![Java](https://img.shields.io/badge/Java-11+-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org)
[![Discord](https://img.shields.io/badge/Discord-Join%20Us-7289DA?logo=discord)](https://discord.gg/NYKwz4BcpX)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Official Java SDK for TurboDocx API - Digital signatures, document generation, and AI-powered workflows. Builder pattern with clean API design.

## Why TurboDocx Java SDK?

🚀 **Production-Ready** - Battle-tested in production environments processing thousands of documents daily.

🔄 **Active Maintenance** - Backed by TurboDocx with regular updates, bug fixes, and feature enhancements.

🤖 **AI-Optimized** - Designed for modern AI workflows where speed and reliability matter.

☕ **Idiomatic Java** - Builder pattern, clean exceptions, and fluent API design.

⚡ **100% n8n Parity** - Same operations available in our n8n community nodes.

## Installation

### Maven

```xml
<dependency>
    <groupId>com.turbodocx</groupId>
    <artifactId>turbodocx-sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Gradle

```groovy
implementation 'com.turbodocx:turbodocx-sdk:1.0.0'
```

## Quick Start

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

System.out.println("Sign URL: " + result.getRecipients().get(0).getSignUrl());
```

## TurboSign API

### Configuration

```java
// With API key
TurboDocxClient client = new TurboDocxClient.Builder()
    .apiKey("your-api-key")
    .build();

// With custom base URL
TurboDocxClient client = new TurboDocxClient.Builder()
    .apiKey("your-api-key")
    .baseUrl("https://custom-api.example.com")
    .build();
```

### Prepare for Review

```java
PrepareForReviewResponse result = client.turboSign().prepareForReview(
    new PrepareForReviewRequest.Builder()
        .fileLink("https://example.com/contract.pdf")
        .recipients(Arrays.asList(new Recipient("John Doe", "john@example.com", 1)))
        .fields(Arrays.asList(new Field("signature", 1, 100, 500, 200, 50, 1)))
        .documentName("Contract Agreement")
        .build()
);
```

### Prepare for Signing

```java
PrepareForSigningResponse result = client.turboSign().prepareForSigningSingle(
    new PrepareForSigningRequest.Builder()
        .fileLink("https://example.com/contract.pdf")
        .recipients(Arrays.asList(new Recipient("John Doe", "john@example.com", 1)))
        .fields(Arrays.asList(new Field("signature", 1, 100, 500, 200, 50, 1)))
        .build()
);
```

### Get Document Status

```java
DocumentStatusResponse status = client.turboSign().getStatus("document-id");
System.out.println("Status: " + status.getStatus());
```

### Download Signed Document

```java
byte[] pdf = client.turboSign().download("document-id");
Files.write(Paths.get("signed.pdf"), pdf);
```

### Void Document

```java
client.turboSign().voidDocument("document-id", "Document needs revision");
```

### Resend Email

```java
client.turboSign().resendEmail("document-id", Arrays.asList("recipient-id-1"));
```

## Error Handling

```java
try {
    client.turboSign().getStatus("invalid-id");
} catch (TurboDocxException e) {
    System.err.println("Status: " + e.getStatusCode());
    System.err.println("Message: " + e.getMessage());
}
```

## Requirements

- Java 11+

## Support

- 📖 [Documentation](https://www.turbodocx.com/docs)
- 💬 [Discord](https://discord.gg/NYKwz4BcpX)
- 🐛 [Issues](https://github.com/TurboDocx/SDK/issues)

## License

MIT - see [LICENSE](./LICENSE)
