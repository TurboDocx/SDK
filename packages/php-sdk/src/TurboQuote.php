<?php

declare(strict_types=1);

namespace TurboDocx;

use TurboDocx\Config\QuoteClientConfig;
use TurboDocx\Types\Quote\BulkImportResult;
use TurboDocx\Types\Quote\Bundle;
use TurboDocx\Types\Quote\Company;
use TurboDocx\Types\Quote\Contact;
use TurboDocx\Types\Quote\LineItem;
use TurboDocx\Types\Quote\PriceBook;
use TurboDocx\Types\Quote\Product;
use TurboDocx\Types\Quote\Quote;
use TurboDocx\Types\Quote\QuoteNumberConfig;
use TurboDocx\Types\Quote\QuoteNumberFormat;
use TurboDocx\Types\Quote\QuoteTemplate;
use TurboDocx\Types\Quote\QuoteType;
use TurboDocx\Types\Requests\Quote\AddBundleLineItemRequest;
use TurboDocx\Types\Requests\Quote\AddLineItemRequest;
use TurboDocx\Types\Requests\Quote\CreateAndSendRequest;
use TurboDocx\Types\Requests\Quote\CreateBundleRequest;
use TurboDocx\Types\Requests\Quote\CreateCompanyRequest;
use TurboDocx\Types\Requests\Quote\CreateContactRequest;
use TurboDocx\Types\Requests\Quote\CreatePriceBookRequest;
use TurboDocx\Types\Requests\Quote\CreateProductRequest;
use TurboDocx\Types\Requests\Quote\CreateQuoteRequest;
use TurboDocx\Types\Requests\Quote\CreateQuoteTemplateRequest;
use TurboDocx\Types\Requests\Quote\CreateQuoteTypeRequest;
use TurboDocx\Types\Requests\Quote\DeclineQuoteRequest;
use TurboDocx\Types\Requests\Quote\HandleExpiredQuoteRequest;
use TurboDocx\Types\Requests\Quote\ListBundlesRequest;
use TurboDocx\Types\Requests\Quote\ListCompaniesRequest;
use TurboDocx\Types\Requests\Quote\ListContactsRequest;
use TurboDocx\Types\Requests\Quote\ListLineItemsRequest;
use TurboDocx\Types\Requests\Quote\ListPriceBookProductsRequest;
use TurboDocx\Types\Requests\Quote\ListPriceBooksRequest;
use TurboDocx\Types\Requests\Quote\ListProductsRequest;
use TurboDocx\Types\Requests\Quote\ListQuotesRequest;
use TurboDocx\Types\Requests\Quote\ListTemplatesRequest;
use TurboDocx\Types\Requests\Quote\ListTypesRequest;
use TurboDocx\Types\Requests\Quote\SendQuoteRequest;
use TurboDocx\Types\Requests\Quote\SendQuoteWithDeliverableRequest;
use TurboDocx\Types\Requests\Quote\UpdateBundleRequest;
use TurboDocx\Types\Requests\Quote\UpdateCompanyRequest;
use TurboDocx\Types\Requests\Quote\UpdateContactRequest;
use TurboDocx\Types\Requests\Quote\UpdateLineItemRequest;
use TurboDocx\Types\Requests\Quote\UpdatePriceBookRequest;
use TurboDocx\Types\Requests\Quote\UpdateProductRequest;
use TurboDocx\Types\Requests\Quote\UpdateQuoteRequest;
use TurboDocx\Types\Requests\Quote\UpdateQuoteTemplateRequest;
use TurboDocx\Types\Requests\Quote\UpdateQuoteTypeRequest;
use TurboDocx\Types\Requests\Quote\VoidQuoteRequest;
use TurboDocx\Types\Responses\Quote\ApplyPriceBookResponse;
use TurboDocx\Types\Responses\Quote\BundleListResponse;
use TurboDocx\Types\Responses\Quote\CompanyListResponse;
use TurboDocx\Types\Responses\Quote\ContactListResponse;
use TurboDocx\Types\Responses\Quote\CreateAndSendResponse;
use TurboDocx\Types\Responses\Quote\LineItemListResponse;
use TurboDocx\Types\Responses\Quote\MessageResponse;
use TurboDocx\Types\Responses\Quote\PriceBookListResponse;
use TurboDocx\Types\Responses\Quote\PriceBookProductListResponse;
use TurboDocx\Types\Responses\Quote\ProductListResponse;
use TurboDocx\Types\Responses\Quote\QuoteListResponse;
use TurboDocx\Types\Responses\Quote\QuoteTemplateListResponse;
use TurboDocx\Types\Responses\Quote\QuoteTypeListResponse;
use TurboDocx\Types\Responses\Quote\SendQuoteResponse;
use TurboDocx\Types\Responses\Quote\SendQuoteWithDeliverableResponse;

/**
 * TurboQuote - Quoting operations
 *
 * Static class for managing quotes, line items, products, bundles,
 * price books, companies, contacts, templates, and types.
 *
 * @example
 * ```php
 * TurboQuote::configure(new QuoteClientConfig(
 *     apiKey: 'your-api-key',
 *     orgId: 'your-org-id',
 * ));
 *
 * $quote = TurboQuote::createQuote(new CreateQuoteRequest(
 *     name: 'Enterprise License',
 *     companyId: 'c-1',
 *     contactId: 'ct-1',
 * ));
 * ```
 */
final class TurboQuote
{
    /** @var HttpClient|null */
    private static ?HttpClient $client = null;

    /**
     * Configure TurboQuote with API credentials
     *
     * @param QuoteClientConfig $config Configuration object
     * @return void
     */
    public static function configure(QuoteClientConfig $config): void
    {
        self::$client = new HttpClient($config);
    }

    /**
     * Get client instance, auto-initialize from environment if needed
     *
     * @return HttpClient
     */
    private static function getClient(): HttpClient
    {
        if (self::$client === null) {
            self::$client = new HttpClient(
                QuoteClientConfig::fromEnvironment()
            );
        }
        return self::$client;
    }

    /**
     * Unwrap single-entity response: { result: T } -> T
     *
     * @param array<string, mixed> $response
     * @return array<string, mixed>
     */
    private static function unwrap(array $response): array
    {
        return $response['result'];
    }

    /**
     * Build multipart form data for product creation/update with images.
     *
     * @param array<string, mixed> $request
     * @return array<array{name: string, contents: string, filename?: string}>
     */
    private static function buildProductFormData(array $request): array
    {
        $images = $request['images'] ?? [];
        unset($request['images']);

        $encoded = json_encode($request);
        if ($encoded === false) {
            throw new Exceptions\ValidationException('Failed to encode product data as JSON');
        }

        $multipart = [
            [
                'name' => 'data',
                'contents' => $encoded,
            ],
        ];

        foreach ($images as $image) {
            if (is_string($image) && file_exists($image)) {
                // File path
                $contents = file_get_contents($image);
                if ($contents === false) {
                    throw new Exceptions\ValidationException("Failed to read image file: {$image}");
                }
                $multipart[] = [
                    'name' => 'images',
                    'contents' => $contents,
                    'filename' => basename($image),
                ];
            } elseif (is_string($image)) {
                // Raw bytes
                $multipart[] = [
                    'name' => 'images',
                    'contents' => $image,
                    'filename' => 'image.jpg',
                ];
            }
        }

        return $multipart;
    }

    /**
     * POST rows to a bulk-create endpoint and unwrap the results envelope.
     *
     * Rows are serialized verbatim (camelCase keys) inside a `{ rows: [...] }`
     * envelope. The backend processes rows sequentially with partial success —
     * failed rows are reported in the result, not thrown.
     *
     * @param string $path
     * @param array<int, array<string, mixed>> $rows Serialized request rows
     * @return BulkImportResult
     */
    private static function bulkImport(string $path, array $rows): BulkImportResult
    {
        $client = self::getClient();
        $response = $client->post($path, ['rows' => $rows]);
        return BulkImportResult::fromArray($response['results']);
    }

    // ============================================
    // QUOTES — CRUD
    // ============================================

    /**
     * List quotes with optional pagination and filters.
     *
     * @param ListQuotesRequest|null $request
     * @return QuoteListResponse
     */
    public static function listQuotes(?ListQuotesRequest $request = null): QuoteListResponse
    {
        $client = self::getClient();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get('/v1/quotes', $params);
        return QuoteListResponse::fromArray($response);
    }

    /**
     * Create a new quote.
     *
     * @param CreateQuoteRequest $request
     * @return Quote
     */
    public static function createQuote(CreateQuoteRequest $request): Quote
    {
        $client = self::getClient();
        return Quote::fromArray(self::unwrap($client->post('/v1/quotes', $request->toArray())));
    }

    /**
     * Get a quote by ID, including statusInfo and preparedBy if present.
     *
     * `preparedBy` is the resolved "Prepared by" identity (`['name' => ?, 'email' => ?]`)
     * shown on the quote PDF and preview. Resolved server-side from the org template then the
     * creator; for an API-key-created quote it is the API key's label with no email. Prefer it
     * over `creator` for customer-facing display — `creator` may be the internal API service user.
     *
     * @param string $id
     * @return Quote
     */
    public static function getQuote(string $id): Quote
    {
        $client = self::getClient();
        $response = $client->get("/v1/quotes/{$id}");
        $quoteData = $response['result'];
        if (isset($response['statusInfo'])) {
            $quoteData['statusInfo'] = $response['statusInfo'];
        }
        if (isset($response['preparedBy'])) {
            $quoteData['preparedBy'] = $response['preparedBy'];
        }
        return Quote::fromArray($quoteData);
    }

    /**
     * Update a quote.
     *
     * @param string $id
     * @param UpdateQuoteRequest $request
     * @return Quote
     */
    public static function updateQuote(string $id, UpdateQuoteRequest $request): Quote
    {
        $client = self::getClient();
        return Quote::fromArray(self::unwrap($client->patch("/v1/quotes/{$id}", $request->toArray())));
    }

    /**
     * Delete a quote.
     *
     * @param string $id
     * @return MessageResponse
     */
    public static function deleteQuote(string $id): MessageResponse
    {
        $client = self::getClient();
        return MessageResponse::fromArray($client->delete("/v1/quotes/{$id}"));
    }

    /**
     * Duplicate a quote.
     *
     * @param string $id
     * @return Quote
     */
    public static function duplicateQuote(string $id): Quote
    {
        $client = self::getClient();
        return Quote::fromArray(self::unwrap($client->post("/v1/quotes/{$id}/duplicate")));
    }

    /**
     * Apply a price book to a quote.
     *
     * @param string $quoteId
     * @param string $priceBookId
     * @return ApplyPriceBookResponse
     */
    public static function applyPriceBook(string $quoteId, string $priceBookId): ApplyPriceBookResponse
    {
        $client = self::getClient();
        $response = $client->post("/v1/quotes/{$quoteId}/apply-pricebook", ['priceBookId' => $priceBookId]);
        return ApplyPriceBookResponse::fromArray($response);
    }

    /**
     * Remove a price book from a quote.
     *
     * @param string $quoteId
     * @return Quote
     */
    public static function removePriceBook(string $quoteId): Quote
    {
        $client = self::getClient();
        return Quote::fromArray(self::unwrap($client->post("/v1/quotes/{$quoteId}/remove-pricebook")));
    }

    /**
     * Download a quote as PDF.
     *
     * @param string $id
     * @return string Raw PDF bytes
     */
    public static function downloadQuotePdf(string $id): string
    {
        $client = self::getClient();
        return $client->getRaw("/v1/quotes/{$id}/pdf");
    }

    // ============================================
    // QUOTES — STATUS TRANSITIONS
    // ============================================

    /**
     * Send a quote.
     *
     * @param string $id
     * @param SendQuoteRequest|null $request
     * @return SendQuoteResponse
     */
    public static function sendQuote(string $id, ?SendQuoteRequest $request = null): SendQuoteResponse
    {
        $client = self::getClient();
        $response = $client->post("/v1/quotes/{$id}/send", $request?->toArray());
        return SendQuoteResponse::fromArray($response);
    }

    /**
     * Send a quote with a deliverable document.
     *
     * @param string $id
     * @param SendQuoteWithDeliverableRequest $request
     * @return SendQuoteWithDeliverableResponse
     */
    public static function sendQuoteWithDeliverable(string $id, SendQuoteWithDeliverableRequest $request): SendQuoteWithDeliverableResponse
    {
        $client = self::getClient();
        $response = $client->post("/v1/quotes/{$id}/send-with-deliverable", $request->toArray());
        return SendQuoteWithDeliverableResponse::fromArray($response);
    }

    /**
     * Decline a quote.
     *
     * @param string $id
     * @param DeclineQuoteRequest $request
     * @return Quote
     */
    public static function declineQuote(string $id, DeclineQuoteRequest $request): Quote
    {
        $client = self::getClient();
        return Quote::fromArray(self::unwrap($client->post("/v1/quotes/{$id}/decline", $request->toArray())));
    }

    /**
     * Void a quote.
     *
     * @param string $id
     * @param VoidQuoteRequest $request
     * @return Quote
     */
    public static function voidQuote(string $id, VoidQuoteRequest $request): Quote
    {
        $client = self::getClient();
        return Quote::fromArray(self::unwrap($client->post("/v1/quotes/{$id}/void", $request->toArray())));
    }

    /**
     * Handle an expired sent quote: void or decline the original and return a
     * duplicate carrying the new validUntil date.
     *
     * @param string $id
     * @param HandleExpiredQuoteRequest $request action is 'void' or 'decline'
     * @return Quote The newly created duplicate quote
     */
    public static function handleExpiredQuote(string $id, HandleExpiredQuoteRequest $request): Quote
    {
        $client = self::getClient();
        return Quote::fromArray(self::unwrap($client->post("/v1/quotes/{$id}/handle-expired-sent", $request->toArray())));
    }

    // ============================================
    // LINE ITEMS
    // ============================================

    /**
     * List line items for a quote.
     *
     * @param string $quoteId
     * @param ListLineItemsRequest|null $request
     * @return LineItemListResponse
     */
    public static function listLineItems(string $quoteId, ?ListLineItemsRequest $request = null): LineItemListResponse
    {
        $client = self::getClient();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get("/v1/quotes/{$quoteId}/items", $params);
        return LineItemListResponse::fromArray($response);
    }

    /**
     * Add line items to a quote.
     *
     * @param string $quoteId
     * @param AddLineItemRequest|array<AddLineItemRequest> $items Single item or array of items
     * @return array<LineItem>
     */
    public static function addLineItems(string $quoteId, AddLineItemRequest|array $items): array
    {
        $client = self::getClient();
        $itemsArray = $items instanceof AddLineItemRequest ? [$items] : $items;
        $payload = array_map(fn(AddLineItemRequest $item) => $item->toArray(), $itemsArray);
        $response = $client->post("/v1/quotes/{$quoteId}/items", $payload);
        return array_map(fn(array $item) => LineItem::fromArray($item), $response['results']);
    }

    /**
     * Add bundle line items to a quote.
     *
     * @param string $quoteId
     * @param AddBundleLineItemRequest|array<AddBundleLineItemRequest> $items Single item or array of items
     * @return array<LineItem>
     */
    public static function addBundleLineItems(string $quoteId, AddBundleLineItemRequest|array $items): array
    {
        $client = self::getClient();
        $itemsArray = $items instanceof AddBundleLineItemRequest ? [$items] : $items;
        $payload = array_map(fn(AddBundleLineItemRequest $item) => $item->toArray(), $itemsArray);
        $response = $client->post("/v1/quotes/{$quoteId}/items/bundle", $payload);
        return array_map(fn(array $item) => LineItem::fromArray($item), $response['results']);
    }

    /**
     * Update a line item.
     *
     * @param string $quoteId
     * @param string $itemId
     * @param UpdateLineItemRequest $request
     * @return LineItem
     */
    public static function updateLineItem(string $quoteId, string $itemId, UpdateLineItemRequest $request): LineItem
    {
        $client = self::getClient();
        return LineItem::fromArray(self::unwrap($client->patch("/v1/quotes/{$quoteId}/items/{$itemId}", $request->toArray())));
    }

    /**
     * Remove a line item.
     *
     * @param string $quoteId
     * @param string $itemId
     * @return MessageResponse
     */
    public static function removeLineItem(string $quoteId, string $itemId): MessageResponse
    {
        $client = self::getClient();
        return MessageResponse::fromArray($client->delete("/v1/quotes/{$quoteId}/items/{$itemId}"));
    }

    // ============================================
    // PRODUCTS
    // ============================================

    /**
     * List products with optional filters.
     *
     * @param ListProductsRequest|null $request
     * @return ProductListResponse
     */
    public static function listProducts(?ListProductsRequest $request = null): ProductListResponse
    {
        $client = self::getClient();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get('/v1/products', $params);
        return ProductListResponse::fromArray($response);
    }

    /**
     * Create a product. If images are provided, uses multipart form upload.
     *
     * @param CreateProductRequest $request
     * @return Product
     */
    public static function createProduct(CreateProductRequest $request): Product
    {
        $client = self::getClient();
        $data = $request->toArray();
        if (!empty($data['images'])) {
            $multipart = self::buildProductFormData($data);
            return Product::fromArray(self::unwrap($client->postFormData('/v1/products', $multipart)));
        }
        return Product::fromArray(self::unwrap($client->post('/v1/products', $data)));
    }

    /**
     * Bulk create products (partial success; failed rows do not throw).
     *
     * @param array<CreateProductRequest> $rows
     * @return BulkImportResult
     */
    public static function bulkCreateProducts(array $rows): BulkImportResult
    {
        return self::bulkImport('/v1/products/bulk', array_map(fn(CreateProductRequest $row) => $row->toArray(), $rows));
    }

    /**
     * Get a product by ID.
     *
     * @param string $id
     * @return Product
     */
    public static function getProduct(string $id): Product
    {
        $client = self::getClient();
        return Product::fromArray(self::unwrap($client->get("/v1/products/{$id}")));
    }

    /**
     * Update a product. If images are provided, uses multipart form upload.
     *
     * @param string $id
     * @param UpdateProductRequest $request
     * @return Product
     */
    public static function updateProduct(string $id, UpdateProductRequest $request): Product
    {
        $client = self::getClient();
        $data = $request->toArray();
        if (!empty($data['images'])) {
            $multipart = self::buildProductFormData($data);
            return Product::fromArray(self::unwrap($client->patchFormData("/v1/products/{$id}", $multipart)));
        }
        return Product::fromArray(self::unwrap($client->patch("/v1/products/{$id}", $data)));
    }

    /**
     * Delete a product.
     *
     * @param string $id
     * @return MessageResponse
     */
    public static function deleteProduct(string $id): MessageResponse
    {
        $client = self::getClient();
        return MessageResponse::fromArray($client->delete("/v1/products/{$id}"));
    }

    /**
     * Duplicate a product.
     *
     * @param string $id
     * @return Product
     */
    public static function duplicateProduct(string $id): Product
    {
        $client = self::getClient();
        return Product::fromArray(self::unwrap($client->post("/v1/products/{$id}/duplicate")));
    }

    /**
     * Get primary images for a list of products.
     *
     * @param string[] $productIds
     * @return array<string, array<string, mixed>|null>
     */
    public static function getProductPrimaryImages(array $productIds): array
    {
        $client = self::getClient();
        $response = $client->post('/v1/products/primary-images', ['productIds' => $productIds]);
        return $response['results'];
    }

    // ============================================
    // PRICE BOOKS
    // ============================================

    /**
     * List price books.
     *
     * @param ListPriceBooksRequest|null $request
     * @return PriceBookListResponse
     */
    public static function listPriceBooks(?ListPriceBooksRequest $request = null): PriceBookListResponse
    {
        $client = self::getClient();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get('/v1/pricebooks', $params);
        return PriceBookListResponse::fromArray($response);
    }

    /**
     * Create a price book.
     *
     * @param CreatePriceBookRequest $request
     * @return PriceBook
     */
    public static function createPriceBook(CreatePriceBookRequest $request): PriceBook
    {
        $client = self::getClient();
        $body = $request->toArray();
        // Backend requires discountPercent; fill the documented default when the caller omits it.
        $body['discountPercent'] ??= 0.0;
        return PriceBook::fromArray(self::unwrap($client->post('/v1/pricebooks', $body)));
    }

    /**
     * Bulk create price books (partial success; failed rows do not throw).
     *
     * @param array<CreatePriceBookRequest> $rows
     * @return BulkImportResult
     */
    public static function bulkCreatePriceBooks(array $rows): BulkImportResult
    {
        return self::bulkImport('/v1/pricebooks/bulk', array_map(fn(CreatePriceBookRequest $row) => $row->toArray(), $rows));
    }

    /**
     * Get a price book by ID.
     *
     * @param string $id
     * @return PriceBook
     */
    public static function getPriceBook(string $id): PriceBook
    {
        $client = self::getClient();
        return PriceBook::fromArray(self::unwrap($client->get("/v1/pricebooks/{$id}")));
    }

    /**
     * Update a price book.
     *
     * @param string $id
     * @param UpdatePriceBookRequest $request
     * @return PriceBook
     */
    public static function updatePriceBook(string $id, UpdatePriceBookRequest $request): PriceBook
    {
        $client = self::getClient();
        return PriceBook::fromArray(self::unwrap($client->patch("/v1/pricebooks/{$id}", $request->toArray())));
    }

    /**
     * Delete a price book.
     *
     * @param string $id
     * @return MessageResponse
     */
    public static function deletePriceBook(string $id): MessageResponse
    {
        $client = self::getClient();
        return MessageResponse::fromArray($client->delete("/v1/pricebooks/{$id}"));
    }

    /**
     * Duplicate a price book.
     *
     * @param string $id
     * @return PriceBook
     */
    public static function duplicatePriceBook(string $id): PriceBook
    {
        $client = self::getClient();
        return PriceBook::fromArray(self::unwrap($client->post("/v1/pricebooks/{$id}/duplicate")));
    }

    /**
     * List products in a price book.
     *
     * @param string $id
     * @param ListPriceBookProductsRequest|null $request
     * @return PriceBookProductListResponse
     */
    public static function listPriceBookProducts(string $id, ?ListPriceBookProductsRequest $request = null): PriceBookProductListResponse
    {
        $client = self::getClient();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get("/v1/pricebooks/{$id}/products", $params);
        return PriceBookProductListResponse::fromArray($response);
    }

    // ============================================
    // BUNDLES
    // ============================================

    /**
     * List bundles.
     *
     * @param ListBundlesRequest|null $request
     * @return BundleListResponse
     */
    public static function listBundles(?ListBundlesRequest $request = null): BundleListResponse
    {
        $client = self::getClient();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get('/v1/bundles', $params);
        return BundleListResponse::fromArray($response);
    }

    /**
     * Create a bundle.
     *
     * @param CreateBundleRequest $request
     * @return Bundle
     */
    public static function createBundle(CreateBundleRequest $request): Bundle
    {
        $client = self::getClient();
        return Bundle::fromArray(self::unwrap($client->post('/v1/bundles', $request->toArray())));
    }

    /**
     * Bulk create bundles (partial success; failed rows do not throw).
     *
     * @param array<CreateBundleRequest> $rows
     * @return BulkImportResult
     */
    public static function bulkCreateBundles(array $rows): BulkImportResult
    {
        return self::bulkImport('/v1/bundles/bulk', array_map(fn(CreateBundleRequest $row) => $row->toArray(), $rows));
    }

    /**
     * Get a bundle by ID.
     *
     * @param string $id
     * @return Bundle
     */
    public static function getBundle(string $id): Bundle
    {
        $client = self::getClient();
        return Bundle::fromArray(self::unwrap($client->get("/v1/bundles/{$id}")));
    }

    /**
     * Update a bundle.
     *
     * @param string $id
     * @param UpdateBundleRequest $request
     * @return Bundle
     */
    public static function updateBundle(string $id, UpdateBundleRequest $request): Bundle
    {
        $client = self::getClient();
        return Bundle::fromArray(self::unwrap($client->patch("/v1/bundles/{$id}", $request->toArray())));
    }

    /**
     * Delete a bundle.
     *
     * @param string $id
     * @return MessageResponse
     */
    public static function deleteBundle(string $id): MessageResponse
    {
        $client = self::getClient();
        return MessageResponse::fromArray($client->delete("/v1/bundles/{$id}"));
    }

    /**
     * Duplicate a bundle.
     *
     * @param string $id
     * @return Bundle
     */
    public static function duplicateBundle(string $id): Bundle
    {
        $client = self::getClient();
        return Bundle::fromArray(self::unwrap($client->post("/v1/bundles/{$id}/duplicate")));
    }

    // ============================================
    // COMPANIES
    // ============================================

    /**
     * List companies.
     *
     * @param ListCompaniesRequest|null $request
     * @return CompanyListResponse
     */
    public static function listCompanies(?ListCompaniesRequest $request = null): CompanyListResponse
    {
        $client = self::getClient();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get('/v1/companies', $params);
        return CompanyListResponse::fromArray($response);
    }

    /**
     * Create a company.
     *
     * @param CreateCompanyRequest $request
     * @return Company
     */
    public static function createCompany(CreateCompanyRequest $request): Company
    {
        $client = self::getClient();
        return Company::fromArray(self::unwrap($client->post('/v1/companies', $request->toArray())));
    }

    /**
     * Bulk create companies (partial success; failed rows do not throw).
     * Each row requires a contacts array with at least one contact.
     *
     * @param array<CreateCompanyRequest> $rows
     * @return BulkImportResult
     */
    public static function bulkCreateCompanies(array $rows): BulkImportResult
    {
        return self::bulkImport('/v1/companies/bulk', array_map(fn(CreateCompanyRequest $row) => $row->toArray(), $rows));
    }

    /**
     * Get a company by ID.
     *
     * @param string $id
     * @return Company
     */
    public static function getCompany(string $id): Company
    {
        $client = self::getClient();
        return Company::fromArray(self::unwrap($client->get("/v1/companies/{$id}")));
    }

    /**
     * Update a company.
     *
     * @param string $id
     * @param UpdateCompanyRequest $request
     * @return Company
     */
    public static function updateCompany(string $id, UpdateCompanyRequest $request): Company
    {
        $client = self::getClient();
        return Company::fromArray(self::unwrap($client->patch("/v1/companies/{$id}", $request->toArray())));
    }

    /**
     * Delete a company.
     *
     * @param string $id
     * @return MessageResponse
     */
    public static function deleteCompany(string $id): MessageResponse
    {
        $client = self::getClient();
        return MessageResponse::fromArray($client->delete("/v1/companies/{$id}"));
    }

    /**
     * List contacts for a company.
     *
     * @param string $companyId
     * @param ListContactsRequest|null $request
     * @return ContactListResponse
     */
    public static function listCompanyContacts(string $companyId, ?ListContactsRequest $request = null): ContactListResponse
    {
        $client = self::getClient();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get("/v1/companies/{$companyId}/contacts", $params);
        return ContactListResponse::fromArray($response);
    }

    // ============================================
    // CONTACTS
    // ============================================

    /**
     * List contacts.
     *
     * @param ListContactsRequest|null $request
     * @return ContactListResponse
     */
    public static function listContacts(?ListContactsRequest $request = null): ContactListResponse
    {
        $client = self::getClient();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get('/v1/contacts', $params);
        return ContactListResponse::fromArray($response);
    }

    /**
     * Create a contact.
     *
     * @param CreateContactRequest $request
     * @return Contact
     */
    public static function createContact(CreateContactRequest $request): Contact
    {
        $client = self::getClient();
        return Contact::fromArray(self::unwrap($client->post('/v1/contacts', $request->toArray())));
    }

    /**
     * Bulk create contacts (partial success; failed rows do not throw).
     * Each row requires a companyId.
     *
     * @param array<CreateContactRequest> $rows
     * @return BulkImportResult
     */
    public static function bulkCreateContacts(array $rows): BulkImportResult
    {
        return self::bulkImport('/v1/contacts/bulk', array_map(fn(CreateContactRequest $row) => $row->toArray(), $rows));
    }

    /**
     * Update a contact.
     *
     * @param string $id
     * @param UpdateContactRequest $request
     * @return Contact
     */
    public static function updateContact(string $id, UpdateContactRequest $request): Contact
    {
        $client = self::getClient();
        return Contact::fromArray(self::unwrap($client->patch("/v1/contacts/{$id}", $request->toArray())));
    }

    /**
     * Delete a contact.
     *
     * @param string $id
     * @return MessageResponse
     */
    public static function deleteContact(string $id): MessageResponse
    {
        $client = self::getClient();
        return MessageResponse::fromArray($client->delete("/v1/contacts/{$id}"));
    }

    // ============================================
    // TEMPLATES
    // ============================================

    /**
     * List quote templates.
     *
     * @param ListTemplatesRequest|null $request
     * @return QuoteTemplateListResponse
     */
    public static function listTemplates(?ListTemplatesRequest $request = null): QuoteTemplateListResponse
    {
        $client = self::getClient();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get('/v1/quote-templates', $params);
        return QuoteTemplateListResponse::fromArray($response);
    }

    /**
     * Get the org's active quote template.
     *
     * @return QuoteTemplate
     */
    public static function getTemplate(): QuoteTemplate
    {
        $client = self::getClient();
        return QuoteTemplate::fromArray(self::unwrap($client->get('/v1/quote-template')));
    }

    /**
     * Get a quote template by ID.
     *
     * @param string $id
     * @return QuoteTemplate
     */
    public static function getTemplateById(string $id): QuoteTemplate
    {
        $client = self::getClient();
        return QuoteTemplate::fromArray(self::unwrap($client->get("/v1/quote-templates/{$id}")));
    }

    /**
     * Create a quote template.
     *
     * @param CreateQuoteTemplateRequest $request
     * @return QuoteTemplate
     */
    public static function createTemplate(CreateQuoteTemplateRequest $request): QuoteTemplate
    {
        $client = self::getClient();
        return QuoteTemplate::fromArray(self::unwrap($client->post('/v1/quote-templates', $request->toArray())));
    }

    /**
     * Update a quote template.
     *
     * @param string $id
     * @param UpdateQuoteTemplateRequest $request
     * @return QuoteTemplate
     */
    public static function updateTemplate(string $id, UpdateQuoteTemplateRequest $request): QuoteTemplate
    {
        $client = self::getClient();
        return QuoteTemplate::fromArray(self::unwrap($client->patch("/v1/quote-templates/{$id}", $request->toArray())));
    }

    /**
     * Delete a quote template.
     *
     * @param string $id
     * @return MessageResponse
     */
    public static function deleteTemplate(string $id): MessageResponse
    {
        $client = self::getClient();
        return MessageResponse::fromArray($client->delete("/v1/quote-templates/{$id}"));
    }

    // ============================================
    // TYPES / CATEGORIES
    // ============================================

    /**
     * List types/categories.
     *
     * @param ListTypesRequest|null $request
     * @return QuoteTypeListResponse
     */
    public static function listTypes(?ListTypesRequest $request = null): QuoteTypeListResponse
    {
        $client = self::getClient();
        $params = $request?->toQueryParams() ?? [];
        $response = $client->get('/v1/types', $params);
        return QuoteTypeListResponse::fromArray($response);
    }

    /**
     * Create a type/category.
     *
     * @param CreateQuoteTypeRequest $request
     * @return QuoteType
     */
    public static function createType(CreateQuoteTypeRequest $request): QuoteType
    {
        $client = self::getClient();
        return QuoteType::fromArray(self::unwrap($client->post('/v1/types', $request->toArray())));
    }

    /**
     * Bulk create types/categories (partial success; failed rows do not throw).
     *
     * @param array<CreateQuoteTypeRequest> $rows
     * @return BulkImportResult
     */
    public static function bulkCreateTypes(array $rows): BulkImportResult
    {
        return self::bulkImport('/v1/types/bulk', array_map(fn(CreateQuoteTypeRequest $row) => $row->toArray(), $rows));
    }

    /**
     * Update a type/category.
     *
     * @param string $id
     * @param UpdateQuoteTypeRequest $request
     * @return QuoteType
     */
    public static function updateType(string $id, UpdateQuoteTypeRequest $request): QuoteType
    {
        $client = self::getClient();
        return QuoteType::fromArray(self::unwrap($client->patch("/v1/types/{$id}", $request->toArray())));
    }

    /**
     * Delete a type/category.
     *
     * @param string $id
     * @return MessageResponse
     */
    public static function deleteType(string $id): MessageResponse
    {
        $client = self::getClient();
        return MessageResponse::fromArray($client->delete("/v1/types/{$id}"));
    }

    // ============================================
    // QUOTE NUMBER CONFIG
    // ============================================

    /**
     * Get the org's quote number configuration (admin only).
     *
     * @return QuoteNumberConfig
     */
    public static function getQuoteNumberConfig(): QuoteNumberConfig
    {
        $client = self::getClient();
        $response = $client->get('/v1/quotes/number-config');
        return QuoteNumberConfig::fromArray($response['results']);
    }

    /**
     * Update the org's quote number configuration (admin only).
     *
     * @param QuoteNumberFormat $format The full quote number format (all 8 fields)
     * @return QuoteNumberConfig
     */
    public static function updateQuoteNumberConfig(QuoteNumberFormat $format): QuoteNumberConfig
    {
        $client = self::getClient();
        $response = $client->patch('/v1/quotes/number-config', $format->toArray());
        return QuoteNumberConfig::fromArray($response['results']);
    }

    // ============================================
    // CONVENIENCE
    // ============================================

    /**
     * Create a quote, optionally add items and bundles, then send — all in one call.
     *
     * @param CreateAndSendRequest $request
     * @return CreateAndSendResponse
     */
    public static function createAndSend(CreateAndSendRequest $request): CreateAndSendResponse
    {
        $client = self::getClient();

        $quote = self::unwrap($client->post('/v1/quotes', $request->toQuoteArray()));

        $items = $request->getItemsArray();
        if ($items !== null && count($items) > 0) {
            $client->post("/v1/quotes/{$quote['id']}/items", $items);
        }

        $bundleItems = $request->getBundleItemsArray();
        if ($bundleItems !== null && count($bundleItems) > 0) {
            $client->post("/v1/quotes/{$quote['id']}/items/bundle", $bundleItems);
        }

        $sendData = $request->send?->toArray();
        $sendResponse = $client->post("/v1/quotes/{$quote['id']}/send", $sendData);

        return CreateAndSendResponse::fromArray($sendResponse);
    }
}
