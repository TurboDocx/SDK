package com.turbodocx;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.turbodocx.models.*;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

/**
 * {@code fitAnchoredTags} on the two send paths (and createEmbeddedSignature, which sends through
 * sendSignature). It is sent only when it is true: the API treats false the same as a missing key,
 * so false leaves it out and every existing request body stays exactly as it was. Mirrors the js-sdk
 * and py-sdk suites case for case.
 */
class TurboSignFitAnchoredTagsTest {

    private static final String SENT = "{\"data\":{\"success\":true,\"documentId\":\"doc-1\","
            + "\"status\":\"under_review\",\"message\":\"ok\","
            + "\"recipients\":[{\"id\":\"rec-1\",\"name\":\"Jane Doe\",\"email\":\"jane@example.com\"}]}}";
    private static final String SIGNING_URL = "{\"data\":{\"results\":{\"url\":\"https://app/sign/doc-1?token=T\","
            + "\"expiresAt\":null,\"recipientId\":\"rec-1\",\"identityVerificationMode\":null,\"pendingChecks\":[]}}}";
    private static final Pattern PART = Pattern.compile(
            "name=\"([^\"]+)\"(?:; filename=\"[^\"]*\")?.*?\\r\\n\\r\\n(.*?)\\r\\n--", Pattern.DOTALL);

    private MockWebServer server;
    private TurboDocxClient client;

    @BeforeEach
    void setUp() throws IOException {
        server = new MockWebServer();
        server.start();
        client = new TurboDocxClient.Builder()
                .apiKey("k")
                .orgId("o")
                .baseUrl(server.url("/").toString())
                .senderEmail("sender@company.com")
                .build();
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    private void enqueue(String body) {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(body));
    }

    /** A multipart body's named parts other than the file, or a JSON body, as name to string value. */
    private static Map<String, String> formOf(RecordedRequest recorded) {
        String body = recorded.getBody().readString(StandardCharsets.UTF_8);
        Map<String, String> form = new TreeMap<>();
        String contentType = recorded.getHeader("Content-Type");
        if (contentType != null && contentType.contains("multipart/form-data")) {
            Matcher matcher = PART.matcher(body);
            while (matcher.find()) {
                if (!matcher.group(1).equals("file")) {
                    form.put(matcher.group(1), matcher.group(2));
                }
            }
        } else {
            JsonObject json = JsonParser.parseString(body).getAsJsonObject();
            for (String key : json.keySet()) {
                form.put(key, json.get(key).getAsString());
            }
        }
        return form;
    }

    private static final List<Recipient> RECIPIENTS =
            Collections.singletonList(new Recipient("Jane Doe", "jane@example.com", 1));
    private static final List<Field> FIELDS = Collections.singletonList(new Field.Builder()
            .type("signature")
            .recipientEmail("jane@example.com")
            .template(new Field.TemplateAnchor.Builder().anchor("{ClientSign}").build())
            .build());

    /** Runs one send and returns its path and form. */
    private Map.Entry<String, Map<String, String>> sendWith(boolean review, boolean upload, boolean fit)
            throws Exception {
        enqueue(SENT);
        byte[] file = upload ? "%PDF-1.4 fake pdf bytes".getBytes(StandardCharsets.UTF_8) : null;
        String fileLink = upload ? null : "https://example.com/contract.pdf";
        if (review) {
            client.turboSign().createSignatureReviewLink(new CreateSignatureReviewLinkRequest.Builder()
                    .file(file).fileLink(fileLink).recipients(RECIPIENTS).fields(FIELDS)
                    .fitAnchoredTags(fit)
                    .build());
        } else {
            client.turboSign().sendSignature(new SendSignatureRequest.Builder()
                    .file(file).fileLink(fileLink).recipients(RECIPIENTS).fields(FIELDS)
                    .fitAnchoredTags(fit)
                    .build());
        }
        RecordedRequest recorded = server.takeRequest();
        return Map.entry(recorded.getPath(), formOf(recorded));
    }

    static Stream<Arguments> sends() {
        return Stream.of(
                Arguments.of("sendSignature, upload (multipart)", false, true),
                Arguments.of("sendSignature, file link (JSON)", false, false),
                Arguments.of("createSignatureReviewLink, upload (multipart)", true, true),
                Arguments.of("createSignatureReviewLink, file link (JSON)", true, false));
    }

    @ParameterizedTest(name = "{0}: sends fitAnchoredTags=true when true")
    @MethodSource("sends")
    void sendsTheFlagWhenTrue(String name, boolean review, boolean upload) throws Exception {
        Map.Entry<String, Map<String, String>> sent = sendWith(review, upload, true);

        assertEquals(review ? "/turbosign/single/prepare-for-review" : "/turbosign/single/prepare-for-signing",
                sent.getKey());
        assertEquals("true", sent.getValue().get("fitAnchoredTags"));
    }

    @ParameterizedTest(name = "{0}: leaves the key out when false, the form otherwise unchanged")
    @MethodSource("sends")
    void leavesTheKeyOutWhenFalse(String name, boolean review, boolean upload) throws Exception {
        Map<String, String> off = sendWith(review, upload, false).getValue();
        Map<String, String> on = sendWith(review, upload, true).getValue();

        assertFalse(off.containsKey("fitAnchoredTags"));
        on.remove("fitAnchoredTags");
        assertEquals(off, on);
    }

    @Test
    @DisplayName("the flag is off by default")
    void offByDefault() throws Exception {
        enqueue(SENT);
        client.turboSign().sendSignature(new SendSignatureRequest.Builder()
                .fileLink("https://example.com/contract.pdf").recipients(RECIPIENTS).fields(FIELDS)
                .build());

        assertFalse(formOf(server.takeRequest()).containsKey("fitAnchoredTags"));
    }

    private Map<String, String> embedWith(boolean fit) throws Exception {
        enqueue(SENT);
        enqueue(SIGNING_URL);
        client.turboSign().createEmbeddedSignature(new CreateEmbeddedSignatureRequest.Builder()
                .fileLink("https://example.com/contract.pdf")
                .recipients(Collections.singletonList(new EmbeddedSignatureRecipient.Builder()
                        .name("Jane Doe")
                        .email("jane@example.com")
                        .fields(new EmbeddedRecipientFields.Builder().signature("{ClientSign}").build())
                        .build()))
                .fitAnchoredTags(fit)
                .build());
        RecordedRequest send = server.takeRequest();
        assertEquals("/turbosign/single/prepare-for-signing", send.getPath());
        server.takeRequest(); // the signing-url call
        return formOf(send);
    }

    @Test
    @DisplayName("createEmbeddedSignature passes fitAnchoredTags=true to the send when true")
    void embeddedSendsTheFlagWhenTrue() throws Exception {
        assertEquals("true", embedWith(true).get("fitAnchoredTags"));
    }

    @Test
    @DisplayName("createEmbeddedSignature leaves the key out when false")
    void embeddedLeavesTheKeyOutWhenFalse() throws Exception {
        assertFalse(embedWith(false).containsKey("fitAnchoredTags"));
    }
}
