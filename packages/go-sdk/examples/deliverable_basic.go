//go:build ignore
// +build ignore

package main

import (
	"context"
	"fmt"
	"log"
	"os"

	turbodocx "github.com/turbodocx/turbodocx-go"
)

func main() {
	ctx := context.Background()

	// 1. Configure - no SenderEmail needed for Deliverable
	client, err := turbodocx.NewDeliverableClientOnly(turbodocx.ClientConfig{
		APIKey: os.Getenv("TURBODOCX_API_KEY"),
		OrgID:  os.Getenv("TURBODOCX_ORG_ID"),
	})
	if err != nil {
		log.Fatalf("Failed to create client: %v", err)
	}

	// 2. Generate a deliverable from a template
	fmt.Println("Generating deliverable...")
	created, err := client.GenerateDeliverable(ctx, &turbodocx.CreateDeliverableRequest{
		TemplateID:  "YOUR_TEMPLATE_ID",
		Name:        "Employee Contract - John Smith",
		Description: "Employment contract for senior developer",
		Variables: []turbodocx.DeliverableVariable{
			{Placeholder: "{EmployeeName}", Text: "John Smith", MimeType: "text"},
			{Placeholder: "{CompanyName}", Text: "TechCorp Solutions Inc.", MimeType: "text"},
			{Placeholder: "{JobTitle}", Text: "Senior Software Engineer", MimeType: "text"},
		},
		Tags:         []string{"hr", "contract", "employee"},
	})
	if err != nil {
		log.Fatalf("Failed to generate: %v", err)
	}
	deliverableID := created.Results.Deliverable.ID
	fmt.Printf("Created deliverable: %s\n", deliverableID)

	// 3. List deliverables
	fmt.Println("\nListing deliverables...")
	list, err := client.ListDeliverables(ctx, &turbodocx.ListDeliverablesOptions{
		Limit:    5,
		ShowTags: true,
	})
	if err != nil {
		log.Fatalf("Failed to list: %v", err)
	}
	fmt.Printf("Found %d deliverables\n", list.TotalRecords)
	for _, d := range list.Results {
		fmt.Printf("  - %s (%s)\n", d.Name, d.ID)
	}

	// 4. Get full details
	fmt.Println("\nGetting deliverable details...")
	details, err := client.GetDeliverableDetails(ctx, deliverableID, &turbodocx.GetDeliverableOptions{ShowTags: true})
	if err != nil {
		log.Fatalf("Failed to get details: %v", err)
	}
	fmt.Printf("Name: %s\n", details.Name)
	fmt.Printf("Template: %s\n", details.TemplateName)
	fmt.Printf("Variables: %d\n", len(details.Variables))

	// 5. Download files
	fmt.Println("\nDownloading source file...")
	sourceFile, err := client.DownloadSourceFile(ctx, deliverableID)
	if err != nil {
		log.Fatalf("Failed to download source: %v", err)
	}
	os.WriteFile("contract.docx", sourceFile, 0644)
	fmt.Println("Saved contract.docx")

	fmt.Println("Downloading PDF...")
	pdfFile, err := client.DownloadPDF(ctx, deliverableID)
	if err != nil {
		log.Fatalf("Failed to download PDF: %v", err)
	}
	os.WriteFile("contract.pdf", pdfFile, 0644)
	fmt.Println("Saved contract.pdf")

	// 6. Update the deliverable
	fmt.Println("\nUpdating deliverable...")
	tags := []string{"hr", "contract", "finalized"}
	updated, err := client.UpdateDeliverableInfo(ctx, deliverableID, &turbodocx.UpdateDeliverableRequest{
		Name: "Employee Contract - John Smith (Final)",
		Tags: &tags,
	})
	if err != nil {
		log.Fatalf("Failed to update: %v", err)
	}
	fmt.Println(updated.Message)

	// 7. Browse deliverable items
	fmt.Println("\nBrowsing deliverable items...")
	items, err := client.ListDeliverableItems(ctx, &turbodocx.ListDeliverableItemsOptions{
		Limit:    10,
		ShowTags: true,
	})
	if err != nil {
		log.Fatalf("Failed to list items: %v", err)
	}
	fmt.Printf("Found %d items\n", items.TotalRecords)

	// 8. Get a single deliverable item by ID
	if len(items.Results) > 0 {
		itemID := items.Results[0].ID
		fmt.Printf("\nGetting deliverable item: %s\n", itemID)
		item, err := client.GetDeliverableItem(ctx, itemID, &turbodocx.GetDeliverableOptions{ShowTags: true})
		if err != nil {
			log.Fatalf("Failed to get item: %v", err)
		}
		fmt.Printf("Item: %s (%s)\n", item.Results.Name, item.Type)
	}

	fmt.Println("\nDone!")
}
