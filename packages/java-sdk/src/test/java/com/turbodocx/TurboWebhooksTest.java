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
 * TurboWebhooks Module Tests
 *
 * The SDK is locked to a single fixed-name webhook per org (`signature`).
 * No method takes a `name` parameter — every route hits
 * /api/webhooks/signature[/...].
 *
 * Uses OkHttp MockWebServer to assert request method/path/body and inject
 * canned responses. Matches the pattern of TurboPartnerTest.
 */
class TurboWebhooksTest {

    private MockWebServer server;
    private TurboWebhooks webhooks;
    private final Gson gson = new Gson();

    @BeforeEach
    void setUp() throws IOException {
        server = new MockWebServer();
        server.start();

        webhooks = new TurboDocxClient.Builder()
                .apiKey("TDX-test-key")
                .orgId("test-org-id")
                .baseUrl(server.url("/").toString())
                .buildWebhooksClient();
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    // ============================================
    // Builder configuration
    // ============================================

    @Test
    void buildWebhooksClient_skipsSenderEmailValidation() {
        // No senderEmail provided — buildWebhooksClient() must NOT throw.
        TurboWebhooks w = new TurboDocxClient.Builder()
                .apiKey("TDX-foo")
                .orgId("org-1")
                .buildWebhooksClient();
        assertNotNull(w);
    }

    @Test
    void buildWebhooksClient_requiresApiKey() {
        assertThrows(IllegalArgumentException.class, () ->
                new TurboDocxClient.Builder().orgId("org-1").buildWebhooksClient()
        );
    }

    @Test
    void buildWebhooksClient_requiresOrgId() {
        assertThrows(TurboDocxException.AuthenticationException.class, () ->
                new TurboDocxClient.Builder().apiKey("TDX-foo").buildWebhooksClient()
        );
    }

    // ============================================
    // CRUD
    // ============================================

    @Test
    void createWebhook_injectsSignatureNameAndUnwrapsEnvelope() throws Exception {
        JsonObject inner = new JsonObject();
        inner.addProperty("id", "wh-1");
        inner.addProperty("secret", "whsec_abc123");
        JsonObject envelope = new JsonObject();
        envelope.add("data", inner);
        envelope.addProperty("message", "Webhook created successfully.");

        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody(envelope.toString()));

        JsonObject result = webhooks.createWebhook(
                List.of("https://example.com/sink"),
                List.of("signature.document.completed"));

        RecordedRequest req = server.takeRequest();
        assertEquals("POST", req.getMethod());
        assertEquals("/api/webhooks", req.getPath());

        JsonObject sentBody = gson.fromJson(req.getBody().readUtf8(), JsonObject.class);
        assertEquals("signature", sentBody.get("name").getAsString());
        assertEquals("https://example.com/sink", sentBody.getAsJsonArray("urls").get(0).getAsString());

        assertEquals("wh-1", result.get("id").getAsString());
        assertEquals("whsec_abc123", result.get("secret").getAsString());
    }

    @Test
    void getWebhook_hitsSignaturePath() throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("id", "wh-1");
        body.addProperty("name", "signature");
        JsonObject deliveryStats = new JsonObject();
        deliveryStats.addProperty("totalDeliveries", 0);
        body.add("deliveryStats", deliveryStats);
        body.add("availableEvents", gson.toJsonTree(List.of("signature.document.completed")));

        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody(body.toString()));

        JsonObject result = webhooks.getWebhook();

        RecordedRequest req = server.takeRequest();
        assertEquals("GET", req.getMethod());
        assertEquals("/api/webhooks/signature", req.getPath());

        assertEquals("signature", result.get("name").getAsString());
        assertEquals(0, result.getAsJsonObject("deliveryStats").get("totalDeliveries").getAsInt());
    }

    @Test
    void updateWebhook_patchesSignaturePathAndUnwrapsEnvelope() throws Exception {
        JsonObject inner = new JsonObject();
        inner.addProperty("id", "wh-1");
        inner.addProperty("isActive", false);
        JsonObject envelope = new JsonObject();
        envelope.add("data", inner);
        envelope.addProperty("message", "Webhook updated successfully");

        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody(envelope.toString()));

        JsonObject result = webhooks.updateWebhook(null, null, false);

        RecordedRequest req = server.takeRequest();
        assertEquals("PATCH", req.getMethod());
        assertEquals("/api/webhooks/signature", req.getPath());

        JsonObject sent = gson.fromJson(req.getBody().readUtf8(), JsonObject.class);
        assertFalse(sent.get("isActive").getAsBoolean());
        assertFalse(sent.has("urls"));
        assertFalse(sent.has("events"));

        assertFalse(result.get("isActive").getAsBoolean());
    }

    @Test
    void deleteWebhook_deletesSignaturePath() throws Exception {
        JsonObject body = new JsonObject();
        body.addProperty("message", "Webhook deleted successfully");
        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody(body.toString()));

        JsonObject result = webhooks.deleteWebhook();

        RecordedRequest req = server.takeRequest();
        assertEquals("DELETE", req.getMethod());
        assertEquals("/api/webhooks/signature", req.getPath());
        assertTrue(result.get("message").getAsString().toLowerCase().contains("deleted"));
    }

    // ============================================
    // TEST / NOTIFY
    // ============================================

    @Test
    void testWebhook_postsToTestEndpointAndUnwraps() throws Exception {
        JsonObject summary = new JsonObject();
        summary.addProperty("total", 1);
        summary.addProperty("successful", 1);
        summary.addProperty("failed", 0);
        JsonObject inner = new JsonObject();
        inner.add("deliveries", gson.toJsonTree(List.of()));
        inner.add("summary", summary);
        JsonObject envelope = new JsonObject();
        envelope.add("data", inner);
        envelope.addProperty("message", "Test webhook sent successfully to all URLs");

        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody(envelope.toString()));

        JsonObject result = webhooks.testWebhook(
                "signature.document.completed",
                Map.of("documentId", "doc-1"));

        RecordedRequest req = server.takeRequest();
        assertEquals("POST", req.getMethod());
        assertEquals("/api/webhooks/signature/test", req.getPath());
        assertEquals(1, result.getAsJsonObject("summary").get("successful").getAsInt());
    }

    @Test
    void notifyWebhook_postsToNotifyEndpoint() throws Exception {
        JsonObject summary = new JsonObject();
        summary.addProperty("total", 1);
        summary.addProperty("successful", 1);
        summary.addProperty("failed", 0);
        JsonObject inner = new JsonObject();
        inner.add("deliveries", gson.toJsonTree(List.of()));
        inner.add("summary", summary);
        JsonObject envelope = new JsonObject();
        envelope.add("data", inner);
        envelope.addProperty("message", "Manual notification sent successfully to all URLs");

        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody(envelope.toString()));

        webhooks.notifyWebhook("signature.document.completed", Map.of("documentId", "doc-2"));

        RecordedRequest req = server.takeRequest();
        assertEquals("POST", req.getMethod());
        assertEquals("/api/webhooks/signature/notify", req.getPath());
    }

    // ============================================
    // DELIVERIES + REPLAY
    // ============================================

    @Test
    void listWebhookDeliveries_buildsQueryString() throws Exception {
        JsonObject body = new JsonObject();
        body.add("results", gson.toJsonTree(List.of()));
        body.addProperty("totalRecords", 0);
        body.addProperty("limit", 10);
        body.addProperty("offset", 0);

        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody(body.toString()));

        webhooks.listWebhookDeliveries(10, null, null, false, null);

        RecordedRequest req = server.takeRequest();
        assertEquals("GET", req.getMethod());
        assertTrue(req.getPath().startsWith("/api/webhooks/signature/deliveries?"),
                "path was: " + req.getPath());
        assertTrue(req.getPath().contains("limit=10"));
        assertTrue(req.getPath().contains("isDelivered=false"));
    }

    @Test
    void replayWebhookDelivery_postsToReplayPath() throws Exception {
        JsonObject inner = new JsonObject();
        inner.addProperty("id", "delivery-1");
        inner.addProperty("httpStatus", 200);
        JsonObject envelope = new JsonObject();
        envelope.add("data", inner);
        envelope.addProperty("message", "Delivery replayed");

        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody(envelope.toString()));

        JsonObject result = webhooks.replayWebhookDelivery("delivery-1");

        RecordedRequest req = server.takeRequest();
        assertEquals("POST", req.getMethod());
        assertEquals("/api/webhooks/signature/replay", req.getPath());

        JsonObject sent = gson.fromJson(req.getBody().readUtf8(), JsonObject.class);
        assertEquals("delivery-1", sent.get("deliveryId").getAsString());
        assertEquals(200, result.get("httpStatus").getAsInt());
    }

    // ============================================
    // SECRET ROTATION + STATS
    // ============================================

    @Test
    void regenerateWebhookSecret_postsAndUnwraps() throws Exception {
        JsonObject inner = new JsonObject();
        inner.addProperty("id", "wh-1");
        inner.addProperty("secret", "whsec_newRotated");
        inner.addProperty("regeneratedAt", "2026-05-13T12:00:00Z");
        JsonObject envelope = new JsonObject();
        envelope.add("data", inner);
        envelope.addProperty("message", "Webhook secret regenerated successfully.");

        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody(envelope.toString()));

        JsonObject result = webhooks.regenerateWebhookSecret();

        RecordedRequest req = server.takeRequest();
        assertEquals("POST", req.getMethod());
        assertEquals("/api/webhooks/signature/regenerate", req.getPath());
        assertEquals("whsec_newRotated", result.get("secret").getAsString());
    }

    @Test
    void getWebhookStats_passesDaysQuery() throws Exception {
        JsonObject summary = new JsonObject();
        summary.addProperty("totalDeliveries", 100);
        summary.addProperty("successRate", 95);
        JsonObject body = new JsonObject();
        body.add("summary", summary);
        body.add("eventBreakdown", gson.toJsonTree(List.of()));

        server.enqueue(new MockResponse()
                .setHeader("Content-Type", "application/json")
                .setBody(body.toString()));

        webhooks.getWebhookStats(7);

        RecordedRequest req = server.takeRequest();
        assertEquals("GET", req.getMethod());
        assertEquals("/api/webhooks/signature/stats?days=7", req.getPath());
    }

    // ============================================
    // Error propagation
    // ============================================

    @Test
    void propagatesAuthorizationExceptionOn403() {
        server.enqueue(new MockResponse()
                .setResponseCode(403)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"message\":\"Forbidden\"}"));

        assertThrows(TurboDocxException.AuthorizationException.class, () -> webhooks.getWebhook());
    }

    @Test
    void propagatesAuthenticationExceptionOn401() {
        server.enqueue(new MockResponse()
                .setResponseCode(401)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"message\":\"Invalid API key\"}"));

        assertThrows(TurboDocxException.AuthenticationException.class, () -> webhooks.getWebhook());
    }

    @Test
    void propagatesNotFoundExceptionOn404() {
        server.enqueue(new MockResponse()
                .setResponseCode(404)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"message\":\"Webhook not found\"}"));

        assertThrows(TurboDocxException.NotFoundException.class, () -> webhooks.getWebhook());
    }

    @Test
    void createWebhook_propagatesConflictExceptionOn409() {
        server.enqueue(new MockResponse()
                .setResponseCode(409)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"message\":\"Webhook with this name already exists\",\"code\":\"CONFLICT\"}"));

        assertThrows(TurboDocxException.ConflictException.class, () ->
                webhooks.createWebhook(
                        List.of("https://example.com/sink"),
                        List.of("signature.document.completed")));
    }

    @Test
    void updateWebhook_propagatesConflictExceptionOn409() {
        server.enqueue(new MockResponse()
                .setResponseCode(409)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"message\":\"Webhook with this name already exists\",\"code\":\"CONFLICT\"}"));

        assertThrows(TurboDocxException.ConflictException.class, () ->
                webhooks.updateWebhook(
                        List.of("https://example.com/new-sink"),
                        null,
                        null));
    }

    @Test
    void propagatesValidationExceptionOn400() {
        server.enqueue(new MockResponse()
                .setResponseCode(400)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"message\":\"All webhook URLs must use HTTPS\"}"));

        assertThrows(TurboDocxException.ValidationException.class, () ->
                webhooks.createWebhook(
                        List.of("http://insecure.example.com"),
                        List.of("signature.document.completed")));
    }

    // ============================================
    // Webhook events
    // ============================================

    /** Drift guard: if the backend adds an event, WebhookEvent must grow with it. */
    @Test
    void webhookEventAllValuesReturnsExactlyTheSevenWireStrings() {
        List<String> expected = List.of(
                "signature.document.sent",
                "signature.document.viewed",
                "signature.document.recipient_signed",
                "signature.document.signed",
                "signature.document.completed",
                "signature.document.finalization_failed",
                "signature.document.voided");

        assertEquals(expected, WebhookEvent.allValues());
        assertEquals(7, WebhookEvent.values().length);
    }

    @Test
    void eachWebhookEventMapsToItsWireString() {
        assertEquals("signature.document.sent", WebhookEvent.SENT.getValue());
        assertEquals("signature.document.viewed", WebhookEvent.VIEWED.getValue());
        assertEquals("signature.document.recipient_signed", WebhookEvent.RECIPIENT_SIGNED.getValue());
        assertEquals("signature.document.signed", WebhookEvent.SIGNED.getValue());
        assertEquals("signature.document.completed", WebhookEvent.COMPLETED.getValue());
        assertEquals("signature.document.finalization_failed", WebhookEvent.FINALIZATION_FAILED.getValue());
        assertEquals("signature.document.voided", WebhookEvent.VOIDED.getValue());
    }

    /**
     * Non-breaking: createWebhook still takes List&lt;String&gt;, so an event the
     * SDK has never heard of is sent verbatim.
     */
    @Test
    void createWebhookStillAcceptsRawEventStrings() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(201)
                .setHeader("Content-Type", "application/json")
                .setBody("{\"data\":{\"id\":\"wh-1\",\"secret\":\"whsec_abc\"},\"message\":\"ok\"}"));

        webhooks.createWebhook(
                List.of("https://example.com/hook"),
                List.of("signature.document.some_future_event"));

        RecordedRequest request = server.takeRequest();
        JsonObject body = gson.fromJson(request.getBody().readUtf8(), JsonObject.class);

        assertEquals(1, body.getAsJsonArray("events").size());
        assertEquals(
                "signature.document.some_future_event",
                body.getAsJsonArray("events").get(0).getAsString());
    }
}
