//go:build ignore
// +build ignore

// TurboWebhooks CRUD example.
//
// Walks through the full lifecycle plus the error paths you actually hit
// in practice:
//
//   1. configure a WebhooksClient against the TurboDocx API
//   2. create the signature webhook
//   3. trigger the conflict path (second create with the same name → 409)
//   4. read (get) the webhook + its delivery stats
//   5. update its URL list and confirm the change
//   6. test-fire it (and surface per-URL failure strings)
//   7. rotate its secret
//   8. list past delivery attempts
//   9. delete it
//  10. confirm reads against the now-deleted webhook return 404
//
// Run:
//
//   export TURBODOCX_API_KEY=TDX-...
//   export TURBODOCX_ORG_ID=...
//   go run examples/turbowebhooks_crud.go
//
// Optionally override the API host with TURBODOCX_BASE_URL, and the
// delivery target with TURBODOCX_RECEIVER_URL (e.g. a webhook.site or
// ngrok URL) when live-testing.
//
// Requires an admin-scoped TDX- API key. The webhook route gate is
// requireOrgRole(administrator); a non-admin key will 403 here.

package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
)

// The SDK exports all 7 signature events as typed WebhookEvent constants (plus
// AllWebhookEvents). See the README for what each one fires on — note that
// `signed` is partial-progress only and never fires on the final signature;
// use `completed` to detect "the document is done".
const (
	eventDocumentCompleted = string(turbodocx.WebhookEventCompleted)
	eventDocumentVoided    = string(turbodocx.WebhookEventVoided)
)

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func section(title string) {
	fmt.Println("")
	fmt.Println(strings.Repeat("─", 60))
	fmt.Printf("▸ %s\n", title)
	fmt.Println(strings.Repeat("─", 60))
}

func pretty(value interface{}) string {
	b, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return "<unserializable>"
	}
	return string(b)
}

func runCRUD(ctx context.Context) error {
	// Configure the TurboWebhooks client. NewWebhooksClientWithConfig
	// does NOT require SenderEmail because webhooks don't send emails —
	// only TurboSign needs a sender_email.
	baseURL := getEnv("TURBODOCX_BASE_URL", "https://api.turbodocx.com")
	orgID := getEnv("TURBODOCX_ORG_ID", "your-org-id-here")

	// The URL the webhook will POST to when an event fires. The backend
	// enforces HTTPS-only — non-HTTPS URLs return 400 ValidationError.
	receiverURL := getEnv("TURBODOCX_RECEIVER_URL", "https://your-server.example.com/webhooks/turbodocx")

	client, err := turbodocx.NewWebhooksClientWithConfig(turbodocx.ClientConfig{
		APIKey:  getEnv("TURBODOCX_API_KEY", "your-admin-tdx-key-here"),
		OrgID:   orgID,
		BaseURL: baseURL,
	})
	if err != nil {
		return err
	}

	fmt.Printf("Configured TurboWebhooks against %s\n", baseURL)
	fmt.Printf("Org: %s\n", orgID)

	// ────────────────────────────────────────────────────────────
	// 1. CREATE
	// ────────────────────────────────────────────────────────────
	section("CREATE webhook")

	created, err := client.CreateWebhook(ctx, turbodocx.CreateWebhookRequest{
		URLs:   []string{receiverURL},
		Events: []string{eventDocumentCompleted, eventDocumentVoided},
	})
	if err != nil {
		var conflict *turbodocx.ConflictError
		if errors.As(err, &conflict) {
			// The webhook already exists from a previous run. That's fine —
			// continue with the rest of the example so you can still
			// exercise update / test / delete. Any other error bubbles
			// to the top-level handler.
			fmt.Println("A signature webhook already exists for this org (409). Continuing.")
		} else {
			return err
		}
	} else {
		fmt.Println("Created. Save this secret — it is shown ONCE:")
		fmt.Printf("  id:     %s\n", created.ID)
		fmt.Printf("  secret: %s\n", created.Secret)
	}

	// ────────────────────────────────────────────────────────────
	// 2. CONFLICT PATH — create again, expect 409
	// ────────────────────────────────────────────────────────────
	section("Trigger duplicate-name conflict (expect 409)")

	if _, err := client.CreateWebhook(ctx, turbodocx.CreateWebhookRequest{
		URLs:   []string{receiverURL},
		Events: []string{eventDocumentCompleted},
	}); err != nil {
		var conflict *turbodocx.ConflictError
		if errors.As(err, &conflict) {
			fmt.Println("Got the expected 409 ConflictError.")
			fmt.Printf("  message:    %s\n", conflict.Message)
			fmt.Printf("  statusCode: %d\n", conflict.StatusCode)
			fmt.Printf("  code:       %s\n", conflict.Code)
		} else {
			return err
		}
	} else {
		fmt.Println("Unexpected: second create succeeded. Did the webhook get deleted between calls?")
	}

	// ────────────────────────────────────────────────────────────
	// 3. READ
	// ────────────────────────────────────────────────────────────
	section("GET webhook")

	webhook, err := client.GetWebhook(ctx)
	if err != nil {
		return err
	}
	fmt.Println("Webhook:")
	fmt.Printf("  id:        %v\n", webhook["id"])
	fmt.Printf("  name:      %v\n", webhook["name"])
	fmt.Printf("  urls:      %s\n", pretty(webhook["urls"]))
	fmt.Printf("  events:    %s\n", pretty(webhook["events"]))
	fmt.Printf("  isActive:  %v\n", webhook["isActive"])
	fmt.Printf("  stats:     %s\n", pretty(webhook["deliveryStats"]))

	// ────────────────────────────────────────────────────────────
	// 4. UPDATE
	// ────────────────────────────────────────────────────────────
	section("UPDATE webhook (replace URL list)")

	updated, err := client.UpdateWebhook(ctx, turbodocx.UpdateWebhookRequest{
		URLs: []string{receiverURL},
	})
	if err != nil {
		return err
	}
	fmt.Printf("Updated. New URLs:\n%s\n", pretty(updated["urls"]))

	// ────────────────────────────────────────────────────────────
	// 5. TEST FIRE — surface per-URL errors
	// ────────────────────────────────────────────────────────────
	section("TEST-fire webhook")

	testResult, err := client.TestWebhook(ctx, turbodocx.TestWebhookRequest{
		EventType: eventDocumentCompleted,
		Payload: map[string]interface{}{
			"documentId":   "00000000-0000-0000-0000-000000000000",
			"documentName": "CRUD-example test fire",
			"completedAt":  time.Now().UTC().Format(time.RFC3339),
		},
	})
	if err != nil {
		var tdxErr *turbodocx.TurboDocxError
		if errors.As(err, &tdxErr) {
			fmt.Printf("Test-fire failed: %T — %s\n", err, tdxErr.Message)
		} else {
			fmt.Printf("Test-fire failed: %v\n", err)
		}
	} else if summary, ok := testResult["summary"].(map[string]interface{}); ok {
		fmt.Printf("Summary: %v/%v successful, %v failed\n",
			summary["successful"], summary["total"], summary["failed"])
		if errs, ok := summary["errors"].([]interface{}); ok && len(errs) > 0 {
			fmt.Println("Per-URL errors:")
			for _, e := range errs {
				fmt.Printf("  - %v\n", e)
			}
		}
	} else {
		fmt.Printf("Test-fire response: %s\n", pretty(testResult))
	}

	// ────────────────────────────────────────────────────────────
	// 6. ROTATE SECRET
	// ────────────────────────────────────────────────────────────
	section("Rotate webhook secret")

	rotated, err := client.RegenerateWebhookSecret(ctx)
	if err != nil {
		return err
	}
	fmt.Println("Rotated. New secret (shown ONCE, save it):")
	fmt.Printf("  secret:        %v\n", rotated["secret"])
	fmt.Printf("  regeneratedAt: %v\n", rotated["regeneratedAt"])

	// ────────────────────────────────────────────────────────────
	// 7. LIST DELIVERIES
	// ────────────────────────────────────────────────────────────
	section("List recent delivery attempts")

	limit := 5
	deliveries, err := client.ListWebhookDeliveries(ctx, turbodocx.ListDeliveriesRequest{
		Limit: &limit,
	})
	if err != nil {
		return err
	}
	fmt.Printf("Total recorded: %v\n", deliveries["totalRecords"])
	if results, ok := deliveries["results"].([]interface{}); ok {
		for i, item := range results {
			d, _ := item.(map[string]interface{})
			httpStatus := d["httpStatus"]
			if httpStatus == nil {
				httpStatus = "pending"
			}
			delivered := "FAIL"
			if v, _ := d["isDelivered"].(bool); v {
				delivered = "OK"
			}
			fmt.Printf("  [%d] %v → %v (%s) at %v\n",
				i, d["eventType"], httpStatus, delivered, d["createdOn"])
		}
	}

	// ────────────────────────────────────────────────────────────
	// 8. DELETE
	// ────────────────────────────────────────────────────────────
	section("DELETE webhook")

	delResult, err := client.DeleteWebhook(ctx)
	if err != nil {
		return err
	}
	fmt.Printf("Deleted. Server says: %v\n", delResult["message"])

	// ────────────────────────────────────────────────────────────
	// 9. POST-DELETE READ — expect 404
	// ────────────────────────────────────────────────────────────
	section("GET after delete (expect 404)")

	if _, err := client.GetWebhook(ctx); err != nil {
		var nf *turbodocx.NotFoundError
		if errors.As(err, &nf) {
			fmt.Printf("Got the expected 404 NotFoundError: %s\n", nf.Message)
		} else {
			return err
		}
	} else {
		fmt.Println("Unexpected: read after delete succeeded.")
	}

	return nil
}

func main() {
	ctx := context.Background()

	// Top-level error handler — catches anything the per-section blocks
	// didn't handle. Each branch is dedicated so the message tells you
	// exactly which class of failure occurred.
	err := runCRUD(ctx)
	if err == nil {
		fmt.Println("\n✓ CRUD walkthrough complete.")
		return
	}

	var authErr *turbodocx.AuthenticationError
	var authzErr *turbodocx.AuthorizationError
	var valErr *turbodocx.ValidationError
	var nfErr *turbodocx.NotFoundError
	var rateErr *turbodocx.RateLimitError
	var confErr *turbodocx.ConflictError
	var netErr *turbodocx.NetworkError
	var tdxErr *turbodocx.TurboDocxError

	switch {
	case errors.As(err, &authErr):
		fmt.Printf("\n[401] Authentication failed: %s\n", authErr.Message)
		fmt.Println("Check TURBODOCX_API_KEY. The webhook routes require an admin TDX- key.")
	case errors.As(err, &authzErr):
		fmt.Printf("\n[403] Authorization failed: %s\n", authzErr.Message)
		fmt.Println("Webhook routes require the org administrator role.")
	case errors.As(err, &valErr):
		fmt.Printf("\n[400] Validation error: %s\n", valErr.Message)
	case errors.As(err, &nfErr):
		fmt.Printf("\n[404] Not found: %s\n", nfErr.Message)
	case errors.As(err, &rateErr):
		fmt.Printf("\n[429] Rate limited: %s\n", rateErr.Message)
	case errors.As(err, &confErr):
		fmt.Printf("\n[409] Conflict: %s\n", confErr.Message)
	case errors.As(err, &netErr):
		configured := getEnv("TURBODOCX_BASE_URL", "https://api.turbodocx.com")
		fmt.Printf("\n[network] Could not reach the backend: %s\n", netErr.Message)
		fmt.Printf("Could not reach %s.\n", configured)
	case errors.As(err, &tdxErr):
		fmt.Printf("\n[%d] %s\n", tdxErr.StatusCode, tdxErr.Message)
	default:
		fmt.Printf("\n[?] %v\n", err)
	}
	os.Exit(1)
}
