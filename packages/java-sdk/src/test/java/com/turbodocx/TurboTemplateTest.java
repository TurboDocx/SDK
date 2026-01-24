package com.turbodocx;

import com.google.gson.Gson;
import com.turbodocx.models.*;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.*;

import java.io.IOException;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TurboTemplate Module Tests
 *
 * Tests for advanced templating features:
 * - Helper functions (simple, nested, loop, conditional, image)
 * - Builder validation
 * - Generate template functionality
 * - Placeholder and name handling
 */
class TurboTemplateTest {

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
    // Helper Function Tests - simple()
    // ============================================

    @Test
    @DisplayName("simple() should create variable with placeholder, name, value and mimeType")
    void simpleVariableWithAllRequiredParams() {
        TemplateVariable variable = TemplateVariable.simple("{customer_name}", "customer_name", "Person A", VariableMimeType.TEXT);

        assertEquals("{customer_name}", variable.getPlaceholder());
        assertEquals("customer_name", variable.getName());
        assertEquals("Person A", variable.getValue());
        assertEquals(VariableMimeType.TEXT.getValue(), variable.getMimeType());
    }

    @Test
    @DisplayName("simple() should create variable with number value")
    void simpleVariableWithNumberValue() {
        TemplateVariable variable = TemplateVariable.simple("{order_total}", "order_total", 1500, VariableMimeType.TEXT);

        assertEquals("{order_total}", variable.getPlaceholder());
        assertEquals("order_total", variable.getName());
        assertEquals(1500, variable.getValue());
    }

    @Test
    @DisplayName("simple() should create variable with HTML mimeType")
    void simpleVariableWithHtmlMimeType() {
        TemplateVariable variable = TemplateVariable.simple("{content}", "content", "<b>Bold</b>", VariableMimeType.HTML);

        assertEquals("{content}", variable.getPlaceholder());
        assertEquals("content", variable.getName());
        assertEquals("<b>Bold</b>", variable.getValue());
        assertEquals(VariableMimeType.HTML.getValue(), variable.getMimeType());
    }

    @Test
    @DisplayName("simple() should throw error when placeholder is missing")
    void simpleVariableThrowsWhenPlaceholderMissing() {
        assertThrows(IllegalArgumentException.class, () ->
            TemplateVariable.simple("", "name", "value", VariableMimeType.TEXT)
        );
    }

    @Test
    @DisplayName("simple() should throw error when name is missing")
    void simpleVariableThrowsWhenNameMissing() {
        assertThrows(IllegalArgumentException.class, () ->
            TemplateVariable.simple("{test}", "", "value", VariableMimeType.TEXT)
        );
    }

    @Test
    @DisplayName("simple() should throw error when mimeType is missing")
    void simpleVariableThrowsWhenMimeTypeMissing() {
        assertThrows(IllegalArgumentException.class, () ->
            TemplateVariable.simple("{test}", "test", "value", null)
        );
    }

    @Test
    @DisplayName("simple() should throw error when mimeType is invalid")
    void simpleVariableThrowsWhenMimeTypeInvalid() {
        assertThrows(IllegalArgumentException.class, () ->
            TemplateVariable.simple("{test}", "test", "value", VariableMimeType.JSON)
        );
    }

    // ============================================
    // Helper Function Tests - advancedEngine()
    // ============================================

    @Test
    @DisplayName("advancedEngine() should create variable with object value")
    void advancedEngineVariableWithObjectValue() {
        Map<String, Object> user = new HashMap<>();
        user.put("firstName", "Foo");
        user.put("lastName", "Bar");
        user.put("email", "foo@example.com");

        TemplateVariable variable = TemplateVariable.advancedEngine("{user}", "user", user);

        assertEquals("{user}", variable.getPlaceholder());
        assertEquals("user", variable.getName());
        assertEquals(user, variable.getValue());
        assertEquals("json", variable.getMimeType());
        assertTrue(variable.getUsesAdvancedTemplatingEngine());
    }

    @Test
    @DisplayName("advancedEngine() should create variable with deeply nested object")
    void advancedEngineVariableWithDeeplyNestedObject() {
        Map<String, Object> address = new HashMap<>();
        address.put("street", "123 Test Street");
        address.put("city", "Test City");
        address.put("state", "TS");

        Map<String, Object> company = new HashMap<>();
        company.put("name", "Company ABC");
        company.put("address", address);

        TemplateVariable variable = TemplateVariable.advancedEngine("{company}", "company", company);

        assertEquals("{company}", variable.getPlaceholder());
        assertEquals("json", variable.getMimeType());
        assertTrue(variable.getUsesAdvancedTemplatingEngine());
    }

    @Test
    @DisplayName("advancedEngine() should throw error when placeholder is missing")
    void advancedEngineVariableThrowsWhenPlaceholderMissing() {
        Map<String, Object> user = new HashMap<>();
        user.put("name", "Test");

        assertThrows(IllegalArgumentException.class, () ->
            TemplateVariable.advancedEngine("", "user", user)
        );
    }

    @Test
    @DisplayName("advancedEngine() should throw error when name is missing")
    void advancedEngineVariableThrowsWhenNameMissing() {
        Map<String, Object> user = new HashMap<>();
        user.put("name", "Test");

        assertThrows(IllegalArgumentException.class, () ->
            TemplateVariable.advancedEngine("{user}", "", user)
        );
    }

    // ============================================
    // Helper Function Tests - loop()
    // ============================================

    @Test
    @DisplayName("loop() should create variable with array value")
    void loopVariableWithArrayValue() {
        List<Map<String, Object>> items = Arrays.asList(
                Map.of("name", "Item A", "price", 100),
                Map.of("name", "Item B", "price", 200)
        );

        TemplateVariable variable = TemplateVariable.loop("{items}", "items", items);

        assertEquals("{items}", variable.getPlaceholder());
        assertEquals("items", variable.getName());
        assertEquals(items, variable.getValue());
        assertEquals("json", variable.getMimeType());
        assertTrue(variable.getUsesAdvancedTemplatingEngine());
    }

    @Test
    @DisplayName("loop() should create variable with empty array")
    void loopVariableWithEmptyArray() {
        List<Map<String, Object>> products = Collections.emptyList();

        TemplateVariable variable = TemplateVariable.loop("{products}", "products", products);

        assertEquals("{products}", variable.getPlaceholder());
        assertEquals(products, variable.getValue());
        assertEquals("json", variable.getMimeType());
    }

    @Test
    @DisplayName("loop() should create variable with primitive array")
    void loopVariableWithPrimitiveArray() {
        List<String> tags = Arrays.asList("tag1", "tag2", "tag3");

        TemplateVariable variable = TemplateVariable.loop("{tags}", "tags", tags);

        assertEquals(tags, variable.getValue());
    }

    @Test
    @DisplayName("loop() should throw error when placeholder is missing")
    void loopVariableThrowsWhenPlaceholderMissing() {
        List<Map<String, Object>> items = Collections.emptyList();

        assertThrows(IllegalArgumentException.class, () ->
            TemplateVariable.loop("", "items", items)
        );
    }

    @Test
    @DisplayName("loop() should throw error when name is missing")
    void loopVariableThrowsWhenNameMissing() {
        List<Map<String, Object>> items = Collections.emptyList();

        assertThrows(IllegalArgumentException.class, () ->
            TemplateVariable.loop("{items}", "", items)
        );
    }

    // ============================================
    // Helper Function Tests - conditional()
    // ============================================

    @Test
    @DisplayName("conditional() should create variable with boolean true")
    void conditionalVariableWithBooleanTrue() {
        TemplateVariable variable = TemplateVariable.conditional("{is_premium}", "is_premium", true);

        assertEquals("{is_premium}", variable.getPlaceholder());
        assertEquals("is_premium", variable.getName());
        assertEquals(true, variable.getValue());
        assertTrue(variable.getUsesAdvancedTemplatingEngine());
    }

    @Test
    @DisplayName("conditional() should create variable with boolean false")
    void conditionalVariableWithBooleanFalse() {
        TemplateVariable variable = TemplateVariable.conditional("{show_discount}", "show_discount", false);

        assertEquals(false, variable.getValue());
        assertTrue(variable.getUsesAdvancedTemplatingEngine());
    }

    @Test
    @DisplayName("conditional() should create variable with truthy value")
    void conditionalVariableWithTruthyValue() {
        TemplateVariable variable = TemplateVariable.conditional("{count}", "count", 5);

        assertEquals(5, variable.getValue());
    }

    @Test
    @DisplayName("conditional() should throw error when placeholder is missing")
    void conditionalVariableThrowsWhenPlaceholderMissing() {
        assertThrows(IllegalArgumentException.class, () ->
            TemplateVariable.conditional("", "is_active", true)
        );
    }

    @Test
    @DisplayName("conditional() should throw error when name is missing")
    void conditionalVariableThrowsWhenNameMissing() {
        assertThrows(IllegalArgumentException.class, () ->
            TemplateVariable.conditional("{is_active}", "", true)
        );
    }

    // ============================================
    // Helper Function Tests - image()
    // ============================================

    @Test
    @DisplayName("image() should create variable with URL")
    void imageVariableWithUrl() {
        TemplateVariable variable = TemplateVariable.image("{logo}", "logo", "https://example.com/logo.png");

        assertEquals("{logo}", variable.getPlaceholder());
        assertEquals("logo", variable.getName());
        assertEquals("https://example.com/logo.png", variable.getValue());
        assertEquals("image", variable.getMimeType());
    }

    @Test
    @DisplayName("image() should create variable with base64")
    void imageVariableWithBase64() {
        String base64Image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...";
        TemplateVariable variable = TemplateVariable.image("{signature}", "signature", base64Image);

        assertEquals(base64Image, variable.getValue());
        assertEquals("image", variable.getMimeType());
    }

    @Test
    @DisplayName("image() should throw error when placeholder is missing")
    void imageVariableThrowsWhenPlaceholderMissing() {
        assertThrows(IllegalArgumentException.class, () ->
            TemplateVariable.image("", "logo", "https://example.com/logo.png")
        );
    }

    @Test
    @DisplayName("image() should throw error when name is missing")
    void imageVariableThrowsWhenNameMissing() {
        assertThrows(IllegalArgumentException.class, () ->
            TemplateVariable.image("{logo}", "", "https://example.com/logo.png")
        );
    }

    @Test
    @DisplayName("image() should throw error when imageUrl is missing")
    void imageVariableThrowsWhenImageUrlMissing() {
        assertThrows(IllegalArgumentException.class, () ->
            TemplateVariable.image("{logo}", "logo", "")
        );
    }

    @Test
    @DisplayName("image() should use custom placeholder when provided")
    void imageVariableWithCustomPlaceholder() {
        TemplateVariable variable = TemplateVariable.image("logo", "https://example.com/logo.png", "{company_logo}");

        assertEquals("{company_logo}", variable.getPlaceholder());
        assertEquals("logo", variable.getName());
    }

    // ============================================
    // Builder Validation Tests
    // ============================================

    @Test
    @DisplayName("builder should throw error when placeholder is missing")
    void builderThrowsErrorWhenPlaceholderMissing() {
        assertThrows(IllegalStateException.class, () -> {
            TemplateVariable.builder()
                    .name("test")
                    .value("value")
                    .build();
        });
    }

    @Test
    @DisplayName("builder should throw error when name is missing")
    void builderThrowsErrorWhenNameMissing() {
        assertThrows(IllegalStateException.class, () -> {
            TemplateVariable.builder()
                    .placeholder("{test}")
                    .value("value")
                    .build();
        });
    }

    @Test
    @DisplayName("builder should throw error when value and text are both missing")
    void builderThrowsErrorWhenValueAndTextMissing() {
        assertThrows(IllegalStateException.class, () -> {
            TemplateVariable.builder()
                    .placeholder("{test}")
                    .name("test")
                    .build();
        });
    }

    @Test
    @DisplayName("builder should accept text as alternative to value")
    void builderAcceptsTextAsAlternative() {
        TemplateVariable variable = TemplateVariable.builder()
                .placeholder("{test}")
                .name("test")
                .text("text value")
                .build();

        assertEquals("text value", variable.getText());
    }

    // ============================================
    // Generate Tests
    // ============================================

    @Test
    @DisplayName("should generate document with simple variables")
    void generateDocumentWithSimpleVariables() throws Exception {
        Map<String, Object> responseData = new HashMap<>();
        responseData.put("success", true);
        responseData.put("deliverableId", "doc-123");
        responseData.put("message", "Document generated successfully");

        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(responseData)));

        GenerateTemplateRequest request = GenerateTemplateRequest.builder()
                .templateId("template-123")
                .name("Test Document")
                .description("Test description")
                .variables(Arrays.asList(
                        TemplateVariable.simple("customer_name", "Person A"),
                        TemplateVariable.simple("order_total", 1500)
                ))
                .build();

        GenerateTemplateResponse result = client.turboTemplate().generate(request);

        assertTrue(result.isSuccess());
        assertEquals("doc-123", result.getDeliverableId());

        RecordedRequest recorded = server.takeRequest();
        assertEquals("POST", recorded.getMethod());
        assertEquals("/v1/deliverable", recorded.getPath());
        assertEquals("Bearer test-api-key", recorded.getHeader("Authorization"));
        assertEquals("test-org-id", recorded.getHeader("x-rapiddocx-org-id"));
    }

    @Test
    @DisplayName("should generate document with nested object variables")
    void generateDocumentWithNestedObjectVariables() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "deliverableId", "doc-456"
                ))));

        Map<String, Object> user = new HashMap<>();
        user.put("firstName", "Foo");
        user.put("lastName", "Bar");
        user.put("profile", Map.of("company", "Company ABC"));

        GenerateTemplateRequest request = GenerateTemplateRequest.builder()
                .templateId("template-123")
                .name("Nested Document")
                .description("Document with nested objects")
                .variables(Collections.singletonList(
                        TemplateVariable.advancedEngine("user", user)
                ))
                .build();

        GenerateTemplateResponse result = client.turboTemplate().generate(request);

        assertTrue(result.isSuccess());
    }

    @Test
    @DisplayName("should generate document with loop/array variables")
    void generateDocumentWithLoopArrayVariables() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "deliverableId", "doc-789"
                ))));

        List<Map<String, Object>> items = Arrays.asList(
                Map.of("name", "Item A", "quantity", 5, "price", 100),
                Map.of("name", "Item B", "quantity", 3, "price", 200)
        );

        GenerateTemplateRequest request = GenerateTemplateRequest.builder()
                .templateId("template-123")
                .name("Loop Document")
                .description("Document with loops")
                .variables(Collections.singletonList(
                        TemplateVariable.loop("items", items)
                ))
                .build();

        GenerateTemplateResponse result = client.turboTemplate().generate(request);

        assertTrue(result.isSuccess());
    }

    @Test
    @DisplayName("should generate document with helper-created variables")
    void generateDocumentWithHelperCreatedVariables() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "deliverableId", "doc-helper"
                ))));

        GenerateTemplateRequest request = GenerateTemplateRequest.builder()
                .templateId("template-123")
                .name("Helper Document")
                .description("Document using helper functions")
                .variables(Arrays.asList(
                        TemplateVariable.simple("title", "Quarterly Report"),
                        TemplateVariable.advancedEngine("company", Map.of("name", "Company XYZ", "employees", 500)),
                        TemplateVariable.loop("departments", Arrays.asList(Map.of("name", "Dept A"), Map.of("name", "Dept B"))),
                        TemplateVariable.conditional("show_financials", true),
                        TemplateVariable.image("logo", "https://example.com/logo.png")
                ))
                .build();

        GenerateTemplateResponse result = client.turboTemplate().generate(request);

        assertTrue(result.isSuccess());
    }

    @Test
    @DisplayName("should include optional request parameters")
    void generateIncludesOptionalRequestParameters() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "deliverableId", "doc-options"
                ))));

        GenerateTemplateRequest request = GenerateTemplateRequest.builder()
                .templateId("template-123")
                .name("Options Document")
                .description("Document with all options")
                .variables(Collections.singletonList(
                        TemplateVariable.simple("test", "value")
                ))
                .replaceFonts(true)
                .defaultFont("Arial")
                .outputFormat("pdf")
                .metadata(Map.of("customField", "value"))
                .build();

        GenerateTemplateResponse result = client.turboTemplate().generate(request);

        assertTrue(result.isSuccess());
    }

    @Test
    @DisplayName("should throw error when request is null")
    void generateThrowsErrorWhenRequestIsNull() {
        assertThrows(IllegalArgumentException.class, () -> {
            client.turboTemplate().generate(null);
        });
    }

    // ============================================
    // Placeholder and Name Handling Tests
    // ============================================

    @Test
    @DisplayName("should require both placeholder and name in generated request")
    void requireBothPlaceholderAndName() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "deliverableId", "doc-both"
                ))));

        GenerateTemplateRequest request = GenerateTemplateRequest.builder()
                .templateId("template-123")
                .name("Both Fields Document")
                .description("Document with both placeholder and name")
                .variables(Collections.singletonList(
                        TemplateVariable.builder()
                                .placeholder("{customer}")
                                .name("customer")
                                .value("Person A")
                                .build()
                ))
                .build();

        GenerateTemplateResponse result = client.turboTemplate().generate(request);

        assertTrue(result.isSuccess());
    }

    @Test
    @DisplayName("should allow distinct placeholder and name values")
    void allowDistinctPlaceholderAndName() throws Exception {
        server.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "success", true,
                        "deliverableId", "doc-distinct"
                ))));

        GenerateTemplateRequest request = GenerateTemplateRequest.builder()
                .templateId("template-123")
                .name("Distinct Fields Document")
                .description("Document with distinct placeholder and name")
                .variables(Collections.singletonList(
                        TemplateVariable.builder()
                                .placeholder("{cust_name}")
                                .name("customerFullName")
                                .value("Person A")
                                .build()
                ))
                .build();

        GenerateTemplateResponse result = client.turboTemplate().generate(request);

        assertTrue(result.isSuccess());
    }

    // ============================================
    // Error Handling Tests
    // ============================================

    @Test
    @DisplayName("should handle API errors gracefully")
    void handleApiErrors() {
        server.enqueue(new MockResponse()
                .setResponseCode(404)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "message", "Template not found",
                        "code", "TEMPLATE_NOT_FOUND"
                ))));

        GenerateTemplateRequest request = GenerateTemplateRequest.builder()
                .templateId("invalid-template")
                .name("Error Document")
                .description("Document that should fail")
                .variables(Collections.singletonList(
                        TemplateVariable.simple("test", "value")
                ))
                .build();

        TurboDocxException.NotFoundException exception = assertThrows(TurboDocxException.NotFoundException.class, () -> {
            client.turboTemplate().generate(request);
        });

        assertEquals(404, exception.getStatusCode());
        assertEquals("Template not found", exception.getMessage());
    }

    @Test
    @DisplayName("should handle validation errors")
    void handleValidationErrors() {
        server.enqueue(new MockResponse()
                .setResponseCode(400)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "message", "Validation failed: Invalid variable configuration",
                        "code", "VALIDATION_ERROR"
                ))));

        GenerateTemplateRequest request = GenerateTemplateRequest.builder()
                .templateId("template-123")
                .name("Validation Error Document")
                .description("Document that should fail validation")
                .variables(Collections.singletonList(
                        TemplateVariable.simple("test", "value")
                ))
                .build();

        TurboDocxException.ValidationException exception = assertThrows(TurboDocxException.ValidationException.class, () -> {
            client.turboTemplate().generate(request);
        });

        assertEquals(400, exception.getStatusCode());
    }

    @Test
    @DisplayName("should handle rate limit errors")
    void handleRateLimitErrors() {
        server.enqueue(new MockResponse()
                .setResponseCode(429)
                .setHeader("Content-Type", "application/json")
                .setBody(gson.toJson(Map.of(
                        "message", "Rate limit exceeded",
                        "code", "RATE_LIMIT_EXCEEDED"
                ))));

        GenerateTemplateRequest request = GenerateTemplateRequest.builder()
                .templateId("template-123")
                .name("Rate Limit Document")
                .description("Document that should hit rate limit")
                .variables(Collections.singletonList(
                        TemplateVariable.simple("test", "value")
                ))
                .build();

        TurboDocxException.RateLimitException exception = assertThrows(TurboDocxException.RateLimitException.class, () -> {
            client.turboTemplate().generate(request);
        });

        assertEquals(429, exception.getStatusCode());
    }
}
