//go:build ignore
// +build ignore

// TurboPartner Example: Organization Lifecycle
//
// This example demonstrates the full TurboPartner partner management flow:
// 1. Create an organization with entitlements
// 2. Add a user to the organization
// 3. Create an API key for the organization
// 4. List organizations and users
// 5. Clean up resources
//
// Set environment variables before running:
//   export TURBODOCX_PARTNER_API_KEY=TDXP-your-key
//   export TURBODOCX_PARTNER_ID=your-partner-uuid

package main

import (
	"context"
	"fmt"
	"os"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
)

func main() {
	// 1. Configure the partner client
	partner, err := turbodocx.NewPartnerClient(turbodocx.PartnerConfig{
		PartnerAPIKey: getEnv("TURBODOCX_PARTNER_API_KEY", "TDXP-your-key-here"),
		PartnerID:     getEnv("TURBODOCX_PARTNER_ID", "your-partner-uuid"),
	})
	if err != nil {
		fmt.Printf("Error creating partner client: %v\n", err)
		return
	}

	ctx := context.Background()

	// 2. Create an organization with entitlements
	fmt.Println("Creating organization...")
	org, err := partner.CreateOrganization(ctx, &turbodocx.CreateOrganizationRequest{
		Name: "Acme Corporation",
		Features: &turbodocx.Features{
			MaxUsers:       turbodocx.IntPtr(25),                   // 25 user seats
			MaxStorage:     turbodocx.Int64Ptr(5 * 1024 * 1024 * 1024), // 5 GB storage
			MaxTemplates:   turbodocx.IntPtr(100),                  // 100 templates
			MaxSignatures:  turbodocx.IntPtr(500),                  // 500 signatures/month
			HasTDAI:        turbodocx.BoolPtr(true),                // AI features enabled
			HasPptx:        turbodocx.BoolPtr(true),                // PowerPoint generation
			HasFileDownload: turbodocx.BoolPtr(true),               // File downloads enabled
		},
	})
	if err != nil {
		fmt.Printf("Error creating organization: %v\n", err)
		return
	}
	orgID := org.Data.ID
	fmt.Printf("Created organization: %s (ID: %s)\n\n", org.Data.Name, orgID)

	// 3. Add a user to the organization
	fmt.Println("Adding user to organization...")
	user, err := partner.AddUserToOrganization(ctx, orgID, &turbodocx.AddOrgUserRequest{
		Email: "admin@acme.com",
		Role:  "admin",
	})
	if err != nil {
		fmt.Printf("Error adding user: %v\n", err)
		return
	}
	fmt.Printf("Added user: %s (Role: %s)\n\n", user.Data.Email, user.Data.Role)

	// 4. Create an API key for the organization
	fmt.Println("Creating organization API key...")
	apiKey, err := partner.CreateOrganizationApiKey(ctx, orgID, &turbodocx.CreateOrgApiKeyRequest{
		Name: "Production Key",
		Role: "admin",
	})
	if err != nil {
		fmt.Printf("Error creating API key: %v\n", err)
		return
	}
	fmt.Printf("Created API key: %s\n", apiKey.Data.Name)
	fmt.Printf("Key value: %s\n\n", apiKey.Data.Key)

	// 5. List all organizations
	fmt.Println("Listing organizations...")
	orgs, err := partner.ListOrganizations(ctx, &turbodocx.ListOrganizationsRequest{
		Limit: turbodocx.IntPtr(10),
	})
	if err != nil {
		fmt.Printf("Error listing organizations: %v\n", err)
		return
	}
	fmt.Printf("Total organizations: %d\n", orgs.Data.TotalRecords)
	for _, o := range orgs.Data.Results {
		fmt.Printf("  - %s (ID: %s)\n", o.Name, o.ID)
	}
	fmt.Println()

	// 6. Get full organization details (includes features + tracking)
	fmt.Println("Getting organization details...")
	details, err := partner.GetOrganizationDetails(ctx, orgID)
	if err != nil {
		fmt.Printf("Error getting details: %v\n", err)
		return
	}
	fmt.Printf("Organization: %s\n", details.Data.Name)
	if details.Data.Features != nil && details.Data.Features.MaxUsers != nil {
		fmt.Printf("  Max Users: %d\n", *details.Data.Features.MaxUsers)
	}
	if details.Data.Tracking != nil {
		fmt.Printf("  Current Users: %d\n", details.Data.Tracking.NumUsers)
	}
	fmt.Println()

	// 7. List users in the organization
	fmt.Println("Listing organization users...")
	users, err := partner.ListOrganizationUsers(ctx, orgID, nil)
	if err != nil {
		fmt.Printf("Error listing users: %v\n", err)
		return
	}
	fmt.Printf("Total users: %d\n", users.Data.TotalRecords)
	for _, u := range users.Data.Results {
		fmt.Printf("  - %s (%s)\n", u.Email, u.Role)
	}

	fmt.Println("\nDone! Organization is fully provisioned.")
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
