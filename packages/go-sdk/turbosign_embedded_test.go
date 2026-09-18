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

// newEmbeddedTestClient spins up a client pointed at the given test server.
func newEmbeddedTestClient(t *testing.T, baseURL string) *Client {
	t.Helper()
	client, err := NewClientWithConfig(ClientConfig{
		APIKey:      "test-api-key",
		OrgID:       "test-org-id",
		BaseURL:     baseURL,
		SenderEmail: "sender@example.com",
	})
	require.NoError(t, err)
	return client
}

// ============================================
// CreateSigningURL
// ============================================

func TestTurboSignClient_CreateSigningURL(t *testing.T) {
	// Verifies the happy path unwraps the DOUBLE envelope { data: { results } } down to results.
	t.Run("unwraps the double envelope to results", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/turbosign/documents/doc-1/signing-url", r.URL.Path)
			assert.Equal(t, "POST", r.Method)

			// Assert the request body carried exactly the recipient selector, not an empty
			// externalId that omitempty must drop.
			var body map[string]interface{}
			require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
			assert.Equal(t, "rec-1", body["recipientId"])
			_, hasExternal := body["externalId"]
			assert.False(t, hasExternal, "unset externalId must be omitted, not sent empty")

			w.Header().Set("Content-Type", "application/json")
			// Double envelope: { data: { results: {...} } }.
			json.NewEncoder(w).Encode(map[string]interface{}{
				"data": map[string]interface{}{
					"results": map[string]interface{}{
						"url":                      "https://sign.example.com/embed/abc",
						"expiresAt":                "2026-01-01T00:00:00.000Z",
						"recipientId":              "rec-1",
						"identityVerificationMode": "otp",
						"pendingChecks":            []string{"email_otp"},
					},
				},
			})
		}))
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		res, err := client.TurboSign.CreateSigningURL(context.Background(), "doc-1", &CreateSigningURLRequest{
			RecipientID: "rec-1",
		})
		require.NoError(t, err)
		// The zero-value URL is exactly the js-sdk wrong-level bug — assert we got the inner value.
		assert.Equal(t, "https://sign.example.com/embed/abc", res.URL)
		require.NotNil(t, res.ExpiresAt)
		assert.Equal(t, "2026-01-01T00:00:00.000Z", *res.ExpiresAt)
		assert.Equal(t, "rec-1", res.RecipientID)
		assert.Equal(t, "otp", res.IdentityVerificationMode)
		assert.Equal(t, []string{"email_otp"}, res.PendingChecks)
	})

	// Verifies null expiresAt (otp / no-verification recipients) decodes to a nil pointer.
	t.Run("null expiresAt decodes to nil", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"data": map[string]interface{}{
					"results": map[string]interface{}{
						"url":         "https://sign.example.com/embed/xyz",
						"expiresAt":   nil,
						"recipientId": "rec-2",
					},
				},
			})
		}))
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		res, err := client.TurboSign.CreateSigningURL(context.Background(), "doc-1", &CreateSigningURLRequest{
			ExternalID: "ext-2",
		})
		require.NoError(t, err)
		assert.Nil(t, res.ExpiresAt)
		assert.Equal(t, "https://sign.example.com/embed/xyz", res.URL)
	})

	// XOR validation: both selectors set is rejected client-side with a typed ValidationError.
	t.Run("rejects both selectors", func(t *testing.T) {
		client := newEmbeddedTestClient(t, "https://unused.example.com")
		_, err := client.TurboSign.CreateSigningURL(context.Background(), "doc-1", &CreateSigningURLRequest{
			RecipientID: "rec-1",
			ExternalID:  "ext-1",
		})
		require.Error(t, err)
		ve, ok := err.(*ValidationError)
		require.True(t, ok, "expected *ValidationError")
		assert.Equal(t, "RecipientSelectorInvalid", ve.Code)
	})

	// XOR validation: neither selector set is rejected client-side.
	t.Run("rejects neither selector", func(t *testing.T) {
		client := newEmbeddedTestClient(t, "https://unused.example.com")
		_, err := client.TurboSign.CreateSigningURL(context.Background(), "doc-1", &CreateSigningURLRequest{})
		require.Error(t, err)
		ve, ok := err.(*ValidationError)
		require.True(t, ok, "expected *ValidationError")
		assert.Equal(t, "RecipientSelectorInvalid", ve.Code)
	})

	// A non-https returnUrl is rejected client-side.
	t.Run("rejects non-https returnUrl", func(t *testing.T) {
		client := newEmbeddedTestClient(t, "https://unused.example.com")
		_, err := client.TurboSign.CreateSigningURL(context.Background(), "doc-1", &CreateSigningURLRequest{
			RecipientID: "rec-1",
			ReturnURL:   "http://insecure.example.com/done",
		})
		require.Error(t, err)
		ve, ok := err.(*ValidationError)
		require.True(t, ok, "expected *ValidationError")
		assert.Equal(t, "InvalidReturnUrl", ve.Code)
	})
}

// ============================================
// GetEmbeddedSigningSettings
// ============================================

func TestTurboSignClient_GetEmbeddedSigningSettings(t *testing.T) {
	// Verifies the read unwraps the double envelope and maps every org gate.
	t.Run("returns the org gates", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/turbosign/embedded-signing-settings", r.URL.Path)
			assert.Equal(t, "GET", r.Method)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"data": map[string]interface{}{
					"results": map[string]interface{}{
						"enabled":               true,
						"allowExternalIdv":      true,
						"allowIdentityOverride": false,
						"defaultChannel":        "email",
						"allowedFrameAncestors": []string{"https://app.example.com"},
					},
				},
			})
		}))
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		settings, err := client.TurboSign.GetEmbeddedSigningSettings(context.Background())
		require.NoError(t, err)
		assert.True(t, settings.Enabled)
		assert.True(t, settings.AllowExternalIDV)
		assert.False(t, settings.AllowIdentityOverride)
		assert.Equal(t, "email", settings.DefaultChannel)
		assert.Equal(t, []string{"https://app.example.com"}, settings.AllowedFrameAncestors)
	})
}

// ============================================
// CreateEmbeddedSignature
// ============================================

// embeddedServerConfig configures the fake backend used by the wrapper tests. signingResponder
// receives the recipientId parsed from the signing-url request body and returns the HTTP status +
// JSON body to reply with, letting each test drive the turn-aware mapping.
type embeddedServerConfig struct {
	sentRecipients   []map[string]string
	signingResponder func(recipientID string) (int, map[string]interface{})
	// captureSend, when non-nil, receives the decoded send-signature form body for assertions.
	captureSend func(body map[string]interface{})
}

func newEmbeddedWrapperServer(t *testing.T, cfg embeddedServerConfig) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.URL.Path == "/turbosign/single/prepare-for-signing":
			// SendSignature uploads via multipart when File is set; scalar fields (sendEmail,
			// recipients JSON, ...) arrive as form values.
			if cfg.captureSend != nil {
				require.NoError(t, r.ParseMultipartForm(10<<20))
				body := make(map[string]interface{}, len(r.MultipartForm.Value))
				for k, v := range r.MultipartForm.Value {
					if len(v) > 0 {
						body[k] = v[0]
					}
				}
				cfg.captureSend(body)
			}
			recipients := cfg.sentRecipients
			out := make([]map[string]string, 0, len(recipients))
			out = append(out, recipients...)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":    true,
				"documentId": "doc-embed",
				"status":     "under_review",
				"message":    "sent",
				"recipients": out,
			})
		case strings.HasSuffix(r.URL.Path, "/signing-url"):
			var body map[string]interface{}
			require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
			recipientID, _ := body["recipientId"].(string)
			status, payload := cfg.signingResponder(recipientID)
			w.WriteHeader(status)
			json.NewEncoder(w).Encode(payload)
		default:
			t.Fatalf("unexpected path %s", r.URL.Path)
		}
	}))
}

func okSigningResults(url string) map[string]interface{} {
	return map[string]interface{}{
		"data": map[string]interface{}{
			"results": map[string]interface{}{
				"url":                      url,
				"expiresAt":                nil,
				"recipientId":              "ignored",
				"identityVerificationMode": "otp",
				"pendingChecks":            []string{"email_otp"},
			},
		},
	}
}

func TestTurboSignClient_CreateEmbeddedSignature(t *testing.T) {
	// The happy path: single signer, its turn, embed URL returned with status "ready".
	t.Run("maps a ready signer", func(t *testing.T) {
		var sentBody map[string]interface{}
		server := newEmbeddedWrapperServer(t, embeddedServerConfig{
			sentRecipients: []map[string]string{{"id": "rec-1", "email": "a@example.com", "name": "A"}},
			captureSend:    func(body map[string]interface{}) { sentBody = body },
			signingResponder: func(recipientID string) (int, map[string]interface{}) {
				return http.StatusOK, okSigningResults("https://sign.example.com/embed/1")
			},
		})
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		res, err := client.TurboSign.CreateEmbeddedSignature(context.Background(), &CreateEmbeddedSignatureRequest{
			File:         []byte("%PDF-1.4 fake"),
			FileName:     "contract.pdf",
			DocumentName: "Auto Policy",
			Recipients: []EmbeddedSignatureRecipient{
				{
					Name:  "A",
					Email: "a@example.com",
					Auth:  &EmbeddedRecipientAuth{EmailOTP: true},
					Fields: &EmbeddedRecipientFields{
						Signature: "{signature1}",
						Date:      "{date1}",
					},
				},
			},
		})
		require.NoError(t, err)
		assert.Equal(t, "doc-embed", res.DocumentID)
		require.Len(t, res.Recipients, 1)
		assert.Equal(t, "ready", res.Recipients[0].Status)
		assert.Equal(t, "https://sign.example.com/embed/1", res.Recipients[0].EmbedURL)
		assert.Equal(t, "rec-1", res.Recipients[0].RecipientID)
		assert.Equal(t, "otp", res.Recipients[0].IdentityVerificationMode)

		// Embedded default suppresses recipient emails; the multipart send carries sendEmail=false.
		require.NotNil(t, sentBody)
		assert.Equal(t, "false", sentBody["sendEmail"])
	})

	// Cross-language consistency: with no top-level Fields and no recipient shorthand, the
	// send-signature `fields` value must marshal to "[]" (an iterable empty array) — NOT "null".
	// js/python/php/java/ruby all emit "[]"; a nil Go slice would marshal to "null", which a
	// backend that JSON-parses and iterates the fields string cannot iterate.
	t.Run("sends empty fields as [] not null when no fields provided", func(t *testing.T) {
		var sentBody map[string]interface{}
		server := newEmbeddedWrapperServer(t, embeddedServerConfig{
			sentRecipients: []map[string]string{{"id": "rec-1", "email": "a@example.com", "name": "A"}},
			captureSend:    func(body map[string]interface{}) { sentBody = body },
			signingResponder: func(recipientID string) (int, map[string]interface{}) {
				return http.StatusOK, okSigningResults("https://sign.example.com/embed/1")
			},
		})
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		_, err := client.TurboSign.CreateEmbeddedSignature(context.Background(), &CreateEmbeddedSignatureRequest{
			File: []byte("pdf"),
			// No top-level Fields, and the recipient carries no Fields shorthand.
			Recipients: []EmbeddedSignatureRecipient{
				{Name: "A", Email: "a@example.com"},
			},
		})
		require.NoError(t, err)
		require.NotNil(t, sentBody)
		assert.Equal(t, "[]", sentBody["fields"], "empty fields must serialize to [] not null")
	})

	// Turn-aware degradation: the two not-in-turn aliases both map to "pending" with empty URL.
	for _, code := range []string{"RecipientNotInTurn", "NotSignersTurn"} {
		code := code
		t.Run("maps "+code+" to pending", func(t *testing.T) {
			server := newEmbeddedWrapperServer(t, embeddedServerConfig{
				sentRecipients: []map[string]string{{"id": "rec-1", "email": "a@example.com", "name": "A"}},
				signingResponder: func(recipientID string) (int, map[string]interface{}) {
					// The body MUST carry a `code` (plus a separate `message`); an `error` string
					// alone would be overwritten by defaultErrorCode -> "VALIDATION_ERROR".
					return http.StatusBadRequest, map[string]interface{}{
						"message": "not this signer's turn",
						"code":    code,
					}
				},
			})
			defer server.Close()

			client := newEmbeddedTestClient(t, server.URL)
			res, err := client.TurboSign.CreateEmbeddedSignature(context.Background(), &CreateEmbeddedSignatureRequest{
				File: []byte("pdf"),
				Recipients: []EmbeddedSignatureRecipient{
					{Name: "A", Email: "a@example.com", Auth: &EmbeddedRecipientAuth{EmailOTP: true}},
				},
			})
			require.NoError(t, err)
			require.Len(t, res.Recipients, 1)
			assert.Equal(t, "pending", res.Recipients[0].Status)
			assert.Empty(t, res.Recipients[0].EmbedURL)
			// Falls back to the resolved auth mode when no URL was minted.
			assert.Equal(t, "otp", res.Recipients[0].IdentityVerificationMode)
		})
	}

	// A recipient who already signed maps to "completed".
	t.Run("maps RecipientAlreadySigned to completed", func(t *testing.T) {
		server := newEmbeddedWrapperServer(t, embeddedServerConfig{
			sentRecipients: []map[string]string{{"id": "rec-1", "email": "a@example.com", "name": "A"}},
			signingResponder: func(recipientID string) (int, map[string]interface{}) {
				return http.StatusConflict, map[string]interface{}{
					"message": "already signed",
					"code":    "RecipientAlreadySigned",
				}
			},
		})
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		res, err := client.TurboSign.CreateEmbeddedSignature(context.Background(), &CreateEmbeddedSignatureRequest{
			File: []byte("pdf"),
			Recipients: []EmbeddedSignatureRecipient{
				{Name: "A", Email: "a@example.com"},
			},
		})
		require.NoError(t, err)
		require.Len(t, res.Recipients, 1)
		assert.Equal(t, "completed", res.Recipients[0].Status)
		assert.Empty(t, res.Recipients[0].EmbedURL)
	})

	// An unrelated error (500) from the signing-url endpoint propagates.
	t.Run("propagates an unrelated error", func(t *testing.T) {
		server := newEmbeddedWrapperServer(t, embeddedServerConfig{
			sentRecipients: []map[string]string{{"id": "rec-1", "email": "a@example.com", "name": "A"}},
			signingResponder: func(recipientID string) (int, map[string]interface{}) {
				return http.StatusInternalServerError, map[string]interface{}{
					"message": "boom",
					"code":    "InternalError",
				}
			},
		})
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		_, err := client.TurboSign.CreateEmbeddedSignature(context.Background(), &CreateEmbeddedSignatureRequest{
			File: []byte("pdf"),
			Recipients: []EmbeddedSignatureRecipient{
				{Name: "A", Email: "a@example.com"},
			},
		})
		require.Error(t, err)
	})

	// SMS OTP with no phone is rejected client-side before any HTTP call.
	t.Run("rejects SMS OTP without a phone", func(t *testing.T) {
		client := newEmbeddedTestClient(t, "https://unused.example.com")
		_, err := client.TurboSign.CreateEmbeddedSignature(context.Background(), &CreateEmbeddedSignatureRequest{
			File: []byte("pdf"),
			Recipients: []EmbeddedSignatureRecipient{
				{Name: "A", Email: "a@example.com", Auth: &EmbeddedRecipientAuth{SMS: &EmbeddedRecipientSMS{PhoneNumber: ""}}},
			},
		})
		require.Error(t, err)
		ve, ok := err.(*ValidationError)
		require.True(t, ok, "expected *ValidationError")
		assert.Equal(t, "PhoneRequiredForSmsOtp", ve.Code)
	})

	// Cross-language consistency: an empty SMS shorthand (sms:{}) with a top-level Phone must fall
	// back to that phone (matching js `?? r.phone` and php/java/py/ruby), NOT overwrite it with the
	// empty SMS number and wrongly fire PhoneRequiredForSmsOtp.
	t.Run("SMS shorthand falls back to the recipient's top-level phone", func(t *testing.T) {
		server := newEmbeddedWrapperServer(t, embeddedServerConfig{
			sentRecipients: []map[string]string{{"id": "rec-1", "email": "a@example.com", "name": "A"}},
			signingResponder: func(recipientID string) (int, map[string]interface{}) {
				return http.StatusOK, okSigningResults("https://sign.example.com/embed/1")
			},
		})
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		res, err := client.TurboSign.CreateEmbeddedSignature(context.Background(), &CreateEmbeddedSignatureRequest{
			File: []byte("%PDF-1.4 fake"),
			Recipients: []EmbeddedSignatureRecipient{
				{Name: "A", Email: "a@example.com", Phone: "+15551234567", Auth: &EmbeddedRecipientAuth{SMS: &EmbeddedRecipientSMS{PhoneNumber: ""}}},
			},
		})
		require.NoError(t, err)
		require.Len(t, res.Recipients, 1)
		assert.Equal(t, "ready", res.Recipients[0].Status)
	})

	// Results are assembled in signing order regardless of request order.
	t.Run("assembles results in signing order", func(t *testing.T) {
		server := newEmbeddedWrapperServer(t, embeddedServerConfig{
			sentRecipients: []map[string]string{
				{"id": "rec-a", "email": "a@example.com", "name": "A"},
				{"id": "rec-b", "email": "b@example.com", "name": "B"},
			},
			signingResponder: func(recipientID string) (int, map[string]interface{}) {
				return http.StatusOK, okSigningResults("https://sign.example.com/embed/" + recipientID)
			},
		})
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		res, err := client.TurboSign.CreateEmbeddedSignature(context.Background(), &CreateEmbeddedSignatureRequest{
			File: []byte("pdf"),
			// Provided out of order; explicit signingOrder should drive the result order.
			Recipients: []EmbeddedSignatureRecipient{
				{Name: "B", Email: "b@example.com", SigningOrder: 2},
				{Name: "A", Email: "a@example.com", SigningOrder: 1},
			},
		})
		require.NoError(t, err)
		require.Len(t, res.Recipients, 2)
		assert.Equal(t, "a@example.com", res.Recipients[0].Email)
		assert.Equal(t, "b@example.com", res.Recipients[1].Email)
	})
}

// Verifies the field shorthand expands to fully-specified Field objects in a deterministic order,
// including the initials -> "initial" type mapping and the default sizes.
func TestExpandRecipientFields(t *testing.T) {
	fields := expandRecipientFields(EmbeddedSignatureRecipient{
		Email: "a@example.com",
		Fields: &EmbeddedRecipientFields{
			Signature: "{sig}",
			Date:      "{date}",
			Initials:  "{init}",
			FullName:  "{name}",
		},
	})
	require.Len(t, fields, 4)

	// Deterministic order: signature, date, initial, full_name.
	assert.Equal(t, "signature", fields[0].Type)
	assert.Equal(t, 100, fields[0].Template.Size.Width)
	assert.Equal(t, 30, fields[0].Template.Size.Height)
	assert.Equal(t, "replace", fields[0].Template.Placement)
	assert.Equal(t, "{sig}", fields[0].Template.Anchor)
	assert.Equal(t, "a@example.com", fields[0].RecipientEmail)

	assert.Equal(t, "date", fields[1].Type)
	assert.Equal(t, 75, fields[1].Template.Size.Width)

	// "initials" shorthand emits the "initial" field type — not "initials".
	assert.Equal(t, "initial", fields[2].Type)
	assert.Equal(t, 50, fields[2].Template.Size.Width)

	assert.Equal(t, "full_name", fields[3].Type)
	assert.Equal(t, 150, fields[3].Template.Size.Width)

	// No shorthand -> no fields.
	assert.Nil(t, expandRecipientFields(EmbeddedSignatureRecipient{Email: "x@example.com"}))
}

// Verifies the auth shorthand resolves to the right identity verification, with email winning.
func TestResolveIdentityVerification(t *testing.T) {
	assert.Nil(t, resolveIdentityVerification(nil))
	assert.Nil(t, resolveIdentityVerification(&EmbeddedRecipientAuth{}))

	email := resolveIdentityVerification(&EmbeddedRecipientAuth{EmailOTP: true})
	require.NotNil(t, email)
	assert.Equal(t, "otp", email.Mode)
	assert.Equal(t, "email", email.Channel)

	sms := resolveIdentityVerification(&EmbeddedRecipientAuth{SMS: &EmbeddedRecipientSMS{PhoneNumber: "+13055551234"}})
	require.NotNil(t, sms)
	assert.Equal(t, "sms", sms.Channel)

	// Email wins when both are set.
	both := resolveIdentityVerification(&EmbeddedRecipientAuth{EmailOTP: true, SMS: &EmbeddedRecipientSMS{PhoneNumber: "+1"}})
	require.NotNil(t, both)
	assert.Equal(t, "email", both.Channel)
}
