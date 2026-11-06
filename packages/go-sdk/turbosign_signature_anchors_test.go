package turbodocx

// Template signature setups with anchored fields: a field tied to a template tag (like
// "{ClientSign}") for one signer role. Each test runs the real HTTP client against an httptest
// server, so the requests asserted here are exactly what goes over the wire.

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

var savedAnchorSetup = map[string]interface{}{
	"roles":   []interface{}{map[string]interface{}{"roleId": "r1", "label": "Signer 1", "order": 1}},
	"fields":  []interface{}{map[string]interface{}{"roleId": "r1", "type": "signature", "anchor": "{ClientSign}", "fieldId": "f1"}},
	"savedOn": "2026-11-06T00:00:00.000Z",
}

func sendOK(w http.ResponseWriter) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"data": map[string]interface{}{"success": true, "documentId": "doc-1", "status": "under_review"},
	})
}

func TestTurboSignClient_ApplySignatureSetup(t *testing.T) {
	anchoredField := Field{
		Type:           "signature",
		RecipientEmail: "jane@client.com",
		Template:       &TemplateAnchor{Anchor: "{ClientSign}"},
	}
	recipients := []Recipient{{Name: "Jane Doe", Email: "jane@client.com", SigningOrder: 1}}

	t.Run("sends applySignatureSetup true on SendSignature and CreateSignatureReviewLink", func(t *testing.T) {
		var seen []map[string]interface{}
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			body, _, _ := decodeFormBody(t, r)
			seen = append(seen, body)
			sendOK(w)
		}))
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		_, err := client.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{
			TemplateID: rolesTemplateID, Recipients: recipients, Fields: []Field{anchoredField},
			ApplySignatureSetup: BoolPtr(true),
		})
		require.NoError(t, err)
		_, err = client.TurboSign.CreateSignatureReviewLink(context.Background(), &CreateSignatureReviewLinkRequest{
			TemplateID: rolesTemplateID, Recipients: recipients, Fields: []Field{anchoredField},
			ApplySignatureSetup: BoolPtr(true),
		})
		require.NoError(t, err)

		require.Len(t, seen, 2)
		assert.Equal(t, "true", seen[0]["applySignatureSetup"])
		assert.Equal(t, "true", seen[1]["applySignatureSetup"])
	})

	t.Run("forwards an explicit false and leaves the key out when nil", func(t *testing.T) {
		var seen []map[string]interface{}
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			body, _, _ := decodeFormBody(t, r)
			seen = append(seen, body)
			sendOK(w)
		}))
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		_, err := client.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{
			TemplateID: rolesTemplateID, Recipients: recipients, Fields: []Field{anchoredField},
			ApplySignatureSetup: BoolPtr(false),
		})
		require.NoError(t, err)
		_, err = client.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{
			TemplateID: rolesTemplateID, Recipients: recipients, Fields: []Field{anchoredField},
		})
		require.NoError(t, err)

		require.Len(t, seen, 2)
		assert.Equal(t, "false", seen[0]["applySignatureSetup"])
		assert.NotContains(t, seen[1], "applySignatureSetup")
	})

	t.Run("sends it as a form field on a file upload", func(t *testing.T) {
		var got string
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			require.NoError(t, r.ParseMultipartForm(1<<20))
			got = r.FormValue("applySignatureSetup")
			sendOK(w)
		}))
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		_, err := client.TurboSign.SendSignature(context.Background(), &SendSignatureRequest{
			File: []byte("%PDF-1.4"), Recipients: recipients, Fields: []Field{anchoredField},
			ApplySignatureSetup: BoolPtr(true),
		})
		require.NoError(t, err)
		assert.Equal(t, "true", got)
	})
}

func TestTurboSignClient_GetTemplateSignatureSetupAnchors(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]interface{}{"data": map[string]interface{}{
			"templateId": rolesTemplateID,
			"roles": []interface{}{map[string]interface{}{
				"key": "signer_1", "label": "Signer 1", "order": 1, "hasSavedSigner": false,
				"fieldCount": 1, "anchoredFieldCount": 1,
			}},
			"anchors": []interface{}{map[string]interface{}{
				"fieldId": "f1", "roleKey": "signer_1", "type": "signature", "anchor": "{ClientSign}",
				"placement": "replace", "offset": map[string]interface{}{"x": 0, "y": 5.5},
				"size": map[string]interface{}{"width": 120.5, "height": 30}, "notFound": false,
			}},
		}})
	}))
	defer server.Close()

	client := newEmbeddedTestClient(t, server.URL)
	setup, err := client.TurboSign.GetTemplateSignatureSetup(context.Background(), rolesTemplateID)
	require.NoError(t, err)

	assert.Equal(t, 1, setup.Roles[0].AnchoredFieldCount)
	require.Len(t, setup.Anchors, 1)
	assert.Equal(t, TemplateSignatureAnchor{
		FieldID: "f1", RoleKey: "signer_1", Type: "signature", Anchor: "{ClientSign}",
		Placement: "replace", Offset: &AnchorOffset{X: 0, Y: 5.5}, Size: &AnchorSize{Width: 120.5, Height: 30},
		NotFound: false,
	}, setup.Anchors[0])
}

func TestTurboSignClient_AddTemplateSignatureAnchor(t *testing.T) {
	t.Run("POSTs the anchored field without templateId and returns the unwrapped result", func(t *testing.T) {
		var body map[string]interface{}
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, http.MethodPost, r.Method)
			assert.Equal(t, "/turbosign/templates/"+rolesTemplateID+"/signature-setup/anchors", r.URL.Path)
			require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
			writeJSON(w, http.StatusOK, map[string]interface{}{"data": map[string]interface{}{"results": map[string]interface{}{
				"fieldId": "f1", "signatureSetup": savedAnchorSetup, "tagBecameSignatureField": true,
			}}})
		}))
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		result, err := client.TurboSign.AddTemplateSignatureAnchor(context.Background(), &AddTemplateSignatureAnchorRequest{
			TemplateID: rolesTemplateID,
			RoleKey:    "signer_1",
			Type:       "signature",
			Anchor:     "{ClientSign}",
			Size:       &AnchorSize{Width: 120, Height: 30},
			Offset:     &AnchorOffset{X: 0, Y: 5},
			Placement:  "replace",
		})
		require.NoError(t, err)

		assert.Equal(t, map[string]interface{}{
			"roleKey":   "signer_1",
			"type":      "signature",
			"anchor":    "{ClientSign}",
			"size":      map[string]interface{}{"width": float64(120), "height": float64(30)},
			"offset":    map[string]interface{}{"x": float64(0), "y": float64(5)},
			"placement": "replace",
		}, body)
		assert.Equal(t, "f1", result.FieldID)
		assert.True(t, result.TagBecameSignatureField)
		assert.Len(t, result.SignatureSetup["fields"], 1)
		assert.Equal(t, "2026-11-06T00:00:00.000Z", result.SignatureSetup["savedOn"])
	})

	t.Run("forwards isReadonly and defaultValue when set, explicit false included", func(t *testing.T) {
		var body map[string]interface{}
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			require.NoError(t, json.NewDecoder(r.Body).Decode(&body))
			writeJSON(w, http.StatusOK, map[string]interface{}{"data": map[string]interface{}{"results": map[string]interface{}{
				"fieldId": "f2", "signatureSetup": savedAnchorSetup, "tagBecameSignatureField": false,
			}}})
		}))
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		_, err := client.TurboSign.AddTemplateSignatureAnchor(context.Background(), &AddTemplateSignatureAnchorRequest{
			TemplateID: rolesTemplateID, RoleKey: "signer_1", Type: "text", Anchor: "{Company}",
			DefaultValue: "Acme", IsReadonly: BoolPtr(false),
		})
		require.NoError(t, err)
		assert.Equal(t, "Acme", body["defaultValue"])
		assert.Equal(t, false, body["isReadonly"])
		assert.NotContains(t, body, "templateId")
		assert.NotContains(t, body, "size")
		assert.NotContains(t, body, "placement")
	})

	t.Run("surfaces a tag owned by another role as ConflictError with its code", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			writeJSON(w, http.StatusConflict, map[string]interface{}{
				"message": "The tag {ClientSign} already belongs to another signer.",
				"type":    "AnchorOwnedByOtherRole", "error": "x", "code": "AnchorOwnedByOtherRole",
			})
		}))
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		_, err := client.TurboSign.AddTemplateSignatureAnchor(context.Background(), &AddTemplateSignatureAnchorRequest{
			TemplateID: rolesTemplateID, RoleKey: "signer_2", Type: "signature", Anchor: "{ClientSign}",
		})
		var conflict *ConflictError
		require.ErrorAs(t, err, &conflict)
		assert.Equal(t, "AnchorOwnedByOtherRole", conflict.Code)
		assert.Equal(t, 409, conflict.StatusCode)
	})
}

func TestTurboSignClient_RemoveTemplateSignatureAnchor(t *testing.T) {
	t.Run("DELETEs the field by escaped id and returns the remaining setup", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, http.MethodDelete, r.Method)
			assert.Equal(t, "/turbosign/templates/"+rolesTemplateID+"/signature-setup/anchors/f%2F1", r.URL.EscapedPath())
			b, _ := io.ReadAll(r.Body)
			assert.Empty(t, b)
			writeJSON(w, http.StatusOK, map[string]interface{}{"data": map[string]interface{}{"results": map[string]interface{}{
				"signatureSetup": map[string]interface{}{"roles": savedAnchorSetup["roles"], "fields": []interface{}{}},
			}}})
		}))
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		result, err := client.TurboSign.RemoveTemplateSignatureAnchor(context.Background(), rolesTemplateID, "f/1")
		require.NoError(t, err)
		assert.Equal(t, []interface{}{}, result.SignatureSetup["fields"])
	})

	t.Run("surfaces an unknown field id as NotFoundError", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			writeJSON(w, http.StatusNotFound, map[string]interface{}{
				"message": "No anchored field with this id in the signature setup", "code": "SetupFieldNotFound",
			})
		}))
		defer server.Close()

		client := newEmbeddedTestClient(t, server.URL)
		_, err := client.TurboSign.RemoveTemplateSignatureAnchor(context.Background(), rolesTemplateID, "nope")
		var notFound *NotFoundError
		require.ErrorAs(t, err, &notFound)
		assert.Equal(t, "SetupFieldNotFound", notFound.Code)
	})
}
