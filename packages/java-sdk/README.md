[![TurboDocx](https://raw.githubusercontent.com/TurboDocx/SDK/main/packages/java-sdk/banner.png)](https://www.turbodocx.com)

<div align="center">

# com.turbodocx:turbodocx-sdk

**Official Java SDK for TurboDocx**

The most developer-friendly **DocuSign & PandaDoc alternative** for **e-signatures** and **document generation**. Send documents for signature and automate document workflows programmatically.

[![Maven Central](https://img.shields.io/maven-central/v/com.turbodocx/sdk.svg)](https://search.maven.org/artifact/com.turbodocx/sdk)
[![Java](https://img.shields.io/badge/Java-11+-ED8B00?logo=openjdk&logoColor=white)](https://openjdk.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Agent Skills](https://img.shields.io/badge/Agent%20Skills-agentskills.io-8A2BE2)](https://agentskills.io)
[![Quickstart Skill](https://skills.sh/b/TurboDocx/quickstart)](https://github.com/TurboDocx/quickstart)

[Documentation](https://docs.turbodocx.com/docs) • [API Reference](https://docs.turbodocx.com/docs/SDKs/) • [Examples](#examples) • [Discord](https://discord.gg/NYKwz4BcpX)

</div>

---

## ⚡ Skip the boilerplate — let an agent scaffold it for you

Have an AI coding agent (Claude Code, Cursor, Copilot, Codex, Gemini CLI, OpenCode) install this SDK, configure your env, write working route handlers, and wire them into your app:

```bash
npx skills add TurboDocx/quickstart
```

Then run `/turbodocx-sdk` inside your agent — or one of the focused shortcuts:

| Shortcut | What it scaffolds |
|---|---|
| `/turbodocx-sdk turbosign` | Send documents for e-signature, check status, download signed PDF |
| `/turbodocx-sdk deliverable` | Generate documents from templates with variable substitution |
| `/turbodocx-sdk turbopartner` | Provision and manage customer organizations (partner accounts) |
| `/turbodocx-sdk turbowebhooks` | Subscribe to `signature.document.completed` events + verify HMAC |
| `/turbodocx-sdk turboquote` | Create and send quotes, manage products, bundles, and pricebooks |

The skill auto-detects your framework (Spring Boot, Servlet, Jakarta EE, …) and follows your existing project conventions. Source: [github.com/TurboDocx/quickstart](https://github.com/TurboDocx/quickstart).

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
    <version>0.2.0</version>
</dependency>
```

### Gradle

```groovy
implementation 'com.turbodocx:turbodocx-sdk:0.2.0'
```

<details>
<summary>Gradle Kotlin DSL</summary>

```kotlin
implementation("com.turbodocx:turbodocx-sdk:0.2.0")
```
</details>

---

## Install via AI Agent Skill

Let an AI coding agent set up this SDK for you with the [TurboDocx Quickstart Agent Skill](https://github.com/TurboDocx/quickstart):

```bash
npx skills add TurboDocx/quickstart
```

Works with Claude Code, GitHub Copilot, Cursor, OpenCode, and other AI coding agents. The skill detects your language, installs the package, and generates working integration code.

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
                        .template(new Field.TemplateAnchor.Builder()
                            .anchor("{signature1}")
                            .placement("replace")
                            .size(new Field.Size(100, 30))
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
// Basic client configuration (REQUIRED)
TurboDocxClient client = new TurboDocxClient.Builder()
    .apiKey("your-api-key")           // REQUIRED
    .orgId("your-org-id")             // REQUIRED
    .senderEmail("you@company.com")   // REQUIRED - reply-to address for signature requests
    .senderName("Your Company")       // OPTIONAL but strongly recommended
    .build();

// With environment variables (recommended)
TurboDocxClient client = new TurboDocxClient.Builder()
    .apiKey(System.getenv("TURBODOCX_API_KEY"))
    .orgId(System.getenv("TURBODOCX_ORG_ID"))
    .senderEmail(System.getenv("TURBODOCX_SENDER_EMAIL"))
    .senderName(System.getenv("TURBODOCX_SENDER_NAME"))
    .build();

// With custom base URL
TurboDocxClient client = new TurboDocxClient.Builder()
    .apiKey(System.getenv("TURBODOCX_API_KEY"))
    .orgId(System.getenv("TURBODOCX_ORG_ID"))
    .senderEmail(System.getenv("TURBODOCX_SENDER_EMAIL"))
    .senderName(System.getenv("TURBODOCX_SENDER_NAME"))
    .baseUrl("https://custom-api.example.com")  // Optional
    .build();
```

**Important:** `senderEmail` is **REQUIRED**. This email will be used as the reply-to address for signature request emails. Without it, emails will default to "API Service User via TurboSign". The `senderName` is optional but strongly recommended for a professional appearance.

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
DocumentStatusResponse status = client.turboSign().getStatus("doc-uuid-here");

System.out.println("Status: " + status.getStatus());  // "pending", "completed", "voided"
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

## TurboPartner (Partner API)

The `TurboPartner` module provides partner portal operations for managing organizations, users, API keys, and audit logs.

### Configuration

```java
import com.turbodocx.TurboPartnerClient;
import com.turbodocx.PartnerScope;
import com.google.gson.JsonObject;

TurboPartnerClient client = new TurboPartnerClient.Builder()
    .partnerApiKey(System.getenv("TURBODOCX_PARTNER_API_KEY"))  // REQUIRED (TDXP-* prefix)
    .partnerId(System.getenv("TURBODOCX_PARTNER_ID"))           // REQUIRED (UUID)
    .build();
```

**Environment Variables:**

```bash
export TURBODOCX_PARTNER_API_KEY=TDXP-your-partner-api-key
export TURBODOCX_PARTNER_ID=your-partner-uuid
```

### Organization Management

```java
// Create an organization
JsonObject org = client.turboPartner().createOrganization("Acme Corp");
String orgId = org.getAsJsonObject("data").get("id").getAsString();

// Create with metadata and features
Map<String, Object> metadata = Map.of("industry", "Technology");
Map<String, Object> features = Map.of("maxUsers", 50, "hasTDAI", true);
JsonObject org2 = client.turboPartner().createOrganization("Beta Corp", metadata, features);

// List organizations
JsonObject orgs = client.turboPartner().listOrganizations(10, null, "acme");

// Get organization details (includes features and tracking)
JsonObject details = client.turboPartner().getOrganizationDetails(orgId);

// Update organization name
client.turboPartner().updateOrganizationInfo(orgId, "Acme Corporation");

// Update organization entitlements
Map<String, Object> newFeatures = Map.of("maxUsers", 100, "hasTDAI", true);
client.turboPartner().updateOrganizationEntitlements(orgId, newFeatures, null);

// Delete an organization
client.turboPartner().deleteOrganization(orgId);
```

### Organization User Management

```java
// List users in an organization
JsonObject users = client.turboPartner().listOrganizationUsers(orgId, 25, null, null);

// Add a user to an organization
JsonObject user = client.turboPartner().addUserToOrganization(orgId, "user@example.com", "contributor");

// Update a user's role
client.turboPartner().updateOrganizationUserRole(orgId, userId, "admin");

// Remove a user from an organization
client.turboPartner().removeUserFromOrganization(orgId, userId);

// Resend invitation email
client.turboPartner().resendOrganizationInvitationToUser(orgId, userId);
```

### Organization API Key Management

```java
// List API keys
JsonObject keys = client.turboPartner().listOrganizationApiKeys(orgId, null, null, null);

// Create an API key (full key value is only returned on creation)
JsonObject key = client.turboPartner().createOrganizationApiKey(orgId, "Production Key", "admin");
String apiKey = key.getAsJsonObject("data").get("key").getAsString();

// Update an API key
client.turboPartner().updateOrganizationApiKey(orgId, keyId, "Updated Name", null);

// Revoke an API key
client.turboPartner().revokeOrganizationApiKey(orgId, keyId);
```

### Partner API Key Management

```java
// List partner API keys
JsonObject partnerKeys = client.turboPartner().listPartnerApiKeys(null, null, null);

// Create a partner API key with scopes
JsonObject partnerKey = client.turboPartner().createPartnerApiKey(
    "CI/CD Key",
    Arrays.asList(PartnerScope.ORG_CREATE, PartnerScope.ORG_READ, PartnerScope.ORG_UPDATE),
    "Key for automated deployments"
);

// Update a partner API key
client.turboPartner().updatePartnerApiKey(keyId, "Updated Name", null,
    Arrays.asList(PartnerScope.ORG_READ, PartnerScope.AUDIT_READ));

// Revoke a partner API key
client.turboPartner().revokePartnerApiKey(keyId);
```

### Partner User Management

```java
// List partner portal users
JsonObject partnerUsers = client.turboPartner().listPartnerPortalUsers(null, null, null);

// Add a user to the partner portal.
// All seven permission keys are required -- a partial map is rejected with a 400.
Map<String, Boolean> permissions = Map.of(
    "canManageOrgs", true,
    "canManageOrgUsers", true,
    "canManagePartnerUsers", false,
    "canManageOrgAPIKeys", true,
    "canManagePartnerAPIKeys", false,
    "canUpdateEntitlements", true,
    "canViewAuditLogs", true
);
JsonObject partnerUser = client.turboPartner().addUserToPartnerPortal(
    "admin@partner.com", "admin", permissions);

// Update partner user permissions.
// The permissions map itself is optional -- but if you send it, send all seven keys.
// There is no partial permissions update.
client.turboPartner().updatePartnerUserPermissions(userId, "member", Map.of(
    "canManageOrgs", false,
    "canManageOrgUsers", true,
    "canManagePartnerUsers", false,
    "canManageOrgAPIKeys", true,
    "canManagePartnerAPIKeys", false,
    "canUpdateEntitlements", false,
    "canViewAuditLogs", true
));

// Remove a partner user
client.turboPartner().removeUserFromPartnerPortal(userId);

// Resend partner portal invitation
client.turboPartner().resendPartnerPortalInvitationToUser(userId);
```

**Partner permissions** — all seven keys are required whenever `permissions` is sent (booleans):

| Key | Grants |
|:----|:-------|
| `canManageOrgs` | Create / update / delete organizations |
| `canManageOrgUsers` | Manage users inside organizations |
| `canManagePartnerUsers` | Manage partner portal users |
| `canManageOrgAPIKeys` | Manage organization API keys |
| `canManagePartnerAPIKeys` | Manage partner API keys |
| `canUpdateEntitlements` | Update organization entitlements |
| `canViewAuditLogs` | Read the partner audit log |

**Role enums are different for orgs and partners** — do not mix them:

| Scope | Valid roles |
|:------|:------------|
| Org users, org API keys | `admin`, `contributor`, `user`, `viewer` |
| Partner portal users | `admin`, `member`, `viewer` |

### Audit Logs

```java
// Get audit logs with filters
JsonObject logs = client.turboPartner().getPartnerAuditLogs(
    100, null, null,           // limit, offset, search
    "org.create", null, null,  // action, resourceType, resourceId
    null, "2025-01-01", "2025-12-31" // success, startDate, endDate
);

JsonArray results = logs.getAsJsonObject("data").getAsJsonArray("results");
for (int i = 0; i < results.size(); i++) {
    JsonObject entry = results.get(i).getAsJsonObject();
    System.out.println(entry.get("action").getAsString() + " - " + entry.get("createdOn").getAsString());
}
```

### Available Scopes

| Scope | Description |
|:------|:------------|
| `org:create` | Create organizations |
| `org:read` | View organizations |
| `org:update` | Update organizations |
| `org:delete` | Delete organizations |
| `entitlements:update` | Update organization entitlements |
| `org-users:create` | Add users to organizations |
| `org-users:read` | View organization users |
| `org-users:update` | Update organization users |
| `org-users:delete` | Remove organization users |
| `org-apikeys:create` | Create organization API keys |
| `org-apikeys:read` | View organization API keys |
| `org-apikeys:update` | Update organization API keys |
| `org-apikeys:delete` | Revoke organization API keys |
| `partner-apikeys:create` | Create partner API keys |
| `partner-apikeys:read` | View partner API keys |
| `partner-apikeys:update` | Update partner API keys |
| `partner-apikeys:delete` | Revoke partner API keys |
| `partner-users:create` | Add partner portal users |
| `partner-users:read` | View partner portal users |
| `partner-users:update` | Update partner portal users |
| `partner-users:delete` | Remove partner portal users |
| `audit:read` | View audit logs |

### All 25 Methods

| Category | Method |
|:---------|:-------|
| **Organizations** | `createOrganization()`, `listOrganizations()`, `getOrganizationDetails()`, `updateOrganizationInfo()`, `deleteOrganization()`, `updateOrganizationEntitlements()` |
| **Org Users** | `addUserToOrganization()`, `listOrganizationUsers()`, `updateOrganizationUserRole()`, `removeUserFromOrganization()`, `resendOrganizationInvitationToUser()` |
| **Org API Keys** | `createOrganizationApiKey()`, `listOrganizationApiKeys()`, `updateOrganizationApiKey()`, `revokeOrganizationApiKey()` |
| **Partner API Keys** | `createPartnerApiKey()`, `listPartnerApiKeys()`, `updatePartnerApiKey()`, `revokePartnerApiKey()` |
| **Partner Users** | `addUserToPartnerPortal()`, `listPartnerPortalUsers()`, `updatePartnerUserPermissions()`, `removeUserFromPartnerPortal()`, `resendPartnerPortalInvitationToUser()` |
| **Audit Logs** | `getPartnerAuditLogs()` |

---

## TurboWebhooks (Signature Webhook)

The `TurboWebhooks` class manages your organization's **signature webhook** — a single subscription to TurboDocx signature events (`signature.document.completed`, `signature.document.voided`). It also exposes a `WebhookSignatureVerifier` helper for incoming webhook receivers.

> **One webhook per org.** The SDK manages a single fixed-name webhook (`signature`) per org so SDK-managed and UI-managed webhooks stay in sync — what you create here also appears in the dashboard's Signature Webhooks settings page. To manage multiple webhooks per org, call the REST API directly.
>
> **Requires administrator role.** All webhook routes require an admin TDX- API key.

### Configuration

Build a client via `TurboDocxClient.Builder().buildWebhooksClient()` — this variant skips the `senderEmail` requirement that `buildSignClient()` enforces, since webhook routes don't send emails.

```java
import com.turbodocx.TurboDocxClient;
import com.turbodocx.TurboWebhooks;

TurboWebhooks webhooks = new TurboDocxClient.Builder()
        .apiKey(System.getenv("TURBODOCX_API_KEY"))
        .orgId(System.getenv("TURBODOCX_ORG_ID"))
        // .baseUrl("http://localhost:3000")  // optional, defaults to https://api.turbodocx.com
        .buildWebhooksClient();
```

### Create the signature webhook (save the secret immediately)

```java
JsonObject created = webhooks.createWebhook(
        List.of("https://your-server.example.com/webhooks/turbodocx"),  // HTTPS only, 1-10 urls
        List.of("signature.document.completed", "signature.document.voided"));

// `secret` is shown ONCE here. Store it securely; it cannot be retrieved later.
System.out.println("Save this secret: " + created.get("secret").getAsString());
```

If the signature webhook already exists, `createWebhook` throws `TurboDocxException.ConflictException` (409). Either update the existing one with `updateWebhook` or `deleteWebhook` first.

### Get, update, delete

```java
JsonObject webhook = webhooks.getWebhook();
// webhook.getAsJsonObject("deliveryStats") and webhook.getAsJsonArray("availableEvents") are included

// Pass null to leave a field unchanged
webhooks.updateWebhook(null, null, false);  // isActive=false
webhooks.updateWebhook(
        List.of("https://new-endpoint.example.com/webhooks/turbodocx"),
        List.of("signature.document.completed"),
        null);
webhooks.deleteWebhook();
```

> **`urls` and `events` can never be empty.** They stay `min(1)` on the backend even on update, so `List.of()` is a 400, not a "clear this field" instruction — there is no way to remove every URL from a webhook. `updateWebhook` throws `TurboDocxException.ValidationException` before hitting the wire if you pass an empty list. To leave a field unchanged, pass `null`. `urls` accepts **1-10** entries.

### Test deliveries and replay

```java
JsonObject tested = webhooks.testWebhook(
        "signature.document.completed",
        Map.of("documentId", "doc-xyz", "status", "completed"));

JsonObject deliveries = webhooks.listWebhookDeliveries();
String firstId = deliveries.getAsJsonArray("results").get(0).getAsJsonObject().get("id").getAsString();
JsonObject replayed = webhooks.replayWebhookDelivery(firstId);
```

### Rotate the secret

```java
JsonObject rotated = webhooks.regenerateWebhookSecret();
// rotated.get("secret").getAsString() is the new secret. Old signatures will fail immediately.
```

### Aggregate stats

```java
JsonObject stats = webhooks.getWebhookStats(30);
// stats.getAsJsonObject("summary").get("successRate"), stats.getAsJsonArray("eventBreakdown")
```

### Verify incoming webhook signatures

Webhook deliveries from TurboDocx are signed with HMAC-SHA256 over `timestamp + "." + rawBody` using your webhook secret. Use `WebhookSignatureVerifier` in your receiver (constant-time comparison via `MessageDigest.isEqual`):

```java
import com.turbodocx.WebhookSignatureVerifier;

// In your webhook handler (Servlet example):
byte[] rawBody = request.getInputStream().readAllBytes(); // raw bytes; do NOT parse JSON first
String signature = request.getHeader("X-TurboDocx-Signature");
String timestamp = request.getHeader("X-TurboDocx-Timestamp");
String secret = System.getenv("TURBODOCX_WEBHOOK_SECRET");

if (!WebhookSignatureVerifier.verify(rawBody, signature, timestamp, secret)) {
    response.sendError(401, "invalid signature");
    return;
}

// Now safe to parse and process
```

By default the helper enforces a 300-second timestamp tolerance to prevent replay attacks. Use the full 6-arg overload to override `toleranceSeconds` (0 disables the check — not recommended in production) or to inject a `now` supplier for testing.

---

## TurboQuote (CPQ / Quoting)

The `TurboQuote` module provides end-to-end quoting operations: create and send professional quotes, manage your product catalog and bundles, apply pricebooks, and handle the full quote lifecycle (draft, sent, accepted, declined, voided).

### Configuration

Build a client via `TurboQuoteClient.Builder()` — no `senderEmail` required (quotes do not send signature emails through TurboSign).

```java
import com.turbodocx.TurboQuoteClient;
import com.turbodocx.TurboQuote;

TurboQuote tq = new TurboQuoteClient.Builder()
        .apiKey(System.getenv("TURBODOCX_API_KEY"))
        .orgId(System.getenv("TURBODOCX_ORG_ID"))
        // .baseUrl("http://localhost:3000")  // optional
        .build()
        .turboQuote();
```

**Environment variables:**

```bash
export TURBODOCX_API_KEY=your-api-key
export TURBODOCX_ORG_ID=your-org-id
```

### Create a quote, add line items, and send

```java
// 1. Create the quote
CreateQuoteRequest quoteReq = new CreateQuoteRequest();
quoteReq.setName("Q1 Software Proposal");
quoteReq.setCompanyId(companyId);
quoteReq.setContactId(contactId);
quoteReq.setTermDays(90);         // optional; defaults to 60, max 3650
quoteReq.setCurrency(Currency.USD);

Quote quote = tq.createQuote(quoteReq);

// 2. Add a line item.
//    productId, productName, unitPrice and billingFrequency are all REQUIRED.
//    productId may be null for an ad-hoc item (the SDK still sends the key).
AddLineItemRequest item = new AddLineItemRequest();
item.setProductName("Enterprise License");
item.setProductId(null);          // null = custom line item
item.setUnitPrice(1200.00);
item.setQuantity(5.0);
item.setBillingFrequency("annual");
item.setDiscountType(DiscountType.PERCENT);
item.setDiscountPercent(10.0);

tq.addLineItems(quote.getId(), item);

// 3. Send the quote
SendQuoteResponse sent = tq.sendQuote(quote.getId());
System.out.println("Status: " + sent.getQuote().getStatus()); // "sent"
```

### Quote terms and auto-renewal

`termDays` defaults to **60** and accepts up to **3650** (10 years). The special value **`-1`** means auto-renewal, and it is the only case where `renewalPeriod` is allowed — in fact it is then **required**:

```java
CreateQuoteRequest autoRenew = new CreateQuoteRequest();
autoRenew.setName("Managed Services (auto-renew)");
autoRenew.setCompanyId(companyId);
autoRenew.setContactId(contactId);
autoRenew.setTermDays(-1);                          // -1 == auto-renewal
autoRenew.setRenewalPeriod(RenewalPeriod.MONTHLY);  // REQUIRED when termDays == -1

Quote renewing = tq.createQuote(autoRenew);
```

For any other `termDays`, leave `renewalPeriod` null — sending it is a 400.

### Handling an expired quote

`handleExpiredQuote` voids or declines an expired **sent** quote and returns the duplicate it creates with the new validity date. All three fields are required, and `action` accepts **only** `"void"` or `"decline"`:

```java
HandleExpiredQuoteRequest expiredReq = new HandleExpiredQuoteRequest();
expiredReq.setAction("void");                       // "void" or "decline" — nothing else
expiredReq.setReason("Pricing refreshed for Q4");   // REQUIRED, max 190 chars
expiredReq.setNewValidUntil("2026-12-31");          // REQUIRED, ISO 8601

Quote replacement = tq.handleExpiredQuote(quote.getId(), expiredReq);
System.out.println("Replacement: " + replacement.getQuoteNumber());
```

### Download a quote PDF

```java
byte[] pdf = tq.downloadQuotePdf(quoteId);
Files.write(Paths.get("quote.pdf"), pdf);
```

### All 47 methods

| Group | Methods |
|:------|:--------|
| **Quotes** | `listQuotes`, `createQuote`, `getQuote`, `updateQuote`, `deleteQuote`, `duplicateQuote`, `applyPriceBook`, `removePriceBook`, `downloadQuotePdf` |
| **Quote status** | `sendQuote`, `sendQuoteWithDeliverable`, `declineQuote`, `voidQuote`, `handleExpiredQuote` |
| **Line items** | `listLineItems`, `addLineItems`, `addBundleLineItems`, `updateLineItem`, `removeLineItem` |
| **Products** | `listProducts`, `createProduct`, `getProduct`, `updateProduct`, `deleteProduct`, `duplicateProduct`, `getProductPrimaryImages` |
| **Pricebooks** | `listPriceBooks`, `createPriceBook`, `getPriceBook`, `updatePriceBook`, `deletePriceBook`, `duplicatePriceBook`, `listPriceBookProducts` |
| **Bundles** | `listBundles`, `createBundle`, `getBundle`, `updateBundle`, `deleteBundle`, `duplicateBundle` |
| **Companies** | `listCompanies`, `createCompany`, `getCompany`, `updateCompany`, `deleteCompany`, `listCompanyContacts` |
| **Contacts** | `listContacts`, `createContact`, `updateContact`, `deleteContact` |
| **Templates** | `listTemplates`, `getTemplate`, `getTemplateById`, `createTemplate`, `updateTemplate`, `deleteTemplate` |
| **Types** | `listTypes`, `createType`, `updateType`, `deleteType` |
| **Convenience** | `createAndSend` |

### Examples

- [`TurboQuoteBasic.java`](./examples/TurboQuoteBasic.java) — Full quote lifecycle: create company, quote, line items, send, download PDF
- [`TurboQuoteProducts.java`](./examples/TurboQuoteProducts.java) — Product and bundle catalog management
- [`TurboQuotePricebooks.java`](./examples/TurboQuotePricebooks.java) — Pricebook CRUD, apply to quote, optional send-with-deliverable

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
- [`TurboPartnerBasic.java`](./examples/TurboPartnerBasic.java) - Partner portal: create org, add user, create API key

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
        DocumentStatusResponse status = client.turboSign().getStatus(documentId);

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
    public TurboDocxClient turboDocxClient(
            @Value("${turbodocx.api-key}") String apiKey,
            @Value("${turbodocx.org-id}") String orgId,
            @Value("${turbodocx.sender-email}") String senderEmail,
            @Value("${turbodocx.sender-name}") String senderName) {
        return new TurboDocxClient.Builder()
            .apiKey(apiKey)
            .orgId(orgId)
            .senderEmail(senderEmail)
            .senderName(senderName)
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
- ✅ `getAuditTrail()` - Get document audit trail

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
    DocumentStatusResponse result = client.turboSign().getStatus("invalid-id");
} catch (TurboDocxException e) {
    System.out.println("Status: " + e.getStatusCode());
    System.out.println("Message: " + e.getMessage());
    System.out.println("Code: " + e.getCode());
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
| [turbodocx/sdk (PHP)](../php-sdk) | PHP SDK |
| [turbodocx-sdk (Python)](../py-sdk) | Python SDK |
| [turbodocx-sdk (Go)](../go-sdk) | Go SDK |
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
