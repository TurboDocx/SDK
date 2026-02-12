[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/java-sdk/banner.png)](https://www.turbodocx.com)

<div align="center">

# com.turbodocx:turbodocx-sdk

**Official Java SDK for TurboDocx**

The most developer-friendly **DocuSign & PandaDoc alternative** for **e-signatures** and **document generation**. Send documents for signature and automate document workflows programmatically.

[![Maven Central](https://img.shields.io/maven-central/v/com.turbodocx/sdk.svg)](https://search.maven.org/artifact/com.turbodocx/sdk)
[![Java](https://img.shields.io/badge/Java-11+-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org)
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
    <artifactId>turbodocx-sdk</artifactId>
    <version>0.1.6</version>
</dependency>
```

### Gradle

```groovy
implementation 'com.turbodocx:turbodocx-sdk:0.1.6'
```

<details>
<summary>Gradle Kotlin DSL</summary>

```kotlin
implementation("com.turbodocx:turbodocx-sdk:0.1.6")
```
</details>

---

## Quick Start

```java
import com.turbodocx.TurboDocxClient;
import com.turbodocx.models.*;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;

public class Main {
    public static void main(String[] args) throws Exception {
        // 1. Create client with sender configuration
        TurboDocxClient client = new TurboDocxClient.Builder()
            .apiKey(System.getenv("TURBODOCX_API_KEY"))       // REQUIRED
            .orgId(System.getenv("TURBODOCX_ORG_ID"))         // REQUIRED
            .senderEmail(System.getenv("TURBODOCX_SENDER_EMAIL"))  // REQUIRED
            .senderName(System.getenv("TURBODOCX_SENDER_NAME"))    // OPTIONAL (but strongly recommended)
            .build();

        // 2. Read PDF file
        byte[] pdfFile = Files.readAllBytes(Paths.get("contract.pdf"));

        // 3. Send document for signature
        SendSignatureResponse result = client.turboSign().sendSignature(
            new SendSignatureRequest.Builder()
                .file(pdfFile)
                .fileName("contract.pdf")
                .documentName("Partnership Agreement")
                .recipients(Arrays.asList(
                    new Recipient("John Doe", "john@example.com", 1)
                ))
                .fields(Arrays.asList(
                    new Field.Builder()
                        .type("signature")
                        .recipientEmail("john@example.com")
                        .template(new FieldTemplate.Builder()
                            .anchor("{signature1}")
                            .placement("replace")
                            .size(new FieldSize(100, 30))
                            .build())
                        .build()
                ))
                .build()
        );

        System.out.println("Document ID: " + result.getDocumentId());
    }
}
```

---

## Configuration

```java
// Basic client configuration
TurboDocxClient client = new TurboDocxClient.Builder()
    .apiKey("your-api-key")           // REQUIRED
    .orgId("your-org-id")             // REQUIRED
    .senderEmail("you@company.com")   // REQUIRED for TurboSign operations
    .senderName("Your Company")       // OPTIONAL (recommended for TurboSign)
    .build();

// For TurboTemplate only (no senderEmail needed)
TurboDocxClient client = new TurboDocxClient.Builder()
    .apiKey(System.getenv("TURBODOCX_API_KEY"))
    .orgId(System.getenv("TURBODOCX_ORG_ID"))
    .build();

// With environment variables (recommended for TurboSign)
TurboDocxClient client = new TurboDocxClient.Builder()
    .apiKey(System.getenv("TURBODOCX_API_KEY"))
    .orgId(System.getenv("TURBODOCX_ORG_ID"))
    .senderEmail(System.getenv("TURBODOCX_SENDER_EMAIL"))
    .senderName(System.getenv("TURBODOCX_SENDER_NAME"))
    .build();

// With custom options
TurboDocxClient client = new TurboDocxClient.Builder()
    .apiKey(System.getenv("TURBODOCX_API_KEY"))
    .orgId(System.getenv("TURBODOCX_ORG_ID"))
    .senderEmail(System.getenv("TURBODOCX_SENDER_EMAIL"))
    .senderName(System.getenv("TURBODOCX_SENDER_NAME"))
    .baseUrl("https://custom-api.example.com")  // Optional
    .timeout(Duration.ofSeconds(30))             // Optional
    .build();

// With custom HTTP client
OkHttpClient httpClient = new OkHttpClient.Builder()
    .connectTimeout(Duration.ofSeconds(10))
    .readTimeout(Duration.ofSeconds(30))
    .build();

TurboDocxClient client = new TurboDocxClient.Builder()
    .apiKey(System.getenv("TURBODOCX_API_KEY"))
    .orgId(System.getenv("TURBODOCX_ORG_ID"))
    .senderEmail(System.getenv("TURBODOCX_SENDER_EMAIL"))
    .senderName(System.getenv("TURBODOCX_SENDER_NAME"))
    .httpClient(httpClient)
    .build();
```

**Important:** `senderEmail` is **REQUIRED for TurboSign operations**. This email will be used as the reply-to address for signature request emails. For TurboTemplate-only usage, `senderEmail` is not required. The `senderName` is optional but strongly recommended for a professional appearance in signature emails.

**Environment Variables:**

```bash
# Set in your environment or application.properties
export TURBODOCX_API_KEY=your-api-key
export TURBODOCX_ORG_ID=your-org-id
export TURBODOCX_SENDER_EMAIL=you@company.com
export TURBODOCX_SENDER_NAME="Your Company Name"
```

---

## API Reference

### TurboSign

#### `createSignatureReviewLink()`

Upload a document for review without sending signature emails.

```java
CreateSignatureReviewLinkResponse result = client.turboSign().createSignatureReviewLink(
    new CreateSignatureReviewLinkRequest.Builder()
        .fileLink("https://example.com/contract.pdf")
        .recipients(Arrays.asList(
            new Recipient("John Doe", "john@example.com", 1)
        ))
        .fields(Arrays.asList(
            new Field.Builder()
                .type("signature")
                .page(1).x(100).y(500)
                .width(200).height(50)
                .recipientEmail("john@example.com")
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

#### `sendSignature()`

Upload a document and immediately send signature request emails.

```java
SendSignatureResponse result = client.turboSign().sendSignature(
    new SendSignatureRequest.Builder()
        .fileLink("https://example.com/contract.pdf")
        .recipients(Arrays.asList(
            new Recipient("Alice", "alice@example.com", 1),
            new Recipient("Bob", "bob@example.com", 2)
        ))
        .fields(Arrays.asList(
            new Field.Builder().type("signature").recipientEmail("alice@example.com").page(1).x(100).y(500).width(200).height(50).build(),
            new Field.Builder().type("signature").recipientEmail("bob@example.com").page(1).x(100).y(600).width(200).height(50).build()
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

#### `resendEmail()`

Resend signature request emails.

```java
client.turboSign().resendEmail("doc-uuid-here", Arrays.asList("recipient-uuid-1"));
```

#### `getAuditTrail()`

Get the complete audit trail for a document, including all events and timestamps.

```java
AuditTrailResponse audit = client.turboSign().getAuditTrail("doc-uuid-here");

System.out.println("Document: " + audit.getDocument().getName());

for (AuditTrailEntry entry : audit.getAuditTrail()) {
    System.out.println(entry.getActionType() + " - " + entry.getTimestamp());
    if (entry.getUser() != null) {
        System.out.println("  By: " + entry.getUser().getName() + " (" + entry.getUser().getEmail() + ")");
    }
    if (entry.getRecipient() != null) {
        System.out.println("  Recipient: " + entry.getRecipient().getName());
    }
}
```

The audit trail includes a cryptographic hash chain for tamper-evidence verification.

---

### TurboTemplate

Generate documents from templates with advanced variable substitution.

#### `turboTemplate().generate()`

Generate a document from a template with variables.

```java
GenerateTemplateResponse result = client.turboTemplate().generate(
    GenerateTemplateRequest.builder()
        .templateId("your-template-uuid")
        .name("Generated Contract")
        .description("Contract for Q4 2024")
        .variables(Arrays.asList(
            TemplateVariable.simple("{customer_name}", "customer_name", "Acme Corp", VariableMimeType.TEXT),
            TemplateVariable.simple("{contract_date}", "contract_date", "2024-01-15", VariableMimeType.TEXT),
            TemplateVariable.simple("{total_amount}", "total_amount", 50000, VariableMimeType.TEXT)
        ))
        .build()
);

System.out.println("Document ID: " + result.getId());
```

#### Helper Functions

Use helper functions for cleaner variable creation:

```java
GenerateTemplateResponse result = client.turboTemplate().generate(
    GenerateTemplateRequest.builder()
        .templateId("invoice-template-uuid")
        .name("Invoice #1234")
        .description("Monthly invoice")
        .variables(Arrays.asList(
            // Simple text/number variables (placeholder, name, value, mimeType)
            TemplateVariable.simple("{invoice_number}", "invoice_number", "INV-2024-001", VariableMimeType.TEXT),
            TemplateVariable.simple("{total}", "total", 1500, VariableMimeType.TEXT),

            // Advanced engine variable (placeholder, name, value) - for dot notation: {customer.name}
            TemplateVariable.advancedEngine("{customer}", "customer", Map.of(
                "name", "Acme Corp",
                "email", "billing@acme.com",
                "address", Map.of(
                    "street", "123 Main St",
                    "city", "New York",
                    "state", "NY"
                )
            )),

            // Arrays for loops (placeholder, name, value) - use {#items}...{/items} in template
            TemplateVariable.loop("{items}", "items", Arrays.asList(
                Map.of("name", "Widget A", "quantity", 5, "price", 100),
                Map.of("name", "Widget B", "quantity", 3, "price", 200)
            )),

            // Conditionals (placeholder, name, value) - use {#is_premium}...{/is_premium} in template
            TemplateVariable.conditional("{is_premium}", "is_premium", true),

            // Images (placeholder, name, imageUrl)
            TemplateVariable.image("{logo}", "logo", "https://example.com/logo.png")
        ))
        .build()
);
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
| `placeholder` | String | Yes | The placeholder in template (e.g., `{name}`) |
| `name` | String | Yes | Variable name for the templating engine |
| `value` | Object | Yes* | The value to substitute |
| `mimeType` | VariableMimeType | Yes | `TEXT`, `JSON`, `HTML`, `IMAGE`, `MARKDOWN` |
| `usesAdvancedTemplatingEngine` | Boolean | No | Enable for loops, conditionals, expressions |

*Either `value` or `text` must be provided.

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

- [`TurboSignSendSimple.java`](./examples/TurboSignSendSimple.java) - Send document directly with template anchors
- [`TurboSignBasic.java`](./examples/TurboSignBasic.java) - Create review link first, then send manually
- [`TurboSignAdvanced.java`](./examples/TurboSignAdvanced.java) - Advanced field types (checkbox, readonly, multiline text, etc.)

### Sequential Signing

```java
SendSignatureResponse result = client.turboSign().sendSignature(
    new SendSignatureRequest.Builder()
        .fileLink("https://example.com/contract.pdf")
        .recipients(Arrays.asList(
            new Recipient("Employee", "employee@company.com", 1),
            new Recipient("Manager", "manager@company.com", 2),
            new Recipient("HR", "hr@company.com", 3)
        ))
        .fields(Arrays.asList(
            // Employee signs first
            new Field.Builder().type("signature").recipientEmail("employee@company.com").page(1).x(100).y(400).width(200).height(50).build(),
            new Field.Builder().type("date").recipientEmail("employee@company.com").page(1).x(320).y(400).width(100).height(30).build(),
            // Manager signs second
            new Field.Builder().type("signature").recipientEmail("manager@company.com").page(1).x(100).y(500).width(200).height(50).build(),
            // HR signs last
            new Field.Builder().type("signature").recipientEmail("hr@company.com").page(1).x(100).y(600).width(200).height(50).build()
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
        SendSignatureResponse result = client.turboSign().sendSignature(
            new SendSignatureRequest.Builder()
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

## Local Testing

The SDK includes a comprehensive manual test class to verify all functionality locally.

### Running Manual Tests

```bash
# Using Maven
mvn exec:java -Dexec.mainClass="com.turbodocx.ManualTest"

# Or compile and run directly
mvn clean compile
java -cp target/classes:$(mvn dependency:build-classpath -Dmdep.outputFile=/dev/stdout -q) com.turbodocx.ManualTest
```

### What It Tests

The `ManualTest.java` class tests all SDK methods:
- ✅ `createSignatureReviewLink()` - Document upload for review
- ✅ `sendSignature()` - Send for signature
- ✅ `getStatus()` - Check document status
- ✅ `download()` - Download signed document
- ✅ `voidDocument()` - Cancel signature request
- ✅ `resendEmail()` - Resend signature emails

### Configuration

Before running, update the hardcoded values in `src/main/java/com/turbodocx/ManualTest.java`:
- `API_KEY` - Your TurboDocx API key
- `BASE_URL` - API endpoint (default: `http://localhost:3000`)
- `ORG_ID` - Your organization UUID
- `TEST_FILE_PATH` - Path to a test PDF/DOCX file
- `TEST_EMAIL` - Email address for testing

### Expected Output

The test class will:
1. Upload a test document
2. Send it for signature
3. Check the status
4. Test void and resend operations
5. Print results for each operation

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

- 📖 [Documentation](https://docs.turbodocx.com/docs)
- 💬 [Discord](https://discord.gg/NYKwz4BcpX)
- 🐛 [GitHub Issues](https://github.com/TurboDocx/SDK/issues)

---

## License

MIT — see [LICENSE](./LICENSE)

---

<div align="center">

[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/java-sdk/footer.png)](https://www.turbodocx.com)

</div>
