// Example 2: Review Link - Template Anchors
//
// This example creates a review link first, then sends manually.
// Uses template anchors like {signature1} and {date1} in your PDF.
//
// Use this when: You want to review the document before sending

package main

import (
	"context"
	"fmt"
	"os"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
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
	pdfFile, err := os.ReadFile("../../ExampleAssets/sample-contract.pdf")
	if err != nil {
		fmt.Printf("Error reading file: %v\n", err)
		return
	}

	fmt.Println("Creating review link with template anchors...\n")

	ctx := context.Background()
	result, err := client.TurboSign.CreateSignatureReviewLink(ctx, &turbodocx.CreateSignatureReviewLinkRequest{
		File:                pdfFile,
		FileName:            "sample-contract.pdf",
		DocumentName:        "Contract Agreement",
		DocumentDescription: "This document requires electronic signatures from both parties.",
		Recipients: []turbodocx.Recipient{
			{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			{Name: "Jane Smith", Email: "jane@example.com", SigningOrder: 2},
		},
		Fields: []turbodocx.Field{
			// First recipient - using template anchors
			{
				Type:           "full_name",
				RecipientEmail: "john@example.com",
				Template: &turbodocx.FieldTemplate{
					Anchor:    "{name1}",
					Placement: "replace",
					Size:      &turbodocx.FieldSize{Width: 100, Height: 30},
				},
			},
			{
				Type:           "signature",
				RecipientEmail: "john@example.com",
				Template: &turbodocx.FieldTemplate{
					Anchor:    "{signature1}",
					Placement: "replace",
					Size:      &turbodocx.FieldSize{Width: 100, Height: 30},
				},
			},
			{
				Type:           "date",
				RecipientEmail: "john@example.com",
				Template: &turbodocx.FieldTemplate{
					Anchor:    "{date1}",
					Placement: "replace",
					Size:      &turbodocx.FieldSize{Width: 75, Height: 30},
				},
			},
			// Second recipient
			{
				Type:           "full_name",
				RecipientEmail: "jane@example.com",
				Template: &turbodocx.FieldTemplate{
					Anchor:    "{name2}",
					Placement: "replace",
					Size:      &turbodocx.FieldSize{Width: 100, Height: 30},
				},
			},
			{
				Type:           "signature",
				RecipientEmail: "jane@example.com",
				Template: &turbodocx.FieldTemplate{
					Anchor:    "{signature2}",
					Placement: "replace",
					Size:      &turbodocx.FieldSize{Width: 100, Height: 30},
				},
			},
			{
				Type:           "date",
				RecipientEmail: "jane@example.com",
				Template: &turbodocx.FieldTemplate{
					Anchor:    "{date2}",
					Placement: "replace",
					Size:      &turbodocx.FieldSize{Width: 75, Height: 30},
				},
			},
		},
	})

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Println("\n✅ Review link created!")
	fmt.Printf("Document ID: %s\n", result.DocumentID)
	fmt.Printf("Status: %s\n", result.Status)
	fmt.Printf("Preview URL: %s\n", result.PreviewURL)

	if result.Recipients != nil {
		fmt.Println("\nRecipients:")
		for _, recipient := range result.Recipients {
			fmt.Printf("  %s (%s) - %s\n", recipient.Name, recipient.Email, recipient.Status)
		}
	}

	fmt.Println("\nYou can now:")
	fmt.Println("1. Review the document at the preview URL")
	fmt.Println("2. Send to recipients using: client.TurboSign.Send(ctx, documentId)")
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
