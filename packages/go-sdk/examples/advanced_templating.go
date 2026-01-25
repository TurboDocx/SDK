package main

import (
	"context"
	"fmt"
	"log"
	"os"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
)

func main() {
	// Configure the client
	client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
		APIKey: os.Getenv("TURBODOCX_API_KEY"),
		OrgID:  os.Getenv("TURBODOCX_ORG_ID"),
	})
	if err != nil {
		log.Fatal("Failed to create client:", err)
	}

	ctx := context.Background()

	// Uncomment the examples you want to run:
	// simpleSubstitution(ctx, client)
	// nestedObjects(ctx, client)
	// loopsAndArrays(ctx, client)
	// conditionals(ctx, client)
	// expressionsAndCalculations(ctx, client)
	// complexInvoice(ctx, client)
	// usingHelpers(ctx, client)

	fmt.Println("Examples ready to run!")
}

// Example 1: Simple Variable Substitution
//
// Template: "Dear {customer_name}, your order total is ${order_total}."
func simpleSubstitution(ctx context.Context, client *turbodocx.Client) {
	name := "Simple Substitution Document"
	description := "Basic variable substitution example"

	result, err := client.TurboTemplate.Generate(ctx, &turbodocx.GenerateTemplateRequest{
		TemplateID:  "your-template-id",
		Name:        &name,
		Description: &description,
		Variables: []turbodocx.TemplateVariable{
			{Placeholder: "{customer_name}", Name: "customer_name", Value: "Foo Bar"},
			{Placeholder: "{order_total}", Name: "order_total", Value: 1500},
			{Placeholder: "{order_date}", Name: "order_date", Value: "2024-01-01"},
		},
	})
	if err != nil {
		log.Fatal("Error:", err)
	}

	fmt.Println("Document generated:", *result.DeliverableID)
}

// Example 2: Nested Objects with Dot Notation
//
// Template: "Name: {user.name}, Email: {user.email}, Company: {user.profile.company}"
func nestedObjects(ctx context.Context, client *turbodocx.Client) {
	mimeTypeJSON := turbodocx.MimeTypeJSON
	name := "Nested Objects Document"
	description := "Nested object with dot notation example"

	result, err := client.TurboTemplate.Generate(ctx, &turbodocx.GenerateTemplateRequest{
		TemplateID:  "your-template-id",
		Name:        &name,
		Description: &description,
		Variables: []turbodocx.TemplateVariable{
			{
				Placeholder: "{user}",
				Name:        "user",
				MimeType:    mimeTypeJSON,
				Value: map[string]interface{}{
					"name":  "Person A",
					"email": "persona@example.com",
					"profile": map[string]interface{}{
						"company":  "Company XYZ",
						"title":    "Role 1",
						"location": "Test City, TS",
					},
				},
			},
		},
	})
	if err != nil {
		log.Fatal("Error:", err)
	}

	fmt.Println("Document with nested data generated:", *result.DeliverableID)
}

// Example 3: Loops/Arrays
//
// Template:
// {#items}
// - {name}: {quantity} x ${price} = ${quantity * price}
// {/items}
func loopsAndArrays(ctx context.Context, client *turbodocx.Client) {
	mimeTypeJSON := turbodocx.MimeTypeJSON
	name := "Array Loops Document"
	description := "Array loop iteration example"

	result, err := client.TurboTemplate.Generate(ctx, &turbodocx.GenerateTemplateRequest{
		TemplateID:  "your-template-id",
		Name:        &name,
		Description: &description,
		Variables: []turbodocx.TemplateVariable{
			{
				Placeholder: "{items}",
				Name:        "items",
				MimeType:    mimeTypeJSON,
				Value: []map[string]interface{}{
					{"name": "Item A", "quantity": 5, "price": 100, "sku": "SKU-001"},
					{"name": "Item B", "quantity": 3, "price": 200, "sku": "SKU-002"},
					{"name": "Item C", "quantity": 10, "price": 50, "sku": "SKU-003"},
				},
			},
		},
	})
	if err != nil {
		log.Fatal("Error:", err)
	}

	fmt.Println("Document with loop generated:", *result.DeliverableID)
}

// Example 4: Conditionals
//
// Template:
// {#if is_premium}
// Premium Member Discount: {discount * 100}%
// {/if}
// {#if !is_premium}
// Become a premium member for exclusive discounts!
// {/if}
func conditionals(ctx context.Context, client *turbodocx.Client) {
	mimeTypeJSON := turbodocx.MimeTypeJSON
	name := "Conditionals Document"
	description := "Boolean conditional example"

	result, err := client.TurboTemplate.Generate(ctx, &turbodocx.GenerateTemplateRequest{
		TemplateID:  "your-template-id",
		Name:        &name,
		Description: &description,
		Variables: []turbodocx.TemplateVariable{
			{Placeholder: "{is_premium}", Name: "is_premium", MimeType: mimeTypeJSON, Value: true},
			{Placeholder: "{discount}", Name: "discount", MimeType: mimeTypeJSON, Value: 0.2},
		},
	})
	if err != nil {
		log.Fatal("Error:", err)
	}

	fmt.Println("Document with conditionals generated:", *result.DeliverableID)
}

// Example 5: Expressions and Calculations
//
// Template: "Subtotal: ${subtotal}, Tax: ${subtotal * tax_rate}, Total: ${subtotal * (1 + tax_rate)}"
func expressionsAndCalculations(ctx context.Context, client *turbodocx.Client) {
	mimeTypeText := turbodocx.MimeTypeText
	usesAdvanced := true
	name := "Expressions Document"
	description := "Arithmetic expressions example"

	result, err := client.TurboTemplate.Generate(ctx, &turbodocx.GenerateTemplateRequest{
		TemplateID:  "your-template-id",
		Name:        &name,
		Description: &description,
		Variables: []turbodocx.TemplateVariable{
			{
				Placeholder:                  "{subtotal}",
				Name:                         "subtotal",
				MimeType:                     mimeTypeText,
				Value:                        "1000",
				UsesAdvancedTemplatingEngine: &usesAdvanced,
			},
			{
				Placeholder:                  "{tax_rate}",
				Name:                         "tax_rate",
				MimeType:                     mimeTypeText,
				Value:                        "0.08",
				UsesAdvancedTemplatingEngine: &usesAdvanced,
			},
		},
	})
	if err != nil {
		log.Fatal("Error:", err)
	}

	fmt.Println("Document with expressions generated:", *result.DeliverableID)
}

// Example 6: Complex Invoice Example
//
// Combines multiple features: nested objects, loops, conditionals, expressions
func complexInvoice(ctx context.Context, client *turbodocx.Client) {
	mimeTypeJSON := turbodocx.MimeTypeJSON
	mimeTypeText := turbodocx.MimeTypeText
	usesAdvanced := true

	name := "Invoice - Company ABC"
	description := "Monthly invoice"

	result, err := client.TurboTemplate.Generate(ctx, &turbodocx.GenerateTemplateRequest{
		TemplateID:  "invoice-template-id",
		Name:        &name,
		Description: &description,
		Variables: []turbodocx.TemplateVariable{
			// Customer info (nested object)
			{
				Placeholder: "{customer}",
				Name:        "customer",
				MimeType:    mimeTypeJSON,
				Value: map[string]interface{}{
					"name":  "Company ABC",
					"email": "billing@example.com",
					"address": map[string]interface{}{
						"street": "123 Test Street",
						"city":   "Test City",
						"state":  "TS",
						"zip":    "00000",
					},
				},
			},
			// Invoice metadata
			{Placeholder: "{invoice_number}", Name: "invoice_number", Value: "INV-0000-001"},
			{Placeholder: "{invoice_date}", Name: "invoice_date", Value: "2024-01-01"},
			{Placeholder: "{due_date}", Name: "due_date", Value: "2024-02-01"},
			// Line items (array for loops)
			{
				Placeholder: "{items}",
				Name:        "items",
				MimeType:    mimeTypeJSON,
				Value: []map[string]interface{}{
					{
						"description": "Service A",
						"quantity":    40,
						"rate":        150,
					},
					{
						"description": "Service B",
						"quantity":    1,
						"rate":        5000,
					},
					{
						"description": "Service C",
						"quantity":    12,
						"rate":        500,
					},
				},
			},
			// Tax and totals
			{
				Placeholder:                  "{tax_rate}",
				Name:                         "tax_rate",
				MimeType:                     mimeTypeText,
				Value:                        "0.08",
				UsesAdvancedTemplatingEngine: &usesAdvanced,
			},
			// Premium customer flag
			{Placeholder: "{is_premium}", Name: "is_premium", MimeType: mimeTypeJSON, Value: true},
			{
				Placeholder:                  "{premium_discount}",
				Name:                         "premium_discount",
				MimeType:                     mimeTypeText,
				Value:                        "0.05",
				UsesAdvancedTemplatingEngine: &usesAdvanced,
			},
			// Payment terms
			{Placeholder: "{payment_terms}", Name: "payment_terms", Value: "Net 30"},
			// Notes
			{Placeholder: "{notes}", Name: "notes", Value: "Thank you for your business!"},
		},
	})
	if err != nil {
		log.Fatal("Error:", err)
	}

	fmt.Println("Complex invoice generated:", *result.DeliverableID)
}

// Example 7: Using Helper Functions
func usingHelpers(ctx context.Context, client *turbodocx.Client) {
	name := "Helper Functions Document"
	description := "Using helper functions example"

	result, err := client.TurboTemplate.Generate(ctx, &turbodocx.GenerateTemplateRequest{
		TemplateID:  "your-template-id",
		Name:        &name,
		Description: &description,
		Variables: []turbodocx.TemplateVariable{
			// Simple variable
			must(turbodocx.NewSimpleVariable("{title}", "title", "Quarterly Report", turbodocx.MimeTypeText)),

			// Advanced engine variable
			must(turbodocx.NewAdvancedEngineVariable("{company}", "company", map[string]interface{}{
				"name":         "Company XYZ",
				"headquarters": "Test Location",
				"employees":    500,
			})),

			// Loop variable
			must(turbodocx.NewLoopVariable("{departments}", "departments", []interface{}{
				map[string]interface{}{"name": "Dept A", "headcount": 200},
				map[string]interface{}{"name": "Dept B", "headcount": 150},
				map[string]interface{}{"name": "Dept C", "headcount": 100},
			})),

			// Conditional
			must(turbodocx.NewConditionalVariable("{show_financials}", "show_financials", true)),

			// Image
			must(turbodocx.NewImageVariable("{company_logo}", "company_logo", "https://example.com/logo.png")),
		},
	})
	if err != nil {
		log.Fatal("Error:", err)
	}

	fmt.Println("Document with helpers generated:", *result.DeliverableID)
}

// must is a helper function to handle errors in variable creation
func must(v turbodocx.TemplateVariable, err error) turbodocx.TemplateVariable {
	if err != nil {
		log.Fatal("Error creating variable:", err)
	}
	return v
}
