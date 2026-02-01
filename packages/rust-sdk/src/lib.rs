//! # TurboDocx Rust SDK
//!
//! Official Rust SDK for TurboDocx API - Advanced document generation and digital signatures
//!
//! ## Features
//!
//! - **TurboTemplate**: Advanced document generation with Angular-like templating
//!   - Variable substitution, nested objects, loops, conditionals, expressions
//! - **Type-safe API**: Strongly typed with comprehensive error handling
//! - **Async/await**: Built on tokio and reqwest for high performance
//! - **Environment variables**: Auto-configuration from environment
//!
//! ## Quick Start
//!
//! ```no_run
//! use turbodocx_sdk::{TurboTemplate, GenerateTemplateRequest, TemplateVariable};
//!
//! #[tokio::main]
//! async fn main() -> Result<(), Box<dyn std::error::Error>> {
//!     // Configure (or use environment variables)
//!     use turbodocx_sdk::http::HttpClientConfig;
//!     TurboTemplate::configure(
//!         HttpClientConfig::new("your-api-key")
//!             .with_org_id("your-org-id")
//!     )?;
//!
//!     // Generate a document
//!     let request = GenerateTemplateRequest::new(
//!         "your-template-id",
//!         vec![
//!             TemplateVariable::simple("{name}", "name", "John Doe"),
//!             TemplateVariable::simple("{amount}", "amount", 1000),
//!         ],
//!         "My Document",
//!     );
//!
//!     let response = TurboTemplate::generate(request).await?;
//!     println!("Deliverable ID: {:?}", response.id);
//!
//!     Ok(())
//! }
//! ```
//!
//! ## Environment Variables
//!
//! - `TURBODOCX_API_KEY`: Your TurboDocx API key
//! - `TURBODOCX_BASE_URL`: API base URL (defaults to https://api.turbodocx.com)
//! - `TURBODOCX_ORG_ID`: Organization ID
//!

pub mod http;
pub mod modules;
pub mod types;
pub mod utils;

// Re-export main types and modules
pub use http::{HttpClient, HttpClientConfig};
pub use modules::{TurboSign, TurboTemplate};
pub use types::{
    // Sign types
    AuditTrailDocument,
    AuditTrailEntry,
    AuditTrailResponse,
    AuditTrailUser,
    CreateSignatureReviewLinkRequest,
    CreateSignatureReviewLinkResponse,
    DocumentStatusResponse,
    Field,
    FieldOffset,
    FieldSize,
    // Template types
    GenerateTemplateRequest,
    GenerateTemplateResponse,
    OutputFormat,
    Placement,
    Recipient,
    RecipientStatus,
    ResendEmailResponse,
    SendSignatureRequest,
    SendSignatureResponse,
    SignatureFieldType,
    TemplateAnchor,
    TemplateVariable,
    VariableMimeType,
    VoidDocumentResponse,
};
pub use utils::{Result, TurboDocxError};
