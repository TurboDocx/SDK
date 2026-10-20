package com.turbodocx;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonNull;
import com.google.gson.JsonObject;
import com.google.gson.reflect.TypeToken;
import com.turbodocx.models.SignatureSchedule;
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
public final class TurboQuote {
    private final HttpClient httpClient;
    private final Gson gson;
    // Serializes an already-curated JSON tree, emitting explicit nulls (serializeNulls). Used for
    // the line-item array (sole null is the intentional productId:null) and for buildPatchBody
    // (explicit nulls = fields the caller cleared). Other nulls are dropped earlier by {@code gson}
    // (no serializeNulls) when the tree is built. Gson is thread-safe, so one shared instance.
    private static final Gson NULL_PRESERVING_GSON = new GsonBuilder().serializeNulls().create();
    private static final Type LINE_ITEM_IMAGES = new TypeToken<ValueEnvelope<List<LineItemImage>>>(){}.getType();

    public TurboQuote(HttpClient httpClient) {
        this.httpClient = httpClient;
        this.gson = new GsonBuilder().create();
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
     * The quote list's summary cards (pipeline, win rate, monthly recurring…) for a set of
     * filters, in one currency ({@code summaryCurrency}). The status filter is ignored.
     */
    public QuoteSummary getQuoteSummary(QuoteSummaryOptions options) throws IOException {
        Map<String, Object> params = options != null ? options.toQueryParams() : null;
        JsonObject response = httpClient.get("/v1/quotes/summary", params, JsonObject.class);
        return gson.fromJson(response.get("summary"), QuoteSummary.class);
    }

    /**
     * The quote list's summary cards, without filters (USD unless the org's quotes say otherwise).
     */
    public QuoteSummary getQuoteSummary() throws IOException {
        return getQuoteSummary(null);
    }

    /**
     * The people and API keys who created the org's quotes — the ids for the {@code createdBy} filter.
     */
    public List<Quote.QuoteCreator> listQuoteCreators() throws IOException {
        Type type = new TypeToken<ValueEnvelope<List<Quote.QuoteCreator>>>(){}.getType();
        ValueEnvelope<List<Quote.QuoteCreator>> envelope = httpClient.get("/v1/quotes/creators", type);
        return envelope.getResults();
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
     * Get a quote by ID, including statusInfo and preparedBy.
     */
    public Quote getQuote(String id) throws IOException {
        // getQuote needs special handling: statusInfo and preparedBy are sibling keys to result
        JsonObject response = httpClient.get("/v1/quotes/" + id, JsonObject.class);

        Quote quote = gson.fromJson(response.get("result"), Quote.class);
        if (response.has("statusInfo") && !response.get("statusInfo").isJsonNull()) {
            QuoteStatusInfo statusInfo = gson.fromJson(response.get("statusInfo"), QuoteStatusInfo.class);
            quote.setStatusInfo(statusInfo);
        }
        // preparedBy is the resolved "Prepared by" identity; fold it onto the quote (same
        // pattern as statusInfo). Prefer it over getCreator() for customer-facing display.
        if (response.has("preparedBy") && !response.get("preparedBy").isJsonNull()) {
            Quote.QuotePreparedBy preparedBy = gson.fromJson(response.get("preparedBy"), Quote.QuotePreparedBy.class);
            quote.setPreparedBy(preparedBy);
        }
        return quote;
    }

    /**
     * Update an existing quote.
     */
    public Quote updateQuote(String id, UpdateQuoteRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Quote>>(){}.getType();
        ResultEnvelope<Quote> envelope = httpClient.patchRawJson("/v1/quotes/" + id, buildPatchBody(request), type);
        return envelope.getResult();
    }

    /**
     * Delete a quote. A sent quote is refused with a 409 ({@code ConflictException}, code
     * {@code CANNOT_DELETE_SENT_QUOTE}) — void it instead — and so is an accepted one
     * ({@code CANNOT_DELETE_ACCEPTED_QUOTE}).
     */
    public SuccessResponse deleteQuote(String id) throws IOException {
        return httpClient.delete("/v1/quotes/" + id, SuccessResponse.class);
    }

    /**
     * Duplicate a quote. The copy is called "Copy of &lt;name&gt;".
     */
    public Quote duplicateQuote(String id) throws IOException {
        return duplicateQuote(id, null);
    }

    /**
     * Duplicate a quote and name the copy (null or blank: "Copy of &lt;name&gt;").
     */
    public Quote duplicateQuote(String id, String name) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Quote>>(){}.getType();
        ResultEnvelope<Quote> envelope = httpClient.post("/v1/quotes/" + id + "/duplicate", duplicateBody(name), type);
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
        // The schedule must land FLAT on the body (remindersEnabled, reminderDelay, …) — not
        // nested under a "schedule" key — so serialize the request to a tree and flatten it.
        Object body = request == null
                ? null
                : flattenSchedule(gson.toJsonTree(request).getAsJsonObject(), request.getSchedule());

        // Response has: result (the quote), message
        JsonObject response = httpClient.post("/v1/quotes/" + id + "/send", body, JsonObject.class);
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
        // Flatten the schedule onto the top-level body, same as sendQuote.
        Object body = request == null
                ? null
                : flattenSchedule(gson.toJsonTree(request).getAsJsonObject(), request.getSchedule());

        JsonObject response = httpClient.post("/v1/quotes/" + id + "/send-with-deliverable", body, JsonObject.class);
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
     * Handle an expired sent quote. Voids or declines the original and returns the
     * duplicate quote created with the new validity date.
     *
     * <p>{@code action} must be {@code "void"} or {@code "decline"}; {@code reason} and
     * {@code newValidUntil} are both required.
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
        // Build the body as a JsonArray so productId is sent even when null. The backend's
        // joiAddProductLineItemSchema declares productId `.allow(null).required()` — the KEY must
        // be present even when null (that is how a custom/ad-hoc line item, one with no product
        // reference, is expressed). Default Gson omits null fields, and a registered serializer is
        // not reliably applied to elements of a type-erased List, so we materialize each item to a
        // JsonObject here and guarantee productId is present. Other null fields stay omitted and
        // @SerializedName enum encoding (e.g. DiscountType) is preserved.
        JsonArray payload = new JsonArray();
        for (AddLineItemRequest item : items) {
            JsonObject obj = gson.toJsonTree(item).getAsJsonObject();
            if (!obj.has("productId")) {
                obj.add("productId", JsonNull.INSTANCE);
            }
            payload.add(obj);
        }
        // Serialize with serializeNulls so the explicit productId:null survives to the wire. The
        // tree above already omits every other null, so only productId:null is emitted and optional
        // fields (e.g. discountPercent) stay absent and keep their server-side defaults.
        String body = NULL_PRESERVING_GSON.toJson(payload);
        Type type = new TypeToken<ResultsEnvelope<LineItem>>(){}.getType();
        ResultsEnvelope<LineItem> envelope = httpClient.postRawJson("/v1/quotes/" + quoteId + "/items", body, type);
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
        ResultEnvelope<LineItem> envelope = httpClient.patchRawJson("/v1/quotes/" + quoteId + "/items/" + itemId, buildPatchBody(request), type);
        return envelope.getResult();
    }

    /**
     * Remove a line item from a quote.
     */
    public SuccessResponse removeLineItem(String quoteId, String itemId) throws IOException {
        return httpClient.delete("/v1/quotes/" + quoteId + "/items/" + itemId, SuccessResponse.class);
    }

    // ============================================
    // CUSTOM LINE ITEM IMAGES
    // Up to three per custom item (a line with no catalog product), PNG or JPEG, 2MB each.
    // Changes are allowed on draft quotes only.
    // ============================================

    /**
     * Every custom line item's images (up to three, in order), keyed by line item ID.
     */
    public Map<String, List<LineItemImage>> getQuoteLineItemImages(String quoteId) throws IOException {
        Type type = new TypeToken<ValueEnvelope<Map<String, List<LineItemImage>>>>(){}.getType();
        ValueEnvelope<Map<String, List<LineItemImage>>> envelope =
                httpClient.get("/v1/quotes/" + quoteId + "/items/images", type);
        return envelope.getResults();
    }

    /**
     * One custom line item's images, in order.
     */
    public List<LineItemImage> getLineItemImages(String quoteId, String itemId) throws IOException {
        ValueEnvelope<List<LineItemImage>> envelope =
                httpClient.get("/v1/quotes/" + quoteId + "/items/" + itemId + "/images", LINE_ITEM_IMAGES);
        return envelope.getResults();
    }

    /**
     * Add images (PNG or JPEG bytes) to a custom line item. Returns all of its images.
     */
    public List<LineItemImage> addLineItemImages(String quoteId, String itemId, byte[][] images) throws IOException {
        MultipartBody.Builder builder = new MultipartBody.Builder().setType(MultipartBody.FORM);
        for (byte[] image : images) {
            String mimeType = detectImageMimeType(image);
            builder.addFormDataPart("images", getImageFilename(mimeType), RequestBody.create(image, MediaType.parse(mimeType)));
        }
        ValueEnvelope<List<LineItemImage>> envelope = httpClient.postFormData(
                "/v1/quotes/" + quoteId + "/items/" + itemId + "/images", builder.build(), LINE_ITEM_IMAGES);
        return envelope.getResults();
    }

    /**
     * Set the order of a custom line item's images, first to last.
     */
    public List<LineItemImage> reorderLineItemImages(String quoteId, String itemId, List<String> imageIds) throws IOException {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("imageIds", imageIds);
        ValueEnvelope<List<LineItemImage>> envelope =
                httpClient.put("/v1/quotes/" + quoteId + "/items/" + itemId + "/images/order", body, LINE_ITEM_IMAGES);
        return envelope.getResults();
    }

    /**
     * Remove one image from a custom line item. Returns the images left.
     */
    public List<LineItemImage> removeLineItemImage(String quoteId, String itemId, String imageId) throws IOException {
        ValueEnvelope<List<LineItemImage>> envelope = httpClient.delete(
                "/v1/quotes/" + quoteId + "/items/" + itemId + "/images/" + imageId, LINE_ITEM_IMAGES);
        return envelope.getResults();
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
     * Bulk create products with partial success. Rows use the same field shapes as
     * {@link #createProduct(CreateProductRequest)} and are passed through verbatim.
     */
    public BulkImportResult bulkCreateProducts(List<CreateProductRequest> rows) throws IOException {
        return bulkImport("/v1/products/bulk", rows);
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
        ResultEnvelope<Product> envelope = httpClient.patchRawJson("/v1/products/" + id, buildPatchBody(request), type);
        return envelope.getResult();
    }

    /**
     * Delete a product.
     */
    public SuccessResponse deleteProduct(String id) throws IOException {
        return httpClient.delete("/v1/products/" + id, SuccessResponse.class);
    }

    /**
     * Duplicate a product. The copy is called "Copy of &lt;name&gt;".
     */
    public Product duplicateProduct(String id) throws IOException {
        return duplicateProduct(id, null);
    }

    /**
     * Duplicate a product and name the copy (null or blank: "Copy of &lt;name&gt;").
     */
    public Product duplicateProduct(String id, String name) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Product>>(){}.getType();
        ResultEnvelope<Product> envelope = httpClient.post("/v1/products/" + id + "/duplicate", duplicateBody(name), type);
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

    /**
     * The images each product shows on a quote: up to three, in display order (empty when none).
     */
    public Map<String, List<ProductImage>> getProductQuoteImages(List<String> productIds) throws IOException {
        Map<String, Object> body = new HashMap<>();
        body.put("productIds", productIds);
        Type type = new TypeToken<ValueEnvelope<Map<String, List<ProductImage>>>>(){}.getType();
        ValueEnvelope<Map<String, List<ProductImage>>> envelope = httpClient.post("/v1/products/quote-images", body, type);
        return envelope.getResults();
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
        // The backend joiPriceBook POST schema requires discountPercent (omitting it returns 400),
        // even though it documents a default of 0. Fill the documented default when the caller
        // omits it, without mutating the caller's request object.
        JsonObject body = gson.toJsonTree(request).getAsJsonObject();
        if (!body.has("discountPercent")) {
            body.addProperty("discountPercent", 0);
        }
        ResultEnvelope<PriceBook> envelope = httpClient.post("/v1/pricebooks", body, type);
        return envelope.getResult();
    }

    /**
     * Bulk create price books with partial success. Rows use the same field shapes as
     * {@link #createPriceBook(CreatePriceBookRequest)} and are passed through verbatim.
     */
    public BulkImportResult bulkCreatePriceBooks(List<CreatePriceBookRequest> rows) throws IOException {
        return bulkImport("/v1/pricebooks/bulk", rows);
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
        ResultEnvelope<PriceBook> envelope = httpClient.patchRawJson("/v1/pricebooks/" + id, buildPatchBody(request), type);
        return envelope.getResult();
    }

    /**
     * Delete a price book. The org's default price book is refused (400 ValidationException,
     * code {@code PriceBookIsDefault}).
     */
    public SuccessResponse deletePriceBook(String id) throws IOException {
        return httpClient.delete("/v1/pricebooks/" + id, SuccessResponse.class);
    }

    /**
     * Duplicate a price book. The copy is called "Copy of &lt;name&gt;".
     */
    public PriceBook duplicatePriceBook(String id) throws IOException {
        return duplicatePriceBook(id, null);
    }

    /**
     * Duplicate a price book and name the copy (null or blank: "Copy of &lt;name&gt;").
     */
    public PriceBook duplicatePriceBook(String id, String name) throws IOException {
        Type type = new TypeToken<ResultEnvelope<PriceBook>>(){}.getType();
        ResultEnvelope<PriceBook> envelope = httpClient.post("/v1/pricebooks/" + id + "/duplicate", duplicateBody(name), type);
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
     * Bulk create bundles with partial success. Rows use the same field shapes as
     * {@link #createBundle(CreateBundleRequest)} and are passed through verbatim.
     */
    public BulkImportResult bulkCreateBundles(List<CreateBundleRequest> rows) throws IOException {
        return bulkImport("/v1/bundles/bulk", rows);
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
        ResultEnvelope<Bundle> envelope = httpClient.patchRawJson("/v1/bundles/" + id, buildPatchBody(request), type);
        return envelope.getResult();
    }

    /**
     * Delete a bundle.
     */
    public SuccessResponse deleteBundle(String id) throws IOException {
        return httpClient.delete("/v1/bundles/" + id, SuccessResponse.class);
    }

    /**
     * Duplicate a bundle. The copy is called "Copy of &lt;name&gt;".
     */
    public Bundle duplicateBundle(String id) throws IOException {
        return duplicateBundle(id, null);
    }

    /**
     * Duplicate a bundle and name the copy (null or blank: "Copy of &lt;name&gt;").
     */
    public Bundle duplicateBundle(String id, String name) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Bundle>>(){}.getType();
        ResultEnvelope<Bundle> envelope = httpClient.post("/v1/bundles/" + id + "/duplicate", duplicateBody(name), type);
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
     * Bulk create companies with partial success. Rows use the same field shapes as
     * {@link #createCompany(CreateCompanyRequest)} and are passed through verbatim
     * (the backend requires each row to have a {@code contacts} array with at least one contact).
     */
    public BulkImportResult bulkCreateCompanies(List<CreateCompanyRequest> rows) throws IOException {
        return bulkImport("/v1/companies/bulk", rows);
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
        ResultEnvelope<Company> envelope = httpClient.patchRawJson("/v1/companies/" + id, buildPatchBody(request), type);
        return envelope.getResult();
    }

    /**
     * Delete a company and its contacts. Refused with a 409 ({@code ConflictException}, code
     * {@code CompanyHasOpenQuotes}) while it has open quotes (draft, pending approval or sent) —
     * see {@link #getCompanyOpenQuotes(String)}.
     */
    public SuccessResponse deleteCompany(String id) throws IOException {
        return httpClient.delete("/v1/companies/" + id, SuccessResponse.class);
    }

    /**
     * The open quotes (draft, pending approval, sent) for a company: what blocks deleting it.
     */
    public OpenQuotesResponse getCompanyOpenQuotes(String companyId) throws IOException {
        return httpClient.get("/v1/companies/" + companyId + "/open-quotes", OpenQuotesResponse.class);
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
     * Bulk create contacts with partial success. Rows use the same field shapes as
     * {@link #createContact(CreateContactRequest)} and are passed through verbatim
     * (the backend requires {@code companyId} on each row).
     */
    public BulkImportResult bulkCreateContacts(List<CreateContactRequest> rows) throws IOException {
        return bulkImport("/v1/contacts/bulk", rows);
    }

    /**
     * Update a contact.
     */
    public Contact updateContact(String id, UpdateContactRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<Contact>>(){}.getType();
        ResultEnvelope<Contact> envelope = httpClient.patchRawJson("/v1/contacts/" + id, buildPatchBody(request), type);
        return envelope.getResult();
    }

    /**
     * Delete a contact. Refused with a 409 ({@code ConflictException}) when they are the
     * company's only contact ({@code LastContact}) or the contact on open quotes
     * ({@code ContactHasOpenQuotes}) — see {@link #getContactOpenQuotes(String)}.
     */
    public SuccessResponse deleteContact(String id) throws IOException {
        return httpClient.delete("/v1/contacts/" + id, SuccessResponse.class);
    }

    /**
     * The open quotes (draft, pending approval, sent) made out to a contact: what blocks deleting them.
     */
    public OpenQuotesResponse getContactOpenQuotes(String contactId) throws IOException {
        return httpClient.get("/v1/contacts/" + contactId + "/open-quotes", OpenQuotesResponse.class);
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
        ResultEnvelope<QuoteTemplate> envelope = httpClient.patchRawJson("/v1/quote-templates/" + id, buildPatchBody(request), type);
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
     * Bulk create types/categories with partial success. Rows use the same field shapes as
     * {@link #createType(CreateQuoteTypeRequest)} and are passed through verbatim.
     */
    public BulkImportResult bulkCreateTypes(List<CreateQuoteTypeRequest> rows) throws IOException {
        return bulkImport("/v1/types/bulk", rows);
    }

    /**
     * Update a type/category.
     */
    public QuoteType updateType(String id, UpdateQuoteTypeRequest request) throws IOException {
        Type type = new TypeToken<ResultEnvelope<QuoteType>>(){}.getType();
        ResultEnvelope<QuoteType> envelope = httpClient.patchRawJson("/v1/types/" + id, buildPatchBody(request), type);
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
        // Serialize the full request and strip convenience fields (items, bundleItems, send).
        // Everything else passes through to POST /v1/quotes, so future quote fields
        // added to CreateAndSendRequest will automatically flow through.
        JsonObject quoteFields = gson.toJsonTree(request).getAsJsonObject();
        quoteFields.remove("items");
        quoteFields.remove("bundleItems");
        quoteFields.remove("send");

        // Step 1: Create the quote
        Type quoteEnvelopeType = new TypeToken<ResultEnvelope<Quote>>(){}.getType();
        ResultEnvelope<Quote> envelope = httpClient.post("/v1/quotes", quoteFields, quoteEnvelopeType);
        Quote quote = envelope.getResult();

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
    // QUOTE NUMBER CONFIG (admin only)
    // ============================================

    /**
     * Get the org's quote numbering configuration (format + current floor).
     *
     * <p>Admin only. Unwraps the inner {@code results} object.</p>
     */
    public QuoteNumberConfig getQuoteNumberConfig() throws IOException {
        QuoteNumberConfigEnvelope envelope =
                httpClient.get("/v1/quotes/number-config", QuoteNumberConfigEnvelope.class);
        return envelope.getResults();
    }

    /**
     * Update the org's quote numbering format. The request body is the full
     * {@link QuoteNumberFormat} (all eight fields). Returns the updated config
     * (format + current floor).
     *
     * <p>Admin only. Unwraps the inner {@code results} object.</p>
     */
    public QuoteNumberConfig updateQuoteNumberConfig(QuoteNumberFormat format) throws IOException {
        QuoteNumberConfigEnvelope envelope =
                httpClient.patch("/v1/quotes/number-config", format, QuoteNumberConfigEnvelope.class);
        return envelope.getResults();
    }

    /**
     * The number the next new quote will get. Read only — the counter doesn't move, so a quote
     * created by someone else in between takes it first.
     */
    public NextQuoteNumber getNextQuoteNumber() throws IOException {
        Type type = new TypeToken<ValueEnvelope<NextQuoteNumber>>(){}.getType();
        ValueEnvelope<NextQuoteNumber> envelope = httpClient.get("/v1/quotes/number-config/next", type);
        return envelope.getResults();
    }

    // ============================================
    // PRIVATE HELPERS
    // ============================================

    /** Unwraps { results: T } where results is one value (an object, a map or a list). */
    private static final class ValueEnvelope<T> {
        private T results;

        T getResults() { return results; }
    }

    /** A duplicate's body: the copy's name when given, else none (the API names it "Copy of …"). */
    private static Map<String, String> duplicateBody(String name) {
        if (name == null) return null;
        Map<String, String> body = new LinkedHashMap<>();
        body.put("name", name);
        return body;
    }

    /**
     * Flattens a {@link SignatureSchedule} onto the send body as eight top-level keys.
     *
     * <p>Quote send is a JSON endpoint, so — unlike TurboSign's multipart path, which JSON-encodes
     * each duration as a string — the durations are emitted as real {@code {value, unit}} objects
     * and the booleans/integer as JSON primitives. The keys sit FLAT alongside {@code ccEmails} /
     * {@code validUntil}; a "schedule" wrapper would be wrong. Any nested "schedule" left by
     * serializing the request POJO is removed first.
     *
     * <p>Presence is null-checked, never truthiness: a deliberate {@code false} (feature off),
     * {@code 0} (no reminders / never warn) or {@code -1} (unlimited) must survive; an omitted
     * field is dropped so the org default stands.
     *
     * @return the same {@code body} object, for call-site chaining
     */
    private JsonObject flattenSchedule(JsonObject body, SignatureSchedule schedule) {
        body.remove("schedule");
        if (schedule == null) {
            return body;
        }

        if (schedule.getRemindersEnabled() != null) {
            body.addProperty("remindersEnabled", schedule.getRemindersEnabled());
        }
        if (schedule.getMaxReminders() != null) {
            body.addProperty("maxReminders", schedule.getMaxReminders());
        }
        if (schedule.getExpirationEnabled() != null) {
            body.addProperty("expirationEnabled", schedule.getExpirationEnabled());
        }

        putScheduleDuration(body, "reminderDelay", schedule.getReminderDelay());
        putScheduleDuration(body, "reminderInterval", schedule.getReminderInterval());
        putScheduleDuration(body, "expireAfter", schedule.getExpireAfter());
        putScheduleDuration(body, "expirationWarning", schedule.getExpirationWarning());
        putScheduleDuration(body, "expirationWarningInterval", schedule.getExpirationWarningInterval());

        return body;
    }

    /** Emits a duration as a nested {@code {value, unit}} JSON object (JSON endpoint, not multipart). */
    private void putScheduleDuration(JsonObject body, String key, SignatureSchedule.Duration duration) {
        if (duration != null) {
            body.add(key, gson.toJsonTree(duration));
        }
    }

    /**
     * Shared shape for the six bulk-create endpoints: POST {@code { "rows": [...] }}
     * to the entity's {@code /bulk} path and unwrap the inner {@code results} object.
     *
     * <p>Rows are passed through verbatim — no client-side validation (including the
     * server's 500-row cap, which is enforced server-side with HTTP 400).</p>
     */
    private BulkImportResult bulkImport(String path, List<?> rows) throws IOException {
        Map<String, Object> body = new HashMap<>();
        body.put("rows", rows);
        BulkImportResultEnvelope envelope = httpClient.post(path, body, BulkImportResultEnvelope.class);
        return envelope.getResults();
    }

    /**
     * Build a JSON body string for PATCH requests using field-tracking.
     *
     * <p>Only includes fields that were explicitly set via setters (including
     * those set to {@code null}). Fields that the caller never touched are
     * omitted entirely, so the backend won't reset them.</p>
     *
     * <p>Returns a pre-serialized JSON string (using {@code serializeNulls})
     * because default Gson drops {@code JsonNull} entries from a {@code JsonObject}
     * during serialization.</p>
     *
     * @param request a {@link TrackableRequest} subclass with field tracking
     * @return a JSON string containing only the explicitly set fields
     */
    private String buildPatchBody(TrackableRequest request) {
        // serializeNulls so fields explicitly set to null appear in the tree AND output.
        Gson nullGson = NULL_PRESERVING_GSON;
        JsonObject full = nullGson.toJsonTree(request).getAsJsonObject();
        JsonObject filtered = new JsonObject();
        for (String field : request.getSetFields()) {
            filtered.add(field, full.has(field) ? full.get(field) : com.google.gson.JsonNull.INSTANCE);
        }
        return nullGson.toJson(filtered);
    }

    /**
     * Detect image MIME type from magic bytes.
     *
     * @param data the raw image bytes
     * @return the detected MIME type, or "application/octet-stream" if unknown
     */
    private String detectImageMimeType(byte[] data) {
        if (data.length >= 4 && data[0] == (byte) 0x89 && data[1] == 0x50 && data[2] == 0x4E && data[3] == 0x47) {
            return "image/png";
        }
        if (data.length >= 3 && data[0] == (byte) 0xFF && data[1] == (byte) 0xD8 && data[2] == (byte) 0xFF) {
            return "image/jpeg";
        }
        if (data.length >= 4 && data[0] == 0x47 && data[1] == 0x49 && data[2] == 0x46 && data[3] == 0x38) {
            return "image/gif";
        }
        if (data.length >= 12 && data[0] == 0x52 && data[1] == 0x49 && data[2] == 0x46 && data[3] == 0x46
                && data[8] == 0x57 && data[9] == 0x45 && data[10] == 0x42 && data[11] == 0x50) {
            return "image/webp";
        }
        return "application/octet-stream";
    }

    /**
     * Get a filename with the correct extension for the given MIME type.
     *
     * @param mimeType the detected MIME type
     * @return a filename like "image.png", "image.jpg", etc.
     */
    private String getImageFilename(String mimeType) {
        switch (mimeType) {
            case "image/png": return "image.png";
            case "image/jpeg": return "image.jpg";
            case "image/gif": return "image.gif";
            case "image/webp": return "image.webp";
            default: return "image";
        }
    }

    /**
     * Build multipart form data for product create/update with images.
     * Non-image fields go into a "data" JSON field, images go as separate parts.
     * Image MIME types and filenames are detected from magic bytes.
     */
    private MultipartBody buildProductFormData(Object request, byte[][] images) {
        // Serialize the request object (images field is transient, won't be included)
        // For TrackableRequest (PATCH), use buildPatchBody to preserve explicit nulls
        String dataJson = (request instanceof TrackableRequest)
                ? buildPatchBody((TrackableRequest) request)
                : gson.toJson(request);

        MultipartBody.Builder builder = new MultipartBody.Builder()
                .setType(MultipartBody.FORM)
                .addFormDataPart("data", dataJson);

        if (images != null) {
            for (byte[] image : images) {
                String mimeType = detectImageMimeType(image);
                String filename = getImageFilename(mimeType);
                builder.addFormDataPart("images", filename,
                        RequestBody.create(image, MediaType.parse(mimeType)));
            }
        }

        return builder.build();
    }
}
