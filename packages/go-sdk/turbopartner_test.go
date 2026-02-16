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

func newTestPartnerClient(t *testing.T, serverURL string) *PartnerClient {
	t.Helper()
	client, err := NewPartnerClient(PartnerConfig{
		PartnerAPIKey: "TDXP-test-key",
		PartnerID:     "test-partner-id",
		BaseURL:       serverURL,
	})
	require.NoError(t, err)
	return client
}

// =============================================
// Configuration Tests
// =============================================

func TestNewPartnerClient(t *testing.T) {
	t.Run("creates client with valid config", func(t *testing.T) {
		client, err := NewPartnerClient(PartnerConfig{
			PartnerAPIKey: "TDXP-test-key",
			PartnerID:     "test-partner-id",
		})
		require.NoError(t, err)
		assert.NotNil(t, client)
		assert.Equal(t, "test-partner-id", client.partnerID)
	})

	t.Run("returns error when partner API key is missing", func(t *testing.T) {
		_, err := NewPartnerClient(PartnerConfig{
			PartnerID: "test-partner-id",
		})
		require.Error(t, err)
		authErr, ok := err.(*AuthenticationError)
		require.True(t, ok, "expected AuthenticationError")
		assert.Contains(t, authErr.Message, "Partner API key is required")
	})

	t.Run("returns error when partner ID is missing", func(t *testing.T) {
		_, err := NewPartnerClient(PartnerConfig{
			PartnerAPIKey: "TDXP-test-key",
		})
		require.Error(t, err)
		authErr, ok := err.(*AuthenticationError)
		require.True(t, ok, "expected AuthenticationError")
		assert.Contains(t, authErr.Message, "Partner ID is required")
	})

	t.Run("uses default base URL", func(t *testing.T) {
		client, err := NewPartnerClient(PartnerConfig{
			PartnerAPIKey: "TDXP-test-key",
			PartnerID:     "test-partner-id",
		})
		require.NoError(t, err)
		assert.Equal(t, "https://api.turbodocx.com", client.http.baseURL)
	})

	t.Run("uses custom base URL", func(t *testing.T) {
		client, err := NewPartnerClient(PartnerConfig{
			PartnerAPIKey: "TDXP-test-key",
			PartnerID:     "test-partner-id",
			BaseURL:       "https://custom.api.com",
		})
		require.NoError(t, err)
		assert.Equal(t, "https://custom.api.com", client.http.baseURL)
	})

	t.Run("reads config from environment variables", func(t *testing.T) {
		t.Setenv("TURBODOCX_PARTNER_API_KEY", "TDXP-env-key")
		t.Setenv("TURBODOCX_PARTNER_ID", "env-partner-id")

		client, err := NewPartnerClient(PartnerConfig{})
		require.NoError(t, err)
		assert.Equal(t, "env-partner-id", client.partnerID)
	})
}

// =============================================
// Organization Management Tests
// =============================================

func TestCreateOrganization(t *testing.T) {
	t.Run("creates organization successfully", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organization", r.URL.Path)
			assert.Equal(t, "Bearer TDXP-test-key", r.Header.Get("Authorization"))

			var body CreateOrganizationRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "Acme Corp", body.Name)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"id":   "org-123",
					"name": "Acme Corp",
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.CreateOrganization(context.Background(), &CreateOrganizationRequest{
			Name: "Acme Corp",
		})

		require.NoError(t, err)
		assert.True(t, result.Success)
		assert.Equal(t, "org-123", result.Data.ID)
		assert.Equal(t, "Acme Corp", result.Data.Name)
	})

	t.Run("creates organization with features", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var body CreateOrganizationRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "Acme Corp", body.Name)
			assert.NotNil(t, body.Features)
			assert.Equal(t, 25, *body.Features.MaxUsers)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data":    map[string]interface{}{"id": "org-123", "name": "Acme Corp"},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.CreateOrganization(context.Background(), &CreateOrganizationRequest{
			Name:     "Acme Corp",
			Features: &Features{MaxUsers: IntPtr(25)},
		})

		require.NoError(t, err)
		assert.Equal(t, "org-123", result.Data.ID)
	})
}

func TestListOrganizations(t *testing.T) {
	t.Run("lists organizations with pagination", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations", r.URL.Path)
			assert.Equal(t, "25", r.URL.Query().Get("limit"))
			assert.Equal(t, "0", r.URL.Query().Get("offset"))
			assert.Equal(t, "Acme", r.URL.Query().Get("search"))

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"results":      []map[string]interface{}{{"id": "org-1", "name": "Acme Corp"}},
					"totalRecords": 1,
					"limit":        25,
					"offset":       0,
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.ListOrganizations(context.Background(), &ListOrganizationsRequest{
			Limit:  IntPtr(25),
			Offset: IntPtr(0),
			Search: "Acme",
		})

		require.NoError(t, err)
		assert.True(t, result.Success)
		assert.Equal(t, 1, result.Data.TotalRecords)
		assert.Len(t, result.Data.Results, 1)
		assert.Equal(t, "Acme Corp", result.Data.Results[0].Name)
	})

	t.Run("lists organizations with nil request", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "/partner/test-partner-id/organizations", r.URL.Path)
			assert.Empty(t, r.URL.RawQuery)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data":    map[string]interface{}{"results": []interface{}{}, "totalRecords": 0, "limit": 25, "offset": 0},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.ListOrganizations(context.Background(), nil)

		require.NoError(t, err)
		assert.Equal(t, 0, result.Data.TotalRecords)
	})
}

func TestGetOrganizationDetails(t *testing.T) {
	t.Run("gets organization details with features and tracking", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-123", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"id":       "org-123",
					"name":     "Acme Corp",
					"isActive": true,
					"features": map[string]interface{}{"maxUsers": 25, "hasTDAI": true},
					"tracking": map[string]interface{}{"numUsers": 5, "storageUsed": 1024},
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.GetOrganizationDetails(context.Background(), "org-123")

		require.NoError(t, err)
		assert.True(t, result.Success)
		assert.Equal(t, "org-123", result.Data.ID)
		assert.Equal(t, "Acme Corp", result.Data.Name)
		assert.NotNil(t, result.Data.Features)
		assert.Equal(t, 25, *result.Data.Features.MaxUsers)
		assert.NotNil(t, result.Data.Tracking)
		assert.Equal(t, 5, result.Data.Tracking.NumUsers)
	})
}

func TestUpdateOrganizationInfo(t *testing.T) {
	t.Run("updates organization name", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-123", r.URL.Path)

			var body UpdateOrganizationRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "Acme Corp Updated", body.Name)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data":    map[string]interface{}{"id": "org-123", "name": "Acme Corp Updated"},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.UpdateOrganizationInfo(context.Background(), "org-123", &UpdateOrganizationRequest{
			Name: "Acme Corp Updated",
		})

		require.NoError(t, err)
		assert.Equal(t, "Acme Corp Updated", result.Data.Name)
	})
}

func TestDeleteOrganization(t *testing.T) {
	t.Run("deletes organization", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-123", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.DeleteOrganization(context.Background(), "org-123")

		require.NoError(t, err)
		assert.True(t, result.Success)
	})
}

func TestUpdateOrganizationEntitlements(t *testing.T) {
	t.Run("updates entitlements", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-123/entitlements", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"features": map[string]interface{}{"maxUsers": 100, "hasTDAI": true},
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.UpdateOrganizationEntitlements(context.Background(), "org-123", &UpdateEntitlementsRequest{
			Features: &Features{
				MaxUsers: IntPtr(100),
				HasTDAI:  BoolPtr(true),
			},
		})

		require.NoError(t, err)
		assert.True(t, result.Success)
		assert.Equal(t, 100, *result.Data.Features.MaxUsers)
	})
}

// =============================================
// Organization User Management Tests
// =============================================

func TestAddUserToOrganization(t *testing.T) {
	t.Run("adds user to organization", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-123/users", r.URL.Path)

			var body AddOrgUserRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "user@example.com", body.Email)
			assert.Equal(t, "admin", body.Role)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data":    map[string]interface{}{"id": "user-123", "email": "user@example.com", "role": "admin"},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.AddUserToOrganization(context.Background(), "org-123", &AddOrgUserRequest{
			Email: "user@example.com",
			Role:  "admin",
		})

		require.NoError(t, err)
		assert.Equal(t, "user-123", result.Data.ID)
		assert.Equal(t, "user@example.com", result.Data.Email)
	})
}

func TestListOrganizationUsers(t *testing.T) {
	t.Run("lists organization users", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-123/users", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"results":      []map[string]interface{}{{"id": "user-1", "email": "a@b.com", "role": "admin"}},
					"totalRecords": 1, "limit": 50, "offset": 0,
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.ListOrganizationUsers(context.Background(), "org-123", &ListOrgUsersRequest{Limit: IntPtr(50)})

		require.NoError(t, err)
		assert.Equal(t, 1, result.Data.TotalRecords)
		assert.Equal(t, "a@b.com", result.Data.Results[0].Email)
	})
}

func TestUpdateOrganizationUserRole(t *testing.T) {
	t.Run("updates user role", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-123/users/user-123", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data":    map[string]interface{}{"id": "user-123", "email": "a@b.com", "role": "contributor"},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.UpdateOrganizationUserRole(context.Background(), "org-123", "user-123", &UpdateOrgUserRequest{Role: "contributor"})

		require.NoError(t, err)
		assert.Equal(t, "contributor", result.Data.Role)
	})
}

func TestRemoveUserFromOrganization(t *testing.T) {
	t.Run("removes user from organization", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-123/users/user-123", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.RemoveUserFromOrganization(context.Background(), "org-123", "user-123")

		require.NoError(t, err)
		assert.True(t, result.Success)
	})
}

func TestResendOrganizationInvitationToUser(t *testing.T) {
	t.Run("resends invitation", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-123/users/user-123/resend-invitation", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.ResendOrganizationInvitationToUser(context.Background(), "org-123", "user-123")

		require.NoError(t, err)
		assert.True(t, result.Success)
	})
}

// =============================================
// Organization API Key Management Tests
// =============================================

func TestCreateOrganizationApiKey(t *testing.T) {
	t.Run("creates organization API key", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-123/apikeys", r.URL.Path)

			var body CreateOrgApiKeyRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "Production Key", body.Name)
			assert.Equal(t, "admin", body.Role)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data":    map[string]interface{}{"id": "key-123", "name": "Production Key", "key": "TDX-full-key-value"},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.CreateOrganizationApiKey(context.Background(), "org-123", &CreateOrgApiKeyRequest{
			Name: "Production Key",
			Role: "admin",
		})

		require.NoError(t, err)
		assert.Equal(t, "key-123", result.Data.ID)
		assert.Equal(t, "TDX-full-key-value", result.Data.Key)
	})
}

func TestListOrganizationApiKeys(t *testing.T) {
	t.Run("lists organization API keys", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-123/apikeys", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"results":      []map[string]interface{}{{"id": "key-1", "name": "My Key", "role": "admin"}},
					"totalRecords": 1, "limit": 50, "offset": 0,
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.ListOrganizationApiKeys(context.Background(), "org-123", nil)

		require.NoError(t, err)
		assert.Equal(t, 1, result.Data.TotalRecords)
	})
}

func TestUpdateOrganizationApiKey(t *testing.T) {
	t.Run("updates organization API key", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-123/apikeys/key-123", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"apiKey":  map[string]interface{}{"id": "key-123", "name": "Updated Key"},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.UpdateOrganizationApiKey(context.Background(), "org-123", "key-123", &UpdateOrgApiKeyRequest{
			Name: "Updated Key",
		})

		require.NoError(t, err)
		assert.Equal(t, "key-123", result.ApiKey.ID)
		assert.Equal(t, "Updated Key", result.ApiKey.Name)
	})
}

func TestRevokeOrganizationApiKey(t *testing.T) {
	t.Run("revokes organization API key", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/partner/test-partner-id/organizations/org-123/apikeys/key-123", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.RevokeOrganizationApiKey(context.Background(), "org-123", "key-123")

		require.NoError(t, err)
		assert.True(t, result.Success)
	})
}

// =============================================
// Partner API Key Management Tests
// =============================================

func TestCreatePartnerApiKey(t *testing.T) {
	t.Run("creates partner API key with scopes", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/partner/test-partner-id/api-keys", r.URL.Path)

			var body CreatePartnerApiKeyRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "Integration Key", body.Name)
			assert.Contains(t, body.Scopes, ScopeOrgCreate)
			assert.Contains(t, body.Scopes, ScopeOrgRead)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data":    map[string]interface{}{"id": "pkey-123", "name": "Integration Key", "key": "TDXP-full-key"},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.CreatePartnerApiKey(context.Background(), &CreatePartnerApiKeyRequest{
			Name:   "Integration Key",
			Scopes: []string{ScopeOrgCreate, ScopeOrgRead, ScopeAuditRead},
		})

		require.NoError(t, err)
		assert.Equal(t, "pkey-123", result.Data.ID)
		assert.Equal(t, "TDXP-full-key", result.Data.Key)
	})
}

func TestListPartnerApiKeys(t *testing.T) {
	t.Run("lists partner API keys", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/partner/test-partner-id/api-keys", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"results":      []map[string]interface{}{{"id": "pkey-1", "name": "Key 1"}},
					"totalRecords": 1, "limit": 50, "offset": 0,
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.ListPartnerApiKeys(context.Background(), nil)

		require.NoError(t, err)
		assert.Equal(t, 1, result.Data.TotalRecords)
	})
}

func TestUpdatePartnerApiKey(t *testing.T) {
	t.Run("updates partner API key", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/partner/test-partner-id/api-keys/pkey-123", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"apiKey":  map[string]interface{}{"id": "pkey-123", "name": "Updated Key", "description": "Updated"},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.UpdatePartnerApiKey(context.Background(), "pkey-123", &UpdatePartnerApiKeyRequest{
			Name:        "Updated Key",
			Description: "Updated",
		})

		require.NoError(t, err)
		assert.Equal(t, "pkey-123", result.ApiKey.ID)
	})
}

func TestRevokePartnerApiKey(t *testing.T) {
	t.Run("revokes partner API key", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/partner/test-partner-id/api-keys/pkey-123", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.RevokePartnerApiKey(context.Background(), "pkey-123")

		require.NoError(t, err)
		assert.True(t, result.Success)
	})
}

// =============================================
// Partner User Management Tests
// =============================================

func TestAddUserToPartnerPortal(t *testing.T) {
	t.Run("adds user to partner portal", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/partner/test-partner-id/users", r.URL.Path)

			var body AddPartnerUserRequest
			json.NewDecoder(r.Body).Decode(&body)
			assert.Equal(t, "admin@partner.com", body.Email)
			assert.Equal(t, "admin", body.Role)
			assert.True(t, body.Permissions.CanManageOrgs)
			assert.False(t, body.Permissions.CanManagePartnerUsers)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data":    map[string]interface{}{"id": "puser-123", "email": "admin@partner.com", "role": "admin"},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.AddUserToPartnerPortal(context.Background(), &AddPartnerUserRequest{
			Email: "admin@partner.com",
			Role:  "admin",
			Permissions: PartnerPermissions{
				CanManageOrgs:           true,
				CanManageOrgUsers:       true,
				CanManagePartnerUsers:   false,
				CanManageOrgAPIKeys:     true,
				CanManagePartnerAPIKeys: false,
				CanUpdateEntitlements:   true,
				CanViewAuditLogs:        true,
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "puser-123", result.Data.ID)
	})
}

func TestListPartnerPortalUsers(t *testing.T) {
	t.Run("lists partner portal users", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/partner/test-partner-id/users", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"results":      []map[string]interface{}{{"id": "puser-1", "email": "a@b.com", "role": "admin"}},
					"totalRecords": 1, "limit": 50, "offset": 0,
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.ListPartnerPortalUsers(context.Background(), nil)

		require.NoError(t, err)
		assert.Equal(t, 1, result.Data.TotalRecords)
	})
}

func TestUpdatePartnerUserPermissions(t *testing.T) {
	t.Run("updates partner user permissions", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "PATCH", r.Method)
			assert.Equal(t, "/partner/test-partner-id/users/puser-123", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"userId": "puser-123",
					"role":   "admin",
					"permissions": map[string]interface{}{
						"canManageOrgs": true, "canManageOrgUsers": true,
						"canManagePartnerUsers": true, "canManageOrgAPIKeys": true,
						"canManagePartnerAPIKeys": true, "canUpdateEntitlements": true,
						"canViewAuditLogs": true,
					},
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.UpdatePartnerUserPermissions(context.Background(), "puser-123", &UpdatePartnerUserRequest{
			Role: "admin",
			Permissions: &PartnerPermissions{
				CanManageOrgs:           true,
				CanManageOrgUsers:       true,
				CanManagePartnerUsers:   true,
				CanManageOrgAPIKeys:     true,
				CanManagePartnerAPIKeys: true,
				CanUpdateEntitlements:   true,
				CanViewAuditLogs:        true,
			},
		})

		require.NoError(t, err)
		assert.Equal(t, "puser-123", result.Data.UserID)
		assert.Equal(t, "admin", result.Data.Role)
		assert.True(t, result.Data.Permissions.CanManageOrgs)
	})
}

func TestRemoveUserFromPartnerPortal(t *testing.T) {
	t.Run("removes user from partner portal", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "DELETE", r.Method)
			assert.Equal(t, "/partner/test-partner-id/users/puser-123", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.RemoveUserFromPartnerPortal(context.Background(), "puser-123")

		require.NoError(t, err)
		assert.True(t, result.Success)
	})
}

func TestResendPartnerPortalInvitationToUser(t *testing.T) {
	t.Run("resends partner portal invitation", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "POST", r.Method)
			assert.Equal(t, "/partner/test-partner-id/users/puser-123/resend-invitation", r.URL.Path)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{"success": true})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.ResendPartnerPortalInvitationToUser(context.Background(), "puser-123")

		require.NoError(t, err)
		assert.True(t, result.Success)
	})
}

// =============================================
// Audit Log Tests
// =============================================

func TestGetPartnerAuditLogs(t *testing.T) {
	t.Run("gets audit logs with filters", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Equal(t, "GET", r.Method)
			assert.Equal(t, "/partner/test-partner-id/audit-logs", r.URL.Path)
			assert.Equal(t, "org.created", r.URL.Query().Get("action"))
			assert.Equal(t, "organization", r.URL.Query().Get("resourceType"))
			assert.Equal(t, "true", r.URL.Query().Get("success"))

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data": map[string]interface{}{
					"results": []map[string]interface{}{
						{"id": "log-1", "action": "org.created", "resourceType": "organization", "success": true, "createdOn": "2024-01-01"},
					},
					"totalRecords": 1, "limit": 50, "offset": 0,
				},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.GetPartnerAuditLogs(context.Background(), &ListAuditLogsRequest{
			Limit:        IntPtr(50),
			Action:       "org.created",
			ResourceType: "organization",
			Success:      BoolPtr(true),
		})

		require.NoError(t, err)
		assert.Equal(t, 1, result.Data.TotalRecords)
		assert.Equal(t, "org.created", result.Data.Results[0].Action)
		assert.True(t, result.Data.Results[0].Success)
	})

	t.Run("gets audit logs with nil request", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			assert.Empty(t, r.URL.RawQuery)

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"success": true,
				"data":    map[string]interface{}{"results": []interface{}{}, "totalRecords": 0, "limit": 50, "offset": 0},
			})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		result, err := client.GetPartnerAuditLogs(context.Background(), nil)

		require.NoError(t, err)
		assert.Equal(t, 0, result.Data.TotalRecords)
	})
}

// =============================================
// Error Handling Tests
// =============================================

func TestPartnerErrorHandling(t *testing.T) {
	t.Run("handles 401 authentication error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(401)
			json.NewEncoder(w).Encode(map[string]interface{}{"message": "Invalid API key"})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		_, err := client.ListOrganizations(context.Background(), nil)

		require.Error(t, err)
		_, ok := err.(*AuthenticationError)
		assert.True(t, ok, "expected AuthenticationError")
	})

	t.Run("handles 404 not found error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(404)
			json.NewEncoder(w).Encode(map[string]interface{}{"message": "Organization not found"})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		_, err := client.GetOrganizationDetails(context.Background(), "nonexistent")

		require.Error(t, err)
		_, ok := err.(*NotFoundError)
		assert.True(t, ok, "expected NotFoundError")
	})

	t.Run("handles 400 validation error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(400)
			json.NewEncoder(w).Encode(map[string]interface{}{"message": "Name is required"})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		_, err := client.CreateOrganization(context.Background(), &CreateOrganizationRequest{})

		require.Error(t, err)
		_, ok := err.(*ValidationError)
		assert.True(t, ok, "expected ValidationError")
	})

	t.Run("handles 429 rate limit error", func(t *testing.T) {
		server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(429)
			json.NewEncoder(w).Encode(map[string]interface{}{"message": "Rate limit exceeded"})
		}))
		defer server.Close()

		client := newTestPartnerClient(t, server.URL)
		_, err := client.ListOrganizations(context.Background(), nil)

		require.Error(t, err)
		_, ok := err.(*RateLimitError)
		assert.True(t, ok, "expected RateLimitError")
	})
}
