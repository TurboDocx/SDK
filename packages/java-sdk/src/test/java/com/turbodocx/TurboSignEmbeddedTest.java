package com.turbodocx;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.turbodocx.models.*;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.*;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Embedded-signing tests for TurboSign — the Java port of the JS
 * {@code turbosign-embedded-signature-wire} + {@code turbosign-identity-wire} suites.
 *
 * <p>Covers the three ported methods:
 * <ul>
 *   <li>{@code createSigningUrl} — XOR selector validation, https returnUrl guard, and the
 *       {@code { data: { results } }} double-envelope unwrap.</li>
 *   <li>{@code getEmbeddedSigningSettings} — read-only settings, same envelope unwrap.</li>
 *   <li>{@code createEmbeddedSignature} — sendSignature + createSigningUrl per recipient, auth /
 *       fields shorthand mapping, signing-order assembly, and turn-aware status degradation.</li>
 * </ul>
 * Uses the real HttpClient against a MockWebServer so the actual server envelopes flow through the
 * client's smart-unwrap, exactly as the JS wire tests do.
 */
class TurboSignEmbeddedTest {

    private MockWebServer server;
    private TurboDocxClient client;
    private final Gson gson = new Gson();

    @BeforeEach
    void setUp() throws IOException {
        server = new MockWebServer();
        server.start();
        client = new TurboDocxClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                .baseUrl(server.url("/").toString())
                .senderEmail("test@company.com")
                .build();
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    private void enqueueJson(String body) {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(body));
    }

    private void enqueueError(int code, String body) {
        server.enqueue(new MockResponse()
                .setResponseCode(code)
                .setHeader("Content-Type", "application/json")
                .setBody(body));
    }

    /** The flat sendSignature envelope with the given recipients (id/name/email). */
    private String sendEnvelope(String documentId, String[][] recipients) {
        JsonArray arr = new JsonArray();
        for (String[] r : recipients) {
            JsonObject o = new JsonObject();
            o.addProperty("id", r[0]);
            o.addProperty("name", r[1]);
            o.addProperty("email", r[2]);
            arr.add(o);
        }
        JsonObject body = new JsonObject();
        body.addProperty("success", true);
        body.addProperty("documentId", documentId);
        body.addProperty("status", "under_review");
        body.add("recipients", arr);
        body.addProperty("message", "ok");
        return body.toString();
    }

    /** The createSigningUrl envelope: { data: { results: {...} } }. */
    private String signingUrlEnvelope(String recipientId, String url, String mode) {
        JsonObject results = new JsonObject();
        results.addProperty("url", url);
        results.add("expiresAt", com.google.gson.JsonNull.INSTANCE);
        results.addProperty("recipientId", recipientId);
        if (mode != null) {
            results.addProperty("identityVerificationMode", mode);
        }
        JsonArray checks = new JsonArray();
        if ("otp".equals(mode)) {
            checks.add("email_otp");
        }
        results.add("pendingChecks", checks);
        JsonObject data = new JsonObject();
        data.add("results", results);
        JsonObject envelope = new JsonObject();
        envelope.add("data", data);
        return envelope.toString();
    }

    /** Parse the JSON request body of the next request off the server. */
    private JsonObject takeBody() throws InterruptedException {
        RecordedRequest recorded = server.takeRequest();
        return JsonParser.parseString(recorded.getBody().readUtf8()).getAsJsonObject();
    }

    // ============================================
    // createSigningUrl
    // ============================================

    @Test
    @DisplayName("createSigningUrl posts to the signing-url endpoint and unwraps { data: { results } }")
    void createSigningUrlHappyPath() throws Exception {
        enqueueJson(signingUrlEnvelope("rec-1", "https://app/sign/doc-1?token=AT", "otp"));

        CreateSigningUrlResponse res = client.turboSign().createSigningUrl(
                "doc-1",
                new CreateSigningUrlRequest.Builder().recipientId("rec-1").build());

        // Must be the flat response, never the { results: ... } wrapper.
        assertEquals("https://app/sign/doc-1?token=AT", res.getUrl());
        assertEquals("rec-1", res.getRecipientId());
        assertEquals("otp", res.getIdentityVerificationMode());
        assertNull(res.getExpiresAt());
        assertEquals(Collections.singletonList("email_otp"), res.getPendingChecks());

        RecordedRequest recorded = server.takeRequest();
        assertEquals("POST", recorded.getMethod());
        assertEquals("/turbosign/documents/doc-1/signing-url", recorded.getPath());
        JsonObject body = JsonParser.parseString(recorded.getBody().readUtf8()).getAsJsonObject();
        assertEquals("rec-1", body.get("recipientId").getAsString());
    }

    @Test
    @DisplayName("createSigningUrl selects the recipient by externalId")
    void createSigningUrlByExternalId() throws Exception {
        enqueueJson(signingUrlEnvelope("rec-1", "https://app/sign/doc-1?token=AT", null));

        client.turboSign().createSigningUrl(
                "doc-1",
                new CreateSigningUrlRequest.Builder().externalId("cust_1").build());

        JsonObject body = takeBody();
        assertEquals("cust_1", body.get("externalId").getAsString());
        assertFalse(body.has("recipientId"));
    }

    @Test
    @DisplayName("createSigningUrl passes an identity assertion through for external_idv")
    void createSigningUrlPassesIdentityAssertion() throws Exception {
        enqueueJson(signingUrlEnvelope("rec-1", "https://app/sign/doc-1?token=AT", "external_idv"));

        IdentityAssertion assertion = new IdentityAssertion.Builder()
                .provider("CAPA")
                .verificationId("ver-123")
                .verifiedAt("2026-01-01T00:00:00.000Z")
                .subjectEmail("john@example.com")
                .build();

        client.turboSign().createSigningUrl(
                "doc-1",
                new CreateSigningUrlRequest.Builder()
                        .recipientId("rec-1")
                        .identityAssertion(assertion)
                        .build());

        JsonObject body = takeBody();
        assertEquals("rec-1", body.get("recipientId").getAsString());
        JsonObject sent = body.getAsJsonObject("identityAssertion");
        assertEquals("CAPA", sent.get("provider").getAsString());
        assertEquals("ver-123", sent.get("verificationId").getAsString());
        assertEquals("john@example.com", sent.get("subjectEmail").getAsString());
    }

    @Test
    @DisplayName("createSigningUrl rejects zero selectors before any HTTP call")
    void createSigningUrlRejectsZeroSelectors() {
        TurboDocxException.ValidationException ex = assertThrows(
                TurboDocxException.ValidationException.class,
                () -> client.turboSign().createSigningUrl("doc-1", new CreateSigningUrlRequest.Builder().build()));
        assertEquals("RecipientSelectorInvalid", ex.getCode());
        // Nothing was sent — the guard runs before the HTTP call.
        assertEquals(0, server.getRequestCount());
    }

    @Test
    @DisplayName("createSigningUrl rejects two selectors")
    void createSigningUrlRejectsTwoSelectors() {
        TurboDocxException.ValidationException ex = assertThrows(
                TurboDocxException.ValidationException.class,
                () -> client.turboSign().createSigningUrl(
                        "doc-1",
                        new CreateSigningUrlRequest.Builder().recipientId("rec-1").externalId("cust_1").build()));
        assertEquals("RecipientSelectorInvalid", ex.getCode());
    }

    @Test
    @DisplayName("createSigningUrl treats an empty-string selector as absent (empty recipientId + real externalId is valid)")
    void createSigningUrlEmptyStringSelectorIsAbsent() throws Exception {
        enqueueJson(signingUrlEnvelope("rec-1", "https://app/sign/doc-1?token=AT", null));

        // recipientId "" must not count as a selector; only externalId is present → exactly one.
        CreateSigningUrlResponse res = client.turboSign().createSigningUrl(
                "doc-1",
                new CreateSigningUrlRequest.Builder().recipientId("").externalId("cust_1").build());

        assertEquals("https://app/sign/doc-1?token=AT", res.getUrl());
    }

    @Test
    @DisplayName("createSigningUrl rejects a non-https returnUrl")
    void createSigningUrlRejectsNonHttpsReturnUrl() {
        TurboDocxException.ValidationException ex = assertThrows(
                TurboDocxException.ValidationException.class,
                () -> client.turboSign().createSigningUrl(
                        "doc-1",
                        new CreateSigningUrlRequest.Builder()
                                .recipientId("rec-1")
                                .returnUrl("http://insecure.example.com")
                                .build()));
        assertEquals("InvalidReturnUrl", ex.getCode());
        assertEquals(0, server.getRequestCount());
    }

    // ============================================
    // getEmbeddedSigningSettings
    // ============================================

    @Test
    @DisplayName("getEmbeddedSigningSettings unwraps the { data: { results } } server envelope")
    void getEmbeddedSigningSettings() throws Exception {
        String results = "{\"enabled\":true,\"allowExternalIdv\":false,\"allowIdentityOverride\":false,"
                + "\"defaultChannel\":\"email\",\"allowedFrameAncestors\":[\"https://app.example.com\"]}";
        enqueueJson("{\"data\":{\"results\":" + results + "}}");

        EmbeddedSigningSettings settings = client.turboSign().getEmbeddedSigningSettings();

        assertTrue(settings.isEnabled());
        assertFalse(settings.isAllowExternalIdv());
        assertFalse(settings.isAllowIdentityOverride());
        assertEquals("email", settings.getDefaultChannel());
        assertEquals(Collections.singletonList("https://app.example.com"), settings.getAllowedFrameAncestors());

        RecordedRequest recorded = server.takeRequest();
        assertEquals("GET", recorded.getMethod());
        assertEquals("/turbosign/embedded-signing-settings", recorded.getPath());
    }

    // ============================================
    // createEmbeddedSignature
    // ============================================

    @Test
    @DisplayName("createEmbeddedSignature calls send once then createSigningUrl per recipient, returning results in signing order")
    void createEmbeddedSignatureInSigningOrder() throws Exception {
        enqueueJson(sendEnvelope("doc-1", new String[][]{
                {"rec-1", "Alice", "alice@example.com"},
                {"rec-2", "Bob", "bob@example.com"},
        }));
        // Minted in signing order: Bob (order 1) first, then Alice (order 2).
        enqueueJson(signingUrlEnvelope("rec-2", "https://app/sign/doc-1?token=BOB", "otp"));
        enqueueJson(signingUrlEnvelope("rec-1", "https://app/sign/doc-1?token=ALICE", "otp"));

        // Deliberately out of array order: Alice is index 0 but signs 2nd; Bob is index 1 but signs 1st.
        CreateEmbeddedSignatureRequest request = new CreateEmbeddedSignatureRequest.Builder()
                .templateId("tmpl-1")
                .documentName("Contract")
                .recipients(Arrays.asList(
                        new EmbeddedSignatureRecipient.Builder()
                                .name("Alice").email("alice@example.com").signingOrder(2)
                                .auth(EmbeddedRecipientAuth.emailOtp()).build(),
                        new EmbeddedSignatureRecipient.Builder()
                                .name("Bob").email("bob@example.com").signingOrder(1)
                                .auth(EmbeddedRecipientAuth.emailOtp()).build()))
                .build();

        CreateEmbeddedSignatureResponse res = client.turboSign().createEmbeddedSignature(request);

        assertEquals(3, server.getRequestCount());
        assertEquals("doc-1", res.getDocumentId());
        assertEquals(2, res.getRecipients().size());
        // IN SIGNING ORDER: Bob (order 1) first, Alice (order 2) second.
        assertEquals("Bob", res.getRecipients().get(0).getName());
        assertEquals("rec-2", res.getRecipients().get(0).getRecipientId());
        assertEquals("https://app/sign/doc-1?token=BOB", res.getRecipients().get(0).getEmbedUrl());
        assertEquals("ready", res.getRecipients().get(0).getStatus());
        assertEquals("otp", res.getRecipients().get(0).getIdentityVerificationMode());
        assertEquals("Alice", res.getRecipients().get(1).getName());
        assertEquals("https://app/sign/doc-1?token=ALICE", res.getRecipients().get(1).getEmbedUrl());

        // 1st request = sendSignature; 2nd + 3rd = signing-url on the right document, selected by
        // the returned ids in signing order (Bob's id first, Alice's second).
        RecordedRequest send = server.takeRequest();
        assertEquals("/turbosign/single/prepare-for-signing", send.getPath());
        RecordedRequest firstUrl = server.takeRequest();
        assertEquals("/turbosign/documents/doc-1/signing-url", firstUrl.getPath());
        assertEquals("rec-2", JsonParser.parseString(firstUrl.getBody().readUtf8())
                .getAsJsonObject().get("recipientId").getAsString());
        RecordedRequest secondUrl = server.takeRequest();
        assertEquals("/turbosign/documents/doc-1/signing-url", secondUrl.getPath());
        assertEquals("rec-1", JsonParser.parseString(secondUrl.getBody().readUtf8())
                .getAsJsonObject().get("recipientId").getAsString());
    }

    @Test
    @DisplayName("createEmbeddedSignature maps auth.emailOtp to identityVerification otp/email, defaults order, suppresses email")
    void createEmbeddedSignatureMapsEmailOtp() throws Exception {
        enqueueJson(sendEnvelope("doc-2", new String[][]{{"rec-1", "Alice", "alice@example.com"}}));
        enqueueJson(signingUrlEnvelope("rec-1", "https://app/sign/doc-2?token=A", "otp"));

        client.turboSign().createEmbeddedSignature(new CreateEmbeddedSignatureRequest.Builder()
                .templateId("tmpl-1")
                .recipients(Collections.singletonList(
                        new EmbeddedSignatureRecipient.Builder()
                                .name("Alice").email("alice@example.com")
                                .auth(EmbeddedRecipientAuth.emailOtp()).build()))
                .build());

        JsonObject body = takeBody();
        // Embedded flow suppresses recipient emails by default (form-encoded as the string "false").
        assertEquals("false", body.get("sendEmail").getAsString());
        JsonArray recipients = JsonParser.parseString(body.get("recipients").getAsString()).getAsJsonArray();
        JsonObject alice = recipients.get(0).getAsJsonObject();
        assertEquals(1, alice.get("signingOrder").getAsInt()); // defaults to index + 1
        JsonObject iv = alice.getAsJsonObject("identityVerification");
        assertEquals("otp", iv.get("mode").getAsString());
        assertEquals("email", iv.get("channel").getAsString());
    }

    @Test
    @DisplayName("createEmbeddedSignature maps auth.sms to otp/sms and sets the recipient phone")
    void createEmbeddedSignatureMapsSms() throws Exception {
        enqueueJson(sendEnvelope("doc-3", new String[][]{{"rec-1", "Alice", "alice@example.com"}}));
        enqueueJson(signingUrlEnvelope("rec-1", "https://app/sign/doc-3?token=A", "otp"));

        client.turboSign().createEmbeddedSignature(new CreateEmbeddedSignatureRequest.Builder()
                .templateId("tmpl-1")
                .recipients(Collections.singletonList(
                        new EmbeddedSignatureRecipient.Builder()
                                .name("Alice").email("alice@example.com")
                                .auth(EmbeddedRecipientAuth.sms("+13055551234")).build()))
                .build());

        JsonObject body = takeBody();
        JsonObject alice = JsonParser.parseString(body.get("recipients").getAsString())
                .getAsJsonArray().get(0).getAsJsonObject();
        JsonObject iv = alice.getAsJsonObject("identityVerification");
        assertEquals("otp", iv.get("mode").getAsString());
        assertEquals("sms", iv.get("channel").getAsString());
        assertEquals("+13055551234", alice.get("phone").getAsString());
    }

    @Test
    @DisplayName("createEmbeddedSignature expands the fields shorthand into Field objects with placement replace + default sizes")
    void createEmbeddedSignatureExpandsFields() throws Exception {
        enqueueJson(sendEnvelope("doc-4", new String[][]{{"rec-1", "Alice", "alice@example.com"}}));
        enqueueJson(signingUrlEnvelope("rec-1", "https://app/sign/doc-4?token=A", null));

        client.turboSign().createEmbeddedSignature(new CreateEmbeddedSignatureRequest.Builder()
                .templateId("tmpl-1")
                .recipients(Collections.singletonList(
                        new EmbeddedSignatureRecipient.Builder()
                                .name("Alice").email("alice@example.com")
                                .fields(new EmbeddedRecipientFields.Builder()
                                        .signature("{signature1}")
                                        .date("{date1}")
                                        .initials("{initials1}")
                                        .fullName("{fullName1}")
                                        .build())
                                .build()))
                .build());

        JsonObject body = takeBody();
        JsonArray fields = JsonParser.parseString(body.get("fields").getAsString()).getAsJsonArray();
        assertEquals(4, fields.size());

        JsonObject signature = findByType(fields, "signature");
        assertEquals("alice@example.com", signature.get("recipientEmail").getAsString());
        JsonObject sigTemplate = signature.getAsJsonObject("template");
        assertEquals("{signature1}", sigTemplate.get("anchor").getAsString());
        assertEquals("replace", sigTemplate.get("placement").getAsString());
        assertEquals(100, sigTemplate.getAsJsonObject("size").get("width").getAsInt());
        assertEquals(30, sigTemplate.getAsJsonObject("size").get("height").getAsInt());

        assertEquals(75, findByType(fields, "date").getAsJsonObject("template")
                .getAsJsonObject("size").get("width").getAsInt());
        // The `initials` shorthand emits the 'initial' field type.
        assertNotNull(findByType(fields, "initial"));
        assertEquals(50, findByType(fields, "initial").getAsJsonObject("template")
                .getAsJsonObject("size").get("width").getAsInt());
        assertEquals(150, findByType(fields, "full_name").getAsJsonObject("template")
                .getAsJsonObject("size").get("width").getAsInt());
    }

    @Test
    @DisplayName("createEmbeddedSignature honors an explicit fields override, even an empty list, over the shorthand")
    void createEmbeddedSignatureExplicitEmptyFieldsWins() throws Exception {
        enqueueJson(sendEnvelope("doc-4b", new String[][]{{"rec-1", "Alice", "alice@example.com"}}));
        enqueueJson(signingUrlEnvelope("rec-1", "https://app/sign/doc-4b?token=A", null));

        client.turboSign().createEmbeddedSignature(new CreateEmbeddedSignatureRequest.Builder()
                .templateId("tmpl-1")
                .fields(Collections.emptyList()) // explicit empty overrides the shorthand
                .recipients(Collections.singletonList(
                        new EmbeddedSignatureRecipient.Builder()
                                .name("Alice").email("alice@example.com")
                                .fields(new EmbeddedRecipientFields.Builder().signature("{sig}").build())
                                .build()))
                .build());

        JsonObject body = takeBody();
        JsonArray fields = JsonParser.parseString(body.get("fields").getAsString()).getAsJsonArray();
        assertEquals(0, fields.size());
    }

    @Test
    @DisplayName("createEmbeddedSignature returns pending (null URL) for a not-in-turn recipient, ready for the one in turn")
    void createEmbeddedSignatureTurnAwarePending() throws Exception {
        enqueueJson(sendEnvelope("doc-6", new String[][]{
                {"rec-1", "First", "first@example.com"},
                {"rec-2", "Second", "second@example.com"},
        }));
        enqueueJson(signingUrlEnvelope("rec-1", "https://app/sign/doc-6?token=FIRST", "otp"));
        enqueueError(409, "{\"message\":\"It is not this recipient's turn to sign yet.\",\"code\":\"RecipientNotInTurn\"}");

        CreateEmbeddedSignatureResponse res = client.turboSign().createEmbeddedSignature(
                new CreateEmbeddedSignatureRequest.Builder()
                        .templateId("tmpl-1")
                        .recipients(Arrays.asList(
                                new EmbeddedSignatureRecipient.Builder()
                                        .name("First").email("first@example.com").signingOrder(1)
                                        .auth(EmbeddedRecipientAuth.emailOtp()).build(),
                                new EmbeddedSignatureRecipient.Builder()
                                        .name("Second").email("second@example.com").signingOrder(2)
                                        .auth(EmbeddedRecipientAuth.emailOtp()).build()))
                        .build());

        assertEquals(2, res.getRecipients().size());
        // First is ready with a real URL.
        assertEquals("First", res.getRecipients().get(0).getName());
        assertEquals("ready", res.getRecipients().get(0).getStatus());
        assertEquals("https://app/sign/doc-6?token=FIRST", res.getRecipients().get(0).getEmbedUrl());
        // Second is pending: no URL yet, but identity is still known.
        assertEquals("Second", res.getRecipients().get(1).getName());
        assertEquals("pending", res.getRecipients().get(1).getStatus());
        assertNull(res.getRecipients().get(1).getEmbedUrl());
        assertEquals("rec-2", res.getRecipients().get(1).getRecipientId());
        assertEquals("otp", res.getRecipients().get(1).getIdentityVerificationMode());
    }

    @Test
    @DisplayName("createEmbeddedSignature returns completed (null URL) for a recipient who already signed")
    void createEmbeddedSignatureTurnAwareCompleted() throws Exception {
        enqueueJson(sendEnvelope("doc-7", new String[][]{{"rec-1", "Done", "done@example.com"}}));
        enqueueError(409, "{\"message\":\"This recipient has already signed.\",\"code\":\"RecipientAlreadySigned\"}");

        CreateEmbeddedSignatureResponse res = client.turboSign().createEmbeddedSignature(
                new CreateEmbeddedSignatureRequest.Builder()
                        .templateId("tmpl-1")
                        .recipients(Collections.singletonList(
                                new EmbeddedSignatureRecipient.Builder()
                                        .name("Done").email("done@example.com").build()))
                        .build());

        assertEquals(1, res.getRecipients().size());
        assertEquals("completed", res.getRecipients().get(0).getStatus());
        assertNull(res.getRecipients().get(0).getEmbedUrl());
    }

    @Test
    @DisplayName("createEmbeddedSignature rethrows a non-turn error instead of masking it as pending")
    void createEmbeddedSignatureRethrowsGenuineError() {
        enqueueJson(sendEnvelope("doc-8", new String[][]{{"rec-1", "X", "x@example.com"}}));
        enqueueError(500, "{\"message\":\"boom\",\"code\":\"InternalError\"}");

        assertThrows(TurboDocxException.class, () -> client.turboSign().createEmbeddedSignature(
                new CreateEmbeddedSignatureRequest.Builder()
                        .templateId("tmpl-1")
                        .recipients(Collections.singletonList(
                                new EmbeddedSignatureRecipient.Builder()
                                        .name("X").email("x@example.com").build()))
                        .build()));
    }

    @Test
    @DisplayName("createEmbeddedSignature throws when send does not return a matching recipient")
    void createEmbeddedSignatureMissingRecipient() {
        // sendSignature returns a DIFFERENT email than requested → no id to mint against.
        enqueueJson(sendEnvelope("doc-9", new String[][]{{"rec-1", "Other", "other@example.com"}}));

        TurboDocxException.ValidationException ex = assertThrows(
                TurboDocxException.ValidationException.class,
                () -> client.turboSign().createEmbeddedSignature(
                        new CreateEmbeddedSignatureRequest.Builder()
                                .templateId("tmpl-1")
                                .recipients(Collections.singletonList(
                                        new EmbeddedSignatureRecipient.Builder()
                                                .name("Wanted").email("wanted@example.com").build()))
                                .build()));
        assertEquals("EmbeddedRecipientNotReturned", ex.getCode());
    }

    @Test
    @DisplayName("createSigningUrl treats an empty returnUrl as absent — no error and omitted from the request, while a valid https returnUrl is sent")
    void createSigningUrlEmptyReturnUrlIsAbsent() throws Exception {
        // Empty returnUrl: must not throw InvalidReturnUrl and must not appear on the wire.
        enqueueJson(signingUrlEnvelope("rec-1", "https://app/sign/doc-1?token=AT", null));
        CreateSigningUrlResponse res = client.turboSign().createSigningUrl(
                "doc-1",
                new CreateSigningUrlRequest.Builder().recipientId("rec-1").returnUrl("").build());
        assertEquals("https://app/sign/doc-1?token=AT", res.getUrl());
        JsonObject emptyBody = takeBody();
        assertFalse(emptyBody.has("returnUrl"), "empty returnUrl must be omitted from the request");

        // Paired positive case: a real https returnUrl must reach the wire unchanged. Without this
        // assertion an inverted strip-condition (stripping non-empty instead of empty) would pass.
        enqueueJson(signingUrlEnvelope("rec-1", "https://app/sign/doc-1?token=AT", null));
        client.turboSign().createSigningUrl(
                "doc-1",
                new CreateSigningUrlRequest.Builder()
                        .recipientId("rec-1")
                        .returnUrl("https://app.example.com/done")
                        .build());
        JsonObject withUrlBody = takeBody();
        assertEquals("https://app.example.com/done", withUrlBody.get("returnUrl").getAsString());
    }

    @Test
    @DisplayName("createEmbeddedSignature fails fast with PhoneRequiredForSmsOtp for an SMS-OTP recipient with no phone, before any HTTP call")
    void createEmbeddedSignatureSmsWithoutPhoneFailsFast() {
        // SMS auth with a null phone number → identityVerification otp/sms but no resolvable phone.
        // Nothing is enqueued: the guard must throw before sendSignature touches the network.
        TurboDocxException.ValidationException ex = assertThrows(
                TurboDocxException.ValidationException.class,
                () -> client.turboSign().createEmbeddedSignature(
                        new CreateEmbeddedSignatureRequest.Builder()
                                .templateId("tmpl-1")
                                .recipients(Collections.singletonList(
                                        new EmbeddedSignatureRecipient.Builder()
                                                .name("Alice").email("alice@example.com")
                                                .auth(EmbeddedRecipientAuth.sms(null)).build()))
                                .build()));
        assertEquals("PhoneRequiredForSmsOtp", ex.getCode());
        // Fail-fast: the guard runs before the send, so no request was made.
        assertEquals(0, server.getRequestCount());
    }

    private JsonObject findByType(JsonArray fields, String type) {
        for (int i = 0; i < fields.size(); i++) {
            JsonObject field = fields.get(i).getAsJsonObject();
            if (type.equals(field.get("type").getAsString())) {
                return field;
            }
        }
        return null;
    }
}
