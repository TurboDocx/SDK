package com.turbodocx;

import com.google.gson.Gson;
import com.turbodocx.models.*;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.*;

import java.io.IOException;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TurboSign Module Tests
 *
 * Tests for 100% parity with n8n-nodes-turbodocx operations:
 * - prepareForReview
 * - prepareForSigningSingle
 * - getStatus
 * - download
 * - voidDocument
 * - resendEmail
 */
class TurboSignTest {

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
                .build();
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    // ============================================
    // Configure Tests (4)
    // ============================================

    @Test
    @DisplayName("should configure the client with API key and orgId")
    void configureWithApiKeyAndOrgId() {
        TurboDocxClient testClient = new TurboDocxClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                .build();
        assertNotNull(testClient);
        assertNotNull(testClient.turboSign());
    }

    @Test
    @DisplayName("should configure with custom base URL")
    void configureWithCustomBaseUrl() {
        TurboDocxClient testClient = new TurboDocxClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                .baseUrl("https://custom-api.example.com")
                .build();
        assertNotNull(testClient);
    }

    @Test
    @DisplayName("should throw error when orgId is not configured")
    void errorWhenNoOrgId() {
        assertThrows(TurboDocxException.AuthenticationException.class, () -> {
            new TurboDocxClient.Builder()
                    .apiKey("test-api-key")
                    .build();
        });
    }

    // ============================================
    // PrepareForReview Tests (5)
    // ============================================

    @Test
    @DisplayName("should prepare document for review with file upload")
    void prepareForReviewWithFileUpload() throws Exception {
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("documentId", "doc-123");
        responseData.put("status", "review_ready");
        responseData.put("previewUrl", "https://preview.example.com/doc-123");
        responseData.put("message", "Document prepared for review");

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(responseData)));

        PrepareForReviewRequest request = new PrepareForReviewRequest.Builder()
                .file(new byte[]{0x25, 0x50, 0x44, 0x46}) // %PDF
                .fileName("contract.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build();

        PrepareForReviewResponse result = client.turboSign().prepareForReview(request);

        assertEquals("doc-123", result.getDocumentId());
        assertEquals("review_ready", result.getStatus());
        assertNotNull(result.getPreviewUrl());
        assertTrue(result.isSuccess());

        RecordedRequest recorded = server.takeRequest();
        assertTrue(recorded.getHeader("Content-Type").contains("multipart/form-data"));
    }

    @Test
    @DisplayName("should prepare document for review with file URL")
    void prepareForReviewWithFileUrl() throws Exception {
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("documentId", "doc-456");
        responseData.put("status", "review_ready");
        responseData.put("previewUrl", "https://preview.example.com/doc-456");

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(responseData)));

        PrepareForReviewRequest request = new PrepareForReviewRequest.Builder()
                .fileLink("https://storage.example.com/contract.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build();

        PrepareForReviewResponse result = client.turboSign().prepareForReview(request);

        assertEquals("doc-456", result.getDocumentId());

        RecordedRequest recorded = server.takeRequest();
        assertEquals("POST", recorded.getMethod());
        assertEquals("/turbosign/single/prepare-for-review", recorded.getPath());
    }

    @Test
    @DisplayName("should prepare document for review with deliverable ID")
    void prepareForReviewWithDeliverableId() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-789",
                        "status", "review_ready"
                ))));

        PrepareForReviewRequest request = new PrepareForReviewRequest.Builder()
                .deliverableId("deliverable-abc")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build();

        PrepareForReviewResponse result = client.turboSign().prepareForReview(request);

        assertEquals("doc-789", result.getDocumentId());
    }

    @Test
    @DisplayName("should prepare document for review with template ID")
    void prepareForReviewWithTemplateId() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-template",
                        "status", "review_ready"
                ))));

        PrepareForReviewRequest request = new PrepareForReviewRequest.Builder()
                .templateId("template-xyz")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build();

        PrepareForReviewResponse result = client.turboSign().prepareForReview(request);

        assertEquals("doc-template", result.getDocumentId());
    }

    @Test
    @DisplayName("should include optional fields in request")
    void prepareForReviewWithOptionalFields() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-optional",
                        "status", "review_ready"
                ))));

        PrepareForReviewRequest request = new PrepareForReviewRequest.Builder()
                .fileLink("https://example.com/doc.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .documentName("Test Contract")
                .documentDescription("A test contract")
                .senderName("Sales Team")
                .senderEmail("sales@company.com")
                .ccEmails(Arrays.asList("admin@company.com", "legal@company.com"))
                .build();

        PrepareForReviewResponse result = client.turboSign().prepareForReview(request);

        assertEquals("doc-optional", result.getDocumentId());
    }

    // ============================================
    // PrepareForSigningSingle Tests (2)
    // ============================================

    @Test
    @DisplayName("should prepare document for signing and send emails")
    void prepareForSigningSingleWithUrl() throws Exception {
        Map<String, Object> recipient = new HashMap<>();
        recipient.put("id", "rec-1");
        recipient.put("name", "John Doe");
        recipient.put("email", "john@example.com");
        recipient.put("status", "pending");
        recipient.put("signUrl", "https://sign.example.com/rec-1");

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("documentId", "doc-123");
        responseData.put("status", "sent");
        responseData.put("message", "Document sent for signing");
        responseData.put("recipients", Collections.singletonList(recipient));

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(responseData)));

        PrepareForSigningRequest request = new PrepareForSigningRequest.Builder()
                .fileLink("https://storage.example.com/contract.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build();

        PrepareForSigningResponse result = client.turboSign().prepareForSigningSingle(request);

        assertEquals("doc-123", result.getDocumentId());
        assertEquals("sent", result.getStatus());
        assertNotNull(result.getRecipients());
        assertEquals(1, result.getRecipients().size());
        assertNotNull(result.getRecipients().get(0).getSignUrl());

        RecordedRequest recorded = server.takeRequest();
        assertEquals("/turbosign/single/prepare-for-signing", recorded.getPath());
    }

    @Test
    @DisplayName("should handle file upload for signing")
    void prepareForSigningSingleWithFileUpload() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-upload",
                        "status", "sent",
                        "recipients", Collections.emptyList()
                ))));

        PrepareForSigningRequest request = new PrepareForSigningRequest.Builder()
                .file(new byte[]{0x25, 0x50, 0x44, 0x46})
                .fileName("contract.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build();

        PrepareForSigningResponse result = client.turboSign().prepareForSigningSingle(request);

        assertEquals("doc-upload", result.getDocumentId());

        RecordedRequest recorded = server.takeRequest();
        assertTrue(recorded.getHeader("Content-Type").contains("multipart/form-data"));
    }

    // ============================================
    // GetStatus Test (1)
    // ============================================

    @Test
    @DisplayName("should get document status")
    void getStatus() throws Exception {
        Map<String, Object> recipient = new HashMap<>();
        recipient.put("id", "rec-1");
        recipient.put("name", "John Doe");
        recipient.put("email", "john@example.com");
        recipient.put("status", "pending");

        Map<String, Object> responseData = new HashMap<>();
        responseData.put("documentId", "doc-123");
        responseData.put("status", "pending");
        responseData.put("name", "Test Document");
        responseData.put("recipients", Collections.singletonList(recipient));
        responseData.put("createdAt", "2024-01-01T00:00:00Z");
        responseData.put("updatedAt", "2024-01-01T00:00:00Z");

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(responseData)));

        DocumentStatusResponse result = client.turboSign().getStatus("doc-123");

        assertEquals("doc-123", result.getDocumentId());
        assertEquals("pending", result.getStatus());
        assertEquals("Test Document", result.getName());

        RecordedRequest recorded = server.takeRequest();
        assertEquals("GET", recorded.getMethod());
        assertEquals("/turbosign/documents/doc-123/status", recorded.getPath());
    }

    // ============================================
    // Void Test (1)
    // ============================================

    @Test
    @DisplayName("should void a document with reason")
    void voidDocument() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "documentId", "doc-123",
                        "status", "voided",
                        "voidedAt", "2024-01-01T12:00:00Z"
                ))));

        VoidDocumentResponse result = client.turboSign().voidDocument("doc-123", "Document needs revision");

        assertEquals("doc-123", result.getDocumentId());
        assertEquals("voided", result.getStatus());

        RecordedRequest recorded = server.takeRequest();
        assertEquals("POST", recorded.getMethod());
        assertEquals("/turbosign/documents/doc-123/void", recorded.getPath());
    }

    // ============================================
    // Resend Test (1)
    // ============================================

    @Test
    @DisplayName("should resend email to specific recipients")
    void resendEmail() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "documentId", "doc-123",
                        "message", "Emails resent successfully",
                        "resentAt", "2024-01-01T12:00:00Z"
                ))));

        ResendEmailResponse result = client.turboSign().resendEmail("doc-123", Arrays.asList("rec-1", "rec-2"));

        assertTrue(result.getMessage().contains("resent"));

        RecordedRequest recorded = server.takeRequest();
        assertEquals("POST", recorded.getMethod());
        assertEquals("/turbosign/documents/doc-123/resend-email", recorded.getPath());
    }

    // ============================================
    // GetAuditTrail Test (1)
    // ============================================

    @Test
    @DisplayName("should get audit trail for document")
    void getAuditTrail() throws Exception {
        Map<String, Object> entry1 = new HashMap<>();
        entry1.put("event", "document_created");
        entry1.put("actor", "sender@example.com");
        entry1.put("timestamp", "2024-01-01T00:00:00Z");

        Map<String, Object> entry2 = new HashMap<>();
        entry2.put("event", "document_signed");
        entry2.put("actor", "john@example.com");
        entry2.put("timestamp", "2024-01-01T12:00:00Z");

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "documentId", "doc-123",
                        "entries", Arrays.asList(entry1, entry2)
                ))));

        AuditTrailResponse result = client.turboSign().getAuditTrail("doc-123");

        assertEquals("doc-123", result.getDocumentId());
        assertEquals(2, result.getEntries().size());

        RecordedRequest recorded = server.takeRequest();
        assertEquals("GET", recorded.getMethod());
        assertEquals("/turbosign/documents/doc-123/audit-trail", recorded.getPath());
    }

    // ============================================
    // Error Handling Tests (5)
    // ============================================

    @Test
    @DisplayName("should throw error when API key is not configured")
    void errorWhenNoApiKey() {
        assertThrows(IllegalArgumentException.class, () -> {
            new TurboDocxClient.Builder().orgId("test-org").build();
        });
    }

    @Test
    @DisplayName("should throw NotFoundException for 404 errors")
    void handleNotFoundError() {
        server.enqueue(new MockResponse()
                .setResponseCode(404)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "message", "Document not found",
                        "code", "DOCUMENT_NOT_FOUND"
                ))));

        TurboDocxException.NotFoundException exception = assertThrows(TurboDocxException.NotFoundException.class, () -> {
            client.turboSign().getStatus("invalid-doc");
        });

        assertEquals(404, exception.getStatusCode());
        assertEquals("Document not found", exception.getMessage());
        assertEquals("DOCUMENT_NOT_FOUND", exception.getCode());
    }

    @Test
    @DisplayName("should throw ValidationException for 400 errors")
    void handleValidationError() {
        server.enqueue(new MockResponse()
                .setResponseCode(400)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "message", "Validation failed: Invalid email format",
                        "code", "VALIDATION_ERROR"
                ))));

        PrepareForSigningRequest request = new PrepareForSigningRequest.Builder()
                .fileLink("https://example.com/doc.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("Test", "invalid-email", 1)))
                .fields(Collections.emptyList())
                .build();

        TurboDocxException.ValidationException exception = assertThrows(TurboDocxException.ValidationException.class, () -> {
            client.turboSign().prepareForSigningSingle(request);
        });

        assertEquals(400, exception.getStatusCode());
        assertTrue(exception.getMessage().contains("Validation"));
    }

    @Test
    @DisplayName("should throw AuthenticationException for 401 errors")
    void handleAuthenticationError() {
        server.enqueue(new MockResponse()
                .setResponseCode(401)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "message", "Invalid API key",
                        "code", "UNAUTHORIZED"
                ))));

        TurboDocxException.AuthenticationException exception = assertThrows(TurboDocxException.AuthenticationException.class, () -> {
            client.turboSign().getStatus("doc-123");
        });

        assertEquals(401, exception.getStatusCode());
    }

    @Test
    @DisplayName("should throw RateLimitException for 429 errors")
    void handleRateLimitError() {
        server.enqueue(new MockResponse()
                .setResponseCode(429)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "message", "Rate limit exceeded",
                        "code", "RATE_LIMIT_EXCEEDED"
                ))));

        TurboDocxException.RateLimitException exception = assertThrows(TurboDocxException.RateLimitException.class, () -> {
            client.turboSign().getStatus("doc-123");
        });

        assertEquals(429, exception.getStatusCode());
    }
}
