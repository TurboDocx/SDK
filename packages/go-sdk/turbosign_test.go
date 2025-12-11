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
	t.Run("with API key and org ID", func(t *testing.T) {
		client, err := NewClient("test-api-key", "test-org-id")
		require.NoError(t, err)
		assert.NotNil(t, client)
		assert.NotNil(t, client.TurboSign)
	})

	t.Run("with custom base URL", func(t *testing.T) {
		client, err := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			OrgID:   "test-org-id",
			BaseURL: "https://custom-api.example.com",
		})
		require.NoError(t, err)
		assert.NotNil(t, client)
	})

	t.Run("requires org ID", func(t *testing.T) {
		_, err := NewClientWithConfig(ClientConfig{
			APIKey: "test-api-key",
		})
		require.Error(t, err)
		_, ok := err.(*AuthenticationError)
		assert.True(t, ok, "expected AuthenticationError")
	})

	t.Run("requires API key or access token", func(t *testing.T) {
		_, err := NewClientWithConfig(ClientConfig{
			OrgID: "test-org-id",
		})
		require.Error(t, err)
	})
}

func TestTurboSignClient_CreateSignatureReviewLink(t *testing.T) {
	t.Run("with file URL", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/turbosign/single/prepare-for-review", r.URL.Path)
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "Bearer test-api-key", r.Header.Get("Authorization"))
			assert.Equal(t, "test-org-id", r.Header.Get("x-rapiddocx-org-id"))

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":    true,
				"documentId": "doc-123",
				"status":     "review_ready",
				"previewUrl": "https://preview.example.com/doc-123",
				"message":    "Document prepared for review",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			OrgID:   "test-org-id",
			BaseURL: server.URL,
		})

		result, err := client.TurboSign.CreateSignatureReviewLink(context.Background(), &CreateSignatureReviewLinkRequest{
			FileLink: "https://storage.example.com/contract.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
			},
		})

		require.NoError(t, err)
		assert.True(t, result.Success)
		assert.Equal(t, "doc-123", result.DocumentID)
		assert.Equal(t, "review_ready", result.Status)
		assert.Equal(t, "https://preview.example.com/doc-123", result.PreviewURL)
	})

	t.Run("with deliverable ID", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":    true,
				"documentId": "doc-456",
				"status":     "review_ready",
				"message":    "Document prepared for review",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			OrgID:   "test-org-id",
			BaseURL: server.URL,
		})

		result, err := client.TurboSign.CreateSignatureReviewLink(context.Background(), &CreateSignatureReviewLinkRequest{
			DeliverableID: "deliverable-abc",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "doc-456", result.DocumentID)
	})

	t.Run("with template ID", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":    true,
				"documentId": "doc-template",
				"status":     "review_ready",
				"message":    "Document prepared for review",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			OrgID:   "test-org-id",
			BaseURL: server.URL,
		})

		result, err := client.TurboSign.CreateSignatureReviewLink(context.Background(), &CreateSignatureReviewLinkRequest{
			TemplateID: "template-xyz",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
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
				"success":    true,
				"documentId": "doc-upload",
				"status":     "review_ready",
				"message":    "Document prepared for review",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			OrgID:   "test-org-id",
			BaseURL: server.URL,
		})

		result, err := client.TurboSign.CreateSignatureReviewLink(context.Background(), &CreateSignatureReviewLinkRequest{
			File:     []byte("%PDF-mock-content"),
			FileName: "contract.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "doc-upload", result.DocumentID)
	})
}

func TestTurboSignClient_SendSignature(t *testing.T) {
	t.Run("should prepare and send", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/turbosign/single/prepare-for-signing", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":    true,
				"documentId": "doc-123",
				"message":    "Document sent for signing",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			OrgID:   "test-org-id",
			BaseURL: server.URL,
		})

		result, err := client.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{
			FileLink: "https://storage.example.com/contract.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
			},
		})

		require.NoError(t, err)
		assert.True(t, result.Success)
		assert.Equal(t, "doc-123", result.DocumentID)
	})

	t.Run("with file upload", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Contains(t, r.Header.Get("Content-Type"), "multipart/form-data")
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":    true,
				"documentId": "doc-upload",
				"message":    "Document sent for signing",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			OrgID:   "test-org-id",
			BaseURL: server.URL,
		})

		result, err := client.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{
			File:     []byte("%PDF-mock-content"),
			FileName: "contract.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
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
		})
	}))
	defer server.Close()

	client, _ := NewClientWithConfig(ClientConfig{
		APIKey:  "test-api-key",
		OrgID:   "test-org-id",
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
	presignedURL := ""

	// S3 server
	s3Server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Write(expectedContent)
	}))
	defer s3Server.Close()

	presignedURL = s3Server.URL + "/signed-doc.pdf"

	// API server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/turbosign/documents/doc-123/download", r.URL.Path)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"downloadUrl": presignedURL,
			"fileName":    "signed-document.pdf",
		})
	}))
	defer server.Close()

	client, _ := NewClientWithConfig(ClientConfig{
		APIKey:  "test-api-key",
		OrgID:   "test-org-id",
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
			"documentId": "doc-123",
			"status":     "voided",
			"voidedAt":   "2024-01-01T12:00:00Z",
		})
	}))
	defer server.Close()

	client, _ := NewClientWithConfig(ClientConfig{
		APIKey:  "test-api-key",
		OrgID:   "test-org-id",
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
			"documentId": "doc-123",
			"message":    "Emails resent successfully",
			"resentAt":   "2024-01-01T12:00:00Z",
		})
	}))
	defer server.Close()

	client, _ := NewClientWithConfig(ClientConfig{
		APIKey:  "test-api-key",
		OrgID:   "test-org-id",
		BaseURL: server.URL,
	})

	result, err := client.TurboSign.ResendEmail(context.Background(), "doc-123", []string{"rec-1", "rec-2"})

	require.NoError(t, err)
	assert.Contains(t, result.Message, "resent")
}

func TestTurboSignClient_GetAuditTrail(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/turbosign/documents/doc-123/audit-trail", r.URL.Path)
		assert.Equal(t, "GET", r.Method)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"documentId": "doc-123",
			"entries": []map[string]interface{}{
				{
					"event":     "document_created",
					"actor":     "user@example.com",
					"timestamp": "2024-01-01T00:00:00Z",
					"ipAddress": "192.168.1.1",
				},
				{
					"event":     "email_sent",
					"actor":     "system",
					"timestamp": "2024-01-01T00:01:00Z",
					"details": map[string]interface{}{
						"recipientEmail": "signer@example.com",
					},
				},
			},
		})
	}))
	defer server.Close()

	client, _ := NewClientWithConfig(ClientConfig{
		APIKey:  "test-api-key",
		OrgID:   "test-org-id",
		BaseURL: server.URL,
	})

	result, err := client.TurboSign.GetAuditTrail(context.Background(), "doc-123")

	require.NoError(t, err)
	assert.Equal(t, "doc-123", result.DocumentID)
	assert.Len(t, result.Entries, 2)
	assert.Equal(t, "document_created", result.Entries[0].Event)
}

func TestClient_ErrorHandling(t *testing.T) {
	t.Run("not found error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusNotFound)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Document not found",
				"code":    "DOCUMENT_NOT_FOUND",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			OrgID:   "test-org-id",
			BaseURL: server.URL,
		})

		_, err := client.TurboSign.GetStatus(context.Background(), "invalid-doc")

		require.Error(t, err)
		notFoundErr, ok := err.(*NotFoundError)
		require.True(t, ok, "expected NotFoundError")
		assert.Equal(t, 404, notFoundErr.StatusCode)
		assert.Equal(t, "Document not found", notFoundErr.Message)
	})

	t.Run("authentication error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusUnauthorized)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Invalid API key",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:  "invalid-key",
			OrgID:   "test-org-id",
			BaseURL: server.URL,
		})

		_, err := client.TurboSign.GetStatus(context.Background(), "doc-123")

		require.Error(t, err)
		authErr, ok := err.(*AuthenticationError)
		require.True(t, ok, "expected AuthenticationError")
		assert.Equal(t, 401, authErr.StatusCode)
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

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			OrgID:   "test-org-id",
			BaseURL: server.URL,
		})

		_, err := client.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{
			FileLink: "https://example.com/doc.pdf",
			Recipients: []Recipient{
				{Name: "Test", Email: "invalid-email", SigningOrder: 1},
			},
			Fields: []Field{},
		})

		require.Error(t, err)
		validationErr, ok := err.(*ValidationError)
		require.True(t, ok, "expected ValidationError")
		assert.Equal(t, 400, validationErr.StatusCode)
		assert.Contains(t, validationErr.Message, "Validation")
	})

	t.Run("rate limit error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusTooManyRequests)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"message": "Rate limit exceeded",
				"code":    "RATE_LIMIT_EXCEEDED",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:  "test-api-key",
			OrgID:   "test-org-id",
			BaseURL: server.URL,
		})

		_, err := client.TurboSign.GetStatus(context.Background(), "doc-123")

		require.Error(t, err)
		rateLimitErr, ok := err.(*RateLimitError)
		require.True(t, ok, "expected RateLimitError")
		assert.Equal(t, 429, rateLimitErr.StatusCode)
	})
}
