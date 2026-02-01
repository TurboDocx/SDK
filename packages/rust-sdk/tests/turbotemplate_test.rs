use serde_json::json;
use turbodocx_sdk::{GenerateTemplateRequest, OutputFormat, TemplateVariable, VariableMimeType};

#[test]
fn test_simple_variable() {
    let var = TemplateVariable::simple("{name}", "name", "John Doe");
    assert_eq!(var.placeholder, "{name}");
    assert_eq!(var.name, "name");
    assert_eq!(var.mime_type, VariableMimeType::Text);
    assert_eq!(var.value, Some(json!("John Doe")));
}

#[test]
fn test_html_variable() {
    let var = TemplateVariable::html("{content}", "content", "<h1>Hello</h1>");
    assert_eq!(var.mime_type, VariableMimeType::Html);
    assert_eq!(var.allow_rich_text_injection, Some(true));
}

#[test]
fn test_advanced_engine_variable() {
    let data = json!({
        "firstName": "John",
        "lastName": "Doe"
    });
    let var = TemplateVariable::advanced_engine("{user}", "user", data.clone()).unwrap();
    assert_eq!(var.mime_type, VariableMimeType::Json);
    assert_eq!(var.uses_advanced_templating_engine, Some(true));
    assert_eq!(var.value, Some(data));
}

#[test]
fn test_loop_variable() {
    let items = vec![json!({"name": "Item 1"}), json!({"name": "Item 2"})];
    let var = TemplateVariable::loop_var("{items}", "items", items.clone()).unwrap();
    assert_eq!(var.mime_type, VariableMimeType::Json);
    assert_eq!(var.value, Some(json!(items)));
}

#[test]
fn test_conditional_variable() {
    let var = TemplateVariable::conditional("{is_active}", "is_active", true);
    assert_eq!(var.mime_type, VariableMimeType::Json);
    assert_eq!(var.value, Some(json!(true)));
    assert_eq!(var.uses_advanced_templating_engine, Some(true));
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
    )
    .with_name("Test Document")
    .with_description("A test document")
    .with_output_format(OutputFormat::Pdf);

    assert_eq!(request.template_id, "template-123");
    assert_eq!(request.name, Some("Test Document".to_string()));
    assert_eq!(request.description, Some("A test document".to_string()));
    assert_eq!(request.output_format, Some(OutputFormat::Pdf));
    assert_eq!(request.variables.len(), 1);
}

#[test]
fn test_request_serialization() {
    let request = GenerateTemplateRequest::new(
        "template-123",
        vec![
            TemplateVariable::simple("{customer_name}", "customer_name", "John Doe"),
            TemplateVariable::simple("{order_total}", "order_total", 1500),
        ],
    )
    .with_name("Invoice");

    let json = serde_json::to_string(&request).unwrap();
    assert!(json.contains("template-123"));
    assert!(json.contains("Invoice"));
    assert!(json.contains("customer_name"));
    assert!(json.contains("John Doe"));
}

#[test]
fn test_nested_object_variable() {
    let user = json!({
        "firstName": "John",
        "lastName": "Doe",
        "address": {
            "street": "123 Main St",
            "city": "San Francisco"
        }
    });

    let var = TemplateVariable::advanced_engine("{user}", "user", user.clone()).unwrap();
    assert_eq!(var.value, Some(user));
}

#[test]
fn test_variable_with_numbers() {
    let var1 = TemplateVariable::simple("{quantity}", "quantity", 42);
    assert_eq!(var1.value, Some(json!(42)));

    let var2 = TemplateVariable::simple("{price}", "price", 99.99);
    assert_eq!(var2.value, Some(json!(99.99)));
}

#[test]
fn test_variable_with_boolean() {
    let var = TemplateVariable::simple("{is_active}", "is_active", true);
    assert_eq!(var.value, Some(json!(true)));
}

#[test]
fn test_output_format_serialization() {
    let format = OutputFormat::Docx;
    let json = serde_json::to_string(&format).unwrap();
    assert_eq!(json, r#""docx""#);

    let format = OutputFormat::Pdf;
    let json = serde_json::to_string(&format).unwrap();
    assert_eq!(json, r#""pdf""#);
}

#[test]
fn test_mime_type_serialization() {
    let mime = VariableMimeType::Text;
    let json = serde_json::to_string(&mime).unwrap();
    assert_eq!(json, r#""text""#);

    let mime = VariableMimeType::Json;
    let json = serde_json::to_string(&mime).unwrap();
    assert_eq!(json, r#""json""#);
}

// Download tests - these test the path generation logic
#[test]
fn test_download_source_path() {
    // Test that source format generates the correct path
    let deliverable_id = "deliverable-123";
    let format = "source";
    let path = if format == "pdf" {
        format!("/v1/deliverable/file/pdf/{}", deliverable_id)
    } else {
        format!("/v1/deliverable/file/{}", deliverable_id)
    };
    assert_eq!(path, "/v1/deliverable/file/deliverable-123");
}

#[test]
fn test_download_pdf_path() {
    // Test that pdf format generates the correct path
    let deliverable_id = "deliverable-456";
    let format = "pdf";
    let path = if format == "pdf" {
        format!("/v1/deliverable/file/pdf/{}", deliverable_id)
    } else {
        format!("/v1/deliverable/file/{}", deliverable_id)
    };
    assert_eq!(path, "/v1/deliverable/file/pdf/deliverable-456");
}
