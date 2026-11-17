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

// FitAnchoredTags on the two send paths (and CreateEmbeddedSignature, which sends through
// SendSignature). The flag is sent only when it is true: the API treats false the same as a
// missing key, so false leaves it out and every existing request body stays exactly as it was.
// Mirrors the js-sdk and py-sdk suites case for case.

type capturedRequest struct {
	path string
	form map[string]string
}

// fitAnchoredTagsServer records every request's path and form values and answers a send with a
// one-recipient document and a signing-url call with an embed URL.
func fitAnchoredTagsServer(t *testing.T, captured *[]capturedRequest) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		*captured = append(*captured, capturedRequest{path: r.URL.Path, form: parseFormData(t, r)})
		w.Header().Set("Content-Type", "application/json")
		if strings.HasSuffix(r.URL.Path, "/signing-url") {
			_ = json.NewEncoder(w).Encode(map[string]interface{}{"data": map[string]interface{}{"results": map[string]interface{}{
				"url": "https://app/sign/doc-1?token=T", "recipientId": "rec-1", "identityVerificationMode": nil, "pendingChecks": []string{},
			}}})
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"data": map[string]interface{}{
			"success": true, "documentId": "doc-1", "status": "under_review", "message": "ok",
			"recipients": []map[string]string{{"id": "rec-1", "name": "Jane Doe", "email": "jane@example.com"}},
		}})
	}))
}

func fitAnchoredTagsClient(t *testing.T, server *httptest.Server) *Client {
	t.Helper()
	client, err := NewClientWithConfig(ClientConfig{
		APIKey:      "k",
		OrgID:       "o",
		SenderEmail: "sender@company.com",
		BaseURL:     server.URL,
	})
	require.NoError(t, err)
	return client
}

var (
	fitRecipients = []Recipient{{Name: "Jane Doe", Email: "jane@example.com", SigningOrder: 1}}
	fitFields     = []Field{{Type: "signature", RecipientEmail: "jane@example.com", Template: &TemplateAnchor{Anchor: "{ClientSign}"}}}
	fitPDF        = []byte("%PDF-1.4 fake pdf bytes")
)

// sendWith runs one send (review link or signature, upload or file link) and returns its form.
func sendWith(t *testing.T, review, upload, fit bool) capturedRequest {
	t.Helper()
	var captured []capturedRequest
	server := fitAnchoredTagsServer(t, &captured)
	defer server.Close()
	client := fitAnchoredTagsClient(t, server)

	var file []byte
	var fileLink string
	if upload {
		file = fitPDF
	} else {
		fileLink = "https://example.com/contract.pdf"
	}

	var err error
	if review {
		_, err = client.TurboSign.CreateSignatureReviewLink(context.Background(), &CreateSignatureReviewLinkRequest{
			File: file, FileLink: fileLink, Recipients: fitRecipients, Fields: fitFields, FitAnchoredTags: fit,
		})
	} else {
		_, err = client.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{
			File: file, FileLink: fileLink, Recipients: fitRecipients, Fields: fitFields, FitAnchoredTags: fit,
		})
	}
	require.NoError(t, err)
	require.Len(t, captured, 1)
	return captured[0]
}

func TestTurboSign_FitAnchoredTags_OnSends(t *testing.T) {
	cases := []struct {
		name   string
		review bool
		path   string
	}{
		{"SendSignature", false, "/turbosign/single/prepare-for-signing"},
		{"CreateSignatureReviewLink", true, "/turbosign/single/prepare-for-review"},
	}
	for _, tc := range cases {
		for _, upload := range []bool{true, false} {
			source := "file link (JSON)"
			if upload {
				source = "upload (multipart)"
			}
			t.Run(tc.name+" "+source+" sends fitAnchoredTags=true when true", func(t *testing.T) {
				on := sendWith(t, tc.review, upload, true)
				assert.Equal(t, tc.path, on.path)
				assert.Equal(t, "true", on.form["fitAnchoredTags"])
			})
			t.Run(tc.name+" "+source+" leaves the key out when false, the form otherwise unchanged", func(t *testing.T) {
				off := sendWith(t, tc.review, upload, false)
				on := sendWith(t, tc.review, upload, true)

				assert.NotContains(t, off.form, "fitAnchoredTags")
				delete(on.form, "fitAnchoredTags")
				assert.Equal(t, off.form, on.form)
			})
		}
	}
}

func embedWith(t *testing.T, fit bool) capturedRequest {
	t.Helper()
	var captured []capturedRequest
	server := fitAnchoredTagsServer(t, &captured)
	defer server.Close()
	client := fitAnchoredTagsClient(t, server)

	_, err := client.TurboSign.CreateEmbeddedSignature(context.Background(), &CreateEmbeddedSignatureRequest{
		FileLink: "https://example.com/contract.pdf",
		Recipients: []EmbeddedSignatureRecipient{
			{Name: "Jane Doe", Email: "jane@example.com", Fields: &EmbeddedRecipientFields{Signature: "{ClientSign}"}},
		},
		FitAnchoredTags: fit,
	})
	require.NoError(t, err)
	require.Len(t, captured, 2)
	assert.Equal(t, "/turbosign/single/prepare-for-signing", captured[0].path)
	return captured[0]
}

func TestTurboSign_FitAnchoredTags_OnEmbeddedSignature(t *testing.T) {
	t.Run("passes fitAnchoredTags=true to the send when true", func(t *testing.T) {
		assert.Equal(t, "true", embedWith(t, true).form["fitAnchoredTags"])
	})
	t.Run("leaves the key out when false", func(t *testing.T) {
		assert.NotContains(t, embedWith(t, false).form, "fitAnchoredTags")
	})
}
