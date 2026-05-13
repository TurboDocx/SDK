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
 * TurboPartner Webhook Management Tests
 *
 * Tests for webhook provisioning operations:
 * - createWebhook
 * - listWebhooks
 * - getWebhook
 * - updateWebhook
 * - deleteWebhook
 * - testWebhook
 * - listWebhookDeliveries
 */
class TurboPartnerWebhooksTest {

    private MockWebServer server;
    private TurboPartnerClient client;
    private final Gson gson = new Gson();

    private static final String PARTNER_ID = "test-partner-id";
    private static final String ORG_ID = "org-uuid-456";
    private static final String WEBHOOK_NAME = "my-signing-webhook";

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
    // createWebhook
    // ============================================

    @Test
    @DisplayName("should create a webhook and return result with secret")
    void createWebhookSuccess() throws Exception {
        JsonObject responseData = new JsonObject();
        responseData.addProperty("id", "webhook-uuid-789");
        responseData.addProperty("name", WEBHOOK_NAME);
        responseData.addProperty("isActive", true);
        responseData.addProperty("secret", "whsec_abc123");

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        response.add("data", responseData);

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(response)));

        Map<String, Object> result = client.turboPartner().createWebhook(
                ORG_ID,
                WEBHOOK_NAME,
                List.of("https://example.com/hook"),
                List.of("signature.document.completed"),
                null
        );

        RecordedRequest request = server.takeRequest();
        assertEquals("POST", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/orgs/" + ORG_ID + "/webhooks", request.getPath());
        assertEquals("Bearer TDXP-test-key", request.getHeader("Authorization"));

        assertTrue((Boolean) result.get("success"));
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.get("data");
        assertEquals(WEBHOOK_NAME, data.get("name"));
        assertEquals("whsec_abc123", data.get("secret"));
    }

    @Test
    @DisplayName("should throw AuthenticationException on 401")
    void createWebhookUnauthorized() {
        server.enqueue(new MockResponse()
                .setResponseCode(401)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"error\":\"Unauthorized\"}"));

        assertThrows(TurboDocxException.AuthenticationException.class, () ->
                client.turboPartner().createWebhook(
                        ORG_ID, WEBHOOK_NAME,
                        List.of("https://example.com/hook"),
                        List.of("signature.document.completed"),
                        null
                ));
    }

    // ============================================
    // listWebhooks
    // ============================================

    @Test
    @DisplayName("should list webhooks with pagination")
    void listWebhooksWithPagination() throws Exception {
        JsonObject responseData = new JsonObject();
        responseData.addProperty("totalRecords", 1);
        responseData.addProperty("limit", 10);
        responseData.addProperty("offset", 0);
        responseData.add("results", gson.toJsonTree(List.of(
                Map.of("id", "wh-1", "name", WEBHOOK_NAME)
        )));

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        response.add("data", responseData);

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(response)));

        Map<String, Object> result = client.turboPartner().listWebhooks(ORG_ID, 10, 0, null);

        RecordedRequest request = server.takeRequest();
        assertEquals("GET", request.getMethod());
        assertTrue(request.getPath().startsWith("/partner/" + PARTNER_ID + "/orgs/" + ORG_ID + "/webhooks"));
        assertTrue(request.getPath().contains("limit=10"));

        assertTrue((Boolean) result.get("success"));
    }

    @Test
    @DisplayName("should list webhooks without params")
    void listWebhooksNoParams() throws Exception {
        JsonObject responseData = new JsonObject();
        responseData.addProperty("totalRecords", 0);
        responseData.addProperty("limit", 50);
        responseData.addProperty("offset", 0);
        responseData.add("results", gson.toJsonTree(List.of()));

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        response.add("data", responseData);

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(response)));

        Map<String, Object> result = client.turboPartner().listWebhooks(ORG_ID, null, null, null);

        assertTrue((Boolean) result.get("success"));
    }

    // ============================================
    // getWebhook
    // ============================================

    @Test
    @DisplayName("should get webhook by name")
    void getWebhookByName() throws Exception {
        JsonObject responseData = new JsonObject();
        responseData.addProperty("id", "webhook-uuid-789");
        responseData.addProperty("name", WEBHOOK_NAME);

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        response.add("data", responseData);

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(response)));

        Map<String, Object> result = client.turboPartner().getWebhook(ORG_ID, WEBHOOK_NAME);

        RecordedRequest request = server.takeRequest();
        assertEquals("GET", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/orgs/" + ORG_ID + "/webhooks/" + WEBHOOK_NAME, request.getPath());

        assertTrue((Boolean) result.get("success"));
    }

    @Test
    @DisplayName("should throw NotFoundException on 404")
    void getWebhookNotFound() {
        server.enqueue(new MockResponse()
                .setResponseCode(404)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"error\":\"Not Found\"}"));

        assertThrows(TurboDocxException.NotFoundException.class, () ->
                client.turboPartner().getWebhook(ORG_ID, "nonexistent"));
    }

    // ============================================
    // updateWebhook
    // ============================================

    @Test
    @DisplayName("should update webhook isActive field")
    void updateWebhookIsActive() throws Exception {
        JsonObject responseData = new JsonObject();
        responseData.addProperty("id", "webhook-uuid-789");
        responseData.addProperty("name", WEBHOOK_NAME);
        responseData.addProperty("isActive", false);

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        response.add("data", responseData);

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(response)));

        Map<String, Object> updates = new HashMap<>();
        updates.put("isActive", false);

        Map<String, Object> result = client.turboPartner().updateWebhook(ORG_ID, WEBHOOK_NAME, updates);

        RecordedRequest request = server.takeRequest();
        assertEquals("PATCH", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/orgs/" + ORG_ID + "/webhooks/" + WEBHOOK_NAME, request.getPath());

        assertTrue((Boolean) result.get("success"));
    }

    // ============================================
    // deleteWebhook
    // ============================================

    @Test
    @DisplayName("should delete webhook successfully")
    void deleteWebhookSuccess() throws Exception {
        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        response.addProperty("message", "Webhook deleted");

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(response)));

        Map<String, Object> result = client.turboPartner().deleteWebhook(ORG_ID, WEBHOOK_NAME);

        RecordedRequest request = server.takeRequest();
        assertEquals("DELETE", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/orgs/" + ORG_ID + "/webhooks/" + WEBHOOK_NAME, request.getPath());

        assertTrue((Boolean) result.get("success"));
    }

    // ============================================
    // testWebhook
    // ============================================

    @Test
    @DisplayName("should send test event and return delivery summary")
    void testWebhookDefault() throws Exception {
        JsonObject summary = new JsonObject();
        summary.addProperty("total", 1);
        summary.addProperty("successful", 1);
        summary.addProperty("failed", 0);
        summary.add("errors", gson.toJsonTree(List.of()));

        JsonObject responseData = new JsonObject();
        responseData.add("deliveries", gson.toJsonTree(List.of()));
        responseData.add("summary", summary);

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        response.add("data", responseData);

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(response)));

        Map<String, Object> result = client.turboPartner().testWebhook(ORG_ID, WEBHOOK_NAME, null);

        RecordedRequest request = server.takeRequest();
        assertEquals("POST", request.getMethod());
        assertEquals("/partner/" + PARTNER_ID + "/orgs/" + ORG_ID + "/webhooks/" + WEBHOOK_NAME + "/test", request.getPath());

        assertTrue((Boolean) result.get("success"));
    }

    @Test
    @DisplayName("should pass event override to test endpoint")
    void testWebhookWithEventOverride() throws Exception {
        JsonObject summary = new JsonObject();
        summary.addProperty("total", 1);
        summary.addProperty("successful", 1);
        summary.addProperty("failed", 0);
        summary.add("errors", gson.toJsonTree(List.of()));

        JsonObject responseData = new JsonObject();
        responseData.add("deliveries", gson.toJsonTree(List.of()));
        responseData.add("summary", summary);

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        response.add("data", responseData);

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(response)));

        Map<String, Object> overrides = new HashMap<>();
        overrides.put("event", "signature.document.voided");

        Map<String, Object> result = client.turboPartner().testWebhook(ORG_ID, WEBHOOK_NAME, overrides);

        RecordedRequest request = server.takeRequest();
        String body = request.getBody().readUtf8();
        assertTrue(body.contains("signature.document.voided"));

        assertTrue((Boolean) result.get("success"));
    }

    // ============================================
    // listWebhookDeliveries
    // ============================================

    @Test
    @DisplayName("should list webhook deliveries with pagination")
    void listWebhookDeliveries() throws Exception {
        JsonObject delivery = new JsonObject();
        delivery.addProperty("id", "del-1");
        delivery.addProperty("event", "signature.document.completed");
        delivery.addProperty("statusCode", 200);

        JsonObject responseData = new JsonObject();
        responseData.addProperty("totalRecords", 1);
        responseData.addProperty("limit", 50);
        responseData.addProperty("offset", 0);
        responseData.add("results", gson.toJsonTree(List.of(gson.fromJson(delivery, Map.class))));

        JsonObject response = new JsonObject();
        response.addProperty("success", true);
        response.add("data", responseData);

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(response)));

        Map<String, Object> result = client.turboPartner().listWebhookDeliveries(ORG_ID, WEBHOOK_NAME, null, null);

        RecordedRequest request = server.takeRequest();
        assertEquals("GET", request.getMethod());
        assertEquals(
                "/partner/" + PARTNER_ID + "/orgs/" + ORG_ID + "/webhooks/" + WEBHOOK_NAME + "/deliveries",
                request.getPath()
        );

        assertTrue((Boolean) result.get("success"));
    }
}
