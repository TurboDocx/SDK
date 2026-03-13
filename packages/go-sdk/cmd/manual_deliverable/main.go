//go:build manual
// +build manual

/*
Deliverable Go SDK - Manual Test Suite

Run: go run -tags manual cmd/manual_deliverable/main.go

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
	apiKey  = "your-api-key-here"          // Replace with your actual TurboDocx API key
	baseURL = "http://localhost:3000"       // Replace with your API URL
	orgID   = "your-organization-id-here"  // Replace with your organization UUID

	templateID        = "your-template-id-here"        // Replace with a valid template UUID
	deliverableID     = "your-deliverable-id-here"     // Replace with a valid deliverable UUID
	deliverableItemID = "your-deliverable-item-id-here" // Replace with a valid deliverable item UUID
)

var client *turbodocx.DeliverableClient

func init() {
	var err error
	client, err = turbodocx.NewDeliverableClientOnly(turbodocx.ClientConfig{
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

func testListDeliverables(ctx context.Context) error {
	fmt.Println("\n--- Test 1: ListDeliverables ---")

	result, err := client.ListDeliverables(ctx, &turbodocx.ListDeliverablesOptions{
		Limit:    10,
		Offset:   0,
		ShowTags: true,
	})
	if err != nil {
		return err
	}

	fmt.Printf("Total Records: %d\n", result.TotalRecords)
	prettyPrint(result)
	return nil
}

func testGenerateDeliverable(ctx context.Context) (string, error) {
	fmt.Println("\n--- Test 2: GenerateDeliverable ---")

	result, err := client.GenerateDeliverable(ctx, &turbodocx.CreateDeliverableRequest{
		Name:       "SDK Manual Test Document",
		TemplateID: templateID,
		Variables: []turbodocx.DeliverableVariable{
			{Placeholder: "{CompanyName}", Text: "TechCorp Inc.", MimeType: "text"},
			{Placeholder: "{EmployeeName}", Text: "John Smith", MimeType: "text"},
		},
		Tags: []string{"sdk-test", "manual"},
	})
	if err != nil {
		return "", err
	}

	prettyPrint(result)
	return result.Results.Deliverable.ID, nil
}

func testGetDeliverableDetails(ctx context.Context, id string) error {
	fmt.Println("\n--- Test 3: GetDeliverableDetails ---")

	result, err := client.GetDeliverableDetails(ctx, id, &turbodocx.GetDeliverableOptions{
		ShowTags: true,
	})
	if err != nil {
		return err
	}

	prettyPrint(result)
	return nil
}

func testUpdateDeliverableInfo(ctx context.Context, id string) error {
	fmt.Println("\n--- Test 4: UpdateDeliverableInfo ---")

	tags := []string{"sdk-test", "manual", "updated"}
	result, err := client.UpdateDeliverableInfo(ctx, id, &turbodocx.UpdateDeliverableRequest{
		Name: "SDK Manual Test Document (Updated)",
		Tags: &tags,
	})
	if err != nil {
		return err
	}

	prettyPrint(result)
	return nil
}

func testDeleteDeliverable(ctx context.Context, id string) error {
	fmt.Println("\n--- Test 5: DeleteDeliverable ---")

	result, err := client.DeleteDeliverable(ctx, id)
	if err != nil {
		return err
	}

	prettyPrint(result)
	return nil
}

func testDownloadSourceFile(ctx context.Context, id string) error {
	fmt.Println("\n--- Test 6: DownloadSourceFile ---")

	result, err := client.DownloadSourceFile(ctx, id)
	if err != nil {
		return err
	}

	fmt.Printf("Result: File received, size: %d bytes\n", len(result))

	outputPath := "./downloaded-deliverable.docx"
	err = os.WriteFile(outputPath, result, 0644)
	if err != nil {
		return fmt.Errorf("failed to save file: %w", err)
	}
	fmt.Printf("File saved to: %s\n", outputPath)

	return nil
}

func testDownloadPDF(ctx context.Context, id string) error {
	fmt.Println("\n--- Test 7: DownloadPDF ---")

	result, err := client.DownloadPDF(ctx, id)
	if err != nil {
		return err
	}

	fmt.Printf("Result: PDF received, size: %d bytes\n", len(result))

	outputPath := "./downloaded-deliverable.pdf"
	err = os.WriteFile(outputPath, result, 0644)
	if err != nil {
		return fmt.Errorf("failed to save file: %w", err)
	}
	fmt.Printf("File saved to: %s\n", outputPath)

	return nil
}

func testListDeliverableItems(ctx context.Context) error {
	fmt.Println("\n--- Test 8: ListDeliverableItems ---")

	result, err := client.ListDeliverableItems(ctx, &turbodocx.ListDeliverableItemsOptions{
		Limit:    10,
		ShowTags: true,
		Column0:  "createdOn",
		Order0:   "desc",
	})
	if err != nil {
		return err
	}

	fmt.Printf("Total Records: %d\n", result.TotalRecords)
	prettyPrint(result)
	return nil
}

func testGetDeliverableItem(ctx context.Context, id string) error {
	fmt.Println("\n--- Test 9: GetDeliverableItem ---")

	result, err := client.GetDeliverableItem(ctx, id, &turbodocx.GetDeliverableOptions{
		ShowTags: true,
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
	fmt.Println("Deliverable Go SDK - Manual Test Suite")
	fmt.Println("==============================================")

	ctx := context.Background()

	// Uncomment and run tests as needed:

	// Test 1: List Deliverables
	// err := testListDeliverables(ctx)
	// if err != nil { handleError(err); return }

	// Test 2: Generate Deliverable (replace templateID above)
	// newID, err := testGenerateDeliverable(ctx)
	// if err != nil { handleError(err); return }
	// fmt.Printf("New Deliverable ID: %s\n", newID)

	// Test 3: Get Deliverable Details (replace deliverableID above)
	// err := testGetDeliverableDetails(ctx, deliverableID)
	// if err != nil { handleError(err); return }

	// Test 4: Update Deliverable Info (replace deliverableID above)
	// err = testUpdateDeliverableInfo(ctx, deliverableID)
	// if err != nil { handleError(err); return }

	// Test 5: Delete Deliverable (run last — soft-deletes the deliverable)
	// err = testDeleteDeliverable(ctx, deliverableID)
	// if err != nil { handleError(err); return }

	// Test 6: Download Source File (replace deliverableID above)
	// err = testDownloadSourceFile(ctx, deliverableID)
	// if err != nil { handleError(err); return }

	// Test 7: Download PDF (replace deliverableID above)
	// err = testDownloadPDF(ctx, deliverableID)
	// if err != nil { handleError(err); return }

	// Test 8: List Deliverable Items
	// err = testListDeliverableItems(ctx)
	// if err != nil { handleError(err); return }

	// Test 9: Get Deliverable Item (replace deliverableItemID above)
	// err = testGetDeliverableItem(ctx, deliverableItemID)
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
