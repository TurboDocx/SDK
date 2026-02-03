use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// MIME type for template variables
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum VariableMimeType {
    #[default]
    Text,
    Html,
    Json,
    Image,
    Markdown,
}

/// Represents a template variable with its configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TemplateVariable {
    /// Placeholder in the template (e.g., "{customer_name}")
    pub placeholder: String,

    /// Variable name (e.g., "customer_name")
    pub name: String,

    /// MIME type of the variable
    pub mime_type: VariableMimeType,

    /// Variable value (can be string, number, boolean, object, or array)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub value: Option<serde_json::Value>,

    /// Legacy alternative to value
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<serde_json::Value>,

    /// Whether this variable uses advanced templating engine
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uses_advanced_templating_engine: Option<bool>,

    /// Whether this variable is nested in advanced templating engine
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nested_in_advanced_templating_engine: Option<bool>,

    /// Allow rich text injection (HTML)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub allow_rich_text_injection: Option<bool>,

    /// Variable description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// Default value flag
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_value: Option<bool>,

    /// Sub-variables for nested structures
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subvariables: Option<Vec<TemplateVariable>>,
}

impl TemplateVariable {
    /// Create a simple text variable
    pub fn simple<S: Into<String>, V: Into<serde_json::Value>>(
        placeholder: S,
        name: S,
        value: V,
    ) -> Self {
        Self {
            placeholder: placeholder.into(),
            name: name.into(),
            mime_type: VariableMimeType::Text,
            value: Some(value.into()),
            text: None,
            uses_advanced_templating_engine: None,
            nested_in_advanced_templating_engine: None,
            allow_rich_text_injection: None,
            description: None,
            default_value: None,
            subvariables: None,
        }
    }

    /// Create a simple variable with HTML content
    pub fn html<S: Into<String>>(placeholder: S, name: S, html: S) -> Self {
        Self {
            placeholder: placeholder.into(),
            name: name.into(),
            mime_type: VariableMimeType::Html,
            value: Some(html.into().into()),
            text: None,
            uses_advanced_templating_engine: None,
            nested_in_advanced_templating_engine: None,
            allow_rich_text_injection: Some(true),
            description: None,
            default_value: None,
            subvariables: None,
        }
    }

    /// Create a variable for advanced templating (nested objects with dot notation)
    pub fn advanced_engine<S: Into<String>, V: Serialize>(
        placeholder: S,
        name: S,
        value: V,
    ) -> Result<Self, serde_json::Error> {
        Ok(Self {
            placeholder: placeholder.into(),
            name: name.into(),
            mime_type: VariableMimeType::Json,
            value: Some(serde_json::to_value(value)?),
            text: None,
            uses_advanced_templating_engine: Some(true),
            nested_in_advanced_templating_engine: None,
            allow_rich_text_injection: None,
            description: None,
            default_value: None,
            subvariables: None,
        })
    }

    /// Create a loop variable (array iteration)
    pub fn loop_var<S: Into<String>, V: Serialize>(
        placeholder: S,
        name: S,
        items: V,
    ) -> Result<Self, serde_json::Error> {
        Ok(Self {
            placeholder: placeholder.into(),
            name: name.into(),
            mime_type: VariableMimeType::Json,
            value: Some(serde_json::to_value(items)?),
            text: None,
            uses_advanced_templating_engine: None,
            nested_in_advanced_templating_engine: None,
            allow_rich_text_injection: None,
            description: None,
            default_value: None,
            subvariables: None,
        })
    }

    /// Create a conditional variable
    pub fn conditional<S: Into<String>, V: Into<serde_json::Value>>(
        placeholder: S,
        name: S,
        condition: V,
    ) -> Self {
        Self {
            placeholder: placeholder.into(),
            name: name.into(),
            mime_type: VariableMimeType::Json,
            value: Some(condition.into()),
            text: None,
            uses_advanced_templating_engine: Some(true),
            nested_in_advanced_templating_engine: None,
            allow_rich_text_injection: None,
            description: None,
            default_value: None,
            subvariables: None,
        }
    }

    /// Create an image variable
    pub fn image<S: Into<String>>(placeholder: S, name: S, image_url: S) -> Self {
        Self {
            placeholder: placeholder.into(),
            name: name.into(),
            mime_type: VariableMimeType::Image,
            value: Some(image_url.into().into()),
            text: None,
            uses_advanced_templating_engine: None,
            nested_in_advanced_templating_engine: None,
            allow_rich_text_injection: None,
            description: None,
            default_value: None,
            subvariables: None,
        }
    }
}

/// Output format for generated documents
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default)]
#[serde(rename_all = "lowercase")]
pub enum OutputFormat {
    #[default]
    Docx,
    Pdf,
}

/// Request to generate a template
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateTemplateRequest {
    /// Template ID (UUID) - required
    pub template_id: String,

    /// Template variables - required
    pub variables: Vec<TemplateVariable>,

    /// Document name - required
    pub name: String,

    /// Document description - optional
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// Replace fonts in the document - optional
    #[serde(skip_serializing_if = "Option::is_none")]
    pub replace_fonts: Option<bool>,

    /// Default font to use - optional
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_font: Option<String>,

    // Note: output_format is not supported in TurboTemplate API
    /// Additional metadata - optional
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,
}

impl GenerateTemplateRequest {
    /// Create a new template generation request
    ///
    /// # Arguments
    /// * `template_id` - Template ID (UUID) - required
    /// * `variables` - Template variables - required
    /// * `name` - Document name - required
    pub fn new<S: Into<String>>(template_id: S, variables: Vec<TemplateVariable>, name: S) -> Self {
        Self {
            template_id: template_id.into(),
            variables,
            name: name.into(),
            description: None,
            replace_fonts: None,
            default_font: None,
            metadata: None,
        }
    }

    /// Set document description
    pub fn with_description<S: Into<String>>(mut self, description: S) -> Self {
        self.description = Some(description.into());
        self
    }

    /// Set font replacement options
    pub fn with_font_replacement<S: Into<String>>(
        mut self,
        replace: bool,
        default_font: Option<S>,
    ) -> Self {
        self.replace_fonts = Some(replace);
        self.default_font = default_font.map(|f| f.into());
        self
    }

    /// Set metadata
    pub fn with_metadata(mut self, metadata: HashMap<String, serde_json::Value>) -> Self {
        self.metadata = Some(metadata);
        self
    }
}

/// Response from template generation
///
/// Contains the full deliverable information returned by the API.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GenerateTemplateResponse {
    // Core deliverable fields
    /// Deliverable ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,

    /// Document name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,

    /// Document description
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,

    /// Template ID used for generation
    #[serde(skip_serializing_if = "Option::is_none")]
    pub template_id: Option<String>,

    /// Projectspace ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub projectspace_id: Option<String>,

    /// Folder ID for the deliverable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub deliverable_folder_id: Option<String>,

    /// Additional metadata
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<HashMap<String, serde_json::Value>>,

    /// User who created the deliverable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_by: Option<String>,

    /// Organization ID
    #[serde(skip_serializing_if = "Option::is_none")]
    pub org_id: Option<String>,

    /// Default font used
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_font: Option<String>,

    /// Creation timestamp
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_on: Option<String>,

    /// Last update timestamp
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_on: Option<String>,

    /// Active status flag
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_active: Option<i32>,

    /// Font information
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fonts: Option<serde_json::Value>,

    // Response fields
    /// Download URL (if available)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub download_url: Option<String>,

    /// Response message
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,

    /// Error message (if any)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_simple_variable() {
        let var = TemplateVariable::simple("{name}", "name", "John Doe");
        assert_eq!(var.placeholder, "{name}");
        assert_eq!(var.name, "name");
        assert_eq!(var.mime_type, VariableMimeType::Text);
        assert_eq!(var.value, Some(json!("John Doe")));
    }

    #[test]
    fn test_loop_variable() {
        let items = vec![
            json!({"name": "Item 1", "price": 100}),
            json!({"name": "Item 2", "price": 200}),
        ];
        let var = TemplateVariable::loop_var("{items}", "items", items).unwrap();
        assert_eq!(var.placeholder, "{items}");
        assert_eq!(var.mime_type, VariableMimeType::Json);
    }

    #[test]
    fn test_conditional_variable() {
        let var = TemplateVariable::conditional("{is_active}", "is_active", true);
        assert_eq!(var.placeholder, "{is_active}");
        assert_eq!(var.mime_type, VariableMimeType::Json);
        assert_eq!(var.value, Some(json!(true)));
    }

    #[test]
    fn test_image_variable() {
        let var = TemplateVariable::image("{logo}", "logo", "https://example.com/logo.png");
        assert_eq!(var.mime_type, VariableMimeType::Image);
        assert_eq!(var.value, Some(json!("https://example.com/logo.png")));
    }

    #[test]
    fn test_request_builder() {
        let request = GenerateTemplateRequest::new(
            "template-123",
            vec![TemplateVariable::simple("{name}", "name", "Test")],
            "Test Document",
        )
        .with_description("A test document");

        assert_eq!(request.template_id, "template-123");
        assert_eq!(request.name, "Test Document".to_string());
        assert_eq!(request.description, Some("A test document".to_string()));
    }
}
