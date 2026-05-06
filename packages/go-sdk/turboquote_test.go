package turbodocx

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newTestQuoteClient(t *testing.T, serverURL string) *QuoteClient {
	t.Helper()
	client, err := NewQuoteClient(QuoteClientConfig{
		APIKey:  "test-api-key",
		OrgID:   "test-org-id",
		BaseURL: serverURL,
	})
	require.NoError(t, err)
	return client
}

// =============================================
// Configuration Tests
// =============================================

func TestNewQuoteClient(t *testing.T) {
	t.Run("creates client with API key and org ID", func(t *testing.T) {
		client, err := NewQuoteClient(QuoteClientConfig{
			APIKey: "test-key",
			OrgID:  "org-1",
		})
		require.NoError(t, err)
		assert.NotNil(t, client)
	})

	t.Run("creates client with access token", func(t *testing.T) {
		client, err := NewQuoteClient(QuoteClientConfig{
			AccessToken: "oauth-token",
			OrgID:       "org-1",
		})
		require.NoError(t, err)
		assert.NotNil(t, client)
	})

	t.Run("creates client with custom base URL", func(t *testing.T) {
		client, err := NewQuoteClient(QuoteClientConfig{
			APIKey:  "test-key",
			OrgID:   "org-1",
			BaseURL: "https://custom.api.com",
		})
		require.NoError(t, err)
		assert.NotNil(t, client)
		assert.Equal(t, "https://custom.api.com", client.http.baseURL)
	})

	t.Run("returns error when API key and access token are both missing", func(t *testing.T) {
		_, err := NewQuoteClient(QuoteClientConfig{
			OrgID: "org-1",
		})
		require.Error(t, err)
		authErr, ok := err.(*AuthenticationError)
		require.True(t, ok, "expected AuthenticationError")
		assert.Contains(t, authErr.Message, "API key or access token is required")
	})

	t.Run("returns error when org ID is missing", func(t *testing.T) {
		_, err := NewQuoteClient(QuoteClientConfig{
			APIKey: "test-key",
		})
		require.Error(t, err)
		authErr, ok := err.(*AuthenticationError)
		require.True(t, ok, "expected AuthenticationError")
		assert.Contains(t, authErr.Message, "Organization ID is required")
	})

	t.Run("reads config from environment variables", func(t *testing.T) {
		t.Setenv("TURBODOCX_API_KEY", "env-api-key")
		t.Setenv("TURBODOCX_ORG_ID", "env-org-id")

		client, err := NewQuoteClient(QuoteClientConfig{})
		require.NoError(t, err)
		assert.NotNil(t, client)
	})

	t.Run("uses default base URL when not provided", func(t *testing.T) {
		client, err := NewQuoteClient(QuoteClientConfig{
			APIKey: "test-key",
			OrgID:  "org-1",
		})
		require.NoError(t, err)
		assert.Equal(t, "https://api.turbodocx.com", client.http.baseURL)
	})
}

// =============================================
// QuoteStatus Constants Tests
// =============================================

func TestQuoteStatusPendingApproval(t *testing.T) {
	t.Run("QuoteStatusPendingApproval constant exists and equals pending_approval", func(t *testing.T) {
		assert.Equal(t, QuoteStatus("pending_approval"), QuoteStatusPendingApproval)
	})
}

// =============================================
// Quotes CRUD Tests
// =============================================

func TestQuoteClient_ListQuotes(t *testing.T) {
	t.Run("lists quotes with pagination and filters", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.True(t, strings.HasPrefix(r.URL.Path, "/v1/quotes"))
			assert.Equal(t, "Bearer test-api-key", r.Header.Get("Authorization"))
			assert.Equal(t, "test-org-id", r.Header.Get("x-rapiddocx-org-id"))

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": []map[string]interface{}{
					{"id": "q-1", "name": "Test Quote", "status": "draft"},
				},
				"totalRecords": 1,
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		limit := 10
		query := "test"
		result, err := client.ListQuotes(context.Background(), &ListQuotesOptions{
			Limit: &limit,
			Query: &query,
		})

		require.NoError(t, err)
		assert.Len(t, result.Results, 1)
		assert.Equal(t, 1, result.TotalRecords)
		assert.Equal(t, "q-1", result.Results[0].ID)
	})

	t.Run("lists quotes with nil options", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/v1/quotes", r.URL.Path)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results":      []interface{}{},
				"totalRecords": 0,
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.ListQuotes(context.Background(), nil)

		require.NoError(t, err)
		assert.Len(t, result.Results, 0)
		assert.Equal(t, 0, result.TotalRecords)
	})

	t.Run("passes array statuses as repeated query params", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			values := r.URL.Query()
			statuses := values["statuses"]
			assert.Contains(t, statuses, "draft")
			assert.Contains(t, statuses, "sent")

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results":      []interface{}{},
				"totalRecords": 0,
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		_, err := client.ListQuotes(context.Background(), &ListQuotesOptions{
			Statuses: []string{"draft", "sent"},
		})
		require.NoError(t, err)
	})
}

func TestQuoteClient_CreateQuote(t *testing.T) {
	t.Run("creates a quote and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/quotes", r.URL.Path)

			var body CreateQuoteRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "My Quote", body.Name)
			assert.Equal(t, "c-1", body.CompanyID)
			assert.Equal(t, "ct-1", body.ContactID)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":          "q-1",
					"name":        "My Quote",
					"status":      "draft",
					"quoteNumber": "Q-2026-00001",
				},
				"message": "Quote created successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.CreateQuote(context.Background(), &CreateQuoteRequest{
			Name:      "My Quote",
			CompanyID: "c-1",
			ContactID: "ct-1",
		})

		require.NoError(t, err)
		assert.Equal(t, "q-1", result.ID)
		assert.Equal(t, "draft", result.Status)
		assert.Equal(t, "Q-2026-00001", result.QuoteNumber)
	})

	t.Run("creates a quote with all optional fields", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var body map[string]interface{}
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "Full Quote", body["name"])
			assert.Equal(t, "EUR", body["currency"])

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":  map[string]interface{}{"id": "q-2", "name": "Full Quote", "status": "draft"},
				"message": "Quote created successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		currency := "EUR"
		termDays := 60
		taxRate := 8.25
		validUntil := "2026-12-31"
		pbID := "pb-1"

		result, err := client.CreateQuote(context.Background(), &CreateQuoteRequest{
			Name:          "Full Quote",
			CompanyID:     "comp-1",
			ContactID:     "cont-1",
			CurrencyCode:  &currency,
			TermDays:      &termDays,
			TaxRate:       &taxRate,
			ValidUntil:    &validUntil,
			PriceBookID:   &pbID,
		})

		require.NoError(t, err)
		assert.Equal(t, "q-2", result.ID)
	})
}

func TestQuoteClient_GetQuote(t *testing.T) {
	t.Run("gets a quote by ID and includes statusInfo", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/v1/quotes/q-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":        "q-1",
					"name":      "Test Quote",
					"status":    "sent",
					"lineItems": []interface{}{},
				},
				"statusInfo": map[string]interface{}{
					"currentStatus": "sent",
					"canSend":       false,
					"canAccept":     true,
					"canDecline":    true,
					"canVoid":       true,
					"isTerminal":    false,
				},
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.GetQuote(context.Background(), "q-1")

		require.NoError(t, err)
		assert.Equal(t, "q-1", result.ID)
		assert.NotNil(t, result.StatusInfo)
		assert.Equal(t, "sent", result.StatusInfo.CurrentStatus)
		assert.False(t, result.StatusInfo.CanSend)
		assert.True(t, result.StatusInfo.CanAccept)
		assert.True(t, result.StatusInfo.CanDecline)
		assert.True(t, result.StatusInfo.CanVoid)
		assert.False(t, result.StatusInfo.IsTerminal)
	})

	t.Run("gets a quote without statusInfo", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":     "q-1",
					"name":   "Draft Quote",
					"status": "draft",
				},
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.GetQuote(context.Background(), "q-1")

		require.NoError(t, err)
		assert.Equal(t, "q-1", result.ID)
		assert.Nil(t, result.StatusInfo)
	})
}

func TestQuoteClient_UpdateQuote(t *testing.T) {
	t.Run("updates a quote and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/v1/quotes/q-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":      "q-1",
					"name":    "Updated Name",
					"taxRate": 10,
				},
				"message": "Quote updated successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		name := "Updated Name"
		taxRate := 10.0
		result, err := client.UpdateQuote(context.Background(), "q-1", &UpdateQuoteRequest{
			Name:    &name,
			TaxRate: &taxRate,
		})

		require.NoError(t, err)
		assert.Equal(t, "Updated Name", result.Name)
	})
}

func TestQuoteClient_DeleteQuote(t *testing.T) {
	t.Run("deletes a quote", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/v1/quotes/q-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Quote deleted successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.DeleteQuote(context.Background(), "q-1")

		require.NoError(t, err)
		assert.Equal(t, "Quote deleted successfully", result.Message)
	})
}

func TestQuoteClient_DuplicateQuote(t *testing.T) {
	t.Run("duplicates a quote and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/duplicate", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":          "q-2",
					"name":        "Test Quote (Copy)",
					"status":      "draft",
					"quoteNumber": "Q-2026-00002",
				},
				"message": "Quote duplicated successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.DuplicateQuote(context.Background(), "q-1")

		require.NoError(t, err)
		assert.Equal(t, "q-2", result.ID)
		assert.Equal(t, "draft", result.Status)
	})
}

func TestQuoteClient_ApplyPriceBook(t *testing.T) {
	t.Run("applies a price book and returns full response with counts", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/apply-pricebook", r.URL.Path)

			var body map[string]string
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "pb-1", body["priceBookId"])

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":          "q-1",
					"priceBookId": "pb-1",
				},
				"updatedCount": 3,
				"skippedCount": 1,
				"message":      "Pricebook applied: 3 product(s) updated, 1 skipped",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.ApplyPriceBook(context.Background(), "q-1", "pb-1")

		require.NoError(t, err)
		assert.Equal(t, "q-1", result.QuoteResult.ID)
		assert.Equal(t, 3, result.UpdatedCount)
		assert.Equal(t, 1, result.SkippedCount)
		assert.Equal(t, "Pricebook applied: 3 product(s) updated, 1 skipped", result.Message)
	})
}

func TestQuoteClient_RemovePriceBook(t *testing.T) {
	t.Run("removes a price book and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/remove-pricebook", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":          "q-1",
					"priceBookId": nil,
				},
				"message": "Pricebook removed from quote",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.RemovePriceBook(context.Background(), "q-1")

		require.NoError(t, err)
		assert.Equal(t, "q-1", result.ID)
		assert.Nil(t, result.PriceBookID)
	})
}

func TestQuoteClient_DownloadQuotePdf(t *testing.T) {
	t.Run("downloads a quote PDF", func(t *testing.T) {
		expectedContent := []byte("%PDF-mock-content")
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/pdf", r.URL.Path)
			w.Write(expectedContent)
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.DownloadQuotePdf(context.Background(), "q-1")

		require.NoError(t, err)
		assert.Equal(t, expectedContent, result)
	})
}

// =============================================
// Quote Status Transition Tests
// =============================================

func TestQuoteClient_SendQuote(t *testing.T) {
	t.Run("sends a quote and remaps result to quote field", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/send", r.URL.Path)

			var body map[string]interface{}
			json.NewDecoder(r.Body).Decode(&body)
			ccEmails := body["ccEmails"].([]interface{})
			assert.Equal(t, "admin@example.com", ccEmails[0])

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":  map[string]interface{}{"id": "q-1", "status": "sent"},
				"message": "Quote sent",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.SendQuote(context.Background(), "q-1", &SendQuoteRequest{
			CCEmails: []string{"admin@example.com"},
		})

		require.NoError(t, err)
		assert.Equal(t, "sent", result.QuoteResult.Status)
		assert.Equal(t, "Quote sent", result.Message)
	})

	t.Run("sends a quote without options", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":  map[string]interface{}{"id": "q-1", "status": "sent"},
				"message": "Quote sent",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.SendQuote(context.Background(), "q-1", nil)

		require.NoError(t, err)
		assert.Equal(t, "q-1", result.QuoteResult.ID)
	})
}

func TestQuoteClient_SendQuoteWithDeliverable(t *testing.T) {
	t.Run("sends a quote with a deliverable and returns documentId", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/send-with-deliverable", r.URL.Path)

			var body SendQuoteWithDeliverableRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "del-1", body.DeliverableID)
			assert.Equal(t, "end", body.MergePosition)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":     map[string]interface{}{"id": "q-1", "status": "sent"},
				"message":    "Quote sent with deliverable",
				"documentId": "doc-2",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.SendQuoteWithDeliverable(context.Background(), "q-1", &SendQuoteWithDeliverableRequest{
			DeliverableID: "del-1",
			MergePosition: "end",
		})

		require.NoError(t, err)
		assert.Equal(t, "sent", result.QuoteResult.Status)
		assert.Equal(t, "doc-2", result.DocumentID)
		assert.Equal(t, "Quote sent with deliverable", result.Message)
	})
}

func TestQuoteClient_DeclineQuote(t *testing.T) {
	t.Run("declines a quote and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/decline", r.URL.Path)

			var body DeclineQuoteRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "Budget not approved", body.Reason)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":  map[string]interface{}{"id": "q-1", "status": "declined"},
				"message": "Quote declined",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.DeclineQuote(context.Background(), "q-1", &DeclineQuoteRequest{
			Reason: "Budget not approved",
		})

		require.NoError(t, err)
		assert.Equal(t, "declined", result.Status)
	})
}

func TestQuoteClient_VoidQuote(t *testing.T) {
	t.Run("voids a quote and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/void", r.URL.Path)

			var body VoidQuoteRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "Replaced by new quote", body.Reason)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":  map[string]interface{}{"id": "q-1", "status": "voided"},
				"message": "Quote voided successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.VoidQuote(context.Background(), "q-1", &VoidQuoteRequest{
			Reason: "Replaced by new quote",
		})

		require.NoError(t, err)
		assert.Equal(t, "voided", result.Status)
	})
}

func TestQuoteClient_HandleExpiredQuote(t *testing.T) {
	t.Run("handles an expired sent quote and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/handle-expired-sent", r.URL.Path)

			var body HandleExpiredQuoteRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "void", body.Action)
			assert.Equal(t, "Expired", body.Reason)
			assert.Equal(t, "2026-12-31", body.NewValidUntil)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":          "q-2",
					"status":      "draft",
					"quoteNumber": "Q-2026-00003",
				},
				"message": "Expired quote processed",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.HandleExpiredQuote(context.Background(), "q-1", &HandleExpiredQuoteRequest{
			Action:        "void",
			Reason:        "Expired",
			NewValidUntil: "2026-12-31",
		})

		require.NoError(t, err)
		assert.Equal(t, "draft", result.Status)
	})
}

// =============================================
// Line Items Tests
// =============================================

func TestQuoteClient_ListLineItems(t *testing.T) {
	t.Run("lists line items for a quote", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.True(t, strings.HasPrefix(r.URL.Path, "/v1/quotes/q-1/items"))

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": []map[string]interface{}{
					{"id": "li-1", "productName": "Widget"},
				},
				"totalRecords": 1,
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.ListLineItems(context.Background(), "q-1", nil)

		require.NoError(t, err)
		assert.Len(t, result.Results, 1)
	})
}

func TestQuoteClient_AddLineItems(t *testing.T) {
	t.Run("adds product line items and unwraps results", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/items", r.URL.Path)

			// Verify the body is an array
			var body []map[string]interface{}
			json.NewDecoder(r.Body).Decode(&body)
			assert.Len(t, body, 1)
			assert.Equal(t, "prod-1", body[0]["productId"])

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": []map[string]interface{}{
					{"id": "li-1", "productId": "prod-1", "quantity": 2},
				},
				"message": "1 line item(s) added successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		prodID := "prod-1"
		qty := 2
		result, err := client.AddLineItems(context.Background(), "q-1", []AddLineItemRequest{
			{
				ProductID:        &prodID,
				ProductName:      "Widget",
				UnitPrice:        50,
				BillingFrequency: "monthly",
				Quantity:         &qty,
			},
		})

		require.NoError(t, err)
		assert.Len(t, result, 1)
		assert.Equal(t, "li-1", result[0].ID)
	})

	t.Run("adds multiple product line items as batch", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var body []map[string]interface{}
			json.NewDecoder(r.Body).Decode(&body)
			assert.Len(t, body, 2)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": []map[string]interface{}{
					{"id": "li-1"},
					{"id": "li-2"},
				},
				"message": "2 line item(s) added successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		prod1 := "prod-1"
		prod2 := "prod-2"
		qty1 := 5
		qty2 := 1
		disc := 10.0

		result, err := client.AddLineItems(context.Background(), "q-1", []AddLineItemRequest{
			{ProductID: &prod1, ProductName: "Widget A", UnitPrice: 50, BillingFrequency: "monthly", Quantity: &qty1},
			{ProductID: &prod2, ProductName: "Widget B", UnitPrice: 75, BillingFrequency: "monthly", Quantity: &qty2, DiscountPercent: &disc},
		})

		require.NoError(t, err)
		assert.Len(t, result, 2)
	})
}

func TestQuoteClient_AddBundleLineItems(t *testing.T) {
	t.Run("adds bundle line items and unwraps results", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/items/bundle", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": []map[string]interface{}{
					{"id": "li-3", "bundleId": "bun-1", "lineItemType": "bundle"},
				},
				"message": "1 bundle(s) added successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.AddBundleLineItems(context.Background(), "q-1", []AddBundleLineItemRequest{
			{BundleID: "bun-1", BundleName: "Starter Pack"},
		})

		require.NoError(t, err)
		assert.Len(t, result, 1)
	})
}

func TestQuoteClient_UpdateLineItem(t *testing.T) {
	t.Run("updates a line item and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/items/li-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":        "li-1",
					"quantity":  10,
					"unitPrice": 50,
				},
				"message": "Line item updated successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		qty := 10
		price := 50.0
		result, err := client.UpdateLineItem(context.Background(), "q-1", "li-1", &UpdateLineItemRequest{
			Quantity:  &qty,
			UnitPrice: &price,
		})

		require.NoError(t, err)
		assert.Equal(t, 10, result.Quantity)
	})
}

func TestQuoteClient_RemoveLineItem(t *testing.T) {
	t.Run("removes a line item", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/v1/quotes/q-1/items/li-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Line item removed successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.RemoveLineItem(context.Background(), "q-1", "li-1")

		require.NoError(t, err)
		assert.Equal(t, "Line item removed successfully", result.Message)
	})
}

// =============================================
// Products Tests
// =============================================

func TestQuoteClient_ListProducts(t *testing.T) {
	t.Run("lists products with filters", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.True(t, strings.HasPrefix(r.URL.Path, "/v1/products"))

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": []map[string]interface{}{
					{"id": "p-1", "name": "Widget"},
				},
				"totalRecords": 1,
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		billingFreq := "monthly"
		limit := 25
		result, err := client.ListProducts(context.Background(), &ListProductsOptions{
			BillingFrequency: &billingFreq,
			Limit:            &limit,
		})

		require.NoError(t, err)
		assert.Len(t, result.Results, 1)
	})
}

func TestQuoteClient_CreateProduct(t *testing.T) {
	t.Run("creates a product without images and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/products", r.URL.Path)
			assert.Contains(t, r.Header.Get("Content-Type"), "application/json")

			var body CreateProductRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "Widget Pro", body.Name)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":        "p-1",
					"name":      "Widget Pro",
					"listPrice": 99.99,
				},
				"message": "Product created successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.CreateProduct(context.Background(), &CreateProductRequest{
			Name:             "Widget Pro",
			ListPrice:        99.99,
			BillingFrequency: "monthly",
			CategoryID:       "cat-1",
		})

		require.NoError(t, err)
		assert.Equal(t, "Widget Pro", result.Name)
	})

	t.Run("creates a product with images using multipart upload", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/products", r.URL.Path)
			assert.Contains(t, r.Header.Get("Content-Type"), "multipart/form-data")

			// Parse the multipart form
			err := r.ParseMultipartForm(10 << 20)
			require.NoError(t, err)

			// Verify the "data" field contains JSON
			dataField := r.FormValue("data")
			assert.NotEmpty(t, dataField)
			var parsed map[string]interface{}
			json.Unmarshal([]byte(dataField), &parsed)
			assert.Equal(t, "Widget", parsed["name"])
			assert.Equal(t, float64(99), parsed["listPrice"])
			assert.Equal(t, "monthly", parsed["billingFrequency"])
			assert.Equal(t, "cat-1", parsed["categoryId"])

			// Verify images were uploaded
			files := r.MultipartForm.File["images"]
			assert.Len(t, files, 1)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":   "p-1",
					"name": "Widget",
				},
				"message": "Product created successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.CreateProduct(context.Background(), &CreateProductRequest{
			Name:             "Widget",
			ListPrice:        99,
			BillingFrequency: "monthly",
			CategoryID:       "cat-1",
			Images: []ProductImageInput{
				{Data: []byte("fake-image"), FileName: "test.jpg"},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "p-1", result.ID)
	})
}

func TestQuoteClient_GetProduct(t *testing.T) {
	t.Run("gets a product by ID and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/v1/products/p-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":     "p-1",
					"name":   "Widget",
					"images": []interface{}{},
				},
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.GetProduct(context.Background(), "p-1")

		require.NoError(t, err)
		assert.Equal(t, "p-1", result.ID)
	})
}

func TestQuoteClient_UpdateProduct(t *testing.T) {
	t.Run("updates a product without images and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/v1/products/p-1", r.URL.Path)
			assert.Contains(t, r.Header.Get("Content-Type"), "application/json")

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":        "p-1",
					"name":      "Updated Widget",
					"listPrice": 149.99,
				},
				"message": "Product updated successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		name := "Updated Widget"
		price := 149.99
		result, err := client.UpdateProduct(context.Background(), "p-1", &UpdateProductRequest{
			Name:      &name,
			ListPrice: &price,
		})

		require.NoError(t, err)
		assert.Equal(t, "Updated Widget", result.Name)
	})

	t.Run("updates a product with images using multipart upload", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/v1/products/p-1", r.URL.Path)
			assert.Contains(t, r.Header.Get("Content-Type"), "multipart/form-data")

			err := r.ParseMultipartForm(10 << 20)
			require.NoError(t, err)

			dataField := r.FormValue("data")
			var parsed map[string]interface{}
			json.Unmarshal([]byte(dataField), &parsed)
			assert.Equal(t, "Updated Widget", parsed["name"])

			// Verify imageIdsToKeep in JSON data
			idsToKeep := parsed["imageIdsToKeep"].([]interface{})
			assert.Contains(t, idsToKeep, "img-id-1")

			files := r.MultipartForm.File["images"]
			assert.Len(t, files, 1)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":   "p-1",
					"name": "Updated Widget",
				},
				"message": "Product updated successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		name := "Updated Widget"
		result, err := client.UpdateProduct(context.Background(), "p-1", &UpdateProductRequest{
			Name:           &name,
			ImageIDsToKeep: []string{"img-id-1"},
			Images: []ProductImageInput{
				{Data: []byte("fake-image"), FileName: "new.jpg"},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "p-1", result.ID)
	})
}

func TestQuoteClient_DeleteProduct(t *testing.T) {
	t.Run("deletes a product", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/v1/products/p-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Product deleted successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.DeleteProduct(context.Background(), "p-1")

		require.NoError(t, err)
		assert.Equal(t, "Product deleted successfully", result.Message)
	})
}

func TestQuoteClient_DuplicateProduct(t *testing.T) {
	t.Run("duplicates a product and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/products/p-1/duplicate", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":   "p-2",
					"name": "Widget Pro (Copy)",
				},
				"message": "Product duplicated successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.DuplicateProduct(context.Background(), "p-1")

		require.NoError(t, err)
		assert.Equal(t, "p-2", result.ID)
	})
}

func TestQuoteClient_GetProductPrimaryImages(t *testing.T) {
	t.Run("gets primary images and unwraps results", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/products/primary-images", r.URL.Path)

			var body map[string][]string
			json.NewDecoder(r.Body).Decode(&body)
			assert.Contains(t, body["productIds"], "p-1")
			assert.Contains(t, body["productIds"], "p-2")

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": map[string]interface{}{
					"p-1": map[string]interface{}{"id": "img-1", "productId": "p-1"},
					"p-2": nil,
				},
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.GetProductPrimaryImages(context.Background(), []string{"p-1", "p-2"})

		require.NoError(t, err)
		assert.NotNil(t, result["p-1"])
		assert.Equal(t, "img-1", result["p-1"].ID)
		assert.Nil(t, result["p-2"])
	})
}

// =============================================
// Price Books Tests
// =============================================

func TestQuoteClient_ListPriceBooks(t *testing.T) {
	t.Run("lists price books", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.True(t, strings.HasPrefix(r.URL.Path, "/v1/pricebooks"))

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": []map[string]interface{}{
					{"id": "pb-1", "name": "Standard"},
				},
				"totalRecords": 1,
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.ListPriceBooks(context.Background(), nil)

		require.NoError(t, err)
		assert.Len(t, result.Results, 1)
	})
}

func TestQuoteClient_CreatePriceBook(t *testing.T) {
	t.Run("creates a price book and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/pricebooks", r.URL.Path)

			var body map[string]interface{}
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "Partner Pricing", body["name"])
			assert.Equal(t, "pbt-1", body["priceBookTypeId"])
			assert.Equal(t, "2026-01-01", body["validFrom"])

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":              "pb-1",
					"name":            "Partner Pricing",
					"discountPercent": 15,
				},
				"message": "PriceBook created successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		discount := 15.0
		result, err := client.CreatePriceBook(context.Background(), &CreatePriceBookRequest{
			Name:            "Partner Pricing",
			PriceBookTypeID: "pbt-1",
			ValidFrom:       "2026-01-01",
			DiscountPercent: &discount,
		})

		require.NoError(t, err)
		assert.Equal(t, "Partner Pricing", result.Name)
	})
}

func TestQuoteClient_GetPriceBook(t *testing.T) {
	t.Run("gets a price book by ID and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/v1/pricebooks/pb-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":   "pb-1",
					"name": "Standard",
				},
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.GetPriceBook(context.Background(), "pb-1")

		require.NoError(t, err)
		assert.Equal(t, "pb-1", result.ID)
	})
}

func TestQuoteClient_UpdatePriceBook(t *testing.T) {
	t.Run("updates a price book and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/v1/pricebooks/pb-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":              "pb-1",
					"name":            "Updated",
					"discountPercent": 20,
				},
				"message": "PriceBook updated successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		discount := 20.0
		result, err := client.UpdatePriceBook(context.Background(), "pb-1", &UpdatePriceBookRequest{
			DiscountPercent: &discount,
		})

		require.NoError(t, err)
		assert.Equal(t, 20.0, result.DiscountPercent)
	})
}

func TestQuoteClient_DeletePriceBook(t *testing.T) {
	t.Run("deletes a price book", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/v1/pricebooks/pb-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "PriceBook deleted successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.DeletePriceBook(context.Background(), "pb-1")

		require.NoError(t, err)
		assert.Equal(t, "PriceBook deleted successfully", result.Message)
	})
}

func TestQuoteClient_DuplicatePriceBook(t *testing.T) {
	t.Run("duplicates a price book and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/pricebooks/pb-1/duplicate", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":   "pb-2",
					"name": "Standard (Copy)",
				},
				"message": "Pricebook duplicated successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.DuplicatePriceBook(context.Background(), "pb-1")

		require.NoError(t, err)
		assert.Equal(t, "pb-2", result.ID)
	})
}

func TestQuoteClient_ListPriceBookProducts(t *testing.T) {
	t.Run("lists products in a price book", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.True(t, strings.HasPrefix(r.URL.Path, "/v1/pricebooks/pb-1/products"))

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": []map[string]interface{}{
					{"productId": "p-1", "discountPercent": 10},
				},
				"totalRecords": 1,
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.ListPriceBookProducts(context.Background(), "pb-1", nil)

		require.NoError(t, err)
		assert.Len(t, result.Results, 1)
	})
}

// =============================================
// Bundles Tests
// =============================================

func TestQuoteClient_ListBundles(t *testing.T) {
	t.Run("lists bundles", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": []map[string]interface{}{
					{"id": "b-1", "name": "Starter Pack"},
				},
				"totalRecords": 1,
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.ListBundles(context.Background(), nil)

		require.NoError(t, err)
		assert.Len(t, result.Results, 1)
	})
}

func TestQuoteClient_CreateBundle(t *testing.T) {
	t.Run("creates a bundle and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/bundles", r.URL.Path)

			var body map[string]interface{}
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "Starter Pack", body["name"])
			assert.Equal(t, "cat-1", body["categoryId"])

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":    "b-1",
					"name":  "Starter Pack",
					"items": []interface{}{},
				},
				"message": "Bundle created successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.CreateBundle(context.Background(), &CreateBundleRequest{
			Name:       "Starter Pack",
			CategoryID: "cat-1",
			Items: []BundleItemInput{
				{ProductID: "p-1", UnitPrice: 50, BillingFrequency: "monthly"},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "Starter Pack", result.Name)
	})
}

func TestQuoteClient_GetBundle(t *testing.T) {
	t.Run("gets a bundle by ID and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/v1/bundles/b-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":    "b-1",
					"items": []interface{}{},
				},
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.GetBundle(context.Background(), "b-1")

		require.NoError(t, err)
		assert.Equal(t, "b-1", result.ID)
	})
}

func TestQuoteClient_UpdateBundle(t *testing.T) {
	t.Run("updates a bundle and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/v1/bundles/b-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":  map[string]interface{}{"id": "b-1", "name": "Pro Pack"},
				"message": "Bundle updated successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		name := "Pro Pack"
		result, err := client.UpdateBundle(context.Background(), "b-1", &UpdateBundleRequest{
			Name: &name,
		})

		require.NoError(t, err)
		assert.Equal(t, "Pro Pack", result.Name)
	})
}

func TestQuoteClient_DeleteBundle(t *testing.T) {
	t.Run("deletes a bundle", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/v1/bundles/b-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Bundle deleted successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.DeleteBundle(context.Background(), "b-1")

		require.NoError(t, err)
		assert.Equal(t, "Bundle deleted successfully", result.Message)
	})
}

func TestQuoteClient_DuplicateBundle(t *testing.T) {
	t.Run("duplicates a bundle and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/bundles/b-1/duplicate", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":  map[string]interface{}{"id": "b-2"},
				"message": "Bundle duplicated successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.DuplicateBundle(context.Background(), "b-1")

		require.NoError(t, err)
		assert.Equal(t, "b-2", result.ID)
	})
}

// =============================================
// Companies Tests
// =============================================

func TestQuoteClient_ListCompanies(t *testing.T) {
	t.Run("lists companies with query filter", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Contains(t, r.URL.RawQuery, "query=acme")

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": []map[string]interface{}{
					{"id": "c-1", "name": "Acme Corp"},
				},
				"totalRecords": 1,
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		query := "acme"
		result, err := client.ListCompanies(context.Background(), &ListCompaniesOptions{
			Query: &query,
		})

		require.NoError(t, err)
		assert.Len(t, result.Results, 1)
	})
}

func TestQuoteClient_CreateCompany(t *testing.T) {
	t.Run("creates a company and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/companies", r.URL.Path)

			var body map[string]interface{}
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "Acme Corp", body["name"])
			assert.Equal(t, "Austin", body["city"])
			assert.Equal(t, "TX", body["state"])

			contacts := body["contacts"].([]interface{})
			contact := contacts[0].(map[string]interface{})
			assert.Equal(t, "John Doe", contact["name"])
			assert.Equal(t, "john@acme.com", contact["email"])

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":  map[string]interface{}{"id": "c-1", "name": "Acme Corp"},
				"message": "Company created successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		city := "Austin"
		state := "TX"
		result, err := client.CreateCompany(context.Background(), &CreateCompanyRequest{
			Name: "Acme Corp",
			Contacts: []CreateCompanyContactInput{
				{Name: "John Doe", Email: "john@acme.com"},
			},
			City:  &city,
			State: &state,
		})

		require.NoError(t, err)
		assert.Equal(t, "Acme Corp", result.Name)
	})
}

func TestQuoteClient_GetCompany(t *testing.T) {
	t.Run("gets a company by ID and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/v1/companies/c-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{"id": "c-1", "name": "Acme"},
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.GetCompany(context.Background(), "c-1")

		require.NoError(t, err)
		assert.Equal(t, "c-1", result.ID)
	})
}

func TestQuoteClient_UpdateCompany(t *testing.T) {
	t.Run("updates a company and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/v1/companies/c-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":  map[string]interface{}{"id": "c-1", "name": "Acme Inc"},
				"message": "Company updated successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		name := "Acme Inc"
		result, err := client.UpdateCompany(context.Background(), "c-1", &UpdateCompanyRequest{
			Name: &name,
		})

		require.NoError(t, err)
		assert.Equal(t, "Acme Inc", result.Name)
	})
}

func TestQuoteClient_DeleteCompany(t *testing.T) {
	t.Run("deletes a company", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/v1/companies/c-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Company deleted successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.DeleteCompany(context.Background(), "c-1")

		require.NoError(t, err)
		assert.Equal(t, "Company deleted successfully", result.Message)
	})
}

func TestQuoteClient_ListCompanyContacts(t *testing.T) {
	t.Run("lists contacts for a company", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.True(t, strings.HasPrefix(r.URL.Path, "/v1/companies/c-1/contacts"))

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": []map[string]interface{}{
					{"id": "ct-1", "name": "John Doe"},
				},
				"totalRecords": 1,
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.ListCompanyContacts(context.Background(), "c-1", nil)

		require.NoError(t, err)
		assert.Len(t, result.Results, 1)
	})
}

// =============================================
// Contacts Tests
// =============================================

func TestQuoteClient_ListContacts(t *testing.T) {
	t.Run("lists contacts with company filter", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Contains(t, r.URL.RawQuery, "companyId=c-1")

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": []map[string]interface{}{
					{"id": "ct-1", "name": "Jane"},
				},
				"totalRecords": 1,
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		companyID := "c-1"
		result, err := client.ListContacts(context.Background(), &ListContactsOptions{
			CompanyID: &companyID,
		})

		require.NoError(t, err)
		assert.Len(t, result.Results, 1)
	})
}

func TestQuoteClient_CreateContact(t *testing.T) {
	t.Run("creates a contact and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/contacts", r.URL.Path)

			var body map[string]interface{}
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "John Doe", body["name"])
			assert.Equal(t, "c-1", body["companyId"])
			assert.Equal(t, "john@example.com", body["email"])

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":  map[string]interface{}{"id": "ct-1", "name": "John Doe", "email": "john@example.com"},
				"message": "Contact created successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		email := "john@example.com"
		result, err := client.CreateContact(context.Background(), &CreateContactRequest{
			Name:      "John Doe",
			CompanyID: "c-1",
			Email:     &email,
		})

		require.NoError(t, err)
		assert.Equal(t, "John Doe", result.Name)
	})
}

func TestQuoteClient_UpdateContact(t *testing.T) {
	t.Run("updates a contact and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/v1/contacts/ct-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":  map[string]interface{}{"id": "ct-1", "name": "Jane Doe"},
				"message": "Contact updated successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		name := "Jane Doe"
		result, err := client.UpdateContact(context.Background(), "ct-1", &UpdateContactRequest{
			Name: &name,
		})

		require.NoError(t, err)
		assert.Equal(t, "Jane Doe", result.Name)
	})
}

func TestQuoteClient_DeleteContact(t *testing.T) {
	t.Run("deletes a contact", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/v1/contacts/ct-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Contact deleted successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.DeleteContact(context.Background(), "ct-1")

		require.NoError(t, err)
		assert.Equal(t, "Contact deleted successfully", result.Message)
	})
}

// =============================================
// Templates Tests
// =============================================

func TestQuoteClient_ListTemplates(t *testing.T) {
	t.Run("lists all templates", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.True(t, strings.HasPrefix(r.URL.Path, "/v1/quote-templates"))

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": []map[string]interface{}{
					{"id": "t-1", "primaryColor": "#0066FF"},
					{"id": "t-2", "primaryColor": "#FF0000"},
				},
				"totalRecords": 2,
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.ListTemplates(context.Background(), nil)

		require.NoError(t, err)
		assert.Len(t, result.Results, 2)
	})

	t.Run("lists templates with pagination", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Contains(t, r.URL.RawQuery, "limit=10")
			assert.Contains(t, r.URL.RawQuery, "offset=0")
			assert.Contains(t, r.URL.RawQuery, "query=sales")

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": []map[string]interface{}{
					{"id": "t-1", "primaryColor": "#0066FF"},
				},
				"totalRecords": 1,
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		limit := 10
		offset := 0
		query := "sales"
		result, err := client.ListTemplates(context.Background(), &PaginationParams{
			Limit:  &limit,
			Offset: &offset,
			Query:  &query,
		})

		require.NoError(t, err)
		assert.Len(t, result.Results, 1)
	})
}

func TestQuoteClient_GetTemplate(t *testing.T) {
	t.Run("gets the org template and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/v1/quote-template", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":  map[string]interface{}{"id": "t-1", "primaryColor": "#0066FF"},
				"message": "Template found",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.GetTemplate(context.Background())

		require.NoError(t, err)
		assert.Equal(t, "t-1", result.ID)
	})
}

func TestQuoteClient_GetTemplateByID(t *testing.T) {
	t.Run("gets a template by ID and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/v1/quote-templates/t-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{"id": "t-1", "primaryColor": "#0066FF"},
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.GetTemplateByID(context.Background(), "t-1")

		require.NoError(t, err)
		assert.Equal(t, "t-1", result.ID)
	})
}

func TestQuoteClient_CreateTemplate(t *testing.T) {
	t.Run("creates a template and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/quote-templates", r.URL.Path)

			var body map[string]interface{}
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "#0066FF", body["primaryColor"])
			assert.Equal(t, "Sales", body["senderName"])

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":  map[string]interface{}{"id": "t-1", "primaryColor": "#0066FF"},
				"message": "Template created successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		color := "#0066FF"
		senderName := "Sales"
		result, err := client.CreateTemplate(context.Background(), &CreateQuoteTemplateRequest{
			PrimaryColor: &color,
			SenderName:   &senderName,
		})

		require.NoError(t, err)
		assert.Equal(t, "t-1", result.ID)
	})
}

func TestQuoteClient_UpdateTemplate(t *testing.T) {
	t.Run("updates a template and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/v1/quote-templates/t-1", r.URL.Path)

			var body map[string]interface{}
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "#FF0000", body["primaryColor"])

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":  map[string]interface{}{"id": "t-1", "primaryColor": "#FF0000"},
				"message": "Template updated successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		color := "#FF0000"
		result, err := client.UpdateTemplate(context.Background(), "t-1", &UpdateQuoteTemplateRequest{
			PrimaryColor: &color,
		})

		require.NoError(t, err)
		assert.Equal(t, "#FF0000", result.PrimaryColor)
	})
}

func TestQuoteClient_DeleteTemplate(t *testing.T) {
	t.Run("deletes a template", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/v1/quote-templates/t-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Template deleted successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.DeleteTemplate(context.Background(), "t-1")

		require.NoError(t, err)
		assert.Equal(t, "Template deleted successfully", result.Message)
	})
}

// =============================================
// Types / Categories Tests
// =============================================

func TestQuoteClient_ListTypes(t *testing.T) {
	t.Run("lists types by category", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Contains(t, r.URL.RawQuery, "categoryType=company_industry")

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results": []map[string]interface{}{
					{"id": "type-1", "name": "Technology"},
				},
				"totalRecords": 1,
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		catType := "company_industry"
		result, err := client.ListTypes(context.Background(), &ListTypesOptions{
			CategoryType: &catType,
		})

		require.NoError(t, err)
		assert.Len(t, result.Results, 1)
	})

	t.Run("lists types without options", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/v1/types", r.URL.Path)
			assert.Empty(t, r.URL.RawQuery)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"results":      []interface{}{},
				"totalRecords": 0,
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.ListTypes(context.Background(), nil)

		require.NoError(t, err)
		assert.Len(t, result.Results, 0)
	})
}

func TestQuoteClient_CreateType(t *testing.T) {
	t.Run("creates a type and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/v1/types", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result": map[string]interface{}{
					"id":           "type-1",
					"name":         "SaaS",
					"categoryType": "product_category",
				},
				"message": "Type created successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.CreateType(context.Background(), &CreateQuoteTypeRequest{
			Name:         "SaaS",
			CategoryType: CategoryTypeProductCategory,
		})

		require.NoError(t, err)
		assert.Equal(t, "SaaS", result.Name)
	})
}

func TestQuoteClient_UpdateType(t *testing.T) {
	t.Run("updates a type and unwraps result", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/v1/types/type-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"result":  map[string]interface{}{"id": "type-1", "name": "Software"},
				"message": "Type updated successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		name := "Software"
		result, err := client.UpdateType(context.Background(), "type-1", &UpdateQuoteTypeRequest{
			Name: &name,
		})

		require.NoError(t, err)
		assert.Equal(t, "Software", result.Name)
	})
}

func TestQuoteClient_DeleteType(t *testing.T) {
	t.Run("deletes a type", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/v1/types/type-1", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Type deleted successfully",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.DeleteType(context.Background(), "type-1")

		require.NoError(t, err)
		assert.Equal(t, "Type deleted successfully", result.Message)
	})
}

// =============================================
// CreateAndSend Convenience Tests
// =============================================

func TestQuoteClient_CreateAndSend(t *testing.T) {
	t.Run("creates a quote, adds items, and sends in one call", func(t *testing.T) {
		callCount := 0
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			callCount++
			w.Header().Set("Content-Type", "application/json")

			switch callCount {
			case 1:
				// Create quote
				assert.Equal(t, "POST", r.Method)
				assert.Equal(t, "/v1/quotes", r.URL.Path)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"result":  map[string]interface{}{"id": "q-1", "name": "Enterprise License", "status": "draft"},
					"message": "Quote created successfully",
				})
			case 2:
				// Add line items
				assert.Equal(t, "POST", r.Method)
				assert.Equal(t, "/v1/quotes/q-1/items", r.URL.Path)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"results": []map[string]interface{}{{"id": "li-1"}},
					"message": "1 line item(s) added successfully",
				})
			case 3:
				// Send quote
				assert.Equal(t, "POST", r.Method)
				assert.Equal(t, "/v1/quotes/q-1/send", r.URL.Path)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"result":  map[string]interface{}{"id": "q-1", "name": "Enterprise License", "status": "sent"},
					"message": "Sent",
				})
			}
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		prodID := "p-1"
		qty := 10

		result, err := client.CreateAndSend(context.Background(), &CreateAndSendRequest{
			Name:      "Enterprise License",
			CompanyID: "c-1",
			ContactID: "ct-1",
			Items: []AddLineItemRequest{
				{ProductID: &prodID, ProductName: "Widget", UnitPrice: 99, BillingFrequency: "monthly", Quantity: &qty},
			},
			Send: &SendQuoteRequest{
				CCEmails: []string{"admin@example.com"},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "sent", result.Quote.Status)
		assert.Equal(t, 3, callCount)
	})

	t.Run("creates and sends without items", func(t *testing.T) {
		callCount := 0
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			callCount++
			w.Header().Set("Content-Type", "application/json")

			switch callCount {
			case 1:
				assert.Equal(t, "/v1/quotes", r.URL.Path)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"result":  map[string]interface{}{"id": "q-1", "name": "Simple Quote", "status": "draft"},
					"message": "Quote created successfully",
				})
			case 2:
				assert.Equal(t, "/v1/quotes/q-1/send", r.URL.Path)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"result":  map[string]interface{}{"id": "q-1", "name": "Simple Quote", "status": "sent"},
					"message": "Sent",
				})
			}
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.CreateAndSend(context.Background(), &CreateAndSendRequest{
			Name:      "Simple Quote",
			CompanyID: "c-1",
			ContactID: "ct-1",
		})

		require.NoError(t, err)
		assert.Equal(t, "sent", result.Quote.Status)
		assert.Equal(t, 2, callCount)
	})

	t.Run("response exposes Quote field matching other SDKs", func(t *testing.T) {
		callCount := 0
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			callCount++
			w.Header().Set("Content-Type", "application/json")

			switch callCount {
			case 1:
				json.NewEncoder(w).Encode(map[string]interface{}{
					"result":  map[string]interface{}{"id": "q-1", "name": "Parity Quote", "status": "draft"},
					"message": "Quote created successfully",
				})
			case 2:
				json.NewEncoder(w).Encode(map[string]interface{}{
					"result":  map[string]interface{}{"id": "q-1", "name": "Parity Quote", "status": "sent"},
					"message": "Sent",
				})
			}
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.CreateAndSend(context.Background(), &CreateAndSendRequest{
			Name:      "Parity Quote",
			CompanyID: "c-1",
			ContactID: "ct-1",
		})

		require.NoError(t, err)
		// Fix 2: field should be named Quote, not QuoteResult, matching other SDKs
		assert.Equal(t, "q-1", result.Quote.ID)
		assert.Equal(t, "sent", result.Quote.Status)
	})

	t.Run("creates and sends with bundle items", func(t *testing.T) {
		callCount := 0
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			callCount++
			w.Header().Set("Content-Type", "application/json")

			switch callCount {
			case 1:
				assert.Equal(t, "/v1/quotes", r.URL.Path)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"result":  map[string]interface{}{"id": "q-1", "name": "Bundle Quote", "status": "draft"},
					"message": "Quote created successfully",
				})
			case 2:
				assert.Equal(t, "/v1/quotes/q-1/items/bundle", r.URL.Path)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"results": []map[string]interface{}{{"id": "li-1", "lineItemType": "bundle"}},
					"message": "1 bundle(s) added successfully",
				})
			case 3:
				assert.Equal(t, "/v1/quotes/q-1/send", r.URL.Path)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"result":  map[string]interface{}{"id": "q-1", "name": "Bundle Quote", "status": "sent"},
					"message": "Sent",
				})
			}
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.CreateAndSend(context.Background(), &CreateAndSendRequest{
			Name:      "Bundle Quote",
			CompanyID: "c-1",
			ContactID: "ct-1",
			BundleItems: []AddBundleLineItemRequest{
				{BundleID: "b-1", BundleName: "Starter Pack"},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "sent", result.Quote.Status)
		assert.Equal(t, 3, callCount)
	})
}

// =============================================
// Error Handling Tests
// =============================================

func TestQuoteClient_ErrorHandling(t *testing.T) {
	t.Run("handles 404 not found error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Quote not found",
				"code":    "QUOTE_NOT_FOUND",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		_, err := client.GetQuote(context.Background(), "invalid")

		require.Error(t, err)
		notFoundErr, ok := err.(*NotFoundError)
		require.True(t, ok, "expected NotFoundError")
		assert.Equal(t, 404, notFoundErr.StatusCode)
		assert.Equal(t, "Quote not found", notFoundErr.Message)
	})

	t.Run("handles 400 validation error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Name is required",
				"code":    "VALIDATION_ERROR",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		_, err := client.CreateQuote(context.Background(), &CreateQuoteRequest{
			Name:      "",
			CompanyID: "c-1",
			ContactID: "ct-1",
		})

		require.Error(t, err)
		validationErr, ok := err.(*ValidationError)
		require.True(t, ok, "expected ValidationError")
		assert.Equal(t, 400, validationErr.StatusCode)
		assert.Equal(t, "Name is required", validationErr.Message)
	})

	t.Run("handles 401 authentication error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Invalid API key",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		_, err := client.ListQuotes(context.Background(), nil)

		require.Error(t, err)
		authErr, ok := err.(*AuthenticationError)
		require.True(t, ok, "expected AuthenticationError")
		assert.Equal(t, 401, authErr.StatusCode)
	})

	t.Run("handles 429 rate limit error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Rate limit exceeded",
				"code":    "RATE_LIMIT_EXCEEDED",
			})
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		_, err := client.ListQuotes(context.Background(), nil)

		require.Error(t, err)
		rateLimitErr, ok := err.(*RateLimitError)
		require.True(t, ok, "expected RateLimitError")
		assert.Equal(t, 429, rateLimitErr.StatusCode)
	})
}

// =============================================
// Normalizer Integration Tests
// =============================================

func TestQuoteClient_NormalizerIntegration(t *testing.T) {
	t.Run("coerces tinyint booleans in quote responses", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			// Simulate MySQL returning 0/1 for boolean fields
			w.Write([]byte(`{"result": {"id": "q-1", "name": "Test", "status": "draft", "isActive": 1}}`))
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.GetQuote(context.Background(), "q-1")

		require.NoError(t, err)
		assert.True(t, result.IsActive)
	})

	t.Run("coerces string decimals in product responses", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			// Simulate MySQL returning decimal strings
			w.Write([]byte(`{"result": {"id": "p-1", "name": "Widget", "listPrice": "99.99", "cost": "50.00", "isActive": 1, "showInCatalog": 0}}`))
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.GetProduct(context.Background(), "p-1")

		require.NoError(t, err)
		assert.Equal(t, 99.99, result.ListPrice)
		assert.NotNil(t, result.Cost)
		assert.Equal(t, 50.0, *result.Cost)
		assert.True(t, result.IsActive)
		assert.False(t, result.ShowInCatalog)
	})

	t.Run("normalizes nested objects in list responses", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{
				"results": [
					{"id": "p-1", "name": "Widget A", "listPrice": "100.00", "isActive": 1, "showInCatalog": 1},
					{"id": "p-2", "name": "Widget B", "listPrice": "200.00", "isActive": 0, "showInCatalog": 0}
				],
				"totalRecords": 2,
				"totalProducts": 2,
				"activeProducts": 1,
				"totalCategories": 1,
				"catalogValue": 300.00
			}`))
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.ListProducts(context.Background(), nil)

		require.NoError(t, err)
		assert.Len(t, result.Results, 2)
		assert.Equal(t, 100.0, result.Results[0].ListPrice)
		assert.True(t, result.Results[0].IsActive)
		assert.True(t, result.Results[0].ShowInCatalog)
		assert.Equal(t, 200.0, result.Results[1].ListPrice)
		assert.False(t, result.Results[1].IsActive)
		assert.False(t, result.Results[1].ShowInCatalog)
	})

	t.Run("handles smart unwrap with data wrapper", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			// Backend wraps response in { "data": ... }
			w.Write([]byte(`{"data": {"result": {"id": "q-1", "name": "Wrapped Quote", "status": "draft", "isActive": 1}}}`))
		}))
		defer server.Close()

		client := newTestQuoteClient(t, server.URL)
		result, err := client.GetQuote(context.Background(), "q-1")

		require.NoError(t, err)
		assert.Equal(t, "q-1", result.ID)
		assert.Equal(t, "Wrapped Quote", result.Name)
		assert.True(t, result.IsActive)
	})
}

// =============================================
// Helper functions for pointer creation
// =============================================

func StringPtr(s string) *string    { return &s }
func Float64Ptr(f float64) *float64 { return &f }

// =============================================
// PATCH Null Field Clearing Tests
// =============================================

func TestUpdateQuoteRequestClearNullableField(t *testing.T) {
	req := &UpdateQuoteRequest{}
	req.Name = StringPtr("New Name")
	req.ClearTaxRate()
	data, err := json.Marshal(req)
	if err != nil {
		t.Fatalf("marshal error: %v", err)
	}
	var obj map[string]interface{}
	json.Unmarshal(data, &obj)
	if obj["name"] != "New Name" {
		t.Errorf("expected name=New Name, got %v", obj["name"])
	}
	if _, exists := obj["taxRate"]; !exists {
		t.Error("taxRate should be present as null")
	}
	if obj["taxRate"] != nil {
		t.Errorf("expected taxRate=null, got %v", obj["taxRate"])
	}
	if _, exists := obj["companyId"]; exists {
		t.Error("companyId should not be present")
	}
}

func TestUpdateQuoteRequestNoNullFields(t *testing.T) {
	req := &UpdateQuoteRequest{}
	req.Name = StringPtr("Test")
	data, _ := json.Marshal(req)
	var obj map[string]interface{}
	json.Unmarshal(data, &obj)
	if len(obj) != 1 {
		t.Errorf("expected 1 field, got %d: %v", len(obj), obj)
	}
}

func TestUpdateProductRequestClearCost(t *testing.T) {
	req := &UpdateProductRequest{}
	req.Name = StringPtr("Widget")
	req.ClearCost()
	data, _ := json.Marshal(req)
	var obj map[string]interface{}
	json.Unmarshal(data, &obj)
	if _, exists := obj["cost"]; !exists {
		t.Error("cost should be present as null")
	}
	if obj["cost"] != nil {
		t.Error("cost should be null")
	}
}

func TestUpdateCompanyRequestClearIndustryID(t *testing.T) {
	req := &UpdateCompanyRequest{}
	req.Name = StringPtr("Acme")
	req.ClearIndustryID()
	data, _ := json.Marshal(req)
	var obj map[string]interface{}
	json.Unmarshal(data, &obj)
	if _, exists := obj["industryId"]; !exists {
		t.Error("industryId should be present as null")
	}
	if obj["industryId"] != nil {
		t.Error("industryId should be null")
	}
}

func TestUpdateContactRequestClearEmail(t *testing.T) {
	req := &UpdateContactRequest{}
	req.Name = StringPtr("John")
	req.ClearEmail()
	data, _ := json.Marshal(req)
	var obj map[string]interface{}
	json.Unmarshal(data, &obj)
	if _, exists := obj["email"]; !exists {
		t.Error("email should be present as null")
	}
	if obj["email"] != nil {
		t.Error("email should be null")
	}
}

func TestUpdateLineItemRequestClearCost(t *testing.T) {
	req := &UpdateLineItemRequest{}
	qty := 5
	req.Quantity = &qty
	req.ClearCost()
	data, _ := json.Marshal(req)
	var obj map[string]interface{}
	json.Unmarshal(data, &obj)
	if _, exists := obj["cost"]; !exists {
		t.Error("cost should be present as null")
	}
	if obj["cost"] != nil {
		t.Error("cost should be null")
	}
}

func TestUpdatePriceBookRequestClearDescription(t *testing.T) {
	req := &UpdatePriceBookRequest{}
	req.Name = StringPtr("Standard")
	req.ClearDescription()
	data, _ := json.Marshal(req)
	var obj map[string]interface{}
	json.Unmarshal(data, &obj)
	if _, exists := obj["description"]; !exists {
		t.Error("description should be present as null")
	}
	if obj["description"] != nil {
		t.Error("description should be null")
	}
}

func TestUpdateBundleRequestClearDescription(t *testing.T) {
	req := &UpdateBundleRequest{}
	req.Name = StringPtr("Pack")
	req.ClearDescription()
	data, _ := json.Marshal(req)
	var obj map[string]interface{}
	json.Unmarshal(data, &obj)
	if _, exists := obj["description"]; !exists {
		t.Error("description should be present as null")
	}
	if obj["description"] != nil {
		t.Error("description should be null")
	}
}

func TestUpdateQuoteTemplateRequestClearDisclaimer(t *testing.T) {
	req := &UpdateQuoteTemplateRequest{}
	req.PrimaryColor = StringPtr("#FF0000")
	req.ClearDisclaimer()
	data, _ := json.Marshal(req)
	var obj map[string]interface{}
	json.Unmarshal(data, &obj)
	if _, exists := obj["disclaimer"]; !exists {
		t.Error("disclaimer should be present as null")
	}
	if obj["disclaimer"] != nil {
		t.Error("disclaimer should be null")
	}
	if obj["primaryColor"] != "#FF0000" {
		t.Errorf("expected primaryColor=#FF0000, got %v", obj["primaryColor"])
	}
}

func TestUpdateQuoteRequestClearNullableFieldViaHTTP(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "PATCH", r.Method)

		var raw map[string]interface{}
		json.NewDecoder(r.Body).Decode(&raw)

		// name should be present with value
		assert.Equal(t, "Updated", raw["name"])
		// taxRate should be present as null
		_, hasTaxRate := raw["taxRate"]
		assert.True(t, hasTaxRate, "taxRate should be present in request body")
		assert.Nil(t, raw["taxRate"], "taxRate should be null")
		// companyId should NOT be present
		_, hasCompanyID := raw["companyId"]
		assert.False(t, hasCompanyID, "companyId should not be present")

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"result":  map[string]interface{}{"id": "q-1", "name": "Updated"},
			"message": "Quote updated successfully",
		})
	}))
	defer server.Close()

	client := newTestQuoteClient(t, server.URL)
	req := &UpdateQuoteRequest{}
	req.Name = StringPtr("Updated")
	req.ClearTaxRate()

	result, err := client.UpdateQuote(context.Background(), "q-1", req)
	require.NoError(t, err)
	assert.Equal(t, "Updated", result.Name)
}

func TestUpdateQuoteRequestClearMultipleFields(t *testing.T) {
	req := &UpdateQuoteRequest{}
	req.Name = StringPtr("Updated")
	req.ClearTaxRate()
	req.ClearPriceBookID()
	req.ClearValidUntil()
	data, _ := json.Marshal(req)
	var obj map[string]interface{}
	json.Unmarshal(data, &obj)

	// Should have name + 3 null fields = 4 total
	if len(obj) != 4 {
		t.Errorf("expected 4 fields, got %d: %v", len(obj), obj)
	}
	if obj["taxRate"] != nil {
		t.Error("taxRate should be null")
	}
	if obj["priceBookId"] != nil {
		t.Error("priceBookId should be null")
	}
	if obj["validUntil"] != nil {
		t.Error("validUntil should be null")
	}
}
