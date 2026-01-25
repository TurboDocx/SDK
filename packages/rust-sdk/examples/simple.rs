use serde_json::json;
use turbodocx_sdk::{GenerateTemplateRequest, TemplateVariable, TurboTemplate};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Example 1: Simple Variable Substitution
    println!("=== Example 1: Simple Variable Substitution ===");
    let request = GenerateTemplateRequest::new(
        "your-template-id",
        vec![
            TemplateVariable::simple("{customer_name}", "customer_name", "John Doe"),
            TemplateVariable::simple("{order_total}", "order_total", 1500),
            TemplateVariable::simple("{order_date}", "order_date", "2024-01-01"),
        ],
    )
    .with_name("Simple Substitution Document")
    .with_description("Basic variable substitution example");

    let response = TurboTemplate::generate(request).await?;
    println!("✓ Deliverable ID: {:?}", response.deliverable_id);

    // Example 2: Nested Objects with Dot Notation
    println!("\n=== Example 2: Nested Objects ===");
    let user_data = json!({
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "profile": {
            "company": "Acme Inc",
            "title": "Software Engineer",
            "location": "San Francisco, CA"
        }
    });

    let request = GenerateTemplateRequest::new(
        "your-template-id",
        vec![TemplateVariable::advanced_engine(
            "{user}", "user", user_data,
        )?],
    )
    .with_name("Nested Objects Document")
    .with_description("Nested object with dot notation example");

    let response = TurboTemplate::generate(request).await?;
    println!("✓ Deliverable ID: {:?}", response.deliverable_id);

    // Example 3: Array Loops
    println!("\n=== Example 3: Array Loops ===");
    let items = vec![
        json!({"name": "Item A", "quantity": 5, "price": 100, "sku": "SKU-001"}),
        json!({"name": "Item B", "quantity": 3, "price": 200, "sku": "SKU-002"}),
        json!({"name": "Item C", "quantity": 10, "price": 50, "sku": "SKU-003"}),
    ];

    let request = GenerateTemplateRequest::new(
        "your-template-id",
        vec![TemplateVariable::loop_var("{items}", "items", items)?],
    )
    .with_name("Array Loops Document")
    .with_description("Array loop iteration example");

    let response = TurboTemplate::generate(request).await?;
    println!("✓ Deliverable ID: {:?}", response.deliverable_id);

    // Example 4: Conditionals
    println!("\n=== Example 4: Conditionals ===");
    let request = GenerateTemplateRequest::new(
        "your-template-id",
        vec![
            TemplateVariable::conditional("{is_premium}", "is_premium", true),
            TemplateVariable::conditional("{discount}", "discount", 0.2),
        ],
    )
    .with_name("Conditionals Document")
    .with_description("Boolean conditional example");

    let response = TurboTemplate::generate(request).await?;
    println!("✓ Deliverable ID: {:?}", response.deliverable_id);

    // Example 5: Images
    println!("\n=== Example 5: Images ===");
    let request = GenerateTemplateRequest::new(
        "your-template-id",
        vec![
            TemplateVariable::simple("{title}", "title", "Quarterly Report"),
            TemplateVariable::image("{logo}", "logo", "https://example.com/logo.png"),
        ],
    )
    .with_name("Document with Images")
    .with_description("Using image variables");

    let response = TurboTemplate::generate(request).await?;
    println!("✓ Deliverable ID: {:?}", response.deliverable_id);

    Ok(())
}
