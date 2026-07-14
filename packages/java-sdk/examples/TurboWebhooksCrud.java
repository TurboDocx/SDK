/**
 * TurboWebhooks CRUD example.
 *
 * Walks through the full lifecycle plus the error paths you actually hit
 * in practice:
 *
 *   1. configure a TurboWebhooks client against the TurboDocx API
 *   2. create the signature webhook
 *   3. trigger the conflict path (second create with the same name -> 409)
 *   4. read (get) the webhook + its delivery stats
 *   5. update its URL list and confirm the change
 *   6. test-fire it (and surface per-URL failure strings)
 *   7. rotate its secret
 *   8. list past delivery attempts
 *   9. delete it
 *  10. confirm reads against the now-deleted webhook return 404
 *
 * Run (from packages/java-sdk):
 *
 *   export TURBODOCX_API_KEY=TDX-...
 *   export TURBODOCX_ORG_ID=...
 *   mvn package -DskipTests
 *   mvn dependency:build-classpath -Dmdep.outputFile=classpath.txt -q
 *   javac -cp "target/turbodocx-sdk-0.2.0.jar:$(cat classpath.txt)" examples/TurboWebhooksCrud.java
 *   java -cp "target/turbodocx-sdk-0.2.0.jar:$(cat classpath.txt):examples" examples.TurboWebhooksCrud
 *
 * Optionally override the API host with TURBODOCX_BASE_URL, and the
 * delivery target with TURBODOCX_RECEIVER_URL (e.g. a webhook.site or
 * ngrok URL) when live-testing.
 *
 * Requires an admin-scoped TDX- API key. The webhook route gate is
 * requireOrgRole(administrator); a non-admin key will 403 here.
 */

package examples;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.turbodocx.TurboDocxClient;
import com.turbodocx.TurboDocxException;
import com.turbodocx.TurboWebhooks;
import com.turbodocx.WebhookEvent;

import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;

public class TurboWebhooksCrud {

    // The SDK exposes all 7 signature events on the WebhookEvent enum (plus
    // WebhookEvent.allValues()). See the README for what each one fires on — note
    // that `signed` is partial-progress only and never fires on the final
    // signature; use `completed` to detect "the document is done".
    private static final String EVENT_DOC_COMPLETED = WebhookEvent.COMPLETED.getValue();
    private static final String EVENT_DOC_VOIDED = WebhookEvent.VOIDED.getValue();

    public static void main(String[] args) {
        try {
            runCrud();
            System.out.println("\n✓ CRUD walkthrough complete.");
        } catch (TurboDocxException.AuthenticationException e) {
            System.err.println("\n[401] Authentication failed: " + e.getMessage());
            System.err.println("Check TURBODOCX_API_KEY. The webhook routes require an admin TDX- key.");
            System.exit(1);
        } catch (TurboDocxException.AuthorizationException e) {
            System.err.println("\n[403] Authorization failed: " + e.getMessage());
            System.err.println("Webhook routes require the org administrator role.");
            System.exit(1);
        } catch (TurboDocxException.ValidationException e) {
            System.err.println("\n[400] Validation error: " + e.getMessage());
            System.exit(1);
        } catch (TurboDocxException.NotFoundException e) {
            System.err.println("\n[404] Not found: " + e.getMessage());
            System.exit(1);
        } catch (TurboDocxException.RateLimitException e) {
            System.err.println("\n[429] Rate limited: " + e.getMessage());
            System.exit(1);
        } catch (TurboDocxException.ConflictException e) {
            System.err.println("\n[409] Conflict: " + e.getMessage());
            System.exit(1);
        } catch (TurboDocxException.NetworkException e) {
            String configured = getEnv("TURBODOCX_BASE_URL", "https://api.turbodocx.com");
            System.err.println("\n[network] Could not reach the backend: " + e.getMessage());
            System.err.println("Could not reach " + configured + ".");
            System.exit(1);
        } catch (TurboDocxException e) {
            System.err.println("\n[" + e.getStatusCode() + "] " + e.getMessage());
            System.exit(1);
        } catch (Exception e) {
            System.err.println("\n[?] " + e);
            e.printStackTrace();
            System.exit(1);
        }
    }

    private static void runCrud() throws Exception {
        // Configure the TurboWebhooks client. buildWebhooksClient() does NOT
        // require senderEmail because webhooks don't send emails -- only
        // TurboSign needs a sender_email.
        String baseUrl = getEnv("TURBODOCX_BASE_URL", "https://api.turbodocx.com");
        String orgId = getEnv("TURBODOCX_ORG_ID", "your-org-id-here");

        // The URL the webhook will POST to when an event fires. The backend
        // enforces HTTPS-only -- non-HTTPS URLs return 400 ValidationException.
        String receiverUrl = getEnv("TURBODOCX_RECEIVER_URL",
                "https://your-server.example.com/webhooks/turbodocx");

        TurboWebhooks webhooks = new TurboDocxClient.Builder()
                .apiKey(getEnv("TURBODOCX_API_KEY", "your-admin-tdx-key-here"))
                .orgId(orgId)
                .baseUrl(baseUrl)
                .buildWebhooksClient();

        System.out.println("Configured TurboWebhooks against " + baseUrl);
        System.out.println("Org: " + orgId);

        // ────────────────────────────────────────────────────────────
        // 1. CREATE
        // ────────────────────────────────────────────────────────────
        section("CREATE webhook");

        try {
            JsonObject created = webhooks.createWebhook(
                    Arrays.asList(receiverUrl),
                    Arrays.asList(EVENT_DOC_COMPLETED, EVENT_DOC_VOIDED));
            System.out.println("Created. Save this secret -- it is shown ONCE:");
            System.out.println("  id:     " + asString(created, "id"));
            System.out.println("  secret: " + asString(created, "secret"));
        } catch (TurboDocxException.ConflictException e) {
            // The webhook already exists from a previous run. That's fine --
            // continue with the rest of the example so you can still exercise
            // update / test / delete. Any other exception bubbles to the
            // top-level handler.
            System.out.println("A signature webhook already exists for this org (409). Continuing.");
        }

        // ────────────────────────────────────────────────────────────
        // 2. CONFLICT PATH -- create again, expect 409
        // ────────────────────────────────────────────────────────────
        section("Trigger duplicate-name conflict (expect 409)");

        try {
            webhooks.createWebhook(
                    Arrays.asList(receiverUrl),
                    Arrays.asList(EVENT_DOC_COMPLETED));
            System.out.println("Unexpected: second create succeeded. Did the webhook get deleted between calls?");
        } catch (TurboDocxException.ConflictException e) {
            System.out.println("Got the expected 409 ConflictException.");
            System.out.println("  message:    " + e.getMessage());
            System.out.println("  statusCode: " + e.getStatusCode());
            System.out.println("  code:       " + e.getCode());
        }

        // ────────────────────────────────────────────────────────────
        // 3. READ
        // ────────────────────────────────────────────────────────────
        section("GET webhook");

        JsonObject webhook = webhooks.getWebhook();
        System.out.println("Webhook:");
        System.out.println("  id:        " + asString(webhook, "id"));
        System.out.println("  name:      " + asString(webhook, "name"));
        System.out.println("  urls:      " + jsonField(webhook, "urls"));
        System.out.println("  events:    " + jsonField(webhook, "events"));
        System.out.println("  isActive:  " + asString(webhook, "isActive"));
        System.out.println("  stats:     " + jsonField(webhook, "deliveryStats"));

        // ────────────────────────────────────────────────────────────
        // 4. UPDATE
        // ────────────────────────────────────────────────────────────
        section("UPDATE webhook (replace URL list)");

        JsonObject updated = webhooks.updateWebhook(Arrays.asList(receiverUrl), null, null);
        System.out.println("Updated. New URLs: " + jsonField(updated, "urls"));

        // ────────────────────────────────────────────────────────────
        // 5. TEST FIRE -- surface per-URL errors
        // ────────────────────────────────────────────────────────────
        section("TEST-fire webhook");

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("documentId", "00000000-0000-0000-0000-000000000000");
        payload.put("documentName", "CRUD-example test fire");
        payload.put("completedAt", DateTimeFormatter.ISO_INSTANT.format(Instant.now()));

        try {
            JsonObject testResult = webhooks.testWebhook(EVENT_DOC_COMPLETED, payload);
            if (testResult != null && testResult.has("summary") && testResult.get("summary").isJsonObject()) {
                JsonObject summary = testResult.getAsJsonObject("summary");
                System.out.println("Summary: " + summary.get("successful") + "/" + summary.get("total")
                        + " successful, " + summary.get("failed") + " failed");
                if (summary.has("errors") && summary.get("errors").isJsonArray()) {
                    JsonArray errs = summary.getAsJsonArray("errors");
                    if (errs.size() > 0) {
                        System.out.println("Per-URL errors:");
                        for (JsonElement err : errs) {
                            System.out.println("  - " + err);
                        }
                    }
                }
            } else {
                System.out.println("Test-fire response: " + testResult);
            }
        } catch (TurboDocxException e) {
            System.out.println("Test-fire failed: " + e.getClass().getSimpleName() + " -- " + e.getMessage());
        }

        // ────────────────────────────────────────────────────────────
        // 6. ROTATE SECRET
        // ────────────────────────────────────────────────────────────
        section("Rotate webhook secret");

        JsonObject rotated = webhooks.regenerateWebhookSecret();
        System.out.println("Rotated. New secret (shown ONCE, save it):");
        System.out.println("  secret:        " + asString(rotated, "secret"));
        System.out.println("  regeneratedAt: " + asString(rotated, "regeneratedAt"));

        // ────────────────────────────────────────────────────────────
        // 7. LIST DELIVERIES
        // ────────────────────────────────────────────────────────────
        section("List recent delivery attempts");

        JsonObject deliveries = webhooks.listWebhookDeliveries(5, null, null, null, null);
        System.out.println("Total recorded: " + asString(deliveries, "totalRecords"));
        if (deliveries.has("results") && deliveries.get("results").isJsonArray()) {
            JsonArray results = deliveries.getAsJsonArray("results");
            for (int i = 0; i < results.size(); i++) {
                JsonObject d = results.get(i).getAsJsonObject();
                String httpStatus = (d.has("httpStatus") && !d.get("httpStatus").isJsonNull())
                        ? d.get("httpStatus").toString() : "pending";
                boolean delivered = d.has("isDelivered") && !d.get("isDelivered").isJsonNull()
                        && d.get("isDelivered").getAsBoolean();
                System.out.println("  [" + i + "] " + asString(d, "eventType") + " -> " + httpStatus
                        + " (" + (delivered ? "OK" : "FAIL") + ") at " + asString(d, "createdOn"));
            }
        }

        // ────────────────────────────────────────────────────────────
        // 8. DELETE
        // ────────────────────────────────────────────────────────────
        section("DELETE webhook");

        JsonObject delResult = webhooks.deleteWebhook();
        System.out.println("Deleted. Server says: " + asString(delResult, "message"));

        // ────────────────────────────────────────────────────────────
        // 9. POST-DELETE READ -- expect 404
        // ────────────────────────────────────────────────────────────
        section("GET after delete (expect 404)");

        try {
            webhooks.getWebhook();
            System.out.println("Unexpected: read after delete succeeded.");
        } catch (TurboDocxException.NotFoundException e) {
            System.out.println("Got the expected 404 NotFoundException: " + e.getMessage());
        }
    }

    private static String asString(JsonObject o, String key) {
        if (o == null || !o.has(key) || o.get(key).isJsonNull()) return "null";
        JsonElement el = o.get(key);
        if (el.isJsonPrimitive()) return el.getAsString();
        return el.toString();
    }

    private static String jsonField(JsonObject o, String key) {
        if (o == null || !o.has(key) || o.get(key).isJsonNull()) return "null";
        return o.get(key).toString();
    }

    private static void section(String title) {
        System.out.println();
        System.out.println(repeat("─", 60));
        System.out.println("▸ " + title);
        System.out.println(repeat("─", 60));
    }

    private static String repeat(String s, int n) {
        StringBuilder sb = new StringBuilder(s.length() * n);
        for (int i = 0; i < n; i++) sb.append(s);
        return sb.toString();
    }

    private static String getEnv(String key, String fallback) {
        String v = System.getenv(key);
        return v != null && !v.isEmpty() ? v : fallback;
    }
}
