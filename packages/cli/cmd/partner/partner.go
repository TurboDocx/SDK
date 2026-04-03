package partner

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/config"
	"github.com/spf13/cobra"
)

// PartnerClient defines the interface for TurboPartner operations (mockable in tests)
type PartnerClient interface {
	// Organization CRUD
	CreateOrganization(ctx context.Context, req *turbodocx.CreateOrganizationRequest) (*turbodocx.OrganizationResponse, error)
	ListOrganizations(ctx context.Context, req *turbodocx.ListOrganizationsRequest) (*turbodocx.OrganizationListResponse, error)
	GetOrganizationDetails(ctx context.Context, orgID string) (*turbodocx.OrganizationDetailResponse, error)
	UpdateOrganizationInfo(ctx context.Context, orgID string, req *turbodocx.UpdateOrganizationRequest) (*turbodocx.OrganizationResponse, error)
	DeleteOrganization(ctx context.Context, orgID string) (*turbodocx.SuccessResponse, error)
	UpdateOrganizationEntitlements(ctx context.Context, orgID string, req *turbodocx.UpdateEntitlementsRequest) (*turbodocx.EntitlementsResponse, error)

	// Organization Users
	ListOrganizationUsers(ctx context.Context, orgID string, req *turbodocx.ListOrgUsersRequest) (*turbodocx.OrgUserListResponse, error)
	AddUserToOrganization(ctx context.Context, orgID string, req *turbodocx.AddOrgUserRequest) (*turbodocx.OrgUserResponse, error)
	UpdateOrganizationUserRole(ctx context.Context, orgID, userID string, req *turbodocx.UpdateOrgUserRequest) (*turbodocx.OrgUserResponse, error)
	RemoveUserFromOrganization(ctx context.Context, orgID, userID string) (*turbodocx.SuccessResponse, error)
	ResendOrganizationInvitationToUser(ctx context.Context, orgID, userID string) (*turbodocx.SuccessResponse, error)

	// Organization API Keys
	ListOrganizationApiKeys(ctx context.Context, orgID string, req *turbodocx.ListOrgApiKeysRequest) (*turbodocx.OrgApiKeyListResponse, error)
	CreateOrganizationApiKey(ctx context.Context, orgID string, req *turbodocx.CreateOrgApiKeyRequest) (*turbodocx.OrgApiKeyResponse, error)
	UpdateOrganizationApiKey(ctx context.Context, orgID, keyID string, req *turbodocx.UpdateOrgApiKeyRequest) (*turbodocx.OrgApiKeyUpdateResponse, error)
	RevokeOrganizationApiKey(ctx context.Context, orgID, keyID string) (*turbodocx.SuccessResponse, error)

	// Partner API Keys
	ListPartnerApiKeys(ctx context.Context, req *turbodocx.ListPartnerApiKeysRequest) (*turbodocx.PartnerApiKeyListResponse, error)
	CreatePartnerApiKey(ctx context.Context, req *turbodocx.CreatePartnerApiKeyRequest) (*turbodocx.PartnerApiKeyResponse, error)
	UpdatePartnerApiKey(ctx context.Context, keyID string, req *turbodocx.UpdatePartnerApiKeyRequest) (*turbodocx.PartnerApiKeyUpdateResponse, error)
	RevokePartnerApiKey(ctx context.Context, keyID string) (*turbodocx.SuccessResponse, error)

	// Partner Users
	ListPartnerPortalUsers(ctx context.Context, req *turbodocx.ListPartnerUsersRequest) (*turbodocx.PartnerUserListResponse, error)
	AddUserToPartnerPortal(ctx context.Context, req *turbodocx.AddPartnerUserRequest) (*turbodocx.PartnerUserResponse, error)
	UpdatePartnerUserPermissions(ctx context.Context, userID string, req *turbodocx.UpdatePartnerUserRequest) (*turbodocx.PartnerUserUpdateResponse, error)
	RemoveUserFromPartnerPortal(ctx context.Context, userID string) (*turbodocx.SuccessResponse, error)
	ResendPartnerPortalInvitationToUser(ctx context.Context, userID string) (*turbodocx.SuccessResponse, error)

	// Audit Logs
	GetPartnerAuditLogs(ctx context.Context, req *turbodocx.ListAuditLogsRequest) (*turbodocx.AuditLogListResponse, error)
}

// PartnerClientFactory creates a PartnerClient from config. Package-level var for test injection.
type PartnerClientFactory func(cfg *config.Config) (PartnerClient, error)

// newPartnerClient creates a real SDK client. Replaceable in tests.
var newPartnerClient PartnerClientFactory = defaultNewPartnerClient

func defaultNewPartnerClient(cfg *config.Config) (PartnerClient, error) {
	if cfg.PartnerAPIKey == "" {
		return nil, fmt.Errorf("Partner API key is required. Run 'turbodocx config set partnerApiKey <key>' or pass --partner-api-key")
	}
	if cfg.PartnerID == "" {
		return nil, fmt.Errorf("Partner ID is required. Run 'turbodocx config set partnerId <id>' or pass --partner-id")
	}

	client, err := turbodocx.NewPartnerClient(turbodocx.PartnerConfig{
		PartnerAPIKey: cfg.PartnerAPIKey,
		PartnerID:     cfg.PartnerID,
		BaseURL:       cfg.BaseURL,
	})
	if err != nil {
		return nil, err
	}
	return client, nil
}

// parseJSONOrFile parses a string as JSON, or reads from a file if it starts with @
func parseJSONOrFile(input string, target interface{}) error {
	var data []byte
	if strings.HasPrefix(input, "@") {
		filePath := input[1:]
		var err error
		data, err = os.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("failed to read file %s: %w", filePath, err)
		}
	} else {
		data = []byte(input)
	}
	return json.Unmarshal(data, target)
}

// jsonMode is a package-level var for test control. In production, use cmdutil.IsJSON().
var jsonMode bool

func isJSONMode() bool {
	return jsonMode || cmdutil.IsJSON()
}

// PartnerCmd is the parent partner command
var PartnerCmd = &cobra.Command{
	Use:   "partner",
	Short: "Partner portal management",
	Long:  "Manage TurboPartner organizations, users, API keys, entitlements, and audit logs.",
}

// orgCmd is the parent org subcommand
var orgCmd = &cobra.Command{
	Use:   "org",
	Short: "Organization management",
}

// orgUserCmd is the parent org user subcommand
var orgUserCmd = &cobra.Command{
	Use:   "user",
	Short: "Organization user management",
}

// orgApikeyCmd is the parent org apikey subcommand
var orgApikeyCmd = &cobra.Command{
	Use:   "apikey",
	Short: "Organization API key management",
}

// apikeyCmd is the parent partner apikey subcommand
var apikeyCmd = &cobra.Command{
	Use:   "apikey",
	Short: "Partner API key management",
}

// userCmd is the parent partner user subcommand
var userCmd = &cobra.Command{
	Use:   "user",
	Short: "Partner portal user management",
}

// auditCmd is the parent audit subcommand
var auditCmd = &cobra.Command{
	Use:   "audit",
	Short: "Audit log management",
}

func init() {
	PartnerCmd.AddCommand(orgCmd)
	PartnerCmd.AddCommand(apikeyCmd)
	PartnerCmd.AddCommand(userCmd)
	PartnerCmd.AddCommand(auditCmd)

	orgCmd.AddCommand(orgUserCmd)
	orgCmd.AddCommand(orgApikeyCmd)
}
