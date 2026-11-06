package com.turbodocx;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.turbodocx.models.*;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.*;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Template signature setups with anchored fields: a field tied to a template tag (like
 * {@code {ClientSign}}) for one signer role. Uses the real HTTP client against a MockWebServer, so
 * the requests asserted here are exactly what goes over the wire.
 */
class TurboSignSignatureAnchorsTest {

    private static final String TEMPLATE_ID = "84759112-d9d6-443a-bb78-87c427bd7948";
    private static final String SEND_OK =
            "{\"data\":{\"success\":true,\"documentId\":\"doc-1\",\"status\":\"under_review\"}}";
    private static final String SAVED_SETUP = "{\"roles\":[{\"roleId\":\"r1\",\"label\":\"Signer 1\",\"order\":1}],"
            + "\"fields\":[{\"roleId\":\"r1\",\"type\":\"signature\",\"anchor\":\"{ClientSign}\",\"fieldId\":\"f1\"}],"
            + "\"savedOn\":\"2026-11-06T00:00:00.000Z\"}";

    private MockWebServer server;
    private TurboDocxClient client;

    private final List<Recipient> recipients =
            Collections.singletonList(new Recipient("Jane Doe", "jane@client.com", 1));
    private final List<Field> anchoredFields = Collections.singletonList(new Field.Builder()
            .type("signature")
            .recipientEmail("jane@client.com")
            .template(new Field.TemplateAnchor.Builder().anchor("{ClientSign}").build())
            .build());

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

    private static JsonObject bodyOf(RecordedRequest recorded) {
        return JsonParser.parseString(recorded.getBody().readUtf8()).getAsJsonObject();
    }

    @Nested
    @DisplayName("applySignatureSetup")
    class ApplySignatureSetup {

        @Test
        @DisplayName("is sent as true on sendSignature and createSignatureReviewLink")
        void sentOnBothSendMethods() throws Exception {
            enqueue(200, SEND_OK);
            enqueue(200, SEND_OK);

            client.turboSign().sendSignature(new SendSignatureRequest.Builder()
                    .templateId(TEMPLATE_ID).recipients(recipients).fields(anchoredFields)
                    .applySignatureSetup(true).build());
            client.turboSign().createSignatureReviewLink(new CreateSignatureReviewLinkRequest.Builder()
                    .templateId(TEMPLATE_ID).recipients(recipients).fields(anchoredFields)
                    .applySignatureSetup(true).build());

            assertEquals("true", bodyOf(server.takeRequest()).get("applySignatureSetup").getAsString());
            assertEquals("true", bodyOf(server.takeRequest()).get("applySignatureSetup").getAsString());
        }

        @Test
        @DisplayName("forwards an explicit false and leaves the key out when unset")
        void explicitFalseForwardedNullOmitted() throws Exception {
            enqueue(200, SEND_OK);
            enqueue(200, SEND_OK);

            client.turboSign().sendSignature(new SendSignatureRequest.Builder()
                    .templateId(TEMPLATE_ID).recipients(recipients).fields(anchoredFields)
                    .applySignatureSetup(false).build());
            client.turboSign().sendSignature(new SendSignatureRequest.Builder()
                    .templateId(TEMPLATE_ID).recipients(recipients).fields(anchoredFields).build());

            assertEquals("false", bodyOf(server.takeRequest()).get("applySignatureSetup").getAsString());
            assertFalse(bodyOf(server.takeRequest()).has("applySignatureSetup"));
        }

        @Test
        @DisplayName("is sent as a form field on a file upload")
        void multipartFormField() throws Exception {
            enqueue(200, SEND_OK);

            client.turboSign().sendSignature(new SendSignatureRequest.Builder()
                    .file("%PDF-1.4".getBytes())
                    .recipients(recipients).fields(anchoredFields)
                    .applySignatureSetup(true).build());

            RecordedRequest recorded = server.takeRequest();
            assertTrue(recorded.getHeader("Content-Type").contains("multipart/form-data"));
            String body = recorded.getBody().readUtf8();
            assertTrue(body.matches("(?s).*name=\"applySignatureSetup\"\r\n(Content-Length: 4\r\n)?\r\ntrue\r\n.*"),
                    "multipart body should carry applySignatureSetup=true");
        }
    }

    @Test
    @DisplayName("getTemplateSignatureSetup returns each role's anchoredFieldCount and the template's anchors")
    void setupCarriesAnchors() throws Exception {
        enqueue(200, "{\"data\":{\"templateId\":\"" + TEMPLATE_ID + "\",\"roles\":[{\"key\":\"signer_1\","
                + "\"label\":\"Signer 1\",\"order\":1,\"hasSavedSigner\":false,\"fieldCount\":2,\"anchoredFieldCount\":1}],"
                + "\"anchors\":[{\"fieldId\":\"f1\",\"roleKey\":\"signer_1\",\"type\":\"signature\",\"anchor\":\"{ClientSign}\","
                + "\"placement\":\"replace\",\"offset\":{\"x\":0,\"y\":5},\"size\":{\"width\":120,\"height\":30},\"notFound\":false},"
                + "{\"roleKey\":\"signer_1\",\"type\":\"date\",\"anchor\":\"{SignDate}\",\"placement\":\"after\",\"notFound\":true}]}}");

        TemplateSignatureSetup setup = client.turboSign().getTemplateSignatureSetup(TEMPLATE_ID);

        assertEquals(2, setup.getRoles().get(0).getFieldCount());
        assertEquals(1, setup.getRoles().get(0).getAnchoredFieldCount());
        assertEquals(2, setup.getAnchors().size());

        TemplateSignatureAnchor first = setup.getAnchors().get(0);
        assertEquals("f1", first.getFieldId());
        assertEquals("signer_1", first.getRoleKey());
        assertEquals("signature", first.getType());
        assertEquals("{ClientSign}", first.getAnchor());
        assertEquals("replace", first.getPlacement());
        assertEquals(0, first.getOffset().getX());
        assertEquals(5, first.getOffset().getY());
        assertEquals(120, first.getSize().getWidth());
        assertEquals(30, first.getSize().getHeight());
        assertFalse(first.isNotFound());

        TemplateSignatureAnchor second = setup.getAnchors().get(1);
        assertNull(second.getFieldId());
        assertNull(second.getOffset());
        assertNull(second.getSize());
        assertEquals("after", second.getPlacement());
        assertTrue(second.isNotFound());
    }

    @Nested
    @DisplayName("addTemplateSignatureAnchor")
    class AddAnchor {

        @Test
        @DisplayName("POSTs the anchored field without templateId and returns the unwrapped result")
        void postsAndUnwraps() throws Exception {
            enqueue(200, "{\"data\":{\"results\":{\"fieldId\":\"f1\",\"signatureSetup\":" + SAVED_SETUP
                    + ",\"tagBecameSignatureField\":true}}}");

            AddTemplateSignatureAnchorResponse result = client.turboSign().addTemplateSignatureAnchor(
                    new AddTemplateSignatureAnchorRequest.Builder()
                            .templateId(TEMPLATE_ID)
                            .roleKey("signer_1")
                            .type("signature")
                            .anchor("{ClientSign}")
                            .size(new Field.Size(120, 30))
                            .offset(new Field.Offset(0, 5))
                            .placement("replace")
                            .build());

            RecordedRequest recorded = server.takeRequest();
            assertEquals("POST", recorded.getMethod());
            assertEquals("/turbosign/templates/" + TEMPLATE_ID + "/signature-setup/anchors", recorded.getPath());
            JsonObject expected = JsonParser.parseString("{\"roleKey\":\"signer_1\",\"type\":\"signature\","
                    + "\"anchor\":\"{ClientSign}\",\"size\":{\"width\":120,\"height\":30},\"offset\":{\"x\":0,\"y\":5},"
                    + "\"placement\":\"replace\"}").getAsJsonObject();
            assertEquals(expected, bodyOf(recorded));

            assertEquals("f1", result.getFieldId());
            assertTrue(result.isTagBecameSignatureField());
            List<?> fields = (List<?>) result.getSignatureSetup().get("fields");
            assertEquals("{ClientSign}", ((Map<?, ?>) fields.get(0)).get("anchor"));
            assertEquals("2026-11-06T00:00:00.000Z", result.getSignatureSetup().get("savedOn"));
        }

        @Test
        @DisplayName("sends defaultValue and isReadonly when set, and path-encodes the template id")
        void optionalKeysAndEncoding() throws Exception {
            enqueue(200, "{\"data\":{\"results\":{\"fieldId\":\"f2\",\"signatureSetup\":" + SAVED_SETUP
                    + ",\"tagBecameSignatureField\":false}}}");

            client.turboSign().addTemplateSignatureAnchor(new AddTemplateSignatureAnchorRequest.Builder()
                    .templateId("a/b").roleKey("signer_1").type("text").anchor("{Title}")
                    .defaultValue("CEO").isReadonly(true).build());

            RecordedRequest recorded = server.takeRequest();
            assertEquals("/turbosign/templates/a%2Fb/signature-setup/anchors", recorded.getPath());
            JsonObject expected = JsonParser.parseString("{\"roleKey\":\"signer_1\",\"type\":\"text\","
                    + "\"anchor\":\"{Title}\",\"defaultValue\":\"CEO\",\"isReadonly\":true}").getAsJsonObject();
            assertEquals(expected, bodyOf(recorded));
        }

        @Test
        @DisplayName("surfaces a tag owned by another role as ConflictException with its code")
        void conflict() {
            enqueue(409, "{\"message\":\"The tag {ClientSign} already belongs to another signer.\","
                    + "\"type\":\"AnchorOwnedByOtherRole\",\"error\":\"x\",\"code\":\"AnchorOwnedByOtherRole\"}");

            TurboDocxException.ConflictException err = assertThrows(TurboDocxException.ConflictException.class,
                    () -> client.turboSign().addTemplateSignatureAnchor(new AddTemplateSignatureAnchorRequest.Builder()
                            .templateId(TEMPLATE_ID).roleKey("signer_2").type("signature").anchor("{ClientSign}")
                            .build()));

            assertEquals("AnchorOwnedByOtherRole", err.getCode());
            assertEquals(409, err.getStatusCode());
        }

        @Test
        @DisplayName("surfaces a locked template (423) with its code")
        void locked() {
            enqueue(423, "{\"message\":\"Template is locked\",\"code\":\"TemplateLocked\"}");

            TurboDocxException err = assertThrows(TurboDocxException.class,
                    () -> client.turboSign().addTemplateSignatureAnchor(new AddTemplateSignatureAnchorRequest.Builder()
                            .templateId(TEMPLATE_ID).roleKey("signer_1").type("signature").anchor("{ClientSign}")
                            .build()));

            assertEquals("TemplateLocked", err.getCode());
            assertEquals(423, err.getStatusCode());
        }
    }

    @Nested
    @DisplayName("removeTemplateSignatureAnchor")
    class RemoveAnchor {

        @Test
        @DisplayName("DELETEs the field by encoded id and returns the remaining setup")
        void deletes() throws Exception {
            enqueue(200, "{\"data\":{\"results\":{\"signatureSetup\":{\"roles\":[],\"fields\":[]}}}}");

            RemoveTemplateSignatureAnchorResponse result =
                    client.turboSign().removeTemplateSignatureAnchor(TEMPLATE_ID, "f/1");

            RecordedRequest recorded = server.takeRequest();
            assertEquals("DELETE", recorded.getMethod());
            assertEquals("/turbosign/templates/" + TEMPLATE_ID + "/signature-setup/anchors/f%2F1", recorded.getPath());
            assertEquals(Collections.emptyList(), result.getSignatureSetup().get("fields"));
        }

        @Test
        @DisplayName("surfaces an unknown field id as NotFoundException")
        void notFound() {
            enqueue(404, "{\"message\":\"No anchored field with this id in the signature setup\","
                    + "\"code\":\"SetupFieldNotFound\"}");

            TurboDocxException.NotFoundException err = assertThrows(TurboDocxException.NotFoundException.class,
                    () -> client.turboSign().removeTemplateSignatureAnchor(TEMPLATE_ID, "nope"));

            assertEquals("SetupFieldNotFound", err.getCode());
        }
    }
}
