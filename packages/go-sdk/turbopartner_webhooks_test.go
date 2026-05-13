package turbodocx

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// =============================================
// Webhook Management Tests
// =============================================

func TestCreateWebhook(t *testing.T) {
	t.Run("creates webhook successfully", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/partner/test-partner-id/orgs/org-uuid-456/webhooks", r.URL.Path)
			assert.Equal(t, "Bearer TDXP-test-key", r.Header.Get("Authorization"))

			var body CreateWebhookRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "my-signing-webhook", body.Name)
			assert.Equal(t, []string{"https://example.com/hook"}, body.URLs)
			assert.Equal(t, []string{"signature.document.completed"}, body.Events)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"id":     "webhook-uuid-789",
					"name":   "my-signing-webhook",
					"urls":   []string{"https://example.com/hook"},
					"events": []string{"signature.document.completed"},
					"secret": "whsec_abc123",
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.CreateWebhook(context.Background(), "org-uuid-456", &CreateWebhookRequest{
			Name:   "my-signing-webhook",
			URLs:   []string{"https://example.com/hook"},
			Events: []string{"signature.document.completed"},
		})

		require.NoError(t, err)
		assert.True(t, result.Success)
		assert.Equal(t, "my-signing-webhook", result.Data.Name)
		assert.NotEmpty(t, result.Data.Secret)
	})

	t.Run("returns auth error on 401", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]string{"error": "Unauthorized"})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		_, err := client.CreateWebhook(context.Background(), "org-uuid-456", &CreateWebhookRequest{
			Name:   "webhook",
			URLs:   []string{"https://example.com/hook"},
			Events: []string{"signature.document.completed"},
		})

		require.Error(t, err)
		authErr, ok := err.(*AuthenticationError)
		require.True(t, ok, "expected AuthenticationError")
		assert.NotNil(t, authErr)
	})
}

func TestListWebhooks(t *testing.T) {
	t.Run("lists webhooks with pagination", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/partner/test-partner-id/orgs/org-uuid-456/webhooks", r.URL.Path)
			assert.Equal(t, "10", r.URL.Query().Get("limit"))
			assert.Equal(t, "0", r.URL.Query().Get("offset"))

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"results":      []map[string]interface{}{{"id": "webhook-1", "name": "my-webhook"}},
					"totalRecords": 1,
					"limit":        10,
					"offset":       0,
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.ListWebhooks(context.Background(), "org-uuid-456", &ListWebhooksRequest{
			Limit:  IntPtr(10),
			Offset: IntPtr(0),
		})

		require.NoError(t, err)
		assert.True(t, result.Success)
		assert.Equal(t, 1, result.Data.TotalRecords)
		assert.Len(t, result.Data.Results, 1)
	})

	t.Run("lists webhooks without params", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"results": []interface{}{}, "totalRecords": 0, "limit": 50, "offset": 0,
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.ListWebhooks(context.Background(), "org-uuid-456", nil)

		require.NoError(t, err)
		assert.True(t, result.Success)
	})
}

func TestGetWebhook(t *testing.T) {
	t.Run("gets webhook by name", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/partner/test-partner-id/orgs/org-uuid-456/webhooks/my-signing-webhook", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data":    map[string]interface{}{"id": "webhook-uuid-789", "name": "my-signing-webhook"},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.GetWebhook(context.Background(), "org-uuid-456", "my-signing-webhook")

		require.NoError(t, err)
		assert.True(t, result.Success)
		assert.Equal(t, "my-signing-webhook", result.Data.Name)
	})

	t.Run("returns not found error on 404", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]string{"error": "Not Found"})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		_, err := client.GetWebhook(context.Background(), "org-uuid-456", "nonexistent")

		require.Error(t, err)
		notFoundErr, ok := err.(*NotFoundError)
		require.True(t, ok, "expected NotFoundError")
		assert.NotNil(t, notFoundErr)
	})
}

func TestUpdateWebhook(t *testing.T) {
	t.Run("updates webhook fields", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/partner/test-partner-id/orgs/org-uuid-456/webhooks/my-signing-webhook", r.URL.Path)

			var body UpdateWebhookRequest
			json.NewDecoder(r.Body).Decode(&body)
			require.NotNil(t, body.IsActive)
			assert.False(t, *body.IsActive)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data":    map[string]interface{}{"id": "webhook-uuid-789", "name": "my-signing-webhook", "isActive": false},
			})
		}))
		defer server.Close()

		isActive := false
		client := newTestPartnerClient(t, server.URL)
		result, err := client.UpdateWebhook(context.Background(), "org-uuid-456", "my-signing-webhook", &UpdateWebhookRequest{
			IsActive: &isActive,
		})

		require.NoError(t, err)
		assert.True(t, result.Success)
		assert.False(t, result.Data.IsActive)
	})
}

func TestDeleteWebhook(t *testing.T) {
	t.Run("deletes webhook successfully", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/partner/test-partner-id/orgs/org-uuid-456/webhooks/my-signing-webhook", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"message": "Webhook deleted",
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.DeleteWebhook(context.Background(), "org-uuid-456", "my-signing-webhook")

		require.NoError(t, err)
		assert.True(t, result.Success)
	})
}

func TestTestWebhook(t *testing.T) {
	t.Run("sends test event with no overrides", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/partner/test-partner-id/orgs/org-uuid-456/webhooks/my-signing-webhook/test", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"deliveries": []interface{}{},
					"summary":    map[string]interface{}{"total": 1, "successful": 1, "failed": 0, "errors": []interface{}{}},
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.TestWebhook(context.Background(), "org-uuid-456", "my-signing-webhook", nil)

		require.NoError(t, err)
		assert.True(t, result.Success)
		assert.Equal(t, 1, result.Data.Summary.Successful)
	})

	t.Run("sends test event with event override", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var body TestWebhookRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "signature.document.voided", body.Event)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"deliveries": []interface{}{},
					"summary":    map[string]interface{}{"total": 1, "successful": 1, "failed": 0, "errors": []interface{}{}},
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.TestWebhook(context.Background(), "org-uuid-456", "my-signing-webhook", &TestWebhookRequest{
			Event: "signature.document.voided",
		})

		require.NoError(t, err)
		assert.True(t, result.Success)
	})
}

func TestListWebhookDeliveries(t *testing.T) {
	t.Run("lists deliveries with pagination", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/partner/test-partner-id/orgs/org-uuid-456/webhooks/my-signing-webhook/deliveries", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"results": []map[string]interface{}{
						{"id": "del-1", "event": "signature.document.completed", "statusCode": 200},
					},
					"totalRecords": 1,
					"limit":        50,
					"offset":       0,
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.ListWebhookDeliveries(context.Background(), "org-uuid-456", "my-signing-webhook", nil)

		require.NoError(t, err)
		assert.True(t, result.Success)
		assert.Equal(t, 1, result.Data.TotalRecords)
		assert.Len(t, result.Data.Results, 1)
	})
}
