// Example 1: Send Signature Directly - Template Anchors
//
// This example sends a document directly to recipients for signature.
// Uses template anchors like {signature1} and {date1} in your PDF.
//
// Use this when: You want to send immediately without review

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

	fmt.Println("Sending document directly to recipients...\n")

	ctx := context.Background()
	result, err := client.TurboSign.SendSignature(ctx, &turbodocx.SendSignatureRequest{
		File:                pdfFile,
		FileName:            "sample-contract.pdf",
		DocumentName:        "Partnership Agreement",
		DocumentDescription: "Q1 2025 Partnership Agreement - Please review and sign",
		Recipients: []turbodocx.Recipient{
			{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			{Name: "Jane Smith", Email: "jane@example.com", SigningOrder: 2},
		},
		Fields: []turbodocx.Field{
			// First recipient's fields - using template anchors
			{
				Type:           "full_name",
				RecipientEmail: "john@example.com",
				Template: &turbodocx.TemplateAnchor{
					Anchor:    "{name1}",
					Placement: "replace",
					Size:      &turbodocx.Size{Width: 100, Height: 30},
				},
			},
			{
				Type:           "signature",
				RecipientEmail: "john@example.com",
				Template: &turbodocx.TemplateAnchor{
					Anchor:    "{signature1}", // Text in your PDF to replace
					Placement: "replace",       // Replace the anchor text
					Size:      &turbodocx.Size{Width: 100, Height: 30},
				},
			},
			{
				Type:           "date",
				RecipientEmail: "john@example.com",
				Template: &turbodocx.TemplateAnchor{
					Anchor:    "{date1}",
					Placement: "replace",
					Size:      &turbodocx.Size{Width: 75, Height: 30},
				},
			},
			// Second recipient's fields
			{
				Type:           "full_name",
				RecipientEmail: "jane@example.com",
				Template: &turbodocx.TemplateAnchor{
					Anchor:    "{name2}",
					Placement: "replace",
					Size:      &turbodocx.Size{Width: 100, Height: 30},
				},
			},
			{
				Type:           "signature",
				RecipientEmail: "jane@example.com",
				Template: &turbodocx.TemplateAnchor{
					Anchor:    "{signature2}",
					Placement: "replace",
					Size:      &turbodocx.Size{Width: 100, Height: 30},
				},
			},
			{
				Type:           "date",
				RecipientEmail: "jane@example.com",
				Template: &turbodocx.TemplateAnchor{
					Anchor:    "{date2}",
					Placement: "replace",
					Size:      &turbodocx.Size{Width: 75, Height: 30},
				},
			},
		},
	})

	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Println("✅ Document sent successfully!\n")
	fmt.Printf("Document ID: %s\n", result.DocumentID)
	fmt.Printf("Message: %s\n", result.Message)

	// To get sign URLs and recipient details, use GetStatus
	status, err := client.TurboSign.GetStatus(ctx, result.DocumentID)
	if err == nil && status.Recipients != nil {
		fmt.Println("\nSign URLs:")
		for _, recipient := range status.Recipients {
			fmt.Printf("  %s: %s\n", recipient.Name, recipient.SignURL)
		}
	} else {
		fmt.Println("\nNote: Could not fetch recipient sign URLs")
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
