//go:build ignore
// +build ignore

// TurboQuote Price Books Example
//
// Demonstrates price book management:
//   - Create a price book type and product category (via CreateType)
//   - Create a product
//   - Create a price book with product-level pricing
//   - Update the price book (PATCH)
//   - Create a quote, add a line item, and apply the price book
//   - Optionally send quote with deliverable (set DELIVERABLE_ID env var)
//   - Clean up
//
// Usage:
//
//	TURBODOCX_API_KEY=TDX-... TURBODOCX_ORG_ID=org_... go run turboquote_pricebooks.go
//	DELIVERABLE_ID=del_... go run turboquote_pricebooks.go   # also test SendQuoteWithDeliverable

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

	// --- 1. Create a price book type ---
	fmt.Println("Creating price book type...")
	pbType, err := client.CreateType(ctx, &turbodocx.CreateQuoteTypeRequest{
		Name:         "Enterprise Tiers",
		CategoryType: turbodocx.CategoryTypePricebookType,
	})
	if err != nil {
		fmt.Printf("Error creating price book type: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Created price book type: %s (%s)\n", pbType.Name, pbType.ID)
	defer func() {
		fmt.Println("\nCleaning up price book type...")
		if _, err := client.DeleteType(ctx, pbType.ID); err != nil {
			fmt.Printf("Warning: failed to delete price book type: %v\n", err)
		}
	}()

	// --- 2. Create a product category and product ---
	fmt.Println("Creating product category...")
	productCat, err := client.CreateType(ctx, &turbodocx.CreateQuoteTypeRequest{
		Name:         "Cloud Services",
		CategoryType: turbodocx.CategoryTypeProductCategory,
	})
	if err != nil {
		fmt.Printf("Error creating product category: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Created product category: %s (%s)\n", productCat.Name, productCat.ID)
	defer func() {
		fmt.Println("Cleaning up product category...")
		if _, err := client.DeleteType(ctx, productCat.ID); err != nil {
			fmt.Printf("Warning: failed to delete product category: %v\n", err)
		}
	}()

	fmt.Println("Creating product...")
	product, err := client.CreateProduct(ctx, &turbodocx.CreateProductRequest{
		Name:             "Cloud Storage 1TB",
		ListPrice:        120.00,
		BillingFrequency: "annual",
		CategoryID:       productCat.ID,
	})
	if err != nil {
		fmt.Printf("Error creating product: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Created product: %s @ $%.2f/year (%s)\n", product.Name, product.ListPrice, product.ID)
	defer func() {
		fmt.Println("Cleaning up product...")
		if _, err := client.DeleteProduct(ctx, product.ID); err != nil {
			fmt.Printf("Warning: failed to delete product: %v\n", err)
		}
	}()

	// --- 3. Create a price book with product-level pricing ---
	fmt.Println("Creating price book...")
	discountType := turbodocx.DiscountTypePercent
	discountPct := 15.0
	pricebook, err := client.CreatePriceBook(ctx, &turbodocx.CreatePriceBookRequest{
		Name:            "Enterprise 15% Off",
		PriceBookTypeID: pbType.ID,
		ValidFrom:       "2025-01-01",
		DiscountPercent: &discountPct,
		ProductPricing: []turbodocx.PriceBookProductPricingInput{
			{
				ProductID:       product.ID,
				DiscountType:    &discountType,
				DiscountPercent: &discountPct,
			},
		},
	})
	if err != nil {
		fmt.Printf("Error creating price book: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Created price book: %s (%s)\n", pricebook.Name, pricebook.ID)
	defer func() {
		fmt.Println("Cleaning up price book...")
		if _, err := client.DeletePriceBook(ctx, pricebook.ID); err != nil {
			fmt.Printf("Warning: failed to delete price book: %v\n", err)
		}
	}()

	// --- 4. Update the price book (demonstrate PATCH with nullable field) ---
	fmt.Println("Updating price book description...")
	desc := "Preferred pricing for enterprise accounts"
	updatedPB, err := client.UpdatePriceBook(ctx, pricebook.ID, &turbodocx.UpdatePriceBookRequest{
		Description: &desc,
	})
	if err != nil {
		fmt.Printf("Warning: update price book error: %v\n", err)
	} else {
		fmt.Printf("Updated price book description: %v\n", ptrStr(updatedPB.Description))
	}

	// --- 5. Create a company, contact, and quote ---
	company, err := client.CreateCompany(ctx, &turbodocx.CreateCompanyRequest{Name: "Enterprise Corp"})
	if err != nil {
		fmt.Printf("Error creating company: %v\n", err)
		os.Exit(1)
	}
	defer func() {
		client.DeleteCompany(ctx, company.ID) //nolint:errcheck
	}()

	contactEmail := "enterprise@corp.example.com"
	contact, err := client.CreateContact(ctx, &turbodocx.CreateContactRequest{
		Name:      "Enterprise Contact",
		CompanyID: company.ID,
		Email:     &contactEmail,
	})
	if err != nil {
		fmt.Printf("Error creating contact: %v\n", err)
		os.Exit(1)
	}
	defer func() {
		client.DeleteContact(ctx, contact.ID) //nolint:errcheck
	}()

	fmt.Println("Creating quote...")
	currency := "USD"
	quote, err := client.CreateQuote(ctx, &turbodocx.CreateQuoteRequest{
		Name:         "Enterprise Quote",
		CompanyID:    company.ID,
		ContactID:    contact.ID,
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

	// Add the product as a line item
	lineItems, err := client.AddLineItems(ctx, quote.ID, turbodocx.AddLineItemRequest{
		ProductID:        &product.ID,
		ProductName:      product.Name,
		UnitPrice:        product.ListPrice,
		BillingFrequency: "annual",
	})
	if err != nil {
		fmt.Printf("Error adding line item: %v\n", err)
		os.Exit(1)
	}
	if len(lineItems) > 0 {
		fmt.Printf("Added line item: %s (subtotal $%.2f)\n",
			ptrStr(lineItems[0].ProductName), lineItems[0].Subtotal)
	}

	// --- 6. Apply price book ---
	fmt.Println("Applying price book to quote...")
	applyResp, err := client.ApplyPriceBook(ctx, quote.ID, pricebook.ID)
	if err != nil {
		fmt.Printf("Warning: apply price book error: %v\n", err)
	} else {
		fmt.Printf("Price book applied! Updated: %d, Skipped: %d\n",
			applyResp.UpdatedCount, applyResp.SkippedCount)
		fmt.Printf("Quote grand total after discount: $%.2f\n", applyResp.QuoteResult.GrandTotal)
	}

	// --- 7. Optional: Send with deliverable ---
	if deliverableID := os.Getenv("DELIVERABLE_ID"); deliverableID != "" {
		fmt.Printf("\nSending quote with deliverable %s...\n", deliverableID)
		sendResp, err := client.SendQuoteWithDeliverable(ctx, quote.ID, &turbodocx.SendQuoteWithDeliverableRequest{
			DeliverableID: deliverableID,
			MergePosition: "append",
		})
		if err != nil {
			fmt.Printf("Error sending: %v\n", err)
		} else {
			fmt.Printf("Sent! Status: %s, Document ID: %s\n",
				sendResp.QuoteResult.Status, sendResp.DocumentID)
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
