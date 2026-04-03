package partner

import (
	"context"
	"encoding/json"
	"testing"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestApikeyListTableOutput(t *testing.T) {
	mock := &mockPartnerClient{
		listPartnerApiKeysFn: func(ctx context.Context, req *turbodocx.ListPartnerApiKeysRequest) (*turbodocx.PartnerApiKeyListResponse, error) {
			return &turbodocx.PartnerApiKeyListResponse{
				Success: true,
				Data: struct {
					Results      []turbodocx.PartnerApiKey `json:"results"`
					TotalRecords int                       `json:"totalRecords"`
					Limit        int                       `json:"limit"`
					Offset       int                       `json:"offset"`
				}{
					Results: []turbodocx.PartnerApiKey{
						{ID: "pk-1", Name: "Main Key", Scopes: []string{"org:read", "org:create"}, CreatedOn: "2024-01-01"},
					},
					TotalRecords: 1,
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"apikey", "list"})
		require.NoError(t, err)
		out := buf.String()
		assert.Contains(t, out, "Main Key")
		assert.Contains(t, out, "org:read")
	})
}

func TestApikeyListJSONOutput(t *testing.T) {
	mock := &mockPartnerClient{
		listPartnerApiKeysFn: func(ctx context.Context, req *turbodocx.ListPartnerApiKeysRequest) (*turbodocx.PartnerApiKeyListResponse, error) {
			return &turbodocx.PartnerApiKeyListResponse{
				Success: true,
				Data: struct {
					Results      []turbodocx.PartnerApiKey `json:"results"`
					TotalRecords int                       `json:"totalRecords"`
					Limit        int                       `json:"limit"`
					Offset       int                       `json:"offset"`
				}{
					Results:      []turbodocx.PartnerApiKey{{ID: "pk-1"}},
					TotalRecords: 1,
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executePartnerCmd([]string{"apikey", "list"})
		require.NoError(t, err)

		var parsed turbodocx.PartnerApiKeyListResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.Equal(t, 1, parsed.Data.TotalRecords)
	})
}

func TestApikeyCreateMissingFlags(t *testing.T) {
	mock := &mockPartnerClient{}
	withMockClient(mock, func() {
		_, err := executePartnerCmd([]string{"apikey", "create"})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "--name is required")
	})

	withMockClient(mock, func() {
		_, err := executePartnerCmd([]string{"apikey", "create", "--name", "Test"})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "--scopes is required")
	})
}

func TestApikeyCreateHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		createPartnerApiKeyFn: func(ctx context.Context, req *turbodocx.CreatePartnerApiKeyRequest) (*turbodocx.PartnerApiKeyResponse, error) {
			assert.Equal(t, "Admin Key", req.Name)
			assert.Equal(t, []string{"org:read", "org:create"}, req.Scopes)
			assert.Equal(t, "For admin use", req.Description)
			return &turbodocx.PartnerApiKeyResponse{
				Success: true,
				Data:    turbodocx.PartnerApiKey{ID: "pk-1", Name: "Admin Key", Key: "TDXP-xyz", Scopes: []string{"org:read", "org:create"}},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"apikey", "create", "--name", "Admin Key", "--scopes", "org:read,org:create", "--description", "For admin use"})
		require.NoError(t, err)
		out := buf.String()
		assert.Contains(t, out, "TDXP-xyz")
		assert.Contains(t, out, "Admin Key")
	})
}

func TestApikeyUpdateNoFlags(t *testing.T) {
	mock := &mockPartnerClient{}
	withMockClient(mock, func() {
		_, err := executePartnerCmd([]string{"apikey", "update", "pk-1"})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "at least one of")
	})
}

func TestApikeyUpdateHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		updatePartnerApiKeyFn: func(ctx context.Context, keyID string, req *turbodocx.UpdatePartnerApiKeyRequest) (*turbodocx.PartnerApiKeyUpdateResponse, error) {
			assert.Equal(t, "pk-1", keyID)
			assert.Equal(t, "New Name", req.Name)
			return &turbodocx.PartnerApiKeyUpdateResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"apikey", "update", "pk-1", "--name", "New Name"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "pk-1 updated")
	})
}

func TestApikeyRevokeHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		revokePartnerApiKeyFn: func(ctx context.Context, keyID string) (*turbodocx.SuccessResponse, error) {
			assert.Equal(t, "pk-1", keyID)
			return &turbodocx.SuccessResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"apikey", "revoke", "pk-1"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "pk-1 revoked")
	})
}

func TestApikeyRevokeJSONOutput(t *testing.T) {
	mock := &mockPartnerClient{
		revokePartnerApiKeyFn: func(ctx context.Context, keyID string) (*turbodocx.SuccessResponse, error) {
			return &turbodocx.SuccessResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executePartnerCmd([]string{"apikey", "revoke", "pk-1"})
		require.NoError(t, err)

		var parsed turbodocx.SuccessResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.True(t, parsed.Success)
	})
}
