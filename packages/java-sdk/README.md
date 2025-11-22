# TurboDocx Java SDK

Official Java SDK for TurboDocx API - Document generation and digital signatures.

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

// Initialize the client
TurboDocxClient client = new TurboDocxClient.Builder()
    .apiKey("your-api-key")
    .build();

// Prepare document for signing
PrepareForSigningRequest request = new PrepareForSigningRequest.Builder()
    .fileLink("https://example.com/contract.pdf")
    .recipients(Arrays.asList(
        new Recipient("John Doe", "john@example.com", 1)
    ))
    .fields(Arrays.asList(
        new Field("signature", 1, 100, 500, 200, 50, 1)
    ))
    .build();

PrepareForSigningResponse response = client.turboSign().prepareForSigningSingle(request);
System.out.println("Document ID: " + response.getDocumentId());
System.out.println("Sign URL: " + response.getRecipients().get(0).getSignUrl());
```

## TurboSign Operations

### Prepare for Review

Upload a document for review without sending signature emails:

```java
PrepareForReviewRequest request = new PrepareForReviewRequest.Builder()
    .fileLink("https://storage.example.com/contract.pdf")
    .recipients(recipients)
    .fields(fields)
    .documentName("Contract Agreement")
    .build();

PrepareForReviewResponse response = client.turboSign().prepareForReview(request);
```

### Prepare for Signing

Upload a document and send signature request emails:

```java
PrepareForSigningRequest request = new PrepareForSigningRequest.Builder()
    .file(pdfBytes)
    .fileName("contract.pdf")
    .recipients(recipients)
    .fields(fields)
    .build();

PrepareForSigningResponse response = client.turboSign().prepareForSigningSingle(request);
```

### Get Document Status

```java
DocumentStatusResponse status = client.turboSign().getStatus("doc-123");
System.out.println("Status: " + status.getStatus());
```

### Download Signed Document

```java
byte[] pdf = client.turboSign().download("doc-123");
Files.write(Paths.get("signed-document.pdf"), pdf);
```

### Void Document

```java
VoidDocumentResponse response = client.turboSign().voidDocument("doc-123", "Document needs revision");
```

### Resend Email

```java
ResendEmailResponse response = client.turboSign().resendEmail("doc-123", Arrays.asList("rec-1", "rec-2"));
```

## Error Handling

```java
try {
    client.turboSign().getStatus("invalid-doc");
} catch (TurboDocxException e) {
    System.err.println("Error: " + e.getMessage());
    System.err.println("Status Code: " + e.getStatusCode());
    System.err.println("Error Code: " + e.getCode());
}
```

## Requirements

- Java 11 or higher

## License

MIT License
