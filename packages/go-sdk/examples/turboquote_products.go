//go:build ignore
// +build ignore

// TurboQuote Products & Bundles Example
//
// Demonstrates product catalog management:
//   - Create a product category (via CreateType)
//   - Create a product
//   - Create a bundle with the product
//   - Add the bundle to a quote as a line item
//   - Clean up
//
// Usage:
//
//	TURBODOCX_API_KEY=TDX-... TURBODOCX_ORG_ID=org_... go run turboquote_products.go

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

	// --- 1. Create a product category type ---
	fmt.Println("Creating product category type...")
	productCatType, err := client.CreateType(ctx, &turbodocx.CreateQuoteTypeRequest{
		Name:         "Software Licenses",
		CategoryType: turbodocx.CategoryTypeProductCategory,
	})
	if err != nil {
		fmt.Printf("Error creating product category type: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Created category type: %s (%s)\n", productCatType.Name, productCatType.ID)
	defer func() {
		fmt.Println("\nCleaning up product category type...")
		if _, err := client.DeleteType(ctx, productCatType.ID); err != nil {
			fmt.Printf("Warning: failed to delete category type: %v\n", err)
		}
	}()

	// --- 2. Create a product ---
	fmt.Println("Creating product...")
	sku := "SW-PRO-001"
	desc := "Professional edition with advanced features"
	showInCatalog := true
	product, err := client.CreateProduct(ctx, &turbodocx.CreateProductRequest{
		Name:             "Pro License",
		ListPrice:        499.00,
		BillingFrequency: "annual",
		CategoryID:       productCatType.ID,
		Sku:              &sku,
		Description:      &desc,
		ShowInCatalog:    &showInCatalog,
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

	// --- 3. Create a bundle category type ---
	fmt.Println("Creating bundle category type...")
	bundleCatType, err := client.CreateType(ctx, &turbodocx.CreateQuoteTypeRequest{
		Name:         "Starter Packs",
		CategoryType: turbodocx.CategoryTypeBundleCategory,
	})
	if err != nil {
		fmt.Printf("Error creating bundle category type: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Created bundle category type: %s (%s)\n", bundleCatType.Name, bundleCatType.ID)
	defer func() {
		fmt.Println("Cleaning up bundle category type...")
		if _, err := client.DeleteType(ctx, bundleCatType.ID); err != nil {
			fmt.Printf("Warning: failed to delete bundle category type: %v\n", err)
		}
	}()

	// --- 4. Create a bundle with the product ---
	fmt.Println("Creating bundle...")
	qty := 1
	discountType := turbodocx.DiscountTypePercent
	discountPct := 10.0
	bundle, err := client.CreateBundle(ctx, &turbodocx.CreateBundleRequest{
		Name:       "Starter Pack",
		CategoryID: bundleCatType.ID,
		Items: []turbodocx.BundleItemInput{
			{
				ProductID:        product.ID,
				UnitPrice:        product.ListPrice,
				BillingFrequency: "annual",
				Quantity:         &qty,
				DiscountType:     &discountType,
				DiscountPercent:  &discountPct,
			},
		},
		BundleDiscountType:    &discountType,
		BundleDiscountPercent: &discountPct,
	})
	if err != nil {
		fmt.Printf("Error creating bundle: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Created bundle: %s (final $%.2f, %d items) (%s)\n",
		bundle.Name, bundle.TotalFinalPrice, len(bundle.Items), bundle.ID)
	defer func() {
		fmt.Println("Cleaning up bundle...")
		if _, err := client.DeleteBundle(ctx, bundle.ID); err != nil {
			fmt.Printf("Warning: failed to delete bundle: %v\n", err)
		}
	}()

	// --- 5. Create a company and contact for the quote ---
	company, err := client.CreateCompany(ctx, &turbodocx.CreateCompanyRequest{Name: "Bundle Demo Corp"})
	if err != nil {
		fmt.Printf("Error creating company: %v\n", err)
		os.Exit(1)
	}
	defer func() {
		client.DeleteCompany(ctx, company.ID) //nolint:errcheck
	}()

	contactEmail := "demo@bundledemo.example.com"
	contact, err := client.CreateContact(ctx, &turbodocx.CreateContactRequest{
		Name:      "Demo Contact",
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

	// --- 6. Create a quote and add the bundle ---
	fmt.Println("Creating quote...")
	currency := "USD"
	quote, err := client.CreateQuote(ctx, &turbodocx.CreateQuoteRequest{
		Name:         "Bundle Demo Quote",
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

	bundleQty := 2
	bundleLineItems, err := client.AddBundleLineItems(ctx, quote.ID, turbodocx.AddBundleLineItemRequest{
		BundleID:   bundle.ID,
		BundleName: bundle.Name,
		Quantity:   &bundleQty,
	})
	if err != nil {
		fmt.Printf("Error adding bundle line item: %v\n", err)
		os.Exit(1)
	}
	if len(bundleLineItems) > 0 {
		fmt.Printf("Added bundle line item: %s (qty %d)\n",
			ptrStr(bundleLineItems[0].BundleName), bundleLineItems[0].Quantity)
	}

	// --- 7. List line items on the quote ---
	fmt.Println("\nLine items on the quote:")
	lineItems, err := client.ListLineItems(ctx, quote.ID, nil)
	if err != nil {
		fmt.Printf("Error listing line items: %v\n", err)
	} else {
		for _, li := range lineItems.Results {
			name := ptrStr(li.ProductName)
			if name == "" {
				name = ptrStr(li.BundleName)
			}
			fmt.Printf("  - %s (type: %s, qty: %d)\n", name, li.LineItemTypeField, li.Quantity)
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
