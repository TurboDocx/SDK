//go:build ignore
// +build ignore

// TurboQuote Basic Example
//
// Demonstrates a full quote lifecycle:
//   - Create a company and contact
//   - Create a quote
//   - Add a product line item
//   - Download the PDF
//   - Clean up
//
// Usage:
//
//	TURBODOCX_API_KEY=TDX-... TURBODOCX_ORG_ID=org_... go run turboquote_basic.go

package main

import (
	"context"
	"fmt"
	"os"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
)

func main() {
	ctx := context.Background()

	client, err := turbodocx.NewQuoteClient(turbodocx.QuoteClientConfig{
		APIKey: getEnv("TURBODOCX_API_KEY", ""),
		OrgID:  getEnv("TURBODOCX_ORG_ID", ""),
	})
	if err != nil {
		fmt.Printf("Error creating client: %v\n", err)
		os.Exit(1)
	}

	// --- 1. Create a company ---
	fmt.Println("Creating company...")
	company, err := client.CreateCompany(ctx, &turbodocx.CreateCompanyRequest{
		Name: "Acme Corporation",
	})
	if err != nil {
		fmt.Printf("Error creating company: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Created company: %s (%s)\n", company.Name, company.ID)
	defer func() {
		fmt.Println("\nCleaning up company...")
		if _, err := client.DeleteCompany(ctx, company.ID); err != nil {
			fmt.Printf("Warning: failed to delete company: %v\n", err)
		}
	}()

	// --- 2. Create a contact ---
	fmt.Println("Creating contact...")
	email := "jane.doe@acme.example.com"
	contact, err := client.CreateContact(ctx, &turbodocx.CreateContactRequest{
		Name:      "Jane Doe",
		CompanyID: company.ID,
		Email:     &email,
	})
	if err != nil {
		fmt.Printf("Error creating contact: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Created contact: %s (%s)\n", contact.Name, contact.ID)
	defer func() {
		fmt.Println("Cleaning up contact...")
		if _, err := client.DeleteContact(ctx, contact.ID); err != nil {
			fmt.Printf("Warning: failed to delete contact: %v\n", err)
		}
	}()

	// --- 3. Create a quote ---
	fmt.Println("Creating quote...")
	currency := "USD"
	quote, err := client.CreateQuote(ctx, &turbodocx.CreateQuoteRequest{
		Name:      "Acme Annual Subscription",
		CompanyID: company.ID,
		ContactID: contact.ID,
		CurrencyCode: &currency,
	})
	if err != nil {
		fmt.Printf("Error creating quote: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Created quote: %s (%s)\n", quote.Name, quote.ID)
	defer func() {
		fmt.Println("Cleaning up quote...")
		if _, err := client.DeleteQuote(ctx, quote.ID); err != nil {
			fmt.Printf("Warning: failed to delete quote: %v\n", err)
		}
	}()

	// --- 4. Add a product line item ---
	fmt.Println("Adding line item...")
	qty := 3
	lineItems, err := client.AddLineItems(ctx, quote.ID, turbodocx.AddLineItemRequest{
		ProductName:      "Professional License",
		UnitPrice:        499.00,
		BillingFrequency: "annual",
		Quantity:         &qty,
	})
	if err != nil {
		fmt.Printf("Error adding line item: %v\n", err)
		os.Exit(1)
	}
	if len(lineItems) > 0 {
		li := lineItems[0]
		fmt.Printf("Added line item: %s (qty %d @ $%.2f)\n",
			ptrStr(li.ProductName), li.Quantity, li.UnitPrice)
	}

	// --- 5. Retrieve the updated quote ---
	updatedQuote, err := client.GetQuote(ctx, quote.ID)
	if err != nil {
		fmt.Printf("Error retrieving quote: %v\n", err)
	} else {
		fmt.Printf("Quote subtotal (annual): $%.2f\n", updatedQuote.SubtotalAnnual)
		fmt.Printf("Quote grand total: $%.2f\n", updatedQuote.GrandTotal)
	}

	// --- 6. Download PDF ---
	fmt.Println("Downloading PDF...")
	pdfBytes, err := client.DownloadQuotePdf(ctx, quote.ID)
	if err != nil {
		fmt.Printf("Note: PDF download error: %v\n", err)
	} else {
		outFile := "quote_" + quote.ID + ".pdf"
		if writeErr := os.WriteFile(outFile, pdfBytes, 0600); writeErr != nil {
			fmt.Printf("Error writing PDF: %v\n", writeErr)
		} else {
			fmt.Printf("PDF saved to %s (%d bytes)\n", outFile, len(pdfBytes))
		}
	}

	fmt.Println("\nDone!")
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func ptrStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
