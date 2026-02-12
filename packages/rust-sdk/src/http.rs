use crate::utils::{Result, TurboDocxError};
use reqwest::{header, Client, Method, Response};
use serde::{de::DeserializeOwned, Serialize};
use std::env;

/// Configuration for the HTTP client
#[derive(Debug, Clone)]
pub struct HttpClientConfig {
    /// TurboDocx API key
    pub api_key: Option<String>,

    /// OAuth access token (alternative to API key)
    pub access_token: Option<String>,

    /// Base URL for the API
    pub base_url: String,

    /// Organization ID
    pub org_id: Option<String>,

    /// Sender email (required for TurboSign)
    pub sender_email: Option<String>,

    /// Sender name (for email display)
    pub sender_name: Option<String>,
}

impl Default for HttpClientConfig {
    fn default() -> Self {
        Self {
            api_key: env::var("TURBODOCX_API_KEY").ok(),
            access_token: None,
            base_url: env::var("TURBODOCX_BASE_URL")
                .unwrap_or_else(|_| "https://api.turbodocx.com".to_string()),
            org_id: env::var("TURBODOCX_ORG_ID").ok(),
            sender_email: env::var("TURBODOCX_SENDER_EMAIL").ok(),
            sender_name: env::var("TURBODOCX_SENDER_NAME").ok(),
        }
    }
}

impl HttpClientConfig {
    /// Create a new configuration with the given API key
    pub fn new<S: Into<String>>(api_key: S) -> Self {
        Self {
            api_key: Some(api_key.into()),
            ..Default::default()
        }
    }

    /// Set the access token
    pub fn with_access_token<S: Into<String>>(mut self, token: S) -> Self {
        self.access_token = Some(token.into());
        self
    }

    /// Set the base URL
    pub fn with_base_url<S: Into<String>>(mut self, url: S) -> Self {
        self.base_url = url.into();
        self
    }

    /// Set the organization ID
    pub fn with_org_id<S: Into<String>>(mut self, org_id: S) -> Self {
        self.org_id = Some(org_id.into());
        self
    }

    /// Set sender email
    pub fn with_sender_email<S: Into<String>>(mut self, email: S) -> Self {
        self.sender_email = Some(email.into());
        self
    }

    /// Set sender name
    pub fn with_sender_name<S: Into<String>>(mut self, name: S) -> Self {
        self.sender_name = Some(name.into());
        self
    }
}

/// HTTP client for making API requests
pub struct HttpClient {
    pub(crate) config: HttpClientConfig,
    client: Client,
}

impl HttpClient {
    /// Create a new HTTP client with the given configuration
    pub fn new(config: HttpClientConfig) -> Result<Self> {
        let client = Client::builder()
            .build()
            .map_err(|e| TurboDocxError::Network(e.to_string()))?;

        Ok(Self { config, client })
    }

    /// Make a request to the API
    pub async fn request<T: DeserializeOwned>(
        &self,
        method: Method,
        path: &str,
        body: Option<impl Serialize>,
    ) -> Result<T> {
        let url = format!("{}{}", self.config.base_url, path);

        let mut request = self.client.request(method, &url);

        // Add authorization header
        if let Some(ref api_key) = self.config.api_key {
            request = request.header(header::AUTHORIZATION, format!("Bearer {}", api_key));
        } else if let Some(ref token) = self.config.access_token {
            request = request.header(header::AUTHORIZATION, format!("Bearer {}", token));
        }

        // Add organization ID header
        if let Some(ref org_id) = self.config.org_id {
            request = request.header("x-rapiddocx-org-id", org_id);
        }

        // Add content type
        request = request.header(header::CONTENT_TYPE, "application/json");

        // Add body if provided
        if let Some(body) = body {
            request = request.json(&body);
        }

        let response = request.send().await?;
        self.handle_response(response).await
    }

    /// Handle the API response
    async fn handle_response<T: DeserializeOwned>(&self, response: Response) -> Result<T> {
        let status = response.status();

        if !status.is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());

            return Err(match status.as_u16() {
                401 => TurboDocxError::Authentication(error_text),
                400 => TurboDocxError::Validation(error_text),
                404 => TurboDocxError::NotFound(error_text),
                429 => TurboDocxError::RateLimit(error_text),
                _ => TurboDocxError::Api {
                    status: status.as_u16(),
                    message: error_text,
                },
            });
        }

        // Try to parse as JSON
        let json_value: serde_json::Value = response.json().await?;

        // Check if response is wrapped in { data: ... }
        let data = if let Some(data) = json_value.get("data") {
            data.clone()
        } else {
            json_value
        };

        // Deserialize to target type
        serde_json::from_value(data).map_err(TurboDocxError::Serialization)
    }

    /// Make a GET request
    pub async fn get<T: DeserializeOwned>(&self, path: &str) -> Result<T> {
        self.request(Method::GET, path, None::<()>).await
    }

    /// Make a POST request
    pub async fn post<T: DeserializeOwned>(&self, path: &str, body: impl Serialize) -> Result<T> {
        self.request(Method::POST, path, Some(body)).await
    }

    /// Make a PUT request
    pub async fn put<T: DeserializeOwned>(&self, path: &str, body: impl Serialize) -> Result<T> {
        self.request(Method::PUT, path, Some(body)).await
    }

    /// Make a DELETE request
    pub async fn delete<T: DeserializeOwned>(&self, path: &str) -> Result<T> {
        self.request(Method::DELETE, path, None::<()>).await
    }

    /// Make a GET request and return raw bytes
    /// Used for file downloads where response is not JSON
    pub async fn get_raw(&self, path: &str) -> Result<Vec<u8>> {
        let url = format!("{}{}", self.config.base_url, path);

        let mut request = self.client.request(Method::GET, &url);

        // Add authorization header
        if let Some(ref api_key) = self.config.api_key {
            request = request.header(header::AUTHORIZATION, format!("Bearer {}", api_key));
        } else if let Some(ref token) = self.config.access_token {
            request = request.header(header::AUTHORIZATION, format!("Bearer {}", token));
        }

        // Add organization ID header
        if let Some(ref org_id) = self.config.org_id {
            request = request.header("x-rapiddocx-org-id", org_id);
        }

        let response = request.send().await?;
        let status = response.status();

        if !status.is_success() {
            let error_text = response
                .text()
                .await
                .unwrap_or_else(|_| "Unknown error".to_string());

            return Err(match status.as_u16() {
                401 => TurboDocxError::Authentication(error_text),
                400 => TurboDocxError::Validation(error_text),
                404 => TurboDocxError::NotFound(error_text),
                429 => TurboDocxError::RateLimit(error_text),
                _ => TurboDocxError::Api {
                    status: status.as_u16(),
                    message: error_text,
                },
            });
        }

        response
            .bytes()
            .await
            .map(|b| b.to_vec())
            .map_err(|e| TurboDocxError::Network(e.to_string()))
    }

    /// Upload a file with multipart/form-data
    ///
    /// # Arguments
    /// * `path` - API endpoint path
    /// * `file` - File bytes to upload
    /// * `file_name` - Name of the file
    /// * `form_data` - Additional form fields (will be serialized as JSON strings for complex types)
    pub async fn upload_file<T: DeserializeOwned>(
        &self,
        path: &str,
        file: Vec<u8>,
        file_name: &str,
        form_data: std::collections::HashMap<String, serde_json::Value>,
    ) -> Result<T> {
        use reqwest::multipart::{Form, Part};

        let url = format!("{}{}", self.config.base_url, path);

        // Create multipart form
        let mut form = Form::new();

        // Add file part
        let file_part = Part::bytes(file)
            .file_name(file_name.to_string())
            .mime_str("application/pdf")
            .map_err(|e| TurboDocxError::Other(format!("Failed to set MIME type: {}", e)))?;
        form = form.part("file", file_part);

        // Add other form fields
        for (key, value) in form_data {
            let value_str = match value {
                serde_json::Value::String(s) => s,
                _ => value.to_string(),
            };
            form = form.text(key, value_str);
        }

        // Build request with auth headers
        let mut req = self.client.post(&url).multipart(form);

        // Add authentication - API key is sent as Bearer token (backend expects Authorization header)
        if let Some(api_key) = &self.config.api_key {
            req = req.header(header::AUTHORIZATION, format!("Bearer {}", api_key));
        } else if let Some(token) = &self.config.access_token {
            req = req.header(header::AUTHORIZATION, format!("Bearer {}", token));
        }

        // Add org ID if provided
        if let Some(org_id) = &self.config.org_id {
            req = req.header("x-rapiddocx-org-id", org_id);
        }

        // Send request
        let response = req.send().await?;

        // Handle response
        self.handle_response(response).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_config_default() {
        let config = HttpClientConfig::default();
        assert_eq!(config.base_url, "https://api.turbodocx.com");
    }

    #[test]
    fn test_config_builder() {
        let config = HttpClientConfig::new("test-api-key")
            .with_base_url("https://test.example.com")
            .with_org_id("org-123")
            .with_sender_email("test@example.com");

        assert_eq!(config.api_key, Some("test-api-key".to_string()));
        assert_eq!(config.base_url, "https://test.example.com");
        assert_eq!(config.org_id, Some("org-123".to_string()));
        assert_eq!(config.sender_email, Some("test@example.com".to_string()));
    }
}
