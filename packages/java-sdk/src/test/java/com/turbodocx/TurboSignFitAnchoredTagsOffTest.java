package com.turbodocx;

import com.turbodocx.models.*;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

/**
 * With {@code fitAnchoredTags} left false, every request is exactly what it was before the option
 * existed: the same method, path and body on both send paths (multipart, and JSON compared byte for
 * byte) and on createEmbeddedSignature, whose fields shorthand keeps its default size. These
 * expectations pass unchanged against the code from before the option was added.
 */
class TurboSignFitAnchoredTagsOffTest {

    private static final String SENT = "{\"data\":{\"success\":true,\"documentId\":\"doc-1\","
            + "\"status\":\"under_review\",\"message\":\"ok\","
            + "\"recipients\":[{\"id\":\"rec-1\",\"name\":\"Jane Doe\",\"email\":\"jane@example.com\"}]}}";
    private static final String SIGNING_URL = "{\"data\":{\"results\":{\"url\":\"https://app/sign/doc-1?token=T\","
            + "\"expiresAt\":null,\"recipientId\":\"rec-1\",\"identityVerificationMode\":null,\"pendingChecks\":[]}}}";
    private static final Pattern PART = Pattern.compile(
            "name=\"([^\"]+)\"(?:; filename=\"([^\"]*)\")?.*?\\r\\n\\r\\n(.*?)\\r\\n--", Pattern.DOTALL);

    private static final List<Recipient> RECIPIENTS =
            Collections.singletonList(new Recipient("Jane Doe", "jane@example.com", 1));
    private static final List<Field> FIELDS = Collections.singletonList(new Field.Builder()
            .type("signature")
            .recipientEmail("jane@example.com")
            .template(new Field.TemplateAnchor.Builder().anchor("{ClientSign}").build())
            .build());
    // Every other option, so all the keys around the flag are pinned too.
    private static final SignatureSchedule SCHEDULE = SignatureSchedule.builder()
            .remindersEnabled(true)
            .reminderDelay(new SignatureSchedule.Duration(2, "days"))
            .build();
    private static final byte[] PDF = "%PDF-1.4 fake pdf bytes".getBytes(StandardCharsets.UTF_8);

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

    /** The multipart parts in order, as name=value (the file part by its file name). */
    private static List<String> partsOf(String body) {
        List<String> parts = new ArrayList<>();
        Matcher matcher = PART.matcher(body);
        while (matcher.find()) {
            String name = matcher.group(1);
            parts.add(name + "=" + (name.equals("file") ? matcher.group(2) : matcher.group(3)));
        }
        return parts;
    }

    private RecordedRequest send(boolean review, byte[] file, String fileLink) throws Exception {
        enqueue(SENT);
        if (review) {
            client.turboSign().createSignatureReviewLink(new CreateSignatureReviewLinkRequest.Builder()
                    .file(file).fileLink(fileLink).recipients(RECIPIENTS).fields(FIELDS)
                    .documentName("Contract").documentDescription("Please sign").senderName("Acme")
                    .ccEmails(Collections.singletonList("cc@example.com")).schedule(SCHEDULE)
                    .build());
        } else {
            client.turboSign().sendSignature(new SendSignatureRequest.Builder()
                    .file(file).fileLink(fileLink).recipients(RECIPIENTS).fields(FIELDS)
                    .documentName("Contract").documentDescription("Please sign").senderName("Acme")
                    .ccEmails(Collections.singletonList("cc@example.com")).schedule(SCHEDULE)
                    .sendEmail(false)
                    .build());
        }
        RecordedRequest recorded = server.takeRequest();
        assertEquals("POST", recorded.getMethod());
        assertEquals(review ? "/turbosign/single/prepare-for-review" : "/turbosign/single/prepare-for-signing",
                recorded.getPath());
        return recorded;
    }

    @Test
    @DisplayName("sendSignature sends the same multipart form")
    void sendSignatureMultipart() throws Exception {
        assertEquals(EXPECTED_SEND_PARTS, partsOf(send(false, PDF, null).getBody().readUtf8()));
    }

    @Test
    @DisplayName("sendSignature sends the same JSON body")
    void sendSignatureJson() throws Exception {
        assertEquals(EXPECTED_SEND_JSON, send(false, null, "https://example.com/c.pdf").getBody().readUtf8());
    }

    @Test
    @DisplayName("createSignatureReviewLink sends the same multipart form")
    void reviewLinkMultipart() throws Exception {
        assertEquals(EXPECTED_REVIEW_PARTS, partsOf(send(true, PDF, null).getBody().readUtf8()));
    }

    @Test
    @DisplayName("createSignatureReviewLink sends the same JSON body")
    void reviewLinkJson() throws Exception {
        assertEquals(EXPECTED_REVIEW_JSON, send(true, null, "https://example.com/c.pdf").getBody().readUtf8());
    }

    @Test
    @DisplayName("createEmbeddedSignature sends the same body, with the shorthand's default size")
    void embeddedShorthand() throws Exception {
        enqueue(SENT);
        enqueue(SIGNING_URL);
        client.turboSign().createEmbeddedSignature(new CreateEmbeddedSignatureRequest.Builder()
                .fileLink("https://example.com/c.pdf")
                .recipients(Collections.singletonList(new EmbeddedSignatureRecipient.Builder()
                        .name("Jane Doe")
                        .email("jane@example.com")
                        .fields(new EmbeddedRecipientFields.Builder().signature("{ClientSign}").date("{Date}").build())
                        .build()))
                .build());
        RecordedRequest recorded = server.takeRequest();
        assertEquals("/turbosign/single/prepare-for-signing", recorded.getPath());
        assertEquals(EXPECTED_EMBEDDED_JSON, recorded.getBody().readUtf8());
    }

    // Captured from the code before the option existed. The order follows the HashMap the SDK
    // builds; the review link has never sent sendEmail.
    private static final List<String> EXPECTED_SEND_PARTS = List.of(
            "file=document.pdf",
            "senderName=Acme",
            "sendEmail=false",
            "documentDescription=Please sign",
            "recipients=[{\"name\":\"Jane Doe\",\"email\":\"jane@example.com\",\"signingOrder\":1}]",
            "reminderDelay={\"value\":2,\"unit\":\"days\"}",
            "senderEmail=sender@company.com",
            "documentName=Contract",
            "fields=[{\"type\":\"signature\",\"recipientEmail\":\"jane@example.com\",\"template\":{\"anchor\":\"{ClientSign}\"}}]",
            "ccEmails=[\"cc@example.com\"]",
            "remindersEnabled=true");
    private static final String EXPECTED_SEND_JSON =
            "{\"senderName\":\"Acme\""
            + ",\"sendEmail\":\"false\""
            + ",\"fileLink\":\"https://example.com/c.pdf\""
            + ",\"documentDescription\":\"Please sign\""
            + ",\"recipients\":\"[{\\\"name\\\":\\\"Jane Doe\\\",\\\"email\\\":\\\"jane@example.com\\\",\\\"signingOrder\\\":1}]\""
            + ",\"reminderDelay\":\"{\\\"value\\\":2,\\\"unit\\\":\\\"days\\\"}\""
            + ",\"senderEmail\":\"sender@company.com\""
            + ",\"documentName\":\"Contract\""
            + ",\"fields\":\"[{\\\"type\\\":\\\"signature\\\",\\\"recipientEmail\\\":\\\"jane@example.com\\\",\\\"template\\\":{\\\"anchor\\\":\\\"{ClientSign}\\\"}}]\""
            + ",\"ccEmails\":\"[\\\"cc@example.com\\\"]\""
            + ",\"remindersEnabled\":\"true\"}";
    private static final List<String> EXPECTED_REVIEW_PARTS = List.of(
            "file=document.pdf",
            "senderName=Acme",
            "documentDescription=Please sign",
            "recipients=[{\"name\":\"Jane Doe\",\"email\":\"jane@example.com\",\"signingOrder\":1}]",
            "reminderDelay={\"value\":2,\"unit\":\"days\"}",
            "senderEmail=sender@company.com",
            "documentName=Contract",
            "fields=[{\"type\":\"signature\",\"recipientEmail\":\"jane@example.com\",\"template\":{\"anchor\":\"{ClientSign}\"}}]",
            "ccEmails=[\"cc@example.com\"]",
            "remindersEnabled=true");
    private static final String EXPECTED_REVIEW_JSON =
            "{\"senderName\":\"Acme\""
            + ",\"fileLink\":\"https://example.com/c.pdf\""
            + ",\"documentDescription\":\"Please sign\""
            + ",\"recipients\":\"[{\\\"name\\\":\\\"Jane Doe\\\",\\\"email\\\":\\\"jane@example.com\\\",\\\"signingOrder\\\":1}]\""
            + ",\"reminderDelay\":\"{\\\"value\\\":2,\\\"unit\\\":\\\"days\\\"}\""
            + ",\"senderEmail\":\"sender@company.com\""
            + ",\"documentName\":\"Contract\""
            + ",\"fields\":\"[{\\\"type\\\":\\\"signature\\\",\\\"recipientEmail\\\":\\\"jane@example.com\\\",\\\"template\\\":{\\\"anchor\\\":\\\"{ClientSign}\\\"}}]\""
            + ",\"ccEmails\":\"[\\\"cc@example.com\\\"]\""
            + ",\"remindersEnabled\":\"true\"}";
    private static final String EXPECTED_EMBEDDED_JSON =
            "{\"sendEmail\":\"false\""
            + ",\"fileLink\":\"https://example.com/c.pdf\""
            + ",\"recipients\":\"[{\\\"name\\\":\\\"Jane Doe\\\",\\\"email\\\":\\\"jane@example.com\\\",\\\"signingOrder\\\":1}]\""
            + ",\"senderEmail\":\"sender@company.com\""
            + ",\"fields\":\"[{\\\"type\\\":\\\"signature\\\",\\\"recipientEmail\\\":\\\"jane@example.com\\\",\\\"template\\\":{\\\"anchor\\\":\\\"{ClientSign}\\\",\\\"placement\\\":\\\"replace\\\",\\\"size\\\":{\\\"width\\\":100,\\\"height\\\":30}}},{\\\"type\\\":\\\"date\\\",\\\"recipientEmail\\\":\\\"jane@example.com\\\",\\\"template\\\":{\\\"anchor\\\":\\\"{Date}\\\",\\\"placement\\\":\\\"replace\\\",\\\"size\\\":{\\\"width\\\":75,\\\"height\\\":30}}}]\"}";
}
