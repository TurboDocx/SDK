package com.turbodocx;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.turbodocx.models.quote.*;
import okhttp3.HttpUrl;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.*;

import java.io.IOException;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * TurboQuote: list sorting and filters, the quote summary / creators / next number reads,
 * open quotes, product quote images, custom line item images, named duplicates, company
 * email and price book reset.
 */
class TurboQuoteListsAndImagesTest {

    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00};
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00};

    private MockWebServer server;
    private TurboQuote quote;
    private final Gson gson = new Gson();

    @BeforeEach
    void setUp() throws IOException {
        server = new MockWebServer();
        server.start();
        quote = new TurboQuoteClient.Builder()
                .apiKey("test-api-key")
                .orgId("test-org-id")
                .baseUrl(server.url("/").toString())
                .build()
                .turboQuote();
    }

    @AfterEach
    void tearDown() throws IOException {
        server.shutdown();
    }

    private void respond(Object body) {
        JsonObject wrapper = new JsonObject();
        wrapper.add("data", gson.toJsonTree(body));
        server.enqueue(new MockResponse().setBody(gson.toJson(wrapper)).addHeader("Content-Type", "application/json"));
    }

    private static Map<String, Object> map(Object... keyValues) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < keyValues.length; i += 2) {
            m.put((String) keyValues[i], keyValues[i + 1]);
        }
        return m;
    }

    private static Map<String, Object> emptyList() {
        return map("results", new ArrayList<>(), "totalRecords", 0);
    }

    private static Map<String, List<String>> query(RecordedRequest request) {
        HttpUrl url = request.getRequestUrl();
        Map<String, List<String>> params = new LinkedHashMap<>();
        for (String name : url.queryParameterNames()) {
            params.put(name, url.queryParameterValues(name));
        }
        return params;
    }

    // ============================================
    // SORTING AND FILTERS
    // ============================================

    @Test
    void listQuotesSendsSortNewFiltersAndSummaryCurrency() throws Exception {
        respond(emptyList());

        ListQuotesOptions options = new ListQuotesOptions();
        options.setSortBy("total");
        options.setSortDirection("asc");
        options.setStatuses(Arrays.asList("sent", "expired"));
        options.setCompanyIds(Arrays.asList("c-1", "c-2"));
        options.setCurrencies(Arrays.asList("USD", "EUR"));
        options.setCreatedBy(Collections.singletonList("u-1"));
        options.setCreatedByApiKeys(true);
        options.setValidUntilWindow("thisMonth");
        options.setValidUntilFrom("2026-10-01");
        options.setValidUntilTo("2026-10-31");
        options.setSummaryCurrency("EUR");
        quote.listQuotes(options);

        RecordedRequest request = server.takeRequest();
        assertEquals("/v1/quotes", request.getRequestUrl().encodedPath());
        Map<String, List<String>> params = query(request);
        assertEquals(Arrays.asList("total"), params.get("sortBy"));
        assertEquals(Arrays.asList("asc"), params.get("sortDirection"));
        assertEquals(Arrays.asList("sent", "expired"), params.get("statuses"));
        assertEquals(Arrays.asList("c-1", "c-2"), params.get("companyIds"));
        assertEquals(Arrays.asList("USD", "EUR"), params.get("currencies"));
        assertEquals(Arrays.asList("u-1"), params.get("createdBy"));
        assertEquals(Arrays.asList("true"), params.get("createdByApiKeys"));
        assertEquals(Arrays.asList("thisMonth"), params.get("validUntilWindow"));
        assertEquals(Arrays.asList("2026-10-01"), params.get("validUntilFrom"));
        assertEquals(Arrays.asList("2026-10-31"), params.get("validUntilTo"));
        assertEquals(Arrays.asList("EUR"), params.get("summaryCurrency"));
        assertEquals(11, params.size());
    }

    @Test
    void listQuotesReturnsCountsSummaryAndExpiry() throws Exception {
        respond(map(
                "results", Collections.singletonList(map("id", "q-1", "status", "sent", "isExpired", true,
                        "isSignatureExpired", false, "lineItemCount", 3)),
                "totalRecords", 1,
                "statusCounts", map("all", 1, "sent", 1, "expired", 1),
                "summary", map("currency", "USD",
                        "openPipeline", map("total", 1200.5, "count", 2),
                        "winRate", map("percent", null, "accepted", 0, "declined", 0, "windowDays", 90))));

        QuoteListResponse result = quote.listQuotes();

        assertEquals(1, result.getStatusCounts().getExpired());
        assertEquals(0, result.getStatusCounts().getDraft());
        assertNull(result.getSummary().getWinRate().getPercent());
        assertEquals(90, result.getSummary().getWinRate().getWindowDays());
        assertEquals(1200.5, result.getSummary().getOpenPipeline().getTotal());
        assertTrue(result.getResults().get(0).getIsExpired());
        assertFalse(result.getResults().get(0).getIsSignatureExpired());
        assertEquals(3, result.getResults().get(0).getLineItemCount());
    }

    @Test
    void listProductsSendsSeveralValuesAndSort() throws Exception {
        respond(emptyList());

        ListProductsOptions options = new ListProductsOptions();
        options.setBillingFrequencies(Arrays.asList("monthly", "annual"));
        options.setCurrencies(Arrays.asList("USD", "INR"));
        options.setSortBy("listPrice");
        options.setSortDirection("desc");
        quote.listProducts(options);

        Map<String, List<String>> params = query(server.takeRequest());
        assertEquals(Arrays.asList("monthly", "annual"), params.get("billingFrequency"));
        assertEquals(Arrays.asList("USD", "INR"), params.get("currency"));
        assertEquals(Arrays.asList("listPrice"), params.get("sortBy"));
        assertEquals(Arrays.asList("desc"), params.get("sortDirection"));
    }

    @Test
    void listPriceBooksSendsSort() throws Exception {
        respond(map("results", Collections.singletonList(map("id", "pb-1", "overrideCount", 2)), "totalRecords", 1));

        ListPriceBooksOptions options = new ListPriceBooksOptions();
        options.setSortBy("overrideCount");
        options.setSortDirection("desc");
        PriceBookListResponse result = quote.listPriceBooks(options);

        Map<String, List<String>> params = query(server.takeRequest());
        assertEquals(Arrays.asList("overrideCount"), params.get("sortBy"));
        assertEquals(Arrays.asList("desc"), params.get("sortDirection"));
        assertEquals(2, result.getResults().get(0).getOverrideCount());
    }

    @Test
    void listBundlesSendsSeveralCurrenciesAndSort() throws Exception {
        respond(map("results", Collections.singletonList(map("id", "b-1", "itemCount", 2,
                "billingTotals", map("monthly", 100, "one-time", 500))), "totalRecords", 1));

        ListBundlesOptions options = new ListBundlesOptions();
        options.setCurrencies(Arrays.asList("USD", "EUR"));
        options.setSortBy("itemCount");
        options.setSortDirection("asc");
        BundleListResponse result = quote.listBundles(options);

        Map<String, List<String>> params = query(server.takeRequest());
        assertEquals(Arrays.asList("USD", "EUR"), params.get("currency"));
        assertEquals(Arrays.asList("itemCount"), params.get("sortBy"));
        assertEquals(2, result.getResults().get(0).getItemCount());
        assertEquals(500.0, result.getResults().get(0).getBillingTotals().get("one-time"));
    }

    @Test
    void listCompaniesSendsSort() throws Exception {
        respond(map("results", Collections.singletonList(map("id", "c-1", "email", "ap@acme.test")), "totalRecords", 1));

        ListCompaniesOptions options = new ListCompaniesOptions();
        options.setSortBy("contactCount");
        options.setSortDirection("desc");
        CompanyListResponse result = quote.listCompanies(options);

        Map<String, List<String>> params = query(server.takeRequest());
        assertEquals(Arrays.asList("contactCount"), params.get("sortBy"));
        assertEquals("ap@acme.test", result.getResults().get(0).getEmail());
    }

    @Test
    void listContactsSendsSeveralCompaniesAndSort() throws Exception {
        respond(emptyList());

        ListContactsOptions options = new ListContactsOptions();
        options.setCompanyIds(Arrays.asList("c-1", "c-2"));
        options.setSortBy("name");
        options.setSortDirection("asc");
        quote.listContacts(options);

        Map<String, List<String>> params = query(server.takeRequest());
        assertEquals(Arrays.asList("c-1", "c-2"), params.get("companyIds"));
        assertEquals(Arrays.asList("name"), params.get("sortBy"));
        assertEquals(Arrays.asList("asc"), params.get("sortDirection"));
    }

    @Test
    void listCompanyContactsSendsSortAndReturnsContactCount() throws Exception {
        respond(map("results", new ArrayList<>(), "totalRecords", 0,
                "company", map("id", "c-1", "name", "Acme", "contactCount", 1)));

        ListCompanyContactsOptions options = new ListCompanyContactsOptions();
        options.setSortBy("createdOn");
        options.setSortDirection("desc");
        ContactListResponse result = quote.listCompanyContacts("c-1", options);

        RecordedRequest request = server.takeRequest();
        assertEquals("/v1/companies/c-1/contacts", request.getRequestUrl().encodedPath());
        assertEquals(Arrays.asList("createdOn"), query(request).get("sortBy"));
        assertEquals(1, result.getCompany().getContactCount());
    }

    @Test
    void listTypesSendsSort() throws Exception {
        respond(emptyList());

        ListTypesOptions options = new ListTypesOptions();
        options.setCategoryType(CategoryType.PRODUCT_CATEGORY);
        options.setSortBy("usageCount");
        options.setSortDirection("desc");
        quote.listTypes(options);

        Map<String, List<String>> params = query(server.takeRequest());
        assertEquals(Arrays.asList("usageCount"), params.get("sortBy"));
        assertEquals(Arrays.asList("desc"), params.get("sortDirection"));
    }

    // ============================================
    // QUOTE READS
    // ============================================

    @Test
    void getQuoteSummary() throws Exception {
        respond(map("summary", map("currency", "EUR", "openPipeline", map("total", 10, "count", 1))));

        QuoteSummaryOptions options = new QuoteSummaryOptions();
        options.setCurrencies(Arrays.asList("EUR", "USD"));
        options.setSummaryCurrency("EUR");
        QuoteSummary result = quote.getQuoteSummary(options);

        RecordedRequest request = server.takeRequest();
        assertEquals("/v1/quotes/summary", request.getRequestUrl().encodedPath());
        assertEquals(Arrays.asList("EUR", "USD"), query(request).get("currencies"));
        assertEquals("EUR", result.getCurrency());
        assertEquals(1, result.getOpenPipeline().getCount());
    }

    @Test
    void listQuoteCreators() throws Exception {
        respond(map("results", Arrays.asList(
                map("id", "u-1", "name", "Ana Lee", "email", "ana@acme.test", "isAPIKey", false, "apiKeyDeleted", false),
                map("id", "u-2", "name", "Zapier key", "email", null, "isAPIKey", true, "apiKeyDeleted", true))));

        List<Quote.QuoteCreator> result = quote.listQuoteCreators();

        assertTrue(server.takeRequest().getPath().endsWith("/v1/quotes/creators"));
        assertEquals(2, result.size());
        assertEquals("Ana Lee", result.get(0).getName());
        assertNull(result.get(1).getEmail());
        assertTrue(result.get(1).getIsAPIKey());
        assertTrue(result.get(1).getApiKeyDeleted());
    }

    @Test
    void getNextQuoteNumber() throws Exception {
        respond(map("results", map("nextNumber", "Q-2026-0042", "sequence", 42, "canEdit", true)));

        NextQuoteNumber result = quote.getNextQuoteNumber();

        assertTrue(server.takeRequest().getPath().endsWith("/v1/quotes/number-config/next"));
        assertEquals("Q-2026-0042", result.getNextNumber());
        assertEquals(42, result.getSequence());
        assertTrue(result.getCanEdit());
    }

    // ============================================
    // OPEN QUOTES
    // ============================================

    @Test
    void getCompanyOpenQuotes() throws Exception {
        respond(map("results", Collections.singletonList(map("id", "q-1", "quoteNumber", "Q-1", "name", "Renewal",
                "status", "sent", "updatedOn", "2026-10-01")), "totalRecords", 1));

        OpenQuotesResponse result = quote.getCompanyOpenQuotes("c-1");

        assertTrue(server.takeRequest().getPath().endsWith("/v1/companies/c-1/open-quotes"));
        assertEquals(1, result.getTotalRecords());
        assertEquals("Q-1", result.getResults().get(0).getQuoteNumber());
        assertEquals("sent", result.getResults().get(0).getStatus());
    }

    @Test
    void getContactOpenQuotes() throws Exception {
        respond(emptyList());

        OpenQuotesResponse result = quote.getContactOpenQuotes("ct-1");

        assertTrue(server.takeRequest().getPath().endsWith("/v1/contacts/ct-1/open-quotes"));
        assertEquals(0, result.getTotalRecords());
    }

    // ============================================
    // IMAGES
    // ============================================

    @Test
    void getProductQuoteImages() throws Exception {
        respond(map("results", map(
                "p-1", Collections.singletonList(map("id", "i-1", "productId", "p-1", "displayOrder", 0)),
                "p-2", new ArrayList<>())));

        Map<String, List<ProductImage>> result = quote.getProductQuoteImages(Arrays.asList("p-1", "p-2"));

        RecordedRequest request = server.takeRequest();
        assertTrue(request.getPath().endsWith("/v1/products/quote-images"));
        JsonObject body = JsonParser.parseString(request.getBody().readUtf8()).getAsJsonObject();
        assertEquals(2, body.getAsJsonArray("productIds").size());
        assertEquals("i-1", result.get("p-1").get(0).getId());
        assertTrue(result.get("p-2").isEmpty());
    }

    @Test
    void getQuoteLineItemImages() throws Exception {
        respond(map("results", map("li-1", Collections.singletonList(map("id", "img-1", "lineItemId", "li-1", "displayOrder", 0)))));

        Map<String, List<LineItemImage>> result = quote.getQuoteLineItemImages("q-1");

        assertTrue(server.takeRequest().getPath().endsWith("/v1/quotes/q-1/items/images"));
        assertEquals("img-1", result.get("li-1").get(0).getId());
    }

    @Test
    void getLineItemImages() throws Exception {
        respond(map("results", Collections.singletonList(map("id", "img-1", "lineItemId", "li-1"))));

        List<LineItemImage> result = quote.getLineItemImages("q-1", "li-1");

        assertTrue(server.takeRequest().getPath().endsWith("/v1/quotes/q-1/items/li-1/images"));
        assertEquals("img-1", result.get(0).getId());
    }

    @Test
    void addLineItemImagesUploadsImagesPartsWithDetectedTypes() throws Exception {
        respond(map("results", Arrays.asList(map("id", "img-1"), map("id", "img-2")), "message", "Images added"));

        List<LineItemImage> result = quote.addLineItemImages("q-1", "li-1", new byte[][]{PNG, JPEG});

        RecordedRequest request = server.takeRequest();
        assertEquals("POST", request.getMethod());
        assertTrue(request.getPath().endsWith("/v1/quotes/q-1/items/li-1/images"));
        String body = request.getBody().readUtf8();
        assertTrue(body.contains("name=\"images\"; filename=\"image.png\""));
        assertTrue(body.contains("Content-Type: image/png"));
        assertTrue(body.contains("Content-Type: image/jpeg"));
        assertFalse(body.contains("name=\"data\""));
        assertEquals(2, result.size());
    }

    @Test
    void reorderLineItemImages() throws Exception {
        respond(map("results", Arrays.asList(map("id", "img-2"), map("id", "img-1"))));

        List<LineItemImage> result = quote.reorderLineItemImages("q-1", "li-1", Arrays.asList("img-2", "img-1"));

        RecordedRequest request = server.takeRequest();
        assertEquals("PUT", request.getMethod());
        assertTrue(request.getPath().endsWith("/v1/quotes/q-1/items/li-1/images/order"));
        assertEquals("{\"imageIds\":[\"img-2\",\"img-1\"]}", request.getBody().readUtf8());
        assertEquals("img-2", result.get(0).getId());
    }

    @Test
    void removeLineItemImage() throws Exception {
        respond(map("results", Collections.singletonList(map("id", "img-2")), "message", "Image removed"));

        List<LineItemImage> result = quote.removeLineItemImage("q-1", "li-1", "img-1");

        RecordedRequest request = server.takeRequest();
        assertEquals("DELETE", request.getMethod());
        assertTrue(request.getPath().endsWith("/v1/quotes/q-1/items/li-1/images/img-1"));
        assertEquals("img-2", result.get(0).getId());
    }

    // ============================================
    // NAMED DUPLICATES
    // ============================================

    @Test
    void duplicatesSendTheNameForTheCopy() throws Exception {
        for (int i = 0; i < 4; i++) {
            respond(map("result", map("id", "x-2", "name", "Q4 copy")));
        }

        assertEquals("x-2", quote.duplicateQuote("x-1", "Q4 copy").getId());
        assertEquals("x-2", quote.duplicateProduct("x-1", "Q4 copy").getId());
        assertEquals("x-2", quote.duplicatePriceBook("x-1", "Q4 copy").getId());
        assertEquals("x-2", quote.duplicateBundle("x-1", "Q4 copy").getId());

        for (String path : Arrays.asList("/v1/quotes/x-1/duplicate", "/v1/products/x-1/duplicate",
                "/v1/pricebooks/x-1/duplicate", "/v1/bundles/x-1/duplicate")) {
            RecordedRequest request = server.takeRequest();
            assertTrue(request.getPath().endsWith(path));
            assertEquals("{\"name\":\"Q4 copy\"}", request.getBody().readUtf8());
        }
    }

    @Test
    void duplicateWithoutANameSendsAnEmptyBody() throws Exception {
        respond(map("result", map("id", "x-2")));

        quote.duplicateQuote("x-1");

        assertEquals("{}", server.takeRequest().getBody().readUtf8());
    }

    // ============================================
    // REQUEST FIELDS
    // ============================================

    @Test
    void createCompanySendsTheEmail() throws Exception {
        respond(map("result", map("id", "c-1")));

        CreateCompanyRequest request = new CreateCompanyRequest();
        request.setName("Acme");
        request.setEmail("ap@acme.test");
        CreateCompanyContactInput contact = new CreateCompanyContactInput();
        contact.setName("Ana");
        contact.setEmail("ana@acme.test");
        request.setContacts(Collections.singletonList(contact));
        quote.createCompany(request);

        JsonObject body = JsonParser.parseString(server.takeRequest().getBody().readUtf8()).getAsJsonObject();
        assertEquals("ap@acme.test", body.get("email").getAsString());
    }

    @Test
    void updateCompanySendsAnExplicitNullEmail() throws Exception {
        respond(map("result", map("id", "c-1")));

        UpdateCompanyRequest request = new UpdateCompanyRequest();
        request.setEmail(null);
        quote.updateCompany("c-1", request);

        assertEquals("{\"email\":null}", server.takeRequest().getBody().readUtf8());
    }

    @Test
    void updatePriceBookSendsResetProductPricing() throws Exception {
        respond(map("result", map("id", "pb-1")));

        UpdatePriceBookRequest request = new UpdatePriceBookRequest();
        request.setResetProductPricing(true);
        quote.updatePriceBook("pb-1", request);

        assertEquals("{\"resetProductPricing\":true}", server.takeRequest().getBody().readUtf8());
    }

    @Test
    void deletingASentQuoteIsAConflict() {
        String message = "A sent quote can't be deleted. Void it instead.";
        server.enqueue(new MockResponse().setResponseCode(409).addHeader("Content-Type", "application/json")
                .setBody(gson.toJson(map("message", message,
                        "error", map("message", message, "code", "CANNOT_DELETE_SENT_QUOTE"), "data", map()))));

        TurboDocxException.ConflictException error = assertThrows(TurboDocxException.ConflictException.class,
                () -> quote.deleteQuote("q-1"));
        assertEquals(409, error.getStatusCode());
        assertEquals("CANNOT_DELETE_SENT_QUOTE", error.getCode());
        assertEquals(message, error.getMessage());
    }
}
