package com.turbodocx;

import com.google.gson.Gson;
import com.google.gson.JsonParser;
import com.turbodocx.models.*;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TurboSign Sender Configuration Tests
 *
 * Tests to ensure sender_email/sender_name from configuration are properly used
 * in signature requests, with per-request override capability
 */
class TurboSignSenderConfigTest {

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
                .senderEmail("configured@company.com")
                .senderName("Configured Support")
                .baseUrl(server.url("/").toString())
                .build();
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    /**
     * Helper method to extract form data from multipart or JSON request
     */
    private Map<String, String> extractFormData(RecordedRequest request) throws Exception {
        Map<String, String> formData = new HashMap<>();
        String contentType = request.getHeader("Content-Type");

        if (contentType != null && contentType.contains("multipart/form-data")) {
            // Parse multipart form data
            String body = request.getBody().readString(StandardCharsets.UTF_8);
            String[] parts = body.split("--");

            for (String part : parts) {
                if (part.contains("Content-Disposition: form-data; name=\"")) {
                    int nameStart = part.indexOf("name=\"") + 6;
                    int nameEnd = part.indexOf("\"", nameStart);
                    if (nameEnd > nameStart) {
                        String name = part.substring(nameStart, nameEnd);

                        // Find the value after the headers
                        int valueStart = part.indexOf("\r\n\r\n");
                        if (valueStart > 0) {
                            valueStart += 4; // Skip \r\n\r\n
                            int valueEnd = part.lastIndexOf("\r\n");
                            if (valueEnd > valueStart) {
                                String value = part.substring(valueStart, valueEnd);
                                formData.put(name, value);
                            }
                        }
                    }
                }
            }
        } else if (contentType != null && contentType.contains("application/json")) {
            // Parse JSON body
            String body = request.getBody().readString(StandardCharsets.UTF_8);
            var jsonObject = JsonParser.parseString(body).getAsJsonObject();
            for (String key : jsonObject.keySet()) {
                formData.put(key, jsonObject.get(key).getAsString());
            }
        }

        return formData;
    }

    // ============================================
    // CreateSignatureReviewLink with Configured Sender
    // ============================================

    @Test
    @DisplayName("should use configured senderEmail when not provided in request")
    void shouldUseConfiguredSenderEmailWhenNotProvided() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-123",
                        "status", "review_ready",
                        "message", "Document prepared"
                ))));

        CreateSignatureReviewLinkRequest request = new CreateSignatureReviewLinkRequest.Builder()
                .fileLink("https://example.com/doc.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                // senderEmail and senderName NOT provided
                .build();

        client.turboSign().createSignatureReviewLink(request);

        RecordedRequest recorded = server.takeRequest();
        Map<String, String> formData = extractFormData(recorded);

        assertEquals("configured@company.com", formData.get("senderEmail"));
        assertEquals("Configured Support", formData.get("senderName"));
    }

    @Test
    @DisplayName("should use configured senderEmail only when senderName not configured")
    void shouldUseConfiguredSenderEmailOnlyWhenSenderNameNotConfigured() throws Exception {
        server.shutdown();
        server = new MockWebServer();
        server.start();

        // Create client WITHOUT senderName
        TurboDocxClient clientWithoutName = new TurboDocxClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                .senderEmail("configured@company.com")
                // senderName NOT configured
                .baseUrl(server.url("/").toString())
                .build();

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-123",
                        "status", "review_ready"
                ))));

        CreateSignatureReviewLinkRequest request = new CreateSignatureReviewLinkRequest.Builder()
                .fileLink("https://example.com/doc.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build();

        clientWithoutName.turboSign().createSignatureReviewLink(request);

        RecordedRequest recorded = server.takeRequest();
        Map<String, String> formData = extractFormData(recorded);

        assertEquals("configured@company.com", formData.get("senderEmail"));
        assertNull(formData.get("senderName"), "senderName should not be in form data when not configured");
    }

    @Test
    @DisplayName("should override configured sender with request-level sender")
    void shouldOverrideConfiguredSenderWithRequestLevelSender() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-123",
                        "status", "review_ready"
                ))));

        CreateSignatureReviewLinkRequest request = new CreateSignatureReviewLinkRequest.Builder()
                .fileLink("https://example.com/doc.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .senderEmail("override@company.com")
                .senderName("Override Support")
                .build();

        client.turboSign().createSignatureReviewLink(request);

        RecordedRequest recorded = server.takeRequest();
        Map<String, String> formData = extractFormData(recorded);

        assertEquals("override@company.com", formData.get("senderEmail"));
        assertEquals("Override Support", formData.get("senderName"));
    }

    @Test
    @DisplayName("should partially override - use request senderEmail but configured senderName")
    void shouldPartiallyOverrideUseRequestSenderEmailButConfiguredSenderName() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-123",
                        "status", "review_ready"
                ))));

        CreateSignatureReviewLinkRequest request = new CreateSignatureReviewLinkRequest.Builder()
                .fileLink("https://example.com/doc.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .senderEmail("override@company.com")
                // senderName NOT provided - should use configured value
                .build();

        client.turboSign().createSignatureReviewLink(request);

        RecordedRequest recorded = server.takeRequest();
        Map<String, String> formData = extractFormData(recorded);

        assertEquals("override@company.com", formData.get("senderEmail"));
        assertEquals("Configured Support", formData.get("senderName"));
    }

    // ============================================
    // SendSignature with Configured Sender
    // ============================================

    @Test
    @DisplayName("should use configured senderEmail and senderName in sendSignature")
    void shouldUseConfiguredSenderEmailAndSenderNameInSendSignature() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-123",
                        "message", "Document sent for signing",
                        "recipients", Collections.emptyList()
                ))));

        SendSignatureRequest request = new SendSignatureRequest.Builder()
                .fileLink("https://example.com/doc.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build();

        client.turboSign().sendSignature(request);

        RecordedRequest recorded = server.takeRequest();
        Map<String, String> formData = extractFormData(recorded);

        assertEquals("configured@company.com", formData.get("senderEmail"));
        assertEquals("Configured Support", formData.get("senderName"));
    }

    @Test
    @DisplayName("should allow request-level override in sendSignature")
    void shouldAllowRequestLevelOverrideInSendSignature() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-123",
                        "message", "Document sent for signing",
                        "recipients", Collections.emptyList()
                ))));

        SendSignatureRequest request = new SendSignatureRequest.Builder()
                .fileLink("https://example.com/doc.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .senderEmail("sales@company.com")
                .senderName("Sales Team")
                .build();

        client.turboSign().sendSignature(request);

        RecordedRequest recorded = server.takeRequest();
        Map<String, String> formData = extractFormData(recorded);

        assertEquals("sales@company.com", formData.get("senderEmail"));
        assertEquals("Sales Team", formData.get("senderName"));
    }

    // ============================================
    // File Upload with Configured Sender
    // ============================================

    @Test
    @DisplayName("should use configured sender in file upload requests")
    void shouldUseConfiguredSenderInFileUploadRequests() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-upload",
                        "status", "review_ready",
                        "message", "Document prepared"
                ))));

        byte[] mockFile = new byte[]{0x25, 0x50, 0x44, 0x46}; // %PDF

        CreateSignatureReviewLinkRequest request = new CreateSignatureReviewLinkRequest.Builder()
                .file(mockFile)
                .fileName("document.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build();

        client.turboSign().createSignatureReviewLink(request);

        RecordedRequest recorded = server.takeRequest();
        Map<String, String> formData = extractFormData(recorded);

        assertEquals("configured@company.com", formData.get("senderEmail"));
        assertEquals("Configured Support", formData.get("senderName"));
    }

    @Test
    @DisplayName("should override configured sender in file upload requests")
    void shouldOverrideConfiguredSenderInFileUploadRequests() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-upload",
                        "status", "review_ready",
                        "message", "Document prepared"
                ))));

        byte[] mockFile = new byte[]{0x25, 0x50, 0x44, 0x46}; // %PDF

        CreateSignatureReviewLinkRequest request = new CreateSignatureReviewLinkRequest.Builder()
                .file(mockFile)
                .fileName("document.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .senderEmail("specific@company.com")
                .senderName("Specific Team")
                .build();

        client.turboSign().createSignatureReviewLink(request);

        RecordedRequest recorded = server.takeRequest();
        Map<String, String> formData = extractFormData(recorded);

        assertEquals("specific@company.com", formData.get("senderEmail"));
        assertEquals("Specific Team", formData.get("senderName"));
    }
}
