use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Signature field type
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum SignatureFieldType {
    Signature,
    Initial,
    Date,
    Text,
    FullName,
    Title,
    Company,
    FirstName,
    LastName,
    Email,
    Checkbox,
}

/// Placement relative to anchor/searchText
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum Placement {
    Replace,
    Before,
    After,
    Above,
    Below,
}

/// Template anchor configuration for dynamic field positioning
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateAnchor {
    /// Text anchor pattern like {TagName}
    #[serde(skip_serializing_if = "Option::is_none")]
    pub anchor: Option<String>,

    /// Alternative: search for any text in document
    #[serde(skip_serializing_if = "Option::is_none")]
    pub search_text: Option<String>,

    /// Where to place field relative to anchor/searchText
    #[serde(skip_serializing_if = "Option::is_none")]
    pub placement: Option<Placement>,

    /// Size of the field
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size: Option<FieldSize>,

    /// Offset from anchor position
    #[serde(skip_serializing_if = "Option::is_none")]
    pub offset: Option<FieldOffset>,

    /// Case sensitive search (default: false)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub case_sensitive: Option<bool>,

    /// Use regex for anchor/searchText (default: false)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub use_regex: Option<bool>,
}

/// Field size
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldSize {
    pub width: f64,
    pub height: f64,
}

/// Field offset
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldOffset {
    pub x: f64,
    pub y: f64,
}

/// Field configuration for signature placement
/// Supports both coordinate-based and template anchor-based positioning
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Field {
    /// Field type
    #[serde(rename = "type")]
    pub field_type: SignatureFieldType,

    /// Page number (1-indexed) - required for coordinate-based
    #[serde(skip_serializing_if = "Option::is_none")]
    pub page: Option<u32>,

    /// X coordinate position
    #[serde(skip_serializing_if = "Option::is_none")]
    pub x: Option<f64>,

    /// Y coordinate position
    #[serde(skip_serializing_if = "Option::is_none")]
    pub y: Option<f64>,

    /// Field width in pixels
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<f64>,

    /// Field height in pixels
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<f64>,

    /// Recipient email - which recipient fills this field
    pub recipient_email: String,

    /// Default value for the field (for checkbox: "true" or "false")
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_value: Option<String>,

    /// Whether this is a multiline text field
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_multiline: Option<bool>,

    /// Whether this field is read-only (pre-filled, non-editable)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_readonly: Option<bool>,

    /// Whether this field is required
    #[serde(skip_serializing_if = "Option::is_none")]
    pub required: Option<bool>,

    /// Background color (hex, rgb, or named colors)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub background_color: Option<String>,

    /// Template anchor configuration for dynamic positioning
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template: Option<TemplateAnchor>,
}

impl Field {
    /// Create a coordinate-based signature field
    pub fn coordinate_based(
        field_type: SignatureFieldType,
        page: u32,
        x: f64,
        y: f64,
        width: f64,
        height: f64,
        recipient_email: impl Into<String>,
    ) -> Self {
        Self {
            field_type,
            page: Some(page),
            x: Some(x),
            y: Some(y),
            width: Some(width),
            height: Some(height),
            recipient_email: recipient_email.into(),
            default_value: None,
            is_multiline: None,
            is_readonly: None,
            required: None,
            background_color: None,
            template: None,
        }
    }

    /// Create a template anchor-based field
    pub fn anchor_based(
        field_type: SignatureFieldType,
        anchor: impl Into<String>,
        recipient_email: impl Into<String>,
    ) -> Self {
        Self {
            field_type,
            page: None,
            x: None,
            y: None,
            width: None,
            height: None,
            recipient_email: recipient_email.into(),
            default_value: None,
            is_multiline: None,
            is_readonly: None,
            required: None,
            background_color: None,
            template: Some(TemplateAnchor {
                anchor: Some(anchor.into()),
                search_text: None,
                placement: Some(Placement::Replace),
                size: None,
                offset: None,
                case_sensitive: None,
                use_regex: None,
            }),
        }
    }
}

/// Recipient configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Recipient {
    /// Recipient's full name
    pub name: String,

    /// Recipient's email address
    pub email: String,

    /// Signing order (1-indexed)
    pub signing_order: u32,
}

impl Recipient {
    pub fn new(name: impl Into<String>, email: impl Into<String>, signing_order: u32) -> Self {
        Self {
            name: name.into(),
            email: email.into(),
            signing_order,
        }
    }
}

/// Request to create signature review link (prepare without sending emails)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSignatureReviewLinkRequest {
    /// File path to PDF
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,

    /// Original filename (used when file is bytes)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_name: Option<String>,

    /// URL to document file
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_link: Option<String>,

    /// TurboDocx deliverable ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deliverable_id: Option<String>,

    /// TurboDocx template ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template_id: Option<String>,

    /// Recipients who will sign
    pub recipients: Vec<Recipient>,

    /// Signature fields configuration
    pub fields: Vec<Field>,

    /// Document name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub document_name: Option<String>,

    /// Document description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub document_description: Option<String>,

    /// Sender name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sender_name: Option<String>,

    /// Sender email
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sender_email: Option<String>,

    /// CC emails
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cc_emails: Option<Vec<String>>,
}

/// Response from create signature review link
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSignatureReviewLinkResponse {
    /// Whether the request was successful
    pub success: bool,

    /// Document ID
    pub document_id: String,

    /// Document status
    pub status: String,

    /// Preview URL for reviewing the document
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preview_url: Option<String>,

    /// Recipients with their status
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recipients: Option<Vec<RecipientStatus>>,

    /// Response message
    pub message: String,
}

/// Recipient status in response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecipientStatus {
    pub id: String,
    pub name: String,
    pub email: String,
    pub status: String,
}

/// Request to send signature (prepare and send in single call)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendSignatureRequest {
    /// File path to PDF
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file: Option<String>,

    /// Original filename
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_name: Option<String>,

    /// URL to document file
    #[serde(skip_serializing_if = "Option::is_none")]
    pub file_link: Option<String>,

    /// TurboDocx deliverable ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deliverable_id: Option<String>,

    /// TurboDocx template ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template_id: Option<String>,

    /// Recipients who will sign
    pub recipients: Vec<Recipient>,

    /// Signature fields configuration
    pub fields: Vec<Field>,

    /// Document name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub document_name: Option<String>,

    /// Document description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub document_description: Option<String>,

    /// Sender name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sender_name: Option<String>,

    /// Sender email
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sender_email: Option<String>,

    /// CC emails
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cc_emails: Option<Vec<String>>,
}

/// Response from send signature
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendSignatureResponse {
    /// Whether the request was successful
    pub success: bool,

    /// Document ID
    pub document_id: String,

    /// Response message
    pub message: String,
}

/// Response from voiding a document
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VoidDocumentResponse {
    /// Whether the void was successful
    pub success: bool,

    /// Response message
    pub message: String,
}

/// Response from resending emails
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ResendEmailResponse {
    /// Whether the resend was successful
    pub success: bool,

    /// Number of recipients who received email
    pub recipient_count: u32,
}

/// Audit trail user information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditTrailUser {
    /// User name
    pub name: String,

    /// User email
    pub email: String,
}

/// Audit trail entry
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditTrailEntry {
    /// Entry ID
    pub id: String,

    /// Document ID
    pub document_id: String,

    /// Action type
    pub action_type: String,

    /// Timestamp of the event
    pub timestamp: String,

    /// Previous hash
    #[serde(skip_serializing_if = "Option::is_none")]
    pub previous_hash: Option<String>,

    /// Current hash
    #[serde(skip_serializing_if = "Option::is_none")]
    pub current_hash: Option<String>,

    /// Created on timestamp
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_on: Option<String>,

    /// Additional details
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<HashMap<String, serde_json::Value>>,

    /// User who performed the action
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user: Option<AuditTrailUser>,

    /// User ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub user_id: Option<String>,

    /// Recipient info
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recipient: Option<AuditTrailUser>,

    /// Recipient ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recipient_id: Option<String>,
}

/// Audit trail document information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditTrailDocument {
    /// Document ID
    pub id: String,

    /// Document name
    pub name: String,
}

/// Response from get audit trail
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditTrailResponse {
    /// Document info
    pub document: AuditTrailDocument,

    /// List of audit trail entries
    pub audit_trail: Vec<AuditTrailEntry>,
}

/// Response from get document status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DocumentStatusResponse {
    /// Current document status
    pub status: String,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_coordinate_based_field() {
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
        assert_eq!(field.recipient_email, "john@example.com");
    }

    #[test]
    fn test_anchor_based_field() {
        let field = Field::anchor_based(
            SignatureFieldType::Signature,
            "{SignHere}",
            "john@example.com",
        );

        assert_eq!(field.field_type, SignatureFieldType::Signature);
        assert!(field.template.is_some());
        assert_eq!(
            field.template.as_ref().unwrap().anchor,
            Some("{SignHere}".to_string())
        );
    }

    #[test]
    fn test_recipient() {
        let recipient = Recipient::new("John Doe", "john@example.com", 1);
        assert_eq!(recipient.name, "John Doe");
        assert_eq!(recipient.email, "john@example.com");
        assert_eq!(recipient.signing_order, 1);
    }
}
