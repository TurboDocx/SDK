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

// fileName travels as a form field (the API stores it as the document's file name); the uploaded
// part keeps document.<ext>, because the API checks that extension.
func TestTurboSign_FileNameIsAFormField(t *testing.T) {
	type sent struct{ partName, fileNameField string }
	var got []sent
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		require.NoError(t, r.ParseMultipartForm(1<<20))
		_, header, err := r.FormFile("file")
		require.NoError(t, err)
		got = append(got, sent{header.Filename, r.FormValue("fileName")})
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "documentId": "doc-1", "status": "under_review"})
	}))
	defer server.Close()

	client, err := NewClientWithConfig(ClientConfig{APIKey: "k", OrgID: "o", BaseURL: server.URL, SenderEmail: "test@example.com"})
	require.NoError(t, err)
	recipients := []Recipient{{Name: "John Doe", Email: "john@example.com", SigningOrder: 1}}
	fields := []Field{{Type: "signature", Page: 1, X: 100, Y: 500, Width: 200, Height: 50, RecipientEmail: "john@example.com"}}
	pdf := []byte("%PDF-1.4 fake")

	_, err = client.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{File: pdf, FileName: "Lease Agreement 2026", Recipients: recipients, Fields: fields})
	require.NoError(t, err)
	_, err = client.TurboSign.CreateSignatureReviewLink(context.Background(), &CreateSignatureReviewLinkRequest{File: pdf, FileName: "Review-Copy.pdf", Recipients: recipients, Fields: fields})
	require.NoError(t, err)
	_, err = client.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{File: pdf, Recipients: recipients, Fields: fields})
	require.NoError(t, err)
	_, err = client.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{File: pdf, FileName: "", Recipients: recipients, Fields: fields})
	require.NoError(t, err)

	assert.Equal(t, []sent{
		{"document.pdf", "Lease Agreement 2026"},
		{"document.pdf", "Review-Copy.pdf"},
		{"document.pdf", ""},
		{"document.pdf", ""}, // an explicit empty FileName sends no field either
	}, got)
}
