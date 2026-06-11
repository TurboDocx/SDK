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

// Backward-compat: the deprecated Api-cased methods/types (pre-rename, v0.3.0) must keep working
// and forward to the new API-cased implementations, hitting the identical endpoints.
func TestDeprecatedApiKeyAliases(t *testing.T) {
	okJSON := func(data interface{}) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "data": data})
		}
	}

	t.Run("CreateOrganizationApiKey forwards to /organizations/{id}/apikeys", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-1/apikeys", r.URL.Path)
			okJSON(map[string]interface{}{})(w, r)
		}))
		defer server.Close()
		client := newTestPartnerClient(t, server.URL)
		_, err := client.CreateOrganizationApiKey(context.Background(), "org-1", &CreateOrgApiKeyRequest{})
		require.NoError(t, err)
	})

	t.Run("ListOrganizationApiKeys forwards", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-1/apikeys", r.URL.Path)
			okJSON(map[string]interface{}{"results": []interface{}{}, "totalRecords": 0})(w, r)
		}))
		defer server.Close()
		client := newTestPartnerClient(t, server.URL)
		_, err := client.ListOrganizationApiKeys(context.Background(), "org-1", &ListOrgApiKeysRequest{})
		require.NoError(t, err)
	})

	t.Run("UpdateOrganizationApiKey forwards", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-1/apikeys/key-1", r.URL.Path)
			okJSON(map[string]interface{}{})(w, r)
		}))
		defer server.Close()
		client := newTestPartnerClient(t, server.URL)
		_, err := client.UpdateOrganizationApiKey(context.Background(), "org-1", "key-1", &UpdateOrgApiKeyRequest{})
		require.NoError(t, err)
	})

	t.Run("RevokeOrganizationApiKey forwards", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-1/apikeys/key-1", r.URL.Path)
			okJSON(map[string]interface{}{})(w, r)
		}))
		defer server.Close()
		client := newTestPartnerClient(t, server.URL)
		_, err := client.RevokeOrganizationApiKey(context.Background(), "org-1", "key-1")
		require.NoError(t, err)
	})

	t.Run("CreatePartnerApiKey forwards to /api-keys", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/partner/test-partner-id/api-keys", r.URL.Path)
			okJSON(map[string]interface{}{})(w, r)
		}))
		defer server.Close()
		client := newTestPartnerClient(t, server.URL)
		_, err := client.CreatePartnerApiKey(context.Background(), &CreatePartnerApiKeyRequest{})
		require.NoError(t, err)
	})

	t.Run("ListPartnerApiKeys forwards", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/partner/test-partner-id/api-keys", r.URL.Path)
			okJSON(map[string]interface{}{"results": []interface{}{}, "totalRecords": 0})(w, r)
		}))
		defer server.Close()
		client := newTestPartnerClient(t, server.URL)
		_, err := client.ListPartnerApiKeys(context.Background(), &ListPartnerApiKeysRequest{})
		require.NoError(t, err)
	})

	t.Run("UpdatePartnerApiKey forwards", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/partner/test-partner-id/api-keys/key-1", r.URL.Path)
			okJSON(map[string]interface{}{})(w, r)
		}))
		defer server.Close()
		client := newTestPartnerClient(t, server.URL)
		_, err := client.UpdatePartnerApiKey(context.Background(), "key-1", &UpdatePartnerApiKeyRequest{})
		require.NoError(t, err)
	})

	t.Run("RevokePartnerApiKey forwards", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/partner/test-partner-id/api-keys/key-1", r.URL.Path)
			okJSON(map[string]interface{}{})(w, r)
		}))
		defer server.Close()
		client := newTestPartnerClient(t, server.URL)
		_, err := client.RevokePartnerApiKey(context.Background(), "key-1")
		require.NoError(t, err)
	})

	// Type aliases must be assignable to the new types (identical types).
	t.Run("old request/response type names are aliases of the new ones", func(t *testing.T) {
		var _ *CreateOrgAPIKeyRequest = &CreateOrgApiKeyRequest{}
		var _ *ListOrgAPIKeysRequest = &ListOrgApiKeysRequest{}
		var _ *UpdateOrgAPIKeyRequest = &UpdateOrgApiKeyRequest{}
		var _ *CreatePartnerAPIKeyRequest = &CreatePartnerApiKeyRequest{}
		var _ *ListPartnerAPIKeysRequest = &ListPartnerApiKeysRequest{}
		var _ *UpdatePartnerAPIKeyRequest = &UpdatePartnerApiKeyRequest{}
		var _ *OrgAPIKey = &OrgApiKey{}
		var _ *PartnerAPIKey = &PartnerApiKey{}
		var _ *OrgAPIKeyResponse = &OrgApiKeyResponse{}
		var _ *OrgAPIKeyUpdateResponse = &OrgApiKeyUpdateResponse{}
		var _ *OrgAPIKeyListResponse = &OrgApiKeyListResponse{}
		var _ *PartnerAPIKeyResponse = &PartnerApiKeyResponse{}
		var _ *PartnerAPIKeyUpdateResponse = &PartnerApiKeyUpdateResponse{}
		var _ *PartnerAPIKeyListResponse = &PartnerApiKeyListResponse{}
	})
}
