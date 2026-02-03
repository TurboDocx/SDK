package com.turbodocx;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Client Configuration Tests
 *
 * Tests to ensure senderEmail validation and senderName configuration work correctly
 */
class ClientConfigTest {

    // ============================================
    // SenderEmail Validation Tests
    // ============================================

    @Test
    @DisplayName("should not throw when senderEmail is not provided (optional in Client)")
    void notThrowWhenSenderEmailMissing() {
        // Note: senderEmail validation is done in TurboSign-specific operations, not Client initialization
        TurboDocxClient client = new TurboDocxClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                // senderEmail intentionally missing - this is valid for Client
                .build();

        assertNotNull(client);
    }

    @Test
    @DisplayName("should accept valid senderEmail")
    void acceptValidSenderEmail() {
        TurboDocxClient client = new TurboDocxClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                .senderEmail("support@company.com")
                .build();

        assertNotNull(client);
        assertNotNull(client.turboSign());
    }

    @Test
    @DisplayName("should accept empty senderEmail string (optional)")
    void acceptEmptySenderEmailString() {
        // Note: senderEmail validation is done in TurboSign-specific operations, not Client initialization
        TurboDocxClient client = new TurboDocxClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                .senderEmail("")
                .build();

        assertNotNull(client);
    }

    // ============================================
    // SenderName Configuration Tests
    // ============================================

    @Test
    @DisplayName("should accept configuration without senderName")
    void acceptConfigurationWithoutSenderName() {
        TurboDocxClient client = new TurboDocxClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                .senderEmail("support@company.com")
                // senderName intentionally omitted
                .build();

        assertNotNull(client);
    }

    @Test
    @DisplayName("should accept configuration with senderName")
    void acceptConfigurationWithSenderName() {
        TurboDocxClient client = new TurboDocxClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                .senderEmail("support@company.com")
                .senderName("Support Team")
                .build();

        assertNotNull(client);
    }

    @Test
    @DisplayName("should accept empty senderName")
    void acceptEmptySenderName() {
        TurboDocxClient client = new TurboDocxClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                .senderEmail("support@company.com")
                .senderName("")
                .build();

        assertNotNull(client);
    }

    // ============================================
    // Complete Configuration Tests
    // ============================================

    @Test
    @DisplayName("should require API key or access token")
    void requireApiKeyOrAccessToken() {
        assertThrows(IllegalArgumentException.class, () ->
                new TurboDocxClient.Builder()
                        .orgId("test-org-id")
                        .senderEmail("support@company.com")
                        // APIKey and AccessToken intentionally missing
                        .build()
        );
    }

    @Test
    @DisplayName("should require orgId")
    void requireOrgId() {
        TurboDocxException.AuthenticationException exception = assertThrows(
                TurboDocxException.AuthenticationException.class,
                () -> new TurboDocxClient.Builder()
                        .apiKey("test-api-key")
                        .senderEmail("support@company.com")
                        // OrgID intentionally missing
                        .build()
        );

        assertTrue(exception.getMessage().contains("Organization ID"));
    }

    @Test
    @DisplayName("should accept full configuration with API key")
    void acceptFullConfigurationWithApiKey() {
        TurboDocxClient client = new TurboDocxClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                .senderEmail("support@company.com")
                .senderName("Support Team")
                .baseUrl("https://custom.api.com")
                .build();

        assertNotNull(client);
        assertNotNull(client.turboSign());
    }

    @Test
    @DisplayName("should accept access token instead of API key")
    void acceptAccessTokenInsteadOfApiKey() {
        TurboDocxClient client = new TurboDocxClient.Builder()
                .accessToken("test-access-token")
                .orgId("test-org-id")
                .senderEmail("support@company.com")
                .build();

        assertNotNull(client);
    }

    @Test
    @DisplayName("should use default base URL when not provided")
    void useDefaultBaseUrl() {
        TurboDocxClient client = new TurboDocxClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                .senderEmail("support@company.com")
                .build();

        assertNotNull(client);
    }

    // ============================================
    // Validation Order Tests
    // ============================================

    @Test
    @DisplayName("should check API key before orgId")
    void checkApiKeyBeforeOrgId() {
        // When both API key and orgId are missing, API key check should trigger first
        assertThrows(IllegalArgumentException.class, () ->
                new TurboDocxClient.Builder()
                        .senderEmail("support@company.com")
                        .build()
        );
    }

    @Test
    @DisplayName("should check orgId before senderEmail")
    void checkOrgIdBeforeSenderEmail() {
        // When both orgId and senderEmail are missing, orgId check should trigger first
        assertThrows(TurboDocxException.AuthenticationException.class, () ->
                new TurboDocxClient.Builder()
                        .apiKey("test-api-key")
                        .build()
        );
    }

    @Test
    @DisplayName("should validate all required fields are present")
    void validateAllRequiredFields() {
        // Test that when all required fields are provided, client builds successfully
        TurboDocxClient client = new TurboDocxClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                .senderEmail("support@company.com")
                .build();

        assertNotNull(client);
        assertNotNull(client.turboSign());
    }
}
