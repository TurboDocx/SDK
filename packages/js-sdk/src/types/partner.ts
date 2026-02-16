/**
 * TypeScript types for TurboPartner module
 */

// ============================================
// ENUMS (as string union types)
// ============================================

export type PartnerScope =
  | 'org:create'
  | 'org:read'
  | 'org:update'
  | 'org:delete'
  | 'entitlements:update'
  | 'org-users:create'
  | 'org-users:read'
  | 'org-users:update'
  | 'org-users:delete'
  | 'partner-users:create'
  | 'partner-users:read'
  | 'partner-users:update'
  | 'partner-users:delete'
  | 'org-apikeys:create'
  | 'org-apikeys:read'
  | 'org-apikeys:update'
  | 'org-apikeys:delete'
  | 'partner-apikeys:create'
  | 'partner-apikeys:read'
  | 'partner-apikeys:update'
  | 'partner-apikeys:delete'
  | 'audit:read';

export type OrgUserRole = 'admin' | 'contributor' | 'user' | 'viewer';

export type PartnerUserRole = 'admin' | 'member' | 'viewer';

// ============================================
// DOMAIN TYPES
// ============================================

export interface Organization {
  id: string;
  name: string;
  partnerId?: string;
  createdOn?: string;
  updatedOn?: string;
  createdBy?: string;
  isActive?: boolean;
  userCount?: number;
  storageUsed?: number;
  metadata?: Record<string, any>;
}

export interface OrganizationUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  ssoId?: string;
  role?: OrgUserRole;
  createdOn?: string;
  isActive?: boolean;
}

export interface OrgApiKey {
  id: string;
  name: string;
  key?: string;
  role?: string;
  scopes?: string[];
  createdOn?: string;
  createdBy?: string;
  lastUsedOn?: string;
  lastUsedIP?: string;
  updatedOn?: string;
}

export interface PartnerUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  ssoId?: string;
  role?: PartnerUserRole;
  permissions?: PartnerPermissions;
  isPrimaryAdmin?: boolean;
  createdOn?: string;
  isActive?: boolean;
}

export interface PartnerApiKey {
  id: string;
  name: string;
  key?: string;
  description?: string;
  scopes?: PartnerScope[];
  createdOn?: string;
  createdBy?: string;
  lastUsedOn?: string;
  lastUsedIP?: string;
  updatedOn?: string;
}

export interface PartnerPermissions {
  canManageOrgs: boolean;
  canManageOrgUsers: boolean;
  canManagePartnerUsers: boolean;
  canManageOrgAPIKeys: boolean;
  canManagePartnerAPIKeys: boolean;
  canUpdateEntitlements: boolean;
  canViewAuditLogs: boolean;
}

export interface Features {
  orgId?: string;
  maxUsers?: number;
  maxProjectspaces?: number;
  maxTemplates?: number;
  maxStorage?: number;
  maxGeneratedDeliverables?: number;
  maxSignatures?: number;
  maxAICredits?: number;
  rdWatermark?: boolean;
  hasFileDownload?: boolean;
  hasAdvancedDateFormats?: boolean;
  hasGDrive?: boolean;
  hasSharepoint?: boolean;
  hasSharepointOnly?: boolean;
  hasTDAI?: boolean;
  hasPptx?: boolean;
  hasTDWriter?: boolean;
  hasSalesforce?: boolean;
  hasWrike?: boolean;
  hasVariableStack?: boolean;
  hasSubvariables?: boolean;
  hasZapier?: boolean;
  hasBYOM?: boolean;
  hasBYOVS?: boolean;
  hasBetaFeatures?: boolean;
  enableBulkSending?: boolean;
  createdBy?: string;
}

export interface Tracking {
  numUsers?: number;
  numProjectspaces?: number;
  numTemplates?: number;
  storageUsed?: number;
  numGeneratedDeliverables?: number;
  numSignaturesUsed?: number;
  currentAICredits?: number;
}

export interface AuditLogEntry {
  id: string;
  partnerId: string;
  partnerAPIKeyId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  details?: Record<string, any>;
  success?: boolean;
  ipAddress?: string;
  userAgent?: string;
  createdOn?: string;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateOrganizationRequest {
  name: string;
  metadata?: Record<string, any>;
  features?: Partial<Features>;
}

export interface ListOrganizationsRequest {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface UpdateOrganizationRequest {
  name: string;
}

export interface UpdateEntitlementsRequest {
  features?: Partial<Features>;
  tracking?: Partial<Tracking>;
}

export interface AddOrgUserRequest {
  email: string;
  role: OrgUserRole;
}

export interface ListOrgUsersRequest {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface UpdateOrgUserRequest {
  role: OrgUserRole;
}

export interface CreateOrgApiKeyRequest {
  name: string;
  role: string;
}

export interface ListOrgApiKeysRequest {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface UpdateOrgApiKeyRequest {
  name?: string;
  role?: string;
}

export interface CreatePartnerApiKeyRequest {
  name: string;
  scopes: PartnerScope[];
  description?: string;
}

export interface ListPartnerApiKeysRequest {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface UpdatePartnerApiKeyRequest {
  name?: string;
  description?: string;
  scopes?: PartnerScope[];
}

export interface AddPartnerUserRequest {
  email: string;
  role: PartnerUserRole;
  permissions: PartnerPermissions;
}

export interface ListPartnerUsersRequest {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface UpdatePartnerUserRequest {
  role?: PartnerUserRole;
  permissions?: Partial<PartnerPermissions>;
}

export interface ListAuditLogsRequest {
  limit?: number;
  offset?: number;
  search?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  success?: boolean;
  startDate?: string;
  endDate?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface SuccessResponse {
  success: boolean;
  message?: string;
}

export interface OrganizationResponse {
  success: boolean;
  data: Organization;
}

export interface OrganizationListResponse {
  success: boolean;
  data: {
    results: Organization[];
    totalRecords: number;
    limit: number;
    offset: number;
  };
}

export interface OrganizationDetailResponse {
  success: boolean;
  data: Organization & {
    features?: Features;
    tracking?: Tracking;
  };
}

export interface EntitlementsResponse {
  success: boolean;
  data: {
    features?: Features;
    tracking?: Tracking;
  };
}

export interface OrgUserResponse {
  success: boolean;
  data: OrganizationUser;
}

export interface OrgUserListResponse {
  success: boolean;
  data: {
    results: OrganizationUser[];
    totalRecords: number;
    limit: number;
    offset: number;
  };
  userLimit?: number;
}

export interface OrgApiKeyResponse {
  success: boolean;
  data: OrgApiKey;
  message?: string;
}

export interface OrgApiKeyListResponse {
  success: boolean;
  data: {
    results: OrgApiKey[];
    totalRecords: number;
    limit: number;
    offset: number;
  };
}

export interface PartnerApiKeyResponse {
  success: boolean;
  data: PartnerApiKey;
  message?: string;
}

export interface PartnerApiKeyListResponse {
  success: boolean;
  data: {
    results: PartnerApiKey[];
    totalRecords: number;
    limit: number;
    offset: number;
  };
}

export interface PartnerUserResponse {
  success: boolean;
  data: PartnerUser;
}

export interface PartnerUserListResponse {
  success: boolean;
  data: {
    results: PartnerUser[];
    totalRecords: number;
    limit: number;
    offset: number;
  };
}

export interface AuditLogListResponse {
  success: boolean;
  data: {
    results: AuditLogEntry[];
    totalRecords: number;
    limit: number;
    offset: number;
  };
}
