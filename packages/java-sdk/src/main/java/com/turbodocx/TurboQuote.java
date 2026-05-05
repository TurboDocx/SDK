package com.turbodocx;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;
import com.turbodocx.models.quote.*;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.*;

/**
 * TurboQuote module — Quoting operations.
 *
 * <p>Instance-based: takes an {@link HttpClient} in the constructor.
 * All 60 public methods organized across 11 entity groups:
 * Quotes CRUD (9), Status Transitions (5), Line Items (5), Products (7),
 * Price Books (7), Bundles (6), Companies (6), Contacts (4), Templates (6),
 * Types (4), Convenience (1).</p>
 */
public class TurboQuote {
    private final HttpClient httpClient;
    private final Gson gson;

    public TurboQuote(HttpClient httpClient) {
        this.httpClient = httpClient;
        this.gson = new Gson();
    }

    // ============================================
    // QUOTES — CRUD
    // ============================================

    /**
     * List quotes with optional pagination and filters.
     */
    public QuoteListResponse listQuotes(ListQuotesOptions options) throws IOException {
        Map<String, Object> params = options != null ? options.toQueryParams() : null;
        return httpClient.get("/v1/quotes", params, QuoteListResponse.class);
    }

    /**
     * List all quotes without filters.
     */
    public QuoteListResponse listQuotes() throws IOException {
        return listQuotes(null);
    }

    /**
     * Create a new quote.
     */
    public Quote createQuote(CreateQuoteRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Quote>>(){}.getType();
        ResultEnvelope<Quote> envelope = httpClient.post("/v1/quotes", request, type);
        return envelope.getResult();
    }

    /**
     * Get a quote by ID, including statusInfo.
     */
    public Quote getQuote(String id) throws IOException {
        // getQuote needs special handling: statusInfo is a sibling key to result
        JsonObject response = httpClient.get("/v1/quotes/" + id, JsonObject.class);

        Quote quote = gson.fromJson(response.get("result"), Quote.class);
        if (response.has("statusInfo") && !response.get("statusInfo").isJsonNull()) {
            QuoteStatusInfo statusInfo = gson.fromJson(response.get("statusInfo"), QuoteStatusInfo.class);
            quote.setStatusInfo(statusInfo);
        }
        return quote;
    }

    /**
     * Update an existing quote.
     */
    public Quote updateQuote(String id, UpdateQuoteRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Quote>>(){}.getType();
        ResultEnvelope<Quote> envelope = httpClient.patch("/v1/quotes/" + id, request, type);
        return envelope.getResult();
    }

    /**
     * Delete a quote.
     */
    public SuccessResponse deleteQuote(String id) throws IOException {
        return httpClient.delete("/v1/quotes/" + id, SuccessResponse.class);
    }

    /**
     * Duplicate a quote.
     */
    public Quote duplicateQuote(String id) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Quote>>(){}.getType();
        ResultEnvelope<Quote> envelope = httpClient.post("/v1/quotes/" + id + "/duplicate", null, type);
        return envelope.getResult();
    }

    /**
     * Apply a price book to a quote.
     */
    public ApplyPriceBookResponse applyPriceBook(String quoteId, String priceBookId) throws IOException {
        Map<String, String> body = new HashMap<>();
        body.put("priceBookId", priceBookId);

        // Response has: result (the quote), message, updatedCount, skippedCount
        JsonObject response = httpClient.post("/v1/quotes/" + quoteId + "/apply-pricebook", body, JsonObject.class);

        Quote quote = gson.fromJson(response.get("result"), Quote.class);
        String message = response.has("message") ? response.get("message").getAsString() : null;
        Integer updatedCount = response.has("updatedCount") ? response.get("updatedCount").getAsInt() : null;
        Integer skippedCount = response.has("skippedCount") ? response.get("skippedCount").getAsInt() : null;

        return new ApplyPriceBookResponse(quote, message, updatedCount, skippedCount);
    }

    /**
     * Remove the price book from a quote.
     */
    public Quote removePriceBook(String quoteId) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Quote>>(){}.getType();
        ResultEnvelope<Quote> envelope = httpClient.post("/v1/quotes/" + quoteId + "/remove-pricebook", null, type);
        return envelope.getResult();
    }

    /**
     * Download a quote as PDF.
     */
    public byte[] downloadQuotePdf(String id) throws IOException {
        return httpClient.getRaw("/v1/quotes/" + id + "/pdf");
    }

    // ============================================
    // QUOTES — STATUS TRANSITIONS
    // ============================================

    /**
     * Send a quote with optional configuration.
     */
    public SendQuoteResponse sendQuote(String id, SendQuoteRequest request) throws IOException {
        // Response has: result (the quote), message
        JsonObject response = httpClient.post("/v1/quotes/" + id + "/send", request, JsonObject.class);
        Quote quote = gson.fromJson(response.get("result"), Quote.class);
        String message = response.has("message") ? response.get("message").getAsString() : null;
        return new SendQuoteResponse(quote, message);
    }

    /**
     * Send a quote without options.
     */
    public SendQuoteResponse sendQuote(String id) throws IOException {
        return sendQuote(id, null);
    }

    /**
     * Send a quote with a document deliverable.
     */
    public SendQuoteWithDeliverableResponse sendQuoteWithDeliverable(String id, SendQuoteWithDeliverableRequest request) throws IOException {
        JsonObject response = httpClient.post("/v1/quotes/" + id + "/send-with-deliverable", request, JsonObject.class);
        Quote quote = gson.fromJson(response.get("result"), Quote.class);
        String message = response.has("message") ? response.get("message").getAsString() : null;
        String documentId = response.has("documentId") ? response.get("documentId").getAsString() : null;
        return new SendQuoteWithDeliverableResponse(quote, message, documentId);
    }

    /**
     * Decline a quote.
     */
    public Quote declineQuote(String id, DeclineQuoteRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Quote>>(){}.getType();
        ResultEnvelope<Quote> envelope = httpClient.post("/v1/quotes/" + id + "/decline", request, type);
        return envelope.getResult();
    }

    /**
     * Void a quote.
     */
    public Quote voidQuote(String id, VoidQuoteRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Quote>>(){}.getType();
        ResultEnvelope<Quote> envelope = httpClient.post("/v1/quotes/" + id + "/void", request, type);
        return envelope.getResult();
    }

    /**
     * Handle an expired sent quote.
     */
    public Quote handleExpiredQuote(String id, HandleExpiredQuoteRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Quote>>(){}.getType();
        ResultEnvelope<Quote> envelope = httpClient.post("/v1/quotes/" + id + "/handle-expired-sent", request, type);
        return envelope.getResult();
    }

    // ============================================
    // LINE ITEMS
    // ============================================

    /**
     * List line items for a quote.
     */
    public LineItemListResponse listLineItems(String quoteId, ListLineItemsOptions options) throws IOException {
        Map<String, Object> params = options != null ? options.toQueryParams() : null;
        return httpClient.get("/v1/quotes/" + quoteId + "/items", params, LineItemListResponse.class);
    }

    /**
     * List all line items for a quote without filters.
     */
    public LineItemListResponse listLineItems(String quoteId) throws IOException {
        return listLineItems(quoteId, null);
    }

    /**
     * Add product line items to a quote (single or batch).
     */
    public List<LineItem> addLineItems(String quoteId, List<AddLineItemRequest> items) throws IOException {
        Type type = new TypeToken<ResultsEnvelope<LineItem>>(){}.getType();
        ResultsEnvelope<LineItem> envelope = httpClient.post("/v1/quotes/" + quoteId + "/items", items, type);
        return envelope.getResults();
    }

    /**
     * Add a single product line item to a quote.
     */
    public List<LineItem> addLineItems(String quoteId, AddLineItemRequest item) throws IOException {
        return addLineItems(quoteId, Collections.singletonList(item));
    }

    /**
     * Add bundle line items to a quote (single or batch).
     */
    public List<LineItem> addBundleLineItems(String quoteId, List<AddBundleLineItemRequest> items) throws IOException {
        Type type = new TypeToken<ResultsEnvelope<LineItem>>(){}.getType();
        ResultsEnvelope<LineItem> envelope = httpClient.post("/v1/quotes/" + quoteId + "/items/bundle", items, type);
        return envelope.getResults();
    }

    /**
     * Add a single bundle line item to a quote.
     */
    public List<LineItem> addBundleLineItems(String quoteId, AddBundleLineItemRequest item) throws IOException {
        return addBundleLineItems(quoteId, Collections.singletonList(item));
    }

    /**
     * Update a line item.
     */
    public LineItem updateLineItem(String quoteId, String itemId, UpdateLineItemRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<LineItem>>(){}.getType();
        ResultEnvelope<LineItem> envelope = httpClient.patch("/v1/quotes/" + quoteId + "/items/" + itemId, request, type);
        return envelope.getResult();
    }

    /**
     * Remove a line item from a quote.
     */
    public SuccessResponse removeLineItem(String quoteId, String itemId) throws IOException {
        return httpClient.delete("/v1/quotes/" + quoteId + "/items/" + itemId, SuccessResponse.class);
    }

    // ============================================
    // PRODUCTS
    // ============================================

    /**
     * List products with optional filters.
     */
    public ProductListResponse listProducts(ListProductsOptions options) throws IOException {
        Map<String, Object> params = options != null ? options.toQueryParams() : null;
        return httpClient.get("/v1/products", params, ProductListResponse.class);
    }

    /**
     * List all products without filters.
     */
    public ProductListResponse listProducts() throws IOException {
        return listProducts(null);
    }

    /**
     * Create a product. If images are provided, uses multipart form data.
     */
    public Product createProduct(CreateProductRequest request) throws IOException {
        if (request.getImages() != null && request.getImages().length > 0) {
            MultipartBody body = buildProductFormData(request, request.getImages());
            Type type = new TypeToken<ResultEnvelope<Product>>(){}.getType();
            ResultEnvelope<Product> envelope = httpClient.postFormData("/v1/products", body, type);
            return envelope.getResult();
        }
        Type type = new TypeToken<ResultEnvelope<Product>>(){}.getType();
        ResultEnvelope<Product> envelope = httpClient.post("/v1/products", request, type);
        return envelope.getResult();
    }

    /**
     * Get a product by ID.
     */
    public Product getProduct(String id) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Product>>(){}.getType();
        ResultEnvelope<Product> envelope = httpClient.get("/v1/products/" + id, type);
        return envelope.getResult();
    }

    /**
     * Update a product. If images are provided, uses multipart form data.
     */
    public Product updateProduct(String id, UpdateProductRequest request) throws IOException {
        if (request.getImages() != null && request.getImages().length > 0) {
            MultipartBody body = buildProductFormData(request, request.getImages());
            Type type = new TypeToken<ResultEnvelope<Product>>(){}.getType();
            ResultEnvelope<Product> envelope = httpClient.patchFormData("/v1/products/" + id, body, type);
            return envelope.getResult();
        }
        Type type = new TypeToken<ResultEnvelope<Product>>(){}.getType();
        ResultEnvelope<Product> envelope = httpClient.patch("/v1/products/" + id, request, type);
        return envelope.getResult();
    }

    /**
     * Delete a product.
     */
    public SuccessResponse deleteProduct(String id) throws IOException {
        return httpClient.delete("/v1/products/" + id, SuccessResponse.class);
    }

    /**
     * Duplicate a product.
     */
    public Product duplicateProduct(String id) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Product>>(){}.getType();
        ResultEnvelope<Product> envelope = httpClient.post("/v1/products/" + id + "/duplicate", null, type);
        return envelope.getResult();
    }

    /**
     * Get primary images for multiple products.
     * Returns a map of productId to ProductImage (or null).
     */
    public Map<String, ProductImage> getProductPrimaryImages(List<String> productIds) throws IOException {
        Map<String, Object> body = new HashMap<>();
        body.put("productIds", productIds);

        // Response has: results: { [productId]: ProductImage | null }
        JsonObject response = httpClient.post("/v1/products/primary-images", body, JsonObject.class);
        JsonObject results = response.has("results") ? response.getAsJsonObject("results") : new JsonObject();

        Map<String, ProductImage> map = new HashMap<>();
        for (String key : results.keySet()) {
            if (results.get(key).isJsonNull()) {
                map.put(key, null);
            } else {
                map.put(key, gson.fromJson(results.get(key), ProductImage.class));
            }
        }
        return map;
    }

    // ============================================
    // PRICE BOOKS
    // ============================================

    /**
     * List price books with optional filters.
     */
    public PriceBookListResponse listPriceBooks(ListPriceBooksOptions options) throws IOException {
        Map<String, Object> params = options != null ? options.toQueryParams() : null;
        return httpClient.get("/v1/pricebooks", params, PriceBookListResponse.class);
    }

    /**
     * List all price books without filters.
     */
    public PriceBookListResponse listPriceBooks() throws IOException {
        return listPriceBooks(null);
    }

    /**
     * Create a price book.
     */
    public PriceBook createPriceBook(CreatePriceBookRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<PriceBook>>(){}.getType();
        ResultEnvelope<PriceBook> envelope = httpClient.post("/v1/pricebooks", request, type);
        return envelope.getResult();
    }

    /**
     * Get a price book by ID.
     */
    public PriceBook getPriceBook(String id) throws IOException {
        Type type = new TypeToken<ResultEnvelope<PriceBook>>(){}.getType();
        ResultEnvelope<PriceBook> envelope = httpClient.get("/v1/pricebooks/" + id, type);
        return envelope.getResult();
    }

    /**
     * Update a price book.
     */
    public PriceBook updatePriceBook(String id, UpdatePriceBookRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<PriceBook>>(){}.getType();
        ResultEnvelope<PriceBook> envelope = httpClient.patch("/v1/pricebooks/" + id, request, type);
        return envelope.getResult();
    }

    /**
     * Delete a price book.
     */
    public SuccessResponse deletePriceBook(String id) throws IOException {
        return httpClient.delete("/v1/pricebooks/" + id, SuccessResponse.class);
    }

    /**
     * Duplicate a price book.
     */
    public PriceBook duplicatePriceBook(String id) throws IOException {
        Type type = new TypeToken<ResultEnvelope<PriceBook>>(){}.getType();
        ResultEnvelope<PriceBook> envelope = httpClient.post("/v1/pricebooks/" + id + "/duplicate", null, type);
        return envelope.getResult();
    }

    /**
     * List products in a price book.
     */
    public PriceBookProductListResponse listPriceBookProducts(String id, ListPriceBookProductsOptions options) throws IOException {
        Map<String, Object> params = options != null ? options.toQueryParams() : null;
        return httpClient.get("/v1/pricebooks/" + id + "/products", params, PriceBookProductListResponse.class);
    }

    /**
     * List all products in a price book without filters.
     */
    public PriceBookProductListResponse listPriceBookProducts(String id) throws IOException {
        return listPriceBookProducts(id, null);
    }

    // ============================================
    // BUNDLES
    // ============================================

    /**
     * List bundles with optional filters.
     */
    public BundleListResponse listBundles(ListBundlesOptions options) throws IOException {
        Map<String, Object> params = options != null ? options.toQueryParams() : null;
        return httpClient.get("/v1/bundles", params, BundleListResponse.class);
    }

    /**
     * List all bundles without filters.
     */
    public BundleListResponse listBundles() throws IOException {
        return listBundles(null);
    }

    /**
     * Create a bundle.
     */
    public Bundle createBundle(CreateBundleRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Bundle>>(){}.getType();
        ResultEnvelope<Bundle> envelope = httpClient.post("/v1/bundles", request, type);
        return envelope.getResult();
    }

    /**
     * Get a bundle by ID.
     */
    public Bundle getBundle(String id) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Bundle>>(){}.getType();
        ResultEnvelope<Bundle> envelope = httpClient.get("/v1/bundles/" + id, type);
        return envelope.getResult();
    }

    /**
     * Update a bundle.
     */
    public Bundle updateBundle(String id, UpdateBundleRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Bundle>>(){}.getType();
        ResultEnvelope<Bundle> envelope = httpClient.patch("/v1/bundles/" + id, request, type);
        return envelope.getResult();
    }

    /**
     * Delete a bundle.
     */
    public SuccessResponse deleteBundle(String id) throws IOException {
        return httpClient.delete("/v1/bundles/" + id, SuccessResponse.class);
    }

    /**
     * Duplicate a bundle.
     */
    public Bundle duplicateBundle(String id) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Bundle>>(){}.getType();
        ResultEnvelope<Bundle> envelope = httpClient.post("/v1/bundles/" + id + "/duplicate", null, type);
        return envelope.getResult();
    }

    // ============================================
    // COMPANIES
    // ============================================

    /**
     * List companies with optional filters.
     */
    public CompanyListResponse listCompanies(ListCompaniesOptions options) throws IOException {
        Map<String, Object> params = options != null ? options.toQueryParams() : null;
        return httpClient.get("/v1/companies", params, CompanyListResponse.class);
    }

    /**
     * List all companies without filters.
     */
    public CompanyListResponse listCompanies() throws IOException {
        return listCompanies(null);
    }

    /**
     * Create a company.
     */
    public Company createCompany(CreateCompanyRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Company>>(){}.getType();
        ResultEnvelope<Company> envelope = httpClient.post("/v1/companies", request, type);
        return envelope.getResult();
    }

    /**
     * Get a company by ID.
     */
    public Company getCompany(String id) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Company>>(){}.getType();
        ResultEnvelope<Company> envelope = httpClient.get("/v1/companies/" + id, type);
        return envelope.getResult();
    }

    /**
     * Update a company.
     */
    public Company updateCompany(String id, UpdateCompanyRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Company>>(){}.getType();
        ResultEnvelope<Company> envelope = httpClient.patch("/v1/companies/" + id, request, type);
        return envelope.getResult();
    }

    /**
     * Delete a company.
     */
    public SuccessResponse deleteCompany(String id) throws IOException {
        return httpClient.delete("/v1/companies/" + id, SuccessResponse.class);
    }

    /**
     * List contacts for a specific company.
     */
    public ContactListResponse listCompanyContacts(String companyId, PaginationParams options) throws IOException {
        Map<String, Object> params = options != null ? options.toQueryParams() : null;
        return httpClient.get("/v1/companies/" + companyId + "/contacts", params, ContactListResponse.class);
    }

    /**
     * List all contacts for a specific company.
     */
    public ContactListResponse listCompanyContacts(String companyId) throws IOException {
        return listCompanyContacts(companyId, null);
    }

    // ============================================
    // CONTACTS
    // ============================================

    /**
     * List contacts with optional filters.
     */
    public ContactListResponse listContacts(ListContactsOptions options) throws IOException {
        Map<String, Object> params = options != null ? options.toQueryParams() : null;
        return httpClient.get("/v1/contacts", params, ContactListResponse.class);
    }

    /**
     * List all contacts without filters.
     */
    public ContactListResponse listContacts() throws IOException {
        return listContacts(null);
    }

    /**
     * Create a contact.
     */
    public Contact createContact(CreateContactRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Contact>>(){}.getType();
        ResultEnvelope<Contact> envelope = httpClient.post("/v1/contacts", request, type);
        return envelope.getResult();
    }

    /**
     * Update a contact.
     */
    public Contact updateContact(String id, UpdateContactRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Contact>>(){}.getType();
        ResultEnvelope<Contact> envelope = httpClient.patch("/v1/contacts/" + id, request, type);
        return envelope.getResult();
    }

    /**
     * Delete a contact.
     */
    public SuccessResponse deleteContact(String id) throws IOException {
        return httpClient.delete("/v1/contacts/" + id, SuccessResponse.class);
    }

    // ============================================
    // TEMPLATES
    // ============================================

    /**
     * List all quote templates.
     */
    public QuoteTemplateListResponse listTemplates(PaginationParams options) throws IOException {
        Map<String, Object> params = options != null ? options.toQueryParams() : null;
        return httpClient.get("/v1/quote-templates", params, QuoteTemplateListResponse.class);
    }

    /**
     * List all quote templates without filters.
     */
    public QuoteTemplateListResponse listTemplates() throws IOException {
        return listTemplates(null);
    }

    /**
     * Get the organization's default quote template.
     */
    public QuoteTemplate getTemplate() throws IOException {
        Type type = new TypeToken<ResultEnvelope<QuoteTemplate>>(){}.getType();
        ResultEnvelope<QuoteTemplate> envelope = httpClient.get("/v1/quote-template", type);
        return envelope.getResult();
    }

    /**
     * Get a quote template by ID.
     */
    public QuoteTemplate getTemplateById(String id) throws IOException {
        Type type = new TypeToken<ResultEnvelope<QuoteTemplate>>(){}.getType();
        ResultEnvelope<QuoteTemplate> envelope = httpClient.get("/v1/quote-templates/" + id, type);
        return envelope.getResult();
    }

    /**
     * Create a quote template.
     */
    public QuoteTemplate createTemplate(CreateQuoteTemplateRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<QuoteTemplate>>(){}.getType();
        ResultEnvelope<QuoteTemplate> envelope = httpClient.post("/v1/quote-templates", request, type);
        return envelope.getResult();
    }

    /**
     * Update a quote template.
     */
    public QuoteTemplate updateTemplate(String id, UpdateQuoteTemplateRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<QuoteTemplate>>(){}.getType();
        ResultEnvelope<QuoteTemplate> envelope = httpClient.patch("/v1/quote-templates/" + id, request, type);
        return envelope.getResult();
    }

    /**
     * Delete a quote template.
     */
    public SuccessResponse deleteTemplate(String id) throws IOException {
        return httpClient.delete("/v1/quote-templates/" + id, SuccessResponse.class);
    }

    // ============================================
    // TYPES / CATEGORIES
    // ============================================

    /**
     * List types/categories with optional filters.
     */
    public QuoteTypeListResponse listTypes(ListTypesOptions options) throws IOException {
        Map<String, Object> params = options != null ? options.toQueryParams() : null;
        return httpClient.get("/v1/types", params, QuoteTypeListResponse.class);
    }

    /**
     * List all types/categories without filters.
     */
    public QuoteTypeListResponse listTypes() throws IOException {
        return listTypes(null);
    }

    /**
     * Create a type/category.
     */
    public QuoteType createType(CreateQuoteTypeRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<QuoteType>>(){}.getType();
        ResultEnvelope<QuoteType> envelope = httpClient.post("/v1/types", request, type);
        return envelope.getResult();
    }

    /**
     * Update a type/category.
     */
    public QuoteType updateType(String id, UpdateQuoteTypeRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<QuoteType>>(){}.getType();
        ResultEnvelope<QuoteType> envelope = httpClient.patch("/v1/types/" + id, request, type);
        return envelope.getResult();
    }

    /**
     * Delete a type/category.
     */
    public SuccessResponse deleteType(String id) throws IOException {
        return httpClient.delete("/v1/types/" + id, SuccessResponse.class);
    }

    // ============================================
    // CONVENIENCE
    // ============================================

    /**
     * Create a quote, add line items and bundle items, and send it — all in one call.
     * Strips items/bundleItems/send fields before posting to /v1/quotes.
     */
    public CreateAndSendResponse createAndSend(CreateAndSendRequest request) throws IOException {
        // Build the quote create request (without items/bundleItems/send)
        CreateQuoteRequest quoteRequest = new CreateQuoteRequest();
        quoteRequest.setName(request.getName());
        quoteRequest.setCompanyId(request.getCompanyId());
        quoteRequest.setContactId(request.getContactId());
        quoteRequest.setCurrency(request.getCurrency());
        quoteRequest.setTermDays(request.getTermDays());
        quoteRequest.setRenewalPeriod(request.getRenewalPeriod());
        quoteRequest.setValidUntil(request.getValidUntil());
        quoteRequest.setTaxRate(request.getTaxRate());
        quoteRequest.setPriceBookId(request.getPriceBookId());

        // Step 1: Create the quote
        Quote quote = createQuote(quoteRequest);

        // Step 2: Add line items if provided
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            addLineItems(quote.getId(), request.getItems());
        }

        // Step 3: Add bundle items if provided
        if (request.getBundleItems() != null && !request.getBundleItems().isEmpty()) {
            addBundleLineItems(quote.getId(), request.getBundleItems());
        }

        // Step 4: Send the quote
        SendQuoteResponse sendResponse = sendQuote(quote.getId(), request.getSend());

        return new CreateAndSendResponse(sendResponse.getQuote());
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    /**
     * Build multipart form data for product create/update with images.
     * Non-image fields go into a "data" JSON field, images go as separate parts.
     */
    private MultipartBody buildProductFormData(Object request, byte[][] images) {
        // Serialize the request object (images field is transient, won't be included)
        String dataJson = gson.toJson(request);

        MultipartBody.Builder builder = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("data", dataJson);

        if (images != null) {
            for (byte[] image : images) {
                builder.addFormDataPart("images", "image.jpg",
                        RequestBody.create(image, MediaType.parse("image/jpeg")));
            }
        }

        return builder.build();
    }
}
