# TurboDocx Rust SDK

Official Rust SDK for TurboDocx - Digital Signatures and Document Generation Platform.

[![Crates.io](https://img.shields.io/crates/v/turbodocx-sdk.svg)](https://crates.io/crates/turbodocx-sdk)
[![Documentation](https://docs.rs/turbodocx-sdk/badge.svg)](https://docs.rs/turbodocx-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **TurboSign** - Digital signature workflows with comprehensive field types
- **TurboTemplate** - Advanced document generation with templating
- Async/await support with Tokio
- Type-safe API with comprehensive error handling
- Zero system dependencies (uses rustls-tls)
- Environment variable configuration

## Installation

Add this to your `Cargo.toml`:

```toml
[dependencies]
turbodocx-sdk = "0.1.0"
tokio = { version = "1.0", features = ["full"] }
```

## Quick Start

### TurboSign - Digital Signatures

```rust
use turbodocx_sdk::{
    TurboSign, SendSignatureRequest, Recipient, Field, SignatureFieldType,
    http::HttpClientConfig
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Configure TurboSign
    TurboSign::configure(
        HttpClientConfig::new("your-api-key")
            .with_org_id("your-org-id")
            .with_sender_email("support@yourcompany.com")
            .with_sender_name("Your Company")
    )?;

    // Send signature request
    let request = SendSignatureRequest {
        file_link: Some("https://example.com/contract.pdf".to_string()),
        file: None,
        file_name: None,
        deliverable_id: None,
        template_id: None,
        recipients: vec![
            Recipient::new("John Doe", "john@example.com", 1)
        ],
        fields: vec![
            Field::anchor_based(
                SignatureFieldType::Signature,
                "{SignHere}",
                "john@example.com"
            )
        ],
        document_name: Some("Service Agreement".to_string()),
        document_description: None,
        sender_name: None,
        sender_email: None,
        cc_emails: None,
    };

    let response = TurboSign::send_signature(request).await?;
    println!("Document ID: {}", response.document_id);

    Ok(())
}
```

### TurboTemplate - Document Generation

```rust
use turbodocx_sdk::{
    TurboTemplate, GenerateTemplateRequest, TemplateVariable,
    OutputFormat, http::HttpClientConfig
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Configure TurboTemplate
    TurboTemplate::configure(
        HttpClientConfig::new("your-api-key")
            .with_org_id("your-org-id")
    )?;

    // Generate document
    let request = GenerateTemplateRequest::new(
        "template-uuid",
        vec![
            TemplateVariable::simple("{name}", "name", "John Doe"),
            TemplateVariable::simple("{company}", "company", "Acme Corp"),
        ],
        "Generated Contract",  // name is required
    );

    let response = TurboTemplate::generate(request).await?;
    println!("Deliverable ID: {:?}", response.id);

    Ok(())
}
```

## Configuration

The SDK can be configured via environment variables or programmatically:

### Environment Variables

```bash
export TURBODOCX_API_KEY="your-api-key"
export TURBODOCX_ORG_ID="your-org-id"
export TURBODOCX_SENDER_EMAIL="support@yourcompany.com"  # For TurboSign
export TURBODOCX_SENDER_NAME="Your Company"              # For TurboSign
export TURBODOCX_BASE_URL="https://api.turbodocx.com"    # Optional
```

### Programmatic Configuration

```rust
use turbodocx_sdk::http::HttpClientConfig;

let config = HttpClientConfig::new("your-api-key")
    .with_org_id("your-org-id")
    .with_sender_email("support@company.com")
    .with_sender_name("Company Support")
    .with_base_url("https://api.turbodocx.com");

// Configure TurboSign
TurboSign::configure(config.clone())?;

// Configure TurboTemplate
TurboTemplate::configure(config)?;
```

---

## TurboSign - Digital Signatures

TurboSign enables you to send documents for digital signatures with customizable fields and workflows.

### Core Concepts

- **Recipients**: People who need to sign the document
- **Fields**: Signature, date, text, and other input fields
- **Positioning**: Coordinate-based or template anchor-based
- **Workflows**: Review links (preview) or direct sending

### Send Signature Request

Send a document for signatures immediately:

```rust
use turbodocx_sdk::{TurboSign, SendSignatureRequest, Recipient, Field, SignatureFieldType};

let request = SendSignatureRequest {
    file_link: Some("https://example.com/contract.pdf".to_string()),
    file: None,
    file_name: None,
    deliverable_id: None,
    template_id: None,
    recipients: vec![
        Recipient::new("Alice Johnson", "alice@example.com", 1),
        Recipient::new("Bob Smith", "bob@example.com", 2),
    ],
    fields: vec![
        Field::coordinate_based(
            SignatureFieldType::Signature,
            1,      // page
            100.0,  // x
            500.0,  // y
            200.0,  // width
            50.0,   // height
            "alice@example.com"
        ),
        Field::coordinate_based(
            SignatureFieldType::Date,
            1,
            320.0,
            500.0,
            100.0,
            30.0,
            "alice@example.com"
        ),
    ],
    document_name: Some("Employment Contract".to_string()),
    document_description: Some("Annual employment agreement".to_string()),
    sender_name: Some("HR Team".to_string()),
    sender_email: Some("hr@company.com".to_string()),
    cc_emails: Some(vec!["manager@company.com".to_string()]),
};

let response = TurboSign::send_signature(request).await?;
println!("Document ID: {}", response.document_id);
println!("Message: {}", response.message);
```

### Create Review Link

Create a signature request without sending emails (for preview):

```rust
use turbodocx_sdk::{TurboSign, CreateSignatureReviewLinkRequest};

let request = CreateSignatureReviewLinkRequest {
    file_link: Some("https://example.com/contract.pdf".to_string()),
    file: None,
    file_name: None,
    deliverable_id: None,
    template_id: None,
    recipients: vec![
        Recipient::new("John Doe", "john@example.com", 1)
    ],
    fields: vec![
        Field::anchor_based(
            SignatureFieldType::Signature,
            "{ClientSignature}",
            "john@example.com"
        )
    ],
    document_name: Some("Service Agreement".to_string()),
    document_description: None,
    sender_name: None,
    sender_email: None,
    cc_emails: None,
};

let response = TurboSign::create_signature_review_link(request).await?;
println!("Document ID: {}", response.document_id);
println!("Status: {}", response.status);
if let Some(preview_url) = response.preview_url {
    println!("Preview URL: {}", preview_url);
}
```

### Field Types

TurboSign supports 11 different field types:

```rust
use turbodocx_sdk::SignatureFieldType;

// Signature fields
SignatureFieldType::Signature    // Full signature
SignatureFieldType::Initial      // Initials only

// Date fields
SignatureFieldType::Date         // Date picker

// Text fields
SignatureFieldType::Text         // Free-form text
SignatureFieldType::FullName     // Full name
SignatureFieldType::FirstName    // First name only
SignatureFieldType::LastName     // Last name only
SignatureFieldType::Email        // Email address
SignatureFieldType::Title        // Job title
SignatureFieldType::Company      // Company name

// Other fields
SignatureFieldType::Checkbox     // Checkbox (true/false)
```

### Field Positioning

#### Coordinate-Based Positioning

Place fields at exact coordinates on the page:

```rust
let field = Field::coordinate_based(
    SignatureFieldType::Signature,
    1,      // page number
    100.0,  // x coordinate (from left)
    500.0,  // y coordinate (from top)
    200.0,  // width
    50.0,   // height
    "recipient@example.com"
);
```

#### Template Anchor-Based Positioning

Place fields dynamically using text anchors in the document:

```rust
// Simple anchor (replaces the anchor text)
let field = Field::anchor_based(
    SignatureFieldType::Signature,
    "{SignHere}",
    "recipient@example.com"
);

// Advanced anchor with custom placement
let mut field = Field::anchor_based(
    SignatureFieldType::Signature,
    "{SignHere}",
    "recipient@example.com"
);

field.template = Some(TemplateAnchor {
    anchor: Some("{SignHere}".to_string()),
    search_text: None,
    placement: Some(Placement::After),  // Place after the anchor
    size: Some(FieldSize {
        width: 200.0,
        height: 50.0,
    }),
    offset: Some(FieldOffset {
        x: 10.0,   // 10 pixels to the right
        y: 0.0,    // Same vertical position
    }),
    case_sensitive: Some(false),
    use_regex: Some(false),
});
```

### Placement Options

```rust
use turbodocx_sdk::Placement;

Placement::Replace  // Replace the anchor text
Placement::Before   // Place before the anchor
Placement::After    // Place after the anchor
Placement::Above    // Place above the anchor
Placement::Below    // Place below the anchor
```

### Document Management

#### Get Document Status

```rust
let status = TurboSign::get_status("document-id").await?;
println!("Status: {}", status.status);
println!("Created: {}", status.created_at);
```

#### Get Audit Trail

```rust
let audit_trail = TurboSign::get_audit_trail("document-id").await?;
println!("Document: {}", audit_trail.document.name);
println!("Status: {}", audit_trail.document.status);

for entry in audit_trail.audit_trail {
    println!("{}: {} by {}",
        entry.timestamp,
        entry.action_type,
        entry.user.email
    );
}
```

#### Void Document

```rust
let response = TurboSign::void_document(
    "document-id",
    Some("Contract terms changed")
).await?;
println!("{}", response.message);
```

#### Resend Emails

```rust
let response = TurboSign::resend_emails(
    "document-id",
    vec!["recipient-id-1", "recipient-id-2"]
).await?;
println!("Sent to {} recipients", response.recipient_count);
```

#### Download Signed Document

```rust
let download_url = TurboSign::download("document-id").await?;
println!("Download from: {}", download_url);

// Use the URL to download the file
// The URL is typically valid for a limited time
```

### Multiple Recipients with Signing Order

```rust
let request = SendSignatureRequest {
    file_link: Some("https://example.com/contract.pdf".to_string()),
    recipients: vec![
        Recipient::new("First Signer", "first@example.com", 1),
        Recipient::new("Second Signer", "second@example.com", 2),
        Recipient::new("Final Signer", "final@example.com", 3),
    ],
    fields: vec![
        // Fields for first signer
        Field::coordinate_based(
            SignatureFieldType::Signature,
            1, 100.0, 500.0, 200.0, 50.0,
            "first@example.com"
        ),
        // Fields for second signer
        Field::coordinate_based(
            SignatureFieldType::Signature,
            2, 100.0, 500.0, 200.0, 50.0,
            "second@example.com"
        ),
        // Fields for final signer
        Field::coordinate_based(
            SignatureFieldType::Signature,
            3, 100.0, 500.0, 200.0, 50.0,
            "final@example.com"
        ),
    ],
    // ... other fields
};
```

### Field Customization

```rust
let mut field = Field::coordinate_based(
    SignatureFieldType::Text,
    1, 100.0, 500.0, 300.0, 100.0,
    "recipient@example.com"
);

// Customize field properties
field.is_multiline = Some(true);
field.is_readonly = Some(false);
field.required = Some(true);
field.default_value = Some("Enter text here".to_string());
field.background_color = Some("#FFFF00".to_string());
field.tooltip = Some("Please enter your comments".to_string());
field.font_size = Some(12.0);
field.font_family = Some("Arial".to_string());
```

### Using with TurboTemplate Deliverables

You can send TurboTemplate-generated documents for signature:

```rust
// 1. Generate document with TurboTemplate
let template_request = GenerateTemplateRequest::new(
    "template-uuid",
    vec![
        TemplateVariable::simple("{client_name}", "client_name", "John Doe"),
        TemplateVariable::simple("{contract_date}", "contract_date", "2024-01-15"),
    ],
    "Contract",  // name is required
);

let template_response = TurboTemplate::generate(template_request).await?;
let deliverable_id = template_response.id.unwrap();

// 2. Send for signature using the deliverable_id
let sign_request = SendSignatureRequest {
    deliverable_id: Some(deliverable_id.clone()),
    file_link: None,
    file: None,
    file_name: None,
    template_id: None,
    recipients: vec![
        Recipient::new("John Doe", "john@example.com", 1)
    ],
    fields: vec![
        Field::anchor_based(
            SignatureFieldType::Signature,
            "{ClientSignature}",
            "john@example.com"
        )
    ],
    document_name: Some("Contract".to_string()),
    document_description: None,
    sender_name: None,
    sender_email: None,
    cc_emails: None,
};

let sign_response = TurboSign::send_signature(sign_request).await?;
```

---

## TurboTemplate - Document Generation

TurboTemplate enables advanced document generation with variable substitution, loops, conditionals, and more.

### Simple Variable Substitution

```rust
use turbodocx_sdk::{TurboTemplate, GenerateTemplateRequest, TemplateVariable};

let request = GenerateTemplateRequest::new(
    "template-uuid",
    vec![
        TemplateVariable::simple("{name}", "name", "John Doe"),
        TemplateVariable::simple("{company}", "company", "Acme Corporation"),
        TemplateVariable::simple("{date}", "date", "2024-01-15"),
    ],
    "Generated Document",  // name is required
);

let response = TurboTemplate::generate(request).await?;
println!("Deliverable ID: {:?}", response.id);
println!("Download URL: {:?}", response.download_url);
```

### Nested Objects

```rust
use serde_json::json;

let request = GenerateTemplateRequest::new(
    "template-uuid",
    vec![
        TemplateVariable::advanced_engine("{client}", "client", json!({
            "name": "John Doe",
            "email": "john@example.com",
            "address": {
                "street": "123 Main St",
                "city": "New York",
                "zip": "10001"
            }
        }))?,
    ],
    "Client Document",  // name is required
);
```

In your template, use: `{client.name}`, `{client.address.city}`, etc.

### Array Loops

```rust
let request = GenerateTemplateRequest::new(
    "template-uuid",
    vec![
        TemplateVariable::loop_var("{items}", "items", json!([
            {
                "name": "Product A",
                "price": 99.99,
                "quantity": 2
            },
            {
                "name": "Product B",
                "price": 149.99,
                "quantity": 1
            }
        ]))?,
    ],
    "Invoice",  // name is required
);
```

In your template:
```
{#items}
  {name} - ${price} x {quantity}
{/items}
```

### Conditionals

```rust
let request = GenerateTemplateRequest::new(
    "template-uuid",
    vec![
        TemplateVariable::conditional("{customer_type}", "customer_type", "premium")?,
        TemplateVariable::simple("{discount}", "discount", "20%"),
    ],
    "Special Offer",  // name is required
);
```

In your template:
```
{#if customer_type == "premium"}
  Special discount: {discount}
{/if}
```

### Images

```rust
let request = GenerateTemplateRequest::new(
    "template-uuid",
    vec![
        TemplateVariable::image("{company_logo}", "company_logo", "https://example.com/logo.png"),
        TemplateVariable::image("{signature}", "signature", "data:image/png;base64,iVBORw0KGgoAAAANS..."),
    ],
    "Letterhead",  // name is required
);
```

### Expressions

```rust
let request = GenerateTemplateRequest::new(
    "template-uuid",
    vec![
        TemplateVariable::simple("{price}", "price", "100"),
        TemplateVariable::simple("{quantity}", "quantity", "5"),
        TemplateVariable::simple("{tax_rate}", "tax_rate", "0.08"),
    ],
    "Invoice",  // name is required
);
```

In your template:
```
Subtotal: {price * quantity}
Tax: {price * quantity * tax_rate}
Total: {price * quantity * (1 + tax_rate)}
```

### Advanced Templating Features

TurboTemplate supports powerful template expressions:

- **Variable Substitution**: `{{variable_name}}`
- **Nested Properties**: `{{user.address.city}}`
- **Array Loops**: `{{#each items}}...{{/each}}`
- **Conditionals**: `{{#if condition}}...{{/if}}`
- **Expressions**: `{{price * quantity}}`
- **Comparisons**: `{{#if age > 18}}...{{/if}}`
- **Logical Operators**: `{{#if premium && active}}...{{/if}}`

---

## Error Handling

The SDK uses a comprehensive error type that covers all failure scenarios:

```rust
use turbodocx_sdk::TurboDocxError;

match TurboSign::send_signature(request).await {
    Ok(response) => {
        println!("Success: {}", response.document_id);
    }
    Err(TurboDocxError::Authentication(msg)) => {
        eprintln!("Auth error: {}", msg);
    }
    Err(TurboDocxError::InvalidRequest(msg)) => {
        eprintln!("Invalid request: {}", msg);
    }
    Err(TurboDocxError::NotFound(msg)) => {
        eprintln!("Not found: {}", msg);
    }
    Err(TurboDocxError::RateLimitExceeded(msg)) => {
        eprintln!("Rate limit: {}", msg);
    }
    Err(TurboDocxError::ServerError(msg)) => {
        eprintln!("Server error: {}", msg);
    }
    Err(e) => {
        eprintln!("Error: {}", e);
    }
}
```

### Error Types

- `Authentication` - Invalid API key or credentials
- `InvalidRequest` - Malformed request or missing required fields
- `NotFound` - Resource not found
- `RateLimitExceeded` - Too many requests
- `ServerError` - Server-side error
- `Network` - Network connectivity issues
- `Serialization` - JSON serialization/deserialization errors
- `Other` - Other errors

---

## Testing

Run the test suite:

```bash
# Run all tests
cargo test

# Run tests with output
cargo test -- --nocapture

# Run specific test module
cargo test turbosign_test

# Run with coverage
cargo test --all-features
```

The SDK includes comprehensive tests:
- Unit tests for type construction and serialization
- Integration tests for API operations
- Documentation tests for code examples

---

## Examples

See the `examples/` directory for complete working examples:

- [`sign.rs`](examples/sign.rs) - Digital signature workflows
- [`simple.rs`](examples/simple.rs) - Basic document generation
- [`advanced.rs`](examples/advanced.rs) - Advanced templating features

Run examples:

```bash
# Run TurboSign example
cargo run --example sign

# Run TurboTemplate simple example
cargo run --example simple

# Run TurboTemplate advanced example
cargo run --example advanced
```

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- GitHub Issues: [https://github.com/turbodocx/sdk/issues](https://github.com/turbodocx/sdk/issues)
- Documentation: [https://docs.turbodocx.com](https://docs.turbodocx.com)
- Email: support@turbodocx.com
