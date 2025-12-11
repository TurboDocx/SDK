//go:build manual
// +build manual

/*
TurboSign Go SDK - Manual Test Suite

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
)

var client *turbodocx.Client

func init() {
	var err error
	client, err = turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
		APIKey:  apiKey,
		BaseURL: baseURL,
		OrgID:   orgID,
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
		SenderName:          "Test Sender",
		SenderEmail:         "sender@example.com",
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
// MAIN TEST RUNNER
// =============================================

func main() {
	fmt.Println("==============================================")
	fmt.Println("TurboSign Go SDK - Manual Test Suite")
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

	_ = ctx // Suppress unused variable warning

	fmt.Println("\n==============================================")
	fmt.Println("All tests completed successfully!")
	fmt.Println("==============================================")
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
