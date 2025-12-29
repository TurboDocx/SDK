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
		client, err := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "test@example.com",
		})
		require.NoError(t, err)
		assert.NotNil(t, client)
		assert.NotNil(t, client.TurboSign)
	})

	t.Run("with custom base URL", func(t *testing.T) {
		client, err := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     "https://custom-api.example.com",
			SenderEmail: "test@example.com",
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
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
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
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
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
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
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
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
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
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
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
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
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
			"status": "pending",
		})
	}))
	defer server.Close()

	client, _ := NewClientWithConfig(ClientConfig{
		APIKey:      "test-api-key",
		OrgID:       "test-org-id",
		BaseURL:     server.URL,
		SenderEmail: "test@example.com",
	})

	result, err := client.TurboSign.GetStatus(context.Background(), "doc-123")

	require.NoError(t, err)
	assert.Equal(t, "pending", result.Status)
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
		APIKey:      "test-api-key",
		OrgID:       "test-org-id",
		BaseURL:     server.URL,
		SenderEmail: "test@example.com",
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
		// Backend returns empty response, SDK sets success/message manually
		json.NewEncoder(w).Encode(map[string]interface{}{})
	}))
	defer server.Close()

	client, _ := NewClientWithConfig(ClientConfig{
		APIKey:      "test-api-key",
		OrgID:       "test-org-id",
		BaseURL:     server.URL,
		SenderEmail: "test@example.com",
	})

	result, err := client.TurboSign.VoidDocument(context.Background(), "doc-123", "Document needs revision")

	require.NoError(t, err)
	assert.True(t, result.Success)
	assert.Equal(t, "Document has been voided successfully", result.Message)
}

func TestTurboSignClient_ResendEmail(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/turbosign/documents/doc-123/resend-email", r.URL.Path)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":        true,
			"recipientCount": 2,
		})
	}))
	defer server.Close()

	client, _ := NewClientWithConfig(ClientConfig{
		APIKey:      "test-api-key",
		OrgID:       "test-org-id",
		BaseURL:     server.URL,
		SenderEmail: "test@example.com",
	})

	result, err := client.TurboSign.ResendEmail(context.Background(), "doc-123", []string{"rec-1", "rec-2"})

	require.NoError(t, err)
	assert.True(t, result.Success)
	assert.Equal(t, 2, result.RecipientCount)
}

func TestTurboSignClient_GetAuditTrail(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/turbosign/documents/doc-123/audit-trail", r.URL.Path)
		assert.Equal(t, "GET", r.Method)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"document": map[string]interface{}{
				"id":   "doc-123",
				"name": "Test Document",
			},
			"auditTrail": []map[string]interface{}{
				{
					"id":         "audit-1",
					"documentId": "doc-123",
					"actionType": "document_created",
					"timestamp":  "2024-01-01T00:00:00Z",
				},
				{
					"id":         "audit-2",
					"documentId": "doc-123",
					"actionType": "email_sent",
					"timestamp":  "2024-01-01T00:01:00Z",
					"details": map[string]interface{}{
						"recipientEmail": "signer@example.com",
					},
				},
			},
		})
	}))
	defer server.Close()

	client, _ := NewClientWithConfig(ClientConfig{
		APIKey:      "test-api-key",
		OrgID:       "test-org-id",
		BaseURL:     server.URL,
		SenderEmail: "test@example.com",
	})

	result, err := client.TurboSign.GetAuditTrail(context.Background(), "doc-123")

	require.NoError(t, err)
	assert.Equal(t, "doc-123", result.Document.ID)
	assert.Equal(t, "Test Document", result.Document.Name)
	assert.Len(t, result.AuditTrail, 2)
	assert.Equal(t, "document_created", result.AuditTrail[0].ActionType)
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
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
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

		client, err := NewClientWithConfig(ClientConfig{
			APIKey:      "invalid-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})
		require.NoError(t, err, "client creation should not fail")

		_, err = client.TurboSign.GetStatus(context.Background(), "doc-123")

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
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
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
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			BaseURL:     server.URL,
			SenderEmail: "test@example.com",
		})

		_, err := client.TurboSign.GetStatus(context.Background(), "doc-123")

		require.Error(t, err)
		rateLimitErr, ok := err.(*RateLimitError)
		require.True(t, ok, "expected RateLimitError")
		assert.Equal(t, 429, rateLimitErr.StatusCode)
	})
}
