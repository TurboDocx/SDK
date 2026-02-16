<?php

declare(strict_types=1);

namespace TurboDocx;

use TurboDocx\Config\PartnerClientConfig;
use TurboDocx\Types\Requests\Partner\AddOrgUserRequest;
use TurboDocx\Types\Requests\Partner\AddPartnerUserRequest;
use TurboDocx\Types\Requests\Partner\CreateOrgApiKeyRequest;
use TurboDocx\Types\Requests\Partner\CreateOrganizationRequest;
use TurboDocx\Types\Requests\Partner\CreatePartnerApiKeyRequest;
use TurboDocx\Types\Requests\Partner\ListAuditLogsRequest;
use TurboDocx\Types\Requests\Partner\ListOrgApiKeysRequest;
use TurboDocx\Types\Requests\Partner\ListOrganizationsRequest;
use TurboDocx\Types\Requests\Partner\ListOrgUsersRequest;
use TurboDocx\Types\Requests\Partner\ListPartnerApiKeysRequest;
use TurboDocx\Types\Requests\Partner\ListPartnerUsersRequest;
use TurboDocx\Types\Requests\Partner\UpdateEntitlementsRequest;
use TurboDocx\Types\Requests\Partner\UpdateOrgApiKeyRequest;
use TurboDocx\Types\Requests\Partner\UpdateOrganizationRequest;
use TurboDocx\Types\Requests\Partner\UpdatePartnerApiKeyRequest;
use TurboDocx\Types\Requests\Partner\UpdatePartnerUserRequest;
use TurboDocx\Types\Requests\Partner\UpdateOrgUserRequest;
use TurboDocx\Types\Responses\Partner\AuditLogListResponse;
use TurboDocx\Types\Responses\Partner\EntitlementsResponse;
use TurboDocx\Types\Responses\Partner\OrgApiKeyListResponse;
use TurboDocx\Types\Responses\Partner\OrgApiKeyResponse;
use TurboDocx\Types\Responses\Partner\OrganizationDetailResponse;
use TurboDocx\Types\Responses\Partner\OrganizationListResponse;
use TurboDocx\Types\Responses\Partner\OrganizationResponse;
use TurboDocx\Types\Responses\Partner\OrgUserListResponse;
use TurboDocx\Types\Responses\Partner\OrgUserResponse;
use TurboDocx\Types\Responses\Partner\PartnerApiKeyListResponse;
use TurboDocx\Types\Responses\Partner\PartnerApiKeyResponse;
use TurboDocx\Types\Responses\Partner\PartnerUserListResponse;
use TurboDocx\Types\Responses\Partner\PartnerUserResponse;
use TurboDocx\Types\Responses\Partner\SuccessResponse;

/**
 * TurboPartner - Partner Portal operations
 *
 * Static class for managing organizations, users, API keys,
 * entitlements, and audit logs via Partner API keys.
 *
 * @example
 * ```php
 * TurboPartner::configure(new PartnerClientConfig(
 *     partnerApiKey: 'TDXP-your-partner-api-key',
 *     partnerId: 'your-partner-uuid',
 * ));
 *
 * $org = TurboPartner::createOrganization(
 *     new CreateOrganizationRequest(name: 'Acme Corp')
 * );
 * ```
 */
final class TurboPartner
{
    private static ?HttpClient $client = null;
    private static ?PartnerClientConfig $config = null;

    /**
     * Configure TurboPartner with Partner API credentials
     *
     * @param PartnerClientConfig $config Partner configuration
     * @return void
     */
    public static function configure(PartnerClientConfig $config): void
    {
        self::$config = $config;
        self::$client = new HttpClient($config);
    }

    /**
     * Get client instance, auto-initialize from environment if needed
     *
     * @return HttpClient
     */
    private static function getClient(): HttpClient
    {
        if (self::$client === null) {
            self::$config = PartnerClientConfig::fromEnvironment();
            self::$client = new HttpClient(self::$config);
        }
        return self::$client;
    }

    /**
     * Get configured partner ID
     *
     * @return string
     */
    private static function getPartnerId(): string
    {
        if (self::$config === null) {
            self::$config = PartnerClientConfig::fromEnvironment();
            self::$client = new HttpClient(self::$config);
        }
        return self::$config->partnerId;
    }

    // ==================== Organization Management ====================

    /**
     * Create a new organization under this partner
     *
     * @param CreateOrganizationRequest $request Organization details
     * @return OrganizationResponse
     */
    public static function createOrganization(
        CreateOrganizationRequest $request
    ): OrganizationResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->post(
            "/partner/{$partnerId}/organization",
            $request->toArray()
        );
        return OrganizationResponse::fromArray($response);
    }

    /**
     * List all organizations under this partner with pagination and search
     *
     * @param ListOrganizationsRequest|null $request Pagination and search options
     * @return OrganizationListResponse
     */
    public static function listOrganizations(
        ?ListOrganizationsRequest $request = null
    ): OrganizationListResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get("/partner/{$partnerId}/organizations", $params);
        return OrganizationListResponse::fromArray($response);
    }

    /**
     * Get organization details including features, tracking, and usage statistics
     *
     * @param string $organizationId Organization UUID
     * @return OrganizationDetailResponse
     */
    public static function getOrganizationDetails(
        string $organizationId
    ): OrganizationDetailResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->get("/partner/{$partnerId}/organizations/{$organizationId}");
        return OrganizationDetailResponse::fromArray($response);
    }

    /**
     * Update organization name and metadata
     *
     * @param string $organizationId Organization UUID
     * @param UpdateOrganizationRequest $request Updated organization details
     * @return OrganizationResponse
     */
    public static function updateOrganizationInfo(
        string $organizationId,
        UpdateOrganizationRequest $request
    ): OrganizationResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->patch(
            "/partner/{$partnerId}/organizations/{$organizationId}",
            $request->toArray()
        );
        return OrganizationResponse::fromArray($response);
    }

    /**
     * Delete an organization (soft delete)
     *
     * @param string $organizationId Organization UUID
     * @return SuccessResponse
     */
    public static function deleteOrganization(
        string $organizationId
    ): SuccessResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->delete("/partner/{$partnerId}/organizations/{$organizationId}");
        return SuccessResponse::fromArray($response);
    }

    /**
     * Update organization entitlements (feature limits and capabilities)
     *
     * @param string $organizationId Organization UUID
     * @param UpdateEntitlementsRequest $request Entitlements to update
     * @return EntitlementsResponse
     */
    public static function updateOrganizationEntitlements(
        string $organizationId,
        UpdateEntitlementsRequest $request
    ): EntitlementsResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->patch(
            "/partner/{$partnerId}/organizations/{$organizationId}/entitlements",
            $request->toArray()
        );
        return EntitlementsResponse::fromArray($response);
    }

    // ==================== Organization User Management ====================

    /**
     * List all users within an organization with pagination and search
     *
     * @param string $organizationId Organization UUID
     * @param ListOrgUsersRequest|null $request Pagination and search options
     * @return OrgUserListResponse
     */
    public static function listOrganizationUsers(
        string $organizationId,
        ?ListOrgUsersRequest $request = null
    ): OrgUserListResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get(
            "/partner/{$partnerId}/organizations/{$organizationId}/users",
            $params
        );
        return OrgUserListResponse::fromArray($response);
    }

    /**
     * Add a new user to an organization (sends invitation email)
     *
     * @param string $organizationId Organization UUID
     * @param AddOrgUserRequest $request User email and role
     * @return OrgUserResponse
     */
    public static function addUserToOrganization(
        string $organizationId,
        AddOrgUserRequest $request
    ): OrgUserResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->post(
            "/partner/{$partnerId}/organizations/{$organizationId}/users",
            $request->toArray()
        );
        return OrgUserResponse::fromArray($response);
    }

    /**
     * Update a user's role within an organization
     *
     * @param string $organizationId Organization UUID
     * @param string $userId Target user UUID
     * @param UpdateOrgUserRequest $request New role
     * @return OrgUserResponse
     */
    public static function updateOrganizationUserRole(
        string $organizationId,
        string $userId,
        UpdateOrgUserRequest $request
    ): OrgUserResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->patch(
            "/partner/{$partnerId}/organizations/{$organizationId}/users/{$userId}",
            $request->toArray()
        );
        return OrgUserResponse::fromArray($response);
    }

    /**
     * Remove a user from an organization
     *
     * @param string $organizationId Organization UUID
     * @param string $userId Target user UUID
     * @return SuccessResponse
     */
    public static function removeUserFromOrganization(
        string $organizationId,
        string $userId
    ): SuccessResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->delete(
            "/partner/{$partnerId}/organizations/{$organizationId}/users/{$userId}"
        );
        return SuccessResponse::fromArray($response);
    }

    /**
     * Resend organization invitation email to a user
     *
     * @param string $organizationId Organization UUID
     * @param string $userId Target user UUID
     * @return SuccessResponse
     */
    public static function resendOrganizationInvitationToUser(
        string $organizationId,
        string $userId
    ): SuccessResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->post(
            "/partner/{$partnerId}/organizations/{$organizationId}/users/{$userId}/resend-invitation"
        );
        return SuccessResponse::fromArray($response);
    }

    // ==================== Organization API Key Management ====================

    /**
     * List all API keys for an organization with pagination and search
     *
     * @param string $organizationId Organization UUID
     * @param ListOrgApiKeysRequest|null $request Pagination and search options
     * @return OrgApiKeyListResponse
     */
    public static function listOrganizationApiKeys(
        string $organizationId,
        ?ListOrgApiKeysRequest $request = null
    ): OrgApiKeyListResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get(
            "/partner/{$partnerId}/organizations/{$organizationId}/apikeys",
            $params
        );
        return OrgApiKeyListResponse::fromArray($response);
    }

    /**
     * Create a new API key for an organization
     *
     * @param string $organizationId Organization UUID
     * @param CreateOrgApiKeyRequest $request API key name and role
     * @return OrgApiKeyResponse
     */
    public static function createOrganizationApiKey(
        string $organizationId,
        CreateOrgApiKeyRequest $request
    ): OrgApiKeyResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->post(
            "/partner/{$partnerId}/organizations/{$organizationId}/apikeys",
            $request->toArray()
        );
        return OrgApiKeyResponse::fromArray($response);
    }

    /**
     * Update an organization API key's name or settings
     *
     * @param string $organizationId Organization UUID
     * @param string $apiKeyId API key UUID
     * @param UpdateOrgApiKeyRequest $request Updated settings
     * @return OrgApiKeyResponse
     */
    public static function updateOrganizationApiKey(
        string $organizationId,
        string $apiKeyId,
        UpdateOrgApiKeyRequest $request
    ): OrgApiKeyResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->patch(
            "/partner/{$partnerId}/organizations/{$organizationId}/apikeys/{$apiKeyId}",
            $request->toArray()
        );
        return OrgApiKeyResponse::fromArray($response);
    }

    /**
     * Revoke and delete an organization API key
     *
     * @param string $organizationId Organization UUID
     * @param string $apiKeyId API key UUID
     * @return SuccessResponse
     */
    public static function revokeOrganizationApiKey(
        string $organizationId,
        string $apiKeyId
    ): SuccessResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->delete(
            "/partner/{$partnerId}/organizations/{$organizationId}/apikeys/{$apiKeyId}"
        );
        return SuccessResponse::fromArray($response);
    }

    // ==================== Partner API Key Management ====================

    /**
     * List all partner-level API keys with pagination and search
     *
     * @param ListPartnerApiKeysRequest|null $request Pagination and search options
     * @return PartnerApiKeyListResponse
     */
    public static function listPartnerApiKeys(
        ?ListPartnerApiKeysRequest $request = null
    ): PartnerApiKeyListResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get("/partner/{$partnerId}/api-keys", $params);
        return PartnerApiKeyListResponse::fromArray($response);
    }

    /**
     * Create a new partner API key with specified scopes and restrictions
     *
     * @param CreatePartnerApiKeyRequest $request API key name, scopes, and restrictions
     * @return PartnerApiKeyResponse
     */
    public static function createPartnerApiKey(
        CreatePartnerApiKeyRequest $request
    ): PartnerApiKeyResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->post(
            "/partner/{$partnerId}/api-keys",
            $request->toArray()
        );
        return PartnerApiKeyResponse::fromArray($response);
    }

    /**
     * Update a partner API key's name, scopes, or security settings
     *
     * @param string $keyId Partner API key UUID
     * @param UpdatePartnerApiKeyRequest $request Updated settings
     * @return PartnerApiKeyResponse
     */
    public static function updatePartnerApiKey(
        string $keyId,
        UpdatePartnerApiKeyRequest $request
    ): PartnerApiKeyResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->patch(
            "/partner/{$partnerId}/api-keys/{$keyId}",
            $request->toArray()
        );
        return PartnerApiKeyResponse::fromArray($response);
    }

    /**
     * Revoke and delete a partner API key
     *
     * @param string $keyId Partner API key UUID
     * @return SuccessResponse
     */
    public static function revokePartnerApiKey(
        string $keyId
    ): SuccessResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->delete("/partner/{$partnerId}/api-keys/{$keyId}");
        return SuccessResponse::fromArray($response);
    }

    // ==================== Partner User Management ====================

    /**
     * List all users with access to this partner portal
     *
     * @param ListPartnerUsersRequest|null $request Pagination and search options
     * @return PartnerUserListResponse
     */
    public static function listPartnerPortalUsers(
        ?ListPartnerUsersRequest $request = null
    ): PartnerUserListResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get("/partner/{$partnerId}/users", $params);
        return PartnerUserListResponse::fromArray($response);
    }

    /**
     * Add a new user to the partner portal (sends invitation email)
     *
     * @param AddPartnerUserRequest $request User email, role, and permissions
     * @return PartnerUserResponse
     */
    public static function addUserToPartnerPortal(
        AddPartnerUserRequest $request
    ): PartnerUserResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->post(
            "/partner/{$partnerId}/users",
            $request->toArray()
        );
        return PartnerUserResponse::fromArray($response);
    }

    /**
     * Update a partner user's role and permissions
     *
     * @param string $userId Target user UUID
     * @param UpdatePartnerUserRequest $request New role and/or permissions
     * @return PartnerUserResponse
     */
    public static function updatePartnerUserPermissions(
        string $userId,
        UpdatePartnerUserRequest $request
    ): PartnerUserResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->patch(
            "/partner/{$partnerId}/users/{$userId}",
            $request->toArray()
        );
        return PartnerUserResponse::fromArray($response);
    }

    /**
     * Remove a user's access from the partner portal
     *
     * @param string $userId Target user UUID
     * @return SuccessResponse
     */
    public static function removeUserFromPartnerPortal(
        string $userId
    ): SuccessResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->delete("/partner/{$partnerId}/users/{$userId}");
        return SuccessResponse::fromArray($response);
    }

    /**
     * Resend partner portal invitation email to a user
     *
     * @param string $userId Target user UUID
     * @return SuccessResponse
     */
    public static function resendPartnerPortalInvitationToUser(
        string $userId
    ): SuccessResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $response = $client->post(
            "/partner/{$partnerId}/users/{$userId}/resend-invitation"
        );
        return SuccessResponse::fromArray($response);
    }

    // ==================== Audit Logs ====================

    /**
     * Retrieve partner audit logs with filtering by action, resource, date range
     *
     * @param ListAuditLogsRequest|null $request Filter and pagination options
     * @return AuditLogListResponse
     */
    public static function getPartnerAuditLogs(
        ?ListAuditLogsRequest $request = null
    ): AuditLogListResponse {
        $client = self::getClient();
        $partnerId = self::getPartnerId();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get("/partner/{$partnerId}/audit-logs", $params);
        return AuditLogListResponse::fromArray($response);
    }
}
