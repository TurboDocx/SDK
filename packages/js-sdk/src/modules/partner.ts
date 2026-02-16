/**
 * TurboPartner Module - Partner portal operations
 */

import { HttpClient, PartnerClientConfig } from '../http';
import {
  CreateOrganizationRequest,
  ListOrganizationsRequest,
  UpdateOrganizationRequest,
  UpdateEntitlementsRequest,
  AddOrgUserRequest,
  ListOrgUsersRequest,
  UpdateOrgUserRequest,
  CreateOrgApiKeyRequest,
  ListOrgApiKeysRequest,
  UpdateOrgApiKeyRequest,
  CreatePartnerApiKeyRequest,
  ListPartnerApiKeysRequest,
  UpdatePartnerApiKeyRequest,
  AddPartnerUserRequest,
  ListPartnerUsersRequest,
  UpdatePartnerUserRequest,
  ListAuditLogsRequest,
  SuccessResponse,
  OrganizationResponse,
  OrganizationListResponse,
  OrganizationDetailResponse,
  EntitlementsResponse,
  OrgUserResponse,
  OrgUserListResponse,
  OrgApiKeyResponse,
  OrgApiKeyListResponse,
  PartnerApiKeyResponse,
  PartnerApiKeyListResponse,
  PartnerUserResponse,
  PartnerUserListResponse,
  AuditLogListResponse,
} from '../types/partner';

/**
 * Convert a request object to query parameters, filtering out undefined/null values.
 * Booleans are serialized as 'true'/'false' strings.
 */
function toQueryParams(request?: Record<string, any>): Record<string, string> | undefined {
  if (!request) return undefined;

  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(request)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'boolean') {
        params[key] = value ? 'true' : 'false';
      } else {
        params[key] = String(value);
      }
    }
  }
  return Object.keys(params).length > 0 ? params : undefined;
}

export class TurboPartner {
  private static client: HttpClient;
  private static partnerId: string;

  /**
   * Configure the TurboPartner module with partner API credentials
   *
   * @param config - Partner configuration object
   * @param config.partnerApiKey - Partner API key (must start with TDXP-)
   * @param config.partnerId - Partner ID (UUID format)
   * @param config.baseUrl - API base URL (optional, defaults to https://api.turbodocx.com)
   *
   * @example
   * ```typescript
   * TurboPartner.configure({
   *   partnerApiKey: process.env.TURBODOCX_PARTNER_API_KEY,
   *   partnerId: process.env.TURBODOCX_PARTNER_ID,
   * });
   * ```
   */
  static configure(config: PartnerClientConfig): void {
    this.client = new HttpClient({
      apiKey: config.partnerApiKey,
      baseUrl: config.baseUrl,
      skipSenderValidation: true,
    });
    this.partnerId = config.partnerId;
  }

  /**
   * Get the HTTP client instance, initializing if necessary
   */
  private static getClient(): HttpClient {
    if (!this.client) {
      const partnerApiKey = process.env.TURBODOCX_PARTNER_API_KEY;
      const partnerId = process.env.TURBODOCX_PARTNER_ID;
      if (!partnerApiKey || !partnerId) {
        throw new Error('TurboPartner must be configured before use. Call TurboPartner.configure() or set TURBODOCX_PARTNER_API_KEY and TURBODOCX_PARTNER_ID environment variables.');
      }
      this.configure({ partnerApiKey, partnerId });
    }
    return this.client;
  }

  /**
   * Get the partner ID
   */
  private static getPartnerId(): string {
    if (!this.partnerId) {
      // Trigger auto-initialization
      this.getClient();
    }
    return this.partnerId;
  }

  // ============================================
  // ORGANIZATION MANAGEMENT
  // ============================================

  /**
   * Create a new organization
   *
   * @param request - Organization creation request
   * @returns Created organization details
   *
   * @example
   * ```typescript
   * const org = await TurboPartner.createOrganization({
   *   name: 'Acme Corp',
   *   metadata: { industry: 'Technology' },
   * });
   * console.log(org.data.id);
   * ```
   */
  static async createOrganization(request: CreateOrganizationRequest): Promise<OrganizationResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.post<OrganizationResponse>(`/partner/${partnerId}/organization`, request);
  }

  /**
   * List all organizations
   *
   * @param request - Optional pagination and search parameters
   * @returns Paginated list of organizations
   *
   * @example
   * ```typescript
   * const orgs = await TurboPartner.listOrganizations({ limit: 10, search: 'acme' });
   * console.log(orgs.data.results);
   * ```
   */
  static async listOrganizations(request?: ListOrganizationsRequest): Promise<OrganizationListResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.get<OrganizationListResponse>(`/partner/${partnerId}/organizations`, toQueryParams(request));
  }

  /**
   * Get detailed information about an organization
   *
   * @param organizationId - Organization ID
   * @returns Organization details including features and tracking
   *
   * @example
   * ```typescript
   * const details = await TurboPartner.getOrganizationDetails('org-uuid');
   * console.log(details.data.features);
   * ```
   */
  static async getOrganizationDetails(organizationId: string): Promise<OrganizationDetailResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.get<OrganizationDetailResponse>(`/partner/${partnerId}/organizations/${organizationId}`);
  }

  /**
   * Update organization information
   *
   * @param organizationId - Organization ID
   * @param request - Update request with new name
   * @returns Updated organization details
   *
   * @example
   * ```typescript
   * const org = await TurboPartner.updateOrganizationInfo('org-uuid', { name: 'New Name' });
   * ```
   */
  static async updateOrganizationInfo(organizationId: string, request: UpdateOrganizationRequest): Promise<OrganizationResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.patch<OrganizationResponse>(`/partner/${partnerId}/organizations/${organizationId}`, request);
  }

  /**
   * Delete an organization
   *
   * @param organizationId - Organization ID
   * @returns Success response
   *
   * @example
   * ```typescript
   * await TurboPartner.deleteOrganization('org-uuid');
   * ```
   */
  static async deleteOrganization(organizationId: string): Promise<SuccessResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.delete<SuccessResponse>(`/partner/${partnerId}/organizations/${organizationId}`);
  }

  /**
   * Update organization entitlements (features and tracking)
   *
   * @param organizationId - Organization ID
   * @param request - Entitlements update request
   * @returns Updated entitlements
   *
   * @example
   * ```typescript
   * const result = await TurboPartner.updateOrganizationEntitlements('org-uuid', {
   *   features: { maxUsers: 50, hasTDAI: true },
   * });
   * ```
   */
  static async updateOrganizationEntitlements(organizationId: string, request: UpdateEntitlementsRequest): Promise<EntitlementsResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.patch<EntitlementsResponse>(`/partner/${partnerId}/organizations/${organizationId}/entitlements`, request);
  }

  // ============================================
  // ORGANIZATION USER MANAGEMENT
  // ============================================

  /**
   * List users in an organization
   *
   * @param organizationId - Organization ID
   * @param request - Optional pagination and search parameters
   * @returns Paginated list of organization users
   *
   * @example
   * ```typescript
   * const users = await TurboPartner.listOrganizationUsers('org-uuid', { limit: 25 });
   * ```
   */
  static async listOrganizationUsers(organizationId: string, request?: ListOrgUsersRequest): Promise<OrgUserListResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.get<OrgUserListResponse>(`/partner/${partnerId}/organizations/${organizationId}/users`, toQueryParams(request));
  }

  /**
   * Add a user to an organization
   *
   * @param organizationId - Organization ID
   * @param request - User details with email and role
   * @returns Created user details
   *
   * @example
   * ```typescript
   * const user = await TurboPartner.addUserToOrganization('org-uuid', {
   *   email: 'user@example.com',
   *   role: 'contributor',
   * });
   * ```
   */
  static async addUserToOrganization(organizationId: string, request: AddOrgUserRequest): Promise<OrgUserResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.post<OrgUserResponse>(`/partner/${partnerId}/organizations/${organizationId}/users`, request);
  }

  /**
   * Update a user's role in an organization
   *
   * @param organizationId - Organization ID
   * @param userId - User ID
   * @param request - Updated role
   * @returns Updated user details
   *
   * @example
   * ```typescript
   * const user = await TurboPartner.updateOrganizationUserRole('org-uuid', 'user-uuid', {
   *   role: 'admin',
   * });
   * ```
   */
  static async updateOrganizationUserRole(organizationId: string, userId: string, request: UpdateOrgUserRequest): Promise<OrgUserResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.patch<OrgUserResponse>(`/partner/${partnerId}/organizations/${organizationId}/users/${userId}`, request);
  }

  /**
   * Remove a user from an organization
   *
   * @param organizationId - Organization ID
   * @param userId - User ID
   * @returns Success response
   *
   * @example
   * ```typescript
   * await TurboPartner.removeUserFromOrganization('org-uuid', 'user-uuid');
   * ```
   */
  static async removeUserFromOrganization(organizationId: string, userId: string): Promise<SuccessResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.delete<SuccessResponse>(`/partner/${partnerId}/organizations/${organizationId}/users/${userId}`);
  }

  /**
   * Resend an organization invitation email to a user
   *
   * @param organizationId - Organization ID
   * @param userId - User ID
   * @returns Success response
   *
   * @example
   * ```typescript
   * await TurboPartner.resendOrganizationInvitationToUser('org-uuid', 'user-uuid');
   * ```
   */
  static async resendOrganizationInvitationToUser(organizationId: string, userId: string): Promise<SuccessResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.post<SuccessResponse>(`/partner/${partnerId}/organizations/${organizationId}/users/${userId}/resend-invitation`);
  }

  // ============================================
  // ORGANIZATION API KEY MANAGEMENT
  // ============================================

  /**
   * List API keys for an organization
   *
   * @param organizationId - Organization ID
   * @param request - Optional pagination and search parameters
   * @returns Paginated list of API keys
   *
   * @example
   * ```typescript
   * const keys = await TurboPartner.listOrganizationApiKeys('org-uuid');
   * ```
   */
  static async listOrganizationApiKeys(organizationId: string, request?: ListOrgApiKeysRequest): Promise<OrgApiKeyListResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.get<OrgApiKeyListResponse>(`/partner/${partnerId}/organizations/${organizationId}/apikeys`, toQueryParams(request));
  }

  /**
   * Create an API key for an organization
   *
   * @param organizationId - Organization ID
   * @param request - API key creation request with name and role
   * @returns Created API key (includes the full key value only on creation)
   *
   * @example
   * ```typescript
   * const key = await TurboPartner.createOrganizationApiKey('org-uuid', {
   *   name: 'Production Key',
   *   role: 'admin',
   * });
   * console.log(key.data.key); // Full key only shown on creation
   * ```
   */
  static async createOrganizationApiKey(organizationId: string, request: CreateOrgApiKeyRequest): Promise<OrgApiKeyResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.post<OrgApiKeyResponse>(`/partner/${partnerId}/organizations/${organizationId}/apikeys`, request);
  }

  /**
   * Update an organization API key
   *
   * @param organizationId - Organization ID
   * @param apiKeyId - API key ID
   * @param request - Updated key properties
   * @returns Updated API key details
   *
   * @example
   * ```typescript
   * const key = await TurboPartner.updateOrganizationApiKey('org-uuid', 'key-uuid', {
   *   name: 'Updated Key Name',
   * });
   * ```
   */
  static async updateOrganizationApiKey(organizationId: string, apiKeyId: string, request: UpdateOrgApiKeyRequest): Promise<OrgApiKeyResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.patch<OrgApiKeyResponse>(`/partner/${partnerId}/organizations/${organizationId}/apikeys/${apiKeyId}`, request);
  }

  /**
   * Revoke an organization API key
   *
   * @param organizationId - Organization ID
   * @param apiKeyId - API key ID
   * @returns Success response
   *
   * @example
   * ```typescript
   * await TurboPartner.revokeOrganizationApiKey('org-uuid', 'key-uuid');
   * ```
   */
  static async revokeOrganizationApiKey(organizationId: string, apiKeyId: string): Promise<SuccessResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.delete<SuccessResponse>(`/partner/${partnerId}/organizations/${organizationId}/apikeys/${apiKeyId}`);
  }

  // ============================================
  // PARTNER API KEY MANAGEMENT
  // ============================================

  /**
   * List partner API keys
   *
   * @param request - Optional pagination and search parameters
   * @returns Paginated list of partner API keys
   *
   * @example
   * ```typescript
   * const keys = await TurboPartner.listPartnerApiKeys({ limit: 10 });
   * ```
   */
  static async listPartnerApiKeys(request?: ListPartnerApiKeysRequest): Promise<PartnerApiKeyListResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.get<PartnerApiKeyListResponse>(`/partner/${partnerId}/api-keys`, toQueryParams(request));
  }

  /**
   * Create a new partner API key
   *
   * @param request - API key creation request with name and scopes
   * @returns Created API key (includes the full key value only on creation)
   *
   * @example
   * ```typescript
   * const key = await TurboPartner.createPartnerApiKey({
   *   name: 'CI/CD Key',
   *   scopes: ['org:create', 'org:read'],
   *   description: 'Key for automated deployments',
   * });
   * console.log(key.data.key); // Full key only shown on creation
   * ```
   */
  static async createPartnerApiKey(request: CreatePartnerApiKeyRequest): Promise<PartnerApiKeyResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.post<PartnerApiKeyResponse>(`/partner/${partnerId}/api-keys`, request);
  }

  /**
   * Update a partner API key
   *
   * @param keyId - API key ID
   * @param request - Updated key properties
   * @returns Updated API key details
   *
   * @example
   * ```typescript
   * const key = await TurboPartner.updatePartnerApiKey('key-uuid', {
   *   name: 'Updated Name',
   *   scopes: ['org:create', 'org:read', 'org:update'],
   * });
   * ```
   */
  static async updatePartnerApiKey(keyId: string, request: UpdatePartnerApiKeyRequest): Promise<PartnerApiKeyResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.patch<PartnerApiKeyResponse>(`/partner/${partnerId}/api-keys/${keyId}`, request);
  }

  /**
   * Revoke a partner API key
   *
   * @param keyId - API key ID
   * @returns Success response
   *
   * @example
   * ```typescript
   * await TurboPartner.revokePartnerApiKey('key-uuid');
   * ```
   */
  static async revokePartnerApiKey(keyId: string): Promise<SuccessResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.delete<SuccessResponse>(`/partner/${partnerId}/api-keys/${keyId}`);
  }

  // ============================================
  // PARTNER USER MANAGEMENT
  // ============================================

  /**
   * List partner portal users
   *
   * @param request - Optional pagination and search parameters
   * @returns Paginated list of partner users
   *
   * @example
   * ```typescript
   * const users = await TurboPartner.listPartnerPortalUsers({ limit: 25 });
   * ```
   */
  static async listPartnerPortalUsers(request?: ListPartnerUsersRequest): Promise<PartnerUserListResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.get<PartnerUserListResponse>(`/partner/${partnerId}/users`, toQueryParams(request));
  }

  /**
   * Add a user to the partner portal
   *
   * @param request - User details with email, role, and permissions
   * @returns Created user details
   *
   * @example
   * ```typescript
   * const user = await TurboPartner.addUserToPartnerPortal({
   *   email: 'admin@partner.com',
   *   role: 'admin',
   *   permissions: {
   *     canManageOrgs: true,
   *     canManageOrgUsers: true,
   *     canManagePartnerUsers: false,
   *     canManageOrgAPIKeys: true,
   *     canManagePartnerAPIKeys: false,
   *     canUpdateEntitlements: true,
   *     canViewAuditLogs: true,
   *   },
   * });
   * ```
   */
  static async addUserToPartnerPortal(request: AddPartnerUserRequest): Promise<PartnerUserResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.post<PartnerUserResponse>(`/partner/${partnerId}/users`, request);
  }

  /**
   * Update a partner user's role and permissions
   *
   * @param userId - User ID
   * @param request - Updated role and/or permissions
   * @returns Updated user details
   *
   * @example
   * ```typescript
   * const user = await TurboPartner.updatePartnerUserPermissions('user-uuid', {
   *   role: 'member',
   *   permissions: { canManageOrgs: true },
   * });
   * ```
   */
  static async updatePartnerUserPermissions(userId: string, request: UpdatePartnerUserRequest): Promise<PartnerUserResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.patch<PartnerUserResponse>(`/partner/${partnerId}/users/${userId}`, request);
  }

  /**
   * Remove a user from the partner portal
   *
   * @param userId - User ID
   * @returns Success response
   *
   * @example
   * ```typescript
   * await TurboPartner.removeUserFromPartnerPortal('user-uuid');
   * ```
   */
  static async removeUserFromPartnerPortal(userId: string): Promise<SuccessResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.delete<SuccessResponse>(`/partner/${partnerId}/users/${userId}`);
  }

  /**
   * Resend a partner portal invitation email to a user
   *
   * @param userId - User ID
   * @returns Success response
   *
   * @example
   * ```typescript
   * await TurboPartner.resendPartnerPortalInvitationToUser('user-uuid');
   * ```
   */
  static async resendPartnerPortalInvitationToUser(userId: string): Promise<SuccessResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.post<SuccessResponse>(`/partner/${partnerId}/users/${userId}/resend-invitation`);
  }

  // ============================================
  // AUDIT LOGS
  // ============================================

  /**
   * Get partner audit logs
   *
   * @param request - Optional filtering and pagination parameters
   * @returns Paginated list of audit log entries
   *
   * @example
   * ```typescript
   * const logs = await TurboPartner.getPartnerAuditLogs({
   *   action: 'org.created',
   *   startDate: '2025-01-01',
   *   endDate: '2025-12-31',
   * });
   * ```
   */
  static async getPartnerAuditLogs(request?: ListAuditLogsRequest): Promise<AuditLogListResponse> {
    const client = this.getClient();
    const partnerId = this.getPartnerId();
    return client.get<AuditLogListResponse>(`/partner/${partnerId}/audit-logs`, toQueryParams(request));
  }
}
