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

func TestClient_Configure(t *testing.T) {
	t.Run("with API key", func(t *testing.T) {
		client := NewClient("test-api-key")
		assert.NotNil(t, client)
		assert.NotNil(t, client.TurboSign)
	})

	t.Run("with custom base URL", func(t *testing.T) {
		client := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			BaseURL: "https://custom-api.example.com",
		})
		assert.NotNil(t, client)
	})

	t.Run("with access token", func(t *testing.T) {
		client := NewClientWithConfig(ClientConfig{
			AccessToken: "test-access-token",
		})
		assert.NotNil(t, client)
	})
}

func TestTurboSignClient_PrepareForReview(t *testing.T) {
	t.Run("with file URL", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/turbosign/single/prepare-for-review", r.URL.Path)
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "test-api-key", r.Header.Get("X-API-Key"))

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"data": map[string]interface{}{
					"documentId": "doc-123",
					"status":     "review_ready",
					"previewUrl": "https://preview.example.com/doc-123",
				},
			})
		}))
		defer server.Close()

		client := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			BaseURL: server.URL,
		})

		result, err := client.TurboSign.PrepareForReview(context.Background(), &PrepareForReviewRequest{
			FileLink: "https://storage.example.com/contract.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", Order: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "doc-123", result.DocumentID)
		assert.Equal(t, "review_ready", result.Status)
		assert.Equal(t, "https://preview.example.com/doc-123", result.PreviewURL)
	})

	t.Run("with deliverable ID", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"data": map[string]interface{}{
					"documentId": "doc-456",
					"status":     "review_ready",
				},
			})
		}))
		defer server.Close()

		client := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			BaseURL: server.URL,
		})

		result, err := client.TurboSign.PrepareForReview(context.Background(), &PrepareForReviewRequest{
			DeliverableID: "deliverable-abc",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", Order: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "doc-456", result.DocumentID)
	})

	t.Run("with optional fields", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"data": map[string]interface{}{
					"documentId": "doc-789",
					"status":     "review_ready",
				},
			})
		}))
		defer server.Close()

		client := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			BaseURL: server.URL,
		})

		result, err := client.TurboSign.PrepareForReview(context.Background(), &PrepareForReviewRequest{
			FileLink: "https://example.com/doc.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", Order: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1},
			},
			DocumentName:        "Test Contract",
			DocumentDescription: "A test contract",
			SenderName:          "Sales Team",
			SenderEmail:         "sales@company.com",
			CCEmails:            []string{"admin@company.com", "legal@company.com"},
		})

		require.NoError(t, err)
		assert.Equal(t, "doc-789", result.DocumentID)
	})

	t.Run("with template ID", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"data": map[string]interface{}{
					"documentId": "doc-template",
					"status":     "review_ready",
				},
			})
		}))
		defer server.Close()

		client := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			BaseURL: server.URL,
		})

		result, err := client.TurboSign.PrepareForReview(context.Background(), &PrepareForReviewRequest{
			TemplateID: "template-xyz",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", Order: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "doc-template", result.DocumentID)
	})

	t.Run("with file upload", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Contains(t, r.Header.Get("Content-Type"), "multipart/form-data")
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"data": map[string]interface{}{
					"documentId": "doc-upload",
					"status":     "review_ready",
				},
			})
		}))
		defer server.Close()

		client := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			BaseURL: server.URL,
		})

		result, err := client.TurboSign.PrepareForReview(context.Background(), &PrepareForReviewRequest{
			File:     []byte("%PDF-mock-content"),
			FileName: "contract.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", Order: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "doc-upload", result.DocumentID)
	})
}

func TestTurboSignClient_PrepareForSigningSingle(t *testing.T) {
	t.Run("should prepare and send", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/turbosign/single/prepare-for-signing", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"data": map[string]interface{}{
					"documentId": "doc-123",
					"status":     "sent",
					"recipients": []map[string]interface{}{
						{
							"id":      "rec-1",
							"name":    "John Doe",
							"email":   "john@example.com",
							"status":  "pending",
							"signUrl": "https://sign.example.com/rec-1",
						},
					},
				},
			})
		}))
		defer server.Close()

		client := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			BaseURL: server.URL,
		})

		result, err := client.TurboSign.PrepareForSigningSingle(context.Background(), &PrepareForSigningRequest{
			FileLink: "https://storage.example.com/contract.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", Order: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "doc-123", result.DocumentID)
		assert.Equal(t, "sent", result.Status)
		assert.Len(t, result.Recipients, 1)
		assert.Equal(t, "https://sign.example.com/rec-1", result.Recipients[0].SignURL)
	})

	t.Run("with file upload", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Contains(t, r.Header.Get("Content-Type"), "multipart/form-data")
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"data": map[string]interface{}{
					"documentId": "doc-upload",
					"status":     "sent",
				},
			})
		}))
		defer server.Close()

		client := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			BaseURL: server.URL,
		})

		result, err := client.TurboSign.PrepareForSigningSingle(context.Background(), &PrepareForSigningRequest{
			File:     []byte("%PDF-mock-content"),
			FileName: "contract.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", Order: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientOrder: 1},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "doc-upload", result.DocumentID)
	})
}

func TestTurboSignClient_GetStatus(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/turbosign/documents/doc-123/status", r.URL.Path)
		assert.Equal(t, "GET", r.Method)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"data": map[string]interface{}{
				"documentId": "doc-123",
				"status":     "pending",
				"name":       "Test Document",
				"recipients": []map[string]interface{}{
					{
						"id":     "rec-1",
						"name":   "John Doe",
						"email":  "john@example.com",
						"status": "pending",
					},
				},
				"createdAt": "2024-01-01T00:00:00Z",
				"updatedAt": "2024-01-01T00:00:00Z",
			},
		})
	}))
	defer server.Close()

	client := NewClientWithConfig(ClientConfig{
		APIKey:  "test-api-key",
		BaseURL: server.URL,
	})

	result, err := client.TurboSign.GetStatus(context.Background(), "doc-123")

	require.NoError(t, err)
	assert.Equal(t, "doc-123", result.DocumentID)
	assert.Equal(t, "pending", result.Status)
	assert.Equal(t, "Test Document", result.Name)
}

func TestTurboSignClient_Download(t *testing.T) {
	expectedContent := []byte("%PDF-mock-content")

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/turbosign/documents/doc-123/download", r.URL.Path)
		w.Write(expectedContent)
	}))
	defer server.Close()

	client := NewClientWithConfig(ClientConfig{
		APIKey:  "test-api-key",
		BaseURL: server.URL,
	})

	result, err := client.TurboSign.Download(context.Background(), "doc-123")

	require.NoError(t, err)
	assert.Equal(t, expectedContent, result)
}

func TestTurboSignClient_VoidDocument(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/turbosign/documents/doc-123/void", r.URL.Path)
		assert.Equal(t, "POST", r.Method)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"data": map[string]interface{}{
				"documentId": "doc-123",
				"status":     "voided",
				"voidedAt":   "2024-01-01T12:00:00Z",
			},
		})
	}))
	defer server.Close()

	client := NewClientWithConfig(ClientConfig{
		APIKey:  "test-api-key",
		BaseURL: server.URL,
	})

	result, err := client.TurboSign.VoidDocument(context.Background(), "doc-123", "Document needs revision")

	require.NoError(t, err)
	assert.Equal(t, "doc-123", result.DocumentID)
	assert.Equal(t, "voided", result.Status)
}

func TestTurboSignClient_ResendEmail(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/turbosign/documents/doc-123/resend-email", r.URL.Path)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"data": map[string]interface{}{
				"documentId": "doc-123",
				"message":    "Emails resent successfully",
				"resentAt":   "2024-01-01T12:00:00Z",
			},
		})
	}))
	defer server.Close()

	client := NewClientWithConfig(ClientConfig{
		APIKey:  "test-api-key",
		BaseURL: server.URL,
	})

	result, err := client.TurboSign.ResendEmail(context.Background(), "doc-123", []string{"rec-1", "rec-2"})

	require.NoError(t, err)
	assert.Contains(t, result.Message, "resent")
}

func TestClient_ErrorHandling(t *testing.T) {
	t.Run("API error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Document not found",
				"code":    "DOCUMENT_NOT_FOUND",
			})
		}))
		defer server.Close()

		client := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			BaseURL: server.URL,
		})

		_, err := client.TurboSign.GetStatus(context.Background(), "invalid-doc")

		require.Error(t, err)
		apiErr, ok := err.(*TurboDocxError)
		require.True(t, ok)
		assert.Equal(t, 404, apiErr.StatusCode)
		assert.Equal(t, "Document not found", apiErr.Message)
		assert.Equal(t, "DOCUMENT_NOT_FOUND", apiErr.Code)
	})

	t.Run("authentication error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Invalid API key",
			})
		}))
		defer server.Close()

		client := NewClientWithConfig(ClientConfig{
			APIKey:  "invalid-key",
			BaseURL: server.URL,
		})

		_, err := client.TurboSign.GetStatus(context.Background(), "doc-123")

		require.Error(t, err)
		apiErr, ok := err.(*TurboDocxError)
		require.True(t, ok)
		assert.Equal(t, 401, apiErr.StatusCode)
	})

	t.Run("validation error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusBadRequest)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Validation failed: Invalid email format",
				"code":    "VALIDATION_ERROR",
			})
		}))
		defer server.Close()

		client := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			BaseURL: server.URL,
		})

		_, err := client.TurboSign.PrepareForSigningSingle(context.Background(), &PrepareForSigningRequest{
			FileLink: "https://example.com/doc.pdf",
			Recipients: []Recipient{
				{Name: "Test", Email: "invalid-email", Order: 1},
			},
			Fields: []Field{},
		})

		require.Error(t, err)
		apiErr, ok := err.(*TurboDocxError)
		require.True(t, ok)
		assert.Equal(t, 400, apiErr.StatusCode)
		assert.Contains(t, apiErr.Message, "Validation")
	})
}
