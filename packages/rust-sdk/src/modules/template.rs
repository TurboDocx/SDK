use crate::http::{HttpClient, HttpClientConfig};
use crate::types::{GenerateTemplateRequest, GenerateTemplateResponse};
use crate::utils::Result;
use once_cell::sync::OnceCell;
use std::sync::Mutex;

static CLIENT: OnceCell<Mutex<Option<HttpClient>>> = OnceCell::new();

/// TurboTemplate module for advanced document generation
///
/// Supports Angular-like templating with features like:
/// - Variable substitution: {firstName}
/// - Nested objects with dot notation: {user.firstName}
/// - Loops: {#items}...{/items}
/// - Conditionals: {#isActive}...{/isActive}
/// - Expressions: {price + tax}, {quantity * price}
pub struct TurboTemplate;

impl TurboTemplate {
    /// Configure the TurboTemplate module with custom settings
    ///
    /// # Example
    ///
    /// ```no_run
    /// use turbodocx_sdk::TurboTemplate;
    /// use turbodocx_sdk::http::HttpClientConfig;
    ///
    /// TurboTemplate::configure(
    ///     HttpClientConfig::new("your-api-key")
    ///         .with_org_id("your-org-id")
    /// );
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

        // Clone the client (cheap because reqwest::Client uses Arc internally)
        guard
            .as_ref()
            .map(|c| HttpClient::new(c.config.clone()))
            .transpose()?
            .ok_or_else(|| crate::utils::TurboDocxError::Other("Client not initialized".into()))
    }

    /// Generate a document from a template
    ///
    /// # Arguments
    ///
    /// * `request` - The template generation request containing template ID and variables
    ///
    /// # Example
    ///
    /// ```no_run
    /// use turbodocx_sdk::{TurboTemplate, GenerateTemplateRequest, TemplateVariable};
    ///
    /// #[tokio::main]
    /// async fn main() -> Result<(), Box<dyn std::error::Error>> {
    ///     let request = GenerateTemplateRequest::new(
    ///         "your-template-id",
    ///         vec![
    ///             TemplateVariable::simple("{customer_name}", "customer_name", "John Doe"),
    ///             TemplateVariable::simple("{order_total}", "order_total", 1500),
    ///         ],
    ///     )
    ///     .with_name("Invoice Document")
    ///     .with_description("Customer invoice");
    ///
    ///     let response = TurboTemplate::generate(request).await?;
    ///     println!("Deliverable ID: {:?}", response.deliverable_id);
    ///     Ok(())
    /// }
    /// ```
    pub async fn generate(request: GenerateTemplateRequest) -> Result<GenerateTemplateResponse> {
        let client = Self::get_client()?;
        client.post("/v1/deliverable", request).await
    }

    /// Download a generated deliverable
    ///
    /// # Arguments
    ///
    /// * `deliverable_id` - ID of the deliverable to download
    /// * `format` - Download format: "source" (original DOCX/PPTX) or "pdf"
    ///
    /// # Example
    ///
    /// ```no_run
    /// use turbodocx_sdk::TurboTemplate;
    /// use std::fs;
    ///
    /// #[tokio::main]
    /// async fn main() -> Result<(), Box<dyn std::error::Error>> {
    ///     // Download in original format (DOCX/PPTX)
    ///     let doc_bytes = TurboTemplate::download("deliverable-uuid", "source").await?;
    ///     fs::write("document.docx", doc_bytes)?;
    ///
    ///     // Download as PDF
    ///     let pdf_bytes = TurboTemplate::download("deliverable-uuid", "pdf").await?;
    ///     fs::write("document.pdf", pdf_bytes)?;
    ///
    ///     Ok(())
    /// }
    /// ```
    pub async fn download(deliverable_id: &str, format: &str) -> Result<Vec<u8>> {
        if deliverable_id.is_empty() {
            return Err(crate::utils::TurboDocxError::Validation(
                "deliverable_id is required".into(),
            ));
        }

        let client = Self::get_client()?;

        let path = if format == "pdf" {
            format!("/v1/deliverable/file/pdf/{}", deliverable_id)
        } else {
            format!("/v1/deliverable/file/{}", deliverable_id)
        };

        client.get_raw(&path).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::TemplateVariable;

    #[test]
    fn test_configure() {
        let config = HttpClientConfig::new("test-key");
        let result = TurboTemplate::configure(config);
        assert!(result.is_ok());
    }

    #[test]
    fn test_request_serialization() {
        let request = GenerateTemplateRequest::new(
            "template-123",
            vec![TemplateVariable::simple("{name}", "name", "Test")],
        )
        .with_name("Test Document");

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("template-123"));
        assert!(json.contains("Test Document"));
    }
}
