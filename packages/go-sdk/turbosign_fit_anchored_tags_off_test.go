package turbodocx

import (
	"context"
	"encoding/json"
	"io"
	"mime"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// With FitAnchoredTags left false, every request is exactly what it was before the field existed:
// the same method, path and body on both send paths (multipart and JSON) and on
// CreateEmbeddedSignature, whose Fields shorthand keeps its default size. The JSON bodies are
// compared byte for byte. These expectations pass unchanged against the code from before the field
// was added.

type rawRequest struct {
	method      string
	path        string
	contentType string
	body        []byte
}

func rawCaptureServer(t *testing.T, captured *[]rawRequest) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, err := io.ReadAll(r.Body)
		require.NoError(t, err)
		*captured = append(*captured, rawRequest{r.Method, r.URL.Path, r.Header.Get("Content-Type"), body})
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

func rawCaptureClient(t *testing.T, server *httptest.Server) *Client {
	t.Helper()
	client, err := NewClientWithConfig(ClientConfig{APIKey: "k", OrgID: "o", SenderEmail: "sender@company.com", BaseURL: server.URL})
	require.NoError(t, err)
	return client
}

// multipartParts returns the form values of a multipart body and the file part's file name.
func multipartParts(t *testing.T, req rawRequest) (map[string]string, string) {
	t.Helper()
	_, params, err := mime.ParseMediaType(req.contentType)
	require.NoError(t, err)
	reader := multipart.NewReader(strings.NewReader(string(req.body)), params["boundary"])
	values := map[string]string{}
	fileName := ""
	for {
		part, err := reader.NextPart()
		if err == io.EOF {
			break
		}
		require.NoError(t, err)
		data, err := io.ReadAll(part)
		require.NoError(t, err)
		if part.FormName() == "file" {
			fileName = part.FileName()
			continue
		}
		values[part.FormName()] = string(data)
	}
	return values, fileName
}

func TestRequestsWithoutFitAnchoredTags(t *testing.T) {
	recipients := []Recipient{{Name: "Jane Doe", Email: "jane@example.com", SigningOrder: 1}}
	fields := []Field{{Type: "signature", RecipientEmail: "jane@example.com", Template: &TemplateAnchor{Anchor: "{ClientSign}"}}}
	// Every other option, so all the keys around the flag are pinned too.
	schedule := SignatureSchedule{RemindersEnabled: boolPtr(true), ReminderDelay: &Duration{Value: 2, Unit: "days"}}
	common := map[string]string{
		"recipients":          `[{"name":"Jane Doe","email":"jane@example.com","signingOrder":1}]`,
		"fields":              `[{"type":"signature","recipientEmail":"jane@example.com","template":{"anchor":"{ClientSign}"}}]`,
		"documentName":        "Contract",
		"documentDescription": "Please sign",
		"senderEmail":         "sender@company.com",
		"senderName":          "Acme",
		"ccEmails":            `["cc@example.com"]`,
		"remindersEnabled":    "true",
		"reminderDelay":       `{"value":2,"unit":"days"}`,
	}

	cases := []struct {
		name string
		path string
		// sendEmail is a send option: the review link has never had it.
		extra map[string]string
		send  func(c *Client, file []byte, fileLink string) error
	}{
		{
			name:  "SendSignature",
			path:  "/turbosign/single/prepare-for-signing",
			extra: map[string]string{"sendEmail": "false"},
			send: func(c *Client, file []byte, fileLink string) error {
				_, err := c.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{
					File: file, FileLink: fileLink, Recipients: recipients, Fields: fields,
					DocumentName: "Contract", DocumentDescription: "Please sign", SenderName: "Acme",
					CCEmails: []string{"cc@example.com"}, SendEmail: boolPtr(false), SignatureSchedule: schedule,
				})
				return err
			},
		},
		{
			name:  "CreateSignatureReviewLink",
			path:  "/turbosign/single/prepare-for-review",
			extra: map[string]string{},
			send: func(c *Client, file []byte, fileLink string) error {
				_, err := c.TurboSign.CreateSignatureReviewLink(context.Background(), &CreateSignatureReviewLinkRequest{
					File: file, FileLink: fileLink, Recipients: recipients, Fields: fields,
					DocumentName: "Contract", DocumentDescription: "Please sign", SenderName: "Acme",
					CCEmails: []string{"cc@example.com"}, SignatureSchedule: schedule,
				})
				return err
			},
		},
	}

	for _, tc := range cases {
		expected := map[string]string{}
		for k, v := range common {
			expected[k] = v
		}
		for k, v := range tc.extra {
			expected[k] = v
		}

		t.Run(tc.name+" multipart form", func(t *testing.T) {
			var captured []rawRequest
			server := rawCaptureServer(t, &captured)
			defer server.Close()
			require.NoError(t, tc.send(rawCaptureClient(t, server), []byte("%PDF-1.4 fake pdf bytes"), ""))

			require.Len(t, captured, 1)
			assert.Equal(t, "POST", captured[0].method)
			assert.Equal(t, tc.path, captured[0].path)
			values, fileName := multipartParts(t, captured[0])
			assert.Equal(t, "document.pdf", fileName)
			assert.Equal(t, expected, values)
		})

		t.Run(tc.name+" JSON body", func(t *testing.T) {
			var captured []rawRequest
			server := rawCaptureServer(t, &captured)
			defer server.Close()
			require.NoError(t, tc.send(rawCaptureClient(t, server), nil, "https://example.com/c.pdf"))

			require.Len(t, captured, 1)
			assert.Equal(t, "POST", captured[0].method)
			assert.Equal(t, tc.path, captured[0].path)
			expected["fileLink"] = "https://example.com/c.pdf"
			want, err := json.Marshal(expected)
			require.NoError(t, err)
			assert.Equal(t, string(want), string(captured[0].body))
		})
	}

	t.Run("CreateEmbeddedSignature JSON body, with the shorthand's default size", func(t *testing.T) {
		var captured []rawRequest
		server := rawCaptureServer(t, &captured)
		defer server.Close()
		_, err := rawCaptureClient(t, server).TurboSign.CreateEmbeddedSignature(context.Background(), &CreateEmbeddedSignatureRequest{
			FileLink: "https://example.com/c.pdf",
			Recipients: []EmbeddedSignatureRecipient{{
				Name: "Jane Doe", Email: "jane@example.com",
				Fields: &EmbeddedRecipientFields{Signature: "{ClientSign}", Date: "{Date}"},
			}},
		})
		require.NoError(t, err)

		assert.Equal(t, "/turbosign/single/prepare-for-signing", captured[0].path)
		assert.Equal(t,
			`{"fields":"[{\"type\":\"signature\",\"recipientEmail\":\"jane@example.com\",`+
				`\"template\":{\"anchor\":\"{ClientSign}\",\"placement\":\"replace\",\"size\":{\"width\":100,\"height\":30}}},`+
				`{\"type\":\"date\",\"recipientEmail\":\"jane@example.com\",`+
				`\"template\":{\"anchor\":\"{Date}\",\"placement\":\"replace\",\"size\":{\"width\":75,\"height\":30}}}]",`+
				`"fileLink":"https://example.com/c.pdf",`+
				`"recipients":"[{\"name\":\"Jane Doe\",\"email\":\"jane@example.com\",\"signingOrder\":1}]",`+
				`"sendEmail":"false","senderEmail":"sender@company.com"}`,
			string(captured[0].body))
	})
}
