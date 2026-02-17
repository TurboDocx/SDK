package com.turbodocx;

import com.google.gson.JsonObject;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * TurboPartner module for partner portal management operations.
 *
 * <p>Provides partner-level management for multi-tenant applications:</p>
 * <ul>
 *   <li>Organization management (CRUD, entitlements)</li>
 *   <li>Organization user management</li>
 *   <li>Organization API key management</li>
 *   <li>Partner API key management</li>
 *   <li>Partner portal user management</li>
 *   <li>Audit logs</li>
 * </ul>
 *
 * <p>All methods return {@link JsonObject} containing the raw API response
 * with {@code success}, {@code data}, and optionally {@code message} fields.</p>
 */
public class TurboPartner {

    private final PartnerHttpClient httpClient;
    private final String partnerId;

    TurboPartner(PartnerHttpClient httpClient, String partnerId) {
        this.httpClient = httpClient;
        this.partnerId = partnerId;
    }

    private String basePath() {
        return "/partner/" + partnerId;
    }

    // =========================================================================
    // Organization Management
    // =========================================================================

    /**
     * Create a new organization under the partner account.
     *
     * @param name     Organization name (required)
     * @param metadata Optional metadata key-value pairs (may be null)
     * @param features Optional entitlement configuration (may be null)
     * @return JsonObject with success and data (organization details)
     * @throws IOException if the request fails
     */
    public JsonObject createOrganization(String name, Map<String, Object> metadata, Map<String, Object> features) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", name);
        if (metadata != null) {
            body.put("metadata", metadata);
        }
        if (features != null) {
            body.put("features", features);
        }
        return httpClient.post(basePath() + "/organization", body);
    }

    /**
     * Create a new organization with just a name.
     *
     * @param name Organization name (required)
     * @return JsonObject with success and data (organization details)
     * @throws IOException if the request fails
     */
    public JsonObject createOrganization(String name) throws IOException {
        return createOrganization(name, null, null);
    }

    /**
     * List all organizations under the partner account.
     *
     * @param limit  Maximum number of results (may be null)
     * @param offset Pagination offset (may be null)
     * @param search Search query string (may be null)
     * @return JsonObject with success and data (results, totalRecords, limit, offset)
     * @throws IOException if the request fails
     */
    public JsonObject listOrganizations(Integer limit, Integer offset, String search) throws IOException {
        String qs = buildQueryString(
                "limit", limit,
                "offset", offset,
                "search", search
        );
        return httpClient.get(basePath() + "/organizations" + qs);
    }

    /**
     * Get full organization details including features and tracking.
     *
     * @param organizationId Organization UUID
     * @return JsonObject with success and data (organization info, features, tracking)
     * @throws IOException if the request fails
     */
    public JsonObject getOrganizationDetails(String organizationId) throws IOException {
        return httpClient.get(basePath() + "/organizations/" + organizationId);
    }

    /**
     * Update an organization's name.
     *
     * @param organizationId Organization UUID
     * @param name           New organization name
     * @return JsonObject with success and data (updated organization)
     * @throws IOException if the request fails
     */
    public JsonObject updateOrganizationInfo(String organizationId, String name) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", name);
        return httpClient.patch(basePath() + "/organizations/" + organizationId, body);
    }

    /**
     * Delete an organization.
     *
     * @param organizationId Organization UUID
     * @return JsonObject with success and message
     * @throws IOException if the request fails
     */
    public JsonObject deleteOrganization(String organizationId) throws IOException {
        return httpClient.delete(basePath() + "/organizations/" + organizationId);
    }

    /**
     * Update organization entitlements (feature limits and capabilities).
     *
     * @param organizationId Organization UUID
     * @param features       Feature configuration (may be null)
     * @param tracking       Tracking data (may be null)
     * @return JsonObject with success and data (features, tracking)
     * @throws IOException if the request fails
     */
    public JsonObject updateOrganizationEntitlements(String organizationId, Map<String, Object> features, Map<String, Object> tracking) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        if (features != null) {
            body.put("features", features);
        }
        if (tracking != null) {
            body.put("tracking", tracking);
        }
        return httpClient.patch(basePath() + "/organizations/" + organizationId + "/entitlements", body);
    }

    // =========================================================================
    // Organization User Management
    // =========================================================================

    /**
     * List users in an organization.
     *
     * @param organizationId Organization UUID
     * @param limit          Maximum number of results (may be null)
     * @param offset         Pagination offset (may be null)
     * @param search         Search query string (may be null)
     * @return JsonObject with success and data (results, totalRecords, limit, offset)
     * @throws IOException if the request fails
     */
    public JsonObject listOrganizationUsers(String organizationId, Integer limit, Integer offset, String search) throws IOException {
        String qs = buildQueryString(
                "limit", limit,
                "offset", offset,
                "search", search
        );
        return httpClient.get(basePath() + "/organizations/" + organizationId + "/users" + qs);
    }

    /**
     * Add a user to an organization.
     *
     * @param organizationId Organization UUID
     * @param email          User email address
     * @param role           User role ("admin", "contributor", "user", or "viewer")
     * @return JsonObject with success and data (user details)
     * @throws IOException if the request fails
     */
    public JsonObject addUserToOrganization(String organizationId, String email, String role) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", email);
        body.put("role", role);
        return httpClient.post(basePath() + "/organizations/" + organizationId + "/users", body);
    }

    /**
     * Update a user's role in an organization.
     *
     * @param organizationId Organization UUID
     * @param userId         User UUID
     * @param role           New role ("admin", "contributor", "user", or "viewer")
     * @return JsonObject with success and data (updated user)
     * @throws IOException if the request fails
     */
    public JsonObject updateOrganizationUserRole(String organizationId, String userId, String role) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("role", role);
        return httpClient.patch(basePath() + "/organizations/" + organizationId + "/users/" + userId, body);
    }

    /**
     * Remove a user from an organization.
     *
     * @param organizationId Organization UUID
     * @param userId         User UUID
     * @return JsonObject with success and message
     * @throws IOException if the request fails
     */
    public JsonObject removeUserFromOrganization(String organizationId, String userId) throws IOException {
        return httpClient.delete(basePath() + "/organizations/" + organizationId + "/users/" + userId);
    }

    /**
     * Resend invitation email to a user in an organization.
     *
     * @param organizationId Organization UUID
     * @param userId         User UUID
     * @return JsonObject with success and message
     * @throws IOException if the request fails
     */
    public JsonObject resendOrganizationInvitationToUser(String organizationId, String userId) throws IOException {
        return httpClient.post(basePath() + "/organizations/" + organizationId + "/users/" + userId + "/resend-invitation", null);
    }

    // =========================================================================
    // Organization API Key Management
    // =========================================================================

    /**
     * List API keys for an organization.
     *
     * @param organizationId Organization UUID
     * @param limit          Maximum number of results (may be null)
     * @param offset         Pagination offset (may be null)
     * @param search         Search query string (may be null)
     * @return JsonObject with success and data (results, totalRecords, limit, offset)
     * @throws IOException if the request fails
     */
    public JsonObject listOrganizationApiKeys(String organizationId, Integer limit, Integer offset, String search) throws IOException {
        String qs = buildQueryString(
                "limit", limit,
                "offset", offset,
                "search", search
        );
        return httpClient.get(basePath() + "/organizations/" + organizationId + "/apikeys" + qs);
    }

    /**
     * Create an API key for an organization.
     *
     * @param organizationId Organization UUID
     * @param name           API key name
     * @param role           API key role ("admin", "contributor", or "viewer")
     * @return JsonObject with success, data (key details including the key value), and message
     * @throws IOException if the request fails
     */
    public JsonObject createOrganizationApiKey(String organizationId, String name, String role) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", name);
        body.put("role", role);
        return httpClient.post(basePath() + "/organizations/" + organizationId + "/apikeys", body);
    }

    /**
     * Update an organization API key.
     *
     * @param organizationId Organization UUID
     * @param apiKeyId       API key UUID
     * @param name           New API key name (may be null to keep current)
     * @param role           New API key role (may be null to keep current)
     * @return JsonObject with success, message, and apiKey (updated key details)
     * @throws IOException if the request fails
     */
    public JsonObject updateOrganizationApiKey(String organizationId, String apiKeyId, String name, String role) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        if (name != null) {
            body.put("name", name);
        }
        if (role != null) {
            body.put("role", role);
        }
        return httpClient.patch(basePath() + "/organizations/" + organizationId + "/apikeys/" + apiKeyId, body);
    }

    /**
     * Revoke (delete) an organization API key.
     *
     * @param organizationId Organization UUID
     * @param apiKeyId       API key UUID
     * @return JsonObject with success and message
     * @throws IOException if the request fails
     */
    public JsonObject revokeOrganizationApiKey(String organizationId, String apiKeyId) throws IOException {
        return httpClient.delete(basePath() + "/organizations/" + organizationId + "/apikeys/" + apiKeyId);
    }

    // =========================================================================
    // Partner API Key Management
    // =========================================================================

    /**
     * List partner-level API keys.
     *
     * @param limit  Maximum number of results (may be null)
     * @param offset Pagination offset (may be null)
     * @param search Search query string (may be null)
     * @return JsonObject with success and data (results, totalRecords, limit, offset)
     * @throws IOException if the request fails
     */
    public JsonObject listPartnerApiKeys(Integer limit, Integer offset, String search) throws IOException {
        String qs = buildQueryString(
                "limit", limit,
                "offset", offset,
                "search", search
        );
        return httpClient.get(basePath() + "/api-keys" + qs);
    }

    /**
     * Create a partner-level API key with scoped permissions.
     *
     * @param name        API key name
     * @param scopes      List of permission scopes (use {@link PartnerScope} constants)
     * @param description Optional description (may be null)
     * @return JsonObject with success, data (key details including the key value), and message
     * @throws IOException if the request fails
     */
    public JsonObject createPartnerApiKey(String name, List<String> scopes, String description) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", name);
        body.put("scopes", scopes);
        if (description != null) {
            body.put("description", description);
        }
        return httpClient.post(basePath() + "/api-keys", body);
    }

    /**
     * Update a partner API key.
     *
     * @param keyId       API key UUID
     * @param name        New name (may be null to keep current)
     * @param description New description (may be null to keep current)
     * @param scopes      New scopes list (may be null to keep current)
     * @return JsonObject with success, message, and apiKey (updated key details)
     * @throws IOException if the request fails
     */
    public JsonObject updatePartnerApiKey(String keyId, String name, String description, List<String> scopes) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        if (name != null) {
            body.put("name", name);
        }
        if (description != null) {
            body.put("description", description);
        }
        if (scopes != null) {
            body.put("scopes", scopes);
        }
        return httpClient.patch(basePath() + "/api-keys/" + keyId, body);
    }

    /**
     * Revoke (delete) a partner API key.
     *
     * @param keyId API key UUID
     * @return JsonObject with success and message
     * @throws IOException if the request fails
     */
    public JsonObject revokePartnerApiKey(String keyId) throws IOException {
        return httpClient.delete(basePath() + "/api-keys/" + keyId);
    }

    // =========================================================================
    // Partner Portal User Management
    // =========================================================================

    /**
     * List users in the partner portal.
     *
     * @param limit  Maximum number of results (may be null)
     * @param offset Pagination offset (may be null)
     * @param search Search query string (may be null)
     * @return JsonObject with success and data (results, totalRecords, limit, offset)
     * @throws IOException if the request fails
     */
    public JsonObject listPartnerPortalUsers(Integer limit, Integer offset, String search) throws IOException {
        String qs = buildQueryString(
                "limit", limit,
                "offset", offset,
                "search", search
        );
        return httpClient.get(basePath() + "/users" + qs);
    }

    /**
     * Add a user to the partner portal.
     *
     * @param email       User email address
     * @param role        User role ("admin", "member", or "viewer")
     * @param permissions Permission flags with camelCase keys
     * @return JsonObject with success and data (user details)
     * @throws IOException if the request fails
     */
    public JsonObject addUserToPartnerPortal(String email, String role, Map<String, Boolean> permissions) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("email", email);
        body.put("role", role);
        body.put("permissions", permissions);
        return httpClient.post(basePath() + "/users", body);
    }

    /**
     * Update a partner portal user's role and/or permissions.
     *
     * @param userId      User UUID
     * @param role        New role (may be null to keep current)
     * @param permissions New permission flags (may be null to keep current)
     * @return JsonObject with success and data (userId, role, permissions)
     * @throws IOException if the request fails
     */
    public JsonObject updatePartnerUserPermissions(String userId, String role, Map<String, Boolean> permissions) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        if (role != null) {
            body.put("role", role);
        }
        if (permissions != null) {
            body.put("permissions", permissions);
        }
        return httpClient.patch(basePath() + "/users/" + userId, body);
    }

    /**
     * Remove a user from the partner portal.
     *
     * @param userId User UUID
     * @return JsonObject with success and message
     * @throws IOException if the request fails
     */
    public JsonObject removeUserFromPartnerPortal(String userId) throws IOException {
        return httpClient.delete(basePath() + "/users/" + userId);
    }

    /**
     * Resend partner portal invitation email to a user.
     *
     * @param userId User UUID
     * @return JsonObject with success and message
     * @throws IOException if the request fails
     */
    public JsonObject resendPartnerPortalInvitationToUser(String userId) throws IOException {
        return httpClient.post(basePath() + "/users/" + userId + "/resend-invitation", null);
    }

    // =========================================================================
    // Audit Logs
    // =========================================================================

    /**
     * Get partner audit logs with optional filtering.
     *
     * @param limit        Maximum number of results (may be null)
     * @param offset       Pagination offset (may be null)
     * @param search       Search query string (may be null)
     * @param action       Filter by action type (may be null)
     * @param resourceType Filter by resource type (may be null)
     * @param resourceId   Filter by resource ID (may be null)
     * @param success      Filter by success status (may be null)
     * @param startDate    Filter from date, ISO 8601 (may be null)
     * @param endDate      Filter to date, ISO 8601 (may be null)
     * @return JsonObject with success and data (results, totalRecords, limit, offset)
     * @throws IOException if the request fails
     */
    public JsonObject getPartnerAuditLogs(
            Integer limit, Integer offset, String search,
            String action, String resourceType, String resourceId,
            Boolean success, String startDate, String endDate
    ) throws IOException {
        String qs = buildQueryString(
                "limit", limit,
                "offset", offset,
                "search", search,
                "action", action,
                "resourceType", resourceType,
                "resourceId", resourceId,
                "success", success,
                "startDate", startDate,
                "endDate", endDate
        );
        return httpClient.get(basePath() + "/audit-logs" + qs);
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    /**
     * Build URL query string from key-value pairs, skipping null values.
     * Accepts alternating key (String) and value (Object) arguments.
     */
    private static String buildQueryString(Object... params) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < params.length - 1; i += 2) {
            String key = (String) params[i];
            Object value = params[i + 1];
            if (value != null) {
                sb.append(sb.length() == 0 ? "?" : "&");
                sb.append(URLEncoder.encode(key, StandardCharsets.UTF_8));
                sb.append("=");
                if (value instanceof Boolean) {
                    sb.append(((Boolean) value).toString().toLowerCase());
                } else {
                    sb.append(URLEncoder.encode(value.toString(), StandardCharsets.UTF_8));
                }
            }
        }
        return sb.toString();
    }
}
