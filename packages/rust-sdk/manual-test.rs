/**
 * TurboDocx Rust SDK - Manual Test Suite
 *
 * Tests for both TurboSign (digital signatures) and TurboTemplate (document generation)
 *
 * Run: cargo run --bin manual-test
 *
 * Make sure to configure the values below before running.
 *
 * Note: Add this to Cargo.toml under [[bin]]:
 * [[bin]]
 * name = "manual-test"
 * path = "manual-test.rs"
 */

use serde_json::json;
use std::fs;
use turbodocx_sdk::{
    http::HttpClientConfig, CreateSignatureReviewLinkRequest, Field, GenerateTemplateRequest,
    OutputFormat, Recipient, SendSignatureRequest, SignatureFieldType, TemplateVariable, TurboSign,
    TurboTemplate,
};

// =============================================
// CONFIGURE THESE VALUES BEFORE RUNNING
// =============================================
const API_KEY: &str = "your-api-key-here"; // Replace with your actual TurboDocx API key
const BASE_URL: &str = "https://api.turbodocx.com"; // Replace with your API URL
const ORG_ID: &str = "your-org-id-here"; // Replace with your organization UUID

const TEST_PDF_PATH: &str = "./test-document.pdf"; // Replace with path to your test PDF/DOCX
const TEST_EMAIL: &str = "recipient@example.com"; // Replace with a real email to receive notifications
const TEMPLATE_ID: &str = "your-template-uuid-here"; // Replace with your template UUID

// =============================================
// TURBOSIGN TEST FUNCTIONS
// =============================================

/// Test 1: Create Signature Review Link
async fn test_create_signature_review_link() -> Result<String, Box<dyn std::error::Error>> {
    println!("\n--- Test 1: createSignatureReviewLink ---");

    let pdf_bytes = fs::read(TEST_PDF_PATH)?;

    let request = CreateSignatureReviewLinkRequest {
        file: Some(pdf_bytes),
        file_link: None,
        file_name: None,
        deliverable_id: None,
        template_id: None,
        recipients: vec![Recipient::new("Test User", TEST_EMAIL, 1)],
        fields: vec![
            Field::coordinate_based(
                SignatureFieldType::Signature,
                1,
                100.0,
                550.0,
                200.0,
                50.0,
                TEST_EMAIL,
            ),
            Field::coordinate_based(
                SignatureFieldType::Checkbox,
                1,
                320.0,
                550.0,
                50.0,
                50.0,
                TEST_EMAIL,
            ),
        ],
        document_name: Some("Review Test Document".to_string()),
        document_description: None,
        sender_name: None,
        sender_email: None,
        cc_emails: None,
    };

    let result = TurboSign::create_signature_review_link(request).await?;
    println!("Result: {:#?}", result);
    Ok(result.document_id)
}

/// Test 2: Send Signature
async fn test_send_signature() -> Result<String, Box<dyn std::error::Error>> {
    println!("\n--- Test 2: sendSignature ---");

    let pdf_bytes = fs::read(TEST_PDF_PATH)?;

    let request = SendSignatureRequest {
        file: Some(pdf_bytes),
        file_link: None,
        file_name: None,
        deliverable_id: None,
        template_id: None,
        recipients: vec![Recipient::new("Signer One", TEST_EMAIL, 1)],
        fields: vec![
            Field::coordinate_based(
                SignatureFieldType::Signature,
                1,
                100.0,
                550.0,
                200.0,
                50.0,
                TEST_EMAIL,
            ),
            Field::coordinate_based(
                SignatureFieldType::Checkbox,
                1,
                320.0,
                550.0,
                50.0,
                50.0,
                TEST_EMAIL,
            ),
        ],
        document_name: Some("Signing Test Document".to_string()),
        document_description: Some("Sample contract for testing".to_string()),
        sender_name: None,
        sender_email: None,
        cc_emails: Some(vec!["cc@example.com".to_string()]),
    };

    let result = TurboSign::send_signature(request).await?;
    println!("Result: {:#?}", result);
    Ok(result.document_id)
}

/// Test 3: Get Status
async fn test_get_status(document_id: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("\n--- Test 3: getStatus ---");

    let result = TurboSign::get_status(document_id).await?;
    println!("Result: {:#?}", result);
    Ok(())
}

/// Test 4: Download
async fn test_download(document_id: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("\n--- Test 4: download ---");

    let download_url = TurboSign::download(document_id).await?;
    println!("Download URL: {}", download_url);
    Ok(())
}

/// Test 5: Resend Emails
async fn test_resend(
    document_id: &str,
    recipient_ids: Vec<&str>,
) -> Result<(), Box<dyn std::error::Error>> {
    println!("\n--- Test 5: resendEmails ---");

    let result = TurboSign::resend_emails(document_id, recipient_ids).await?;
    println!("Result: {:#?}", result);
    Ok(())
}

/// Test 6: Void Document
async fn test_void(document_id: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("\n--- Test 6: voidDocument ---");

    let result = TurboSign::void_document(document_id, Some("Testing void functionality")).await?;
    println!("Result: {:#?}", result);
    Ok(())
}

/// Test 7: Get Audit Trail
async fn test_get_audit_trail(document_id: &str) -> Result<(), Box<dyn std::error::Error>> {
    println!("\n--- Test 7: getAuditTrail ---");

    let result = TurboSign::get_audit_trail(document_id).await?;
    println!("Result: {:#?}", result);
    Ok(())
}

// =============================================
// TURBOTEMPLATE TEST FUNCTIONS
// =============================================

/// Test 8: Simple Variable Substitution
///
/// Template usage: "Dear {customer_name}, your order total is ${order_total}."
async fn test_simple_variables() -> Result<String, Box<dyn std::error::Error>> {
    println!("\n--- Test 8: Simple Variable Substitution ---");

    let request = GenerateTemplateRequest::new(
        TEMPLATE_ID,
        vec![
            TemplateVariable::simple("{customer_name}", "customer_name", "John Doe"),
            TemplateVariable::simple("{order_total}", "order_total", 1500),
            TemplateVariable::simple("{order_date}", "order_date", "2024-01-01"),
        ],
    )
    .with_name("Simple Substitution Document")
    .with_description("Basic variable substitution example");

    let result = TurboTemplate::generate(request).await?;
    println!("✓ Deliverable ID: {:?}", result.deliverable_id);
    Ok(result.deliverable_id.unwrap_or_default())
}

/// Test 9: Nested Objects with Dot Notation
///
/// Template usage: "Name: {user.name}, Company: {user.profile.company}"
async fn test_nested_objects() -> Result<String, Box<dyn std::error::Error>> {
    println!("\n--- Test 9: Nested Objects with Dot Notation ---");

    let user_data = json!({
        "name": "John Doe",
        "email": "john@example.com",
        "profile": {
            "company": "Acme Corp",
            "title": "Software Engineer",
            "location": "San Francisco, CA"
        }
    });

    let request = GenerateTemplateRequest::new(
        TEMPLATE_ID,
        vec![TemplateVariable::advanced_engine(
            "{user}", "user", user_data,
        )?],
    )
    .with_name("Nested Objects Document")
    .with_description("Nested object with dot notation example");

    let result = TurboTemplate::generate(request).await?;
    println!("✓ Deliverable ID: {:?}", result.deliverable_id);
    Ok(result.deliverable_id.unwrap_or_default())
}

/// Test 10: Array Loops
///
/// Template usage:
/// {#items}
/// - {name}: {quantity} x ${price}
/// {/items}
async fn test_array_loops() -> Result<String, Box<dyn std::error::Error>> {
    println!("\n--- Test 10: Array Loops ---");

    let items = vec![
        json!({"name": "Item A", "quantity": 5, "price": 100, "sku": "SKU-001"}),
        json!({"name": "Item B", "quantity": 3, "price": 200, "sku": "SKU-002"}),
        json!({"name": "Item C", "quantity": 10, "price": 50, "sku": "SKU-003"}),
    ];

    let request = GenerateTemplateRequest::new(
        TEMPLATE_ID,
        vec![TemplateVariable::loop_var("{items}", "items", items)?],
    )
    .with_name("Array Loops Document")
    .with_description("Array loop iteration example");

    let result = TurboTemplate::generate(request).await?;
    println!("✓ Deliverable ID: {:?}", result.deliverable_id);
    Ok(result.deliverable_id.unwrap_or_default())
}

/// Test 11: Conditionals
///
/// Template usage:
/// {#if is_premium}
/// Premium Member Discount: {discount * 100}%
/// {/if}
async fn test_conditionals() -> Result<String, Box<dyn std::error::Error>> {
    println!("\n--- Test 11: Conditionals ---");

    let request = GenerateTemplateRequest::new(
        TEMPLATE_ID,
        vec![
            TemplateVariable::conditional("{is_premium}", "is_premium", true),
            TemplateVariable::conditional("{discount}", "discount", 0.2),
        ],
    )
    .with_name("Conditionals Document")
    .with_description("Boolean conditional example");

    let result = TurboTemplate::generate(request).await?;
    println!("✓ Deliverable ID: {:?}", result.deliverable_id);
    Ok(result.deliverable_id.unwrap_or_default())
}

/// Test 12: Images
///
/// Template usage: Insert {logo} at the top of the document
async fn test_images() -> Result<String, Box<dyn std::error::Error>> {
    println!("\n--- Test 12: Images ---");

    let request = GenerateTemplateRequest::new(
        TEMPLATE_ID,
        vec![
            TemplateVariable::simple("{title}", "title", "Quarterly Report"),
            TemplateVariable::image("{logo}", "logo", "https://example.com/logo.png"),
        ],
    )
    .with_name("Document with Images")
    .with_description("Using image variables");

    let result = TurboTemplate::generate(request).await?;
    println!("✓ Deliverable ID: {:?}", result.deliverable_id);
    Ok(result.deliverable_id.unwrap_or_default())
}

// =============================================
// MAIN TEST RUNNER
// =============================================

#[tokio::main]
async fn main() {
    println!("==============================================");
    println!("TurboDocx Rust SDK - Manual Test Suite");
    println!("==============================================");

    // Check if test PDF exists
    if !std::path::Path::new(TEST_PDF_PATH).exists() {
        eprintln!("\nError: Test PDF not found at {}", TEST_PDF_PATH);
        eprintln!("Please add a test PDF file and try again.");
        std::process::exit(1);
    }

    // Configure TurboSign
    if let Err(e) = TurboSign::configure(
        HttpClientConfig::new(API_KEY)
            .with_org_id(ORG_ID)
            .with_base_url(BASE_URL)
            .with_sender_email("sender@example.com")
            .with_sender_name("Your Company Name"),
    ) {
        eprintln!("Failed to configure TurboSign: {}", e);
        std::process::exit(1);
    }

    // Configure TurboTemplate
    if let Err(e) = TurboTemplate::configure(
        HttpClientConfig::new(API_KEY)
            .with_org_id(ORG_ID)
            .with_base_url(BASE_URL),
    ) {
        eprintln!("Failed to configure TurboTemplate: {}", e);
        std::process::exit(1);
    }

    // Uncomment and run tests as needed:

    // ===== TurboSign Tests =====

    // Test 1: Create Signature Review Link
    // let review_doc_id = test_create_signature_review_link().await.unwrap();

    // Test 2: Send Signature (creates a new document)
    // let sign_doc_id = test_send_signature().await.unwrap();

    // Test 3: Get Status (replace with actual document ID)
    // test_get_status("document-uuid-here").await.unwrap();

    // Test 4: Download (replace with actual document ID)
    // test_download("document-uuid-here").await.unwrap();

    // Test 5: Resend (replace with actual document ID and recipient ID)
    // test_resend("document-uuid-here", vec!["recipient-uuid-here"]).await.unwrap();

    // Test 6: Void (do this last as it cancels the document)
    // test_void("document-uuid-here").await.unwrap();

    // Test 7: Get Audit Trail (replace with actual document ID)
    // test_get_audit_trail("document-uuid-here").await.unwrap();

    // ===== TurboTemplate Tests =====

    // Test 8: Simple Variable Substitution
    // let simple_doc_id = test_simple_variables().await.unwrap();

    // Test 9: Nested Objects with Dot Notation
    // let nested_doc_id = test_nested_objects().await.unwrap();

    // Test 10: Array Loops
    // let loops_doc_id = test_array_loops().await.unwrap();

    // Test 11: Conditionals
    // let conditionals_doc_id = test_conditionals().await.unwrap();

    // Test 12: Images
    // let images_doc_id = test_images().await.unwrap();

    println!("\n==============================================");
    println!("All tests completed successfully!");
    println!("==============================================");
}
