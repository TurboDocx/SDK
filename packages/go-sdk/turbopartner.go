package turbodocx

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"strconv"
)

// PartnerConfig holds configuration for the TurboPartner client
type PartnerConfig struct {
	// PartnerAPIKey is your partner API key (required, must start with TDXP-)
	PartnerAPIKey string

	// PartnerID is your partner UUID (required)
	PartnerID string

	// BaseURL is the API base URL (optional, default: https://api.turbodocx.com)
	BaseURL string
}

// PartnerClient provides TurboPartner partner management operations
type PartnerClient struct {
	http      *HTTPClient
	partnerID string
}

// NewPartnerClient creates a new TurboPartner client with the given config
func NewPartnerClient(config PartnerConfig) (*PartnerClient, error) {
	if config.PartnerAPIKey == "" {
		config.PartnerAPIKey = os.Getenv("TURBODOCX_PARTNER_API_KEY")
	}
	if config.PartnerID == "" {
		config.PartnerID = os.Getenv("TURBODOCX_PARTNER_ID")
	}
	if config.BaseURL == "" {
		config.BaseURL = os.Getenv("TURBODOCX_BASE_URL")
	}
	if config.BaseURL == "" {
		config.BaseURL = "https://api.turbodocx.com"
	}

	if config.PartnerAPIKey == "" {
		return nil, &AuthenticationError{TurboDocxError: TurboDocxError{
			Message:    "Partner API key is required. Set PartnerAPIKey in config or TURBODOCX_PARTNER_API_KEY environment variable.",
			StatusCode: 401,
		}}
	}
	if config.PartnerID == "" {
		return nil, &AuthenticationError{TurboDocxError: TurboDocxError{
			Message:    "Partner ID is required. Set PartnerID in config or TURBODOCX_PARTNER_ID environment variable.",
			StatusCode: 401,
		}}
	}

	httpClient := NewHTTPClient(ClientConfig{
		APIKey:  config.PartnerAPIKey,
		BaseURL: config.BaseURL,
	})

	return &PartnerClient{
		http:      httpClient,
		partnerID: config.PartnerID,
	}, nil
}

func (c *PartnerClient) basePath() string {
	return "/partner/" + c.partnerID
}

// --- Query param helpers ---

func buildQuery(params url.Values) string {
	encoded := params.Encode()
	if encoded == "" {
		return ""
	}
	return "?" + encoded
}

func addPaginationParams(q url.Values, limit, offset *int, search string) {
	if limit != nil {
		q.Set("limit", strconv.Itoa(*limit))
	}
	if offset != nil {
		q.Set("offset", strconv.Itoa(*offset))
	}
	if search != "" {
		q.Set("search", search)
	}
}

// =============================================
// Domain Types
// =============================================

// Organization represents a partner organization
type Organization struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	PartnerID   string                 `json:"partnerId,omitempty"`
	CreatedOn   string                 `json:"createdOn,omitempty"`
	UpdatedOn   string                 `json:"updatedOn,omitempty"`
	CreatedBy   string                 `json:"createdBy,omitempty"`
	IsActive    bool                   `json:"isActive,omitempty"`
	UserCount   int                    `json:"userCount,omitempty"`
	StorageUsed int64                  `json:"storageUsed,omitempty"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}

// OrganizationUser represents a user in an organization
type OrganizationUser struct {
	ID        string `json:"id"`
	Email     string `json:"email"`
	FirstName string `json:"firstName,omitempty"`
	LastName  string `json:"lastName,omitempty"`
	SsoID     string `json:"ssoId,omitempty"`
	Role      string `json:"role,omitempty"`
	CreatedOn string `json:"createdOn,omitempty"`
	IsActive  bool   `json:"isActive,omitempty"`
}

// OrgApiKey represents an organization API key
type OrgApiKey struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Key        string   `json:"key,omitempty"`
	Role       string   `json:"role,omitempty"`
	Scopes     []string `json:"scopes,omitempty"`
	CreatedOn  string   `json:"createdOn,omitempty"`
	CreatedBy  string   `json:"createdBy,omitempty"`
	LastUsedOn string   `json:"lastUsedOn,omitempty"`
	LastUsedIP string   `json:"lastUsedIP,omitempty"`
	UpdatedOn  string   `json:"updatedOn,omitempty"`
}

// PartnerApiKey represents a partner-level API key
type PartnerApiKey struct {
	ID          string   `json:"id"`
	Name        string   `json:"name"`
	Key         string   `json:"key,omitempty"`
	Description string   `json:"description,omitempty"`
	Scopes      []string `json:"scopes,omitempty"`
	CreatedOn   string   `json:"createdOn,omitempty"`
	CreatedBy   string   `json:"createdBy,omitempty"`
	LastUsedOn  string   `json:"lastUsedOn,omitempty"`
	LastUsedIP  string   `json:"lastUsedIP,omitempty"`
	UpdatedOn   string   `json:"updatedOn,omitempty"`
}

// PartnerUser represents a user in the partner portal
type PartnerUser struct {
	ID             string              `json:"id"`
	Email          string              `json:"email"`
	FirstName      string              `json:"firstName,omitempty"`
	LastName       string              `json:"lastName,omitempty"`
	SsoID          string              `json:"ssoId,omitempty"`
	Role           string              `json:"role,omitempty"`
	Permissions    *PartnerPermissions `json:"permissions,omitempty"`
	IsPrimaryAdmin bool                `json:"isPrimaryAdmin,omitempty"`
	CreatedOn      string              `json:"createdOn,omitempty"`
	IsActive       bool                `json:"isActive,omitempty"`
}

// PartnerPermissions represents the permissions for a partner portal user
type PartnerPermissions struct {
	CanManageOrgs          bool `json:"canManageOrgs"`
	CanManageOrgUsers      bool `json:"canManageOrgUsers"`
	CanManagePartnerUsers  bool `json:"canManagePartnerUsers"`
	CanManageOrgAPIKeys    bool `json:"canManageOrgAPIKeys"`
	CanManagePartnerAPIKeys bool `json:"canManagePartnerAPIKeys"`
	CanUpdateEntitlements  bool `json:"canUpdateEntitlements"`
	CanViewAuditLogs       bool `json:"canViewAuditLogs"`
}

// Features represents settable entitlement limits for an organization
type Features struct {
	OrgID                    string `json:"orgId,omitempty"`
	MaxUsers                 *int   `json:"maxUsers,omitempty"`
	MaxProjectspaces         *int   `json:"maxProjectspaces,omitempty"`
	MaxTemplates             *int   `json:"maxTemplates,omitempty"`
	MaxStorage               *int64 `json:"maxStorage,omitempty"`
	MaxGeneratedDeliverables *int   `json:"maxGeneratedDeliverables,omitempty"`
	MaxSignatures            *int   `json:"maxSignatures,omitempty"`
	MaxAICredits             *int   `json:"maxAICredits,omitempty"`
	RdWatermark              *bool  `json:"rdWatermark,omitempty"`
	HasFileDownload          *bool  `json:"hasFileDownload,omitempty"`
	HasAdvancedDateFormats   *bool  `json:"hasAdvancedDateFormats,omitempty"`
	HasGDrive                *bool  `json:"hasGDrive,omitempty"`
	HasSharepoint            *bool  `json:"hasSharepoint,omitempty"`
	HasSharepointOnly        *bool  `json:"hasSharepointOnly,omitempty"`
	HasTDAI                  *bool  `json:"hasTDAI,omitempty"`
	HasPptx                  *bool  `json:"hasPptx,omitempty"`
	HasTDWriter              *bool  `json:"hasTDWriter,omitempty"`
	HasSalesforce            *bool  `json:"hasSalesforce,omitempty"`
	HasWrike                 *bool  `json:"hasWrike,omitempty"`
	HasVariableStack         *bool  `json:"hasVariableStack,omitempty"`
	HasSubvariables          *bool  `json:"hasSubvariables,omitempty"`
	HasZapier                *bool  `json:"hasZapier,omitempty"`
	HasBYOM                  *bool  `json:"hasBYOM,omitempty"`
	HasBYOVS                 *bool  `json:"hasBYOVS,omitempty"`
	HasBetaFeatures          *bool  `json:"hasBetaFeatures,omitempty"`
	EnableBulkSending        *bool  `json:"enableBulkSending,omitempty"`
	CreatedBy                string `json:"createdBy,omitempty"`
}

// Tracking represents read-only usage counters for an organization
type Tracking struct {
	NumUsers                 int   `json:"numUsers,omitempty"`
	NumProjectspaces         int   `json:"numProjectspaces,omitempty"`
	NumTemplates             int   `json:"numTemplates,omitempty"`
	StorageUsed              int64 `json:"storageUsed,omitempty"`
	NumGeneratedDeliverables int   `json:"numGeneratedDeliverables,omitempty"`
	NumSignaturesUsed        int   `json:"numSignaturesUsed,omitempty"`
	CurrentAICredits         int   `json:"currentAICredits,omitempty"`
}

// AuditLogEntry represents a single audit log entry
type AuditLogEntry struct {
	ID              string                 `json:"id"`
	PartnerID       string                 `json:"partnerId"`
	PartnerAPIKeyID string                 `json:"partnerAPIKeyId,omitempty"`
	Action          string                 `json:"action,omitempty"`
	ResourceType    string                 `json:"resourceType,omitempty"`
	ResourceID      string                 `json:"resourceId,omitempty"`
	Details         map[string]interface{} `json:"details,omitempty"`
	Success         bool                   `json:"success,omitempty"`
	IPAddress       string                 `json:"ipAddress,omitempty"`
	UserAgent       string                 `json:"userAgent,omitempty"`
	CreatedOn       string                 `json:"createdOn,omitempty"`
}

// =============================================
// Partner Scope Constants
// =============================================

const (
	ScopeOrgCreate           = "org:create"
	ScopeOrgRead             = "org:read"
	ScopeOrgUpdate           = "org:update"
	ScopeOrgDelete           = "org:delete"
	ScopeEntitlementsUpdate  = "entitlements:update"
	ScopeOrgUsersCreate      = "org-users:create"
	ScopeOrgUsersRead        = "org-users:read"
	ScopeOrgUsersUpdate      = "org-users:update"
	ScopeOrgUsersDelete      = "org-users:delete"
	ScopePartnerUsersCreate  = "partner-users:create"
	ScopePartnerUsersRead    = "partner-users:read"
	ScopePartnerUsersUpdate  = "partner-users:update"
	ScopePartnerUsersDelete  = "partner-users:delete"
	ScopeOrgApikeysCreate    = "org-apikeys:create"
	ScopeOrgApikeysRead      = "org-apikeys:read"
	ScopeOrgApikeysUpdate    = "org-apikeys:update"
	ScopeOrgApikeysDelete    = "org-apikeys:delete"
	ScopePartnerApikeysCreate = "partner-apikeys:create"
	ScopePartnerApikeysRead  = "partner-apikeys:read"
	ScopePartnerApikeysUpdate = "partner-apikeys:update"
	ScopePartnerApikeysDelete = "partner-apikeys:delete"
	ScopeAuditRead           = "audit:read"
)

// =============================================
// Request Types
// =============================================

// CreateOrganizationRequest is the request to create an organization
type CreateOrganizationRequest struct {
	Name     string                 `json:"name"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
	Features *Features              `json:"features,omitempty"`
}

// ListOrganizationsRequest is the request to list organizations
type ListOrganizationsRequest struct {
	Limit  *int
	Offset *int
	Search string
}

// UpdateOrganizationRequest is the request to update an organization
type UpdateOrganizationRequest struct {
	Name string `json:"name"`
}

// UpdateEntitlementsRequest is the request to update organization entitlements
type UpdateEntitlementsRequest struct {
	Features *Features `json:"features,omitempty"`
	Tracking *Tracking `json:"tracking,omitempty"`
}

// AddOrgUserRequest is the request to add a user to an organization
type AddOrgUserRequest struct {
	Email string `json:"email"`
	Role  string `json:"role"`
}

// ListOrgUsersRequest is the request to list organization users
type ListOrgUsersRequest struct {
	Limit  *int
	Offset *int
	Search string
}

// UpdateOrgUserRequest is the request to update an organization user's role
type UpdateOrgUserRequest struct {
	Role string `json:"role"`
}

// CreateOrgApiKeyRequest is the request to create an organization API key
type CreateOrgApiKeyRequest struct {
	Name string `json:"name"`
	Role string `json:"role"`
}

// ListOrgApiKeysRequest is the request to list organization API keys
type ListOrgApiKeysRequest struct {
	Limit  *int
	Offset *int
	Search string
}

// UpdateOrgApiKeyRequest is the request to update an organization API key
type UpdateOrgApiKeyRequest struct {
	Name string `json:"name,omitempty"`
	Role string `json:"role,omitempty"`
}

// CreatePartnerApiKeyRequest is the request to create a partner API key
type CreatePartnerApiKeyRequest struct {
	Name        string   `json:"name"`
	Scopes      []string `json:"scopes"`
	Description string   `json:"description,omitempty"`
}

// ListPartnerApiKeysRequest is the request to list partner API keys
type ListPartnerApiKeysRequest struct {
	Limit  *int
	Offset *int
	Search string
}

// UpdatePartnerApiKeyRequest is the request to update a partner API key
type UpdatePartnerApiKeyRequest struct {
	Name        string   `json:"name,omitempty"`
	Description string   `json:"description,omitempty"`
	Scopes      []string `json:"scopes,omitempty"`
}

// AddPartnerUserRequest is the request to add a user to the partner portal
type AddPartnerUserRequest struct {
	Email       string             `json:"email"`
	Role        string             `json:"role"`
	Permissions PartnerPermissions `json:"permissions"`
}

// ListPartnerUsersRequest is the request to list partner portal users
type ListPartnerUsersRequest struct {
	Limit  *int
	Offset *int
	Search string
}

// UpdatePartnerUserRequest is the request to update a partner user
type UpdatePartnerUserRequest struct {
	Role        string              `json:"role,omitempty"`
	Permissions *PartnerPermissions `json:"permissions,omitempty"`
}

// ListAuditLogsRequest is the request to list audit logs
type ListAuditLogsRequest struct {
	Limit        *int
	Offset       *int
	Search       string
	Action       string
	ResourceType string
	ResourceID   string
	Success      *bool
	StartDate    string
	EndDate      string
}

// =============================================
// Response Types
// =============================================

// SuccessResponse is a generic success response
type SuccessResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
}

// OrganizationResponse is the response for organization create/update
type OrganizationResponse struct {
	Success bool         `json:"success"`
	Data    Organization `json:"data"`
}

// OrganizationListResponse is the response for listing organizations
type OrganizationListResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Results      []Organization `json:"results"`
		TotalRecords int            `json:"totalRecords"`
		Limit        int            `json:"limit"`
		Offset       int            `json:"offset"`
	} `json:"data"`
}

// OrganizationDetailResponse is the response for getting organization details
type OrganizationDetailResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Organization
		Features *Features `json:"features,omitempty"`
		Tracking *Tracking `json:"tracking,omitempty"`
	} `json:"data"`
}

// EntitlementsResponse is the response for entitlement updates
type EntitlementsResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Features *Features `json:"features,omitempty"`
		Tracking *Tracking `json:"tracking,omitempty"`
	} `json:"data"`
}

// OrgUserResponse is the response for organization user operations
type OrgUserResponse struct {
	Success bool             `json:"success"`
	Data    OrganizationUser `json:"data"`
}

// OrgUserListResponse is the response for listing organization users
type OrgUserListResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Results      []OrganizationUser `json:"results"`
		TotalRecords int                `json:"totalRecords"`
		Limit        int                `json:"limit"`
		Offset       int                `json:"offset"`
	} `json:"data"`
	UserLimit map[string]interface{} `json:"userLimit,omitempty"`
}

// OrgApiKeyResponse is the response for organization API key creation
type OrgApiKeyResponse struct {
	Success bool      `json:"success"`
	Data    OrgApiKey `json:"data"`
	Message string    `json:"message,omitempty"`
}

// OrgApiKeyUpdateResponse is the response for organization API key updates
type OrgApiKeyUpdateResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	ApiKey  struct {
		ID        string `json:"id"`
		Name      string `json:"name"`
		Role      string `json:"role,omitempty"`
		UpdatedOn string `json:"updatedOn,omitempty"`
	} `json:"apiKey"`
}

// OrgApiKeyListResponse is the response for listing organization API keys
type OrgApiKeyListResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Results      []OrgApiKey `json:"results"`
		TotalRecords int         `json:"totalRecords"`
		Limit        int         `json:"limit"`
		Offset       int         `json:"offset"`
	} `json:"data"`
}

// PartnerApiKeyResponse is the response for partner API key creation
type PartnerApiKeyResponse struct {
	Success bool          `json:"success"`
	Data    PartnerApiKey `json:"data"`
	Message string        `json:"message,omitempty"`
}

// PartnerApiKeyUpdateResponse is the response for partner API key updates
type PartnerApiKeyUpdateResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message,omitempty"`
	ApiKey  struct {
		ID          string   `json:"id"`
		Name        string   `json:"name"`
		Description string   `json:"description,omitempty"`
		Scopes      []string `json:"scopes,omitempty"`
		UpdatedOn   string   `json:"updatedOn,omitempty"`
	} `json:"apiKey"`
}

// PartnerApiKeyListResponse is the response for listing partner API keys
type PartnerApiKeyListResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Results      []PartnerApiKey `json:"results"`
		TotalRecords int             `json:"totalRecords"`
		Limit        int             `json:"limit"`
		Offset       int             `json:"offset"`
	} `json:"data"`
}

// PartnerUserResponse is the response for partner user operations
type PartnerUserResponse struct {
	Success bool        `json:"success"`
	Data    PartnerUser `json:"data"`
}

// PartnerUserUpdateResponse is the response for partner user updates
type PartnerUserUpdateResponse struct {
	Success bool `json:"success"`
	Data    struct {
		UserID      string             `json:"userId"`
		Role        string             `json:"role"`
		Permissions PartnerPermissions `json:"permissions"`
	} `json:"data"`
}

// PartnerUserListResponse is the response for listing partner users
type PartnerUserListResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Results      []PartnerUser `json:"results"`
		TotalRecords int           `json:"totalRecords"`
		Limit        int           `json:"limit"`
		Offset       int           `json:"offset"`
	} `json:"data"`
}

// AuditLogListResponse is the response for listing audit logs
type AuditLogListResponse struct {
	Success bool `json:"success"`
	Data    struct {
		Results      []AuditLogEntry `json:"results"`
		TotalRecords int             `json:"totalRecords"`
		Limit        int             `json:"limit"`
		Offset       int             `json:"offset"`
	} `json:"data"`
}

// =============================================
// Organization Management
// =============================================

// CreateOrganization creates a new organization under the partner account
func (c *PartnerClient) CreateOrganization(ctx context.Context, req *CreateOrganizationRequest) (*OrganizationResponse, error) {
	var response OrganizationResponse
	err := c.http.Post(ctx, c.basePath()+"/organization", req, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// ListOrganizations lists all organizations with optional pagination and search
func (c *PartnerClient) ListOrganizations(ctx context.Context, req *ListOrganizationsRequest) (*OrganizationListResponse, error) {
	q := url.Values{}
	if req != nil {
		addPaginationParams(q, req.Limit, req.Offset, req.Search)
	}

	var response OrganizationListResponse
	err := c.http.Get(ctx, c.basePath()+"/organizations"+buildQuery(q), &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// GetOrganizationDetails gets full details for an organization including features and tracking
func (c *PartnerClient) GetOrganizationDetails(ctx context.Context, organizationID string) (*OrganizationDetailResponse, error) {
	var response OrganizationDetailResponse
	err := c.http.Get(ctx, c.basePath()+"/organizations/"+organizationID, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// UpdateOrganizationInfo updates an organization's name
func (c *PartnerClient) UpdateOrganizationInfo(ctx context.Context, organizationID string, req *UpdateOrganizationRequest) (*OrganizationResponse, error) {
	var response OrganizationResponse
	err := c.http.Patch(ctx, c.basePath()+"/organizations/"+organizationID, req, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// DeleteOrganization soft-deletes an organization
func (c *PartnerClient) DeleteOrganization(ctx context.Context, organizationID string) (*SuccessResponse, error) {
	var response SuccessResponse
	err := c.http.Delete(ctx, c.basePath()+"/organizations/"+organizationID, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// UpdateOrganizationEntitlements updates an organization's feature limits and capabilities
func (c *PartnerClient) UpdateOrganizationEntitlements(ctx context.Context, organizationID string, req *UpdateEntitlementsRequest) (*EntitlementsResponse, error) {
	var response EntitlementsResponse
	err := c.http.Patch(ctx, c.basePath()+"/organizations/"+organizationID+"/entitlements", req, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// =============================================
// Organization User Management
// =============================================

// ListOrganizationUsers lists all users in an organization
func (c *PartnerClient) ListOrganizationUsers(ctx context.Context, organizationID string, req *ListOrgUsersRequest) (*OrgUserListResponse, error) {
	q := url.Values{}
	if req != nil {
		addPaginationParams(q, req.Limit, req.Offset, req.Search)
	}

	var response OrgUserListResponse
	err := c.http.Get(ctx, c.basePath()+"/organizations/"+organizationID+"/users"+buildQuery(q), &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// AddUserToOrganization adds a user to an organization with a specific role
func (c *PartnerClient) AddUserToOrganization(ctx context.Context, organizationID string, req *AddOrgUserRequest) (*OrgUserResponse, error) {
	var response OrgUserResponse
	err := c.http.Post(ctx, c.basePath()+"/organizations/"+organizationID+"/users", req, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// UpdateOrganizationUserRole updates a user's role within an organization
func (c *PartnerClient) UpdateOrganizationUserRole(ctx context.Context, organizationID, userID string, req *UpdateOrgUserRequest) (*OrgUserResponse, error) {
	var response OrgUserResponse
	err := c.http.Patch(ctx, c.basePath()+"/organizations/"+organizationID+"/users/"+userID, req, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// RemoveUserFromOrganization removes a user from an organization
func (c *PartnerClient) RemoveUserFromOrganization(ctx context.Context, organizationID, userID string) (*SuccessResponse, error) {
	var response SuccessResponse
	err := c.http.Delete(ctx, c.basePath()+"/organizations/"+organizationID+"/users/"+userID, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// ResendOrganizationInvitationToUser resends the invitation email to a pending user
func (c *PartnerClient) ResendOrganizationInvitationToUser(ctx context.Context, organizationID, userID string) (*SuccessResponse, error) {
	var response SuccessResponse
	err := c.http.Post(ctx, c.basePath()+"/organizations/"+organizationID+"/users/"+userID+"/resend-invitation", nil, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// =============================================
// Organization API Key Management
// =============================================

// ListOrganizationApiKeys lists all API keys for an organization
func (c *PartnerClient) ListOrganizationApiKeys(ctx context.Context, organizationID string, req *ListOrgApiKeysRequest) (*OrgApiKeyListResponse, error) {
	q := url.Values{}
	if req != nil {
		addPaginationParams(q, req.Limit, req.Offset, req.Search)
	}

	var response OrgApiKeyListResponse
	err := c.http.Get(ctx, c.basePath()+"/organizations/"+organizationID+"/apikeys"+buildQuery(q), &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// CreateOrganizationApiKey creates an API key for an organization
func (c *PartnerClient) CreateOrganizationApiKey(ctx context.Context, organizationID string, req *CreateOrgApiKeyRequest) (*OrgApiKeyResponse, error) {
	var response OrgApiKeyResponse
	err := c.http.Post(ctx, c.basePath()+"/organizations/"+organizationID+"/apikeys", req, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// UpdateOrganizationApiKey updates an organization API key
func (c *PartnerClient) UpdateOrganizationApiKey(ctx context.Context, organizationID, apiKeyID string, req *UpdateOrgApiKeyRequest) (*OrgApiKeyUpdateResponse, error) {
	var response OrgApiKeyUpdateResponse
	err := c.http.Patch(ctx, c.basePath()+"/organizations/"+organizationID+"/apikeys/"+apiKeyID, req, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// RevokeOrganizationApiKey revokes an organization API key
func (c *PartnerClient) RevokeOrganizationApiKey(ctx context.Context, organizationID, apiKeyID string) (*SuccessResponse, error) {
	var response SuccessResponse
	err := c.http.Delete(ctx, c.basePath()+"/organizations/"+organizationID+"/apikeys/"+apiKeyID, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// =============================================
// Partner API Key Management
// =============================================

// ListPartnerApiKeys lists all partner API keys
func (c *PartnerClient) ListPartnerApiKeys(ctx context.Context, req *ListPartnerApiKeysRequest) (*PartnerApiKeyListResponse, error) {
	q := url.Values{}
	if req != nil {
		addPaginationParams(q, req.Limit, req.Offset, req.Search)
	}

	var response PartnerApiKeyListResponse
	err := c.http.Get(ctx, c.basePath()+"/api-keys"+buildQuery(q), &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// CreatePartnerApiKey creates a new partner-level API key with specific scopes
func (c *PartnerClient) CreatePartnerApiKey(ctx context.Context, req *CreatePartnerApiKeyRequest) (*PartnerApiKeyResponse, error) {
	var response PartnerApiKeyResponse
	err := c.http.Post(ctx, c.basePath()+"/api-keys", req, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// UpdatePartnerApiKey updates a partner API key
func (c *PartnerClient) UpdatePartnerApiKey(ctx context.Context, keyID string, req *UpdatePartnerApiKeyRequest) (*PartnerApiKeyUpdateResponse, error) {
	var response PartnerApiKeyUpdateResponse
	err := c.http.Patch(ctx, c.basePath()+"/api-keys/"+keyID, req, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// RevokePartnerApiKey revokes a partner API key
func (c *PartnerClient) RevokePartnerApiKey(ctx context.Context, keyID string) (*SuccessResponse, error) {
	var response SuccessResponse
	err := c.http.Delete(ctx, c.basePath()+"/api-keys/"+keyID, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// =============================================
// Partner User Management
// =============================================

// ListPartnerPortalUsers lists all partner portal users
func (c *PartnerClient) ListPartnerPortalUsers(ctx context.Context, req *ListPartnerUsersRequest) (*PartnerUserListResponse, error) {
	q := url.Values{}
	if req != nil {
		addPaginationParams(q, req.Limit, req.Offset, req.Search)
	}

	var response PartnerUserListResponse
	err := c.http.Get(ctx, c.basePath()+"/users"+buildQuery(q), &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// AddUserToPartnerPortal adds a user to the partner portal with specific permissions
func (c *PartnerClient) AddUserToPartnerPortal(ctx context.Context, req *AddPartnerUserRequest) (*PartnerUserResponse, error) {
	var response PartnerUserResponse
	err := c.http.Post(ctx, c.basePath()+"/users", req, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// UpdatePartnerUserPermissions updates a partner user's role and permissions
func (c *PartnerClient) UpdatePartnerUserPermissions(ctx context.Context, userID string, req *UpdatePartnerUserRequest) (*PartnerUserUpdateResponse, error) {
	var response PartnerUserUpdateResponse
	err := c.http.Patch(ctx, c.basePath()+"/users/"+userID, req, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// RemoveUserFromPartnerPortal removes a user from the partner portal
func (c *PartnerClient) RemoveUserFromPartnerPortal(ctx context.Context, userID string) (*SuccessResponse, error) {
	var response SuccessResponse
	err := c.http.Delete(ctx, c.basePath()+"/users/"+userID, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// ResendPartnerPortalInvitationToUser resends the invitation email to a pending partner user
func (c *PartnerClient) ResendPartnerPortalInvitationToUser(ctx context.Context, userID string) (*SuccessResponse, error) {
	var response SuccessResponse
	err := c.http.Post(ctx, c.basePath()+"/users/"+userID+"/resend-invitation", nil, &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// =============================================
// Audit Logs
// =============================================

// GetPartnerAuditLogs gets audit logs for all partner activities with filtering
func (c *PartnerClient) GetPartnerAuditLogs(ctx context.Context, req *ListAuditLogsRequest) (*AuditLogListResponse, error) {
	q := url.Values{}
	if req != nil {
		addPaginationParams(q, req.Limit, req.Offset, req.Search)
		if req.Action != "" {
			q.Set("action", req.Action)
		}
		if req.ResourceType != "" {
			q.Set("resourceType", req.ResourceType)
		}
		if req.ResourceID != "" {
			q.Set("resourceId", req.ResourceID)
		}
		if req.Success != nil {
			q.Set("success", fmt.Sprintf("%t", *req.Success))
		}
		if req.StartDate != "" {
			q.Set("startDate", req.StartDate)
		}
		if req.EndDate != "" {
			q.Set("endDate", req.EndDate)
		}
	}

	var response AuditLogListResponse
	err := c.http.Get(ctx, c.basePath()+"/audit-logs"+buildQuery(q), &response)
	if err != nil {
		return nil, err
	}
	return &response, nil
}

// =============================================
// Convenience Helpers
// =============================================

// IntPtr returns a pointer to the given int value (helper for optional int fields)
func IntPtr(v int) *int { return &v }

// Int64Ptr returns a pointer to the given int64 value (helper for optional int64 fields)
func Int64Ptr(v int64) *int64 { return &v }

// BoolPtr returns a pointer to the given bool value (helper for optional bool fields)
func BoolPtr(v bool) *bool { return &v }
