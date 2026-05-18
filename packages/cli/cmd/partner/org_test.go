package partner

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// --- org create ---

func TestOrgCreateHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		createOrganizationFn: func(ctx context.Context, req *turbodocx.CreateOrganizationRequest) (*turbodocx.OrganizationResponse, error) {
			assert.Equal(t, "Acme Corp", req.Name)
			return &turbodocx.OrganizationResponse{
				Success: true,
				Data:    turbodocx.Organization{ID: "org-1", Name: "Acme Corp"},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"org", "create", "--name", "Acme Corp"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "org-1")
		assert.Contains(t, buf.String(), "Acme Corp")
	})
}

func TestOrgCreateJSONOutput(t *testing.T) {
	mock := &mockPartnerClient{
		createOrganizationFn: func(ctx context.Context, req *turbodocx.CreateOrganizationRequest) (*turbodocx.OrganizationResponse, error) {
			return &turbodocx.OrganizationResponse{
				Success: true,
				Data:    turbodocx.Organization{ID: "org-1", Name: "Test"},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executePartnerCmd([]string{"org", "create", "--name", "Test"})
		require.NoError(t, err)

		var parsed turbodocx.OrganizationResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.Equal(t, "org-1", parsed.Data.ID)
	})
}

func TestOrgCreateMissingName(t *testing.T) {
	mock := &mockPartnerClient{}
	withMockClient(mock, func() {
		_, err := executePartnerCmd([]string{"org", "create"})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "required flag")
	})
}

func TestOrgCreateWithMetadataFile(t *testing.T) {
	dir := t.TempDir()
	metaFile := filepath.Join(dir, "meta.json")
	err := os.WriteFile(metaFile, []byte(`{"region":"us-east"}`), 0644)
	require.NoError(t, err)

	mock := &mockPartnerClient{
		createOrganizationFn: func(ctx context.Context, req *turbodocx.CreateOrganizationRequest) (*turbodocx.OrganizationResponse, error) {
			assert.Equal(t, "us-east", req.Metadata["region"])
			return &turbodocx.OrganizationResponse{
				Success: true,
				Data:    turbodocx.Organization{ID: "org-2", Name: "MetaOrg"},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		_, err := executePartnerCmd([]string{"org", "create", "--name", "MetaOrg", "--metadata", "@" + metaFile})
		require.NoError(t, err)
	})
}

// --- org list ---

func TestOrgListTableOutput(t *testing.T) {
	mock := &mockPartnerClient{
		listOrganizationsFn: func(ctx context.Context, req *turbodocx.ListOrganizationsRequest) (*turbodocx.OrganizationListResponse, error) {
			return &turbodocx.OrganizationListResponse{
				Success: true,
				Data: struct {
					Results      []turbodocx.Organization `json:"results"`
					TotalRecords int                      `json:"totalRecords"`
					Limit        int                      `json:"limit"`
					Offset       int                      `json:"offset"`
				}{
					Results: []turbodocx.Organization{
						{ID: "org-1", Name: "Acme", UserCount: 5, IsActive: true, CreatedOn: "2024-01-01"},
						{ID: "org-2", Name: "Beta", UserCount: 3, IsActive: true, CreatedOn: "2024-02-01"},
					},
					TotalRecords: 2,
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"org", "list"})
		require.NoError(t, err)
		out := buf.String()
		assert.Contains(t, out, "Total: 2")
		assert.Contains(t, out, "Acme")
		assert.Contains(t, out, "Beta")
	})
}

func TestOrgListJSONOutput(t *testing.T) {
	mock := &mockPartnerClient{
		listOrganizationsFn: func(ctx context.Context, req *turbodocx.ListOrganizationsRequest) (*turbodocx.OrganizationListResponse, error) {
			return &turbodocx.OrganizationListResponse{
				Success: true,
				Data: struct {
					Results      []turbodocx.Organization `json:"results"`
					TotalRecords int                      `json:"totalRecords"`
					Limit        int                      `json:"limit"`
					Offset       int                      `json:"offset"`
				}{
					Results:      []turbodocx.Organization{{ID: "org-1", Name: "Acme"}},
					TotalRecords: 1,
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executePartnerCmd([]string{"org", "list"})
		require.NoError(t, err)

		var parsed turbodocx.OrganizationListResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.Equal(t, 1, parsed.Data.TotalRecords)
	})
}

func TestOrgListWithPagination(t *testing.T) {
	mock := &mockPartnerClient{
		listOrganizationsFn: func(ctx context.Context, req *turbodocx.ListOrganizationsRequest) (*turbodocx.OrganizationListResponse, error) {
			assert.NotNil(t, req.Limit)
			assert.Equal(t, 10, *req.Limit)
			assert.NotNil(t, req.Offset)
			assert.Equal(t, 5, *req.Offset)
			assert.Equal(t, "acme", req.Search)
			return &turbodocx.OrganizationListResponse{
				Success: true,
				Data: struct {
					Results      []turbodocx.Organization `json:"results"`
					TotalRecords int                      `json:"totalRecords"`
					Limit        int                      `json:"limit"`
					Offset       int                      `json:"offset"`
				}{
					Results:      []turbodocx.Organization{},
					TotalRecords: 0,
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		_, err := executePartnerCmd([]string{"org", "list", "--limit", "10", "--offset", "5", "--search", "acme"})
		require.NoError(t, err)
	})
}

// --- org get ---

func TestOrgGetHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		getOrganizationDetailsFn: func(ctx context.Context, orgID string) (*turbodocx.OrganizationDetailResponse, error) {
			assert.Equal(t, "org-1", orgID)
			return &turbodocx.OrganizationDetailResponse{
				Success: true,
				Data: struct {
					turbodocx.Organization
					Features *turbodocx.Features `json:"features,omitempty"`
					Tracking *turbodocx.Tracking `json:"tracking,omitempty"`
				}{
					Organization: turbodocx.Organization{ID: "org-1", Name: "Acme", IsActive: true, UserCount: 5, CreatedOn: "2024-01-01"},
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"org", "get", "org-1"})
		require.NoError(t, err)
		out := buf.String()
		assert.Contains(t, out, "org-1")
		assert.Contains(t, out, "Acme")
	})
}

func TestOrgGetJSONOutput(t *testing.T) {
	mock := &mockPartnerClient{
		getOrganizationDetailsFn: func(ctx context.Context, orgID string) (*turbodocx.OrganizationDetailResponse, error) {
			return &turbodocx.OrganizationDetailResponse{
				Success: true,
				Data: struct {
					turbodocx.Organization
					Features *turbodocx.Features `json:"features,omitempty"`
					Tracking *turbodocx.Tracking `json:"tracking,omitempty"`
				}{
					Organization: turbodocx.Organization{ID: "org-1", Name: "Test"},
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executePartnerCmd([]string{"org", "get", "org-1"})
		require.NoError(t, err)

		var parsed turbodocx.OrganizationDetailResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.Equal(t, "org-1", parsed.Data.ID)
	})
}

func TestOrgGetError(t *testing.T) {
	mock := &mockPartnerClient{
		getOrganizationDetailsFn: func(ctx context.Context, orgID string) (*turbodocx.OrganizationDetailResponse, error) {
			return nil, &turbodocx.NotFoundError{TurboDocxError: turbodocx.TurboDocxError{
				Message: "Organization not found", StatusCode: 404,
			}}
		},
	}

	withMockClient(mock, func() {
		_, err := executePartnerCmd([]string{"org", "get", "bad-id"})
		assert.Error(t, err)
	})
}

// --- org update ---

func TestOrgUpdateHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		updateOrganizationInfoFn: func(ctx context.Context, orgID string, req *turbodocx.UpdateOrganizationRequest) (*turbodocx.OrganizationResponse, error) {
			assert.Equal(t, "org-1", orgID)
			assert.Equal(t, "New Name", req.Name)
			return &turbodocx.OrganizationResponse{
				Success: true,
				Data:    turbodocx.Organization{ID: "org-1", Name: "New Name"},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"org", "update", "org-1", "--name", "New Name"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "New Name")
	})
}

func TestOrgUpdateMissingName(t *testing.T) {
	mock := &mockPartnerClient{}
	withMockClient(mock, func() {
		_, err := executePartnerCmd([]string{"org", "update", "org-1"})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "required flag")
	})
}

// --- org delete ---

func TestOrgDeleteHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		deleteOrganizationFn: func(ctx context.Context, orgID string) (*turbodocx.SuccessResponse, error) {
			assert.Equal(t, "org-1", orgID)
			return &turbodocx.SuccessResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"org", "delete", "org-1"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "org-1 deleted")
	})
}

func TestOrgDeleteJSONOutput(t *testing.T) {
	mock := &mockPartnerClient{
		deleteOrganizationFn: func(ctx context.Context, orgID string) (*turbodocx.SuccessResponse, error) {
			return &turbodocx.SuccessResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executePartnerCmd([]string{"org", "delete", "org-1"})
		require.NoError(t, err)

		var parsed turbodocx.SuccessResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.True(t, parsed.Success)
	})
}

// --- org entitlements ---

func TestOrgEntitlementsHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		updateOrganizationEntitlementsFn: func(ctx context.Context, orgID string, req *turbodocx.UpdateEntitlementsRequest) (*turbodocx.EntitlementsResponse, error) {
			assert.Equal(t, "org-1", orgID)
			assert.NotNil(t, req.Features)
			return &turbodocx.EntitlementsResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"org", "entitlements", "org-1", "--features", `{"maxUsers":50}`})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "Entitlements updated")
	})
}

func TestOrgEntitlementsWithFiles(t *testing.T) {
	dir := t.TempDir()
	featFile := filepath.Join(dir, "features.json")
	err := os.WriteFile(featFile, []byte(`{"maxUsers":100}`), 0644)
	require.NoError(t, err)

	trackFile := filepath.Join(dir, "tracking.json")
	err = os.WriteFile(trackFile, []byte(`{"numUsers":10}`), 0644)
	require.NoError(t, err)

	mock := &mockPartnerClient{
		updateOrganizationEntitlementsFn: func(ctx context.Context, orgID string, req *turbodocx.UpdateEntitlementsRequest) (*turbodocx.EntitlementsResponse, error) {
			assert.NotNil(t, req.Features)
			assert.NotNil(t, req.Tracking)
			return &turbodocx.EntitlementsResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		_, err := executePartnerCmd([]string{"org", "entitlements", "org-1", "--features", "@" + featFile, "--tracking", "@" + trackFile})
		require.NoError(t, err)
	})
}

func TestOrgEntitlementsJSONOutput(t *testing.T) {
	mock := &mockPartnerClient{
		updateOrganizationEntitlementsFn: func(ctx context.Context, orgID string, req *turbodocx.UpdateEntitlementsRequest) (*turbodocx.EntitlementsResponse, error) {
			return &turbodocx.EntitlementsResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executePartnerCmd([]string{"org", "entitlements", "org-1", "--features", `{"maxUsers":50}`, "--tracking", `{"numUsers":5}`})
		require.NoError(t, err)

		var parsed turbodocx.EntitlementsResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.True(t, parsed.Success)
	})
}
