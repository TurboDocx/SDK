package turbodocx

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// newTestWebhooksClient creates a WebhooksClient pointed at the test server.
func newTestWebhooksClient(t *testing.T, serverURL string) *WebhooksClient {
	t.Helper()
	client, err := NewWebhooksClientWithConfig(ClientConfig{
		APIKey:  "TDX-test-key",
		OrgID:   "test-org-id",
		BaseURL: serverURL,
	})
	require.NoError(t, err)
	return client
}

// =============================================
// Configuration tests
// =============================================

func TestNewWebhooksClient(t *testing.T) {
	t.Run("creates client without requiring sender email", func(t *testing.T) {
		client, err := NewWebhooksClientWithConfig(ClientConfig{
			APIKey: "TDX-foo",
			OrgID:  "org-1",
		})
		require.NoError(t, err)
		require.NotNil(t, client)
		// SenderEmail was not provided — webhook routes don't need it.
	})

	t.Run("returns error when API key is missing", func(t *testing.T) {
		_, err := NewWebhooksClientWithConfig(ClientConfig{OrgID: "org-1"})
		require.Error(t, err)
		authErr, ok := err.(*AuthenticationError)
		require.True(t, ok, "expected AuthenticationError")
		assert.Contains(t, authErr.Message, "API key")
	})

	t.Run("returns error when org ID is missing", func(t *testing.T) {
		_, err := NewWebhooksClientWithConfig(ClientConfig{APIKey: "TDX-foo"})
		require.Error(t, err)
		authErr, ok := err.(*AuthenticationError)
		require.True(t, ok, "expected AuthenticationError")
		assert.Contains(t, authErr.Message, "Organization")
	})
}

// =============================================
// CRUD — always hits /api/webhooks/signature[/...]
// =============================================

func TestCreateWebhook(t *testing.T) {
	t.Run("injects signature name and unwraps envelope", func(t *testing.T) {
		var capturedBody map[string]interface{}
		var capturedPath string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedPath = r.URL.Path
			body, _ := io.ReadAll(r.Body)
			_ = json.Unmarshal(body, &capturedBody)
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(201)
			w.Write([]byte(`{"data":{"id":"wh-1","secret":"whsec_abc123"},"message":"Webhook created successfully."}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		result, err := client.CreateWebhook(context.Background(), CreateWebhookRequest{
			URLs:   []string{"https://example.com/sink"},
			Events: []string{"signature.document.completed"},
		})

		require.NoError(t, err)
		assert.Equal(t, "/api/webhooks", capturedPath)
		assert.Equal(t, "signature", capturedBody["name"])
		assert.Equal(t, "wh-1", result.ID)
		assert.Equal(t, "whsec_abc123", result.Secret)
	})
}

func TestGetWebhook(t *testing.T) {
	t.Run("hits signature path and returns body", func(t *testing.T) {
		var capturedMethod, capturedPath string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedMethod = r.Method
			capturedPath = r.URL.Path
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"id":"wh-1","name":"signature","deliveryStats":{"totalDeliveries":0},"availableEvents":["signature.document.completed"]}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		result, err := client.GetWebhook(context.Background())

		require.NoError(t, err)
		assert.Equal(t, "GET", capturedMethod)
		assert.Equal(t, "/api/webhooks/signature", capturedPath)
		assert.Equal(t, "signature", result["name"])
		stats := result["deliveryStats"].(map[string]interface{})
		assert.Equal(t, float64(0), stats["totalDeliveries"])
	})
}

func TestUpdateWebhook(t *testing.T) {
	t.Run("patches signature path and unwraps envelope", func(t *testing.T) {
		var capturedMethod, capturedPath string
		var capturedBody map[string]interface{}

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedMethod = r.Method
			capturedPath = r.URL.Path
			body, _ := io.ReadAll(r.Body)
			_ = json.Unmarshal(body, &capturedBody)
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"data":{"id":"wh-1","isActive":false},"message":"Webhook updated successfully"}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		isActive := false
		result, err := client.UpdateWebhook(context.Background(), UpdateWebhookRequest{IsActive: &isActive})

		require.NoError(t, err)
		assert.Equal(t, "PATCH", capturedMethod)
		assert.Equal(t, "/api/webhooks/signature", capturedPath)
		assert.Equal(t, false, capturedBody["isActive"])
		// Renames are not supported — no `name` field should ever be sent.
		_, hasName := capturedBody["name"]
		assert.False(t, hasName, "update body must not contain a name field")
		assert.Equal(t, false, result["isActive"])
	})
}

func TestDeleteWebhook(t *testing.T) {
	t.Run("deletes signature path", func(t *testing.T) {
		var capturedMethod, capturedPath string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedMethod = r.Method
			capturedPath = r.URL.Path
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"message":"Webhook deleted successfully"}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		result, err := client.DeleteWebhook(context.Background())

		require.NoError(t, err)
		assert.Equal(t, "DELETE", capturedMethod)
		assert.Equal(t, "/api/webhooks/signature", capturedPath)
		assert.Contains(t, result["message"].(string), "deleted")
	})
}

// =============================================
// TEST / NOTIFY
// =============================================

func TestTestWebhook(t *testing.T) {
	t.Run("posts to test endpoint and unwraps", func(t *testing.T) {
		var capturedPath string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedPath = r.URL.Path
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"data":{"deliveries":[],"summary":{"total":1,"successful":1,"failed":0}},"message":"Test webhook sent successfully to all URLs"}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		result, err := client.TestWebhook(context.Background(), TestWebhookRequest{
			EventType: "signature.document.completed",
			Payload:   map[string]interface{}{"documentId": "doc-1"},
		})

		require.NoError(t, err)
		assert.Equal(t, "/api/webhooks/signature/test", capturedPath)
		summary := result["summary"].(map[string]interface{})
		assert.Equal(t, float64(1), summary["successful"])
	})
}

func TestNotifyWebhook(t *testing.T) {
	t.Run("posts to notify endpoint", func(t *testing.T) {
		var capturedPath string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedPath = r.URL.Path
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"data":{"deliveries":[],"summary":{"total":1,"successful":1,"failed":0}},"message":"Manual notification sent successfully to all URLs"}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		_, err := client.NotifyWebhook(context.Background(), TestWebhookRequest{
			EventType: "signature.document.completed",
			Payload:   map[string]interface{}{"documentId": "doc-2"},
		})

		require.NoError(t, err)
		assert.Equal(t, "/api/webhooks/signature/notify", capturedPath)
	})
}

// =============================================
// DELIVERIES + REPLAY
// =============================================

func TestListWebhookDeliveries(t *testing.T) {
	t.Run("builds query string from filters", func(t *testing.T) {
		var capturedRawPath string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedRawPath = r.URL.RequestURI()
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"results":[],"totalRecords":0,"limit":10,"offset":0}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		limit := 10
		isDelivered := false
		_, err := client.ListWebhookDeliveries(context.Background(), ListDeliveriesRequest{
			Limit:       &limit,
			IsDelivered: &isDelivered,
		})

		require.NoError(t, err)
		assert.True(t, strings.HasPrefix(capturedRawPath, "/api/webhooks/signature/deliveries?"),
			"unexpected path: %s", capturedRawPath)
		assert.Contains(t, capturedRawPath, "limit=10")
		assert.Contains(t, capturedRawPath, "isDelivered=false")
	})
}

func TestReplayWebhookDelivery(t *testing.T) {
	t.Run("posts to replay path with deliveryId", func(t *testing.T) {
		var capturedPath string
		var capturedBody map[string]interface{}

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedPath = r.URL.Path
			body, _ := io.ReadAll(r.Body)
			_ = json.Unmarshal(body, &capturedBody)
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"data":{"id":"delivery-1","httpStatus":200,"message":"Delivery replayed"},"message":"Delivery replayed"}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		result, err := client.ReplayWebhookDelivery(context.Background(), "delivery-1")

		require.NoError(t, err)
		assert.Equal(t, "/api/webhooks/signature/replay", capturedPath)
		assert.Equal(t, "delivery-1", capturedBody["deliveryId"])
		assert.Equal(t, float64(200), result["httpStatus"])
	})
}

// =============================================
// SECRET ROTATION + STATS
// =============================================

func TestRegenerateWebhookSecret(t *testing.T) {
	t.Run("posts and unwraps envelope", func(t *testing.T) {
		var capturedPath string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedPath = r.URL.Path
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"data":{"id":"wh-1","secret":"whsec_newRotated","regeneratedAt":"2026-05-13T12:00:00Z"},"message":"Webhook secret regenerated successfully."}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		result, err := client.RegenerateWebhookSecret(context.Background())

		require.NoError(t, err)
		assert.Equal(t, "/api/webhooks/signature/regenerate", capturedPath)
		assert.Equal(t, "whsec_newRotated", result["secret"])
	})
}

func TestGetWebhookStats(t *testing.T) {
	t.Run("passes days query when > 0", func(t *testing.T) {
		var capturedRawPath string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedRawPath = r.URL.RequestURI()
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"summary":{"totalDeliveries":100,"successRate":95},"eventBreakdown":[]}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		_, err := client.GetWebhookStats(context.Background(), 7)

		require.NoError(t, err)
		assert.Equal(t, "/api/webhooks/signature/stats?days=7", capturedRawPath)
	})

	t.Run("omits days query when 0", func(t *testing.T) {
		var capturedRawPath string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedRawPath = r.URL.RequestURI()
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"summary":{}}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		_, err := client.GetWebhookStats(context.Background(), 0)

		require.NoError(t, err)
		assert.Equal(t, "/api/webhooks/signature/stats", capturedRawPath)
	})
}

// =============================================
// Error propagation
// =============================================

func TestWebhooksErrorPropagation(t *testing.T) {
	t.Run("403 propagates AuthorizationError", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(403)
			w.Write([]byte(`{"message":"Forbidden"}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		_, err := client.GetWebhook(context.Background())
		require.Error(t, err)
		_, ok := err.(*AuthorizationError)
		require.True(t, ok, "expected AuthorizationError, got %T", err)
	})

	t.Run("401 propagates AuthenticationError", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(401)
			w.Write([]byte(`{"message":"Invalid API key"}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		_, err := client.GetWebhook(context.Background())
		_, ok := err.(*AuthenticationError)
		require.True(t, ok, "expected AuthenticationError, got %T", err)
	})

	t.Run("404 propagates NotFoundError", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(404)
			w.Write([]byte(`{"message":"Webhook not found"}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		_, err := client.GetWebhook(context.Background())
		_, ok := err.(*NotFoundError)
		require.True(t, ok, "expected NotFoundError, got %T", err)
	})

	t.Run("409 on CreateWebhook propagates ConflictError", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(409)
			w.Write([]byte(`{"message":"Webhook with name 'signature' already exists"}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		_, err := client.CreateWebhook(context.Background(), CreateWebhookRequest{
			URLs:   []string{"https://example.com/sink"},
			Events: []string{"signature.document.completed"},
		})
		require.Error(t, err)
		ce, ok := err.(*ConflictError)
		require.True(t, ok, "expected ConflictError, got %T", err)
		assert.Equal(t, 409, ce.StatusCode)
		assert.Contains(t, ce.Message, "already exists")
	})

	t.Run("409 on UpdateWebhook propagates ConflictError", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(409)
			w.Write([]byte(`{"message":"Webhook name conflict"}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		isActive := true
		_, err := client.UpdateWebhook(context.Background(), UpdateWebhookRequest{IsActive: &isActive})
		require.Error(t, err)
		_, ok := err.(*ConflictError)
		require.True(t, ok, "expected ConflictError, got %T", err)
	})

	t.Run("400 propagates ValidationError", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(400)
			w.Write([]byte(`{"message":"All webhook URLs must use HTTPS"}`))
		}))
		defer server.Close()

		client := newTestWebhooksClient(t, server.URL)
		_, err := client.CreateWebhook(context.Background(), CreateWebhookRequest{
			URLs:   []string{"http://insecure.example.com"},
			Events: []string{"signature.document.completed"},
		})
		_, ok := err.(*ValidationError)
		require.True(t, ok, "expected ValidationError, got %T", err)
	})
}

// =========================================================================
// Webhook Events
// =========================================================================

// TestAllWebhookEvents is a drift guard: if the backend adds an event,
// AllWebhookEvents must grow with it.
func TestAllWebhookEvents(t *testing.T) {
	expected := []string{
		"signature.document.sent",
		"signature.document.viewed",
		"signature.document.recipient_signed",
		"signature.document.signed",
		"signature.document.completed",
		"signature.document.finalization_failed",
		"signature.document.voided",
	}

	assert.Len(t, AllWebhookEvents, 7)
	assert.Equal(t, expected, WebhookEventStrings(AllWebhookEvents...))

	// Each named constant maps to its wire string.
	assert.Equal(t, "signature.document.sent", WebhookEventSent.String())
	assert.Equal(t, "signature.document.viewed", WebhookEventViewed.String())
	assert.Equal(t, "signature.document.recipient_signed", WebhookEventRecipientSigned.String())
	assert.Equal(t, "signature.document.signed", WebhookEventSigned.String())
	assert.Equal(t, "signature.document.completed", WebhookEventCompleted.String())
	assert.Equal(t, "signature.document.finalization_failed", WebhookEventFinalizationFailed.String())
	assert.Equal(t, "signature.document.voided", WebhookEventVoided.String())
}

// TestCreateWebhookAcceptsRawEventStrings pins the non-breaking contract:
// Events is []string, so an event the SDK has never heard of is sent verbatim.
func TestCreateWebhookAcceptsRawEventStrings(t *testing.T) {
	var body map[string]interface{}
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		raw, _ := io.ReadAll(r.Body)
		require.NoError(t, json.Unmarshal(raw, &body))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_, _ = w.Write([]byte(`{"data":{"id":"wh-1","secret":"whsec_abc"},"message":"ok"}`))
	}))
	defer server.Close()

	client := newTestWebhooksClient(t, server.URL)
	_, err := client.CreateWebhook(context.Background(), CreateWebhookRequest{
		URLs:   []string{"https://example.com/hook"},
		Events: []string{"signature.document.some_future_event"},
	})
	require.NoError(t, err)

	assert.Equal(t, []interface{}{"signature.document.some_future_event"}, body["events"])
}
