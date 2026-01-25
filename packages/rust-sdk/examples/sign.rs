use turbodocx_sdk::{
    CreateSignatureReviewLinkRequest, Field, Recipient, SendSignatureRequest, SignatureFieldType,
    TurboSign,
};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Example 1: Create Review Link (Coordinate-Based Fields)
    println!("=== Example 1: Create Review Link (Coordinate-Based) ===");

    let request = CreateSignatureReviewLinkRequest {
        file_link: Some("https://example.com/contract.pdf".to_string()),
        file: None,
        file_name: None,
        deliverable_id: None,
        template_id: None,
        recipients: vec![
            Recipient::new("John Doe", "john@example.com", 1),
            Recipient::new("Jane Smith", "jane@example.com", 2),
        ],
        fields: vec![
            Field::coordinate_based(
                SignatureFieldType::Signature,
                1,      // page
                100.0,  // x
                500.0,  // y
                200.0,  // width
                50.0,   // height
                "john@example.com",
            ),
            Field::coordinate_based(
                SignatureFieldType::Date,
                1,
                320.0,
                500.0,
                100.0,
                30.0,
                "john@example.com",
            ),
            Field::coordinate_based(
                SignatureFieldType::Signature,
                2,
                100.0,
                500.0,
                200.0,
                50.0,
                "jane@example.com",
            ),
        ],
        document_name: Some("Service Agreement".to_string()),
        document_description: Some("Annual service contract".to_string()),
        sender_name: None,
        sender_email: None,
        cc_emails: None,
    };

    let response = TurboSign::create_signature_review_link(request).await?;
    println!("✓ Document ID: {}", response.document_id);
    println!("✓ Status: {}", response.status);
    if let Some(preview_url) = response.preview_url {
        println!("✓ Preview URL: {}", preview_url);
    }

    // Example 2: Send Signature (Template Anchor-Based Fields)
    println!("\n=== Example 2: Send Signature (Template Anchor-Based) ===");

    let request = SendSignatureRequest {
        deliverable_id: Some("deliverable-uuid".to_string()),
        file: None,
        file_name: None,
        file_link: None,
        template_id: None,
        recipients: vec![Recipient::new("Alice Johnson", "alice@example.com", 1)],
        fields: vec![
            Field::anchor_based(
                SignatureFieldType::Signature,
                "{ClientSignature}",
                "alice@example.com",
            ),
            Field::anchor_based(
                SignatureFieldType::Date,
                "{SignDate}",
                "alice@example.com",
            ),
            Field::anchor_based(
                SignatureFieldType::FullName,
                "{ClientName}",
                "alice@example.com",
            ),
        ],
        document_name: Some("Engagement Letter".to_string()),
        document_description: None,
        sender_name: Some("Support Team".to_string()),
        sender_email: Some("support@company.com".to_string()),
        cc_emails: Some(vec!["manager@company.com".to_string()]),
    };

    let response = TurboSign::send_signature(request).await?;
    println!("✓ Document ID: {}", response.document_id);
    println!("✓ Message: {}", response.message);

    // Example 3: Document Management
    let document_id = "doc-uuid";

    println!("\n=== Example 3: Get Document Status ===");
    let status = TurboSign::get_status(document_id).await?;
    println!("✓ Status: {}", status.status);

    println!("\n=== Example 4: Get Audit Trail ===");
    let audit_trail = TurboSign::get_audit_trail(document_id).await?;
    println!("✓ Document: {}", audit_trail.document.name);
    println!("✓ Audit entries: {}", audit_trail.audit_trail.len());
    for entry in audit_trail.audit_trail.iter().take(3) {
        println!("  - {}: {}", entry.timestamp, entry.action_type);
    }

    println!("\n=== Example 5: Resend Emails ===");
    let response = TurboSign::resend_emails(document_id, vec!["recipient-id"]).await?;
    println!("✓ Sent to {} recipients", response.recipient_count);

    println!("\n=== Example 6: Void Document ===");
    let response =
        TurboSign::void_document(document_id, Some("Contract terms changed")).await?;
    println!("✓ {}", response.message);

    println!("\n=== Example 7: Download Signed Document ===");
    let download_url = TurboSign::download(document_id).await?;
    println!("✓ Download URL: {}", download_url);

    Ok(())
}
