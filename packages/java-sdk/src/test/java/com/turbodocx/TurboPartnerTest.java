package com.turbodocx;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.*;

import java.io.IOException;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TurboPartner Module Tests
 *
 * Tests for all 25 partner management methods plus configuration.
 */
class TurboPartnerTest {

    private MockWebServer server;
    private TurboPartnerClient client;
    private final Gson gson = new Gson();

    private static final String PARTNER_ID = "test-partner-id";

    @BeforeEach
    void setUp() throws IOException {
        server = new MockWebServer();
        server.start();

        client = new TurboPartnerClient.Builder()
                .partnerApiKey("TDXP-test-key")
                .partnerId(PARTNER_ID)
                .baseUrl(server.url("/").toString())
                .build();
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    // ============================================
    // Configuration Tests
    // ============================================

    @Test
    @DisplayName("should configure with partner API key and partner ID")
    void configureWithCredentials() {
        TurboPartnerClient c = new TurboPartnerClient.Builder()
                .partnerApiKey("TDXP-test")
                .partnerId("partner-123")
                .build();
        assertNotNull(c);
        assertNotNull(c.turboPartner());
    }

    @Test
    @DisplayName("should configure with custom base URL")
    void configureWithCustomBaseUrl() {
        TurboPartnerClient c = new TurboPartnerClient.Builder()
                .partnerApiKey("TDXP-test")
                .partnerId("partner-123")
                .baseUrl("https://staging-api.example.com")
                .build();
        assertNotNull(c);
    }

    @Test
    @DisplayName("should throw error when partner API key is missing")
    void errorWhenNoPartnerApiKey() {
        assertThrows(TurboDocxException.AuthenticationException.class, () ->
                new TurboPartnerClient.Builder()
                        .partnerId("partner-123")
                        .build());
    }

    @Test
    @DisplayName("should throw error when partner ID is missing")
    void errorWhenNoPartnerId() {
        assertThrows(TurboDocxException.AuthenticationException.class, () ->
                new TurboPartnerClient.Builder()
                        .partnerApiKey("TDXP-test")
                        .build());
    }

    @Test
    @DisplayName("should send Bearer token in Authorization header")
    void shouldSendBearerToken() throws Exception {
        enqueueSuccess(Map.of("success", true, "data", Map.of("id", "org-1")));

        client.turboPartner().createOrganization("Test");

        RecordedRequest request = server.takeRequest();
        assertEquals("Bearer TDXP-test-key", request.getHeader("Authorization"));
    }

    @Test
    @DisplayName("should NOT send x-rapiddocx-org-id header")
    void shouldNotSendOrgIdHeader() throws Exception {
        enqueueSuccess(Map.of("success", true, "data", Map.of("id", "org-1")));

        client.turboPartner().createOrganization("Test");

        RecordedRequest request = server.takeRequest();
        assertNull(request.getHeader("x-rapiddocx-org-id"));
    }

    // ============================================
    // Organization Management Tests
    // ============================================

    @Test
    @DisplayName("should create organization with name only")
    void createOrganizationNameOnly() throws Exception {
        enqueueSuccess(Map.of("success", true, "data", Map.of("id", "org-1", "name", "Acme")));

        JsonObject result = client.turboPartner().createOrganization("Acme");

        assertTrue(result.get("success").getAsBoolean());
        assertEquals("org-1", result.getAsJsonObject("data").get("id").getAsString());

        RecordedRequest request = server.takeRequest();
        assertEquals("POST", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/organization", request.getPath());
    }

    @Test
    @DisplayName("should create organization with features")
    void createOrganizationWithFeatures() throws Exception {
        enqueueSuccess(Map.of("success", true, "data", Map.of("id", "org-2")));

        Map<String, Object> features = new LinkedHashMap<>();
        features.put("maxUsers", 25);
        features.put("hasTDAI", true);

        JsonObject result = client.turboPartner().createOrganization("Acme", null, features);

        assertTrue(result.get("success").getAsBoolean());

        RecordedRequest request = server.takeRequest();
        String body = request.getBody().readUtf8();
        assertTrue(body.contains("\"maxUsers\":25"));
        assertTrue(body.contains("\"hasTDAI\":true"));
    }

    @Test
    @DisplayName("should create organization with metadata")
    void createOrganizationWithMetadata() throws Exception {
        enqueueSuccess(Map.of("success", true, "data", Map.of("id", "org-3")));

        Map<String, Object> metadata = Map.of("plan", "enterprise");
        client.turboPartner().createOrganization("Acme", metadata, null);

        RecordedRequest request = server.takeRequest();
        String body = request.getBody().readUtf8();
        assertTrue(body.contains("\"metadata\""));
        assertTrue(body.contains("\"plan\":\"enterprise\""));
    }

    @Test
    @DisplayName("should list organizations with pagination")
    void listOrganizations() throws Exception {
        enqueueSuccess(Map.of("success", true, "data",
                Map.of("results", List.of(), "totalRecords", 0)));

        JsonObject result = client.turboPartner().listOrganizations(10, 0, "acme");

        assertTrue(result.get("success").getAsBoolean());

        RecordedRequest request = server.takeRequest();
        assertEquals("GET", request.getMethod());
        assertTrue(request.getPath().contains("/organizations?"));
        assertTrue(request.getPath().contains("limit=10"));
        assertTrue(request.getPath().contains("offset=0"));
        assertTrue(request.getPath().contains("search=acme"));
    }

    @Test
    @DisplayName("should list organizations without optional params")
    void listOrganizationsNoParams() throws Exception {
        enqueueSuccess(Map.of("success", true, "data", Map.of("results", List.of())));

        client.turboPartner().listOrganizations(null, null, null);

        RecordedRequest request = server.takeRequest();
        assertEquals("/partner/" + PARTNER_ID + "/organizations", request.getPath());
    }

    @Test
    @DisplayName("should get organization details")
    void getOrganizationDetails() throws Exception {
        enqueueSuccess(Map.of("success", true, "data",
                Map.of("id", "org-1", "name", "Acme", "isActive", true)));

        JsonObject result = client.turboPartner().getOrganizationDetails("org-1");

        assertEquals("Acme", result.getAsJsonObject("data").get("name").getAsString());

        RecordedRequest request = server.takeRequest();
        assertEquals("GET", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/organizations/org-1", request.getPath());
    }

    @Test
    @DisplayName("should update organization info")
    void updateOrganizationInfo() throws Exception {
        enqueueSuccess(Map.of("success", true, "data", Map.of("name", "Acme Updated")));

        client.turboPartner().updateOrganizationInfo("org-1", "Acme Updated");

        RecordedRequest request = server.takeRequest();
        assertEquals("PATCH", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/organizations/org-1", request.getPath());
        assertTrue(request.getBody().readUtf8().contains("\"name\":\"Acme Updated\""));
    }

    @Test
    @DisplayName("should delete organization")
    void deleteOrganization() throws Exception {
        enqueueSuccess(Map.of("success", true, "message", "Organization deleted"));

        JsonObject result = client.turboPartner().deleteOrganization("org-1");

        assertTrue(result.get("success").getAsBoolean());

        RecordedRequest request = server.takeRequest();
        assertEquals("DELETE", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/organizations/org-1", request.getPath());
    }

    @Test
    @DisplayName("should update organization entitlements")
    void updateOrganizationEntitlements() throws Exception {
        enqueueSuccess(Map.of("success", true, "data", Map.of()));

        Map<String, Object> features = Map.of("maxUsers", 100);
        Map<String, Object> tracking = Map.of("numUsers", 5);

        client.turboPartner().updateOrganizationEntitlements("org-1", features, tracking);

        RecordedRequest request = server.takeRequest();
        assertEquals("PATCH", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/organizations/org-1/entitlements", request.getPath());
        String body = request.getBody().readUtf8();
        assertTrue(body.contains("\"features\""));
        assertTrue(body.contains("\"tracking\""));
    }

    // ============================================
    // Organization User Management Tests
    // ============================================

    @Test
    @DisplayName("should list organization users")
    void listOrganizationUsers() throws Exception {
        enqueueSuccess(Map.of("success", true, "data",
                Map.of("results", List.of(), "totalRecords", 0)));

        client.turboPartner().listOrganizationUsers("org-1", 50, 0, "admin");

        RecordedRequest request = server.takeRequest();
        assertEquals("GET", request.getMethod());
        assertTrue(request.getPath().contains("/organizations/org-1/users?"));
        assertTrue(request.getPath().contains("limit=50"));
        assertTrue(request.getPath().contains("search=admin"));
    }

    @Test
    @DisplayName("should add user to organization")
    void addUserToOrganization() throws Exception {
        enqueueSuccess(Map.of("success", true, "data",
                Map.of("id", "user-1", "email", "user@test.com", "role", "admin")));

        JsonObject result = client.turboPartner().addUserToOrganization("org-1", "user@test.com", "admin");

        assertEquals("user-1", result.getAsJsonObject("data").get("id").getAsString());

        RecordedRequest request = server.takeRequest();
        assertEquals("POST", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/organizations/org-1/users", request.getPath());
    }

    @Test
    @DisplayName("should update organization user role")
    void updateOrganizationUserRole() throws Exception {
        enqueueSuccess(Map.of("success", true, "data", Map.of("role", "contributor")));

        client.turboPartner().updateOrganizationUserRole("org-1", "user-1", "contributor");

        RecordedRequest request = server.takeRequest();
        assertEquals("PATCH", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/organizations/org-1/users/user-1", request.getPath());
        assertTrue(request.getBody().readUtf8().contains("\"role\":\"contributor\""));
    }

    @Test
    @DisplayName("should remove user from organization")
    void removeUserFromOrganization() throws Exception {
        enqueueSuccess(Map.of("success", true, "message", "User removed"));

        client.turboPartner().removeUserFromOrganization("org-1", "user-1");

        RecordedRequest request = server.takeRequest();
        assertEquals("DELETE", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/organizations/org-1/users/user-1", request.getPath());
    }

    @Test
    @DisplayName("should resend organization invitation")
    void resendOrganizationInvitation() throws Exception {
        enqueueSuccess(Map.of("success", true, "message", "Invitation resent"));

        client.turboPartner().resendOrganizationInvitationToUser("org-1", "user-1");

        RecordedRequest request = server.takeRequest();
        assertEquals("POST", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/organizations/org-1/users/user-1/resend-invitation", request.getPath());
    }

    // ============================================
    // Organization API Key Management Tests
    // ============================================

    @Test
    @DisplayName("should list organization API keys")
    void listOrganizationApiKeys() throws Exception {
        enqueueSuccess(Map.of("success", true, "data",
                Map.of("results", List.of(), "totalRecords", 0)));

        client.turboPartner().listOrganizationApiKeys("org-1", 50, null, null);

        RecordedRequest request = server.takeRequest();
        assertEquals("GET", request.getMethod());
        assertTrue(request.getPath().contains("/organizations/org-1/apikeys"));
    }

    @Test
    @DisplayName("should create organization API key")
    void createOrganizationApiKey() throws Exception {
        enqueueSuccess(Map.of("success", true, "data",
                Map.of("id", "key-1", "key", "TDX-abc123", "name", "Prod Key", "role", "admin")));

        JsonObject result = client.turboPartner().createOrganizationApiKey("org-1", "Prod Key", "admin");

        assertEquals("TDX-abc123", result.getAsJsonObject("data").get("key").getAsString());

        RecordedRequest request = server.takeRequest();
        assertEquals("POST", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/organizations/org-1/apikeys", request.getPath());
    }

    @Test
    @DisplayName("should update organization API key")
    void updateOrganizationApiKey() throws Exception {
        enqueueSuccess(Map.of("success", true, "message", "Updated"));

        client.turboPartner().updateOrganizationApiKey("org-1", "key-1", "New Name", "contributor");

        RecordedRequest request = server.takeRequest();
        assertEquals("PATCH", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/organizations/org-1/apikeys/key-1", request.getPath());
        String body = request.getBody().readUtf8();
        assertTrue(body.contains("\"name\":\"New Name\""));
        assertTrue(body.contains("\"role\":\"contributor\""));
    }

    @Test
    @DisplayName("should revoke organization API key")
    void revokeOrganizationApiKey() throws Exception {
        enqueueSuccess(Map.of("success", true, "message", "Key revoked"));

        client.turboPartner().revokeOrganizationApiKey("org-1", "key-1");

        RecordedRequest request = server.takeRequest();
        assertEquals("DELETE", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/organizations/org-1/apikeys/key-1", request.getPath());
    }

    // ============================================
    // Partner API Key Management Tests
    // ============================================

    @Test
    @DisplayName("should list partner API keys")
    void listPartnerApiKeys() throws Exception {
        enqueueSuccess(Map.of("success", true, "data",
                Map.of("results", List.of(), "totalRecords", 0)));

        client.turboPartner().listPartnerApiKeys(50, null, null);

        RecordedRequest request = server.takeRequest();
        assertEquals("GET", request.getMethod());
        assertTrue(request.getPath().contains("/api-keys"));
    }

    @Test
    @DisplayName("should create partner API key with scopes")
    void createPartnerApiKey() throws Exception {
        enqueueSuccess(Map.of("success", true, "data",
                Map.of("id", "pkey-1", "key", "TDXP-abc123")));

        List<String> scopes = Arrays.asList(PartnerScope.ORG_READ, PartnerScope.AUDIT_READ);
        JsonObject result = client.turboPartner().createPartnerApiKey("Read-Only Key", scopes, "For monitoring");

        assertEquals("TDXP-abc123", result.getAsJsonObject("data").get("key").getAsString());

        RecordedRequest request = server.takeRequest();
        assertEquals("POST", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/api-keys", request.getPath());
        String body = request.getBody().readUtf8();
        assertTrue(body.contains("\"org:read\""));
        assertTrue(body.contains("\"audit:read\""));
        assertTrue(body.contains("\"description\":\"For monitoring\""));
    }

    @Test
    @DisplayName("should update partner API key")
    void updatePartnerApiKey() throws Exception {
        enqueueSuccess(Map.of("success", true, "message", "Updated"));

        List<String> scopes = Arrays.asList(PartnerScope.ORG_READ);
        client.turboPartner().updatePartnerApiKey("pkey-1", "Updated Name", null, scopes);

        RecordedRequest request = server.takeRequest();
        assertEquals("PATCH", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/api-keys/pkey-1", request.getPath());
        String body = request.getBody().readUtf8();
        assertTrue(body.contains("\"name\":\"Updated Name\""));
        assertTrue(body.contains("\"org:read\""));
        assertFalse(body.contains("\"description\""));
    }

    @Test
    @DisplayName("should revoke partner API key")
    void revokePartnerApiKey() throws Exception {
        enqueueSuccess(Map.of("success", true, "message", "Key revoked"));

        client.turboPartner().revokePartnerApiKey("pkey-1");

        RecordedRequest request = server.takeRequest();
        assertEquals("DELETE", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/api-keys/pkey-1", request.getPath());
    }

    // ============================================
    // Partner Portal User Management Tests
    // ============================================

    @Test
    @DisplayName("should list partner portal users")
    void listPartnerPortalUsers() throws Exception {
        enqueueSuccess(Map.of("success", true, "data",
                Map.of("results", List.of(), "totalRecords", 0)));

        client.turboPartner().listPartnerPortalUsers(50, 0, null);

        RecordedRequest request = server.takeRequest();
        assertEquals("GET", request.getMethod());
        assertTrue(request.getPath().contains("/users?"));
        assertTrue(request.getPath().contains("limit=50"));
    }

    @Test
    @DisplayName("should add user to partner portal")
    void addUserToPartnerPortal() throws Exception {
        enqueueSuccess(Map.of("success", true, "data",
                Map.of("id", "puser-1", "email", "ops@partner.com")));

        Map<String, Boolean> permissions = new LinkedHashMap<>();
        permissions.put("canManageOrgs", true);
        permissions.put("canViewAuditLogs", true);

        JsonObject result = client.turboPartner().addUserToPartnerPortal("ops@partner.com", "member", permissions);

        assertEquals("puser-1", result.getAsJsonObject("data").get("id").getAsString());

        RecordedRequest request = server.takeRequest();
        assertEquals("POST", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/users", request.getPath());
        String body = request.getBody().readUtf8();
        assertTrue(body.contains("\"email\":\"ops@partner.com\""));
        assertTrue(body.contains("\"role\":\"member\""));
        assertTrue(body.contains("\"permissions\""));
    }

    @Test
    @DisplayName("should update partner user permissions")
    void updatePartnerUserPermissions() throws Exception {
        enqueueSuccess(Map.of("success", true, "data", Map.of("role", "admin")));

        Map<String, Boolean> permissions = Map.of("canManageOrgs", true, "canManagePartnerUsers", true);
        client.turboPartner().updatePartnerUserPermissions("puser-1", "admin", permissions);

        RecordedRequest request = server.takeRequest();
        assertEquals("PATCH", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/users/puser-1", request.getPath());
    }

    @Test
    @DisplayName("should remove user from partner portal")
    void removeUserFromPartnerPortal() throws Exception {
        enqueueSuccess(Map.of("success", true, "message", "User removed"));

        client.turboPartner().removeUserFromPartnerPortal("puser-1");

        RecordedRequest request = server.takeRequest();
        assertEquals("DELETE", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/users/puser-1", request.getPath());
    }

    @Test
    @DisplayName("should resend partner portal invitation")
    void resendPartnerPortalInvitation() throws Exception {
        enqueueSuccess(Map.of("success", true, "message", "Invitation resent"));

        client.turboPartner().resendPartnerPortalInvitationToUser("puser-1");

        RecordedRequest request = server.takeRequest();
        assertEquals("POST", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/users/puser-1/resend-invitation", request.getPath());
    }

    // ============================================
    // Audit Logs Tests
    // ============================================

    @Test
    @DisplayName("should get audit logs with filters")
    void getPartnerAuditLogs() throws Exception {
        enqueueSuccess(Map.of("success", true, "data",
                Map.of("results", List.of(), "totalRecords", 0)));

        client.turboPartner().getPartnerAuditLogs(
                10, 0, "acme", "ORG_CREATED", "organization", "org-1",
                true, "2024-01-01", "2024-12-31"
        );

        RecordedRequest request = server.takeRequest();
        assertEquals("GET", request.getMethod());
        String path = request.getPath();
        assertTrue(path.contains("/audit-logs?"));
        assertTrue(path.contains("limit=10"));
        assertTrue(path.contains("action=ORG_CREATED"));
        assertTrue(path.contains("resourceType=organization"));
        assertTrue(path.contains("resourceId=org-1"));
        assertTrue(path.contains("success=true"));
        assertTrue(path.contains("startDate=2024-01-01"));
        assertTrue(path.contains("endDate=2024-12-31"));
    }

    @Test
    @DisplayName("should get audit logs without filters")
    void getPartnerAuditLogsNoFilters() throws Exception {
        enqueueSuccess(Map.of("success", true, "data",
                Map.of("results", List.of(), "totalRecords", 0)));

        client.turboPartner().getPartnerAuditLogs(null, null, null, null, null, null, null, null, null);

        RecordedRequest request = server.takeRequest();
        assertEquals("/partner/" + PARTNER_ID + "/audit-logs", request.getPath());
    }

    // ============================================
    // Error Handling Tests
    // ============================================

    @Test
    @DisplayName("should throw NotFoundException for 404")
    void handleNotFoundError() {
        server.enqueue(new MockResponse()
                .setResponseCode(404)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of("message", "Organization not found", "code", "NOT_FOUND"))));

        TurboDocxException.NotFoundException e = assertThrows(
                TurboDocxException.NotFoundException.class,
                () -> client.turboPartner().getOrganizationDetails("invalid-id"));

        assertEquals(404, e.getStatusCode());
        assertEquals("Organization not found", e.getMessage());
        assertEquals("NOT_FOUND", e.getCode());
    }

    @Test
    @DisplayName("should throw ValidationException for 400")
    void handleValidationError() {
        server.enqueue(new MockResponse()
                .setResponseCode(400)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of("message", "Name is required"))));

        TurboDocxException.ValidationException e = assertThrows(
                TurboDocxException.ValidationException.class,
                () -> client.turboPartner().createOrganization(""));

        assertEquals(400, e.getStatusCode());
    }

    @Test
    @DisplayName("should throw AuthenticationException for 401")
    void handleAuthenticationError() {
        server.enqueue(new MockResponse()
                .setResponseCode(401)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of("message", "Invalid API key"))));

        assertThrows(TurboDocxException.AuthenticationException.class,
                () -> client.turboPartner().listOrganizations(null, null, null));
    }

    @Test
    @DisplayName("should throw RateLimitException for 429")
    void handleRateLimitError() {
        server.enqueue(new MockResponse()
                .setResponseCode(429)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of("message", "Rate limit exceeded"))));

        assertThrows(TurboDocxException.RateLimitException.class,
                () -> client.turboPartner().listOrganizations(null, null, null));
    }

    // ============================================
    // Scope Constants Tests
    // ============================================

    @Test
    @DisplayName("should have correct scope constant values")
    void scopeConstants() {
        assertEquals("org:create", PartnerScope.ORG_CREATE);
        assertEquals("org:read", PartnerScope.ORG_READ);
        assertEquals("org:update", PartnerScope.ORG_UPDATE);
        assertEquals("org:delete", PartnerScope.ORG_DELETE);
        assertEquals("entitlements:update", PartnerScope.ENTITLEMENTS_UPDATE);
        assertEquals("org-users:create", PartnerScope.ORG_USERS_CREATE);
        assertEquals("org-users:read", PartnerScope.ORG_USERS_READ);
        assertEquals("org-users:update", PartnerScope.ORG_USERS_UPDATE);
        assertEquals("org-users:delete", PartnerScope.ORG_USERS_DELETE);
        assertEquals("partner-users:create", PartnerScope.PARTNER_USERS_CREATE);
        assertEquals("partner-users:read", PartnerScope.PARTNER_USERS_READ);
        assertEquals("partner-users:update", PartnerScope.PARTNER_USERS_UPDATE);
        assertEquals("partner-users:delete", PartnerScope.PARTNER_USERS_DELETE);
        assertEquals("org-apikeys:create", PartnerScope.ORG_APIKEYS_CREATE);
        assertEquals("org-apikeys:read", PartnerScope.ORG_APIKEYS_READ);
        assertEquals("org-apikeys:update", PartnerScope.ORG_APIKEYS_UPDATE);
        assertEquals("org-apikeys:delete", PartnerScope.ORG_APIKEYS_DELETE);
        assertEquals("partner-apikeys:create", PartnerScope.PARTNER_APIKEYS_CREATE);
        assertEquals("partner-apikeys:read", PartnerScope.PARTNER_APIKEYS_READ);
        assertEquals("partner-apikeys:update", PartnerScope.PARTNER_APIKEYS_UPDATE);
        assertEquals("partner-apikeys:delete", PartnerScope.PARTNER_APIKEYS_DELETE);
        assertEquals("audit:read", PartnerScope.AUDIT_READ);
    }

    // ============================================
    // Helpers
    // ============================================

    private void enqueueSuccess(Map<String, Object> data) {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(data)));
    }
}
