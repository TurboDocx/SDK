package com.turbodocx;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.turbodocx.models.quote.*;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.*;

import java.io.IOException;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TurboQuote Module Tests
 *
 * Tests for all 60 TurboQuote SDK operations organized by entity.
 * Uses MockWebServer for real HTTP testing. All mock responses wrap content
 * in {"data": ...} to test the smart-unwrap + normalizer pipeline.
 */
class TurboQuoteTest {

    private MockWebServer server;
    private TurboQuoteClient client;
    private final Gson gson = new Gson();

    @BeforeEach
    void setUp() throws IOException {
        server = new MockWebServer();
        server.start();

        client = new TurboQuoteClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                .baseUrl(server.url("/").toString())
                .build();
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    /**
     * Wrap a response body in {"data": body} to simulate the backend wrapper.
     */
    private String wrapInData(Object body) {
        JsonObject wrapper = new JsonObject();
        wrapper.add("data", gson.toJsonTree(body));
        return gson.toJson(wrapper);
    }

    // ============================================
    // CONFIGURATION
    // ============================================

    @Nested
    @DisplayName("Configuration")
    class Configuration {

        @Test
        @DisplayName("should configure the client with API key and orgId")
        void configureWithApiKeyAndOrgId() {
            TurboQuoteClient testClient = new TurboQuoteClient.Builder()
                    .apiKey("test-api-key")
                    .orgId("test-org-id")
                    .build();
            assertNotNull(testClient);
            assertNotNull(testClient.turboQuote());
        }

        @Test
        @DisplayName("should configure with custom base URL")
        void configureWithCustomBaseUrl() {
            TurboQuoteClient testClient = new TurboQuoteClient.Builder()
                    .apiKey("test-api-key")
                    .orgId("test-org-id")
                    .baseUrl("https://custom-api.example.com")
                    .build();
            assertNotNull(testClient);
        }

        @Test
        @DisplayName("should configure with access token instead of API key")
        void configureWithAccessToken() {
            TurboQuoteClient testClient = new TurboQuoteClient.Builder()
                    .accessToken("oauth-token")
                    .orgId("test-org-id")
                    .build();
            assertNotNull(testClient);
        }

        @Test
        @DisplayName("should throw when no API key or access token provided")
        void throwWhenNoAuth() {
            assertThrows(IllegalArgumentException.class, () ->
                    new TurboQuoteClient.Builder()
                            .orgId("test-org-id")
                            .build()
            );
        }

        @Test
        @DisplayName("should throw when no orgId provided")
        void throwWhenNoOrgId() {
            assertThrows(TurboDocxException.AuthenticationException.class, () ->
                    new TurboQuoteClient.Builder()
                            .apiKey("test-key")
                            .build()
            );
        }

        @Test
        @DisplayName("should NOT require senderEmail (unlike TurboDocxClient)")
        void noSenderEmailRequired() {
            TurboQuoteClient testClient = new TurboQuoteClient.Builder()
                    .apiKey("test-api-key")
                    .orgId("test-org-id")
                    .build();
            assertNotNull(testClient);
        }
    }

    // ============================================
    // QUOTES — CRUD
    // ============================================

    @Nested
    @DisplayName("Quotes CRUD")
    class QuotesCrud {

        @Test
        @DisplayName("should list quotes with pagination and filters")
        void listQuotesWithFilters() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("results", Collections.singletonList(
                    createQuoteMap("q-1", "Test Quote", "draft")));
            response.put("totalRecords", 1);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            ListQuotesOptions options = new ListQuotesOptions();
            options.setLimit(10);
            options.setStatuses(Collections.singletonList("draft"));
            options.setQuery("test");
            QuoteListResponse result = client.turboQuote().listQuotes(options);

            assertEquals(1, result.getResults().size());
            assertEquals(1, result.getTotalRecords());

            RecordedRequest recorded = server.takeRequest();
            assertTrue(recorded.getPath().contains("/v1/quotes"));
            assertTrue(recorded.getPath().contains("limit=10"));
            assertTrue(recorded.getPath().contains("statuses=draft"));
            assertTrue(recorded.getPath().contains("query=test"));
        }

        @Test
        @DisplayName("should pass array statuses as repeated query params")
        void listQuotesArrayStatuses() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("results", Collections.emptyList());
            response.put("totalRecords", 0);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            ListQuotesOptions options = new ListQuotesOptions();
            options.setStatuses(Arrays.asList("draft", "sent"));
            client.turboQuote().listQuotes(options);

            RecordedRequest recorded = server.takeRequest();
            String path = recorded.getPath();
            assertTrue(path.contains("statuses=draft"));
            assertTrue(path.contains("statuses=sent"));
        }

        @Test
        @DisplayName("should create a quote and unwrap result")
        void createQuote() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createQuoteMap("q-1", "My Quote", "draft"));
            response.put("message", "Quote created successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            CreateQuoteRequest request = new CreateQuoteRequest();
            request.setName("My Quote");
            request.setCompanyId("c-1");
            request.setContactId("ct-1");
            Quote result = client.turboQuote().createQuote(request);

            assertEquals("q-1", result.getId());
            assertEquals("draft", result.getStatus());

            RecordedRequest recorded = server.takeRequest();
            assertEquals("POST", recorded.getMethod());
            assertTrue(recorded.getPath().endsWith("/v1/quotes"));
            String body = recorded.getBody().readUtf8();
            assertTrue(body.contains("\"name\":\"My Quote\""));
            assertFalse(body.contains("\"currency\""), "null fields should be omitted from request body");
            assertFalse(body.contains("\"taxRate\""), "null fields should be omitted from request body");
            assertFalse(body.contains("\"priceBookId\""), "null fields should be omitted from request body");
        }

        @Test
        @DisplayName("should get a quote by ID and include statusInfo")
        void getQuote() throws Exception {
            Map<String, Object> statusInfo = new HashMap<>();
            statusInfo.put("currentStatus", "sent");
            statusInfo.put("canSend", false);
            statusInfo.put("canAccept", true);
            statusInfo.put("canDecline", true);
            statusInfo.put("canVoid", true);
            statusInfo.put("isTerminal", false);

            Map<String, Object> response = new HashMap<>();
            response.put("result", createQuoteMap("q-1", "Test Quote", "sent"));
            response.put("statusInfo", statusInfo);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            Quote result = client.turboQuote().getQuote("q-1");

            assertEquals("q-1", result.getId());
            assertNotNull(result.getStatusInfo());
            assertEquals("sent", result.getStatusInfo().getCurrentStatus());
            assertFalse(result.getStatusInfo().getCanSend());
            assertTrue(result.getStatusInfo().getCanAccept());
        }

        @Test
        @DisplayName("should update a quote and unwrap result")
        void updateQuote() throws Exception {
            Map<String, Object> response = new HashMap<>();
            Map<String, Object> quoteMap = createQuoteMap("q-1", "Updated Name", "draft");
            quoteMap.put("taxRate", "10.00");
            response.put("result", quoteMap);
            response.put("message", "Quote updated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            UpdateQuoteRequest request = new UpdateQuoteRequest();
            request.setName("Updated Name");
            request.setTaxRate(10.0);
            Quote result = client.turboQuote().updateQuote("q-1", request);

            assertEquals("Updated Name", result.getName());
            assertEquals(10.0, result.getTaxRate(), 0.001);

            RecordedRequest recorded = server.takeRequest();
            assertEquals("PATCH", recorded.getMethod());
        }

        @Test
        @DisplayName("should delete a quote")
        void deleteQuote() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Quote deleted successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            SuccessResponse result = client.turboQuote().deleteQuote("q-1");

            assertEquals("Quote deleted successfully", result.getMessage());

            RecordedRequest recorded = server.takeRequest();
            assertEquals("DELETE", recorded.getMethod());
            assertTrue(recorded.getPath().endsWith("/v1/quotes/q-1"));
        }

        @Test
        @DisplayName("should duplicate a quote and unwrap result")
        void duplicateQuote() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createQuoteMap("q-2", "Test Quote (Copy)", "draft"));
            response.put("message", "Quote duplicated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            Quote result = client.turboQuote().duplicateQuote("q-1");

            assertEquals("q-2", result.getId());
            assertEquals("draft", result.getStatus());

            RecordedRequest recorded = server.takeRequest();
            assertEquals("POST", recorded.getMethod());
            assertTrue(recorded.getPath().endsWith("/v1/quotes/q-1/duplicate"));
        }

        @Test
        @DisplayName("should apply a price book and return full response")
        void applyPriceBook() throws Exception {
            Map<String, Object> quoteMap = createQuoteMap("q-1", "Test Quote", "draft");
            quoteMap.put("priceBookId", "pb-1");
            Map<String, Object> response = new HashMap<>();
            response.put("result", quoteMap);
            response.put("updatedCount", 3);
            response.put("skippedCount", 1);
            response.put("message", "Pricebook applied: 3 product(s) updated, 1 skipped");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            ApplyPriceBookResponse result = client.turboQuote().applyPriceBook("q-1", "pb-1");

            assertEquals("pb-1", result.getQuote().getPriceBookId());
            assertEquals(3, result.getUpdatedCount());
            assertEquals(1, result.getSkippedCount());
            assertEquals("Pricebook applied: 3 product(s) updated, 1 skipped", result.getMessage());

            RecordedRequest recorded = server.takeRequest();
            String body = recorded.getBody().readUtf8();
            assertTrue(body.contains("\"priceBookId\":\"pb-1\""));
        }

        @Test
        @DisplayName("should remove a price book and unwrap result")
        void removePriceBook() throws Exception {
            Map<String, Object> quoteMap = createQuoteMap("q-1", "Test Quote", "draft");
            quoteMap.put("priceBookId", null);
            Map<String, Object> response = new HashMap<>();
            response.put("result", quoteMap);
            response.put("message", "Pricebook removed from quote");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            Quote result = client.turboQuote().removePriceBook("q-1");

            assertNull(result.getPriceBookId());
        }

        @Test
        @DisplayName("should download a quote PDF")
        void downloadQuotePdf() throws Exception {
            byte[] pdfBytes = new byte[]{0x25, 0x50, 0x44, 0x46}; // %PDF magic bytes
            server.enqueue(new MockResponse().setBody(new okio.Buffer().write(pdfBytes)));

            byte[] result = client.turboQuote().downloadQuotePdf("q-1");

            assertEquals(4, result.length);

            RecordedRequest recorded = server.takeRequest();
            assertTrue(recorded.getPath().endsWith("/v1/quotes/q-1/pdf"));
        }
    }

    // ============================================
    // QUOTES — STATUS TRANSITIONS
    // ============================================

    @Nested
    @DisplayName("Quote Status")
    class QuoteStatus {

        @Test
        @DisplayName("should send a quote and remap result to quote")
        void sendQuote() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createQuoteMap("q-1", "Test Quote", "sent"));
            response.put("message", "Quote sent");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            SendQuoteRequest request = new SendQuoteRequest();
            request.setCcEmails(Collections.singletonList("admin@example.com"));
            SendQuoteResponse result = client.turboQuote().sendQuote("q-1", request);

            assertEquals("sent", result.getQuote().getStatus());
            assertEquals("Quote sent", result.getMessage());

            RecordedRequest recorded = server.takeRequest();
            assertEquals("POST", recorded.getMethod());
            assertTrue(recorded.getPath().endsWith("/v1/quotes/q-1/send"));
        }

        @Test
        @DisplayName("should send a quote without options")
        void sendQuoteWithoutOptions() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createQuoteMap("q-1", "Test Quote", "sent"));
            response.put("message", "Quote sent");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            SendQuoteResponse result = client.turboQuote().sendQuote("q-1");

            assertEquals("q-1", result.getQuote().getId());
        }

        @Test
        @DisplayName("should send a quote with a deliverable and return documentId")
        void sendQuoteWithDeliverable() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createQuoteMap("q-1", "Test Quote", "sent"));
            response.put("message", "Quote sent with deliverable");
            response.put("documentId", "doc-2");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            SendQuoteWithDeliverableRequest request = new SendQuoteWithDeliverableRequest();
            request.setDeliverableId("del-1");
            request.setMergePosition("end");
            SendQuoteWithDeliverableResponse result = client.turboQuote().sendQuoteWithDeliverable("q-1", request);

            assertEquals("sent", result.getQuote().getStatus());
            assertEquals("doc-2", result.getDocumentId());
            assertEquals("Quote sent with deliverable", result.getMessage());
        }

        @Test
        @DisplayName("should decline a quote and unwrap result")
        void declineQuote() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createQuoteMap("q-1", "Test Quote", "declined"));
            response.put("message", "Quote declined");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            DeclineQuoteRequest request = new DeclineQuoteRequest();
            request.setReason("Budget not approved");
            Quote result = client.turboQuote().declineQuote("q-1", request);

            assertEquals("declined", result.getStatus());

            RecordedRequest recorded = server.takeRequest();
            String body = recorded.getBody().readUtf8();
            assertTrue(body.contains("\"reason\":\"Budget not approved\""));
        }

        @Test
        @DisplayName("should void a quote and unwrap result")
        void voidQuote() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createQuoteMap("q-1", "Test Quote", "voided"));
            response.put("message", "Quote voided successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            VoidQuoteRequest request = new VoidQuoteRequest();
            request.setReason("Replaced by new quote");
            Quote result = client.turboQuote().voidQuote("q-1", request);

            assertEquals("voided", result.getStatus());
        }

        @Test
        @DisplayName("should handle an expired sent quote and unwrap result")
        void handleExpiredQuote() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createQuoteMap("q-2", "New Quote", "draft"));
            response.put("message", "Expired quote processed");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            HandleExpiredQuoteRequest request = new HandleExpiredQuoteRequest();
            request.setAction("void");
            request.setReason("Expired");
            request.setNewValidUntil("2026-12-31");
            Quote result = client.turboQuote().handleExpiredQuote("q-1", request);

            assertEquals("draft", result.getStatus());

            RecordedRequest recorded = server.takeRequest();
            assertTrue(recorded.getPath().endsWith("/v1/quotes/q-1/handle-expired-sent"));
        }
    }

    // ============================================
    // LINE ITEMS
    // ============================================

    @Nested
    @DisplayName("Line Items")
    class LineItems {

        @Test
        @DisplayName("should list line items for a quote")
        void listLineItems() throws Exception {
            Map<String, Object> itemMap = new HashMap<>();
            itemMap.put("id", "li-1");
            itemMap.put("productName", "Widget");

            Map<String, Object> response = new HashMap<>();
            response.put("results", Collections.singletonList(itemMap));
            response.put("totalRecords", 1);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            LineItemListResponse result = client.turboQuote().listLineItems("q-1");

            assertEquals(1, result.getResults().size());

            RecordedRequest recorded = server.takeRequest();
            assertTrue(recorded.getPath().contains("/v1/quotes/q-1/items"));
        }

        @Test
        @DisplayName("should add a single product line item and unwrap results")
        void addSingleLineItem() throws Exception {
            Map<String, Object> itemMap = new HashMap<>();
            itemMap.put("id", "li-1");
            itemMap.put("productId", "prod-1");
            itemMap.put("quantity", 2);

            Map<String, Object> response = new HashMap<>();
            response.put("results", Collections.singletonList(itemMap));
            response.put("message", "1 line item(s) added successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            AddLineItemRequest item = new AddLineItemRequest();
            item.setProductId("prod-1");
            item.setProductName("Widget");
            item.setUnitPrice(50.0);
            item.setBillingFrequency("monthly");
            item.setQuantity(2.0);
            List<LineItem> result = client.turboQuote().addLineItems("q-1", item);

            assertEquals(1, result.size());

            RecordedRequest recorded = server.takeRequest();
            assertEquals("POST", recorded.getMethod());
            assertTrue(recorded.getPath().endsWith("/v1/quotes/q-1/items"));
        }

        @Test
        @DisplayName("should add multiple product line items as batch")
        void addMultipleLineItems() throws Exception {
            List<Map<String, Object>> items = new ArrayList<>();
            Map<String, Object> item1 = new HashMap<>();
            item1.put("id", "li-1");
            items.add(item1);
            Map<String, Object> item2 = new HashMap<>();
            item2.put("id", "li-2");
            items.add(item2);

            Map<String, Object> response = new HashMap<>();
            response.put("results", items);
            response.put("message", "2 line item(s) added successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            AddLineItemRequest req1 = new AddLineItemRequest();
            req1.setProductId("prod-1");
            req1.setProductName("Widget A");
            req1.setUnitPrice(50.0);
            req1.setBillingFrequency("monthly");

            AddLineItemRequest req2 = new AddLineItemRequest();
            req2.setProductId("prod-2");
            req2.setProductName("Widget B");
            req2.setUnitPrice(75.0);
            req2.setBillingFrequency("monthly");

            List<LineItem> result = client.turboQuote().addLineItems("q-1", Arrays.asList(req1, req2));

            assertEquals(2, result.size());
        }

        @Test
        @DisplayName("should add a single bundle line item and unwrap results")
        void addBundleLineItem() throws Exception {
            Map<String, Object> itemMap = new HashMap<>();
            itemMap.put("id", "li-3");
            itemMap.put("bundleId", "bun-1");
            itemMap.put("lineItemType", "bundle");

            Map<String, Object> response = new HashMap<>();
            response.put("results", Collections.singletonList(itemMap));
            response.put("message", "1 bundle(s) added successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            AddBundleLineItemRequest item = new AddBundleLineItemRequest();
            item.setBundleId("bun-1");
            item.setBundleName("Starter Pack");
            List<LineItem> result = client.turboQuote().addBundleLineItems("q-1", item);

            assertEquals(1, result.size());

            RecordedRequest recorded = server.takeRequest();
            assertTrue(recorded.getPath().endsWith("/v1/quotes/q-1/items/bundle"));
        }

        @Test
        @DisplayName("should update a line item and unwrap result")
        void updateLineItem() throws Exception {
            Map<String, Object> itemMap = new HashMap<>();
            itemMap.put("id", "li-1");
            itemMap.put("quantity", 10);
            itemMap.put("unitPrice", "50.00");

            Map<String, Object> response = new HashMap<>();
            response.put("result", itemMap);
            response.put("message", "Line item updated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            UpdateLineItemRequest request = new UpdateLineItemRequest();
            request.setQuantity(10.0);
            request.setUnitPrice(50.0);
            LineItem result = client.turboQuote().updateLineItem("q-1", "li-1", request);

            assertEquals(10, result.getQuantity());
            assertEquals(50.0, result.getUnitPrice(), 0.001);

            RecordedRequest recorded = server.takeRequest();
            assertEquals("PATCH", recorded.getMethod());
        }

        @Test
        @DisplayName("should remove a line item")
        void removeLineItem() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Line item removed successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            SuccessResponse result = client.turboQuote().removeLineItem("q-1", "li-1");

            assertEquals("Line item removed successfully", result.getMessage());

            RecordedRequest recorded = server.takeRequest();
            assertEquals("DELETE", recorded.getMethod());
        }
    }

    // ============================================
    // PRODUCTS
    // ============================================

    @Nested
    @DisplayName("Products")
    class Products {

        @Test
        @DisplayName("should list products with filters")
        void listProducts() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("results", Collections.singletonList(
                    createProductMap("p-1", "Widget")));
            response.put("totalRecords", 1);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            ListProductsOptions options = new ListProductsOptions();
            options.setBillingFrequency("monthly");
            options.setLimit(25);
            ProductListResponse result = client.turboQuote().listProducts(options);

            assertEquals(1, result.getResults().size());
        }

        @Test
        @DisplayName("should create a product without images and unwrap result")
        void createProductWithoutImages() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createProductMap("p-1", "Widget Pro"));
            response.put("message", "Product created successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            CreateProductRequest request = new CreateProductRequest();
            request.setName("Widget Pro");
            request.setListPrice(99.99);
            request.setBillingFrequency("monthly");
            request.setCategoryId("cat-1");
            Product result = client.turboQuote().createProduct(request);

            assertEquals("Widget Pro", result.getName());

            RecordedRequest recorded = server.takeRequest();
            assertEquals("POST", recorded.getMethod());
        }

        @Test
        @DisplayName("should get a product by ID and unwrap result")
        void getProduct() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createProductMap("p-1", "Widget"));
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            Product result = client.turboQuote().getProduct("p-1");

            assertEquals("p-1", result.getId());
        }

        @Test
        @DisplayName("should update a product without images and unwrap result")
        void updateProductWithoutImages() throws Exception {
            Map<String, Object> prodMap = createProductMap("p-1", "Updated Widget");
            prodMap.put("listPrice", "149.99");
            Map<String, Object> response = new HashMap<>();
            response.put("result", prodMap);
            response.put("message", "Product updated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            UpdateProductRequest request = new UpdateProductRequest();
            request.setName("Updated Widget");
            request.setListPrice(149.99);
            Product result = client.turboQuote().updateProduct("p-1", request);

            assertEquals("Updated Widget", result.getName());
            assertEquals(149.99, result.getListPrice(), 0.001);

            RecordedRequest recorded = server.takeRequest();
            assertEquals("PATCH", recorded.getMethod());
        }

        @Test
        @DisplayName("should delete a product")
        void deleteProduct() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Product deleted successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            SuccessResponse result = client.turboQuote().deleteProduct("p-1");

            assertEquals("Product deleted successfully", result.getMessage());
        }

        @Test
        @DisplayName("should duplicate a product and unwrap result")
        void duplicateProduct() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createProductMap("p-2", "Widget Pro (Copy)"));
            response.put("message", "Product duplicated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            Product result = client.turboQuote().duplicateProduct("p-1");

            assertEquals("p-2", result.getId());

            RecordedRequest recorded = server.takeRequest();
            assertTrue(recorded.getPath().endsWith("/v1/products/p-1/duplicate"));
        }

        @Test
        @DisplayName("should get primary images and unwrap results")
        void getProductPrimaryImages() throws Exception {
            Map<String, Object> imageMap = new HashMap<>();
            imageMap.put("id", "img-1");
            imageMap.put("productId", "p-1");

            Map<String, Object> resultsMap = new HashMap<>();
            resultsMap.put("p-1", imageMap);
            resultsMap.put("p-2", null);

            Map<String, Object> response = new HashMap<>();
            response.put("results", resultsMap);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            Map<String, ProductImage> result = client.turboQuote().getProductPrimaryImages(
                    Arrays.asList("p-1", "p-2"));

            assertNotNull(result.get("p-1"));
            assertEquals("img-1", result.get("p-1").getId());
            assertNull(result.get("p-2"));

            RecordedRequest recorded = server.takeRequest();
            String body = recorded.getBody().readUtf8();
            assertTrue(body.contains("\"productIds\":[\"p-1\",\"p-2\"]"));
        }
    }

    // ============================================
    // PRICE BOOKS
    // ============================================

    @Nested
    @DisplayName("Price Books")
    class PriceBooks {

        @Test
        @DisplayName("should list price books")
        void listPriceBooks() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("results", Collections.singletonList(
                    createPriceBookMap("pb-1", "Standard")));
            response.put("totalRecords", 1);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            PriceBookListResponse result = client.turboQuote().listPriceBooks();

            assertEquals(1, result.getResults().size());
        }

        @Test
        @DisplayName("should create a price book and unwrap result")
        void createPriceBook() throws Exception {
            Map<String, Object> pbMap = createPriceBookMap("pb-1", "Partner Pricing");
            pbMap.put("discountPercent", "15.00");
            Map<String, Object> response = new HashMap<>();
            response.put("result", pbMap);
            response.put("message", "PriceBook created successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            CreatePriceBookRequest request = new CreatePriceBookRequest();
            request.setName("Partner Pricing");
            request.setPriceBookTypeId("pbt-1");
            request.setValidFrom("2026-01-01");
            request.setDiscountPercent(15.0);
            PriceBook result = client.turboQuote().createPriceBook(request);

            assertEquals("Partner Pricing", result.getName());
            assertEquals(15.0, result.getDiscountPercent(), 0.001);
        }

        @Test
        @DisplayName("should get a price book by ID and unwrap result")
        void getPriceBook() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createPriceBookMap("pb-1", "Standard"));
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            PriceBook result = client.turboQuote().getPriceBook("pb-1");

            assertEquals("pb-1", result.getId());
        }

        @Test
        @DisplayName("should update a price book and unwrap result")
        void updatePriceBook() throws Exception {
            Map<String, Object> pbMap = createPriceBookMap("pb-1", "Updated");
            pbMap.put("discountPercent", "20.00");
            Map<String, Object> response = new HashMap<>();
            response.put("result", pbMap);
            response.put("message", "PriceBook updated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            UpdatePriceBookRequest request = new UpdatePriceBookRequest();
            request.setDiscountPercent(20.0);
            PriceBook result = client.turboQuote().updatePriceBook("pb-1", request);

            assertEquals(20.0, result.getDiscountPercent(), 0.001);
        }

        @Test
        @DisplayName("should delete a price book")
        void deletePriceBook() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "PriceBook deleted successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            SuccessResponse result = client.turboQuote().deletePriceBook("pb-1");

            assertEquals("PriceBook deleted successfully", result.getMessage());
        }

        @Test
        @DisplayName("should duplicate a price book and unwrap result")
        void duplicatePriceBook() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createPriceBookMap("pb-2", "Standard (Copy)"));
            response.put("message", "Pricebook duplicated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            PriceBook result = client.turboQuote().duplicatePriceBook("pb-1");

            assertEquals("pb-2", result.getId());
        }

        @Test
        @DisplayName("should list products in a price book")
        void listPriceBookProducts() throws Exception {
            Map<String, Object> pricingMap = new HashMap<>();
            pricingMap.put("productId", "p-1");
            pricingMap.put("discountPercent", "10.00");

            Map<String, Object> response = new HashMap<>();
            response.put("results", Collections.singletonList(pricingMap));
            response.put("totalRecords", 1);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            PriceBookProductListResponse result = client.turboQuote().listPriceBookProducts("pb-1");

            assertEquals(1, result.getResults().size());
            assertEquals(10.0, result.getResults().get(0).getDiscountPercent(), 0.001);
        }
    }

    // ============================================
    // BUNDLES
    // ============================================

    @Nested
    @DisplayName("Bundles")
    class Bundles {

        @Test
        @DisplayName("should list bundles")
        void listBundles() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("results", Collections.singletonList(
                    createBundleMap("b-1", "Starter Pack")));
            response.put("totalRecords", 1);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            BundleListResponse result = client.turboQuote().listBundles();

            assertEquals(1, result.getResults().size());
        }

        @Test
        @DisplayName("should create a bundle and unwrap result")
        void createBundle() throws Exception {
            Map<String, Object> bundleMap = createBundleMap("b-1", "Starter Pack");
            bundleMap.put("items", Collections.emptyList());
            Map<String, Object> response = new HashMap<>();
            response.put("result", bundleMap);
            response.put("message", "Bundle created successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            CreateBundleRequest request = new CreateBundleRequest();
            request.setName("Starter Pack");
            request.setCategoryId("cat-1");
            Bundle result = client.turboQuote().createBundle(request);

            assertEquals("Starter Pack", result.getName());
        }

        @Test
        @DisplayName("should get a bundle by ID and unwrap result")
        void getBundle() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createBundleMap("b-1", "Starter Pack"));
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            Bundle result = client.turboQuote().getBundle("b-1");

            assertEquals("b-1", result.getId());
        }

        @Test
        @DisplayName("should update a bundle and unwrap result")
        void updateBundle() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createBundleMap("b-1", "Pro Pack"));
            response.put("message", "Bundle updated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            UpdateBundleRequest request = new UpdateBundleRequest();
            request.setName("Pro Pack");
            Bundle result = client.turboQuote().updateBundle("b-1", request);

            assertEquals("Pro Pack", result.getName());
        }

        @Test
        @DisplayName("should delete a bundle")
        void deleteBundle() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Bundle deleted successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            SuccessResponse result = client.turboQuote().deleteBundle("b-1");

            assertEquals("Bundle deleted successfully", result.getMessage());
        }

        @Test
        @DisplayName("should duplicate a bundle and unwrap result")
        void duplicateBundle() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createBundleMap("b-2", "Starter Pack (Copy)"));
            response.put("message", "Bundle duplicated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            Bundle result = client.turboQuote().duplicateBundle("b-1");

            assertEquals("b-2", result.getId());

            RecordedRequest recorded = server.takeRequest();
            assertTrue(recorded.getPath().endsWith("/v1/bundles/b-1/duplicate"));
        }
    }

    // ============================================
    // COMPANIES
    // ============================================

    @Nested
    @DisplayName("Companies")
    class Companies {

        @Test
        @DisplayName("should list companies")
        void listCompanies() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("results", Collections.singletonList(
                    createCompanyMap("c-1", "Acme Corp")));
            response.put("totalRecords", 1);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            ListCompaniesOptions options = new ListCompaniesOptions();
            options.setQuery("acme");
            CompanyListResponse result = client.turboQuote().listCompanies(options);

            assertEquals(1, result.getResults().size());
        }

        @Test
        @DisplayName("should create a company and unwrap result")
        void createCompany() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createCompanyMap("c-1", "Acme Corp"));
            response.put("message", "Company created successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            CreateCompanyRequest request = new CreateCompanyRequest();
            request.setName("Acme Corp");
            CreateCompanyContactInput contact = new CreateCompanyContactInput();
            contact.setName("John Doe");
            contact.setEmail("john@acme.com");
            request.setContacts(Collections.singletonList(contact));
            request.setCity("Austin");
            request.setState("TX");
            Company result = client.turboQuote().createCompany(request);

            assertEquals("Acme Corp", result.getName());
        }

        @Test
        @DisplayName("should get a company by ID and unwrap result")
        void getCompany() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createCompanyMap("c-1", "Acme"));
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            Company result = client.turboQuote().getCompany("c-1");

            assertEquals("c-1", result.getId());
        }

        @Test
        @DisplayName("should update a company and unwrap result")
        void updateCompany() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createCompanyMap("c-1", "Acme Inc"));
            response.put("message", "Company updated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            UpdateCompanyRequest request = new UpdateCompanyRequest();
            request.setName("Acme Inc");
            Company result = client.turboQuote().updateCompany("c-1", request);

            assertEquals("Acme Inc", result.getName());
        }

        @Test
        @DisplayName("should delete a company")
        void deleteCompany() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Company deleted successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            SuccessResponse result = client.turboQuote().deleteCompany("c-1");

            assertEquals("Company deleted successfully", result.getMessage());
        }

        @Test
        @DisplayName("should list contacts for a company")
        void listCompanyContacts() throws Exception {
            Map<String, Object> contactMap = new HashMap<>();
            contactMap.put("id", "ct-1");
            contactMap.put("name", "John Doe");

            Map<String, Object> response = new HashMap<>();
            response.put("results", Collections.singletonList(contactMap));
            response.put("totalRecords", 1);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            ContactListResponse result = client.turboQuote().listCompanyContacts("c-1");

            assertEquals(1, result.getResults().size());

            RecordedRequest recorded = server.takeRequest();
            assertTrue(recorded.getPath().contains("/v1/companies/c-1/contacts"));
        }
    }

    // ============================================
    // CONTACTS
    // ============================================

    @Nested
    @DisplayName("Contacts")
    class Contacts {

        @Test
        @DisplayName("should list contacts with optional company filter")
        void listContacts() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("results", Collections.singletonList(
                    createContactMap("ct-1", "Jane")));
            response.put("totalRecords", 1);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            ListContactsOptions options = new ListContactsOptions();
            options.setCompanyId("c-1");
            ContactListResponse result = client.turboQuote().listContacts(options);

            assertEquals(1, result.getResults().size());

            RecordedRequest recorded = server.takeRequest();
            assertTrue(recorded.getPath().contains("companyId=c-1"));
        }

        @Test
        @DisplayName("should create a contact and unwrap result")
        void createContact() throws Exception {
            Map<String, Object> contactMap = createContactMap("ct-1", "John Doe");
            contactMap.put("email", "john@example.com");
            Map<String, Object> response = new HashMap<>();
            response.put("result", contactMap);
            response.put("message", "Contact created successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            CreateContactRequest request = new CreateContactRequest();
            request.setName("John Doe");
            request.setCompanyId("c-1");
            request.setEmail("john@example.com");
            Contact result = client.turboQuote().createContact(request);

            assertEquals("John Doe", result.getName());
        }

        @Test
        @DisplayName("should update a contact and unwrap result")
        void updateContact() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createContactMap("ct-1", "Jane Doe"));
            response.put("message", "Contact updated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            UpdateContactRequest request = new UpdateContactRequest();
            request.setName("Jane Doe");
            Contact result = client.turboQuote().updateContact("ct-1", request);

            assertEquals("Jane Doe", result.getName());
        }

        @Test
        @DisplayName("should delete a contact")
        void deleteContact() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Contact deleted successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            SuccessResponse result = client.turboQuote().deleteContact("ct-1");

            assertEquals("Contact deleted successfully", result.getMessage());
        }
    }

    // ============================================
    // TEMPLATES
    // ============================================

    @Nested
    @DisplayName("Templates")
    class Templates {

        @Test
        @DisplayName("should list all templates")
        void listTemplates() throws Exception {
            Map<String, Object> t1 = new HashMap<>();
            t1.put("id", "t-1");
            t1.put("primaryColor", "#0066FF");
            Map<String, Object> t2 = new HashMap<>();
            t2.put("id", "t-2");
            t2.put("primaryColor", "#FF0000");

            Map<String, Object> response = new HashMap<>();
            response.put("results", Arrays.asList(t1, t2));
            response.put("totalRecords", 2);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            QuoteTemplateListResponse result = client.turboQuote().listTemplates();

            assertEquals(2, result.getResults().size());
        }

        @Test
        @DisplayName("should list templates with pagination")
        void listTemplatesWithPagination() throws Exception {
            Map<String, Object> t1 = new HashMap<>();
            t1.put("id", "t-1");
            t1.put("primaryColor", "#0066FF");
            Map<String, Object> response = new HashMap<>();
            response.put("results", Collections.singletonList(t1));
            response.put("totalRecords", 1);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            PaginationParams options = new PaginationParams();
            options.setQuery("sales");
            options.setLimit(10);
            options.setOffset(0);
            QuoteTemplateListResponse result = client.turboQuote().listTemplates(options);

            assertEquals(1, result.getResults().size());

            RecordedRequest recorded = server.takeRequest();
            assertTrue(recorded.getPath().contains("query=sales"));
            assertTrue(recorded.getPath().contains("limit=10"));
        }

        @Test
        @DisplayName("should get a template by ID and unwrap result")
        void getTemplateById() throws Exception {
            Map<String, Object> response = new HashMap<>();
            Map<String, Object> templateMap = new HashMap<>();
            templateMap.put("id", "t-1");
            templateMap.put("primaryColor", "#0066FF");
            response.put("result", templateMap);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            QuoteTemplate result = client.turboQuote().getTemplateById("t-1");

            assertEquals("t-1", result.getId());
        }

        @Test
        @DisplayName("should get the org template and unwrap result")
        void getTemplate() throws Exception {
            Map<String, Object> response = new HashMap<>();
            Map<String, Object> templateMap = new HashMap<>();
            templateMap.put("id", "t-1");
            templateMap.put("primaryColor", "#0066FF");
            response.put("result", templateMap);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            QuoteTemplate result = client.turboQuote().getTemplate();

            assertEquals("t-1", result.getId());

            RecordedRequest recorded = server.takeRequest();
            assertTrue(recorded.getPath().endsWith("/v1/quote-template"));
        }

        @Test
        @DisplayName("should create a template and unwrap result")
        void createTemplate() throws Exception {
            Map<String, Object> response = new HashMap<>();
            Map<String, Object> templateMap = new HashMap<>();
            templateMap.put("id", "t-1");
            templateMap.put("primaryColor", "#0066FF");
            response.put("result", templateMap);
            response.put("message", "Template created successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            CreateQuoteTemplateRequest request = new CreateQuoteTemplateRequest();
            request.setPrimaryColor("#0066FF");
            request.setSenderName("Sales");
            QuoteTemplate result = client.turboQuote().createTemplate(request);

            assertEquals("t-1", result.getId());
        }

        @Test
        @DisplayName("should update a template and unwrap result")
        void updateTemplate() throws Exception {
            Map<String, Object> response = new HashMap<>();
            Map<String, Object> templateMap = new HashMap<>();
            templateMap.put("id", "t-1");
            templateMap.put("primaryColor", "#FF0000");
            response.put("result", templateMap);
            response.put("message", "Template updated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            UpdateQuoteTemplateRequest request = new UpdateQuoteTemplateRequest();
            request.setPrimaryColor("#FF0000");
            QuoteTemplate result = client.turboQuote().updateTemplate("t-1", request);

            assertEquals("#FF0000", result.getPrimaryColor());
        }

        @Test
        @DisplayName("should delete a template")
        void deleteTemplate() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Template deleted successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            SuccessResponse result = client.turboQuote().deleteTemplate("t-1");

            assertEquals("Template deleted successfully", result.getMessage());
        }
    }

    // ============================================
    // TYPES / CATEGORIES
    // ============================================

    @Nested
    @DisplayName("Types / Categories")
    class Types {

        @Test
        @DisplayName("should list types by category")
        void listTypes() throws Exception {
            Map<String, Object> typeMap = new HashMap<>();
            typeMap.put("id", "type-1");
            typeMap.put("name", "Technology");

            Map<String, Object> response = new HashMap<>();
            response.put("results", Collections.singletonList(typeMap));
            response.put("totalRecords", 1);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            ListTypesOptions options = new ListTypesOptions();
            options.setCategoryType(CategoryType.COMPANY_INDUSTRY);
            QuoteTypeListResponse result = client.turboQuote().listTypes(options);

            assertEquals(1, result.getResults().size());

            RecordedRequest recorded = server.takeRequest();
            assertTrue(recorded.getPath().contains("categoryType=company_industry"));
        }

        @Test
        @DisplayName("should list types without options")
        void listTypesNoOptions() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("results", Collections.emptyList());
            response.put("totalRecords", 0);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            QuoteTypeListResponse result = client.turboQuote().listTypes();

            assertEquals(0, result.getResults().size());
        }

        @Test
        @DisplayName("should create a type and unwrap result")
        void createType() throws Exception {
            Map<String, Object> typeMap = new HashMap<>();
            typeMap.put("id", "type-1");
            typeMap.put("name", "SaaS");
            typeMap.put("categoryType", "product_category");
            Map<String, Object> response = new HashMap<>();
            response.put("result", typeMap);
            response.put("message", "Type created successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            CreateQuoteTypeRequest request = new CreateQuoteTypeRequest();
            request.setName("SaaS");
            request.setCategoryType(CategoryType.PRODUCT_CATEGORY);
            QuoteType result = client.turboQuote().createType(request);

            assertEquals("SaaS", result.getName());
        }

        @Test
        @DisplayName("should update a type and unwrap result")
        void updateType() throws Exception {
            Map<String, Object> typeMap = new HashMap<>();
            typeMap.put("id", "type-1");
            typeMap.put("name", "Software");
            Map<String, Object> response = new HashMap<>();
            response.put("result", typeMap);
            response.put("message", "Type updated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            UpdateQuoteTypeRequest request = new UpdateQuoteTypeRequest();
            request.setName("Software");
            QuoteType result = client.turboQuote().updateType("type-1", request);

            assertEquals("Software", result.getName());
        }

        @Test
        @DisplayName("should delete a type")
        void deleteType() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Type deleted successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            SuccessResponse result = client.turboQuote().deleteType("type-1");

            assertEquals("Type deleted successfully", result.getMessage());
        }
    }

    // ============================================
    // CONVENIENCE — createAndSend
    // ============================================

    @Nested
    @DisplayName("createAndSend")
    class CreateAndSend {

        @Test
        @DisplayName("should create a quote, add items, and send in one call")
        void createAndSendWithItems() throws Exception {
            // 1. Create quote response
            Map<String, Object> createResponse = new HashMap<>();
            createResponse.put("result", createQuoteMap("q-1", "Enterprise License", "draft"));
            createResponse.put("message", "Quote created successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(createResponse)));

            // 2. Add items response
            Map<String, Object> itemsResponse = new HashMap<>();
            Map<String, Object> itemMap = new HashMap<>();
            itemMap.put("id", "li-1");
            itemsResponse.put("results", Collections.singletonList(itemMap));
            itemsResponse.put("message", "1 line item(s) added successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(itemsResponse)));

            // 3. Send response
            Map<String, Object> sendResponse = new HashMap<>();
            sendResponse.put("result", createQuoteMap("q-1", "Enterprise License", "sent"));
            sendResponse.put("message", "Sent");
            server.enqueue(new MockResponse().setBody(wrapInData(sendResponse)));

            // Build request
            CreateAndSendRequest request = new CreateAndSendRequest();
            request.setName("Enterprise License");
            request.setCompanyId("c-1");
            request.setContactId("ct-1");

            AddLineItemRequest item = new AddLineItemRequest();
            item.setProductId("p-1");
            item.setProductName("Widget");
            item.setUnitPrice(99.0);
            item.setBillingFrequency("monthly");
            item.setQuantity(10.0);
            request.setItems(Collections.singletonList(item));

            SendQuoteRequest sendReq = new SendQuoteRequest();
            sendReq.setCcEmails(Collections.singletonList("admin@example.com"));
            request.setSend(sendReq);

            CreateAndSendResponse result = client.turboQuote().createAndSend(request);

            assertEquals("sent", result.getQuote().getStatus());

            // Verify 3 requests were made
            RecordedRequest req1 = server.takeRequest();
            assertEquals("POST", req1.getMethod());
            assertTrue(req1.getPath().endsWith("/v1/quotes"));

            RecordedRequest req2 = server.takeRequest();
            assertEquals("POST", req2.getMethod());
            assertTrue(req2.getPath().endsWith("/v1/quotes/q-1/items"));

            RecordedRequest req3 = server.takeRequest();
            assertEquals("POST", req3.getMethod());
            assertTrue(req3.getPath().endsWith("/v1/quotes/q-1/send"));
        }

        @Test
        @DisplayName("should pass all quote fields through to POST /v1/quotes and exclude convenience fields")
        void createAndSendPassesThroughAllQuoteFields() throws Exception {
            // 1. Create quote response
            Map<String, Object> createResponse = new HashMap<>();
            createResponse.put("result", createQuoteMap("q-1", "Full Fields Quote", "draft"));
            createResponse.put("message", "Quote created successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(createResponse)));

            // 2. Add items response
            Map<String, Object> itemsResponse = new HashMap<>();
            Map<String, Object> itemMap = new HashMap<>();
            itemMap.put("id", "li-1");
            itemsResponse.put("results", Collections.singletonList(itemMap));
            itemsResponse.put("message", "1 line item(s) added successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(itemsResponse)));

            // 3. Send response
            Map<String, Object> sendResponse = new HashMap<>();
            sendResponse.put("result", createQuoteMap("q-1", "Full Fields Quote", "sent"));
            sendResponse.put("message", "Sent");
            server.enqueue(new MockResponse().setBody(wrapInData(sendResponse)));

            // Build request with ALL possible quote fields
            CreateAndSendRequest request = new CreateAndSendRequest();
            request.setName("Full Fields Quote");
            request.setCompanyId("c-1");
            request.setContactId("ct-1");
            request.setCurrency(com.turbodocx.models.quote.Currency.USD);
            request.setTermDays(30);
            request.setRenewalPeriod(RenewalPeriod.ANNUALLY);
            request.setValidUntil("2026-12-31");
            request.setTaxRate(8.5);
            request.setPriceBookId("pb-1");

            AddLineItemRequest item = new AddLineItemRequest();
            item.setProductId("p-1");
            item.setProductName("Widget");
            item.setUnitPrice(99.0);
            item.setBillingFrequency("monthly");
            item.setQuantity(10.0);
            request.setItems(Collections.singletonList(item));

            SendQuoteRequest sendReq = new SendQuoteRequest();
            sendReq.setCcEmails(Collections.singletonList("admin@example.com"));
            request.setSend(sendReq);

            client.turboQuote().createAndSend(request);

            // Inspect the POST /v1/quotes body
            RecordedRequest createReq = server.takeRequest();
            assertEquals("POST", createReq.getMethod());
            assertTrue(createReq.getPath().endsWith("/v1/quotes"));
            String body = createReq.getBody().readUtf8();

            // All quote fields MUST be present in the quote creation body
            assertTrue(body.contains("\"name\":\"Full Fields Quote\""), "name should be in body");
            assertTrue(body.contains("\"companyId\":\"c-1\""), "companyId should be in body");
            assertTrue(body.contains("\"contactId\":\"ct-1\""), "contactId should be in body");
            assertTrue(body.contains("\"currency\":\"USD\""), "currency should be in body");
            assertTrue(body.contains("\"termDays\":30"), "termDays should be in body");
            assertTrue(body.contains("\"renewalPeriod\":\"annually\""), "renewalPeriod should be in body");
            assertTrue(body.contains("\"validUntil\":\"2026-12-31\""), "validUntil should be in body");
            assertTrue(body.contains("\"taxRate\":8.5"), "taxRate should be in body");
            assertTrue(body.contains("\"priceBookId\":\"pb-1\""), "priceBookId should be in body");

            // Convenience fields MUST NOT be in the quote creation body
            assertFalse(body.contains("\"items\""), "items should NOT be in quote creation body");
            assertFalse(body.contains("\"bundleItems\""), "bundleItems should NOT be in quote creation body");
            assertFalse(body.contains("\"send\""), "send should NOT be in quote creation body");
        }

        @Test
        @DisplayName("should create and send without items")
        void createAndSendWithoutItems() throws Exception {
            // 1. Create quote
            Map<String, Object> createResponse = new HashMap<>();
            createResponse.put("result", createQuoteMap("q-1", "Simple Quote", "draft"));
            createResponse.put("message", "Quote created successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(createResponse)));

            // 2. Send
            Map<String, Object> sendResponse = new HashMap<>();
            sendResponse.put("result", createQuoteMap("q-1", "Simple Quote", "sent"));
            sendResponse.put("message", "Sent");
            server.enqueue(new MockResponse().setBody(wrapInData(sendResponse)));

            CreateAndSendRequest request = new CreateAndSendRequest();
            request.setName("Simple Quote");
            request.setCompanyId("c-1");
            request.setContactId("ct-1");

            CreateAndSendResponse result = client.turboQuote().createAndSend(request);

            assertEquals("sent", result.getQuote().getStatus());

            // Only 2 requests (no items)
            RecordedRequest req1 = server.takeRequest();
            assertTrue(req1.getPath().endsWith("/v1/quotes"));
            RecordedRequest req2 = server.takeRequest();
            assertTrue(req2.getPath().endsWith("/v1/quotes/q-1/send"));
        }

        @Test
        @DisplayName("should create and send with bundle items")
        void createAndSendWithBundleItems() throws Exception {
            // 1. Create quote
            Map<String, Object> createResponse = new HashMap<>();
            createResponse.put("result", createQuoteMap("q-1", "Bundle Quote", "draft"));
            createResponse.put("message", "Quote created successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(createResponse)));

            // 2. Add bundles
            Map<String, Object> bundleResponse = new HashMap<>();
            Map<String, Object> bundleItem = new HashMap<>();
            bundleItem.put("id", "li-1");
            bundleItem.put("lineItemType", "bundle");
            bundleResponse.put("results", Collections.singletonList(bundleItem));
            bundleResponse.put("message", "1 bundle(s) added successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(bundleResponse)));

            // 3. Send
            Map<String, Object> sendResponse = new HashMap<>();
            sendResponse.put("result", createQuoteMap("q-1", "Bundle Quote", "sent"));
            sendResponse.put("message", "Sent");
            server.enqueue(new MockResponse().setBody(wrapInData(sendResponse)));

            CreateAndSendRequest request = new CreateAndSendRequest();
            request.setName("Bundle Quote");
            request.setCompanyId("c-1");
            request.setContactId("ct-1");

            AddBundleLineItemRequest bundle = new AddBundleLineItemRequest();
            bundle.setBundleId("b-1");
            bundle.setBundleName("Starter Pack");
            request.setBundleItems(Collections.singletonList(bundle));

            CreateAndSendResponse result = client.turboQuote().createAndSend(request);

            assertEquals("sent", result.getQuote().getStatus());

            server.takeRequest(); // create
            RecordedRequest req2 = server.takeRequest();
            assertTrue(req2.getPath().endsWith("/v1/quotes/q-1/items/bundle"));
        }
    }

    // ============================================
    // ERROR HANDLING
    // ============================================

    @Nested
    @DisplayName("Error Handling")
    class ErrorHandling {

        @Test
        @DisplayName("should throw NotFoundException for 404")
        void notFoundError() {
            server.enqueue(new MockResponse()
                    .setResponseCode(404)
                    .setBody("{\"message\":\"Quote not found\"}"));

            assertThrows(TurboDocxException.NotFoundException.class, () ->
                    client.turboQuote().getQuote("invalid"));
        }

        @Test
        @DisplayName("should throw ValidationException for 400")
        void validationError() {
            server.enqueue(new MockResponse()
                    .setResponseCode(400)
                    .setBody("{\"message\":\"Name is required\"}"));

            CreateQuoteRequest request = new CreateQuoteRequest();
            request.setName("");
            request.setCompanyId("c-1");
            request.setContactId("ct-1");

            assertThrows(TurboDocxException.ValidationException.class, () ->
                    client.turboQuote().createQuote(request));
        }

        @Test
        @DisplayName("should throw AuthenticationException for 401")
        void authError() {
            server.enqueue(new MockResponse()
                    .setResponseCode(401)
                    .setBody("{\"message\":\"Invalid API key\"}"));

            assertThrows(TurboDocxException.AuthenticationException.class, () ->
                    client.turboQuote().listQuotes());
        }
    }

    // ============================================
    // PATCH NULL FIELD TRACKING
    // ============================================

    @Nested
    @DisplayName("Patch Null Field Tracking")
    class PatchNullFieldTracking {

        @Test
        @DisplayName("should track explicitly set fields")
        void trackableRequest_shouldTrackSetFields() {
            UpdateQuoteRequest request = new UpdateQuoteRequest();
            assertTrue(request.getSetFields().isEmpty(), "New request should have no set fields");

            request.setPriceBookId(null);
            assertTrue(request.getSetFields().contains("priceBookId"),
                    "After setPriceBookId(null), setFields should contain 'priceBookId', got: " + request.getSetFields());
            assertEquals(1, request.getSetFields().size(),
                    "Should have exactly 1 set field");

            request.setName("test");
            assertTrue(request.getSetFields().contains("name"),
                    "After setName, setFields should contain 'name'");
            assertEquals(2, request.getSetFields().size(),
                    "Should have exactly 2 set fields");
        }

        @Test
        @DisplayName("should include explicitly null fields in PATCH body")
        void updateQuote_shouldIncludeExplicitlyNullFields() throws Exception {
            Map<String, Object> response = new HashMap<>();
            Map<String, Object> quoteMap = createQuoteMap("q-1", "Test", "draft");
            response.put("result", quoteMap);
            response.put("message", "Quote updated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            UpdateQuoteRequest request = new UpdateQuoteRequest();
            request.setPriceBookId(null);

            client.turboQuote().updateQuote("q-1", request);

            RecordedRequest recorded = server.takeRequest();
            String body = recorded.getBody().readUtf8();
            assertTrue(body.contains("\"priceBookId\":null"),
                    "Explicitly null priceBookId should appear as null in request body, got: " + body);
        }

        @Test
        @DisplayName("should include explicitly null fields in multipart PATCH body")
        void updateProduct_shouldIncludeExplicitlyNullFieldsInMultipart() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createProductMap("p-1", "Widget"));
            response.put("message", "Product updated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            // JPEG magic bytes
            byte[] jpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};

            UpdateProductRequest request = new UpdateProductRequest();
            request.setName("Widget");
            request.setDescription(null); // explicitly clear description
            request.setImages(new byte[][]{jpegBytes});

            client.turboQuote().updateProduct("p-1", request);

            RecordedRequest recorded = server.takeRequest();
            String body = recorded.getBody().readUtf8();
            assertTrue(body.contains("\"description\":null"),
                    "Explicitly null description should appear in multipart data part, got body:\n" + body);
        }

        @Test
        @DisplayName("should omit unset fields from PATCH body")
        void updateQuote_shouldOmitUnsetFields() throws Exception {
            Map<String, Object> response = new HashMap<>();
            Map<String, Object> quoteMap = createQuoteMap("q-1", "new name", "draft");
            response.put("result", quoteMap);
            response.put("message", "Quote updated successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            UpdateQuoteRequest request = new UpdateQuoteRequest();
            request.setName("new name");

            client.turboQuote().updateQuote("q-1", request);

            RecordedRequest recorded = server.takeRequest();
            String body = recorded.getBody().readUtf8();
            assertTrue(body.contains("\"name\":\"new name\""),
                    "Set field 'name' should be in request body, got: " + body);
            assertFalse(body.contains("\"priceBookId\""),
                    "Unset field 'priceBookId' should NOT be in request body, got: " + body);
            assertFalse(body.contains("\"taxRate\""),
                    "Unset field 'taxRate' should NOT be in request body, got: " + body);
        }
    }

    // ============================================
    // IMAGE MIME TYPE DETECTION
    // ============================================

    @Nested
    @DisplayName("Image MIME Type Detection")
    class ImageMimeTypeDetection {

        @Test
        @DisplayName("should detect PNG MIME type from magic bytes")
        void createProduct_shouldDetectPngMimeType() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createProductMap("p-1", "Widget"));
            response.put("message", "Product created successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            // PNG magic bytes: 0x89 0x50 0x4E 0x47
            byte[] pngBytes = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

            CreateProductRequest request = new CreateProductRequest();
            request.setName("Widget");
            request.setListPrice(10.0);
            request.setBillingFrequency("monthly");
            request.setCategoryId("cat-1");
            request.setImages(new byte[][]{pngBytes});

            client.turboQuote().createProduct(request);

            RecordedRequest recorded = server.takeRequest();
            String body = recorded.getBody().readUtf8();
            assertTrue(body.contains("Content-Type: image/png"),
                    "PNG image should use image/png content type, got body:\n" + body);
            assertTrue(body.contains("filename=\"image.png\""),
                    "PNG image should have filename image.png, got body:\n" + body);
        }

        @Test
        @DisplayName("should detect JPEG MIME type from magic bytes")
        void createProduct_shouldDetectJpegMimeType() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createProductMap("p-1", "Widget"));
            response.put("message", "Product created successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            // JPEG magic bytes: 0xFF 0xD8 0xFF
            byte[] jpegBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0};

            CreateProductRequest request = new CreateProductRequest();
            request.setName("Widget");
            request.setListPrice(10.0);
            request.setBillingFrequency("monthly");
            request.setCategoryId("cat-1");
            request.setImages(new byte[][]{jpegBytes});

            client.turboQuote().createProduct(request);

            RecordedRequest recorded = server.takeRequest();
            String body = recorded.getBody().readUtf8();
            assertTrue(body.contains("Content-Type: image/jpeg"),
                    "JPEG image should use image/jpeg content type, got body:\n" + body);
            assertTrue(body.contains("filename=\"image.jpg\""),
                    "JPEG image should have filename image.jpg, got body:\n" + body);
        }

        @Test
        @DisplayName("should fall back to octet-stream for unknown bytes")
        void createProduct_shouldFallbackToOctetStream() throws Exception {
            Map<String, Object> response = new HashMap<>();
            response.put("result", createProductMap("p-1", "Widget"));
            response.put("message", "Product created successfully");
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            // Unknown magic bytes
            byte[] unknownBytes = new byte[]{0x00, 0x01, 0x02, 0x03, 0x04, 0x05};

            CreateProductRequest request = new CreateProductRequest();
            request.setName("Widget");
            request.setListPrice(10.0);
            request.setBillingFrequency("monthly");
            request.setCategoryId("cat-1");
            request.setImages(new byte[][]{unknownBytes});

            client.turboQuote().createProduct(request);

            RecordedRequest recorded = server.takeRequest();
            String body = recorded.getBody().readUtf8();
            assertTrue(body.contains("Content-Type: application/octet-stream"),
                    "Unknown bytes should use application/octet-stream content type, got body:\n" + body);
            assertTrue(body.contains("filename=\"image\""),
                    "Unknown image should have filename 'image' (no extension), got body:\n" + body);
        }
    }

    // ============================================
    // NORMALIZER INTEGRATION
    // ============================================

    @Nested
    @DisplayName("Normalizer Integration")
    class NormalizerIntegration {

        @Test
        @DisplayName("should normalize boolean tinyint fields in responses")
        void normalizeBooleanFields() throws Exception {
            Map<String, Object> quoteMap = new HashMap<>();
            quoteMap.put("id", "q-1");
            quoteMap.put("name", "Test");
            quoteMap.put("status", "draft");
            quoteMap.put("isActive", 1);  // MySQL tinyint

            Map<String, Object> response = new HashMap<>();
            response.put("result", quoteMap);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            Quote result = client.turboQuote().getQuote("q-1");
            assertTrue(result.getIsActive());
        }

        @Test
        @DisplayName("should normalize decimal string fields in responses")
        void normalizeDecimalFields() throws Exception {
            Map<String, Object> quoteMap = new HashMap<>();
            quoteMap.put("id", "q-1");
            quoteMap.put("name", "Test");
            quoteMap.put("status", "draft");
            quoteMap.put("grandTotal", "1234.56");  // MySQL decimal string
            quoteMap.put("taxRate", "8.50");
            quoteMap.put("subtotalMonthly", "500.00");

            Map<String, Object> response = new HashMap<>();
            response.put("result", quoteMap);
            server.enqueue(new MockResponse().setBody(wrapInData(response)));

            Quote result = client.turboQuote().getQuote("q-1");
            assertEquals(1234.56, result.getGrandTotal(), 0.001);
            assertEquals(8.5, result.getTaxRate(), 0.001);
            assertEquals(500.0, result.getSubtotalMonthly(), 0.001);
        }
    }

    // ============================================
    // ENUM TYPES
    // ============================================

    @Nested
    @DisplayName("Enum Types")
    class EnumTypes {

        @Test
        @DisplayName("should have correct CategoryType enum values")
        public void testCategoryTypeEnumValues() {
            assertEquals("product_category", CategoryType.PRODUCT_CATEGORY.getValue());
            assertEquals("pricebook_type", CategoryType.PRICEBOOK_TYPE.getValue());
            assertEquals("company_industry", CategoryType.COMPANY_INDUSTRY.getValue());
            assertEquals("bundle_category", CategoryType.BUNDLE_CATEGORY.getValue());
            assertEquals(4, CategoryType.values().length);
        }

        @Test
        @DisplayName("should have correct RenewalPeriod enum values")
        public void testRenewalPeriodEnumValues() {
            assertEquals("weekly", RenewalPeriod.WEEKLY.getValue());
            assertEquals("monthly", RenewalPeriod.MONTHLY.getValue());
            assertEquals("quarterly", RenewalPeriod.QUARTERLY.getValue());
            assertEquals("annually", RenewalPeriod.ANNUALLY.getValue());
            assertEquals(4, RenewalPeriod.values().length);
        }

        @Test
        @DisplayName("should have correct Currency enum values")
        public void testCurrencyEnumValues() {
            assertEquals("USD", com.turbodocx.models.quote.Currency.USD.getValue());
            assertEquals("EUR", com.turbodocx.models.quote.Currency.EUR.getValue());
            assertEquals("GBP", com.turbodocx.models.quote.Currency.GBP.getValue());
            assertEquals("CAD", com.turbodocx.models.quote.Currency.CAD.getValue());
            assertEquals("INR", com.turbodocx.models.quote.Currency.INR.getValue());
            assertEquals("AUD", com.turbodocx.models.quote.Currency.AUD.getValue());
            assertEquals(6, com.turbodocx.models.quote.Currency.values().length);
        }

        @Test
        @DisplayName("should have correct BundleItemStatus enum values")
        public void testBundleItemStatusEnumValues() {
            assertEquals("active", BundleItemStatus.ACTIVE.getValue());
            assertEquals("product_deleted", BundleItemStatus.PRODUCT_DELETED.getValue());
            assertEquals("product_unavailable", BundleItemStatus.PRODUCT_UNAVAILABLE.getValue());
            assertEquals("currency_mismatch", BundleItemStatus.CURRENCY_MISMATCH.getValue());
            assertEquals(4, BundleItemStatus.values().length);
        }

        @Test
        @DisplayName("should serialize enums to JSON correctly with Gson")
        public void testEnumGsonSerialization() {
            Gson gson = new Gson();
            assertEquals("\"product_category\"", gson.toJson(CategoryType.PRODUCT_CATEGORY));
            assertEquals("\"monthly\"", gson.toJson(RenewalPeriod.MONTHLY));
            assertEquals("\"USD\"", gson.toJson(com.turbodocx.models.quote.Currency.USD));
            assertEquals("\"active\"", gson.toJson(BundleItemStatus.ACTIVE));
        }

        @Test
        @DisplayName("should deserialize enums from JSON correctly with Gson")
        public void testEnumGsonDeserialization() {
            Gson gson = new Gson();
            assertEquals(CategoryType.PRODUCT_CATEGORY, gson.fromJson("\"product_category\"", CategoryType.class));
            assertEquals(com.turbodocx.models.quote.Currency.EUR, gson.fromJson("\"EUR\"", com.turbodocx.models.quote.Currency.class));
            assertEquals(RenewalPeriod.ANNUALLY, gson.fromJson("\"annually\"", RenewalPeriod.class));
            assertEquals(BundleItemStatus.PRODUCT_DELETED, gson.fromJson("\"product_deleted\"", BundleItemStatus.class));
        }
    }

    // ============================================
    // TEST HELPERS
    // ============================================

    private Map<String, Object> createQuoteMap(String id, String name, String status) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id);
        map.put("name", name);
        map.put("status", status);
        map.put("quoteNumber", "Q-2026-00001");
        return map;
    }

    private Map<String, Object> createProductMap(String id, String name) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id);
        map.put("name", name);
        return map;
    }

    private Map<String, Object> createPriceBookMap(String id, String name) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id);
        map.put("name", name);
        return map;
    }

    private Map<String, Object> createBundleMap(String id, String name) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id);
        map.put("name", name);
        return map;
    }

    private Map<String, Object> createCompanyMap(String id, String name) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id);
        map.put("name", name);
        return map;
    }

    private Map<String, Object> createContactMap(String id, String name) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", id);
        map.put("name", name);
        return map;
    }
}
