//go:build ignore
// +build ignore

// TurboPartner Example: API Key & User Management
//
// This example demonstrates partner-level management:
// - Partner API key creation with scoped permissions
// - Partner portal user management
// - Audit log querying
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
	partner, err := turbodocx.NewPartnerClient(turbodocx.PartnerConfig{
		PartnerAPIKey: getEnv("TURBODOCX_PARTNER_API_KEY", "TDXP-your-key-here"),
		PartnerID:     getEnv("TURBODOCX_PARTNER_ID", "your-partner-uuid"),
	})
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	ctx := context.Background()

	// --- Partner API Keys ---

	// Create a scoped partner API key (read-only for orgs and audit)
	fmt.Println("Creating scoped partner API key...")
	key, err := partner.CreatePartnerApiKey(ctx, &turbodocx.CreatePartnerApiKeyRequest{
		Name:        "Read-Only Monitoring Key",
		Description: "For monitoring dashboard - read-only access",
		Scopes: []string{
			turbodocx.ScopeOrgRead,
			turbodocx.ScopeOrgUsersRead,
			turbodocx.ScopeAuditRead,
		},
	})
	if err != nil {
		fmt.Printf("Error creating partner API key: %v\n", err)
		return
	}
	fmt.Printf("Created key: %s\n", key.Data.Name)
	fmt.Printf("Key value: %s\n", key.Data.Key)
	fmt.Printf("Scopes: %v\n\n", key.Data.Scopes)

	// List all partner API keys
	fmt.Println("Listing partner API keys...")
	keys, err := partner.ListPartnerApiKeys(ctx, nil)
	if err != nil {
		fmt.Printf("Error listing keys: %v\n", err)
		return
	}
	for _, k := range keys.Data.Results {
		fmt.Printf("  - %s (ID: %s)\n", k.Name, k.ID)
	}
	fmt.Println()

	// --- Partner Portal Users ---

	// Add a user to the partner portal with specific permissions
	fmt.Println("Adding partner portal user...")
	user, err := partner.AddUserToPartnerPortal(ctx, &turbodocx.AddPartnerUserRequest{
		Email: "ops@yourcompany.com",
		Role:  "member",
		Permissions: turbodocx.PartnerPermissions{
			CanManageOrgs:     true,
			CanManageOrgUsers: true,
			CanViewAuditLogs:  true,
			// Other permissions default to false
		},
	})
	if err != nil {
		fmt.Printf("Error adding partner user: %v\n", err)
		return
	}
	fmt.Printf("Added partner user: %s (Role: %s)\n\n", user.Data.Email, user.Data.Role)

	// List partner portal users
	fmt.Println("Listing partner portal users...")
	users, err := partner.ListPartnerPortalUsers(ctx, nil)
	if err != nil {
		fmt.Printf("Error listing users: %v\n", err)
		return
	}
	for _, u := range users.Data.Results {
		admin := ""
		if u.IsPrimaryAdmin {
			admin = " [PRIMARY ADMIN]"
		}
		fmt.Printf("  - %s (%s)%s\n", u.Email, u.Role, admin)
	}
	fmt.Println()

	// --- Audit Logs ---

	// Query recent audit logs
	fmt.Println("Fetching recent audit logs...")
	logs, err := partner.GetPartnerAuditLogs(ctx, &turbodocx.ListAuditLogsRequest{
		Limit: turbodocx.IntPtr(5),
	})
	if err != nil {
		fmt.Printf("Error fetching audit logs: %v\n", err)
		return
	}
	fmt.Printf("Total log entries: %d (showing first %d)\n", logs.Data.TotalRecords, len(logs.Data.Results))
	for _, entry := range logs.Data.Results {
		fmt.Printf("  [%s] %s %s (success: %t)\n",
			entry.CreatedOn, entry.Action, entry.ResourceType, entry.Success)
	}

	fmt.Println("\nDone!")
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
