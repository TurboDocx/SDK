package turbodocx

import "context"

// Backward-compatibility shims for the TurboPartner API-key surface.
//
// In v0.3.0 these symbols were spelled with "Api" (e.g. CreateOrganizationApiKey,
// CreateOrgApiKeyRequest). They were later renamed to the Go-idiomatic "API" spelling
// (CreateOrganizationAPIKey, CreateOrgAPIKeyRequest). To avoid breaking code written against
// v0.3.0, the old names are preserved here: the types are zero-cost aliases of the new types,
// and the methods are thin forwarders to the new implementations. Prefer the new "API" names;
// these will be removed in a future major release.

// ---- Scope constant aliases ----
// In v0.3.0 these were spelled "Apikeys"; renamed to "APIKeys". Same string values.

// Deprecated: use ScopeOrgAPIKeysCreate.
const ScopeOrgApikeysCreate = ScopeOrgAPIKeysCreate

// Deprecated: use ScopeOrgAPIKeysRead.
const ScopeOrgApikeysRead = ScopeOrgAPIKeysRead

// Deprecated: use ScopeOrgAPIKeysUpdate.
const ScopeOrgApikeysUpdate = ScopeOrgAPIKeysUpdate

// Deprecated: use ScopeOrgAPIKeysDelete.
const ScopeOrgApikeysDelete = ScopeOrgAPIKeysDelete

// Deprecated: use ScopePartnerAPIKeysCreate.
const ScopePartnerApikeysCreate = ScopePartnerAPIKeysCreate

// Deprecated: use ScopePartnerAPIKeysRead.
const ScopePartnerApikeysRead = ScopePartnerAPIKeysRead

// Deprecated: use ScopePartnerAPIKeysUpdate.
const ScopePartnerApikeysUpdate = ScopePartnerAPIKeysUpdate

// Deprecated: use ScopePartnerAPIKeysDelete.
const ScopePartnerApikeysDelete = ScopePartnerAPIKeysDelete

// ---- Type aliases (identical types; zero cost) ----

// Deprecated: use OrgAPIKey.
type OrgApiKey = OrgAPIKey

// Deprecated: use PartnerAPIKey.
type PartnerApiKey = PartnerAPIKey

// Deprecated: use CreateOrgAPIKeyRequest.
type CreateOrgApiKeyRequest = CreateOrgAPIKeyRequest

// Deprecated: use ListOrgAPIKeysRequest.
type ListOrgApiKeysRequest = ListOrgAPIKeysRequest

// Deprecated: use UpdateOrgAPIKeyRequest.
type UpdateOrgApiKeyRequest = UpdateOrgAPIKeyRequest

// Deprecated: use CreatePartnerAPIKeyRequest.
type CreatePartnerApiKeyRequest = CreatePartnerAPIKeyRequest

// Deprecated: use ListPartnerAPIKeysRequest.
type ListPartnerApiKeysRequest = ListPartnerAPIKeysRequest

// Deprecated: use UpdatePartnerAPIKeyRequest.
type UpdatePartnerApiKeyRequest = UpdatePartnerAPIKeyRequest

// Deprecated: use OrgAPIKeyResponse.
type OrgApiKeyResponse = OrgAPIKeyResponse

// Deprecated: use OrgAPIKeyUpdateResponse.
type OrgApiKeyUpdateResponse = OrgAPIKeyUpdateResponse

// Deprecated: use OrgAPIKeyListResponse.
type OrgApiKeyListResponse = OrgAPIKeyListResponse

// Deprecated: use PartnerAPIKeyResponse.
type PartnerApiKeyResponse = PartnerAPIKeyResponse

// Deprecated: use PartnerAPIKeyUpdateResponse.
type PartnerApiKeyUpdateResponse = PartnerAPIKeyUpdateResponse

// Deprecated: use PartnerAPIKeyListResponse.
type PartnerApiKeyListResponse = PartnerAPIKeyListResponse

// ---- Method forwarders ----

// Deprecated: use ListOrganizationAPIKeys.
func (c *PartnerClient) ListOrganizationApiKeys(ctx context.Context, organizationID string, req *ListOrgApiKeysRequest) (*OrgApiKeyListResponse, error) {
	return c.ListOrganizationAPIKeys(ctx, organizationID, req)
}

// Deprecated: use CreateOrganizationAPIKey.
func (c *PartnerClient) CreateOrganizationApiKey(ctx context.Context, organizationID string, req *CreateOrgApiKeyRequest) (*OrgApiKeyResponse, error) {
	return c.CreateOrganizationAPIKey(ctx, organizationID, req)
}

// Deprecated: use UpdateOrganizationAPIKey.
func (c *PartnerClient) UpdateOrganizationApiKey(ctx context.Context, organizationID, apiKeyID string, req *UpdateOrgApiKeyRequest) (*OrgApiKeyUpdateResponse, error) {
	return c.UpdateOrganizationAPIKey(ctx, organizationID, apiKeyID, req)
}

// Deprecated: use RevokeOrganizationAPIKey.
func (c *PartnerClient) RevokeOrganizationApiKey(ctx context.Context, organizationID, apiKeyID string) (*SuccessResponse, error) {
	return c.RevokeOrganizationAPIKey(ctx, organizationID, apiKeyID)
}

// Deprecated: use ListPartnerAPIKeys.
func (c *PartnerClient) ListPartnerApiKeys(ctx context.Context, req *ListPartnerApiKeysRequest) (*PartnerApiKeyListResponse, error) {
	return c.ListPartnerAPIKeys(ctx, req)
}

// Deprecated: use CreatePartnerAPIKey.
func (c *PartnerClient) CreatePartnerApiKey(ctx context.Context, req *CreatePartnerApiKeyRequest) (*PartnerApiKeyResponse, error) {
	return c.CreatePartnerAPIKey(ctx, req)
}

// Deprecated: use UpdatePartnerAPIKey.
func (c *PartnerClient) UpdatePartnerApiKey(ctx context.Context, keyID string, req *UpdatePartnerApiKeyRequest) (*PartnerApiKeyUpdateResponse, error) {
	return c.UpdatePartnerAPIKey(ctx, keyID, req)
}

// Deprecated: use RevokePartnerAPIKey.
func (c *PartnerClient) RevokePartnerApiKey(ctx context.Context, keyID string) (*SuccessResponse, error) {
	return c.RevokePartnerAPIKey(ctx, keyID)
}
