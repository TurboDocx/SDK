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

func TestUserListTableOutput(t *testing.T) {
	mock := &mockPartnerClient{
		listPartnerPortalUsersFn: func(ctx context.Context, req *turbodocx.ListPartnerUsersRequest) (*turbodocx.PartnerUserListResponse, error) {
			return &turbodocx.PartnerUserListResponse{
				Success: true,
				Data: struct {
					Results      []turbodocx.PartnerUser `json:"results"`
					TotalRecords int                     `json:"totalRecords"`
					Limit        int                     `json:"limit"`
					Offset       int                     `json:"offset"`
				}{
					Results: []turbodocx.PartnerUser{
						{ID: "pu-1", Email: "admin@test.com", Role: "admin", IsActive: true, CreatedOn: "2024-01-01"},
					},
					TotalRecords: 1,
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"user", "list"})
		require.NoError(t, err)
		out := buf.String()
		assert.Contains(t, out, "admin@test.com")
		assert.Contains(t, out, "admin")
	})
}

func TestUserListJSONOutput(t *testing.T) {
	mock := &mockPartnerClient{
		listPartnerPortalUsersFn: func(ctx context.Context, req *turbodocx.ListPartnerUsersRequest) (*turbodocx.PartnerUserListResponse, error) {
			return &turbodocx.PartnerUserListResponse{
				Success: true,
				Data: struct {
					Results      []turbodocx.PartnerUser `json:"results"`
					TotalRecords int                     `json:"totalRecords"`
					Limit        int                     `json:"limit"`
					Offset       int                     `json:"offset"`
				}{
					Results:      []turbodocx.PartnerUser{{ID: "pu-1"}},
					TotalRecords: 1,
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executePartnerCmd([]string{"user", "list"})
		require.NoError(t, err)

		var parsed turbodocx.PartnerUserListResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.Equal(t, 1, parsed.Data.TotalRecords)
	})
}

func TestUserAddHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		addUserToPartnerPortalFn: func(ctx context.Context, req *turbodocx.AddPartnerUserRequest) (*turbodocx.PartnerUserResponse, error) {
			assert.Equal(t, "new@test.com", req.Email)
			assert.Equal(t, "viewer", req.Role)
			return &turbodocx.PartnerUserResponse{
				Success: true,
				Data:    turbodocx.PartnerUser{ID: "pu-2", Email: "new@test.com", Role: "viewer"},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"user", "add", "--email", "new@test.com", "--role", "viewer"})
		require.NoError(t, err)
		out := buf.String()
		assert.Contains(t, out, "new@test.com")
		assert.Contains(t, out, "viewer")
	})
}

func TestUserAddWithPermissionsFile(t *testing.T) {
	dir := t.TempDir()
	permFile := filepath.Join(dir, "perms.json")
	err := os.WriteFile(permFile, []byte(`{"canManageOrgs":true,"canManageOrgUsers":false,"canManagePartnerUsers":false,"canManageOrgAPIKeys":false,"canManagePartnerAPIKeys":false,"canUpdateEntitlements":true,"canViewAuditLogs":false}`), 0644)
	require.NoError(t, err)

	mock := &mockPartnerClient{
		addUserToPartnerPortalFn: func(ctx context.Context, req *turbodocx.AddPartnerUserRequest) (*turbodocx.PartnerUserResponse, error) {
			assert.True(t, req.Permissions.CanManageOrgs)
			assert.True(t, req.Permissions.CanUpdateEntitlements)
			assert.False(t, req.Permissions.CanViewAuditLogs)
			return &turbodocx.PartnerUserResponse{
				Success: true,
				Data:    turbodocx.PartnerUser{ID: "pu-3", Email: "perms@test.com", Role: "admin"},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		_, err := executePartnerCmd([]string{"user", "add", "--email", "perms@test.com", "--role", "admin", "--permissions", "@" + permFile})
		require.NoError(t, err)
	})
}

func TestUserAddMissingFlags(t *testing.T) {
	mock := &mockPartnerClient{}
	withMockClient(mock, func() {
		_, err := executePartnerCmd([]string{"user", "add"})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "--email is required")
	})
}

func TestUserUpdateHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		updatePartnerUserPermissionsFn: func(ctx context.Context, userID string, req *turbodocx.UpdatePartnerUserRequest) (*turbodocx.PartnerUserUpdateResponse, error) {
			assert.Equal(t, "pu-1", userID)
			assert.Equal(t, "admin", req.Role)
			return &turbodocx.PartnerUserUpdateResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"user", "update", "pu-1", "--role", "admin"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "pu-1 updated")
	})
}

func TestUserUpdateWithPermissions(t *testing.T) {
	mock := &mockPartnerClient{
		updatePartnerUserPermissionsFn: func(ctx context.Context, userID string, req *turbodocx.UpdatePartnerUserRequest) (*turbodocx.PartnerUserUpdateResponse, error) {
			assert.NotNil(t, req.Permissions)
			assert.True(t, req.Permissions.CanViewAuditLogs)
			return &turbodocx.PartnerUserUpdateResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		_, err := executePartnerCmd([]string{"user", "update", "pu-1", "--permissions", `{"canManageOrgs":false,"canManageOrgUsers":false,"canManagePartnerUsers":false,"canManageOrgAPIKeys":false,"canManagePartnerAPIKeys":false,"canUpdateEntitlements":false,"canViewAuditLogs":true}`})
		require.NoError(t, err)
	})
}

func TestUserUpdateNoFlags(t *testing.T) {
	mock := &mockPartnerClient{}
	withMockClient(mock, func() {
		_, err := executePartnerCmd([]string{"user", "update", "pu-1"})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "at least one of")
	})
}

func TestUserRemoveHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		removeUserFromPartnerPortalFn: func(ctx context.Context, userID string) (*turbodocx.SuccessResponse, error) {
			assert.Equal(t, "pu-1", userID)
			return &turbodocx.SuccessResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"user", "remove", "pu-1"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "pu-1 removed")
	})
}

func TestUserResendHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		resendPartnerPortalInvitationFn: func(ctx context.Context, userID string) (*turbodocx.SuccessResponse, error) {
			assert.Equal(t, "pu-1", userID)
			return &turbodocx.SuccessResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"user", "resend-invite", "pu-1"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "Invitation resent")
	})
}

func TestUserResendJSONOutput(t *testing.T) {
	mock := &mockPartnerClient{
		resendPartnerPortalInvitationFn: func(ctx context.Context, userID string) (*turbodocx.SuccessResponse, error) {
			return &turbodocx.SuccessResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executePartnerCmd([]string{"user", "resend-invite", "pu-1"})
		require.NoError(t, err)

		var parsed turbodocx.SuccessResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.True(t, parsed.Success)
	})
}
