use crate::http::{HttpClient, HttpClientConfig};
use crate::types::{
    AuditTrailResponse, CreateSignatureReviewLinkRequest, CreateSignatureReviewLinkResponse,
    DocumentStatusResponse, ResendEmailResponse, SendSignatureRequest, SendSignatureResponse,
    VoidDocumentResponse,
};
use crate::utils::{Result, TurboDocxError};
use once_cell::sync::OnceCell;
use std::sync::Mutex;

static CLIENT: OnceCell<Mutex<Option<HttpClient>>> = OnceCell::new();

/// TurboSign module for digital signature operations
///
/// ## Features
/// - Create signature review links (prepare without sending emails)
/// - Send signature requests (prepare and send in one call)
/// - Void documents
/// - Resend signature request emails
/// - Get audit trail
/// - Get document status
/// - Download signed documents
///
/// ## Configuration
///
/// **Important:** senderEmail is REQUIRED for TurboSign operations. Without it,
/// emails will default to "API Service User via TurboSign". senderName is
/// strongly recommended to provide a better sender experience.
///
/// ```no_run
/// use turbodocx_sdk::{TurboSign, http::HttpClientConfig};
///
/// TurboSign::configure(
///     HttpClientConfig::new("your-api-key")
///         .with_org_id("your-org-id")
///         .with_sender_email("support@yourcompany.com")  // REQUIRED
///         .with_sender_name("Your Company Name")          // Strongly recommended
/// )?;
/// # Ok::<(), turbodocx_sdk::TurboDocxError>(())
/// ```
pub struct TurboSign;

impl TurboSign {
    /// Configure the TurboSign module with custom settings
    ///
    /// # Arguments
    ///
    /// * `config` - HTTP client configuration with API credentials and sender info
    ///
    /// # Example
    ///
    /// ```no_run
    /// use turbodocx_sdk::{TurboSign, http::HttpClientConfig};
    ///
    /// TurboSign::configure(
    ///     HttpClientConfig::new("your-api-key")
    ///         .with_org_id("your-org-id")
    ///         .with_sender_email("support@company.com")
    ///         .with_sender_name("Company Support")
    /// )?;
    /// # Ok::<(), turbodocx_sdk::TurboDocxError>(())
    /// ```
    pub fn configure(config: HttpClientConfig) -> Result<()> {
        let client = HttpClient::new(config)?;
        let cell = CLIENT.get_or_init(|| Mutex::new(None));
        let mut guard = cell.lock().unwrap();
        *guard = Some(client);
        Ok(())
    }

    /// Get or create the HTTP client
    fn get_client() -> Result<HttpClient> {
        let cell = CLIENT.get_or_init(|| Mutex::new(None));
        let mut guard = cell.lock().unwrap();

        if guard.is_none() {
            // Auto-initialize from environment variables
            let config = HttpClientConfig::default();
            *guard = Some(HttpClient::new(config)?);
        }

        // Clone the client
        guard
            .as_ref()
            .map(|c| HttpClient::new(c.config.clone()))
            .transpose()?
            .ok_or_else(|| crate::utils::TurboDocxError::Other("Client not initialized".into()))
    }

    /// Create signature review link without sending emails
    ///
    /// This uploads a document with signature fields and recipients,
    /// but does NOT send signature request emails. Use this to preview
    /// field placement before sending.
    ///
    /// # Arguments
    ///
    /// * `request` - Document, recipients, and fields configuration
    ///
    /// # Returns
    ///
    /// Document ready for review with preview URL
    ///
    /// # Example
    ///
    /// ```no_run
    /// use turbodocx_sdk::{TurboSign, CreateSignatureReviewLinkRequest, Recipient, Field, SignatureFieldType};
    ///
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let request = CreateSignatureReviewLinkRequest {
    ///     file_link: Some("https://example.com/contract.pdf".to_string()),
    ///     file: None,
    ///     file_name: None,
    ///     deliverable_id: None,
    ///     template_id: None,
    ///     recipients: vec![
    ///         Recipient::new("John Doe", "john@example.com", 1)
    ///     ],
    ///     fields: vec![
    ///         Field::coordinate_based(
    ///             SignatureFieldType::Signature,
    ///             1, 100.0, 500.0, 200.0, 50.0,
    ///             "john@example.com"
    ///         )
    ///     ],
    ///     document_name: Some("Contract".to_string()),
    ///     document_description: None,
    ///     sender_name: None,
    ///     sender_email: None,
    ///     cc_emails: None,
    /// };
    ///
    /// let response = TurboSign::create_signature_review_link(request).await?;
    /// println!("Preview URL: {:?}", response.preview_url);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn create_signature_review_link(
        mut request: CreateSignatureReviewLinkRequest,
    ) -> Result<CreateSignatureReviewLinkResponse> {
        use std::collections::HashMap;

        let client = Self::get_client()?;

        // Validate senderEmail is configured for TurboSign operations
        let sender_email = client.config.sender_email.as_ref();
        if sender_email.is_none() || sender_email.unwrap().is_empty() {
            return Err(TurboDocxError::Validation(
                "senderEmail is required for TurboSign operations. Please configure with sender_email.".to_string()
            ));
        }

        // Check if file bytes are provided
        if let Some(file_bytes) = request.file.take() {
            // Use multipart/form-data for file upload
            let mut form_data = HashMap::new();

            // Serialize recipients and fields as JSON strings
            form_data.insert(
                "recipients".to_string(),
                serde_json::to_value(&request.recipients)?,
            );
            form_data.insert("fields".to_string(), serde_json::to_value(&request.fields)?);

            // Add optional fields
            if let Some(name) = &request.document_name {
                form_data.insert(
                    "documentName".to_string(),
                    serde_json::Value::String(name.clone()),
                );
            }
            if let Some(desc) = &request.document_description {
                form_data.insert(
                    "documentDescription".to_string(),
                    serde_json::Value::String(desc.clone()),
                );
            }

            // Sender email/name (use request values or fall back to config)
            let sender_email_val = request
                .sender_email
                .as_ref()
                .or(client.config.sender_email.as_ref())
                .ok_or_else(|| TurboDocxError::Validation("senderEmail is required".to_string()))?;
            form_data.insert(
                "senderEmail".to_string(),
                serde_json::Value::String(sender_email_val.clone()),
            );

            if let Some(sender_name) = request
                .sender_name
                .as_ref()
                .or(client.config.sender_name.as_ref())
            {
                form_data.insert(
                    "senderName".to_string(),
                    serde_json::Value::String(sender_name.clone()),
                );
            }

            if let Some(cc_emails) = &request.cc_emails {
                form_data.insert("ccEmails".to_string(), serde_json::to_value(cc_emails)?);
            }

            let file_name = request.file_name.as_deref().unwrap_or("document.pdf");
            client
                .upload_file(
                    "/turbosign/single/prepare-for-review",
                    file_bytes,
                    file_name,
                    form_data,
                )
                .await
        } else {
            // Use JSON body for file_link, deliverable_id, or template_id
            client
                .post("/v1/signature/create-review-link", request)
                .await
        }
    }

    /// Send signature request (prepare and send in single call)
    ///
    /// This uploads a document with signature fields and recipients,
    /// and immediately sends signature request emails.
    ///
    /// # Arguments
    ///
    /// * `request` - Document, recipients, and fields configuration
    ///
    /// # Returns
    ///
    /// Document ID and confirmation message
    ///
    /// # Example
    ///
    /// ```no_run
    /// use turbodocx_sdk::{TurboSign, SendSignatureRequest, Recipient, Field, SignatureFieldType};
    ///
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let request = SendSignatureRequest {
    ///     deliverable_id: Some("deliverable-uuid".to_string()),
    ///     file: None,
    ///     file_name: None,
    ///     file_link: None,
    ///     template_id: None,
    ///     recipients: vec![
    ///         Recipient::new("John Doe", "john@example.com", 1)
    ///     ],
    ///     fields: vec![
    ///         Field::anchor_based(
    ///             SignatureFieldType::Signature,
    ///             "{SignHere}",
    ///             "john@example.com"
    ///         )
    ///     ],
    ///     document_name: Some("Contract".to_string()),
    ///     document_description: None,
    ///     sender_name: None,
    ///     sender_email: None,
    ///     cc_emails: None,
    /// };
    ///
    /// let response = TurboSign::send_signature(request).await?;
    /// println!("Document ID: {}", response.document_id);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn send_signature(
        mut request: SendSignatureRequest,
    ) -> Result<SendSignatureResponse> {
        use std::collections::HashMap;

        let client = Self::get_client()?;

        // Validate senderEmail is configured for TurboSign operations
        let sender_email = client.config.sender_email.as_ref();
        if sender_email.is_none() || sender_email.unwrap().is_empty() {
            return Err(TurboDocxError::Validation(
                "senderEmail is required for TurboSign operations. Please configure with sender_email.".to_string()
            ));
        }

        // Check if file bytes are provided
        if let Some(file_bytes) = request.file.take() {
            // Use multipart/form-data for file upload
            let mut form_data = HashMap::new();

            // Serialize recipients and fields as JSON strings
            form_data.insert(
                "recipients".to_string(),
                serde_json::to_value(&request.recipients)?,
            );
            form_data.insert("fields".to_string(), serde_json::to_value(&request.fields)?);

            // Add optional fields
            if let Some(name) = &request.document_name {
                form_data.insert(
                    "documentName".to_string(),
                    serde_json::Value::String(name.clone()),
                );
            }
            if let Some(desc) = &request.document_description {
                form_data.insert(
                    "documentDescription".to_string(),
                    serde_json::Value::String(desc.clone()),
                );
            }

            // Sender email/name (use request values or fall back to config)
            let sender_email_val = request
                .sender_email
                .as_ref()
                .or(client.config.sender_email.as_ref())
                .ok_or_else(|| TurboDocxError::Validation("senderEmail is required".to_string()))?;
            form_data.insert(
                "senderEmail".to_string(),
                serde_json::Value::String(sender_email_val.clone()),
            );

            if let Some(sender_name) = request
                .sender_name
                .as_ref()
                .or(client.config.sender_name.as_ref())
            {
                form_data.insert(
                    "senderName".to_string(),
                    serde_json::Value::String(sender_name.clone()),
                );
            }

            if let Some(cc_emails) = &request.cc_emails {
                form_data.insert("ccEmails".to_string(), serde_json::to_value(cc_emails)?);
            }

            let file_name = request.file_name.as_deref().unwrap_or("document.pdf");
            client
                .upload_file("/turbosign/single/send", file_bytes, file_name, form_data)
                .await
        } else {
            // Use JSON body for file_link, deliverable_id, or template_id
            client.post("/v1/signature/send", request).await
        }
    }

    /// Void a signature request
    ///
    /// Cancels a signature request and notifies recipients.
    ///
    /// # Arguments
    ///
    /// * `document_id` - The document ID to void
    /// * `reason` - Reason for voiding (optional)
    ///
    /// # Example
    ///
    /// ```no_run
    /// use turbodocx_sdk::TurboSign;
    ///
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let response = TurboSign::void_document(
    ///     "doc-uuid",
    ///     Some("Contract terms changed")
    /// ).await?;
    /// println!("{}", response.message);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn void_document(
        document_id: &str,
        reason: Option<&str>,
    ) -> Result<VoidDocumentResponse> {
        let client = Self::get_client()?;
        let mut body = serde_json::json!({
            "documentId": document_id
        });
        if let Some(reason) = reason {
            body["reason"] = serde_json::json!(reason);
        }
        client.post("/v1/signature/void", body).await
    }

    /// Resend signature request emails to specific recipients
    ///
    /// # Arguments
    ///
    /// * `document_id` - The document ID
    /// * `recipient_ids` - List of recipient IDs to resend to
    ///
    /// # Example
    ///
    /// ```no_run
    /// use turbodocx_sdk::TurboSign;
    ///
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let response = TurboSign::resend_emails(
    ///     "doc-uuid",
    ///     vec!["recipient-id-1", "recipient-id-2"]
    /// ).await?;
    /// println!("Sent to {} recipients", response.recipient_count);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn resend_emails(
        document_id: &str,
        recipient_ids: Vec<&str>,
    ) -> Result<ResendEmailResponse> {
        let client = Self::get_client()?;
        let body = serde_json::json!({
            "documentId": document_id,
            "recipientIds": recipient_ids
        });
        client.post("/v1/signature/resend", body).await
    }

    /// Get audit trail for a document
    ///
    /// Returns the complete signing history with cryptographic verification.
    ///
    /// # Arguments
    ///
    /// * `document_id` - The document ID
    ///
    /// # Example
    ///
    /// ```no_run
    /// use turbodocx_sdk::TurboSign;
    ///
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let audit_trail = TurboSign::get_audit_trail("doc-uuid").await?;
    /// println!("Document: {}", audit_trail.document.name);
    /// for entry in audit_trail.audit_trail {
    ///     println!("{}: {}", entry.timestamp, entry.action_type);
    /// }
    /// # Ok(())
    /// # }
    /// ```
    pub async fn get_audit_trail(document_id: &str) -> Result<AuditTrailResponse> {
        let client = Self::get_client()?;
        client
            .get(&format!("/v1/signature/{}/audit-trail", document_id))
            .await
    }

    /// Get document status
    ///
    /// Returns the current status of a signature request.
    ///
    /// # Arguments
    ///
    /// * `document_id` - The document ID
    ///
    /// # Example
    ///
    /// ```no_run
    /// use turbodocx_sdk::TurboSign;
    ///
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let status = TurboSign::get_status("doc-uuid").await?;
    /// println!("Status: {}", status.status);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn get_status(document_id: &str) -> Result<DocumentStatusResponse> {
        let client = Self::get_client()?;
        client
            .get(&format!("/v1/signature/{}/status", document_id))
            .await
    }

    /// Download signed document
    ///
    /// Returns a presigned S3 URL to download the completed document.
    ///
    /// # Arguments
    ///
    /// * `document_id` - The document ID
    ///
    /// # Returns
    ///
    /// Download URL (valid for limited time)
    ///
    /// # Example
    ///
    /// ```no_run
    /// use turbodocx_sdk::TurboSign;
    ///
    /// # async fn example() -> Result<(), Box<dyn std::error::Error>> {
    /// let download_url = TurboSign::download("doc-uuid").await?;
    /// println!("Download from: {}", download_url);
    /// # Ok(())
    /// # }
    /// ```
    pub async fn download(document_id: &str) -> Result<String> {
        let client = Self::get_client()?;
        let response: serde_json::Value = client
            .get(&format!("/v1/signature/{}/download", document_id))
            .await?;

        response
            .get("downloadUrl")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .ok_or_else(|| {
                crate::utils::TurboDocxError::Other("No download URL in response".into())
            })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::http::HttpClientConfig;

    #[test]
    fn test_configure() {
        let config = HttpClientConfig::new("test-key")
            .with_org_id("test-org")
            .with_sender_email("test@example.com");
        let result = TurboSign::configure(config);
        assert!(result.is_ok());
    }
}
