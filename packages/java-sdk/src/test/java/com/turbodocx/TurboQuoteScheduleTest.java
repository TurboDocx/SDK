package com.turbodocx;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.turbodocx.models.SignatureSchedule;
import com.turbodocx.models.quote.*;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.*;

import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TurboQuote reminder + expiration schedule serialization tests.
 *
 * <p>Mirrors the js-sdk, py-sdk, go-sdk and ruby-sdk turboquote-schedule suites, per the
 * cross-SDK test-parity rule.
 *
 * <p>The quote send endpoints are JSON (unlike the multipart signature send), so the eight
 * schedule fields ride FLAT at the top level of the request body — NOT nested under a "schedule"
 * key — and durations serialize as plain {@code {value, unit}} OBJECTS, not JSON-encoded strings.
 * The boxed schedule fields keep a deliberate {@code false} / {@code 0} distinct from "unset": an
 * omitted field stays off the wire and inherits the org default. Request-body keys are camelCase.
 */
class TurboQuoteScheduleTest {

    private MockWebServer server;
    private TurboQuoteClient client;
    private final Gson gson = new Gson();

    @BeforeEach
    void setUp() throws IOException {
        server = new MockWebServer();
        server.start();
        client = new TurboQuoteClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                .baseUrl(server.url("/").toString())
                .build();
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    private String wrapInData(Object body) {
        JsonObject wrapper = new JsonObject();
        wrapper.add("data", gson.toJsonTree(body));
        return gson.toJson(wrapper);
    }

    private void enqueueSendResponse() {
        Map<String, Object> result = new HashMap<>();
        result.put("id", "q-1");
        result.put("status", "sent");
        Map<String, Object> response = new HashMap<>();
        response.put("result", result);
        response.put("message", "Quote sent");
        response.put("documentId", "doc-2");
        server.enqueue(new MockResponse().setBody(wrapInData(response)));
    }

    private void assertDuration(JsonObject body, String key, int wantValue, String wantUnit) {
        assertTrue(body.has(key), key + " was not sent");
        assertTrue(body.get(key).isJsonObject(), key + " should be a {value, unit} object, not a string");
        JsonObject obj = body.getAsJsonObject(key);
        assertEquals(wantValue, obj.get("value").getAsInt(), key + ".value");
        assertEquals(wantUnit, obj.get("unit").getAsString(), key + ".unit");
    }

    @Test
    @DisplayName("sendQuote sends every schedule field flat with object durations")
    void sendQuoteSendsEveryFieldFlat() throws Exception {
        enqueueSendResponse();

        SignatureSchedule schedule = SignatureSchedule.builder()
                .remindersEnabled(true)
                .reminderDelay(new SignatureSchedule.Duration(3, "days"))
                .reminderInterval(new SignatureSchedule.Duration(12, "hours"))
                .maxReminders(5)
                .expirationEnabled(true)
                .expireAfter(new SignatureSchedule.Duration(30, "days"))
                .expirationWarning(new SignatureSchedule.Duration(3, "days"))
                .expirationWarningInterval(new SignatureSchedule.Duration(1, "days"))
                .build();

        SendQuoteRequest request = new SendQuoteRequest();
        request.setCcEmails(Collections.singletonList("admin@example.com"));
        request.setSchedule(schedule);

        client.turboQuote().sendQuote("q-1", request);

        RecordedRequest recorded = server.takeRequest();
        assertTrue(recorded.getPath().endsWith("/v1/quotes/q-1/send"));
        JsonObject body = gson.fromJson(recorded.getBody().readUtf8(), JsonObject.class);

        // Flat at the top level, never nested under "schedule".
        assertFalse(body.has("schedule"), "schedule fields must be FLAT, not nested under \"schedule\"");

        // Native boolean / number — not stringified.
        assertTrue(body.get("remindersEnabled").getAsBoolean());
        assertTrue(body.get("expirationEnabled").getAsBoolean());
        assertEquals(5, body.get("maxReminders").getAsInt());
        assertTrue(body.get("remindersEnabled").getAsJsonPrimitive().isBoolean());
        assertTrue(body.get("maxReminders").getAsJsonPrimitive().isNumber());

        // Durations are objects, not JSON strings.
        assertDuration(body, "reminderDelay", 3, "days");
        assertDuration(body, "reminderInterval", 12, "hours");
        assertDuration(body, "expireAfter", 30, "days");
        assertDuration(body, "expirationWarning", 3, "days");
        assertDuration(body, "expirationWarningInterval", 1, "days");

        assertEquals("admin@example.com", body.getAsJsonArray("ccEmails").get(0).getAsString());
    }

    @Test
    @DisplayName("sendQuote omits every schedule key when unset")
    void sendQuoteOmitsUnsetFields() throws Exception {
        enqueueSendResponse();

        SendQuoteRequest request = new SendQuoteRequest();
        request.setCcEmails(Collections.singletonList("admin@example.com"));
        client.turboQuote().sendQuote("q-1", request);

        RecordedRequest recorded = server.takeRequest();
        JsonObject body = gson.fromJson(recorded.getBody().readUtf8(), JsonObject.class);

        for (String key : new String[]{
                "remindersEnabled", "reminderDelay", "reminderInterval", "maxReminders",
                "expirationEnabled", "expireAfter", "expirationWarning", "expirationWarningInterval"}) {
            assertFalse(body.has(key), key + " should be omitted so the org default applies");
        }
        assertFalse(body.has("schedule"));
    }

    // false and 0 are meaningful, not "unset" — the boxed fields keep them off the org-default path.
    @Test
    @DisplayName("sendQuote preserves the meaningful zeros maxReminders:0 and expirationEnabled:false")
    void sendQuotePreservesMeaningfulZeros() throws Exception {
        enqueueSendResponse();

        SignatureSchedule schedule = SignatureSchedule.builder()
                .maxReminders(0)
                .expirationEnabled(false)
                .build();
        SendQuoteRequest request = new SendQuoteRequest();
        request.setSchedule(schedule);

        client.turboQuote().sendQuote("q-1", request);

        RecordedRequest recorded = server.takeRequest();
        JsonObject body = gson.fromJson(recorded.getBody().readUtf8(), JsonObject.class);

        assertEquals(0, body.get("maxReminders").getAsInt());
        assertFalse(body.get("expirationEnabled").getAsBoolean());
    }

    @Test
    @DisplayName("sendQuoteWithDeliverable carries the schedule flat alongside the deliverable fields")
    void sendQuoteWithDeliverableCarriesScheduleFlat() throws Exception {
        enqueueSendResponse();

        SignatureSchedule schedule = SignatureSchedule.builder()
                .remindersEnabled(true)
                .reminderDelay(new SignatureSchedule.Duration(2, "days"))
                .expirationEnabled(false)
                .build();
        SendQuoteWithDeliverableRequest request = new SendQuoteWithDeliverableRequest();
        request.setDeliverableId("del-1");
        request.setMergePosition("end");
        request.setSchedule(schedule);

        client.turboQuote().sendQuoteWithDeliverable("q-1", request);

        RecordedRequest recorded = server.takeRequest();
        assertTrue(recorded.getPath().endsWith("/v1/quotes/q-1/send-with-deliverable"));
        JsonObject body = gson.fromJson(recorded.getBody().readUtf8(), JsonObject.class);

        assertFalse(body.has("schedule"));
        assertEquals("del-1", body.get("deliverableId").getAsString());
        assertTrue(body.get("remindersEnabled").getAsBoolean());
        assertDuration(body, "reminderDelay", 2, "days");
        assertFalse(body.get("expirationEnabled").getAsBoolean());
    }

    @Test
    @DisplayName("createAndSend emits the flat schedule on the send step")
    void createAndSendEmitsFlatScheduleOnSendStep() throws Exception {
        // Step 1: create quote
        Map<String, Object> quote = new HashMap<>();
        quote.put("id", "q-1");
        quote.put("status", "draft");
        Map<String, Object> createResponse = new HashMap<>();
        createResponse.put("result", quote);
        createResponse.put("message", "Quote created successfully");
        server.enqueue(new MockResponse().setBody(wrapInData(createResponse)));
        // Step 2: send quote
        enqueueSendResponse();

        SignatureSchedule schedule = SignatureSchedule.builder()
                .remindersEnabled(true)
                .maxReminders(0)
                .reminderDelay(new SignatureSchedule.Duration(1, "days"))
                .build();
        SendQuoteRequest send = new SendQuoteRequest();
        send.setSchedule(schedule);

        CreateAndSendRequest request = new CreateAndSendRequest();
        request.setName("Enterprise License");
        request.setCompanyId("c-1");
        request.setContactId("ct-1");
        request.setSend(send);

        client.turboQuote().createAndSend(request);

        RecordedRequest create = server.takeRequest();
        assertTrue(create.getPath().endsWith("/v1/quotes"));
        RecordedRequest sendReq = server.takeRequest();
        assertTrue(sendReq.getPath().endsWith("/v1/quotes/q-1/send"));

        JsonObject body = gson.fromJson(sendReq.getBody().readUtf8(), JsonObject.class);
        assertFalse(body.has("schedule"));
        assertTrue(body.get("remindersEnabled").getAsBoolean());
        assertEquals(0, body.get("maxReminders").getAsInt());
        assertDuration(body, "reminderDelay", 1, "days");
    }
}
