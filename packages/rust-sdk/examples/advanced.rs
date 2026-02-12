use serde_json::json;
use std::collections::HashMap;
use turbodocx_sdk::{GenerateTemplateRequest, TemplateVariable, TurboTemplate};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Example 1: Complex Invoice with Multiple Features
    println!("=== Example 1: Complex Invoice ===");

    let customer_data = json!({
        "name": "Acme Corporation",
        "contact": "Jane Smith",
        "email": "jane@acme.com",
        "address": {
            "street": "123 Business Ave",
            "city": "San Francisco",
            "state": "CA",
            "zip": "94102"
        }
    });

    let items = vec![
        json!({"description": "Consulting Services", "quantity": 40, "rate": 150}),
        json!({"description": "Software License", "quantity": 1, "rate": 5000}),
        json!({"description": "Support Package", "quantity": 12, "rate": 500}),
    ];

    let request = GenerateTemplateRequest::new(
        "your-template-id",
        vec![
            // Customer information (nested object)
            TemplateVariable::advanced_engine("{customer}", "customer", customer_data)?,
            // Invoice metadata
            TemplateVariable::simple("{invoice_number}", "invoice_number", "INV-2024-001"),
            TemplateVariable::simple("{invoice_date}", "invoice_date", "2024-01-15"),
            TemplateVariable::simple("{due_date}", "due_date", "2024-02-15"),
            // Line items (array for loop)
            TemplateVariable::loop_var("{items}", "items", items)?,
            // Totals
            TemplateVariable::simple("{subtotal}", "subtotal", 17000),
            TemplateVariable::simple("{tax_rate}", "tax_rate", 0.08),
            TemplateVariable::simple("{tax_amount}", "tax_amount", 1360),
            TemplateVariable::simple("{total}", "total", 18360),
            // Terms
            TemplateVariable::simple("{payment_terms}", "payment_terms", "Net 30"),
            TemplateVariable::simple("{notes}", "notes", "Thank you for your business!"),
        ],
        "Invoice - Acme Corporation",
    )
    .with_description("Monthly invoice");

    let response = TurboTemplate::generate(request).await?;
    println!("✓ Deliverable ID: {:?}", response.id);

    // Example 2: Using Expressions for Calculations
    println!("\n=== Example 2: Expressions ===");

    let request = GenerateTemplateRequest::new(
        "your-template-id",
        vec![
            TemplateVariable::simple("{price}", "price", 100),
            TemplateVariable::simple("{quantity}", "quantity", 5),
            TemplateVariable::simple("{tax_rate}", "tax_rate", 0.08),
        ],
        "Expressions Document",
    )
    .with_description("Arithmetic expressions example");

    let response = TurboTemplate::generate(request).await?;
    println!("✓ Deliverable ID: {:?}", response.id);

    // Example 3: Using All Helper Functions
    println!("\n=== Example 3: All Helper Functions ===");

    let company_data = json!({
        "name": "TechCorp",
        "headquarters": "Mountain View, CA",
        "employees": 500
    });

    let departments = vec![
        json!({"name": "Engineering", "headcount": 200}),
        json!({"name": "Sales", "headcount": 150}),
        json!({"name": "Marketing", "headcount": 100}),
    ];

    let request = GenerateTemplateRequest::new(
        "your-template-id",
        vec![
            // Advanced engine variable (nested object)
            TemplateVariable::advanced_engine("{company}", "company", company_data)?,
            // Loop variable (array)
            TemplateVariable::loop_var("{departments}", "departments", departments)?,
            // Conditional
            TemplateVariable::conditional("{show_financials}", "show_financials", true),
            // Image
            TemplateVariable::image(
                "{company_logo}",
                "company_logo",
                "https://example.com/logo.png",
            ),
        ],
        "Helper Functions Document",
    )
    .with_description("Using helper functions example");

    let response = TurboTemplate::generate(request).await?;
    println!("✓ Deliverable ID: {:?}", response.id);

    // Example 4: Custom Options
    println!("\n=== Example 4: Custom Options ===");

    let mut metadata = HashMap::new();
    metadata.insert("customField".to_string(), json!("value"));
    metadata.insert("department".to_string(), json!("Sales"));
    metadata.insert("region".to_string(), json!("North America"));

    let request = GenerateTemplateRequest::new(
        "your-template-id",
        vec![TemplateVariable::simple(
            "{title}",
            "title",
            "Custom Document",
        )],
        "Custom Options Document",
    )
    .with_description("Document with custom options")
    .with_font_replacement(true, Some("Arial"))
    .with_metadata(metadata);

    let response = TurboTemplate::generate(request).await?;
    println!("✓ Deliverable ID: {:?}", response.id);

    // Example 5: HTML Content
    println!("\n=== Example 5: HTML Content ===");

    let html_content = r#"<h1>Welcome</h1><p>This is <strong>formatted</strong> text.</p>"#;

    let request = GenerateTemplateRequest::new(
        "your-template-id",
        vec![TemplateVariable::html("{content}", "content", html_content)],
        "HTML Content Document",
    );

    let response = TurboTemplate::generate(request).await?;
    println!("✓ Deliverable ID: {:?}", response.id);

    Ok(())
}
