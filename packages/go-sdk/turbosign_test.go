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
				"status":     "UNDER_REVIEW",
				"recipients": []map[string]interface{}{
					{"id": "r-1", "name": "John Doe", "email": "john@example.com", "metadata": map[string]interface{}{"color": "hsl(200, 75%, 50%)"}},
				},
				"message": "Document sent for signing",
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
		assert.Equal(t, "UNDER_REVIEW", result.Status)
		assert.Len(t, result.Recipients, 1)
		assert.Equal(t, "john@example.com", result.Recipients[0].Email)
	})

	t.Run("with file upload", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Contains(t, r.Header.Get("Content-Type"), "multipart/form-data")
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":    true,
				"documentId": "doc-upload",
				"status":     "UNDER_REVIEW",
				"recipients": []map[string]interface{}{
					{"id": "r-1", "name": "John Doe", "email": "john@example.com", "metadata": map[string]interface{}{"color": "hsl(200, 75%, 50%)"}},
				},
				"message": "Document sent for signing",
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

// recipientsPayload is the wire shape the backend returns, envelope included.
func recipientsPayload() map[string]interface{} {
	return map[string]interface{}{
		"data": map[string]interface{}{
			"document": map[string]interface{}{
				"id":        "doc-123",
				"name":      "Mutual NDA",
				"status":    "under_review",
				"createdOn": "2026-01-01T00:00:00.000Z",
				"sentOn":    "2026-01-02T08:59:00.000Z",
				"expiresAt": nil,
				"sentBy": map[string]interface{}{
					"name":  "Jane Sender",
					"email": "jane@acme.com",
				},
			},
			"recipients": []map[string]interface{}{
				{
					"id":              "rec-1",
					"name":            "John Signer",
					"email":           "john@example.com",
					"status":          "completed",
					"effectiveStatus": "completed",
					"signedOn":        "2026-02-01T10:00:00.000Z",
					"signingOrder":    1,
					"delivery": map[string]interface{}{
						"firstSentOn": "2026-01-02T09:00:00.000Z",
						"lastSentOn":  "2026-01-09T09:00:00.000Z",
						"totalSent":   3, "reminderCount": 1,
						"lastRemindedAt": "2026-01-09T09:00:00.000Z",
						"warningCount":   0, "lastWarningAt": nil,
					},
				},
				{
					"id":              "rec-2",
					"name":            "Ada Signer",
					"email":           "ada@example.com",
					"status":          "pending",
					"effectiveStatus": "pending",
					"signedOn":        nil,
					"signingOrder":    2,
					"delivery": map[string]interface{}{
						"firstSentOn": "2026-01-02T09:00:00.000Z",
						"lastSentOn":  "2026-01-02T09:00:00.000Z",
						"totalSent":   1, "reminderCount": 0,
						// Stamped by the initial send — NOT evidence of a reminder.
						"lastRemindedAt": "2026-01-02T09:00:00.000Z",
						"warningCount":   0, "lastWarningAt": nil,
					},
				},
			},
			"summary": map[string]interface{}{
				"total": 2, "pending": 1, "viewed": 0, "completed": 1,
				"voided": 0, "expired": 0, "waitingOn": 1,
			},
		},
	}
}

func newRecipientsServer(t *testing.T) *httptest.Server {
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/turbosign/documents/doc-123/recipients", r.URL.Path)
		assert.Equal(t, "GET", r.Method)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(recipientsPayload())
	}))
}

func TestTurboSignClient_GetRecipients(t *testing.T) {
	server := newRecipientsServer(t)
	defer server.Close()

	client, _ := NewClientWithConfig(ClientConfig{
		APIKey:      "test-api-key",
		OrgID:       "test-org-id",
		BaseURL:     server.URL,
		SenderEmail: "test@example.com",
	})

	result, err := client.TurboSign.GetRecipients(context.Background(), "doc-123")

	require.NoError(t, err)
	require.Len(t, result.Recipients, 2)
	assert.Equal(t, "completed", result.Recipients[0].Status)
	assert.Equal(t, "completed", result.Recipients[0].EffectiveStatus)
	assert.Equal(t, "john@example.com", result.Recipients[0].Email)
	require.NotNil(t, result.Recipients[0].SignedOn)
	assert.Equal(t, "2026-02-01T10:00:00.000Z", *result.Recipients[0].SignedOn)
	assert.Equal(t, 1, result.Recipients[0].SigningOrder)
	// A pending signer has no signedOn timestamp
	assert.Equal(t, "pending", result.Recipients[1].Status)
	assert.Nil(t, result.Recipients[1].SignedOn)
}

func TestTurboSignClient_GetRecipientsSummaryAndSender(t *testing.T) {
	server := newRecipientsServer(t)
	defer server.Close()

	client, _ := NewClientWithConfig(ClientConfig{
		APIKey:      "test-api-key",
		OrgID:       "test-org-id",
		BaseURL:     server.URL,
		SenderEmail: "test@example.com",
	})

	result, err := client.TurboSign.GetRecipients(context.Background(), "doc-123")

	require.NoError(t, err)
	assert.Equal(t, "Jane Sender", result.Document.SentBy.Name)
	assert.Equal(t, "jane@acme.com", result.Document.SentBy.Email)
	// Document status distinguishes a voided/expired doc from one still waiting
	assert.Equal(t, "under_review", result.Document.Status)
	require.NotNil(t, result.Document.SentOn)
	assert.Equal(t, "2026-01-02T08:59:00.000Z", *result.Document.SentOn)
	assert.Equal(t, 2, result.Summary.Total)
	assert.Equal(t, 1, result.Summary.Pending)
	assert.Equal(t, 0, result.Summary.Viewed)
	assert.Equal(t, 1, result.Summary.Completed)
	assert.Equal(t, 0, result.Summary.Voided)
	assert.Equal(t, 0, result.Summary.Expired)
	assert.Equal(t, 1, result.Summary.WaitingOn)
}

func TestTurboSignClient_GetRecipientsDelivery(t *testing.T) {
	server := newRecipientsServer(t)
	defer server.Close()

	client, _ := NewClientWithConfig(ClientConfig{
		APIKey:      "test-api-key",
		OrgID:       "test-org-id",
		BaseURL:     server.URL,
		SenderEmail: "test@example.com",
	})

	result, err := client.TurboSign.GetRecipients(context.Background(), "doc-123")

	require.NoError(t, err)
	chased := result.Recipients[0].Delivery
	assert.Equal(t, 3, chased.TotalSent)
	require.NotNil(t, chased.FirstSentOn)
	assert.Equal(t, "2026-01-02T09:00:00.000Z", *chased.FirstSentOn)
	require.NotNil(t, chased.LastSentOn)
	assert.Equal(t, "2026-01-09T09:00:00.000Z", *chased.LastSentOn)
	assert.Equal(t, 1, chased.ReminderCount)
	// Emailed once and never reminded: ReminderCount stays 0, but LastRemindedAt is NOT
	// nil — the initial send stamps it as the reminder cadence clock.
	once := result.Recipients[1].Delivery
	assert.Equal(t, 1, once.TotalSent)
	assert.Equal(t, 0, once.ReminderCount)
	assert.NotNil(t, once.LastRemindedAt)
	assert.Equal(t, *once.FirstSentOn, *once.LastRemindedAt)
}

func TestTurboSignClient_GetRecipientsEffectiveStatusOnVoidedDocument(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"data": map[string]interface{}{
				"document": map[string]interface{}{
					"id": "doc-123", "name": "Mutual NDA", "status": "voided",
					"createdOn": "2026-01-01T00:00:00.000Z", "sentOn": "2026-01-02T08:59:00.000Z",
					"expiresAt": nil,
					"sentBy":    map[string]interface{}{"name": "Jane Sender", "email": "jane@acme.com"},
				},
				"recipients": []map[string]interface{}{
					{
						"id": "rec-1", "name": "John Signer", "email": "john@example.com",
						"status": "completed", "effectiveStatus": "completed",
						"signedOn": "2026-02-01T10:00:00.000Z", "signingOrder": 1,
						"delivery": map[string]interface{}{"totalSent": 1},
					},
					{
						"id": "rec-2", "name": "Ada Signer", "email": "ada@example.com",
						"status": "pending", "effectiveStatus": "voided",
						"signedOn": nil, "signingOrder": 2,
						"delivery": map[string]interface{}{"totalSent": 1},
					},
				},
				"summary": map[string]interface{}{
					"total": 2, "pending": 0, "viewed": 0, "completed": 1,
					"voided": 1, "expired": 0, "waitingOn": 0,
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

	result, err := client.TurboSign.GetRecipients(context.Background(), "doc-123")

	require.NoError(t, err)
	// Someone who signed still signed — voiding the document does not undo it
	assert.Equal(t, "completed", result.Recipients[0].EffectiveStatus)
	// The unsigned signer is stranded, though the raw DB status is still "pending"
	assert.Equal(t, "pending", result.Recipients[1].Status)
	assert.Equal(t, "voided", result.Recipients[1].EffectiveStatus)
	assert.Equal(t, 1, result.Summary.Voided)
	assert.Equal(t, 0, result.Summary.WaitingOn)
}

func TestTurboSignClient_GetRecipientsNotFound(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
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

	_, err := client.TurboSign.GetRecipients(context.Background(), "missing-doc")

	require.Error(t, err)
	notFoundErr, ok := err.(*NotFoundError)
	require.True(t, ok, "expected NotFoundError")
	assert.Equal(t, 404, notFoundErr.StatusCode)
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
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id":         "doc-123",
			"name":       "Test Document",
			"status":     "voided",
			"voidReason": "Document needs revision",
			"voidedAt":   "2026-01-26T12:00:00.000Z",
		})
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
	assert.Equal(t, "doc-123", result.ID)
	assert.Equal(t, "Test Document", result.Name)
	assert.Equal(t, "voided", result.Status)
	assert.Equal(t, "Document needs revision", result.VoidReason)
	assert.Equal(t, "2026-01-26T12:00:00.000Z", result.VoidedAt)
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
