package com.turbodocx;

import com.google.gson.Gson;
import com.turbodocx.models.deliverable.*;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.*;

import java.io.IOException;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class DeliverableClientTest {

    private MockWebServer server;
    private DeliverableClient client;
    private final Gson gson = new Gson();

    @BeforeEach
    void setUp() throws IOException {
        server = new MockWebServer();
        server.start();

        String baseUrl = server.url("/").toString().replaceAll("/$", "");
        HttpClient httpClient = new HttpClient(baseUrl, "test-api-key", null, "test-org-id", null, null);
        client = new DeliverableClient(httpClient);
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    // ============================================
    // Configuration Tests
    // ============================================

    @Test
    @DisplayName("should build deliverable client without senderEmail")
    void buildDeliverableClientWithoutSenderEmail() {
        DeliverableClient c = new TurboDocxClient.Builder()
                .apiKey("test-key")
                .orgId("org-123")
                .buildDeliverableClient();
        assertNotNull(c);
    }

    @Test
    @DisplayName("should throw when API key is missing")
    void errorWhenNoApiKey() {
        assertThrows(IllegalArgumentException.class, () ->
                new TurboDocxClient.Builder()
                        .orgId("org-123")
                        .buildDeliverableClient());
    }

    @Test
    @DisplayName("should throw when orgId is missing")
    void errorWhenNoOrgId() {
        assertThrows(TurboDocxException.AuthenticationException.class, () ->
                new TurboDocxClient.Builder()
                        .apiKey("test-key")
                        .buildDeliverableClient());
    }

    // ============================================
    // List Deliverables Tests
    // ============================================

    @Test
    @DisplayName("should list deliverables with default options")
    void listDeliverablesDefault() throws Exception {
        enqueueWrapped(Map.of("results", List.of(), "totalRecords", 0));

        DeliverableListResponse response = client.listDeliverables();

        assertNotNull(response);
        assertEquals(0, response.getTotalRecords());

        RecordedRequest request = server.takeRequest();
        assertEquals("GET", request.getMethod());
        assertEquals("/v1/deliverable", request.getPath());
    }

    @Test
    @DisplayName("should list deliverables with query params")
    void listDeliverablesWithParams() throws Exception {
        enqueueWrapped(Map.of("results", List.of(), "totalRecords", 0));

        ListDeliverablesRequest req = new ListDeliverablesRequest();
        req.setLimit(10);
        req.setOffset(5);
        req.setQuery("report");
        req.setShowTags(true);
        client.listDeliverables(req);

        RecordedRequest request = server.takeRequest();
        String path = request.getPath();
        assertTrue(path.contains("limit=10"));
        assertTrue(path.contains("offset=5"));
        assertTrue(path.contains("query=report"));
        assertTrue(path.contains("showTags=true"));
    }

    // ============================================
    // Generate Deliverable Tests
    // ============================================

    @Test
    @DisplayName("should generate deliverable")
    void generateDeliverable() throws Exception {
        Map<String, Object> deliverable = Map.of("id", "del-1", "name", "Report");
        enqueueWrapped(Map.of("results", Map.of("deliverable", deliverable)));

        DeliverableVariable var1 = new DeliverableVariable();
        var1.setPlaceholder("{CompanyName}");
        var1.setText("Acme Corp");
        var1.setMimeType("text");

        CreateDeliverableRequest req = new CreateDeliverableRequest();
        req.setName("Quarterly Report");
        req.setTemplateId("tpl-1");
        req.setVariables(List.of(var1));

        CreateDeliverableResponse response = client.generateDeliverable(req);

        assertNotNull(response);
        assertNotNull(response.getResults());

        RecordedRequest request = server.takeRequest();
        assertEquals("POST", request.getMethod());
        assertEquals("/v1/deliverable", request.getPath());
        String body = request.getBody().readUtf8();
        assertTrue(body.contains("\"name\":\"Quarterly Report\""));
        assertTrue(body.contains("\"templateId\":\"tpl-1\""));
        assertTrue(body.contains("{CompanyName}"));
    }

    // ============================================
    // Get Deliverable Details Tests
    // ============================================

    @Test
    @DisplayName("should get deliverable details")
    void getDeliverableDetails() throws Exception {
        enqueueWrapped(Map.of("results", Map.of("id", "del-1", "name", "Report", "isActive", true)));

        DeliverableRecord record = client.getDeliverableDetails("del-1");

        assertNotNull(record);
        assertEquals("del-1", record.getId());

        RecordedRequest request = server.takeRequest();
        assertEquals("GET", request.getMethod());
        assertEquals("/v1/deliverable/del-1", request.getPath());
    }

    @Test
    @DisplayName("should get deliverable details with showTags")
    void getDeliverableDetailsWithTags() throws Exception {
        enqueueWrapped(Map.of("results", Map.of("id", "del-1", "name", "Report", "isActive", true)));

        client.getDeliverableDetails("del-1", true);

        RecordedRequest request = server.takeRequest();
        assertTrue(request.getPath().contains("showTags=true"));
    }

    // ============================================
    // Update Deliverable Tests
    // ============================================

    @Test
    @DisplayName("should update deliverable info")
    void updateDeliverableInfo() throws Exception {
        enqueueWrapped(Map.of("message", "Updated", "deliverableId", "del-1"));

        UpdateDeliverableRequest req = new UpdateDeliverableRequest();
        req.setName("Updated Report");
        req.setDescription("New description");

        UpdateDeliverableResponse response = client.updateDeliverableInfo("del-1", req);

        assertEquals("Updated", response.getMessage());
        assertEquals("del-1", response.getDeliverableId());

        RecordedRequest request = server.takeRequest();
        assertEquals("PATCH", request.getMethod());
        assertEquals("/v1/deliverable/del-1", request.getPath());
        String body = request.getBody().readUtf8();
        assertTrue(body.contains("\"name\":\"Updated Report\""));
    }

    // ============================================
    // Delete Deliverable Tests
    // ============================================

    @Test
    @DisplayName("should delete deliverable")
    void deleteDeliverable() throws Exception {
        enqueueWrapped(Map.of("message", "Deleted", "deliverableId", "del-1"));

        DeleteDeliverableResponse response = client.deleteDeliverable("del-1");

        assertEquals("Deleted", response.getMessage());
        assertEquals("del-1", response.getDeliverableId());

        RecordedRequest request = server.takeRequest();
        assertEquals("DELETE", request.getMethod());
        assertEquals("/v1/deliverable/del-1", request.getPath());
    }

    // ============================================
    // File Download Tests
    // ============================================

    @Test
    @DisplayName("should download source file")
    void downloadSourceFile() throws Exception {
        byte[] fakeFile = "fake-file-content".getBytes();
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody(new okio.Buffer().write(fakeFile)));

        byte[] result = client.downloadSourceFile("del-1");

        assertArrayEquals(fakeFile, result);

        RecordedRequest request = server.takeRequest();
        assertEquals("GET", request.getMethod());
        assertEquals("/v1/deliverable/file/del-1", request.getPath());
    }

    @Test
    @DisplayName("should download PDF")
    void downloadPDF() throws Exception {
        byte[] fakePdf = "fake-pdf-content".getBytes();
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setBody(new okio.Buffer().write(fakePdf)));

        byte[] result = client.downloadPDF("del-1");

        assertArrayEquals(fakePdf, result);

        RecordedRequest request = server.takeRequest();
        assertEquals("GET", request.getMethod());
        assertEquals("/v1/deliverable/file/pdf/del-1", request.getPath());
    }

    // ============================================
    // Error Handling Tests
    // ============================================

    @Test
    @DisplayName("should throw NotFoundException for 404")
    void handleNotFound() {
        server.enqueue(new MockResponse()
                .setResponseCode(404)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of("message", "Deliverable not found"))));

        assertThrows(TurboDocxException.NotFoundException.class,
                () -> client.getDeliverableDetails("invalid-id"));
    }

    @Test
    @DisplayName("should throw AuthenticationException for 401")
    void handleAuthError() {
        server.enqueue(new MockResponse()
                .setResponseCode(401)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of("message", "Invalid API key"))));

        assertThrows(TurboDocxException.AuthenticationException.class,
                () -> client.listDeliverables());
    }

    @Test
    @DisplayName("should send correct headers")
    void shouldSendCorrectHeaders() throws Exception {
        enqueueWrapped(Map.of("results", List.of(), "totalRecords", 0));

        client.listDeliverables();

        RecordedRequest request = server.takeRequest();
        assertEquals("Bearer test-api-key", request.getHeader("Authorization"));
        assertEquals("test-org-id", request.getHeader("x-rapiddocx-org-id"));
    }

    // ============================================
    // Helpers
    // ============================================

    private void enqueueWrapped(Map<String, Object> data) {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of("data", data))));
    }
}
