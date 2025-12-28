// Example 3: Review Link - Advanced Field Types
//
// This example demonstrates advanced field types and features:
// - Multiple field types: signature, date, text, checkbox, company, title
// - Readonly fields with default values
// - Required fields
// - Multiline text fields
//
// Use this when: You need complex forms with varied input types

package main

import (
	"context"
	"fmt"
	"os"

	"github.com/turbodocx/turbodocx-go"
)

func main() {
	// Configure TurboDocx client
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

	// Read PDF file
	pdfFile, err := os.ReadFile("../../ExampleAssets/advanced-contract.pdf")
	if err != nil {
		fmt.Printf("Error reading file: %v\n", err)
		return
	}

	fmt.Println("Creating review link with advanced field types...\n")

	ctx := context.Background()
	trueVal := true
	result, err := client.TurboSign.CreateSignatureReviewLink(ctx, &turbodocx.CreateSignatureReviewLinkRequest{
		File:                pdfFile,
		FileName:            "advanced-contract.pdf",
		DocumentName:        "Advanced Contract",
		DocumentDescription: "Contract with advanced signature field features",
		Recipients: []turbodocx.Recipient{
			{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
		},
		Fields: []turbodocx.Field{
			// Signature field
			{
				Type:           "signature",
				RecipientEmail: "john@example.com",
				Template: &turbodocx.FieldTemplate{
					Anchor:    "{signature}",
					Placement: "replace",
					Size:      &turbodocx.FieldSize{Width: 100, Height: 30},
				},
			},
			// Date field
			{
				Type:           "date",
				RecipientEmail: "john@example.com",
				Template: &turbodocx.FieldTemplate{
					Anchor:    "{date}",
					Placement: "replace",
					Size:      &turbodocx.FieldSize{Width: 75, Height: 30},
				},
			},
			// Full name field
			{
				Type:           "full_name",
				RecipientEmail: "john@example.com",
				Template: &turbodocx.FieldTemplate{
					Anchor:    "{printed_name}",
					Placement: "replace",
					Size:      &turbodocx.FieldSize{Width: 100, Height: 20},
				},
			},
			// Readonly field with default value (pre-filled)
			{
				Type:           "company",
				RecipientEmail: "john@example.com",
				DefaultValue:   strPtr("TurboDocx"),
				IsReadonly:     &trueVal,
				Template: &turbodocx.FieldTemplate{
					Anchor:    "{company}",
					Placement: "replace",
					Size:      &turbodocx.FieldSize{Width: 100, Height: 20},
				},
			},
			// Required checkbox with default checked
			{
				Type:           "checkbox",
				RecipientEmail: "john@example.com",
				DefaultValue:   strPtr("true"),
				Required:       &trueVal,
				Template: &turbodocx.FieldTemplate{
					Anchor:    "{terms_checkbox}",
					Placement: "replace",
					Size:      &turbodocx.FieldSize{Width: 20, Height: 20},
				},
			},
			// Title field
			{
				Type:           "title",
				RecipientEmail: "john@example.com",
				Template: &turbodocx.FieldTemplate{
					Anchor:    "{title}",
					Placement: "replace",
					Size:      &turbodocx.FieldSize{Width: 75, Height: 30},
				},
			},
			// Multiline text field
			{
				Type:           "text",
				RecipientEmail: "john@example.com",
				IsMultiline:    &trueVal,
				Template: &turbodocx.FieldTemplate{
					Anchor:    "{notes}",
					Placement: "replace",
					Size:      &turbodocx.FieldSize{Width: 200, Height: 50},
				},
			},
		},
	})

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Println("✅ Review link created!\n")
	fmt.Printf("Document ID: %s\n", result.DocumentID)
	fmt.Printf("Status: %s\n", result.Status)
	fmt.Printf("Preview URL: %s\n", result.PreviewURL)

	if result.Recipients != nil {
		fmt.Println("\nRecipients:")
		for _, recipient := range result.Recipients {
			fmt.Printf("  %s (%s) - %s\n", recipient.Name, recipient.Email, recipient.Status)
		}
	}

	fmt.Println("\nNext steps:")
	fmt.Println("1. Review the document at the preview URL")
	fmt.Println("2. Send to recipients: client.TurboSign.Send(ctx, documentId)")
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func strPtr(s string) *string {
	return &s
}
