[![TurboDocx](./banner.png)](https://www.turbodocx.com)

<div align="center">

# com.turbodocx:sdk

**Official Java SDK for TurboDocx**

[![Maven Central](https://img.shields.io/maven-central/v/com.turbodocx/sdk.svg)](https://search.maven.org/artifact/com.turbodocx/sdk)
[![Java](https://img.shields.io/badge/Java-11+-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

[Documentation](https://www.turbodocx.com/docs) • [API Reference](https://www.turbodocx.com/docs/api) • [Examples](#examples) • [Discord](https://discord.gg/NYKwz4BcpX)

</div>

---

## Features

- 🚀 **Production-Ready** — Battle-tested, processing thousands of documents daily
- ⚡ **Builder Pattern** — Fluent, type-safe request building
- 🔒 **Type-Safe** — Strongly typed models with Java generics
- 📝 **Javadoc** — Comprehensive documentation for all classes
- 🧵 **Thread-Safe** — Safe for concurrent use
- 🤖 **100% n8n Parity** — Same operations as our n8n community nodes

---

## Installation

### Maven

```xml
<dependency>
    <groupId>com.turbodocx</groupId>
    <artifactId>sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Gradle

```groovy
implementation 'com.turbodocx:sdk:1.0.0'
```

<details>
<summary>Gradle Kotlin DSL</summary>

```kotlin
implementation("com.turbodocx:sdk:1.0.0")
```
</details>

---

## Quick Start

```java
import com.turbodocx.TurboDocxClient;
import com.turbodocx.models.*;
import java.util.Arrays;

public class Main {
    public static void main(String[] args) {
        // 1. Create client
        TurboDocxClient client = new TurboDocxClient.Builder()
            .apiKey("your-api-key")
            .build();

        // 2. Send document for signature
        PrepareForSigningResponse result = client.turboSign().prepareForSigningSingle(
            new PrepareForSigningRequest.Builder()
                .fileLink("https://example.com/contract.pdf")
                .recipients(Arrays.asList(
                    new Recipient("John Doe", "john@example.com", 1)
                ))
                .fields(Arrays.asList(
                    new Field.Builder()
                        .type("signature")
                        .page(1)
                        .x(100).y(500)
                        .width(200).height(50)
                        .recipientOrder(1)
                        .build()
                ))
                .build()
        );

        System.out.println("Sign URL: " + result.getRecipients().get(0).getSignUrl());
    }
}
```

---

## Configuration

```java
// Basic client
TurboDocxClient client = new TurboDocxClient.Builder()
    .apiKey("your-api-key")
    .build();

// With options
TurboDocxClient client = new TurboDocxClient.Builder()
    .apiKey(System.getenv("TURBODOCX_API_KEY"))
    .baseUrl("https://custom-api.example.com")  // Optional
    .timeout(Duration.ofSeconds(30))             // Optional
    .build();

// With custom HTTP client
OkHttpClient httpClient = new OkHttpClient.Builder()
    .connectTimeout(Duration.ofSeconds(10))
    .readTimeout(Duration.ofSeconds(30))
    .build();

TurboDocxClient client = new TurboDocxClient.Builder()
    .apiKey("your-api-key")
    .httpClient(httpClient)
    .build();
```

---

## API Reference

### TurboSign

#### `prepareForReview()`

Upload a document for review without sending signature emails.

```java
PrepareForReviewResponse result = client.turboSign().prepareForReview(
    new PrepareForReviewRequest.Builder()
        .fileLink("https://example.com/contract.pdf")
        .recipients(Arrays.asList(
            new Recipient("John Doe", "john@example.com", 1)
        ))
        .fields(Arrays.asList(
            new Field.Builder()
                .type("signature")
                .page(1).x(100).y(500)
                .width(200).height(50)
                .recipientOrder(1)
                .build()
        ))
        .documentName("Service Agreement")       // Optional
        .senderName("Acme Corp")                 // Optional
        .senderEmail("contracts@acme.com")       // Optional
        .build()
);

System.out.println("Preview URL: " + result.getPreviewUrl());
System.out.println("Document ID: " + result.getDocumentId());
```

#### `prepareForSigningSingle()`

Upload a document and immediately send signature request emails.

```java
PrepareForSigningResponse result = client.turboSign().prepareForSigningSingle(
    new PrepareForSigningRequest.Builder()
        .fileLink("https://example.com/contract.pdf")
        .recipients(Arrays.asList(
            new Recipient("Alice", "alice@example.com", 1),
            new Recipient("Bob", "bob@example.com", 2)
        ))
        .fields(Arrays.asList(
            new Field.Builder().type("signature").page(1).x(100).y(500).width(200).height(50).recipientOrder(1).build(),
            new Field.Builder().type("signature").page(1).x(100).y(600).width(200).height(50).recipientOrder(2).build()
        ))
        .build()
);

for (RecipientResponse r : result.getRecipients()) {
    System.out.println(r.getName() + ": " + r.getSignUrl());
}
```

#### `getStatus()`

Check the current status of a document.

```java
DocumentStatus status = client.turboSign().getStatus("doc-uuid-here");

System.out.println("Status: " + status.getStatus());  // "pending", "completed", "voided"

for (RecipientStatus r : status.getRecipients()) {
    System.out.println(r.getName() + ": " + r.getStatus());
}
```

#### `download()`

Download the signed document.

```java
byte[] pdfBytes = client.turboSign().download("doc-uuid-here");

// Save to file
Files.write(Paths.get("signed-contract.pdf"), pdfBytes);
```

#### `void()`

Cancel a signature request.

```java
client.turboSign().voidDocument("doc-uuid-here", "Contract terms changed");
```

#### `resend()`

Resend signature request emails.

```java
client.turboSign().resend("doc-uuid-here", Arrays.asList("recipient-uuid-1"));
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

```java
PrepareForSigningResponse result = client.turboSign().prepareForSigningSingle(
    new PrepareForSigningRequest.Builder()
        .fileLink("https://example.com/contract.pdf")
        .recipients(Arrays.asList(
            new Recipient("Employee", "employee@company.com", 1),
            new Recipient("Manager", "manager@company.com", 2),
            new Recipient("HR", "hr@company.com", 3)
        ))
        .fields(Arrays.asList(
            // Employee signs first
            new Field.Builder().type("signature").page(1).x(100).y(400).width(200).height(50).recipientOrder(1).build(),
            new Field.Builder().type("date").page(1).x(320).y(400).width(100).height(30).recipientOrder(1).build(),
            // Manager signs second
            new Field.Builder().type("signature").page(1).x(100).y(500).width(200).height(50).recipientOrder(2).build(),
            // HR signs last
            new Field.Builder().type("signature").page(1).x(100).y(600).width(200).height(50).recipientOrder(3).build()
        ))
        .build()
);
```

### Polling for Completion

```java
public byte[] waitForCompletion(String documentId, int maxAttempts) throws Exception {
    for (int i = 0; i < maxAttempts; i++) {
        DocumentStatus status = client.turboSign().getStatus(documentId);

        switch (status.getStatus()) {
            case "completed":
                return client.turboSign().download(documentId);
            case "voided":
                throw new RuntimeException("Document was voided");
        }

        Thread.sleep(30000);  // Wait 30 seconds
    }

    throw new TimeoutException("Timeout waiting for signatures");
}
```

### With Spring Boot

```java
@Configuration
public class TurboDocxConfig {
    @Bean
    public TurboDocxClient turboDocxClient(@Value("${turbodocx.api-key}") String apiKey) {
        return new TurboDocxClient.Builder()
            .apiKey(apiKey)
            .build();
    }
}

@RestController
@RequestMapping("/api/contracts")
public class ContractController {
    private final TurboDocxClient client;

    public ContractController(TurboDocxClient client) {
        this.client = client;
    }

    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> sendContract(@RequestBody SendContractRequest request) {
        PrepareForSigningResponse result = client.turboSign().prepareForSigningSingle(
            new PrepareForSigningRequest.Builder()
                .fileLink(request.getPdfUrl())
                .recipients(request.getRecipients())
                .fields(request.getFields())
                .build()
        );

        return ResponseEntity.ok(Map.of("documentId", result.getDocumentId()));
    }
}
```

---

## Error Handling

```java
try {
    DocumentStatus result = client.turboSign().getStatus("invalid-id");
} catch (TurboDocxException e) {
    System.out.println("Status: " + e.getStatusCode());
    System.out.println("Message: " + e.getMessage());
    System.out.println("Code: " + e.getErrorCode());
} catch (Exception e) {
    System.out.println("Unexpected error: " + e.getMessage());
}
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

- Java 11+
- OkHttp 4.x (included as dependency)
- Gson 2.x (included as dependency)

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

---

<div align="center">

[![TurboDocx](./footer.png)](https://www.turbodocx.com)

</div>
