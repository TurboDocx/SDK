package com.turbodocx;

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
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Template signer roles: a template set up in the TurboDocx UI (signers + fields dragged onto the
 * PDF) is sent by naming each signer's role. Bodies are double-encoded: the whole body is JSON and
 * {@code recipients}/{@code fields} are JSON strings inside it.
 */
class TurboSignTemplateRolesTest {

    private static final String TEMPLATE_ID = "84759112-d9d6-443a-bb78-87c427bd7948";

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

    private void enqueue(int code, String body) {
        server.enqueue(new MockResponse()
                .setResponseCode(code)
                .setHeader("Content-Type", "application/json")
                .setBody(body));
    }

    private static JsonArray parseArray(JsonObject body, String key) {
        return JsonParser.parseString(body.get(key).getAsString()).getAsJsonArray();
    }

    private static JsonObject bodyOf(RecordedRequest recorded) {
        return JsonParser.parseString(recorded.getBody().readUtf8()).getAsJsonObject();
    }

    @Test
    @DisplayName("sendSignature sends each recipient's role and an empty fields list when fields are omitted")
    void sendSignatureWithRole() throws Exception {
        enqueue(200, "{\"data\":{\"success\":true,\"documentId\":\"doc-1\",\"status\":\"under_review\"}}");

        SendSignatureResponse result = client.turboSign().sendSignature(new SendSignatureRequest.Builder()
                .templateId(TEMPLATE_ID)
                .recipients(Collections.singletonList(
                        Recipient.withRole("client", "Jane Doe", "jane@client.com")))
                .build());

        assertEquals("doc-1", result.getDocumentId());
        RecordedRequest recorded = server.takeRequest();
        assertEquals("/turbosign/single/prepare-for-signing", recorded.getPath());
        JsonObject body = bodyOf(recorded);
        assertEquals(TEMPLATE_ID, body.get("templateId").getAsString());

        JsonObject expected = new JsonObject();
        expected.addProperty("name", "Jane Doe");
        expected.addProperty("email", "jane@client.com");
        expected.addProperty("role", "client");
        JsonArray expectedRecipients = new JsonArray();
        expectedRecipients.add(expected);
        // No signingOrder: a role signs in the order saved on the template.
        assertEquals(expectedRecipients, parseArray(body, "recipients"));
        assertEquals(new JsonArray(), parseArray(body, "fields"));
    }

    @Test
    @DisplayName("the positional Recipient constructor still sends signingOrder and no role")
    void legacyRecipientUnchanged() throws Exception {
        enqueue(200, "{\"data\":{\"success\":true,\"documentId\":\"doc-1\",\"status\":\"under_review\"}}");

        client.turboSign().sendSignature(new SendSignatureRequest.Builder()
                .fileLink("https://example.com/doc.pdf")
                .recipients(Collections.singletonList(new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build());

        JsonObject recipient = parseArray(bodyOf(server.takeRequest()), "recipients").get(0).getAsJsonObject();
        assertEquals(1, recipient.get("signingOrder").getAsInt());
        assertFalse(recipient.has("role"));
    }

    @Test
    @DisplayName("sendSignature surfaces the API's message and code when a role isn't on the template")
    void unknownRoleError() {
        enqueue(400, "{\"message\":\"Unknown role \\\"clinet\\\". This template's roles are: client, countersigner\","
                + "\"type\":\"UnknownSignerRole\"}");

        TurboDocxException.ValidationException err = assertThrows(TurboDocxException.ValidationException.class,
                () -> client.turboSign().sendSignature(new SendSignatureRequest.Builder()
                        .templateId(TEMPLATE_ID)
                        .recipients(Collections.singletonList(
                                Recipient.withRole("clinet", "Jane Doe", "jane@client.com")))
                        .build()));

        assertEquals("Unknown role \"clinet\". This template's roles are: client, countersigner", err.getMessage());
        assertEquals("UnknownSignerRole", err.getCode());
        assertEquals(400, err.getStatusCode());
    }

    @Test
    @DisplayName("createSignatureReviewLink sends roles to prepare-for-review with an empty fields list")
    void reviewLinkWithRole() throws Exception {
        enqueue(200, "{\"data\":{\"success\":true,\"documentId\":\"doc-2\",\"status\":\"review_ready\"}}");

        client.turboSign().createSignatureReviewLink(new CreateSignatureReviewLinkRequest.Builder()
                .templateId(TEMPLATE_ID)
                .recipients(Collections.singletonList(
                        new Recipient.Builder().role("client").name("Jane Doe").email("jane@client.com").build()))
                .build());

        RecordedRequest recorded = server.takeRequest();
        assertEquals("/turbosign/single/prepare-for-review", recorded.getPath());
        JsonObject body = bodyOf(recorded);
        assertEquals("client", parseArray(body, "recipients").get(0).getAsJsonObject().get("role").getAsString());
        assertEquals(new JsonArray(), parseArray(body, "fields"));
    }

    @Test
    @DisplayName("createEmbeddedSignature passes each recipient's role through to the send")
    void embeddedRolePassthrough() throws Exception {
        enqueue(200, "{\"data\":{\"success\":true,\"documentId\":\"doc-3\",\"status\":\"under_review\","
                + "\"recipients\":[{\"id\":\"rec-1\",\"name\":\"Jane Doe\",\"email\":\"jane@client.com\"}]}}");
        enqueue(200, "{\"data\":{\"results\":{\"url\":\"https://app/sign/doc-3?token=J\",\"expiresAt\":null,"
                + "\"recipientId\":\"rec-1\"}}}");

        CreateEmbeddedSignatureResponse result = client.turboSign().createEmbeddedSignature(
                new CreateEmbeddedSignatureRequest.Builder()
                        .templateId(TEMPLATE_ID)
                        .recipients(Collections.singletonList(new EmbeddedSignatureRecipient.Builder()
                                .role("client")
                                .name("Jane Doe")
                                .email("jane@client.com")
                                .build()))
                        .build());

        JsonObject body = bodyOf(server.takeRequest());
        JsonObject expected = new JsonObject();
        expected.addProperty("name", "Jane Doe");
        expected.addProperty("email", "jane@client.com");
        expected.addProperty("signingOrder", 1);
        expected.addProperty("role", "client");
        JsonArray expectedRecipients = new JsonArray();
        expectedRecipients.add(expected);
        assertEquals(expectedRecipients, parseArray(body, "recipients"));
        assertEquals(new JsonArray(), parseArray(body, "fields"));
        assertEquals("https://app/sign/doc-3?token=J", result.getRecipients().get(0).getEmbedUrl());
    }

    @Test
    @DisplayName("createEmbeddedSignature returns recipients in the template's signing order, not the order passed")
    void embeddedSigningOrderWithRoles() throws Exception {
        // The template's roles sign client first; the API returns its signers in that order
        enqueue(200, "{\"data\":{\"success\":true,\"documentId\":\"doc-4\",\"status\":\"under_review\","
                + "\"recipients\":[{\"id\":\"rec-client\",\"name\":\"Jane Doe\",\"email\":\"jane@client.com\"},"
                + "{\"id\":\"rec-counter\",\"name\":\"Sam Lee\",\"email\":\"sam@acme.com\"}]}}");
        enqueue(200, "{\"data\":{\"results\":{\"url\":\"https://app/sign?token=J\",\"expiresAt\":null,"
                + "\"recipientId\":\"rec-client\"}}}");
        enqueue(200, "{\"data\":{\"results\":{\"url\":\"https://app/sign?token=S\",\"expiresAt\":null,"
                + "\"recipientId\":\"rec-counter\"}}}");

        CreateEmbeddedSignatureResponse result = client.turboSign().createEmbeddedSignature(
                new CreateEmbeddedSignatureRequest.Builder()
                        .templateId(TEMPLATE_ID)
                        .recipients(Arrays.asList(
                                new EmbeddedSignatureRecipient.Builder()
                                        .role("countersigner").name("Sam Lee").email("sam@acme.com").build(),
                                new EmbeddedSignatureRecipient.Builder()
                                        .role("client").name("Jane Doe").email("jane@client.com").build()))
                        .build());

        assertEquals(Arrays.asList("jane@client.com", "sam@acme.com"),
                result.getRecipients().stream().map(EmbeddedSignatureRecipientResult::getEmail)
                        .collect(Collectors.toList()));
        assertEquals(Arrays.asList("https://app/sign?token=J", "https://app/sign?token=S"),
                result.getRecipients().stream().map(EmbeddedSignatureRecipientResult::getEmbedUrl)
                        .collect(Collectors.toList()));
    }

    @Test
    @DisplayName("getTemplateSignatureSetup GETs the template's signer roles and unwraps the response")
    void getTemplateSignatureSetup() throws Exception {
        enqueue(200, "{\"data\":{\"templateId\":\"" + TEMPLATE_ID + "\",\"roles\":["
                + "{\"key\":\"client\",\"label\":\"Client\",\"order\":1,\"hasSavedSigner\":false,\"fieldCount\":3},"
                + "{\"key\":\"countersigner\",\"label\":\"Countersigner\",\"order\":2,\"hasSavedSigner\":true,"
                + "\"defaultName\":\"Sam Lee\",\"defaultEmail\":\"sam@acme.com\",\"fieldCount\":2}]}}");

        TemplateSignatureSetup setup = client.turboSign().getTemplateSignatureSetup(TEMPLATE_ID);

        RecordedRequest recorded = server.takeRequest();
        assertEquals("GET", recorded.getMethod());
        assertEquals("/turbosign/templates/" + TEMPLATE_ID + "/signature-setup", recorded.getPath());

        assertEquals(TEMPLATE_ID, setup.getTemplateId());
        assertEquals(2, setup.getRoles().size());
        TemplateSignatureRole client0 = setup.getRoles().get(0);
        assertEquals("client", client0.getKey());
        assertEquals("Client", client0.getLabel());
        assertEquals(1, client0.getOrder());
        assertFalse(client0.hasSavedSigner());
        assertNull(client0.getDefaultName());
        assertNull(client0.getDefaultEmail());
        assertEquals(3, client0.getFieldCount());
        TemplateSignatureRole counter = setup.getRoles().get(1);
        assertEquals("countersigner", counter.getKey());
        assertEquals("Countersigner", counter.getLabel());
        assertEquals(2, counter.getOrder());
        assertTrue(counter.hasSavedSigner());
        assertEquals("Sam Lee", counter.getDefaultName());
        assertEquals("sam@acme.com", counter.getDefaultEmail());
        assertEquals(2, counter.getFieldCount());
    }

    @Test
    @DisplayName("getTemplateSignatureSetup URL-encodes the template id")
    void getTemplateSignatureSetupEncodesId() throws Exception {
        enqueue(200, "{\"data\":{\"templateId\":\"a/b\",\"roles\":[]}}");

        client.turboSign().getTemplateSignatureSetup("a/b");

        assertEquals("/turbosign/templates/a%2Fb/signature-setup", server.takeRequest().getPath());
    }
}
