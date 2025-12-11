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

// Helper function to parse form data from request
func parseFormData(t *testing.T, r *http.Request) map[string]string {
	contentType := r.Header.Get("Content-Type")
	formData := make(map[string]string)

	if strings.Contains(contentType, "multipart/form-data") {
		err := r.ParseMultipartForm(10 << 20) // 10MB max
		require.NoError(t, err)
		for key, values := range r.MultipartForm.Value {
			if len(values) > 0 {
				formData[key] = values[0]
			}
		}
	} else if strings.Contains(contentType, "application/json") {
		body, err := io.ReadAll(r.Body)
		require.NoError(t, err)
		var jsonData map[string]interface{}
		err = json.Unmarshal(body, &jsonData)
		require.NoError(t, err)
		for key, value := range jsonData {
			if str, ok := value.(string); ok {
				formData[key] = str
			}
		}
	}

	return formData
}

// Tests for CreateSignatureReviewLink with configured sender
func TestTurboSign_CreateSignatureReviewLink_ConfiguredSender(t *testing.T) {
	t.Run("should use configured senderEmail when not provided in request", func(t *testing.T) {
		var capturedFormData map[string]string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedFormData = parseFormData(t, r)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":    true,
				"documentId": "doc-123",
				"status":     "review_ready",
				"message":    "Document prepared",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "configured@company.com",
			SenderName:  "Configured Support",
			BaseURL:     server.URL,
		})

		_, err := client.TurboSign.CreateSignatureReviewLink(context.Background(), &CreateSignatureReviewLinkRequest{
			FileLink: "https://example.com/doc.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
			},
			// senderEmail and senderName NOT provided
		})

		require.NoError(t, err)
		assert.Equal(t, "configured@company.com", capturedFormData["senderEmail"])
		assert.Equal(t, "Configured Support", capturedFormData["senderName"])
	})

	t.Run("should use configured senderEmail only when senderName not configured", func(t *testing.T) {
		var capturedFormData map[string]string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedFormData = parseFormData(t, r)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":    true,
				"documentId": "doc-123",
				"status":     "review_ready",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "configured@company.com",
			// senderName NOT configured
			BaseURL: server.URL,
		})

		_, err := client.TurboSign.CreateSignatureReviewLink(context.Background(), &CreateSignatureReviewLinkRequest{
			FileLink: "https://example.com/doc.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "configured@company.com", capturedFormData["senderEmail"])
		_, hasSenderName := capturedFormData["senderName"]
		assert.False(t, hasSenderName, "senderName should not be in form data when not configured")
	})

	t.Run("should override configured sender with request-level sender", func(t *testing.T) {
		var capturedFormData map[string]string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedFormData = parseFormData(t, r)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":    true,
				"documentId": "doc-123",
				"status":     "review_ready",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "configured@company.com",
			SenderName:  "Configured Support",
			BaseURL:     server.URL,
		})

		_, err := client.TurboSign.CreateSignatureReviewLink(context.Background(), &CreateSignatureReviewLinkRequest{
			FileLink: "https://example.com/doc.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
			},
			SenderEmail: "override@company.com",
			SenderName:  "Override Support",
		})

		require.NoError(t, err)
		assert.Equal(t, "override@company.com", capturedFormData["senderEmail"])
		assert.Equal(t, "Override Support", capturedFormData["senderName"])
	})

	t.Run("should partially override - use request senderEmail but configured senderName", func(t *testing.T) {
		var capturedFormData map[string]string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedFormData = parseFormData(t, r)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":    true,
				"documentId": "doc-123",
				"status":     "review_ready",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "configured@company.com",
			SenderName:  "Configured Support",
			BaseURL:     server.URL,
		})

		_, err := client.TurboSign.CreateSignatureReviewLink(context.Background(), &CreateSignatureReviewLinkRequest{
			FileLink: "https://example.com/doc.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
			},
			SenderEmail: "override@company.com",
			// senderName NOT provided - should use configured value
		})

		require.NoError(t, err)
		assert.Equal(t, "override@company.com", capturedFormData["senderEmail"])
		assert.Equal(t, "Configured Support", capturedFormData["senderName"])
	})
}

// Tests for SendSignature with configured sender
func TestTurboSign_SendSignature_ConfiguredSender(t *testing.T) {
	t.Run("should use configured senderEmail and senderName", func(t *testing.T) {
		var capturedFormData map[string]string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedFormData = parseFormData(t, r)

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
			SenderEmail: "configured@company.com",
			SenderName:  "Configured Support",
			BaseURL:     server.URL,
		})

		_, err := client.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{
			FileLink: "https://example.com/doc.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "configured@company.com", capturedFormData["senderEmail"])
		assert.Equal(t, "Configured Support", capturedFormData["senderName"])
	})

	t.Run("should allow request-level override in sendSignature", func(t *testing.T) {
		var capturedFormData map[string]string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedFormData = parseFormData(t, r)

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
			SenderEmail: "configured@company.com",
			SenderName:  "Configured Support",
			BaseURL:     server.URL,
		})

		_, err := client.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{
			FileLink: "https://example.com/doc.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
			},
			SenderEmail: "sales@company.com",
			SenderName:  "Sales Team",
		})

		require.NoError(t, err)
		assert.Equal(t, "sales@company.com", capturedFormData["senderEmail"])
		assert.Equal(t, "Sales Team", capturedFormData["senderName"])
	})
}

// Tests for file upload with configured sender
func TestTurboSign_FileUpload_ConfiguredSender(t *testing.T) {
	t.Run("should use configured sender in file upload requests", func(t *testing.T) {
		var capturedFormData map[string]string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedFormData = parseFormData(t, r)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":    true,
				"documentId": "doc-upload",
				"status":     "review_ready",
				"message":    "Document prepared",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "configured@company.com",
			SenderName:  "Configured Support",
			BaseURL:     server.URL,
		})

		mockFile := []byte("%PDF-mock-content")

		_, err := client.TurboSign.CreateSignatureReviewLink(context.Background(), &CreateSignatureReviewLinkRequest{
			File:     mockFile,
			FileName: "document.pdf",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "configured@company.com", capturedFormData["senderEmail"])
		assert.Equal(t, "Configured Support", capturedFormData["senderName"])
	})

	t.Run("should override configured sender in file upload requests", func(t *testing.T) {
		var capturedFormData map[string]string

		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedFormData = parseFormData(t, r)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":    true,
				"documentId": "doc-upload",
				"status":     "review_ready",
				"message":    "Document prepared",
			})
		}))
		defer server.Close()

		client, _ := NewClientWithConfig(ClientConfig{
			APIKey:      "test-api-key",
			OrgID:       "test-org-id",
			SenderEmail: "configured@company.com",
			SenderName:  "Configured Support",
			BaseURL:     server.URL,
		})

		mockFile := []byte("%PDF-mock-content")

		_, err := client.TurboSign.CreateSignatureReviewLink(context.Background(), &CreateSignatureReviewLinkRequest{
			File:        mockFile,
			FileName:    "document.pdf",
			SenderEmail: "specific@company.com",
			SenderName:  "Specific Team",
			Recipients: []Recipient{
				{Name: "John Doe", Email: "john@example.com", SigningOrder: 1},
			},
			Fields: []Field{
				{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"},
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "specific@company.com", capturedFormData["senderEmail"])
		assert.Equal(t, "Specific Team", capturedFormData["senderName"])
	})
}
