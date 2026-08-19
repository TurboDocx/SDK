//go:build ignore
// +build ignore

// Example: Conditional (IF/THEN) Fields
//
// A checkbox can control other fields so signers only see what applies to them:
//   - Give a "checkbox" field a stable Metadata.FieldKey.
//   - Give a dependent field a Metadata.Conditional rule that references that key.
//       Operator: "is_checked" | "is_not_checked"  -- when the rule fires.
//       Action:   "show"   (hidden until the rule fires)
//                 "unlock" (visible but read-only until the rule fires).
//
// One checkbox can drive any number of dependent fields -- give them the same
// ControllingFieldKey. Uses CreateSignatureReviewLink (no emails are sent).

package main

import (
	"context"
	"fmt"
	"os"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
)

func main() {
	client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
		APIKey:      getEnv("TURBODOCX_API_KEY", "your-api-key-here"),
		OrgID:       getEnv("TURBODOCX_ORG_ID", "your-org-id-here"),
		SenderEmail: getEnv("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"),
		SenderName:  getEnv("TURBODOCX_SENDER_NAME", "Your Company Name"),
	})
	if err != nil {
		fmt.Printf("Error creating client: %v\n", err)
		return
	}

	pdfFile, err := os.ReadFile("../../ExampleAssets/advanced-contract.pdf")
	if err != nil {
		fmt.Printf("Error reading file: %v\n", err)
		return
	}

	fmt.Println("Creating a review link with conditional fields...")

	ctx := context.Background()
	result, err := client.TurboSign.CreateSignatureReviewLink(ctx, &turbodocx.CreateSignatureReviewLinkRequest{
		File:         pdfFile,
		FileName:     "advanced-contract.pdf",
		DocumentName: "Conditional Fields Demo",
		Recipients: []turbodocx.Recipient{
			{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
		},
		Fields: []turbodocx.Field{
			// Controlling checkboxes -- each carries a stable FieldKey.
			{Type: "checkbox", RecipientEmail: "john@example.com", Page: 1, X: 60, Y: 120, Width: 20, Height: 20, Metadata: &turbodocx.FieldMetadata{FieldKey: "request_changes"}},
			{Type: "checkbox", RecipientEmail: "john@example.com", Page: 1, X: 60, Y: 300, Width: 20, Height: 20, Metadata: &turbodocx.FieldMetadata{FieldKey: "override_amount"}},
			{Type: "checkbox", RecipientEmail: "john@example.com", Page: 1, X: 60, Y: 480, Width: 20, Height: 20, Metadata: &turbodocx.FieldMetadata{FieldKey: "consent"}},

			// show + is_checked -- HIDDEN until "request_changes" is checked.
			{Type: "text", RecipientEmail: "john@example.com", Page: 1, X: 120, Y: 120, Width: 260, Height: 40,
				Metadata: &turbodocx.FieldMetadata{Conditional: &turbodocx.FieldConditional{ControllingFieldKey: "request_changes", Operator: "is_checked", Action: "show"}}},
			// ONE checkbox driving a SECOND dependent (same ControllingFieldKey) -- a signature.
			{Type: "signature", RecipientEmail: "john@example.com", Page: 1, X: 120, Y: 180, Width: 200, Height: 50,
				Metadata: &turbodocx.FieldMetadata{Conditional: &turbodocx.FieldConditional{ControllingFieldKey: "request_changes", Operator: "is_checked", Action: "show"}}},

			// unlock + is_checked -- VISIBLE but locked until "override_amount" is checked.
			{Type: "text", RecipientEmail: "john@example.com", Page: 1, X: 120, Y: 300, Width: 150, Height: 30, DefaultValue: "1000.00",
				Metadata: &turbodocx.FieldMetadata{Conditional: &turbodocx.FieldConditional{ControllingFieldKey: "override_amount", Operator: "is_checked", Action: "unlock"}}},

			// show + is_not_checked -- a "please explain" box shown only while consent is WITHHELD.
			{Type: "text", RecipientEmail: "john@example.com", Page: 1, X: 120, Y: 480, Width: 260, Height: 40,
				Metadata: &turbodocx.FieldMetadata{Conditional: &turbodocx.FieldConditional{ControllingFieldKey: "consent", Operator: "is_not_checked", Action: "show"}}},

			// A normal required signature with no rule -- always visible, always required.
			{Type: "signature", RecipientEmail: "john@example.com", Page: 1, X: 120, Y: 620, Width: 200, Height: 50, Required: true},
		},
	})
	if err != nil {
		// A malformed rule is rejected here with a 400 and code "InvalidConditionalRule".
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Println("✅ Review link created!")
	fmt.Printf("Document ID: %s\n", result.DocumentID)
	fmt.Printf("Preview URL: %s\n", result.PreviewURL)

	// Fail-open: a well-formed rule whose ControllingFieldKey matches NO checkbox is NOT an
	// error -- the dependent field stays visible/editable. Double-check your keys match exactly.
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
