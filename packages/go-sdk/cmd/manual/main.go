//go:build manual
// +build manual

/*
TurboDocx Go SDK - Manual Test Suite

Tests for both TurboSign (digital signatures) and TurboTemplate (document generation)

Run: go run -tags manual manual_runner.go

Make sure to configure the values below before running.
*/
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
)

// =============================================
// CONFIGURE THESE VALUES BEFORE RUNNING
// =============================================
const (
	apiKey      = "TDX-your-api-key-here"         // Replace with your actual TurboDocx API key
	baseURL     = "http://localhost:3000"          // Replace with your API URL
	orgID       = "your-organization-uuid-here"    // Replace with your organization UUID
	testPDFPath = "/path/to/your/test-document.pdf" // Replace with path to your test PDF/DOCX
	testEmail   = "test-recipient@example.com"     // Replace with a real email to receive notifications
	fileURL     = "https://example.com/sample-document.pdf" // Replace with publicly accessible PDF URL
	templateID  = "your-template-uuid-here"        // Replace with your template UUID
)

var client *turbodocx.Client

func init() {
	var err error
	client, err = turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
		APIKey:      apiKey,
		BaseURL:     baseURL,
		OrgID:       orgID,
		SenderEmail: "sender@example.com",     // Reply-to email for signature requests
		SenderName:  "Your Company Name",      // Sender name shown in emails
	})
	if err != nil {
		fmt.Printf("Failed to create client: %v\n", err)
		os.Exit(1)
	}
}

// prettyPrint prints a value as formatted JSON
func prettyPrint(v interface{}) {
	b, _ := json.MarshalIndent(v, "", "  ")
	fmt.Println("Result:", string(b))
}

// =============================================
// TEST FUNCTIONS
// =============================================

func testCreateSignatureReviewLink(ctx context.Context) (string, error) {
	fmt.Println("\n--- Test 1: CreateSignatureReviewLink (using fileLink) ---")

	// Using fileLink instead of file upload
	result, err := client.TurboSign.CreateSignatureReviewLink(ctx, &turbodocx.CreateSignatureReviewLinkRequest{
		FileLink: fileURL,
		Recipients: []turbodocx.Recipient{
			{Name: "Signer One", Email: testEmail, SigningOrder: 1},
		},
		Fields: []turbodocx.Field{
			{
				RecipientEmail: testEmail,
				Type:           "signature",
				Page:           1,
				X:              100,
				Y:              550,
				Width:          200,
				Height:         50,
			},
			{
				RecipientEmail: testEmail,
				Type:           "checkbox",
				Page:           1,
				X:              320,
				Y:              550,
				Width:          50,
				Height:         50,
				DefaultValue:   "true",
			},
		},
		DocumentName: "Review Test Document (fileLink)",
	})

	if err != nil {
		return "", err
	}

	prettyPrint(result)
	return result.DocumentID, nil
}

func testSendSignature(ctx context.Context, pdfBytes []byte) (string, error) {
	fmt.Println("\n--- Test 2: SendSignature (using file buffer with template fields) ---")

	result, err := client.TurboSign.SendSignature(ctx, &turbodocx.SendSignatureRequest{
		File: pdfBytes,
		Recipients: []turbodocx.Recipient{
			{Name: "Test User", Email: testEmail, SigningOrder: 1},
		},
		Fields: []turbodocx.Field{
			// Template-based field using anchor text (like Java/Python tests)
			{
				RecipientEmail: testEmail,
				Type:           "text",
				DefaultValue:   "Sample Text",
				IsMultiline:    true,
				Required:       true,
				Template: &turbodocx.TemplateAnchor{
					Anchor:        "{placeholder}",
					Placement:     "replace",
					Size:          &turbodocx.Size{Width: 200, Height: 80},
					Offset:        &turbodocx.Point{X: 0, Y: 0},
					CaseSensitive: true,
					UseRegex:      false,
				},
			},
			// Coordinate-based field (traditional approach)
			{
				RecipientEmail: testEmail,
				Type:           "last_name",
				Page:           1,
				X:              100,
				Y:              650,
				Width:          200,
				Height:         50,
				DefaultValue:   "Doe",
			},
		},
		DocumentName:        "Signing Test Document (Template Fields)",
		DocumentDescription: "Testing template-based field positioning",
		CCEmails:            []string{"cc@example.com"},
	})

	if err != nil {
		return "", err
	}

	prettyPrint(result)
	return result.DocumentID, nil
}

func testGetStatus(ctx context.Context, documentID string) error {
	fmt.Println("\n--- Test 3: GetStatus ---")

	result, err := client.TurboSign.GetStatus(ctx, documentID)
	if err != nil {
		return err
	}

	prettyPrint(result)
	return nil
}

func testDownload(ctx context.Context, documentID string) error {
	fmt.Println("\n--- Test 4: Download ---")

	result, err := client.TurboSign.Download(ctx, documentID)
	if err != nil {
		return err
	}

	fmt.Printf("Result: PDF received, size: %d bytes\n", len(result))

	// Save to file
	outputPath := "./downloaded-document.pdf"
	err = os.WriteFile(outputPath, result, 0644)
	if err != nil {
		return fmt.Errorf("failed to save file: %w", err)
	}
	fmt.Printf("File saved to: %s\n", outputPath)

	return nil
}

func testResend(ctx context.Context, documentID string, recipientIDs []string) error {
	fmt.Println("\n--- Test 5: ResendEmail ---")

	result, err := client.TurboSign.ResendEmail(ctx, documentID, recipientIDs)
	if err != nil {
		return err
	}

	prettyPrint(result)
	return nil
}

func testVoid(ctx context.Context, documentID string) error {
	fmt.Println("\n--- Test 6: VoidDocument ---")

	result, err := client.TurboSign.VoidDocument(ctx, documentID, "Testing void functionality")
	if err != nil {
		return err
	}

	prettyPrint(result)
	return nil
}

func testGetAuditTrail(ctx context.Context, documentID string) error {
	fmt.Println("\n--- Test 7: GetAuditTrail ---")

	result, err := client.TurboSign.GetAuditTrail(ctx, documentID)
	if err != nil {
		return err
	}

	prettyPrint(result)
	return nil
}

// =============================================
// TURBOTEMPLATE TEST FUNCTIONS
// =============================================

// Test 8: Simple Variable Substitution
//
// Template usage: "Dear {customer_name}, your order total is ${order_total}."
func testSimpleVariables(ctx context.Context) error {
	fmt.Println("\n--- Test 8: Simple Variable Substitution ---")

	result, err := client.TurboTemplate.Generate(ctx, &turbodocx.GenerateTemplateRequest{
		TemplateID: templateID,
		Variables: []turbodocx.TemplateVariable{
			{Placeholder: "{customer_name}", Name: "customer_name", Value: "John Doe", MimeType: "text"},
			{Placeholder: "{order_total}", Name: "order_total", Value: 1500, MimeType: "text"},
			{Placeholder: "{order_date}", Name: "order_date", Value: "2024-01-01", MimeType: "text"},
		},
		Name:         stringPtr("Simple Substitution Document"),
		Description:  stringPtr("Basic variable substitution example"),
		OutputFormat: stringPtr("pdf"),
	})
	if err != nil {
		return err
	}

	prettyPrint(result)
	return nil
}

// Test 9: Nested Objects with Dot Notation
//
// Template usage: "Name: {user.name}, Company: {user.profile.company}"
func testNestedObjects(ctx context.Context) error {
	fmt.Println("\n--- Test 9: Nested Objects with Dot Notation ---")

	result, err := client.TurboTemplate.Generate(ctx, &turbodocx.GenerateTemplateRequest{
		TemplateID: templateID,
		Variables: []turbodocx.TemplateVariable{
			{
				Placeholder: "{user}",
				Name:        "user",
				Value: map[string]interface{}{
					"name":  "John Doe",
					"email": "john@example.com",
					"profile": map[string]interface{}{
						"company":  "Acme Corp",
						"title":    "Software Engineer",
						"location": "San Francisco, CA",
					},
				},
				MimeType:                       "json",
				UsesAdvancedTemplatingEngine: boolPtr(true),
			},
		},
		Name:         stringPtr("Nested Objects Document"),
		Description:  stringPtr("Nested object with dot notation example"),
		OutputFormat: stringPtr("pdf"),
	})
	if err != nil {
		return err
	}

	prettyPrint(result)
	return nil
}

// Test 10: Array Loops
//
// Template usage:
// {#items}
// - {name}: {quantity} x ${price}
// {/items}
func testArrayLoops(ctx context.Context) error {
	fmt.Println("\n--- Test 10: Array Loops ---")

	result, err := client.TurboTemplate.Generate(ctx, &turbodocx.GenerateTemplateRequest{
		TemplateID: templateID,
		Variables: []turbodocx.TemplateVariable{
			{
				Placeholder: "{items}",
				Name:        "items",
				Value: []map[string]interface{}{
					{"name": "Item A", "quantity": 5, "price": 100, "sku": "SKU-001"},
					{"name": "Item B", "quantity": 3, "price": 200, "sku": "SKU-002"},
					{"name": "Item C", "quantity": 10, "price": 50, "sku": "SKU-003"},
				},
				MimeType:                       "json",
				UsesAdvancedTemplatingEngine: boolPtr(true),
			},
		},
		Name:         stringPtr("Array Loops Document"),
		Description:  stringPtr("Array loop iteration example"),
		OutputFormat: stringPtr("pdf"),
	})
	if err != nil {
		return err
	}

	prettyPrint(result)
	return nil
}

// Test 11: Conditionals
//
// Template usage:
// {#if is_premium}
// Premium Member Discount: {discount * 100}%
// {/if}
func testConditionals(ctx context.Context) error {
	fmt.Println("\n--- Test 11: Conditionals ---")

	result, err := client.TurboTemplate.Generate(ctx, &turbodocx.GenerateTemplateRequest{
		TemplateID: templateID,
		Variables: []turbodocx.TemplateVariable{
			{Placeholder: "{is_premium}", Name: "is_premium", Value: true, MimeType: "json", UsesAdvancedTemplatingEngine: boolPtr(true)},
			{Placeholder: "{discount}", Name: "discount", Value: 0.2, MimeType: "json", UsesAdvancedTemplatingEngine: boolPtr(true)},
		},
		Name:         stringPtr("Conditionals Document"),
		Description:  stringPtr("Boolean conditional example"),
		OutputFormat: stringPtr("pdf"),
	})
	if err != nil {
		return err
	}

	prettyPrint(result)
	return nil
}

// Test 12: Images
//
// Template usage: Insert {logo} at the top of the document
func testImages(ctx context.Context) error {
	fmt.Println("\n--- Test 12: Images ---")

	result, err := client.TurboTemplate.Generate(ctx, &turbodocx.GenerateTemplateRequest{
		TemplateID: templateID,
		Variables: []turbodocx.TemplateVariable{
			{Placeholder: "{title}", Name: "title", Value: "Quarterly Report", MimeType: "text"},
			{Placeholder: "{logo}", Name: "logo", Value: "https://example.com/logo.png", MimeType: "image"},
		},
		Name:         stringPtr("Document with Images"),
		Description:  stringPtr("Using image variables"),
		OutputFormat: stringPtr("pdf"),
	})
	if err != nil {
		return err
	}

	prettyPrint(result)
	return nil
}

// =============================================
// MAIN TEST RUNNER
// =============================================

func main() {
	fmt.Println("==============================================")
	fmt.Println("TurboDocx Go SDK - Manual Test Suite")
	fmt.Println("==============================================")

	// Check if test PDF exists
	if _, err := os.Stat(testPDFPath); os.IsNotExist(err) {
		fmt.Printf("\nError: Test PDF not found at %s\n", testPDFPath)
		fmt.Println("Please add a test PDF file and update testPDFPath.")
		os.Exit(1)
	}

	pdfBytes, err := os.ReadFile(testPDFPath)
	if err != nil {
		fmt.Printf("Failed to read test PDF: %v\n", err)
		os.Exit(1)
	}

	ctx := context.Background()

	// Uncomment and run tests as needed:
	_ = pdfBytes // Suppress unused variable warning

	// ===== TurboSign Tests =====

	// Test 1: Prepare for Review (uses fileLink, doesn't need pdfBytes)
	// _, err = testCreateSignatureReviewLink(ctx)
	// if err != nil { handleError(err); return }

	// Test 2: Prepare for Signing (creates a new document)
	// _, err = testSendSignature(ctx, pdfBytes)
	// if err != nil { handleError(err); return }

	// Test 3: Get Status (replace with actual document ID)
	// err = testGetStatus(ctx, "document-uuid-here")
	// if err != nil { handleError(err); return }

	// Test 4: Download (replace with actual document ID)
	// err = testDownload(ctx, "document-uuid-here")
	// if err != nil { handleError(err); return }

	// Test 5: Resend (replace with actual document ID and recipient ID)
	// err = testResend(ctx, "document-uuid-here", []string{"recipient-uuid-here"})
	// if err != nil { handleError(err); return }

	// Test 6: Void (do this last as it cancels the document)
	// err = testVoid(ctx, "document-uuid-here")
	// if err != nil { handleError(err); return }

	// Test 7: Get Audit Trail (replace with actual document ID)
	// err = testGetAuditTrail(ctx, "document-uuid-here")
	// if err != nil { handleError(err); return }

	// ===== TurboTemplate Tests =====

	// Test 8: Simple Variable Substitution
	// err = testSimpleVariables(ctx)
	// if err != nil { handleError(err); return }

	// Test 9: Nested Objects with Dot Notation
	// err = testNestedObjects(ctx)
	// if err != nil { handleError(err); return }

	// Test 10: Array Loops
	// err = testArrayLoops(ctx)
	// if err != nil { handleError(err); return }

	// Test 11: Conditionals
	// err = testConditionals(ctx)
	// if err != nil { handleError(err); return }

	// Test 12: Images
	// err = testImages(ctx)
	// if err != nil { handleError(err); return }

	_ = ctx // Suppress unused variable warning

	fmt.Println("\n==============================================")
	fmt.Println("All tests completed successfully!")
	fmt.Println("==============================================")
}

// Helper functions
func stringPtr(s string) *string {
	return &s
}

func boolPtr(b bool) *bool {
	return &b
}

func handleError(err error) {
	fmt.Println("\n==============================================")
	fmt.Println("TEST FAILED")
	fmt.Println("==============================================")
	fmt.Printf("Error: %v\n", err)

	if tdErr, ok := err.(*turbodocx.TurboDocxError); ok {
		fmt.Printf("Status Code: %d\n", tdErr.StatusCode)
		if tdErr.Code != "" {
			fmt.Printf("Error Code: %s\n", tdErr.Code)
		}
	}

	os.Exit(1)
}
