package turbodocx

// Template signer roles: a template set up in the TurboDocx UI (signers + fields dragged onto the
// PDF) is sent by naming each signer's role. Bodies are double-encoded: the whole body is JSON and
// `recipients`/`fields` are JSON strings inside it.

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const rolesTemplateID = "84759112-d9d6-443a-bb78-87c427bd7948"

// decodeFormBody reads the JSON body and returns it plus the decoded recipients/fields strings.
func decodeFormBody(t *testing.T, r *http.Request) (map[string]interface{}, []map[string]interface{}, []interface{}) {
	t.Helper()
	var body map[string]interface{}
	require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
	var recipients []map[string]interface{}
	require.NoError(t, json.Unmarshal([]byte(body["recipients"].(string)), &recipients))
	fieldsStr, ok := body["fields"].(string)
	require.True(t, ok, "fields must be sent as a JSON string")
	var fields []interface{}
	require.NoError(t, json.Unmarshal([]byte(fieldsStr), &fields))
	require.NotNil(t, fields, `fields must serialize as "[]", not "null"`)
	return body, recipients, fields
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func TestTurboSignClient_SendSignatureWithTemplateRoles(t *testing.T) {
	t.Run("sends each recipient's role and an empty fields list when fields are omitted", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/turbosign/single/prepare-for-signing", r.URL.Path)
			body, recipients, fields := decodeFormBody(t, r)
			assert.Equal(t, rolesTemplateID, body["templateId"])
			assert.Equal(t, []map[string]interface{}{
				{"role": "client", "name": "Jane Doe", "email": "jane@client.com"},
			}, recipients, "a role recipient needs no signingOrder")
			assert.Empty(t, fields)
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"data": map[string]interface{}{"success": true, "documentId": "doc-1", "status": "under_review"},
			})
		}))
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		result, err := client.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{
			TemplateID: rolesTemplateID,
			Recipients: []Recipient{{Role: "client", Name: "Jane Doe", Email: "jane@client.com"}},
		})
		require.NoError(t, err)
		assert.Equal(t, "doc-1", result.DocumentID)
	})

	t.Run("surfaces the API's message and code when a role isn't on the template", func(t *testing.T) {
		const msg = `Unknown role "clinet". This template's roles are: client, countersigner`
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			writeJSON(w, http.StatusBadRequest, map[string]interface{}{"message": msg, "type": "UnknownSignerRole"})
		}))
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		_, err := client.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{
			TemplateID: rolesTemplateID,
			Recipients: []Recipient{{Role: "clinet", Name: "Jane Doe", Email: "jane@client.com"}},
		})
		require.Error(t, err)
		var valErr *ValidationError
		require.ErrorAs(t, err, &valErr)
		assert.Equal(t, msg, valErr.Message)
		assert.Equal(t, "UnknownSignerRole", valErr.Code)
		assert.Equal(t, 400, valErr.StatusCode)
	})
}

func TestTurboSignClient_CreateSignatureReviewLinkWithTemplateRoles(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		assert.Equal(t, "/turbosign/single/prepare-for-review", r.URL.Path)
		_, recipients, fields := decodeFormBody(t, r)
		require.Len(t, recipients, 1)
		assert.Equal(t, "client", recipients[0]["role"])
		assert.Empty(t, fields)
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"data": map[string]interface{}{"success": true, "documentId": "doc-2", "status": "review_ready"},
		})
	}))
	defer server.Close()

	client := newEmbeddedTestClient(t, server.URL)
	_, err := client.TurboSign.CreateSignatureReviewLink(context.Background(), &CreateSignatureReviewLinkRequest{
		TemplateID: rolesTemplateID,
		Recipients: []Recipient{{Role: "client", Name: "Jane Doe", Email: "jane@client.com"}},
	})
	require.NoError(t, err)
}

func TestTurboSignClient_RecipientWithoutRoleKeepsWireFormat(t *testing.T) {
	// Existing callers (no Role) must send byte-identical recipients: no "role" key.
	b, err := json.Marshal(Recipient{Name: "A", Email: "a@x.com", SigningOrder: 1})
	require.NoError(t, err)
	assert.JSONEq(t, `{"name":"A","email":"a@x.com","signingOrder":1}`, string(b))
}

func TestTurboSignClient_CreateEmbeddedSignatureWithTemplateRoles(t *testing.T) {
	calls := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		if calls == 1 {
			assert.Equal(t, "/turbosign/single/prepare-for-signing", r.URL.Path)
			_, recipients, fields := decodeFormBody(t, r)
			assert.Equal(t, []map[string]interface{}{
				{"name": "Jane Doe", "email": "jane@client.com", "signingOrder": float64(1), "role": "client"},
			}, recipients)
			assert.Empty(t, fields)
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"data": map[string]interface{}{
					"success": true, "documentId": "doc-3", "status": "under_review",
					"recipients": []map[string]interface{}{{"id": "rec-1", "name": "Jane Doe", "email": "jane@client.com"}},
				},
			})
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"data": map[string]interface{}{
				"results": map[string]interface{}{"url": "https://app/sign/doc-3?token=J", "expiresAt": nil, "recipientId": "rec-1"},
			},
		})
	}))
	defer server.Close()

	client := newEmbeddedTestClient(t, server.URL)
	result, err := client.TurboSign.CreateEmbeddedSignature(context.Background(), &CreateEmbeddedSignatureRequest{
		TemplateID: rolesTemplateID,
		Recipients: []EmbeddedSignatureRecipient{{Role: "client", Name: "Jane Doe", Email: "jane@client.com"}},
	})
	require.NoError(t, err)
	require.Len(t, result.Recipients, 1)
	assert.Equal(t, "https://app/sign/doc-3?token=J", result.Recipients[0].EmbedURL)
}

func TestTurboSignClient_CreateEmbeddedSignatureSigningOrderWithTemplateRoles(t *testing.T) {
	// The template's roles sign client first; the API returns its signers in that order
	signingURLs := map[string]string{"rec-client": "https://app/sign?token=J", "rec-counter": "https://app/sign?token=S"}
	calls := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		calls++
		if calls == 1 {
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"data": map[string]interface{}{
					"success": true, "documentId": "doc-4", "status": "under_review",
					"recipients": []map[string]interface{}{
						{"id": "rec-client", "name": "Jane Doe", "email": "jane@client.com"},
						{"id": "rec-counter", "name": "Sam Lee", "email": "sam@acme.com"},
					},
				},
			})
			return
		}
		var body map[string]interface{}
		require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
		recipientID, _ := body["recipientId"].(string)
		writeJSON(w, http.StatusOK, map[string]interface{}{
			"data": map[string]interface{}{
				"results": map[string]interface{}{"url": signingURLs[recipientID], "expiresAt": nil, "recipientId": recipientID},
			},
		})
	}))
	defer server.Close()

	client := newEmbeddedTestClient(t, server.URL)
	result, err := client.TurboSign.CreateEmbeddedSignature(context.Background(), &CreateEmbeddedSignatureRequest{
		TemplateID: rolesTemplateID,
		Recipients: []EmbeddedSignatureRecipient{
			{Role: "countersigner", Name: "Sam Lee", Email: "sam@acme.com"},
			{Role: "client", Name: "Jane Doe", Email: "jane@client.com"},
		},
	})
	require.NoError(t, err)
	require.Len(t, result.Recipients, 2)
	assert.Equal(t, []string{"jane@client.com", "sam@acme.com"},
		[]string{result.Recipients[0].Email, result.Recipients[1].Email})
	assert.Equal(t, []string{"https://app/sign?token=J", "https://app/sign?token=S"},
		[]string{result.Recipients[0].EmbedURL, result.Recipients[1].EmbedURL})
}

func TestTurboSignClient_GetTemplateSignatureSetup(t *testing.T) {
	t.Run("GETs the template's signer roles and unwraps the response", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/turbosign/templates/"+rolesTemplateID+"/signature-setup", r.URL.Path)
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"data": map[string]interface{}{
					"templateId": rolesTemplateID,
					"roles": []map[string]interface{}{
						{"key": "client", "label": "Client", "order": 1, "hasSavedSigner": false, "fieldCount": 3},
						{
							"key": "countersigner", "label": "Countersigner", "order": 2, "hasSavedSigner": true,
							"defaultName": "Sam Lee", "defaultEmail": "sam@acme.com", "fieldCount": 2,
						},
					},
				},
			})
		}))
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		setup, err := client.TurboSign.GetTemplateSignatureSetup(context.Background(), rolesTemplateID)
		require.NoError(t, err)
		assert.Equal(t, &TemplateSignatureSetup{
			TemplateID: rolesTemplateID,
			Roles: []TemplateSignatureRole{
				{Key: "client", Label: "Client", Order: 1, HasSavedSigner: false, FieldCount: 3},
				{
					Key: "countersigner", Label: "Countersigner", Order: 2, HasSavedSigner: true,
					DefaultName: "Sam Lee", DefaultEmail: "sam@acme.com", FieldCount: 2,
				},
			},
		}, setup)
	})

	t.Run("path-escapes the template id", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/turbosign/templates/a%2Fb/signature-setup", r.URL.EscapedPath())
			writeJSON(w, http.StatusOK, map[string]interface{}{
				"data": map[string]interface{}{"templateId": "a/b", "roles": []interface{}{}},
			})
		}))
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		_, err := client.TurboSign.GetTemplateSignatureSetup(context.Background(), "a/b")
		require.NoError(t, err)
	})
}
