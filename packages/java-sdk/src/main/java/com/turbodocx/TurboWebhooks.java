package com.turbodocx;

import com.google.gson.JsonObject;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * TurboWebhooks module for managing the org's <strong>signature webhook</strong>.
 *
 * <p>The SDK is intentionally locked to a single webhook per org, identified
 * by the fixed name {@code signature}. This matches the UI's Signature
 * Webhooks settings page so SDK-managed and UI-managed webhooks stay in sync.
 * To manage multiple webhooks per org, call the REST API directly.</p>
 *
 * <p>POST/PATCH responses come back as
 * {@code {"data": ..., "message": ...}} envelopes which HttpClient's smart
 * unwrap leaves intact (it only unwraps single-key {@code {data}} responses).
 * Methods that hit non-GET routes therefore extract the {@code "data"} member
 * explicitly. GET routes are auto-unwrapped.</p>
 *
 * <p>All methods return {@link JsonObject} for forward compatibility.
 * Construct via {@link TurboDocxClient.Builder#buildWebhooksClient()}.</p>
 */
public class TurboWebhooks {

    /** The fixed name of the single SDK-managed webhook per org. */
    public static final String SIGNATURE_NAME = "signature";

    private final HttpClient httpClient;

    TurboWebhooks(HttpClient httpClient) {
        this.httpClient = httpClient;
    }

    // =========================================================================
    // CRUD
    // =========================================================================

    /**
     * Create the org's signature webhook. The returned {@code secret} field
     * is shown ONCE and must be stored on receipt; it cannot be retrieved
     * later.
     *
     * @param urls   HTTPS URLs (HTTP returns 400 ValidationException)
     * @param events Event types (e.g. "signature.document.completed")
     * @return JsonObject with {@code id} and {@code secret}
     * @throws IOException if the request fails
     */
    public JsonObject createWebhook(List<String> urls, List<String> events) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("name", SIGNATURE_NAME);
        body.put("urls", urls);
        body.put("events", events);
        JsonObject envelope = httpClient.post("/api/webhooks", body, JsonObject.class);
        return envelope.getAsJsonObject("data");
    }

    /**
     * Get the org's signature webhook with delivery stats and the
     * server-provided list of subscribable events.
     */
    public JsonObject getWebhook() throws IOException {
        return httpClient.get("/api/webhooks/" + SIGNATURE_NAME, JsonObject.class);
    }

    /**
     * Patch one or more fields on the signature webhook. Pass null for
     * fields you don't want to change. Renaming is not supported.
     */
    public JsonObject updateWebhook(List<String> urls, List<String> events, Boolean isActive) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        if (urls != null) body.put("urls", urls);
        if (events != null) body.put("events", events);
        if (isActive != null) body.put("isActive", isActive);

        JsonObject envelope = httpClient.patch("/api/webhooks/" + SIGNATURE_NAME, body, JsonObject.class);
        return envelope.getAsJsonObject("data");
    }

    /** Soft-delete the signature webhook and its delivery history. */
    public JsonObject deleteWebhook() throws IOException {
        return httpClient.delete("/api/webhooks/" + SIGNATURE_NAME, JsonObject.class);
    }

    // =========================================================================
    // TEST / NOTIFY
    // =========================================================================

    /** Send a test delivery to all URLs configured on the signature webhook. */
    public JsonObject testWebhook(String eventType, Map<String, Object> payload) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("eventType", eventType);
        body.put("payload", payload);
        JsonObject envelope = httpClient.post(
                "/api/webhooks/" + SIGNATURE_NAME + "/test",
                body,
                JsonObject.class);
        return envelope.getAsJsonObject("data");
    }

    /**
     * Send a manual notification to all URLs configured on the signature
     * webhook.
     *
     * <p>NOTE: Routes through the same backend handler as {@link #testWebhook}
     * and returns the same shape; only the response/error message strings
     * differ. Prefer {@code testWebhook} in new code.</p>
     */
    public JsonObject notifyWebhook(String eventType, Map<String, Object> payload) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("eventType", eventType);
        body.put("payload", payload);
        JsonObject envelope = httpClient.post(
                "/api/webhooks/" + SIGNATURE_NAME + "/notify",
                body,
                JsonObject.class);
        return envelope.getAsJsonObject("data");
    }

    // =========================================================================
    // DELIVERIES + REPLAY
    // =========================================================================

    /**
     * List historical delivery attempts for the signature webhook, with
     * optional filters. Pass null for filters you don't want to apply.
     */
    public JsonObject listWebhookDeliveries(Integer limit, Integer offset,
                                            String eventType, Boolean isDelivered,
                                            Integer httpStatus) throws IOException {
        String qs = buildQueryString(
                "limit", limit,
                "offset", offset,
                "eventType", eventType,
                "isDelivered", isDelivered,
                "httpStatus", httpStatus
        );
        return httpClient.get(
                "/api/webhooks/" + SIGNATURE_NAME + "/deliveries" + qs,
                JsonObject.class);
    }

    /** List deliveries with no filters. */
    public JsonObject listWebhookDeliveries() throws IOException {
        return listWebhookDeliveries(null, null, null, null, null);
    }

    /** Manually retry a specific past delivery by ID. */
    public JsonObject replayWebhookDelivery(String deliveryId) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("deliveryId", deliveryId);
        JsonObject envelope = httpClient.post(
                "/api/webhooks/" + SIGNATURE_NAME + "/replay",
                body,
                JsonObject.class);
        return envelope.getAsJsonObject("data");
    }

    // =========================================================================
    // SECRET ROTATION + STATS
    // =========================================================================

    /**
     * Rotate the webhook's HMAC secret. The new secret is shown ONCE in the
     * response and must be saved; old signatures will fail immediately.
     */
    public JsonObject regenerateWebhookSecret() throws IOException {
        JsonObject envelope = httpClient.post(
                "/api/webhooks/" + SIGNATURE_NAME + "/regenerate",
                new LinkedHashMap<>(),
                JsonObject.class);
        return envelope.getAsJsonObject("data");
    }

    /** Aggregate delivery stats over a sliding window (days). */
    public JsonObject getWebhookStats(Integer days) throws IOException {
        String qs = buildQueryString("days", days);
        return httpClient.get(
                "/api/webhooks/" + SIGNATURE_NAME + "/stats" + qs,
                JsonObject.class);
    }

    // =========================================================================
    // Internals
    // =========================================================================

    /**
     * Build a URL query string from alternating key/value pairs.
     * Null values are skipped. Booleans are lowercased.
     */
    private String buildQueryString(Object... kv) {
        if (kv.length == 0 || kv.length % 2 != 0) return "";
        StringBuilder sb = new StringBuilder();
        boolean first = true;
        for (int i = 0; i < kv.length; i += 2) {
            String key = (String) kv[i];
            Object val = kv[i + 1];
            if (val == null) continue;
            sb.append(first ? "?" : "&");
            first = false;
            sb.append(URLEncoder.encode(key, StandardCharsets.UTF_8));
            sb.append("=");
            String s = val instanceof Boolean ? val.toString().toLowerCase() : val.toString();
            sb.append(URLEncoder.encode(s, StandardCharsets.UTF_8));
        }
        return sb.toString();
    }
}
