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
 * - createSignatureReviewLink
 * - sendSignature
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
                .senderEmail("test@example.com")
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
                .senderEmail("test@example.com")
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
                .senderEmail("test@example.com")
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
    void createSignatureReviewLinkWithFileUpload() throws Exception {
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

        CreateSignatureReviewLinkRequest request = new CreateSignatureReviewLinkRequest.Builder()
                .file(new byte[]{0x25, 0x50, 0x44, 0x46}) // %PDF
                .fileName("contract.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build();

        CreateSignatureReviewLinkResponse result = client.turboSign().createSignatureReviewLink(request);

        assertEquals("doc-123", result.getDocumentId());
        assertEquals("review_ready", result.getStatus());
        assertNotNull(result.getPreviewUrl());
        assertTrue(result.isSuccess());

        RecordedRequest recorded = server.takeRequest();
        assertTrue(recorded.getHeader("Content-Type").contains("multipart/form-data"));
    }

    @Test
    @DisplayName("should prepare document for review with file URL")
    void createSignatureReviewLinkWithFileUrl() throws Exception {
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("documentId", "doc-456");
        responseData.put("status", "review_ready");
        responseData.put("previewUrl", "https://preview.example.com/doc-456");

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(responseData)));

        CreateSignatureReviewLinkRequest request = new CreateSignatureReviewLinkRequest.Builder()
                .fileLink("https://storage.example.com/contract.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build();

        CreateSignatureReviewLinkResponse result = client.turboSign().createSignatureReviewLink(request);

        assertEquals("doc-456", result.getDocumentId());

        RecordedRequest recorded = server.takeRequest();
        assertEquals("POST", recorded.getMethod());
        assertEquals("/turbosign/single/prepare-for-review", recorded.getPath());
    }

    @Test
    @DisplayName("should prepare document for review with deliverable ID")
    void createSignatureReviewLinkWithDeliverableId() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-789",
                        "status", "review_ready"
                ))));

        CreateSignatureReviewLinkRequest request = new CreateSignatureReviewLinkRequest.Builder()
                .deliverableId("deliverable-abc")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build();

        CreateSignatureReviewLinkResponse result = client.turboSign().createSignatureReviewLink(request);

        assertEquals("doc-789", result.getDocumentId());
    }

    @Test
    @DisplayName("should prepare document for review with template ID")
    void createSignatureReviewLinkWithTemplateId() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-template",
                        "status", "review_ready"
                ))));

        CreateSignatureReviewLinkRequest request = new CreateSignatureReviewLinkRequest.Builder()
                .templateId("template-xyz")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build();

        CreateSignatureReviewLinkResponse result = client.turboSign().createSignatureReviewLink(request);

        assertEquals("doc-template", result.getDocumentId());
    }

    @Test
    @DisplayName("should include optional fields in request")
    void createSignatureReviewLinkWithOptionalFields() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-optional",
                        "status", "review_ready"
                ))));

        CreateSignatureReviewLinkRequest request = new CreateSignatureReviewLinkRequest.Builder()
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

        CreateSignatureReviewLinkResponse result = client.turboSign().createSignatureReviewLink(request);

        assertEquals("doc-optional", result.getDocumentId());
    }

    // ============================================
    // PrepareForSigningSingle Tests (2)
    // ============================================

    @Test
    @DisplayName("should prepare document for signing and send emails")
    void sendSignatureWithUrl() throws Exception {
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

        SendSignatureRequest request = new SendSignatureRequest.Builder()
                .fileLink("https://storage.example.com/contract.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build();

        SendSignatureResponse result = client.turboSign().sendSignature(request);

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
    void sendSignatureWithFileUpload() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "documentId", "doc-upload",
                        "status", "sent",
                        "recipients", Collections.emptyList()
                ))));

        SendSignatureRequest request = new SendSignatureRequest.Builder()
                .file(new byte[]{0x25, 0x50, 0x44, 0x46})
                .fileName("contract.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("John Doe", "john@example.com", 1)))
                .fields(Collections.singletonList(
                        new Field("signature", 1, 100, 500, 200, 50, "john@example.com")))
                .build();

        SendSignatureResponse result = client.turboSign().sendSignature(request);

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
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("status", "pending");

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(responseData)));

        DocumentStatusResponse result = client.turboSign().getStatus("doc-123");

        assertEquals("pending", result.getStatus());

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
                        "id", "doc-123",
                        "name", "Test Document",
                        "status", "voided",
                        "voidReason", "Document needs revision",
                        "voidedAt", "2026-01-26T12:00:00.000Z"
                ))));

        VoidDocumentResponse result = client.turboSign().voidDocument("doc-123", "Document needs revision");

        assertEquals("doc-123", result.getId());
        assertEquals("Test Document", result.getName());
        assertEquals("voided", result.getStatus());
        assertEquals("Document needs revision", result.getVoidReason());
        assertEquals("2026-01-26T12:00:00.000Z", result.getVoidedAt());

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
                        "success", true,
                        "recipientCount", 2
                ))));

        ResendEmailResponse result = client.turboSign().resendEmail("doc-123", Arrays.asList("rec-1", "rec-2"));

        assertTrue(result.getSuccess());
        assertEquals(2, result.getRecipientCount());

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
        entry1.put("id", "audit-1");
        entry1.put("documentId", "doc-123");
        entry1.put("actionType", "document_created");
        entry1.put("timestamp", "2024-01-01T00:00:00Z");

        Map<String, Object> entry2 = new HashMap<>();
        entry2.put("id", "audit-2");
        entry2.put("documentId", "doc-123");
        entry2.put("actionType", "document_signed");
        entry2.put("timestamp", "2024-01-01T12:00:00Z");

        Map<String, Object> document = new HashMap<>();
        document.put("id", "doc-123");
        document.put("name", "Test Document");

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "document", document,
                        "auditTrail", Arrays.asList(entry1, entry2)
                ))));

        AuditTrailResponse result = client.turboSign().getAuditTrail("doc-123");

        assertEquals("doc-123", result.getDocument().getId());
        assertEquals("Test Document", result.getDocument().getName());
        assertEquals(2, result.getAuditTrail().size());
        assertEquals("document_created", result.getAuditTrail().get(0).getActionType());

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

        SendSignatureRequest request = new SendSignatureRequest.Builder()
                .fileLink("https://example.com/doc.pdf")
                .recipients(Collections.singletonList(
                        new Recipient("Test", "invalid-email", 1)))
                .fields(Collections.emptyList())
                .build();

        TurboDocxException.ValidationException exception = assertThrows(TurboDocxException.ValidationException.class, () -> {
            client.turboSign().sendSignature(request);
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
