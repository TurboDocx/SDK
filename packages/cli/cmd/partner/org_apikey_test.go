package partner

import (
	"context"
	"encoding/json"
	"testing"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestOrgApikeyListTableOutput(t *testing.T) {
	mock := &mockPartnerClient{
		listOrganizationApiKeysFn: func(ctx context.Context, orgID string, req *turbodocx.ListOrgApiKeysRequest) (*turbodocx.OrgApiKeyListResponse, error) {
			assert.Equal(t, "org-1", orgID)
			return &turbodocx.OrgApiKeyListResponse{
				Success: true,
				Data: struct {
					Results      []turbodocx.OrgApiKey `json:"results"`
					TotalRecords int                   `json:"totalRecords"`
					Limit        int                   `json:"limit"`
					Offset       int                   `json:"offset"`
				}{
					Results: []turbodocx.OrgApiKey{
						{ID: "k-1", Name: "Production", Role: "admin", CreatedOn: "2024-01-01", LastUsedOn: "2024-03-01"},
					},
					TotalRecords: 1,
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"org", "apikey", "list", "org-1"})
		require.NoError(t, err)
		out := buf.String()
		assert.Contains(t, out, "Production")
		assert.Contains(t, out, "admin")
	})
}

func TestOrgApikeyListJSONOutput(t *testing.T) {
	mock := &mockPartnerClient{
		listOrganizationApiKeysFn: func(ctx context.Context, orgID string, req *turbodocx.ListOrgApiKeysRequest) (*turbodocx.OrgApiKeyListResponse, error) {
			return &turbodocx.OrgApiKeyListResponse{
				Success: true,
				Data: struct {
					Results      []turbodocx.OrgApiKey `json:"results"`
					TotalRecords int                   `json:"totalRecords"`
					Limit        int                   `json:"limit"`
					Offset       int                   `json:"offset"`
				}{
					Results:      []turbodocx.OrgApiKey{{ID: "k-1", Name: "Test"}},
					TotalRecords: 1,
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executePartnerCmd([]string{"org", "apikey", "list", "org-1"})
		require.NoError(t, err)

		var parsed turbodocx.OrgApiKeyListResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.Equal(t, 1, parsed.Data.TotalRecords)
	})
}

func TestOrgApikeyCreateHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		createOrganizationApiKeyFn: func(ctx context.Context, orgID string, req *turbodocx.CreateOrgApiKeyRequest) (*turbodocx.OrgApiKeyResponse, error) {
			assert.Equal(t, "org-1", orgID)
			assert.Equal(t, "Production", req.Name)
			assert.Equal(t, "admin", req.Role)
			return &turbodocx.OrgApiKeyResponse{
				Success: true,
				Data:    turbodocx.OrgApiKey{ID: "k-1", Name: "Production", Key: "TDX-abc123", Role: "admin"},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"org", "apikey", "create", "org-1", "--name", "Production", "--role", "admin"})
		require.NoError(t, err)
		out := buf.String()
		assert.Contains(t, out, "Production")
		assert.Contains(t, out, "TDX-abc123")
	})
}

func TestOrgApikeyCreateMissingFlags(t *testing.T) {
	mock := &mockPartnerClient{}
	withMockClient(mock, func() {
		_, err := executePartnerCmd([]string{"org", "apikey", "create", "org-1"})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "--name is required")
	})
}

func TestOrgApikeyUpdateHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		updateOrganizationApiKeyFn: func(ctx context.Context, orgID, keyID string, req *turbodocx.UpdateOrgApiKeyRequest) (*turbodocx.OrgApiKeyUpdateResponse, error) {
			assert.Equal(t, "org-1", orgID)
			assert.Equal(t, "k-1", keyID)
			assert.Equal(t, "NewName", req.Name)
			return &turbodocx.OrgApiKeyUpdateResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"org", "apikey", "update", "org-1", "k-1", "--name", "NewName"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "k-1 updated")
	})
}

func TestOrgApikeyUpdateNoFlags(t *testing.T) {
	mock := &mockPartnerClient{}
	withMockClient(mock, func() {
		_, err := executePartnerCmd([]string{"org", "apikey", "update", "org-1", "k-1"})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "at least one of")
	})
}

func TestOrgApikeyRevokeHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		revokeOrganizationApiKeyFn: func(ctx context.Context, orgID, keyID string) (*turbodocx.SuccessResponse, error) {
			assert.Equal(t, "org-1", orgID)
			assert.Equal(t, "k-1", keyID)
			return &turbodocx.SuccessResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"org", "apikey", "revoke", "org-1", "k-1"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "k-1 revoked")
	})
}

func TestOrgApikeyRevokeJSONOutput(t *testing.T) {
	mock := &mockPartnerClient{
		revokeOrganizationApiKeyFn: func(ctx context.Context, orgID, keyID string) (*turbodocx.SuccessResponse, error) {
			return &turbodocx.SuccessResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executePartnerCmd([]string{"org", "apikey", "revoke", "org-1", "k-1"})
		require.NoError(t, err)

		var parsed turbodocx.SuccessResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.True(t, parsed.Success)
	})
}
