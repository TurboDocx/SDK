<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Config\QuoteClientConfig;
use TurboDocx\TurboQuote;
use TurboDocx\Types\Quote\Quote;
use TurboDocx\Types\Quote\QuoteStatusInfo;
use TurboDocx\Types\Quote\LineItem;
use TurboDocx\Types\Quote\Product;
use TurboDocx\Types\Quote\PriceBook;
use TurboDocx\Types\Quote\Bundle;
use TurboDocx\Types\Quote\Company;
use TurboDocx\Types\Quote\Contact;
use TurboDocx\Types\Quote\QuoteTemplate;
use TurboDocx\Types\Quote\QuoteType;
use TurboDocx\Types\Quote\QuoteNumberConfig;
use TurboDocx\Types\Quote\QuoteNumberFormat;
use TurboDocx\Types\Quote\BulkImportResult;
use TurboDocx\Types\Quote\BulkImportRowIssue;
use TurboDocx\Types\Requests\Quote\CreateQuoteRequest;
use TurboDocx\Types\Requests\Quote\UpdateQuoteRequest;
use TurboDocx\Types\Requests\Quote\ListQuotesRequest;
use TurboDocx\Types\Requests\Quote\SendQuoteRequest;
use TurboDocx\Types\Requests\Quote\SendQuoteWithDeliverableRequest;
use TurboDocx\Types\Requests\Quote\DeclineQuoteRequest;
use TurboDocx\Types\Requests\Quote\VoidQuoteRequest;
use TurboDocx\Types\Requests\Quote\HandleExpiredQuoteRequest;
use TurboDocx\Types\Requests\Quote\AddLineItemRequest;
use TurboDocx\Types\Requests\Quote\AddBundleLineItemRequest;
use TurboDocx\Types\Requests\Quote\UpdateLineItemRequest;
use TurboDocx\Types\Requests\Quote\CreateProductRequest;
use TurboDocx\Types\Requests\Quote\UpdateProductRequest;
use TurboDocx\Types\Requests\Quote\ListProductsRequest;
use TurboDocx\Types\Requests\Quote\CreatePriceBookRequest;
use TurboDocx\Types\Requests\Quote\UpdatePriceBookRequest;
use TurboDocx\Types\Requests\Quote\CreateBundleRequest;
use TurboDocx\Types\Requests\Quote\UpdateBundleRequest;
use TurboDocx\Types\Requests\Quote\CreateCompanyRequest;
use TurboDocx\Types\Requests\Quote\UpdateCompanyRequest;
use TurboDocx\Types\Requests\Quote\ListCompaniesRequest;
use TurboDocx\Types\Requests\Quote\CreateContactRequest;
use TurboDocx\Types\Requests\Quote\UpdateContactRequest;
use TurboDocx\Types\Requests\Quote\ListContactsRequest;
use TurboDocx\Types\Requests\Quote\CreateQuoteTemplateRequest;
use TurboDocx\Types\Requests\Quote\UpdateQuoteTemplateRequest;
use TurboDocx\Types\Requests\Quote\ListTemplatesRequest;
use TurboDocx\Types\Requests\Quote\CreateQuoteTypeRequest;
use TurboDocx\Types\Requests\Quote\UpdateQuoteTypeRequest;
use TurboDocx\Types\Requests\Quote\ListTypesRequest;
use TurboDocx\Types\Requests\Quote\CreateAndSendRequest;
use TurboDocx\Types\Responses\Quote\QuoteListResponse;
use TurboDocx\Types\Responses\Quote\SendQuoteResponse;
use TurboDocx\Types\Responses\Quote\SendQuoteWithDeliverableResponse;
use TurboDocx\Types\Responses\Quote\ApplyPriceBookResponse;
use TurboDocx\Types\Responses\Quote\LineItemListResponse;
use TurboDocx\Types\Responses\Quote\ProductListResponse;
use TurboDocx\Types\Responses\Quote\PriceBookListResponse;
use TurboDocx\Types\Responses\Quote\PriceBookProductListResponse;
use TurboDocx\Types\Responses\Quote\BundleListResponse;
use TurboDocx\Types\Responses\Quote\CompanyListResponse;
use TurboDocx\Types\Responses\Quote\ContactListResponse;
use TurboDocx\Types\Responses\Quote\QuoteTemplateListResponse;
use TurboDocx\Types\Responses\Quote\QuoteTypeListResponse;
use TurboDocx\Types\Responses\Quote\MessageResponse;
use TurboDocx\Types\Responses\Quote\CreateAndSendResponse;
use TurboDocx\Types\Enums\QuoteStatus;
use TurboDocx\Types\Enums\BundleItemStatus;
use TurboDocx\Types\Enums\DiscountType;
use TurboDocx\Types\Enums\QuoteNumberYearToken;
use TurboDocx\Types\Enums\QuoteNumberMonthToken;
use TurboDocx\Types\Enums\QuoteNumberResetCadence;
use TurboDocx\Types\Quote\QuoteListStats;
use TurboDocx\Types\Quote\CurrencyTotal;

/**
 * TurboQuote Module Tests
 *
 * Tests for all TurboQuote SDK operations organized by entity:
 * - Configuration
 * - Quotes (CRUD + status + PDF)
 * - Line Items
 * - Products
 * - Price Books
 * - Bundles
 * - Companies
 * - Contacts
 * - Templates
 * - Types/Categories
 * - Convenience methods (createAndSend)
 * - Error Handling
 *
 * Since HttpClient is final, we use a mock stub object injected
 * via ReflectionClass::setStaticPropertyValue().
 */
final class TurboQuoteTest extends TestCase
{
    private MockHttpClient $mockClient;

    protected function setUp(): void
    {
        parent::setUp();

        // Reset static state
        $ref = new \ReflectionClass(TurboQuote::class);
        $prop = $ref->getProperty('client');
        $prop->setValue(null, null);

        // Create a mock HttpClient stub
        $this->mockClient = new MockHttpClient();
    }

    /**
     * Inject the mock client into TurboQuote's private static $client field.
     */
    private function injectMockClient(): void
    {
        $ref = new \ReflectionClass(TurboQuote::class);
        $prop = $ref->getProperty('client');
        $prop->setValue(null, $this->mockClient);
    }

    // ============================================
    // CONFIGURATION
    // ============================================

    public function testConfigureWithApiKeyAndOrgId(): void
    {
        $config = new QuoteClientConfig(
            apiKey: 'test-api-key',
            orgId: 'test-org-id',
        );
        TurboQuote::configure($config);

        $ref = new \ReflectionClass(TurboQuote::class);
        $prop = $ref->getProperty('client');
        $this->assertNotNull($prop->getValue());
    }

    public function testConfigureWithCustomBaseUrl(): void
    {
        $config = new QuoteClientConfig(
            apiKey: 'test-key',
            orgId: 'org-1',
            baseUrl: 'https://custom.api.com',
        );
        TurboQuote::configure($config);

        $ref = new \ReflectionClass(TurboQuote::class);
        $prop = $ref->getProperty('client');
        $this->assertNotNull($prop->getValue());
    }

    public function testConfigureWithAccessToken(): void
    {
        $config = new QuoteClientConfig(
            accessToken: 'oauth-token',
            orgId: 'org-1',
        );
        TurboQuote::configure($config);

        $ref = new \ReflectionClass(TurboQuote::class);
        $prop = $ref->getProperty('client');
        $this->assertNotNull($prop->getValue());
    }

    public function testAutoInitializeFromEnvWhenNotConfigured(): void
    {
        $ref = new \ReflectionClass(TurboQuote::class);
        $prop = $ref->getProperty('client');
        $this->assertNull($prop->getValue());
    }

    // ============================================
    // QUOTES — CRUD
    // ============================================

    public function testListQuotesWithPaginationAndFilters(): void
    {
        $mockResponse = [
            'results' => [['id' => 'q-1', 'name' => 'Test Quote', 'status' => 'draft']],
            'totalRecords' => 1,
        ];
        $this->mockClient->setGetReturn($mockResponse);
        $this->injectMockClient();

        $result = TurboQuote::listQuotes(new ListQuotesRequest(limit: 10, query: 'test', statuses: 'draft'));

        $this->assertInstanceOf(QuoteListResponse::class, $result);
        $this->assertCount(1, $result->results);
        $this->assertInstanceOf(Quote::class, $result->results[0]);
        $this->assertSame(1, $result->totalRecords);
        $this->assertSame('/v1/quotes', $this->mockClient->lastGetPath);
        $this->assertSame('10', $this->mockClient->lastGetParams['limit']);
        $this->assertSame('draft', $this->mockClient->lastGetParams['statuses']);
        $this->assertSame('test', $this->mockClient->lastGetParams['query']);
    }

    public function testPassArrayStatusesAsStringArray(): void
    {
        $this->mockClient->setGetReturn(['results' => [], 'totalRecords' => 0]);
        $this->injectMockClient();

        TurboQuote::listQuotes(new ListQuotesRequest(statuses: ['draft', 'sent']));

        $this->assertSame(['draft', 'sent'], $this->mockClient->lastGetParams['statuses']);
    }

    public function testCreateQuoteAndUnwrapResult(): void
    {
        $mockQuote = ['id' => 'q-1', 'name' => 'My Quote', 'status' => 'draft', 'quoteNumber' => 'Q-2026-00001'];
        $this->mockClient->setPostReturn(['result' => $mockQuote, 'message' => 'Quote created successfully']);
        $this->injectMockClient();

        $result = TurboQuote::createQuote(new CreateQuoteRequest(name: 'My Quote', companyId: 'c-1', contactId: 'ct-1'));

        $this->assertInstanceOf(Quote::class, $result);
        $this->assertSame('q-1', $result->id);
        $this->assertSame('draft', $result->status);
        $this->assertSame('/v1/quotes', $this->mockClient->lastPostPath);
        $this->assertSame(['name' => 'My Quote', 'companyId' => 'c-1', 'contactId' => 'ct-1'], $this->mockClient->lastPostData);
    }

    public function testCreateQuoteWithAllOptionalFields(): void
    {
        $mockQuote = ['id' => 'q-2', 'name' => 'Full Quote', 'status' => 'draft'];
        $this->mockClient->setPostReturn(['result' => $mockQuote, 'message' => 'Quote created successfully']);
        $this->injectMockClient();

        TurboQuote::createQuote(new CreateQuoteRequest(
            name: 'Full Quote',
            companyId: 'comp-1',
            contactId: 'cont-1',
            currency: 'EUR',
            termDays: 60,
            taxRate: 8.25,
            validUntil: '2026-12-31',
            priceBookId: 'pb-1',
        ));

        $this->assertSame('Full Quote', $this->mockClient->lastPostData['name']);
        $this->assertSame('comp-1', $this->mockClient->lastPostData['companyId']);
        $this->assertSame('EUR', $this->mockClient->lastPostData['currency']);
        $this->assertSame(60, $this->mockClient->lastPostData['termDays']);
        $this->assertSame(8.25, $this->mockClient->lastPostData['taxRate']);
    }

    public function testGetQuoteByIdWithStatusInfo(): void
    {
        $mockQuote = ['id' => 'q-1', 'name' => 'Test Quote', 'status' => 'sent', 'lineItems' => []];
        $mockStatusInfo = [
            'currentStatus' => 'sent',
            'canSend' => false,
            'canAccept' => true,
            'canDecline' => true,
            'canVoid' => true,
            'isTerminal' => false,
        ];
        $this->mockClient->setGetReturn(['result' => $mockQuote, 'statusInfo' => $mockStatusInfo]);
        $this->injectMockClient();

        $result = TurboQuote::getQuote('q-1');

        $this->assertInstanceOf(Quote::class, $result);
        $this->assertSame('q-1', $result->id);
        $this->assertInstanceOf(QuoteStatusInfo::class, $result->statusInfo);
        $this->assertSame('sent', $result->statusInfo->currentStatus);
        $this->assertTrue($result->statusInfo->canAccept);
        $this->assertFalse($result->statusInfo->canSend);
        $this->assertSame('/v1/quotes/q-1', $this->mockClient->lastGetPath);
    }

    public function testGetQuoteFoldsPreparedBy(): void
    {
        // preparedBy rides as a sibling of `result` on the wire — it is the backend-resolved
        // "Prepared by" identity and must be preferred over `creator` for display.
        $mockQuote = ['id' => 'q-1', 'name' => 'Test Quote', 'status' => 'sent', 'lineItems' => []];
        $mockPreparedBy = ['name' => 'Acme Billing Integration', 'email' => 'billing@acme.com'];
        $this->mockClient->setGetReturn(['result' => $mockQuote, 'preparedBy' => $mockPreparedBy]);
        $this->injectMockClient();

        $result = TurboQuote::getQuote('q-1');

        $this->assertSame($mockPreparedBy, $result->preparedBy);
    }

    public function testGetQuoteWithoutPreparedBy(): void
    {
        $mockQuote = ['id' => 'q-1', 'name' => 'Test Quote', 'status' => 'sent', 'lineItems' => []];
        $this->mockClient->setGetReturn(['result' => $mockQuote]);
        $this->injectMockClient();

        $result = TurboQuote::getQuote('q-1');

        $this->assertNull($result->preparedBy);
    }

    public function testUpdateQuoteAndUnwrapResult(): void
    {
        $mockQuote = ['id' => 'q-1', 'name' => 'Updated Name', 'taxRate' => 10];
        $this->mockClient->setPatchReturn(['result' => $mockQuote, 'message' => 'Quote updated successfully']);
        $this->injectMockClient();

        $result = TurboQuote::updateQuote('q-1', new UpdateQuoteRequest(name: 'Updated Name', taxRate: 10));

        $this->assertInstanceOf(Quote::class, $result);
        $this->assertSame('Updated Name', $result->name);
        $this->assertSame('/v1/quotes/q-1', $this->mockClient->lastPatchPath);
        $this->assertSame(['name' => 'Updated Name', 'taxRate' => 10.0], $this->mockClient->lastPatchData);
    }

    public function testDeleteQuote(): void
    {
        $this->mockClient->setDeleteReturn(['message' => 'Quote deleted successfully']);
        $this->injectMockClient();

        $result = TurboQuote::deleteQuote('q-1');

        $this->assertInstanceOf(MessageResponse::class, $result);
        $this->assertSame('Quote deleted successfully', $result->message);
        $this->assertSame('/v1/quotes/q-1', $this->mockClient->lastDeletePath);
    }

    public function testDuplicateQuoteAndUnwrapResult(): void
    {
        $mockQuote = ['id' => 'q-2', 'name' => 'Test Quote (Copy)', 'status' => 'draft', 'quoteNumber' => 'Q-2026-00002'];
        $this->mockClient->setPostReturn(['result' => $mockQuote, 'message' => 'Quote duplicated successfully']);
        $this->injectMockClient();

        $result = TurboQuote::duplicateQuote('q-1');

        $this->assertInstanceOf(Quote::class, $result);
        $this->assertSame('q-2', $result->id);
        $this->assertSame('draft', $result->status);
        $this->assertSame('/v1/quotes/q-1/duplicate', $this->mockClient->lastPostPath);
    }

    public function testApplyPriceBookWithFullResponse(): void
    {
        $mockQuote = ['id' => 'q-1', 'priceBookId' => 'pb-1'];
        $this->mockClient->setPostReturn([
            'result' => $mockQuote,
            'updatedCount' => 3,
            'skippedCount' => 1,
            'message' => 'Pricebook applied: 3 product(s) updated, 1 skipped',
        ]);
        $this->injectMockClient();

        $result = TurboQuote::applyPriceBook('q-1', 'pb-1');

        $this->assertInstanceOf(ApplyPriceBookResponse::class, $result);
        $this->assertSame('pb-1', $result->quote->priceBookId);
        $this->assertSame(3, $result->updatedCount);
        $this->assertSame(1, $result->skippedCount);
        $this->assertSame('Pricebook applied: 3 product(s) updated, 1 skipped', $result->message);
        $this->assertSame('/v1/quotes/q-1/apply-pricebook', $this->mockClient->lastPostPath);
        $this->assertSame(['priceBookId' => 'pb-1'], $this->mockClient->lastPostData);
    }

    public function testRemovePriceBookAndUnwrapResult(): void
    {
        $mockQuote = ['id' => 'q-1', 'priceBookId' => null];
        $this->mockClient->setPostReturn(['result' => $mockQuote, 'message' => 'Pricebook removed from quote']);
        $this->injectMockClient();

        $result = TurboQuote::removePriceBook('q-1');

        $this->assertInstanceOf(Quote::class, $result);
        $this->assertNull($result->priceBookId);
        $this->assertSame('/v1/quotes/q-1/remove-pricebook', $this->mockClient->lastPostPath);
    }

    public function testDownloadQuotePdf(): void
    {
        $mockPdf = str_repeat("\x00", 1024);
        $this->mockClient->setGetRawReturn($mockPdf);
        $this->injectMockClient();

        $result = TurboQuote::downloadQuotePdf('q-1');

        $this->assertSame($mockPdf, $result);
        $this->assertSame('/v1/quotes/q-1/pdf', $this->mockClient->lastGetRawPath);
    }

    // ============================================
    // QUOTES — STATUS TRANSITIONS
    // ============================================

    public function testSendQuoteAndRemapResult(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'q-1', 'status' => 'sent'], 'message' => 'Quote sent']);
        $this->injectMockClient();

        $result = TurboQuote::sendQuote('q-1', new SendQuoteRequest(ccEmails: ['admin@example.com']));

        $this->assertInstanceOf(SendQuoteResponse::class, $result);
        $this->assertSame('sent', $result->quote->status);
        $this->assertSame('Quote sent', $result->message);
        $this->assertSame('/v1/quotes/q-1/send', $this->mockClient->lastPostPath);
        $this->assertSame(['ccEmails' => ['admin@example.com']], $this->mockClient->lastPostData);
    }

    public function testSendQuoteWithoutOptions(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'q-1', 'status' => 'sent'], 'message' => 'Quote sent']);
        $this->injectMockClient();

        $result = TurboQuote::sendQuote('q-1');

        $this->assertInstanceOf(SendQuoteResponse::class, $result);
        $this->assertSame('q-1', $result->quote->id);
        $this->assertSame('/v1/quotes/q-1/send', $this->mockClient->lastPostPath);
        $this->assertNull($this->mockClient->lastPostData);
    }

    public function testSendQuoteWithDeliverable(): void
    {
        $this->mockClient->setPostReturn([
            'result' => ['id' => 'q-1', 'status' => 'sent'],
            'message' => 'Quote sent with deliverable',
            'documentId' => 'doc-2',
        ]);
        $this->injectMockClient();

        $result = TurboQuote::sendQuoteWithDeliverable('q-1', new SendQuoteWithDeliverableRequest(
            deliverableId: 'del-1',
            mergePosition: 'end',
        ));

        $this->assertInstanceOf(SendQuoteWithDeliverableResponse::class, $result);
        $this->assertSame('sent', $result->quote->status);
        $this->assertSame('doc-2', $result->documentId);
        $this->assertSame('Quote sent with deliverable', $result->message);
        $this->assertSame('/v1/quotes/q-1/send-with-deliverable', $this->mockClient->lastPostPath);
        $this->assertSame(['deliverableId' => 'del-1', 'mergePosition' => 'end'], $this->mockClient->lastPostData);
    }

    public function testDeclineQuoteAndUnwrapResult(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'q-1', 'status' => 'declined'], 'message' => 'Quote declined']);
        $this->injectMockClient();

        $result = TurboQuote::declineQuote('q-1', new DeclineQuoteRequest(reason: 'Budget not approved'));

        $this->assertInstanceOf(Quote::class, $result);
        $this->assertSame('declined', $result->status);
        $this->assertSame('/v1/quotes/q-1/decline', $this->mockClient->lastPostPath);
        $this->assertSame(['reason' => 'Budget not approved'], $this->mockClient->lastPostData);
    }

    public function testDeclineQuoteOmitsReasonWhenNotProvided(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'q-1', 'status' => 'declined'], 'message' => 'Quote declined']);
        $this->injectMockClient();

        // A draft quote never reached the customer, so the API accepts a decline with no reason
        $result = TurboQuote::declineQuote('q-1', new DeclineQuoteRequest());

        $this->assertInstanceOf(Quote::class, $result);
        $this->assertSame('/v1/quotes/q-1/decline', $this->mockClient->lastPostPath);
        $this->assertSame([], (array) $this->mockClient->lastPostData);

        // ...and it must serialize as a JSON OBJECT. An empty PHP array encodes as `[]`, which the
        // API rejects with `"value" must be of type object` — asserting the array alone missed this.
        $this->assertSame('{}', json_encode($this->mockClient->lastPostData));
    }

    public function testVoidQuoteStillRequiresReason(): void
    {
        $this->assertTrue(
            (new \ReflectionParameter([VoidQuoteRequest::class, '__construct'], 'reason'))->isDefaultValueAvailable() === false,
        );
    }

    public function testVoidQuoteAndUnwrapResult(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'q-1', 'status' => 'voided'], 'message' => 'Quote voided successfully']);
        $this->injectMockClient();

        $result = TurboQuote::voidQuote('q-1', new VoidQuoteRequest(reason: 'Replaced by new quote'));

        $this->assertInstanceOf(Quote::class, $result);
        $this->assertSame('voided', $result->status);
        $this->assertSame('/v1/quotes/q-1/void', $this->mockClient->lastPostPath);
        $this->assertSame(['reason' => 'Replaced by new quote'], $this->mockClient->lastPostData);
    }

    public function testHandleExpiredQuoteAndUnwrapResult(): void
    {
        $this->mockClient->setPostReturn([
            'result' => ['id' => 'q-2', 'status' => 'draft', 'quoteNumber' => 'Q-2026-00003'],
            'message' => 'Expired quote processed',
        ]);
        $this->injectMockClient();

        $result = TurboQuote::handleExpiredQuote('q-1', new HandleExpiredQuoteRequest(
            action: 'void',
            reason: 'Expired',
            newValidUntil: '2026-12-31',
        ));

        $this->assertInstanceOf(Quote::class, $result);
        $this->assertSame('draft', $result->status);
        $this->assertSame('/v1/quotes/q-1/handle-expired-sent', $this->mockClient->lastPostPath);
        $this->assertSame(['action' => 'void', 'reason' => 'Expired', 'newValidUntil' => '2026-12-31'], $this->mockClient->lastPostData);
    }

    // ============================================
    // LINE ITEMS
    // ============================================

    public function testListLineItemsForQuote(): void
    {
        $this->mockClient->setGetReturn(['results' => [['id' => 'li-1', 'productName' => 'Widget']], 'totalRecords' => 1]);
        $this->injectMockClient();

        $result = TurboQuote::listLineItems('q-1');

        $this->assertInstanceOf(LineItemListResponse::class, $result);
        $this->assertCount(1, $result->results);
        $this->assertInstanceOf(LineItem::class, $result->results[0]);
        $this->assertSame('/v1/quotes/q-1/items', $this->mockClient->lastGetPath);
    }

    public function testAddSingleLineItemAndUnwrapResults(): void
    {
        $mockItems = [['id' => 'li-1', 'productId' => 'prod-1', 'quantity' => 2]];
        $item = new AddLineItemRequest(productId: 'prod-1', productName: 'Widget', unitPrice: 50, billingFrequency: 'monthly', quantity: 2);
        $this->mockClient->setPostReturn(['results' => $mockItems, 'message' => '1 line item(s) added successfully']);
        $this->injectMockClient();

        $result = TurboQuote::addLineItems('q-1', $item);

        $this->assertCount(1, $result);
        $this->assertInstanceOf(LineItem::class, $result[0]);
        $this->assertSame('/v1/quotes/q-1/items', $this->mockClient->lastPostPath);
        $this->assertSame([['productId' => 'prod-1', 'productName' => 'Widget', 'unitPrice' => 50.0, 'billingFrequency' => 'monthly', 'quantity' => 2]], $this->mockClient->lastPostData);
    }

    public function testAddMultipleLineItemsAsBatch(): void
    {
        $mockItems = [['id' => 'li-1'], ['id' => 'li-2']];
        $items = [
            new AddLineItemRequest(productId: 'prod-1', productName: 'Widget A', unitPrice: 50, billingFrequency: 'monthly', quantity: 5),
            new AddLineItemRequest(productId: 'prod-2', productName: 'Widget B', unitPrice: 75, billingFrequency: 'monthly', quantity: 1, discountPercent: 10),
        ];
        $this->mockClient->setPostReturn(['results' => $mockItems, 'message' => '2 line item(s) added successfully']);
        $this->injectMockClient();

        $result = TurboQuote::addLineItems('q-1', $items);

        $this->assertCount(2, $result);
        $this->assertInstanceOf(LineItem::class, $result[0]);
        $this->assertSame('/v1/quotes/q-1/items', $this->mockClient->lastPostPath);
        $expected = [
            ['productId' => 'prod-1', 'productName' => 'Widget A', 'unitPrice' => 50.0, 'billingFrequency' => 'monthly', 'quantity' => 5],
            ['productId' => 'prod-2', 'productName' => 'Widget B', 'unitPrice' => 75.0, 'billingFrequency' => 'monthly', 'quantity' => 1, 'discountPercent' => 10.0],
        ];
        $this->assertSame($expected, $this->mockClient->lastPostData);
    }

    public function testAddLineItemsCustomLineItemSendsExplicitProductIdNull(): void
    {
        // Backend joiAddProductLineItemSchema declares productId as .allow(null).required():
        // a custom (ad-hoc) line item MUST send the key present with an explicit null value,
        // otherwise the API 400s. This locks the wire format so PHP can't regress to omitting it.
        $mockItems = [['id' => 'li-1', 'productId' => null, 'productName' => 'Custom Service']];
        $item = new AddLineItemRequest(productId: null, productName: 'Custom Service', unitPrice: 500, billingFrequency: 'one-time', quantity: 1);
        $this->mockClient->setPostReturn(['results' => $mockItems, 'message' => '1 line item(s) added successfully']);
        $this->injectMockClient();

        $result = TurboQuote::addLineItems('q-1', $item);

        $this->assertCount(1, $result);
        $this->assertSame('/v1/quotes/q-1/items', $this->mockClient->lastPostPath);
        $sentItem = $this->mockClient->lastPostData[0];
        // The 'productId' key must be present with a null value, not absent.
        $this->assertArrayHasKey('productId', $sentItem);
        $this->assertNull($sentItem['productId']);
        // Assert the actual JSON wire format the SDK serializes carries "productId":null.
        // JSON_THROW_ON_ERROR makes json_encode return string (not string|false) so PHPStan level 8 is satisfied.
        $this->assertStringContainsString('"productId":null', json_encode($this->mockClient->lastPostData, JSON_THROW_ON_ERROR));
    }

    public function testAddBundleLineItemAndUnwrapResults(): void
    {
        $this->mockClient->setPostReturn(['results' => [['id' => 'li-3', 'bundleId' => 'bun-1', 'lineItemType' => 'bundle']], 'message' => '1 bundle(s) added successfully']);
        $this->injectMockClient();

        $result = TurboQuote::addBundleLineItems('q-1', new AddBundleLineItemRequest(bundleId: 'bun-1', bundleName: 'Starter Pack'));

        $this->assertCount(1, $result);
        $this->assertInstanceOf(LineItem::class, $result[0]);
        $this->assertSame('/v1/quotes/q-1/items/bundle', $this->mockClient->lastPostPath);
        $this->assertSame([['bundleId' => 'bun-1', 'bundleName' => 'Starter Pack']], $this->mockClient->lastPostData);
    }

    public function testAddBundleLineItemWithDiscountTypeAndAmount(): void
    {
        $this->mockClient->setPostReturn(['results' => [['id' => 'li-4', 'bundleId' => 'bun-1', 'discountType' => 'amount', 'discountAmount' => 10.00]], 'message' => '1 bundle(s) added successfully']);
        $this->injectMockClient();

        TurboQuote::addBundleLineItems('q-1', new AddBundleLineItemRequest(
            bundleId: 'bun-1',
            bundleName: 'Starter Pack',
            discountType: 'amount',
            discountAmount: 10.00,
        ));

        $sentItem = $this->mockClient->lastPostData[0];
        $this->assertSame('amount', $sentItem['discountType']);
        $this->assertSame(10.00, $sentItem['discountAmount']);
    }

    public function testUpdateLineItemAndUnwrapResult(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'li-1', 'quantity' => 10, 'unitPrice' => 50], 'message' => 'Line item updated successfully']);
        $this->injectMockClient();

        $result = TurboQuote::updateLineItem('q-1', 'li-1', new UpdateLineItemRequest(quantity: 10, unitPrice: 50));

        $this->assertInstanceOf(LineItem::class, $result);
        $this->assertSame(10.0, $result->quantity);
        $this->assertSame('/v1/quotes/q-1/items/li-1', $this->mockClient->lastPatchPath);
        $this->assertSame(['quantity' => 10, 'unitPrice' => 50.0], $this->mockClient->lastPatchData);
    }

    public function testAddLineItemWithDiscountTypeAndAmount(): void
    {
        $this->mockClient->setPostReturn(['results' => [['id' => 'li-2', 'productId' => 'prod-1', 'discountType' => 'amount', 'discountAmount' => 5.00]], 'message' => '1 line item(s) added successfully']);
        $this->injectMockClient();

        $result = TurboQuote::addLineItems('q-1', new AddLineItemRequest(
            productId: 'prod-1',
            productName: 'Widget',
            unitPrice: 50,
            billingFrequency: 'monthly',
            discountType: 'amount',
            discountAmount: 5.00,
        ));

        $this->assertCount(1, $result);
        $this->assertSame('/v1/quotes/q-1/items', $this->mockClient->lastPostPath);
        $sentItem = $this->mockClient->lastPostData[0];
        $this->assertSame('amount', $sentItem['discountType']);
        $this->assertSame(5.00, $sentItem['discountAmount']);
        $this->assertArrayNotHasKey('discountPercent', $sentItem);
    }

    public function testUpdateLineItemWithNewDiscountFields(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'li-1', 'quantity' => 5, 'discountType' => 'percent', 'discountAmount' => 0], 'message' => 'Line item updated successfully']);
        $this->injectMockClient();

        $result = TurboQuote::updateLineItem('q-1', 'li-1', new UpdateLineItemRequest(
            quantity: 5,
            discountType: 'percent',
            discountAmount: 0,
        ));

        $this->assertInstanceOf(LineItem::class, $result);
        $this->assertSame('/v1/quotes/q-1/items/li-1', $this->mockClient->lastPatchPath);
        $this->assertSame('percent', $this->mockClient->lastPatchData['discountType']);
        $this->assertSame(0.0, $this->mockClient->lastPatchData['discountAmount']);
    }

    public function testUpdateLineItemDisplayOrderNullClear(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'li-1', 'displayOrder' => null], 'message' => 'Line item updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateLineItem('q-1', 'li-1', new UpdateLineItemRequest(
            displayOrder: null,
            includeDisplayOrder: true,
        ));

        $this->assertSame('/v1/quotes/q-1/items/li-1', $this->mockClient->lastPatchPath);
        $this->assertArrayHasKey('displayOrder', $this->mockClient->lastPatchData);
        $this->assertNull($this->mockClient->lastPatchData['displayOrder']);
    }

    public function testUpdateLineItemDisplayOrderOmittedWhenNotIncluded(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'li-1', 'quantity' => 3], 'message' => 'Line item updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateLineItem('q-1', 'li-1', new UpdateLineItemRequest(quantity: 3));

        $this->assertArrayNotHasKey('displayOrder', $this->mockClient->lastPatchData);
    }

    public function testUpdateLineItemDisplayOrderPositiveValue(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'li-1', 'displayOrder' => 2], 'message' => 'Line item updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateLineItem('q-1', 'li-1', new UpdateLineItemRequest(
            displayOrder: 2,
            includeDisplayOrder: true,
        ));

        $this->assertSame(2, $this->mockClient->lastPatchData['displayOrder']);
    }

    public function testUpdateLineItemCategoryIdNullClear(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'li-1', 'categoryId' => null], 'message' => 'Line item updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateLineItem('q-1', 'li-1', new UpdateLineItemRequest(
            categoryId: null,
            includeCategoryId: true,
        ));

        $this->assertArrayHasKey('categoryId', $this->mockClient->lastPatchData);
        $this->assertNull($this->mockClient->lastPatchData['categoryId']);
    }

    public function testUpdateLineItemCategoryIdOmittedWhenNotIncluded(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'li-1', 'quantity' => 3], 'message' => 'Line item updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateLineItem('q-1', 'li-1', new UpdateLineItemRequest(quantity: 3));

        $this->assertArrayNotHasKey('categoryId', $this->mockClient->lastPatchData);
    }

    public function testUpdateLineItemCategoryIdNonNullStillEmittedWithoutFlag(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'li-1', 'categoryId' => 'cat-1'], 'message' => 'Line item updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateLineItem('q-1', 'li-1', new UpdateLineItemRequest(categoryId: 'cat-1'));

        $this->assertSame('cat-1', $this->mockClient->lastPatchData['categoryId']);
    }

    public function testUpdateLineItemCostNullClear(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'li-1', 'cost' => null], 'message' => 'Line item updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateLineItem('q-1', 'li-1', new UpdateLineItemRequest(
            cost: null,
            includeCost: true,
        ));

        $this->assertArrayHasKey('cost', $this->mockClient->lastPatchData);
        $this->assertNull($this->mockClient->lastPatchData['cost']);
    }

    public function testUpdateLineItemCostOmittedWhenNotIncluded(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'li-1', 'quantity' => 3], 'message' => 'Line item updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateLineItem('q-1', 'li-1', new UpdateLineItemRequest(quantity: 3));

        $this->assertArrayNotHasKey('cost', $this->mockClient->lastPatchData);
    }

    public function testRemoveLineItem(): void
    {
        $this->mockClient->setDeleteReturn(['message' => 'Line item removed successfully']);
        $this->injectMockClient();

        $result = TurboQuote::removeLineItem('q-1', 'li-1');

        $this->assertInstanceOf(MessageResponse::class, $result);
        $this->assertSame('Line item removed successfully', $result->message);
        $this->assertSame('/v1/quotes/q-1/items/li-1', $this->mockClient->lastDeletePath);
    }

    // ============================================
    // PRODUCTS
    // ============================================

    public function testListProductsWithFilters(): void
    {
        $this->mockClient->setGetReturn(['results' => [['id' => 'p-1', 'name' => 'Widget']], 'totalRecords' => 1]);
        $this->injectMockClient();

        $result = TurboQuote::listProducts(new ListProductsRequest(billingFrequency: 'monthly', limit: 25));

        $this->assertInstanceOf(ProductListResponse::class, $result);
        $this->assertCount(1, $result->results);
        $this->assertInstanceOf(Product::class, $result->results[0]);
        $this->assertSame('monthly', $this->mockClient->lastGetParams['billingFrequency']);
        $this->assertSame('25', $this->mockClient->lastGetParams['limit']);
    }

    public function testCreateProductWithoutImagesAndUnwrapResult(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'p-1', 'name' => 'Widget Pro', 'listPrice' => 99.99], 'message' => 'Product created successfully']);
        $this->injectMockClient();

        $result = TurboQuote::createProduct(new CreateProductRequest(
            name: 'Widget Pro',
            listPrice: 99.99,
            billingFrequency: 'monthly',
            categoryId: 'cat-1',
        ));

        $this->assertInstanceOf(Product::class, $result);
        $this->assertSame('Widget Pro', $result->name);
        $this->assertSame('/v1/products', $this->mockClient->lastPostPath);
        $this->assertSame(['name' => 'Widget Pro', 'listPrice' => 99.99, 'billingFrequency' => 'monthly', 'categoryId' => 'cat-1'], $this->mockClient->lastPostData);
    }

    public function testGetProductByIdAndUnwrapResult(): void
    {
        $this->mockClient->setGetReturn(['result' => ['id' => 'p-1', 'name' => 'Widget', 'images' => []]]);
        $this->injectMockClient();

        $result = TurboQuote::getProduct('p-1');

        $this->assertInstanceOf(Product::class, $result);
        $this->assertSame('p-1', $result->id);
        $this->assertSame('/v1/products/p-1', $this->mockClient->lastGetPath);
    }

    public function testUpdateProductWithoutImagesAndUnwrapResult(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'p-1', 'name' => 'Updated Widget', 'listPrice' => 149.99], 'message' => 'Product updated successfully']);
        $this->injectMockClient();

        $result = TurboQuote::updateProduct('p-1', new UpdateProductRequest(name: 'Updated Widget', listPrice: 149.99));

        $this->assertInstanceOf(Product::class, $result);
        $this->assertSame('Updated Widget', $result->name);
        $this->assertSame('/v1/products/p-1', $this->mockClient->lastPatchPath);
        $this->assertSame(['name' => 'Updated Widget', 'listPrice' => 149.99], $this->mockClient->lastPatchData);
    }

    public function testDeleteProduct(): void
    {
        $this->mockClient->setDeleteReturn(['message' => 'Product deleted successfully']);
        $this->injectMockClient();

        $result = TurboQuote::deleteProduct('p-1');

        $this->assertInstanceOf(MessageResponse::class, $result);
        $this->assertSame('Product deleted successfully', $result->message);
        $this->assertSame('/v1/products/p-1', $this->mockClient->lastDeletePath);
    }

    public function testDuplicateProductAndUnwrapResult(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'p-2', 'name' => 'Widget Pro (Copy)'], 'message' => 'Product duplicated successfully']);
        $this->injectMockClient();

        $result = TurboQuote::duplicateProduct('p-1');

        $this->assertInstanceOf(Product::class, $result);
        $this->assertSame('p-2', $result->id);
        $this->assertSame('/v1/products/p-1/duplicate', $this->mockClient->lastPostPath);
    }

    public function testCreateProductWithImagesUsesFormData(): void
    {
        $fakeImage = 'fake-image-data';
        $this->mockClient->setPostFormDataReturn(['result' => ['id' => 'p-1', 'name' => 'Widget', 'listPrice' => 99], 'message' => 'Product created successfully']);
        $this->injectMockClient();

        TurboQuote::createProduct(new CreateProductRequest(
            name: 'Widget',
            listPrice: 99,
            billingFrequency: 'monthly',
            categoryId: 'cat-1',
            images: [$fakeImage],
        ));

        $this->assertSame('/v1/products', $this->mockClient->lastPostFormDataPath);
        // Verify 'data' JSON field
        $dataField = null;
        foreach ($this->mockClient->lastPostFormDataMultipart as $part) {
            if ($part['name'] === 'data') {
                $dataField = $part['contents'];
            }
        }
        $this->assertNotNull($dataField);
        $parsed = json_decode($dataField, true);
        $this->assertSame('Widget', $parsed['name']);
        $this->assertSame(99, $parsed['listPrice']);
        $this->assertSame('monthly', $parsed['billingFrequency']);
        $this->assertSame('cat-1', $parsed['categoryId']);
    }

    public function testUpdateProductWithImagesUsesFormData(): void
    {
        $fakeImage = 'fake-image-data';
        $this->mockClient->setPatchFormDataReturn(['result' => ['id' => 'p-1', 'name' => 'Updated Widget'], 'message' => 'Product updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateProduct('p-1', new UpdateProductRequest(
            name: 'Updated Widget',
            images: [$fakeImage],
            imageIdsToKeep: ['img-id-1'],
        ));

        $this->assertSame('/v1/products/p-1', $this->mockClient->lastPatchFormDataPath);
        $dataField = null;
        foreach ($this->mockClient->lastPatchFormDataMultipart as $part) {
            if ($part['name'] === 'data') {
                $dataField = $part['contents'];
            }
        }
        $this->assertNotNull($dataField);
        $parsed = json_decode($dataField, true);
        $this->assertSame('Updated Widget', $parsed['name']);
        $this->assertSame(['img-id-1'], $parsed['imageIdsToKeep']);
    }

    public function testUpdateProductWithImagesPreservesNullClearing(): void
    {
        $fakeImage = 'fake-image-data';
        $this->mockClient->setPatchFormDataReturn(['result' => ['id' => 'p-1', 'name' => 'Widget', 'description' => null], 'message' => 'Product updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateProduct('p-1', new UpdateProductRequest(
            name: 'Widget',
            description: null,
            includeDescription: true,
            images: [$fakeImage],
        ));

        $this->assertSame('/v1/products/p-1', $this->mockClient->lastPatchFormDataPath);
        // Extract the 'data' JSON field from the multipart body
        $dataField = null;
        foreach ($this->mockClient->lastPatchFormDataMultipart as $part) {
            if ($part['name'] === 'data') {
                $dataField = $part['contents'];
            }
        }
        $this->assertNotNull($dataField);
        $parsed = json_decode($dataField, true);
        // The key 'description' must be present with value null — not just absent
        $this->assertArrayHasKey('description', $parsed);
        $this->assertNull($parsed['description']);
        // name should still be present
        $this->assertSame('Widget', $parsed['name']);
    }

    public function testUpdateProductWithoutImagesPreservesNullClearing(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'p-1', 'name' => 'Widget', 'description' => null], 'message' => 'Product updated successfully']);
        $this->injectMockClient();

        $result = TurboQuote::updateProduct('p-1', new UpdateProductRequest(
            name: 'Widget',
            description: null,
            includeDescription: true,
        ));

        $this->assertInstanceOf(Product::class, $result);
        $this->assertSame('/v1/products/p-1', $this->mockClient->lastPatchPath);
        // Verify the PATCH body includes description: null
        $this->assertArrayHasKey('description', $this->mockClient->lastPatchData);
        $this->assertNull($this->mockClient->lastPatchData['description']);
        $this->assertSame('Widget', $this->mockClient->lastPatchData['name']);
    }

    public function testGetProductPrimaryImagesAndUnwrapResults(): void
    {
        $mockImageMap = ['p-1' => ['id' => 'img-1', 'productId' => 'p-1'], 'p-2' => null];
        $this->mockClient->setPostReturn(['results' => $mockImageMap]);
        $this->injectMockClient();

        $result = TurboQuote::getProductPrimaryImages(['p-1', 'p-2']);

        $this->assertSame(['id' => 'img-1', 'productId' => 'p-1'], $result['p-1']);
        $this->assertNull($result['p-2']);
        $this->assertSame('/v1/products/primary-images', $this->mockClient->lastPostPath);
        $this->assertSame(['productIds' => ['p-1', 'p-2']], $this->mockClient->lastPostData);
    }

    // ============================================
    // PRICE BOOKS
    // ============================================

    public function testListPriceBooks(): void
    {
        $this->mockClient->setGetReturn(['results' => [['id' => 'pb-1', 'name' => 'Standard']], 'totalRecords' => 1]);
        $this->injectMockClient();

        $result = TurboQuote::listPriceBooks();

        $this->assertInstanceOf(PriceBookListResponse::class, $result);
        $this->assertCount(1, $result->results);
        $this->assertInstanceOf(PriceBook::class, $result->results[0]);
        $this->assertSame('/v1/pricebooks', $this->mockClient->lastGetPath);
    }

    public function testCreatePriceBookAndUnwrapResult(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'pb-1', 'name' => 'Partner Pricing', 'discountPercent' => 15], 'message' => 'PriceBook created successfully']);
        $this->injectMockClient();

        $result = TurboQuote::createPriceBook(new CreatePriceBookRequest(
            name: 'Partner Pricing',
            priceBookTypeId: 'pbt-1',
            validFrom: '2026-01-01',
            discountPercent: 15,
        ));

        $this->assertInstanceOf(PriceBook::class, $result);
        $this->assertSame('Partner Pricing', $result->name);
        $this->assertSame('/v1/pricebooks', $this->mockClient->lastPostPath);
        $this->assertSame(['name' => 'Partner Pricing', 'priceBookTypeId' => 'pbt-1', 'validFrom' => '2026-01-01', 'discountPercent' => 15.0], $this->mockClient->lastPostData);
    }

    public function testCreatePriceBookDefaultsDiscountPercentToZeroWhenOmitted(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'pb-2', 'name' => 'No Discount'], 'message' => 'PriceBook created successfully']);
        $this->injectMockClient();

        $result = TurboQuote::createPriceBook(new CreatePriceBookRequest(
            name: 'No Discount',
            priceBookTypeId: 'pbt-1',
            validFrom: '2026-01-01',
        ));

        $this->assertInstanceOf(PriceBook::class, $result);
        $this->assertSame('/v1/pricebooks', $this->mockClient->lastPostPath);
        $this->assertSame(['name' => 'No Discount', 'priceBookTypeId' => 'pbt-1', 'validFrom' => '2026-01-01', 'discountPercent' => 0.0], $this->mockClient->lastPostData);
    }

    public function testGetPriceBookByIdAndUnwrapResult(): void
    {
        $this->mockClient->setGetReturn(['result' => ['id' => 'pb-1', 'name' => 'Standard']]);
        $this->injectMockClient();

        $result = TurboQuote::getPriceBook('pb-1');

        $this->assertInstanceOf(PriceBook::class, $result);
        $this->assertSame('pb-1', $result->id);
        $this->assertSame('/v1/pricebooks/pb-1', $this->mockClient->lastGetPath);
    }

    public function testUpdatePriceBookAndUnwrapResult(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'pb-1', 'name' => 'Updated', 'discountPercent' => 20], 'message' => 'PriceBook updated successfully']);
        $this->injectMockClient();

        $result = TurboQuote::updatePriceBook('pb-1', new UpdatePriceBookRequest(discountPercent: 20));

        $this->assertInstanceOf(PriceBook::class, $result);
        $this->assertSame(20.0, $result->discountPercent);
    }

    public function testUpdatePriceBookValidToNullClear(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'pb-1', 'validTo' => null], 'message' => 'PriceBook updated successfully']);
        $this->injectMockClient();

        TurboQuote::updatePriceBook('pb-1', new UpdatePriceBookRequest(
            validTo: null,
            includeValidTo: true,
        ));

        $this->assertArrayHasKey('validTo', $this->mockClient->lastPatchData);
        $this->assertNull($this->mockClient->lastPatchData['validTo']);
    }

    public function testUpdatePriceBookValidToOmittedWhenNotIncluded(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'pb-1', 'name' => 'Promo'], 'message' => 'PriceBook updated successfully']);
        $this->injectMockClient();

        TurboQuote::updatePriceBook('pb-1', new UpdatePriceBookRequest(name: 'Promo'));

        $this->assertArrayNotHasKey('validTo', $this->mockClient->lastPatchData);
    }

    public function testDeletePriceBook(): void
    {
        $this->mockClient->setDeleteReturn(['message' => 'PriceBook deleted successfully']);
        $this->injectMockClient();

        $result = TurboQuote::deletePriceBook('pb-1');

        $this->assertInstanceOf(MessageResponse::class, $result);
        $this->assertSame('PriceBook deleted successfully', $result->message);
    }

    public function testDuplicatePriceBookAndUnwrapResult(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'pb-2', 'name' => 'Standard (Copy)'], 'message' => 'Pricebook duplicated successfully']);
        $this->injectMockClient();

        $result = TurboQuote::duplicatePriceBook('pb-1');

        $this->assertInstanceOf(PriceBook::class, $result);
        $this->assertSame('pb-2', $result->id);
        $this->assertSame('/v1/pricebooks/pb-1/duplicate', $this->mockClient->lastPostPath);
    }

    public function testListPriceBookProducts(): void
    {
        $this->mockClient->setGetReturn(['results' => [['productId' => 'p-1', 'discountPercent' => 10]], 'totalRecords' => 1]);
        $this->injectMockClient();

        $result = TurboQuote::listPriceBookProducts('pb-1');

        $this->assertInstanceOf(PriceBookProductListResponse::class, $result);
        $this->assertCount(1, $result->results);
        $this->assertSame('/v1/pricebooks/pb-1/products', $this->mockClient->lastGetPath);
    }

    // ============================================
    // BUNDLES
    // ============================================

    public function testListBundles(): void
    {
        $this->mockClient->setGetReturn(['results' => [['id' => 'b-1', 'name' => 'Starter Pack']], 'totalRecords' => 1]);
        $this->injectMockClient();

        $result = TurboQuote::listBundles();

        $this->assertInstanceOf(BundleListResponse::class, $result);
        $this->assertCount(1, $result->results);
        $this->assertInstanceOf(Bundle::class, $result->results[0]);
    }

    public function testCreateBundleAndUnwrapResult(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'b-1', 'name' => 'Starter Pack', 'items' => []], 'message' => 'Bundle created successfully']);
        $this->injectMockClient();

        $result = TurboQuote::createBundle(new CreateBundleRequest(
            name: 'Starter Pack',
            categoryId: 'cat-1',
            items: [['productId' => 'p-1', 'unitPrice' => 50, 'billingFrequency' => 'monthly']],
        ));

        $this->assertInstanceOf(Bundle::class, $result);
        $this->assertSame('Starter Pack', $result->name);
        $this->assertSame('Starter Pack', $this->mockClient->lastPostData['name']);
        $this->assertSame('cat-1', $this->mockClient->lastPostData['categoryId']);
    }

    public function testCreateBundleWithDiscountTypeAndAmount(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'b-2', 'name' => 'Discounted Pack', 'items' => []], 'message' => 'Bundle created successfully']);
        $this->injectMockClient();

        TurboQuote::createBundle(new CreateBundleRequest(
            name: 'Discounted Pack',
            categoryId: 'cat-1',
            bundleDiscountType: 'amount',
            bundleDiscountAmount: 25.00,
        ));

        $this->assertSame('amount', $this->mockClient->lastPostData['bundleDiscountType']);
        $this->assertSame(25.00, $this->mockClient->lastPostData['bundleDiscountAmount']);
    }

    public function testUpdateBundleWithDiscountTypeAndAmount(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'b-1', 'name' => 'Pro Pack'], 'message' => 'Bundle updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateBundle('b-1', new UpdateBundleRequest(
            bundleDiscountType: 'percent',
            bundleDiscountAmount: 15.00,
        ));

        $this->assertSame('percent', $this->mockClient->lastPatchData['bundleDiscountType']);
        $this->assertSame(15.00, $this->mockClient->lastPatchData['bundleDiscountAmount']);
    }

    public function testGetBundleByIdAndUnwrapResult(): void
    {
        $this->mockClient->setGetReturn(['result' => ['id' => 'b-1', 'items' => []]]);
        $this->injectMockClient();

        $result = TurboQuote::getBundle('b-1');

        $this->assertInstanceOf(Bundle::class, $result);
        $this->assertSame('b-1', $result->id);
        $this->assertSame('/v1/bundles/b-1', $this->mockClient->lastGetPath);
    }

    public function testUpdateBundleAndUnwrapResult(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'b-1', 'name' => 'Pro Pack'], 'message' => 'Bundle updated successfully']);
        $this->injectMockClient();

        $result = TurboQuote::updateBundle('b-1', new UpdateBundleRequest(name: 'Pro Pack'));

        $this->assertInstanceOf(Bundle::class, $result);
        $this->assertSame('Pro Pack', $result->name);
    }

    public function testDeleteBundle(): void
    {
        $this->mockClient->setDeleteReturn(['message' => 'Bundle deleted successfully']);
        $this->injectMockClient();

        $result = TurboQuote::deleteBundle('b-1');

        $this->assertInstanceOf(MessageResponse::class, $result);
        $this->assertSame('Bundle deleted successfully', $result->message);
    }

    public function testDuplicateBundleAndUnwrapResult(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'b-2'], 'message' => 'Bundle duplicated successfully']);
        $this->injectMockClient();

        $result = TurboQuote::duplicateBundle('b-1');

        $this->assertInstanceOf(Bundle::class, $result);
        $this->assertSame('b-2', $result->id);
        $this->assertSame('/v1/bundles/b-1/duplicate', $this->mockClient->lastPostPath);
    }

    // ============================================
    // COMPANIES
    // ============================================

    public function testListCompanies(): void
    {
        $this->mockClient->setGetReturn(['results' => [['id' => 'c-1', 'name' => 'Acme Corp']], 'totalRecords' => 1]);
        $this->injectMockClient();

        $result = TurboQuote::listCompanies(new ListCompaniesRequest(query: 'acme'));

        $this->assertInstanceOf(CompanyListResponse::class, $result);
        $this->assertCount(1, $result->results);
        $this->assertInstanceOf(Company::class, $result->results[0]);
        $this->assertSame('/v1/companies', $this->mockClient->lastGetPath);
        $this->assertSame('acme', $this->mockClient->lastGetParams['query']);
    }

    public function testCreateCompanyAndUnwrapResult(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'c-1', 'name' => 'Acme Corp'], 'message' => 'Company created successfully']);
        $this->injectMockClient();

        $result = TurboQuote::createCompany(new CreateCompanyRequest(
            name: 'Acme Corp',
            contacts: [['name' => 'John Doe', 'email' => 'john@acme.com']],
            city: 'Austin',
            state: 'TX',
        ));

        $this->assertInstanceOf(Company::class, $result);
        $this->assertSame('Acme Corp', $result->name);
        $this->assertSame('/v1/companies', $this->mockClient->lastPostPath);
        $this->assertSame([
            'name' => 'Acme Corp',
            'contacts' => [['name' => 'John Doe', 'email' => 'john@acme.com']],
            'city' => 'Austin',
            'state' => 'TX',
        ], $this->mockClient->lastPostData);
    }

    public function testGetCompanyByIdAndUnwrapResult(): void
    {
        $this->mockClient->setGetReturn(['result' => ['id' => 'c-1', 'name' => 'Acme']]);
        $this->injectMockClient();

        $result = TurboQuote::getCompany('c-1');

        $this->assertInstanceOf(Company::class, $result);
        $this->assertSame('c-1', $result->id);
        $this->assertSame('/v1/companies/c-1', $this->mockClient->lastGetPath);
    }

    public function testUpdateCompanyAndUnwrapResult(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'c-1', 'name' => 'Acme Inc'], 'message' => 'Company updated successfully']);
        $this->injectMockClient();

        $result = TurboQuote::updateCompany('c-1', new UpdateCompanyRequest(name: 'Acme Inc'));

        $this->assertInstanceOf(Company::class, $result);
        $this->assertSame('Acme Inc', $result->name);
    }

    public function testUpdateCompanyIndustryIdNullClear(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'c-1', 'industryId' => null], 'message' => 'Company updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateCompany('c-1', new UpdateCompanyRequest(
            industryId: null,
            includeIndustryId: true,
        ));

        $this->assertArrayHasKey('industryId', $this->mockClient->lastPatchData);
        $this->assertNull($this->mockClient->lastPatchData['industryId']);
    }

    public function testUpdateCompanyIndustryIdOmittedWhenNotIncluded(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'c-1', 'name' => 'Acme'], 'message' => 'Company updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateCompany('c-1', new UpdateCompanyRequest(name: 'Acme'));

        $this->assertArrayNotHasKey('industryId', $this->mockClient->lastPatchData);
    }

    public function testDeleteCompany(): void
    {
        $this->mockClient->setDeleteReturn(['message' => 'Company deleted successfully']);
        $this->injectMockClient();

        $result = TurboQuote::deleteCompany('c-1');

        $this->assertInstanceOf(MessageResponse::class, $result);
        $this->assertSame('Company deleted successfully', $result->message);
    }

    public function testListCompanyContacts(): void
    {
        $this->mockClient->setGetReturn(['results' => [['id' => 'ct-1', 'name' => 'John Doe']], 'totalRecords' => 1]);
        $this->injectMockClient();

        $result = TurboQuote::listCompanyContacts('c-1');

        $this->assertInstanceOf(ContactListResponse::class, $result);
        $this->assertCount(1, $result->results);
        $this->assertInstanceOf(Contact::class, $result->results[0]);
        $this->assertSame('/v1/companies/c-1/contacts', $this->mockClient->lastGetPath);
    }

    // ============================================
    // CONTACTS
    // ============================================

    public function testListContactsWithCompanyFilter(): void
    {
        $this->mockClient->setGetReturn(['results' => [['id' => 'ct-1', 'name' => 'Jane']], 'totalRecords' => 1]);
        $this->injectMockClient();

        $result = TurboQuote::listContacts(new ListContactsRequest(companyId: 'c-1'));

        $this->assertInstanceOf(ContactListResponse::class, $result);
        $this->assertCount(1, $result->results);
        $this->assertInstanceOf(Contact::class, $result->results[0]);
        $this->assertSame('/v1/contacts', $this->mockClient->lastGetPath);
        $this->assertSame('c-1', $this->mockClient->lastGetParams['companyId']);
    }

    public function testCreateContactAndUnwrapResult(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'ct-1', 'name' => 'John Doe', 'email' => 'john@example.com'], 'message' => 'Contact created successfully']);
        $this->injectMockClient();

        $result = TurboQuote::createContact(new CreateContactRequest(
            name: 'John Doe',
            companyId: 'c-1',
            email: 'john@example.com',
        ));

        $this->assertInstanceOf(Contact::class, $result);
        $this->assertSame('John Doe', $result->name);
        $this->assertSame('/v1/contacts', $this->mockClient->lastPostPath);
        $this->assertSame(['name' => 'John Doe', 'companyId' => 'c-1', 'email' => 'john@example.com'], $this->mockClient->lastPostData);
    }

    public function testUpdateContactAndUnwrapResult(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'ct-1', 'name' => 'Jane Doe'], 'message' => 'Contact updated successfully']);
        $this->injectMockClient();

        $result = TurboQuote::updateContact('ct-1', new UpdateContactRequest(name: 'Jane Doe'));

        $this->assertInstanceOf(Contact::class, $result);
        $this->assertSame('Jane Doe', $result->name);
    }

    public function testUpdateContactEmailNullClear(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'ct-1', 'email' => null], 'message' => 'Contact updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateContact('ct-1', new UpdateContactRequest(
            email: null,
            includeEmail: true,
        ));

        $this->assertArrayHasKey('email', $this->mockClient->lastPatchData);
        $this->assertNull($this->mockClient->lastPatchData['email']);
    }

    public function testUpdateContactEmailOmittedWhenNotIncluded(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'ct-1', 'name' => 'Jane'], 'message' => 'Contact updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateContact('ct-1', new UpdateContactRequest(name: 'Jane'));

        $this->assertArrayNotHasKey('email', $this->mockClient->lastPatchData);
    }

    public function testUpdateContactPhoneNullClear(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'ct-1', 'phone' => null], 'message' => 'Contact updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateContact('ct-1', new UpdateContactRequest(
            phone: null,
            includePhone: true,
        ));

        $this->assertArrayHasKey('phone', $this->mockClient->lastPatchData);
        $this->assertNull($this->mockClient->lastPatchData['phone']);
    }

    public function testUpdateContactTitleNullClear(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'ct-1', 'title' => null], 'message' => 'Contact updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateContact('ct-1', new UpdateContactRequest(
            title: null,
            includeTitle: true,
        ));

        $this->assertArrayHasKey('title', $this->mockClient->lastPatchData);
        $this->assertNull($this->mockClient->lastPatchData['title']);
    }

    public function testUpdateContactPhoneAndTitleOmittedWhenNotIncluded(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'ct-1', 'name' => 'Jane'], 'message' => 'Contact updated successfully']);
        $this->injectMockClient();

        TurboQuote::updateContact('ct-1', new UpdateContactRequest(name: 'Jane'));

        $this->assertArrayNotHasKey('phone', $this->mockClient->lastPatchData);
        $this->assertArrayNotHasKey('title', $this->mockClient->lastPatchData);
    }

    public function testDeleteContact(): void
    {
        $this->mockClient->setDeleteReturn(['message' => 'Contact deleted successfully']);
        $this->injectMockClient();

        $result = TurboQuote::deleteContact('ct-1');

        $this->assertInstanceOf(MessageResponse::class, $result);
        $this->assertSame('Contact deleted successfully', $result->message);
    }

    // ============================================
    // TEMPLATES
    // ============================================

    public function testListAllTemplates(): void
    {
        $mockResponse = [
            'results' => [
                ['id' => 't-1', 'primaryColor' => '#0066FF'],
                ['id' => 't-2', 'primaryColor' => '#FF0000'],
            ],
            'totalRecords' => 2,
        ];
        $this->mockClient->setGetReturn($mockResponse);
        $this->injectMockClient();

        $result = TurboQuote::listTemplates();

        $this->assertInstanceOf(QuoteTemplateListResponse::class, $result);
        $this->assertCount(2, $result->results);
        $this->assertInstanceOf(QuoteTemplate::class, $result->results[0]);
        $this->assertSame('/v1/quote-templates', $this->mockClient->lastGetPath);
    }

    public function testListTemplatesWithPaginationAndQuery(): void
    {
        $this->mockClient->setGetReturn(['results' => [['id' => 't-1', 'primaryColor' => '#0066FF']], 'totalRecords' => 1]);
        $this->injectMockClient();

        $result = TurboQuote::listTemplates(new ListTemplatesRequest(limit: 10, offset: 0, query: 'sales'));

        $this->assertInstanceOf(QuoteTemplateListResponse::class, $result);
        $this->assertCount(1, $result->results);
        $this->assertSame('/v1/quote-templates', $this->mockClient->lastGetPath);
        $this->assertSame('sales', $this->mockClient->lastGetParams['query']);
        $this->assertSame('10', $this->mockClient->lastGetParams['limit']);
        $this->assertSame('0', $this->mockClient->lastGetParams['offset']);
    }

    public function testGetTemplateByIdAndUnwrapResult(): void
    {
        $this->mockClient->setGetReturn(['result' => ['id' => 't-1', 'primaryColor' => '#0066FF']]);
        $this->injectMockClient();

        $result = TurboQuote::getTemplateById('t-1');

        $this->assertInstanceOf(QuoteTemplate::class, $result);
        $this->assertSame('t-1', $result->id);
        $this->assertSame('/v1/quote-templates/t-1', $this->mockClient->lastGetPath);
    }

    public function testGetOrgTemplateAndUnwrapResult(): void
    {
        $this->mockClient->setGetReturn(['result' => ['id' => 't-1', 'primaryColor' => '#0066FF'], 'message' => 'Template found']);
        $this->injectMockClient();

        $result = TurboQuote::getTemplate();

        $this->assertInstanceOf(QuoteTemplate::class, $result);
        $this->assertSame('t-1', $result->id);
        $this->assertSame('/v1/quote-template', $this->mockClient->lastGetPath);
    }

    public function testCreateTemplateAndUnwrapResult(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 't-1', 'primaryColor' => '#0066FF'], 'message' => 'Template created successfully']);
        $this->injectMockClient();

        $result = TurboQuote::createTemplate(new CreateQuoteTemplateRequest(primaryColor: '#0066FF', senderName: 'Sales'));

        $this->assertInstanceOf(QuoteTemplate::class, $result);
        $this->assertSame('t-1', $result->id);
        $this->assertSame('/v1/quote-templates', $this->mockClient->lastPostPath);
        $this->assertSame(['primaryColor' => '#0066FF', 'senderName' => 'Sales'], $this->mockClient->lastPostData);
    }

    public function testUpdateTemplateAndUnwrapResult(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 't-1', 'primaryColor' => '#FF0000'], 'message' => 'Template updated successfully']);
        $this->injectMockClient();

        $result = TurboQuote::updateTemplate('t-1', new UpdateQuoteTemplateRequest(primaryColor: '#FF0000'));

        $this->assertInstanceOf(QuoteTemplate::class, $result);
        $this->assertSame('#FF0000', $result->primaryColor);
        $this->assertSame('/v1/quote-templates/t-1', $this->mockClient->lastPatchPath);
        $this->assertSame(['primaryColor' => '#FF0000'], $this->mockClient->lastPatchData);
    }

    public function testDeleteTemplate(): void
    {
        $this->mockClient->setDeleteReturn(['message' => 'Template deleted successfully']);
        $this->injectMockClient();

        $result = TurboQuote::deleteTemplate('t-1');

        $this->assertInstanceOf(MessageResponse::class, $result);
        $this->assertSame('Template deleted successfully', $result->message);
        $this->assertSame('/v1/quote-templates/t-1', $this->mockClient->lastDeletePath);
    }

    // ============================================
    // TYPES / CATEGORIES
    // ============================================

    public function testListTypesByCategory(): void
    {
        $this->mockClient->setGetReturn(['results' => [['id' => 'type-1', 'name' => 'Technology']], 'totalRecords' => 1]);
        $this->injectMockClient();

        $result = TurboQuote::listTypes(new ListTypesRequest(categoryType: 'company_industry'));

        $this->assertInstanceOf(QuoteTypeListResponse::class, $result);
        $this->assertCount(1, $result->results);
        $this->assertInstanceOf(QuoteType::class, $result->results[0]);
        $this->assertSame('/v1/types', $this->mockClient->lastGetPath);
        $this->assertSame('company_industry', $this->mockClient->lastGetParams['categoryType']);
    }

    public function testListTypesWithoutOptions(): void
    {
        $this->mockClient->setGetReturn(['results' => [], 'totalRecords' => 0]);
        $this->injectMockClient();

        $result = TurboQuote::listTypes();

        $this->assertInstanceOf(QuoteTypeListResponse::class, $result);
        $this->assertCount(0, $result->results);
        $this->assertSame('/v1/types', $this->mockClient->lastGetPath);
    }

    public function testCreateTypeAndUnwrapResult(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'type-1', 'name' => 'SaaS', 'categoryType' => 'product_category'], 'message' => 'Type created successfully']);
        $this->injectMockClient();

        $result = TurboQuote::createType(new CreateQuoteTypeRequest(name: 'SaaS', categoryType: 'product_category'));

        $this->assertInstanceOf(QuoteType::class, $result);
        $this->assertSame('SaaS', $result->name);
    }

    public function testUpdateTypeAndUnwrapResult(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'type-1', 'name' => 'Software'], 'message' => 'Type updated successfully']);
        $this->injectMockClient();

        $result = TurboQuote::updateType('type-1', new UpdateQuoteTypeRequest(name: 'Software'));

        $this->assertInstanceOf(QuoteType::class, $result);
        $this->assertSame('Software', $result->name);
    }

    public function testDeleteType(): void
    {
        $this->mockClient->setDeleteReturn(['message' => 'Type deleted successfully']);
        $this->injectMockClient();

        $result = TurboQuote::deleteType('type-1');

        $this->assertInstanceOf(MessageResponse::class, $result);
        $this->assertSame('Type deleted successfully', $result->message);
    }

    // ============================================
    // CONVENIENCE — createAndSend
    // ============================================

    public function testCreateAndSendWithItems(): void
    {
        $mockQuote = ['id' => 'q-1', 'name' => 'Enterprise License', 'status' => 'draft'];
        $this->mockClient->setPostReturnSequence([
            ['result' => $mockQuote, 'message' => 'Quote created successfully'],
            ['results' => [['id' => 'li-1']], 'message' => '1 line item(s) added successfully'],
            ['result' => array_merge($mockQuote, ['status' => 'sent']), 'message' => 'Sent'],
        ]);
        $this->injectMockClient();

        $result = TurboQuote::createAndSend(new CreateAndSendRequest(
            name: 'Enterprise License',
            companyId: 'c-1',
            contactId: 'ct-1',
            items: [new AddLineItemRequest(productId: 'p-1', productName: 'Widget', unitPrice: 99, billingFrequency: 'monthly', quantity: 10)],
            send: new SendQuoteRequest(ccEmails: ['admin@example.com']),
        ));

        $this->assertInstanceOf(CreateAndSendResponse::class, $result);
        $this->assertSame('sent', $result->quote->status);
        $this->assertSame('/v1/quotes', $this->mockClient->postPaths[0]);
        $this->assertSame('/v1/quotes/q-1/items', $this->mockClient->postPaths[1]);
        $this->assertSame('/v1/quotes/q-1/send', $this->mockClient->postPaths[2]);
    }

    public function testCreateAndSendWithoutItems(): void
    {
        $mockQuote = ['id' => 'q-1', 'name' => 'Simple Quote', 'status' => 'draft'];
        $this->mockClient->setPostReturnSequence([
            ['result' => $mockQuote, 'message' => 'Quote created successfully'],
            ['result' => array_merge($mockQuote, ['status' => 'sent']), 'message' => 'Sent'],
        ]);
        $this->injectMockClient();

        $result = TurboQuote::createAndSend(new CreateAndSendRequest(
            name: 'Simple Quote',
            companyId: 'c-1',
            contactId: 'ct-1',
        ));

        $this->assertInstanceOf(CreateAndSendResponse::class, $result);
        $this->assertSame('sent', $result->quote->status);
        $this->assertCount(2, $this->mockClient->postPaths);
        $this->assertSame('/v1/quotes', $this->mockClient->postPaths[0]);
        $this->assertSame('/v1/quotes/q-1/send', $this->mockClient->postPaths[1]);
    }

    public function testCreateAndSendWithBundleItems(): void
    {
        $mockQuote = ['id' => 'q-1', 'name' => 'Bundle Quote', 'status' => 'draft'];
        $this->mockClient->setPostReturnSequence([
            ['result' => $mockQuote, 'message' => 'Quote created successfully'],
            ['results' => [['id' => 'li-1', 'lineItemType' => 'bundle']], 'message' => '1 bundle(s) added successfully'],
            ['result' => array_merge($mockQuote, ['status' => 'sent']), 'message' => 'Sent'],
        ]);
        $this->injectMockClient();

        $result = TurboQuote::createAndSend(new CreateAndSendRequest(
            name: 'Bundle Quote',
            companyId: 'c-1',
            contactId: 'ct-1',
            bundleItems: [new AddBundleLineItemRequest(bundleId: 'b-1', bundleName: 'Starter Pack')],
        ));

        $this->assertInstanceOf(CreateAndSendResponse::class, $result);
        $this->assertSame('sent', $result->quote->status);
        $this->assertSame('/v1/quotes/q-1/items/bundle', $this->mockClient->postPaths[1]);
    }

    // ============================================
    // ENUMS
    // ============================================

    public function testQuoteStatusPendingApprovalExists(): void
    {
        $status = QuoteStatus::PENDING_APPROVAL;
        $this->assertSame('pending_approval', $status->value);
    }

    public function testQuoteStatusEnumHasAllValues(): void
    {
        $cases = array_map(fn(QuoteStatus $s) => $s->value, QuoteStatus::cases());
        $this->assertContains('draft', $cases);
        $this->assertContains('pending_approval', $cases);
        $this->assertContains('sent', $cases);
        $this->assertContains('accepted', $cases);
        $this->assertContains('declined', $cases);
        $this->assertContains('voided', $cases);
        $this->assertCount(6, $cases);
    }

    public function testBundleItemStatusEnumValues(): void
    {
        $this->assertEquals('active', BundleItemStatus::ACTIVE->value);
        $this->assertEquals('product_deleted', BundleItemStatus::PRODUCT_DELETED->value);
        $this->assertEquals('product_unavailable', BundleItemStatus::PRODUCT_UNAVAILABLE->value);
        $this->assertEquals('currency_mismatch', BundleItemStatus::CURRENCY_MISMATCH->value);
        $this->assertCount(4, BundleItemStatus::cases());
    }

    public function testDiscountTypeEnumValues(): void
    {
        $this->assertSame('percent', DiscountType::PERCENT->value);
        $this->assertSame('amount', DiscountType::AMOUNT->value);
        $this->assertCount(2, DiscountType::cases());
    }

    public function testQuoteNumberYearTokenEnumValues(): void
    {
        $this->assertSame('none', QuoteNumberYearToken::NONE->value);
        $this->assertSame('two', QuoteNumberYearToken::TWO->value);
        $this->assertSame('four', QuoteNumberYearToken::FOUR->value);
        $this->assertCount(3, QuoteNumberYearToken::cases());
    }

    public function testQuoteNumberMonthTokenEnumValues(): void
    {
        $this->assertSame('off', QuoteNumberMonthToken::OFF->value);
        $this->assertSame('two', QuoteNumberMonthToken::TWO->value);
        $this->assertCount(2, QuoteNumberMonthToken::cases());
    }

    public function testQuoteNumberResetCadenceEnumValues(): void
    {
        $this->assertSame('never', QuoteNumberResetCadence::NEVER->value);
        $this->assertSame('yearly', QuoteNumberResetCadence::YEARLY->value);
        $this->assertSame('monthly', QuoteNumberResetCadence::MONTHLY->value);
        $this->assertCount(3, QuoteNumberResetCadence::cases());
    }

    // ============================================
    // QUOTE LIST STATS
    // ============================================

    public function testQuoteListStatsFromArray(): void
    {
        $data = [
            'total' => 42,
            'draft' => 10,
            'sent' => 15,
            'accepted' => 8,
            'declined' => 5,
            'voided' => 4,
            'totalPipeline' => [
                ['currency' => 'USD', 'total' => 50000.00],
                ['currency' => 'EUR', 'total' => 12000.00],
            ],
            'activeQuotes' => 25,
            'monthlyRecurringRevenue' => [
                ['currency' => 'USD', 'total' => 9500.00],
            ],
            'winRate' => 61.5,
            'avgMargin' => 42.3,
            'quotesThisMonth' => 7,
        ];

        $stats = QuoteListStats::fromArray($data);

        $this->assertSame(42, $stats->total);
        $this->assertSame(10, $stats->draft);
        $this->assertSame(15, $stats->sent);
        $this->assertSame(8, $stats->accepted);
        $this->assertSame(5, $stats->declined);
        $this->assertSame(4, $stats->voided);
        $this->assertSame(25, $stats->activeQuotes);
        $this->assertSame(61.5, $stats->winRate);
        $this->assertSame(42.3, $stats->avgMargin);
        $this->assertSame(7, $stats->quotesThisMonth);

        // totalPipeline
        $this->assertCount(2, $stats->totalPipeline);
        $this->assertInstanceOf(CurrencyTotal::class, $stats->totalPipeline[0]);
        $this->assertSame('USD', $stats->totalPipeline[0]->currency);
        $this->assertSame(50000.00, $stats->totalPipeline[0]->total);
        $this->assertSame('EUR', $stats->totalPipeline[1]->currency);
        $this->assertSame(12000.00, $stats->totalPipeline[1]->total);

        // monthlyRecurringRevenue
        $this->assertCount(1, $stats->monthlyRecurringRevenue);
        $this->assertInstanceOf(CurrencyTotal::class, $stats->monthlyRecurringRevenue[0]);
        $this->assertSame('USD', $stats->monthlyRecurringRevenue[0]->currency);
        $this->assertSame(9500.00, $stats->monthlyRecurringRevenue[0]->total);
    }

    public function testQuoteListStatsToArray(): void
    {
        $stats = QuoteListStats::fromArray([
            'total' => 5,
            'draft' => 2,
            'sent' => 1,
            'accepted' => 1,
            'declined' => 0,
            'voided' => 1,
            'totalPipeline' => [['currency' => 'USD', 'total' => 1000]],
            'activeQuotes' => 3,
            'monthlyRecurringRevenue' => [],
            'winRate' => 50.0,
            'avgMargin' => 30.0,
            'quotesThisMonth' => 2,
        ]);

        $arr = $stats->toArray();
        $this->assertSame(5, $arr['total']);
        $this->assertSame(2, $arr['draft']);
        $this->assertSame(1, $arr['sent']);
        $this->assertSame(1, $arr['accepted']);
        $this->assertSame(0, $arr['declined']);
        $this->assertSame(1, $arr['voided']);
        $this->assertSame(3, $arr['activeQuotes']);
        $this->assertSame(50.0, $arr['winRate']);
        $this->assertSame(30.0, $arr['avgMargin']);
        $this->assertSame(2, $arr['quotesThisMonth']);
        $this->assertCount(1, $arr['totalPipeline']);
        $this->assertSame(['currency' => 'USD', 'total' => 1000.0], $arr['totalPipeline'][0]);
        $this->assertCount(0, $arr['monthlyRecurringRevenue']);
    }

    public function testQuoteListStatsDefaults(): void
    {
        $stats = QuoteListStats::fromArray([]);

        $this->assertSame(0, $stats->total);
        $this->assertSame(0, $stats->draft);
        $this->assertSame(0, $stats->sent);
        $this->assertSame(0, $stats->accepted);
        $this->assertSame(0, $stats->declined);
        $this->assertSame(0, $stats->voided);
        $this->assertSame(0, $stats->activeQuotes);
        $this->assertSame(0.0, $stats->winRate);
        $this->assertSame(0.0, $stats->avgMargin);
        $this->assertSame(0, $stats->quotesThisMonth);
        $this->assertCount(0, $stats->totalPipeline);
        $this->assertCount(0, $stats->monthlyRecurringRevenue);
    }

    public function testQuoteListResponseUsesTypedStats(): void
    {
        $mockResponse = [
            'results' => [['id' => 'q-1', 'name' => 'Test Quote', 'status' => 'draft']],
            'totalRecords' => 1,
            'stats' => [
                'total' => 1,
                'draft' => 1,
                'sent' => 0,
                'accepted' => 0,
                'declined' => 0,
                'voided' => 0,
                'totalPipeline' => [],
                'activeQuotes' => 1,
                'monthlyRecurringRevenue' => [],
                'winRate' => 0,
                'avgMargin' => 0,
                'quotesThisMonth' => 1,
            ],
        ];
        $this->mockClient->setGetReturn($mockResponse);
        $this->injectMockClient();

        $result = TurboQuote::listQuotes(new ListQuotesRequest());

        $this->assertInstanceOf(QuoteListStats::class, $result->stats);
        $this->assertSame(1, $result->stats->total);
        $this->assertSame(1, $result->stats->draft);
        $this->assertSame(1, $result->stats->quotesThisMonth);
    }

    public function testQuoteListResponseWithNullStats(): void
    {
        $mockResponse = [
            'results' => [],
            'totalRecords' => 0,
        ];
        $this->mockClient->setGetReturn($mockResponse);
        $this->injectMockClient();

        $result = TurboQuote::listQuotes(new ListQuotesRequest());

        $this->assertNull($result->stats);
    }

    public function testCurrencyTotalFromArray(): void
    {
        $ct = CurrencyTotal::fromArray(['currency' => 'GBP', 'total' => 7500.50]);

        $this->assertSame('GBP', $ct->currency);
        $this->assertSame(7500.50, $ct->total);
    }

    public function testCurrencyTotalToArray(): void
    {
        $ct = CurrencyTotal::fromArray(['currency' => 'USD', 'total' => 100]);

        $arr = $ct->toArray();
        $this->assertSame(['currency' => 'USD', 'total' => 100.0], $arr);
    }

    // ============================================
    // QUOTE NUMBER CONFIG
    // ============================================

    public function testGetQuoteNumberConfigUnwrapsResults(): void
    {
        $mockFormat = [
            'prefix' => 'Q-',
            'yearToken' => 'four',
            'monthToken' => 'two',
            'separator' => '-',
            'padWidth' => 5,
            'suffix' => '',
            'startNumber' => 1,
            'resetCadence' => 'yearly',
        ];
        $this->mockClient->setGetReturn(['results' => ['format' => $mockFormat, 'currentFloor' => 42]]);
        $this->injectMockClient();

        $result = TurboQuote::getQuoteNumberConfig();

        $this->assertInstanceOf(QuoteNumberConfig::class, $result);
        $this->assertInstanceOf(QuoteNumberFormat::class, $result->format);
        $this->assertSame('Q-', $result->format->prefix);
        $this->assertSame('four', $result->format->yearToken);
        $this->assertSame('two', $result->format->monthToken);
        $this->assertSame('-', $result->format->separator);
        $this->assertSame(5, $result->format->padWidth);
        $this->assertSame('', $result->format->suffix);
        $this->assertSame(1, $result->format->startNumber);
        $this->assertSame('yearly', $result->format->resetCadence);
        $this->assertSame(42, $result->currentFloor);
        $this->assertSame('/v1/quotes/number-config', $this->mockClient->lastGetPath);
    }

    public function testUpdateQuoteNumberConfigSendsFormatBodyAndUnwrapsResults(): void
    {
        $sentFormat = [
            'prefix' => 'INV-',
            'yearToken' => 'two',
            'monthToken' => 'off',
            'separator' => '/',
            'padWidth' => 4,
            'suffix' => '-X',
            'startNumber' => 100,
            'resetCadence' => 'monthly',
        ];
        $this->mockClient->setPatchReturn(['results' => ['format' => $sentFormat, 'currentFloor' => 7]]);
        $this->injectMockClient();

        $result = TurboQuote::updateQuoteNumberConfig(new QuoteNumberFormat(
            prefix: 'INV-',
            yearToken: 'two',
            monthToken: 'off',
            separator: '/',
            padWidth: 4,
            suffix: '-X',
            startNumber: 100,
            resetCadence: 'monthly',
        ));

        $this->assertInstanceOf(QuoteNumberConfig::class, $result);
        $this->assertSame('INV-', $result->format->prefix);
        $this->assertSame(7, $result->currentFloor);
        $this->assertSame('/v1/quotes/number-config', $this->mockClient->lastPatchPath);
        // Request body keys are camelCase verbatim; padWidth/startNumber are integers.
        $this->assertSame($sentFormat, $this->mockClient->lastPatchData);
        $this->assertSame(4, $this->mockClient->lastPatchData['padWidth']);
        $this->assertSame(100, $this->mockClient->lastPatchData['startNumber']);
    }

    // ============================================
    // BULK CREATES
    // ============================================

    public function testBulkCreateProductsPostsRowsEnvelopeAndUnwrapsResults(): void
    {
        $this->mockClient->setPostReturn([
            'results' => ['imported' => 2, 'failed' => [], 'adjusted' => []],
        ]);
        $this->injectMockClient();

        $result = TurboQuote::bulkCreateProducts([
            new CreateProductRequest(name: 'Widget', listPrice: 100.0, billingFrequency: 'one-time', categoryId: 'cat-1'),
            new CreateProductRequest(name: 'Gadget', listPrice: 250.5, billingFrequency: 'monthly', categoryId: 'cat-1', sku: 'GAD-1'),
        ]);

        $this->assertInstanceOf(BulkImportResult::class, $result);
        $this->assertSame(2, $result->imported);
        $this->assertSame([], $result->failed);
        $this->assertSame([], $result->adjusted);
        $this->assertSame('/v1/products/bulk', $this->mockClient->lastPostPath);
        // Rows are passed verbatim (camelCase keys) inside the { rows } envelope.
        $this->assertSame([
            'rows' => [
                ['name' => 'Widget', 'listPrice' => 100.0, 'billingFrequency' => 'one-time', 'categoryId' => 'cat-1'],
                ['name' => 'Gadget', 'listPrice' => 250.5, 'billingFrequency' => 'monthly', 'categoryId' => 'cat-1', 'sku' => 'GAD-1'],
            ],
        ], $this->mockClient->lastPostData);
    }

    public function testBulkCreatePriceBooksPostsRowsEnvelopeAndUnwrapsResults(): void
    {
        $this->mockClient->setPostReturn([
            'results' => ['imported' => 1, 'failed' => [], 'adjusted' => []],
        ]);
        $this->injectMockClient();

        $result = TurboQuote::bulkCreatePriceBooks([
            new CreatePriceBookRequest(name: 'Partner Pricing', priceBookTypeId: 'pbt-1', validFrom: '2026-01-01', discountPercent: 10.0),
        ]);

        $this->assertInstanceOf(BulkImportResult::class, $result);
        $this->assertSame(1, $result->imported);
        $this->assertSame('/v1/pricebooks/bulk', $this->mockClient->lastPostPath);
        $this->assertSame([
            'rows' => [
                ['name' => 'Partner Pricing', 'priceBookTypeId' => 'pbt-1', 'validFrom' => '2026-01-01', 'discountPercent' => 10.0],
            ],
        ], $this->mockClient->lastPostData);
    }

    public function testBulkCreateBundlesPostsRowsEnvelopeAndUnwrapsResults(): void
    {
        $this->mockClient->setPostReturn([
            'results' => ['imported' => 1, 'failed' => [], 'adjusted' => []],
        ]);
        $this->injectMockClient();

        $result = TurboQuote::bulkCreateBundles([
            new CreateBundleRequest(name: 'Starter Kit', categoryId: 'cat-1', items: [['productId' => 'p-1', 'quantity' => 2]]),
        ]);

        $this->assertInstanceOf(BulkImportResult::class, $result);
        $this->assertSame(1, $result->imported);
        $this->assertSame('/v1/bundles/bulk', $this->mockClient->lastPostPath);
        $this->assertSame([
            'rows' => [
                ['name' => 'Starter Kit', 'categoryId' => 'cat-1', 'items' => [['productId' => 'p-1', 'quantity' => 2]]],
            ],
        ], $this->mockClient->lastPostData);
    }

    public function testBulkCreateCompaniesPostsRowsEnvelopeAndUnwrapsResults(): void
    {
        $this->mockClient->setPostReturn([
            'results' => ['imported' => 1, 'failed' => [], 'adjusted' => []],
        ]);
        $this->injectMockClient();

        $result = TurboQuote::bulkCreateCompanies([
            new CreateCompanyRequest(name: 'Acme Corp', contacts: [['name' => 'Jane Doe', 'email' => 'jane@acme.com']]),
        ]);

        $this->assertInstanceOf(BulkImportResult::class, $result);
        $this->assertSame(1, $result->imported);
        $this->assertSame('/v1/companies/bulk', $this->mockClient->lastPostPath);
        $this->assertSame([
            'rows' => [
                ['name' => 'Acme Corp', 'contacts' => [['name' => 'Jane Doe', 'email' => 'jane@acme.com']]],
            ],
        ], $this->mockClient->lastPostData);
    }

    public function testBulkCreateContactsPostsRowsEnvelopeAndUnwrapsResults(): void
    {
        $this->mockClient->setPostReturn([
            'results' => ['imported' => 1, 'failed' => [], 'adjusted' => []],
        ]);
        $this->injectMockClient();

        $result = TurboQuote::bulkCreateContacts([
            new CreateContactRequest(name: 'John Smith', companyId: 'c-1', email: 'john@acme.com'),
        ]);

        $this->assertInstanceOf(BulkImportResult::class, $result);
        $this->assertSame(1, $result->imported);
        $this->assertSame('/v1/contacts/bulk', $this->mockClient->lastPostPath);
        $this->assertSame([
            'rows' => [
                ['name' => 'John Smith', 'companyId' => 'c-1', 'email' => 'john@acme.com'],
            ],
        ], $this->mockClient->lastPostData);
    }

    public function testBulkCreateTypesPostsRowsEnvelopeAndUnwrapsResults(): void
    {
        $this->mockClient->setPostReturn([
            'results' => ['imported' => 2, 'failed' => [], 'adjusted' => []],
        ]);
        $this->injectMockClient();

        $result = TurboQuote::bulkCreateTypes([
            new CreateQuoteTypeRequest(name: 'Hardware', categoryType: 'product'),
            new CreateQuoteTypeRequest(name: 'Services', categoryType: 'product'),
        ]);

        $this->assertInstanceOf(BulkImportResult::class, $result);
        $this->assertSame(2, $result->imported);
        $this->assertSame('/v1/types/bulk', $this->mockClient->lastPostPath);
        $this->assertSame([
            'rows' => [
                ['name' => 'Hardware', 'categoryType' => 'product'],
                ['name' => 'Services', 'categoryType' => 'product'],
            ],
        ], $this->mockClient->lastPostData);
    }

    public function testBulkCreatePartialSuccessSurfacesFailedAndAdjustedWithoutThrowing(): void
    {
        $this->mockClient->setPostReturn([
            'results' => [
                'imported' => 3,
                'failed' => [['row' => 2, 'reason' => 'Category not found']],
                'adjusted' => [['row' => 5, 'reason' => 'Bundle item product not found; item dropped']],
            ],
        ]);
        $this->injectMockClient();

        $result = TurboQuote::bulkCreateProducts([
            new CreateProductRequest(name: 'Widget', listPrice: 100.0, billingFrequency: 'one-time', categoryId: 'cat-1'),
        ]);

        // Partial success does NOT throw — issues are surfaced on the result.
        $this->assertInstanceOf(BulkImportResult::class, $result);
        $this->assertSame(3, $result->imported);
        $this->assertCount(1, $result->failed);
        $this->assertInstanceOf(BulkImportRowIssue::class, $result->failed[0]);
        $this->assertSame(2, $result->failed[0]->row);
        $this->assertSame('Category not found', $result->failed[0]->reason);
        $this->assertCount(1, $result->adjusted);
        $this->assertInstanceOf(BulkImportRowIssue::class, $result->adjusted[0]);
        $this->assertSame(5, $result->adjusted[0]->row);
        $this->assertSame('Bundle item product not found; item dropped', $result->adjusted[0]->reason);
    }

    // ============================================
    // ERROR HANDLING
    // ============================================

    public function testPropagateApiErrors(): void
    {
        $this->mockClient->setGetException(new \TurboDocx\Exceptions\NotFoundException('Quote not found'));
        $this->injectMockClient();

        $this->expectException(\TurboDocx\Exceptions\NotFoundException::class);
        $this->expectExceptionMessage('Quote not found');

        TurboQuote::getQuote('invalid');
    }

    public function testPropagateValidationErrors(): void
    {
        $this->mockClient->setPostException(new \TurboDocx\Exceptions\ValidationException('Name is required'));
        $this->injectMockClient();

        $this->expectException(\TurboDocx\Exceptions\ValidationException::class);
        $this->expectExceptionMessage('Name is required');

        TurboQuote::createQuote(new CreateQuoteRequest(name: '', companyId: 'c-1', contactId: 'ct-1'));
    }
}

/**
 * Simple mock HttpClient stub for testing TurboQuote.
 *
 * Since HttpClient is final and cannot be mocked by PHPUnit,
 * we use a plain object with the same public method signatures
 * and inject it via ReflectionClass.
 */
class MockHttpClient extends \TurboDocx\HttpClient
{
    public function __construct()
    {
        // Intentionally empty — no parent::__construct() call.
        // This mock replaces all public methods, so the parent's
        // Guzzle client is never used.
    }

    // Last call tracking
    public ?string $lastGetPath = null;
    /** @var array<string, mixed> */
    public array $lastGetParams = [];
    public ?string $lastPostPath = null;
    public mixed $lastPostData = null;
    public ?string $lastPatchPath = null;
    public mixed $lastPatchData = null;
    public ?string $lastDeletePath = null;
    public ?string $lastGetRawPath = null;
    public ?string $lastPostFormDataPath = null;
    /** @var array<int, array<string, mixed>> */
    public array $lastPostFormDataMultipart = [];
    public ?string $lastPatchFormDataPath = null;
    /** @var array<int, array<string, mixed>> */
    public array $lastPatchFormDataMultipart = [];

    /** @var string[] */
    public array $postPaths = [];

    // Return values
    private mixed $getReturn = null;
    private mixed $postReturn = null;
    private mixed $patchReturn = null;
    private mixed $deleteReturn = null;
    private string $getRawReturn = '';
    private mixed $postFormDataReturn = null;
    private mixed $patchFormDataReturn = null;
    private ?\Throwable $getException = null;
    private ?\Throwable $postException = null;

    /** @var array<mixed> */
    private array $postReturnSequence = [];
    private int $postCallIndex = 0;

    public function setGetReturn(mixed $return): void
    {
        $this->getReturn = $return;
    }

    public function setPostReturn(mixed $return): void
    {
        $this->postReturn = $return;
        $this->postReturnSequence = [];
    }

    /** @param array<mixed> $sequence */
    public function setPostReturnSequence(array $sequence): void
    {
        $this->postReturnSequence = $sequence;
        $this->postCallIndex = 0;
    }

    public function setPatchReturn(mixed $return): void
    {
        $this->patchReturn = $return;
    }

    public function setDeleteReturn(mixed $return): void
    {
        $this->deleteReturn = $return;
    }

    public function setGetRawReturn(string $return): void
    {
        $this->getRawReturn = $return;
    }

    public function setPostFormDataReturn(mixed $return): void
    {
        $this->postFormDataReturn = $return;
    }

    public function setPatchFormDataReturn(mixed $return): void
    {
        $this->patchFormDataReturn = $return;
    }

    public function setGetException(\Throwable $e): void
    {
        $this->getException = $e;
    }

    public function setPostException(\Throwable $e): void
    {
        $this->postException = $e;
    }

    public function get(string $path, array $params = []): mixed
    {
        if ($this->getException) {
            throw $this->getException;
        }
        $this->lastGetPath = $path;
        $this->lastGetParams = $params;
        return $this->getReturn;
    }

    public function post(string $path, array|\stdClass|null $data = null): mixed
    {
        if ($this->postException) {
            throw $this->postException;
        }
        $this->lastPostPath = $path;
        $this->lastPostData = $data;
        $this->postPaths[] = $path;

        if (!empty($this->postReturnSequence)) {
            $return = $this->postReturnSequence[$this->postCallIndex] ?? end($this->postReturnSequence);
            $this->postCallIndex++;
            return $return;
        }

        return $this->postReturn;
    }

    public function patch(string $path, ?array $data = null): mixed
    {
        $this->lastPatchPath = $path;
        $this->lastPatchData = $data;
        return $this->patchReturn;
    }

    public function delete(string $path): mixed
    {
        $this->lastDeletePath = $path;
        return $this->deleteReturn;
    }

    public function getRaw(string $path): string
    {
        $this->lastGetRawPath = $path;
        return $this->getRawReturn;
    }

    public function postFormData(string $path, array $multipart): mixed
    {
        $this->lastPostFormDataPath = $path;
        $this->lastPostFormDataMultipart = $multipart;
        return $this->postFormDataReturn;
    }

    public function patchFormData(string $path, array $multipart): mixed
    {
        $this->lastPatchFormDataPath = $path;
        $this->lastPatchFormDataMultipart = $multipart;
        return $this->patchFormDataReturn;
    }

    public function getSenderConfig(): array
    {
        return ['sender_email' => null, 'sender_name' => null];
    }

    public function uploadFile(string $path, string $file, string $fieldName = 'file', array $additionalData = []): mixed
    {
        return [];
    }
}
