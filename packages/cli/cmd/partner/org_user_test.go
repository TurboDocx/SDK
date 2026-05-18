package partner

import (
	"context"
	"encoding/json"
	"testing"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestOrgUserListTableOutput(t *testing.T) {
	mock := &mockPartnerClient{
		listOrganizationUsersFn: func(ctx context.Context, orgID string, req *turbodocx.ListOrgUsersRequest) (*turbodocx.OrgUserListResponse, error) {
			assert.Equal(t, "org-1", orgID)
			return &turbodocx.OrgUserListResponse{
				Success: true,
				Data: struct {
					Results      []turbodocx.OrganizationUser `json:"results"`
					TotalRecords int                          `json:"totalRecords"`
					Limit        int                          `json:"limit"`
					Offset       int                          `json:"offset"`
				}{
					Results: []turbodocx.OrganizationUser{
						{ID: "u-1", Email: "alice@test.com", Role: "admin", IsActive: true, CreatedOn: "2024-01-01"},
					},
					TotalRecords: 1,
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"org", "user", "list", "org-1"})
		require.NoError(t, err)
		out := buf.String()
		assert.Contains(t, out, "alice@test.com")
		assert.Contains(t, out, "admin")
	})
}

func TestOrgUserListJSONOutput(t *testing.T) {
	mock := &mockPartnerClient{
		listOrganizationUsersFn: func(ctx context.Context, orgID string, req *turbodocx.ListOrgUsersRequest) (*turbodocx.OrgUserListResponse, error) {
			return &turbodocx.OrgUserListResponse{
				Success: true,
				Data: struct {
					Results      []turbodocx.OrganizationUser `json:"results"`
					TotalRecords int                          `json:"totalRecords"`
					Limit        int                          `json:"limit"`
					Offset       int                          `json:"offset"`
				}{
					Results:      []turbodocx.OrganizationUser{{ID: "u-1", Email: "a@test.com"}},
					TotalRecords: 1,
				},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executePartnerCmd([]string{"org", "user", "list", "org-1"})
		require.NoError(t, err)

		var parsed turbodocx.OrgUserListResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.Equal(t, 1, parsed.Data.TotalRecords)
	})
}

func TestOrgUserAddHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		addUserToOrganizationFn: func(ctx context.Context, orgID string, req *turbodocx.AddOrgUserRequest) (*turbodocx.OrgUserResponse, error) {
			assert.Equal(t, "org-1", orgID)
			assert.Equal(t, "john@test.com", req.Email)
			assert.Equal(t, "member", req.Role)
			return &turbodocx.OrgUserResponse{
				Success: true,
				Data:    turbodocx.OrganizationUser{ID: "u-2", Email: "john@test.com", Role: "member"},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"org", "user", "add", "org-1", "--email", "john@test.com", "--role", "member"})
		require.NoError(t, err)
		out := buf.String()
		assert.Contains(t, out, "john@test.com")
		assert.Contains(t, out, "member")
	})
}

func TestOrgUserAddMissingFlags(t *testing.T) {
	mock := &mockPartnerClient{}
	withMockClient(mock, func() {
		_, err := executePartnerCmd([]string{"org", "user", "add", "org-1"})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "--email is required")
	})
}

func TestOrgUserUpdateHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		updateOrganizationUserRoleFn: func(ctx context.Context, orgID, userID string, req *turbodocx.UpdateOrgUserRequest) (*turbodocx.OrgUserResponse, error) {
			assert.Equal(t, "org-1", orgID)
			assert.Equal(t, "u-1", userID)
			assert.Equal(t, "admin", req.Role)
			return &turbodocx.OrgUserResponse{
				Success: true,
				Data:    turbodocx.OrganizationUser{ID: "u-1", Role: "admin"},
			}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"org", "user", "update", "org-1", "u-1", "--role", "admin"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "role updated")
	})
}

func TestOrgUserUpdateMissingRole(t *testing.T) {
	mock := &mockPartnerClient{}
	withMockClient(mock, func() {
		_, err := executePartnerCmd([]string{"org", "user", "update", "org-1", "u-1"})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "--role is required")
	})
}

func TestOrgUserRemoveHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		removeUserFromOrganizationFn: func(ctx context.Context, orgID, userID string) (*turbodocx.SuccessResponse, error) {
			assert.Equal(t, "org-1", orgID)
			assert.Equal(t, "u-1", userID)
			return &turbodocx.SuccessResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"org", "user", "remove", "org-1", "u-1"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "u-1 removed")
	})
}

func TestOrgUserResendHumanOutput(t *testing.T) {
	mock := &mockPartnerClient{
		resendOrganizationInvitationFn: func(ctx context.Context, orgID, userID string) (*turbodocx.SuccessResponse, error) {
			assert.Equal(t, "org-1", orgID)
			assert.Equal(t, "u-1", userID)
			return &turbodocx.SuccessResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = false
		buf, err := executePartnerCmd([]string{"org", "user", "resend-invite", "org-1", "u-1"})
		require.NoError(t, err)
		assert.Contains(t, buf.String(), "Invitation resent")
	})
}

func TestOrgUserResendJSONOutput(t *testing.T) {
	mock := &mockPartnerClient{
		resendOrganizationInvitationFn: func(ctx context.Context, orgID, userID string) (*turbodocx.SuccessResponse, error) {
			return &turbodocx.SuccessResponse{Success: true}, nil
		},
	}

	withMockClient(mock, func() {
		jsonMode = true
		defer func() { jsonMode = false }()

		buf, err := executePartnerCmd([]string{"org", "user", "resend-invite", "org-1", "u-1"})
		require.NoError(t, err)

		var parsed turbodocx.SuccessResponse
		err = json.Unmarshal(buf.Bytes(), &parsed)
		require.NoError(t, err)
		assert.True(t, parsed.Success)
	})
}
