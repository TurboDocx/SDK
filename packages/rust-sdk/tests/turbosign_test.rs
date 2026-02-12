use turbodocx_sdk::{
    CreateSignatureReviewLinkRequest, Field, Placement, Recipient, SendSignatureRequest,
    SignatureFieldType, TemplateAnchor,
};

// ===========================================
// Field Tests
// ===========================================

#[test]
fn test_coordinate_based_signature_field() {
    let field = Field::coordinate_based(
        SignatureFieldType::Signature,
        1,
        100.0,
        500.0,
        200.0,
        50.0,
        "john@example.com",
    );

    assert_eq!(field.field_type, SignatureFieldType::Signature);
    assert_eq!(field.page, Some(1));
    assert_eq!(field.x, Some(100.0));
    assert_eq!(field.y, Some(500.0));
    assert_eq!(field.width, Some(200.0));
    assert_eq!(field.height, Some(50.0));
    assert_eq!(field.recipient_email, "john@example.com");
    assert!(field.template.is_none());
}

#[test]
fn test_anchor_based_signature_field() {
    let field = Field::anchor_based(
        SignatureFieldType::Signature,
        "{SignHere}",
        "john@example.com",
    );

    assert_eq!(field.field_type, SignatureFieldType::Signature);
    assert_eq!(field.recipient_email, "john@example.com");
    assert!(field.template.is_some());

    let template = field.template.unwrap();
    assert_eq!(template.anchor, Some("{SignHere}".to_string()));
    assert_eq!(template.placement, Some(Placement::Replace));
}

#[test]
fn test_field_types() {
    let types = vec![
        SignatureFieldType::Signature,
        SignatureFieldType::Initial,
        SignatureFieldType::Date,
        SignatureFieldType::Text,
        SignatureFieldType::FullName,
        SignatureFieldType::Title,
        SignatureFieldType::Company,
        SignatureFieldType::FirstName,
        SignatureFieldType::LastName,
        SignatureFieldType::Email,
        SignatureFieldType::Checkbox,
    ];

    for field_type in types {
        let field = Field::coordinate_based(
            field_type.clone(),
            1,
            100.0,
            500.0,
            200.0,
            50.0,
            "test@example.com",
        );
        assert_eq!(field.field_type, field_type);
    }
}

#[test]
fn test_checkbox_field_with_default_value() {
    let mut field = Field::coordinate_based(
        SignatureFieldType::Checkbox,
        1,
        100.0,
        600.0,
        20.0,
        20.0,
        "john@example.com",
    );

    field.default_value = Some("true".to_string());

    assert_eq!(field.field_type, SignatureFieldType::Checkbox);
    assert_eq!(field.default_value, Some("true".to_string()));
}

#[test]
fn test_field_with_optional_properties() {
    let mut field = Field::coordinate_based(
        SignatureFieldType::Text,
        1,
        100.0,
        500.0,
        300.0,
        100.0,
        "john@example.com",
    );

    field.is_multiline = Some(true);
    field.is_readonly = Some(false);
    field.required = Some(true);
    field.background_color = Some("#FFFF00".to_string());

    assert_eq!(field.is_multiline, Some(true));
    assert_eq!(field.is_readonly, Some(false));
    assert_eq!(field.required, Some(true));
    assert_eq!(field.background_color, Some("#FFFF00".to_string()));
}

#[test]
fn test_template_anchor_with_search_text() {
    let mut field = Field::anchor_based(
        SignatureFieldType::Signature,
        "{SignHere}",
        "john@example.com",
    );

    // Modify template to use search text instead
    field.template = Some(TemplateAnchor {
        anchor: None,
        search_text: Some("Sign here:".to_string()),
        placement: Some(Placement::After),
        size: Some(turbodocx_sdk::FieldSize {
            width: 200.0,
            height: 50.0,
        }),
        offset: Some(turbodocx_sdk::FieldOffset { x: 10.0, y: 0.0 }),
        case_sensitive: Some(false),
        use_regex: Some(false),
    });

    let template = field.template.unwrap();
    assert_eq!(template.search_text, Some("Sign here:".to_string()));
    assert_eq!(template.placement, Some(Placement::After));
    assert!(template.size.is_some());
    assert!(template.offset.is_some());
}

#[test]
fn test_placement_variants() {
    let placements = vec![
        Placement::Replace,
        Placement::Before,
        Placement::After,
        Placement::Above,
        Placement::Below,
    ];

    for placement in placements {
        let template = TemplateAnchor {
            anchor: Some("{Tag}".to_string()),
            search_text: None,
            placement: Some(placement.clone()),
            size: None,
            offset: None,
            case_sensitive: None,
            use_regex: None,
        };

        assert_eq!(template.placement, Some(placement));
    }
}

// ===========================================
// Recipient Tests
// ===========================================

#[test]
fn test_recipient_creation() {
    let recipient = Recipient::new("John Doe", "john@example.com", 1);

    assert_eq!(recipient.name, "John Doe");
    assert_eq!(recipient.email, "john@example.com");
    assert_eq!(recipient.signing_order, 1);
}

#[test]
fn test_multiple_recipients_with_signing_order() {
    let recipients = vec![
        Recipient::new("John Doe", "john@example.com", 1),
        Recipient::new("Jane Smith", "jane@example.com", 2),
        Recipient::new("Bob Johnson", "bob@example.com", 3),
    ];

    assert_eq!(recipients.len(), 3);
    assert_eq!(recipients[0].signing_order, 1);
    assert_eq!(recipients[1].signing_order, 2);
    assert_eq!(recipients[2].signing_order, 3);
}

// ===========================================
// CreateSignatureReviewLinkRequest Tests
// ===========================================

#[test]
fn test_review_link_request_with_file_link() {
    let request = CreateSignatureReviewLinkRequest {
        file_link: Some("https://example.com/contract.pdf".to_string()),
        file: None,
        file_name: None,
        deliverable_id: None,
        template_id: None,
        recipients: vec![Recipient::new("John Doe", "john@example.com", 1)],
        fields: vec![Field::coordinate_based(
            SignatureFieldType::Signature,
            1,
            100.0,
            500.0,
            200.0,
            50.0,
            "john@example.com",
        )],
        document_name: Some("Service Agreement".to_string()),
        document_description: Some("Annual service contract".to_string()),
        sender_name: None,
        sender_email: None,
        cc_emails: None,
    };

    assert_eq!(
        request.file_link,
        Some("https://example.com/contract.pdf".to_string())
    );
    assert_eq!(request.recipients.len(), 1);
    assert_eq!(request.fields.len(), 1);
    assert_eq!(request.document_name, Some("Service Agreement".to_string()));
}

#[test]
fn test_review_link_request_with_deliverable_id() {
    let request = CreateSignatureReviewLinkRequest {
        file_link: None,
        file: None,
        file_name: None,
        deliverable_id: Some("deliverable-uuid".to_string()),
        template_id: None,
        recipients: vec![Recipient::new("John Doe", "john@example.com", 1)],
        fields: vec![Field::anchor_based(
            SignatureFieldType::Signature,
            "{SignHere}",
            "john@example.com",
        )],
        document_name: Some("Generated Document".to_string()),
        document_description: None,
        sender_name: None,
        sender_email: None,
        cc_emails: None,
    };

    assert_eq!(request.deliverable_id, Some("deliverable-uuid".to_string()));
    assert!(request.file_link.is_none());
    assert!(request.file.is_none());
}

#[test]
fn test_review_link_request_with_template_id() {
    let request = CreateSignatureReviewLinkRequest {
        file_link: None,
        file: None,
        file_name: None,
        deliverable_id: None,
        template_id: Some("template-uuid".to_string()),
        recipients: vec![Recipient::new("John Doe", "john@example.com", 1)],
        fields: vec![Field::coordinate_based(
            SignatureFieldType::Signature,
            1,
            100.0,
            500.0,
            200.0,
            50.0,
            "john@example.com",
        )],
        document_name: None,
        document_description: None,
        sender_name: None,
        sender_email: None,
        cc_emails: None,
    };

    assert_eq!(request.template_id, Some("template-uuid".to_string()));
}

#[test]
fn test_review_link_request_with_sender_info() {
    let request = CreateSignatureReviewLinkRequest {
        file_link: Some("https://example.com/contract.pdf".to_string()),
        file: None,
        file_name: None,
        deliverable_id: None,
        template_id: None,
        recipients: vec![Recipient::new("John Doe", "john@example.com", 1)],
        fields: vec![Field::coordinate_based(
            SignatureFieldType::Signature,
            1,
            100.0,
            500.0,
            200.0,
            50.0,
            "john@example.com",
        )],
        document_name: Some("Contract".to_string()),
        document_description: None,
        sender_name: Some("Support Team".to_string()),
        sender_email: Some("support@company.com".to_string()),
        cc_emails: Some(vec!["manager@company.com".to_string()]),
    };

    assert_eq!(request.sender_name, Some("Support Team".to_string()));
    assert_eq!(
        request.sender_email,
        Some("support@company.com".to_string())
    );
    assert_eq!(
        request.cc_emails,
        Some(vec!["manager@company.com".to_string()])
    );
}

#[test]
fn test_review_link_request_with_multiple_recipients_and_fields() {
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
                1,
                100.0,
                500.0,
                200.0,
                50.0,
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
        document_name: Some("Multi-Party Agreement".to_string()),
        document_description: None,
        sender_name: None,
        sender_email: None,
        cc_emails: None,
    };

    assert_eq!(request.recipients.len(), 2);
    assert_eq!(request.fields.len(), 3);
}

// ===========================================
// SendSignatureRequest Tests
// ===========================================

#[test]
fn test_send_signature_request_with_file_link() {
    let request = SendSignatureRequest {
        file_link: Some("https://example.com/contract.pdf".to_string()),
        file: None,
        file_name: None,
        deliverable_id: None,
        template_id: None,
        recipients: vec![Recipient::new("Alice Johnson", "alice@example.com", 1)],
        fields: vec![Field::anchor_based(
            SignatureFieldType::Signature,
            "{ClientSignature}",
            "alice@example.com",
        )],
        document_name: Some("Engagement Letter".to_string()),
        document_description: None,
        sender_name: Some("Support Team".to_string()),
        sender_email: Some("support@company.com".to_string()),
        cc_emails: Some(vec!["manager@company.com".to_string()]),
    };

    assert_eq!(
        request.file_link,
        Some("https://example.com/contract.pdf".to_string())
    );
    assert_eq!(request.recipients.len(), 1);
    assert_eq!(request.fields.len(), 1);
}

#[test]
fn test_send_signature_request_with_deliverable_id() {
    let request = SendSignatureRequest {
        file_link: None,
        file: None,
        file_name: None,
        deliverable_id: Some("deliverable-uuid".to_string()),
        template_id: None,
        recipients: vec![Recipient::new("Bob Smith", "bob@example.com", 1)],
        fields: vec![
            Field::anchor_based(
                SignatureFieldType::Signature,
                "{SignHere}",
                "bob@example.com",
            ),
            Field::anchor_based(SignatureFieldType::Date, "{Date}", "bob@example.com"),
        ],
        document_name: Some("Contract".to_string()),
        document_description: Some("Employment contract".to_string()),
        sender_name: None,
        sender_email: None,
        cc_emails: None,
    };

    assert_eq!(request.deliverable_id, Some("deliverable-uuid".to_string()));
    assert_eq!(request.fields.len(), 2);
}

// ===========================================
// Serialization Tests
// ===========================================

#[test]
fn test_recipient_serialization() {
    let recipient = Recipient::new("John Doe", "john@example.com", 1);
    let json = serde_json::to_string(&recipient).unwrap();

    assert!(json.contains("John Doe"));
    assert!(json.contains("john@example.com"));
    assert!(json.contains("\"signingOrder\":1"));
}

#[test]
fn test_field_serialization() {
    let field = Field::coordinate_based(
        SignatureFieldType::Signature,
        1,
        100.0,
        500.0,
        200.0,
        50.0,
        "john@example.com",
    );

    let json = serde_json::to_string(&field).unwrap();

    assert!(json.contains("\"type\":\"signature\""));
    assert!(json.contains("\"page\":1"));
    assert!(json.contains("\"recipientEmail\":\"john@example.com\""));
}

#[test]
fn test_signature_field_type_serialization() {
    let types = vec![
        (SignatureFieldType::Signature, "signature"),
        (SignatureFieldType::Initial, "initial"),
        (SignatureFieldType::Date, "date"),
        (SignatureFieldType::Text, "text"),
        (SignatureFieldType::FullName, "full_name"),
        (SignatureFieldType::Title, "title"),
        (SignatureFieldType::Company, "company"),
        (SignatureFieldType::FirstName, "first_name"),
        (SignatureFieldType::LastName, "last_name"),
        (SignatureFieldType::Email, "email"),
        (SignatureFieldType::Checkbox, "checkbox"),
    ];

    for (field_type, expected_json) in types {
        let json = serde_json::to_string(&field_type).unwrap();
        assert_eq!(json, format!("\"{}\"", expected_json));
    }
}

#[test]
fn test_placement_serialization() {
    let placements = vec![
        (Placement::Replace, "replace"),
        (Placement::Before, "before"),
        (Placement::After, "after"),
        (Placement::Above, "above"),
        (Placement::Below, "below"),
    ];

    for (placement, expected_json) in placements {
        let json = serde_json::to_string(&placement).unwrap();
        assert_eq!(json, format!("\"{}\"", expected_json));
    }
}

#[test]
fn test_request_serialization_omits_none_fields() {
    let request = CreateSignatureReviewLinkRequest {
        file_link: Some("https://example.com/test.pdf".to_string()),
        file: None,
        file_name: None,
        deliverable_id: None,
        template_id: None,
        recipients: vec![Recipient::new("Test User", "test@example.com", 1)],
        fields: vec![Field::coordinate_based(
            SignatureFieldType::Signature,
            1,
            100.0,
            500.0,
            200.0,
            50.0,
            "test@example.com",
        )],
        document_name: None,
        document_description: None,
        sender_name: None,
        sender_email: None,
        cc_emails: None,
    };

    let json = serde_json::to_string(&request).unwrap();

    // Should not include null/None fields
    assert!(!json.contains("\"file\":"));
    assert!(!json.contains("\"deliverableId\":"));
    assert!(!json.contains("\"documentName\":"));

    // Should include present fields
    assert!(json.contains("\"fileLink\":"));
    assert!(json.contains("\"recipients\":"));
}
