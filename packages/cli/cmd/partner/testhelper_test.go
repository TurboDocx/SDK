package partner

import (
	"bytes"
	"context"
	"fmt"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/TurboDocx/SDK/packages/cli/internal/config"
	"github.com/spf13/cobra"
	"github.com/spf13/pflag"
)

type mockPartnerClient struct {
	createOrganizationFn              func(ctx context.Context, req *turbodocx.CreateOrganizationRequest) (*turbodocx.OrganizationResponse, error)
	listOrganizationsFn               func(ctx context.Context, req *turbodocx.ListOrganizationsRequest) (*turbodocx.OrganizationListResponse, error)
	getOrganizationDetailsFn          func(ctx context.Context, orgID string) (*turbodocx.OrganizationDetailResponse, error)
	updateOrganizationInfoFn          func(ctx context.Context, orgID string, req *turbodocx.UpdateOrganizationRequest) (*turbodocx.OrganizationResponse, error)
	deleteOrganizationFn              func(ctx context.Context, orgID string) (*turbodocx.SuccessResponse, error)
	updateOrganizationEntitlementsFn  func(ctx context.Context, orgID string, req *turbodocx.UpdateEntitlementsRequest) (*turbodocx.EntitlementsResponse, error)
	listOrganizationUsersFn           func(ctx context.Context, orgID string, req *turbodocx.ListOrgUsersRequest) (*turbodocx.OrgUserListResponse, error)
	addUserToOrganizationFn           func(ctx context.Context, orgID string, req *turbodocx.AddOrgUserRequest) (*turbodocx.OrgUserResponse, error)
	updateOrganizationUserRoleFn      func(ctx context.Context, orgID, userID string, req *turbodocx.UpdateOrgUserRequest) (*turbodocx.OrgUserResponse, error)
	removeUserFromOrganizationFn      func(ctx context.Context, orgID, userID string) (*turbodocx.SuccessResponse, error)
	resendOrganizationInvitationFn    func(ctx context.Context, orgID, userID string) (*turbodocx.SuccessResponse, error)
	listOrganizationApiKeysFn         func(ctx context.Context, orgID string, req *turbodocx.ListOrgApiKeysRequest) (*turbodocx.OrgApiKeyListResponse, error)
	createOrganizationApiKeyFn        func(ctx context.Context, orgID string, req *turbodocx.CreateOrgApiKeyRequest) (*turbodocx.OrgApiKeyResponse, error)
	updateOrganizationApiKeyFn        func(ctx context.Context, orgID, keyID string, req *turbodocx.UpdateOrgApiKeyRequest) (*turbodocx.OrgApiKeyUpdateResponse, error)
	revokeOrganizationApiKeyFn        func(ctx context.Context, orgID, keyID string) (*turbodocx.SuccessResponse, error)
	listPartnerApiKeysFn              func(ctx context.Context, req *turbodocx.ListPartnerApiKeysRequest) (*turbodocx.PartnerApiKeyListResponse, error)
	createPartnerApiKeyFn             func(ctx context.Context, req *turbodocx.CreatePartnerApiKeyRequest) (*turbodocx.PartnerApiKeyResponse, error)
	updatePartnerApiKeyFn             func(ctx context.Context, keyID string, req *turbodocx.UpdatePartnerApiKeyRequest) (*turbodocx.PartnerApiKeyUpdateResponse, error)
	revokePartnerApiKeyFn             func(ctx context.Context, keyID string) (*turbodocx.SuccessResponse, error)
	listPartnerPortalUsersFn          func(ctx context.Context, req *turbodocx.ListPartnerUsersRequest) (*turbodocx.PartnerUserListResponse, error)
	addUserToPartnerPortalFn          func(ctx context.Context, req *turbodocx.AddPartnerUserRequest) (*turbodocx.PartnerUserResponse, error)
	updatePartnerUserPermissionsFn    func(ctx context.Context, userID string, req *turbodocx.UpdatePartnerUserRequest) (*turbodocx.PartnerUserUpdateResponse, error)
	removeUserFromPartnerPortalFn     func(ctx context.Context, userID string) (*turbodocx.SuccessResponse, error)
	resendPartnerPortalInvitationFn   func(ctx context.Context, userID string) (*turbodocx.SuccessResponse, error)
	getPartnerAuditLogsFn             func(ctx context.Context, req *turbodocx.ListAuditLogsRequest) (*turbodocx.AuditLogListResponse, error)
}

func (m *mockPartnerClient) CreateOrganization(ctx context.Context, req *turbodocx.CreateOrganizationRequest) (*turbodocx.OrganizationResponse, error) {
	if m.createOrganizationFn != nil {
		return m.createOrganizationFn(ctx, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) ListOrganizations(ctx context.Context, req *turbodocx.ListOrganizationsRequest) (*turbodocx.OrganizationListResponse, error) {
	if m.listOrganizationsFn != nil {
		return m.listOrganizationsFn(ctx, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) GetOrganizationDetails(ctx context.Context, orgID string) (*turbodocx.OrganizationDetailResponse, error) {
	if m.getOrganizationDetailsFn != nil {
		return m.getOrganizationDetailsFn(ctx, orgID)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) UpdateOrganizationInfo(ctx context.Context, orgID string, req *turbodocx.UpdateOrganizationRequest) (*turbodocx.OrganizationResponse, error) {
	if m.updateOrganizationInfoFn != nil {
		return m.updateOrganizationInfoFn(ctx, orgID, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) DeleteOrganization(ctx context.Context, orgID string) (*turbodocx.SuccessResponse, error) {
	if m.deleteOrganizationFn != nil {
		return m.deleteOrganizationFn(ctx, orgID)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) UpdateOrganizationEntitlements(ctx context.Context, orgID string, req *turbodocx.UpdateEntitlementsRequest) (*turbodocx.EntitlementsResponse, error) {
	if m.updateOrganizationEntitlementsFn != nil {
		return m.updateOrganizationEntitlementsFn(ctx, orgID, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) ListOrganizationUsers(ctx context.Context, orgID string, req *turbodocx.ListOrgUsersRequest) (*turbodocx.OrgUserListResponse, error) {
	if m.listOrganizationUsersFn != nil {
		return m.listOrganizationUsersFn(ctx, orgID, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) AddUserToOrganization(ctx context.Context, orgID string, req *turbodocx.AddOrgUserRequest) (*turbodocx.OrgUserResponse, error) {
	if m.addUserToOrganizationFn != nil {
		return m.addUserToOrganizationFn(ctx, orgID, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) UpdateOrganizationUserRole(ctx context.Context, orgID, userID string, req *turbodocx.UpdateOrgUserRequest) (*turbodocx.OrgUserResponse, error) {
	if m.updateOrganizationUserRoleFn != nil {
		return m.updateOrganizationUserRoleFn(ctx, orgID, userID, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) RemoveUserFromOrganization(ctx context.Context, orgID, userID string) (*turbodocx.SuccessResponse, error) {
	if m.removeUserFromOrganizationFn != nil {
		return m.removeUserFromOrganizationFn(ctx, orgID, userID)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) ResendOrganizationInvitationToUser(ctx context.Context, orgID, userID string) (*turbodocx.SuccessResponse, error) {
	if m.resendOrganizationInvitationFn != nil {
		return m.resendOrganizationInvitationFn(ctx, orgID, userID)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) ListOrganizationApiKeys(ctx context.Context, orgID string, req *turbodocx.ListOrgApiKeysRequest) (*turbodocx.OrgApiKeyListResponse, error) {
	if m.listOrganizationApiKeysFn != nil {
		return m.listOrganizationApiKeysFn(ctx, orgID, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) CreateOrganizationApiKey(ctx context.Context, orgID string, req *turbodocx.CreateOrgApiKeyRequest) (*turbodocx.OrgApiKeyResponse, error) {
	if m.createOrganizationApiKeyFn != nil {
		return m.createOrganizationApiKeyFn(ctx, orgID, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) UpdateOrganizationApiKey(ctx context.Context, orgID, keyID string, req *turbodocx.UpdateOrgApiKeyRequest) (*turbodocx.OrgApiKeyUpdateResponse, error) {
	if m.updateOrganizationApiKeyFn != nil {
		return m.updateOrganizationApiKeyFn(ctx, orgID, keyID, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) RevokeOrganizationApiKey(ctx context.Context, orgID, keyID string) (*turbodocx.SuccessResponse, error) {
	if m.revokeOrganizationApiKeyFn != nil {
		return m.revokeOrganizationApiKeyFn(ctx, orgID, keyID)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) ListPartnerApiKeys(ctx context.Context, req *turbodocx.ListPartnerApiKeysRequest) (*turbodocx.PartnerApiKeyListResponse, error) {
	if m.listPartnerApiKeysFn != nil {
		return m.listPartnerApiKeysFn(ctx, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) CreatePartnerApiKey(ctx context.Context, req *turbodocx.CreatePartnerApiKeyRequest) (*turbodocx.PartnerApiKeyResponse, error) {
	if m.createPartnerApiKeyFn != nil {
		return m.createPartnerApiKeyFn(ctx, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) UpdatePartnerApiKey(ctx context.Context, keyID string, req *turbodocx.UpdatePartnerApiKeyRequest) (*turbodocx.PartnerApiKeyUpdateResponse, error) {
	if m.updatePartnerApiKeyFn != nil {
		return m.updatePartnerApiKeyFn(ctx, keyID, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) RevokePartnerApiKey(ctx context.Context, keyID string) (*turbodocx.SuccessResponse, error) {
	if m.revokePartnerApiKeyFn != nil {
		return m.revokePartnerApiKeyFn(ctx, keyID)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) ListPartnerPortalUsers(ctx context.Context, req *turbodocx.ListPartnerUsersRequest) (*turbodocx.PartnerUserListResponse, error) {
	if m.listPartnerPortalUsersFn != nil {
		return m.listPartnerPortalUsersFn(ctx, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) AddUserToPartnerPortal(ctx context.Context, req *turbodocx.AddPartnerUserRequest) (*turbodocx.PartnerUserResponse, error) {
	if m.addUserToPartnerPortalFn != nil {
		return m.addUserToPartnerPortalFn(ctx, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) UpdatePartnerUserPermissions(ctx context.Context, userID string, req *turbodocx.UpdatePartnerUserRequest) (*turbodocx.PartnerUserUpdateResponse, error) {
	if m.updatePartnerUserPermissionsFn != nil {
		return m.updatePartnerUserPermissionsFn(ctx, userID, req)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) RemoveUserFromPartnerPortal(ctx context.Context, userID string) (*turbodocx.SuccessResponse, error) {
	if m.removeUserFromPartnerPortalFn != nil {
		return m.removeUserFromPartnerPortalFn(ctx, userID)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) ResendPartnerPortalInvitationToUser(ctx context.Context, userID string) (*turbodocx.SuccessResponse, error) {
	if m.resendPartnerPortalInvitationFn != nil {
		return m.resendPartnerPortalInvitationFn(ctx, userID)
	}
	return nil, fmt.Errorf("not implemented")
}

func (m *mockPartnerClient) GetPartnerAuditLogs(ctx context.Context, req *turbodocx.ListAuditLogsRequest) (*turbodocx.AuditLogListResponse, error) {
	if m.getPartnerAuditLogsFn != nil {
		return m.getPartnerAuditLogsFn(ctx, req)
	}
	return nil, fmt.Errorf("not implemented")
}

// withMockClient replaces newPartnerClient with a mock for the duration of fn
func withMockClient(mock *mockPartnerClient, fn func()) {
	original := newPartnerClient
	newPartnerClient = func(cfg *config.Config) (PartnerClient, error) {
		return mock, nil
	}
	defer func() { newPartnerClient = original }()
	fn()
}

// resetFlags resets all flag values in a command tree to their defaults
func resetFlags(cmd *cobra.Command) {
	cmd.Flags().VisitAll(func(f *pflag.Flag) {
		f.Value.Set(f.DefValue)
		f.Changed = false
	})
	for _, child := range cmd.Commands() {
		resetFlags(child)
	}
}

// executePartnerCmd creates a fresh command tree and executes with the given args
func executePartnerCmd(args []string) (*bytes.Buffer, error) {
	root := &cobra.Command{Use: "test"}
	root.AddCommand(PartnerCmd)
	resetFlags(PartnerCmd)

	var buf bytes.Buffer
	root.SetOut(&buf)
	root.SetErr(&buf)
	root.SetArgs(append([]string{"partner"}, args...))

	err := root.Execute()
	return &buf, err
}
