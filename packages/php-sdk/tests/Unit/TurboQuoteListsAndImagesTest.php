<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

require_once __DIR__ . '/TurboQuoteTest.php';

use PHPUnit\Framework\TestCase;
use TurboDocx\TurboQuote;
use TurboDocx\Types\Quote\LineItemImage;
use TurboDocx\Types\Quote\NextQuoteNumber;
use TurboDocx\Types\Quote\QuoteCreator;
use TurboDocx\Types\Quote\QuoteSummary;
use TurboDocx\Types\Requests\Quote\CreateCompanyRequest;
use TurboDocx\Types\Requests\Quote\ListBundlesRequest;
use TurboDocx\Types\Requests\Quote\ListCompaniesRequest;
use TurboDocx\Types\Requests\Quote\ListContactsRequest;
use TurboDocx\Types\Requests\Quote\ListPriceBooksRequest;
use TurboDocx\Types\Requests\Quote\ListProductsRequest;
use TurboDocx\Types\Requests\Quote\ListQuotesRequest;
use TurboDocx\Types\Requests\Quote\ListTypesRequest;
use TurboDocx\Types\Requests\Quote\QuoteSummaryRequest;
use TurboDocx\Types\Requests\Quote\UpdateCompanyRequest;
use TurboDocx\Types\Requests\Quote\UpdatePriceBookRequest;
use TurboDocx\Types\Responses\Quote\OpenQuotesResponse;

/**
 * TurboQuote: list sorting and filters, the quote summary / creators / next number reads,
 * open quotes, product quote images, custom line item images, named duplicates, company
 * email and price book reset.
 */
final class TurboQuoteListsAndImagesTest extends TestCase
{
    private const PNG = "\x89PNG\r\n\x1a\n\x00";
    private const JPEG = "\xFF\xD8\xFF\xE0\x00";

    private MockHttpClient $mockClient;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mockClient = new MockHttpClient();
        $ref = new \ReflectionClass(TurboQuote::class);
        $ref->getProperty('client')->setValue(null, $this->mockClient);
    }

    // ============================================
    // SORTING AND FILTERS
    // ============================================

    public function testListQuotesSendsSortNewFiltersAndSummaryCurrency(): void
    {
        $this->mockClient->setGetReturn(['results' => [], 'totalRecords' => 0]);

        TurboQuote::listQuotes(new ListQuotesRequest(
            statuses: ['sent', 'expired'],
            companyIds: ['c-1', 'c-2'],
            currencies: ['USD', 'EUR'],
            createdBy: ['u-1'],
            createdByApiKeys: true,
            validUntilWindow: 'thisMonth',
            validUntilFrom: '2026-10-01',
            validUntilTo: '2026-10-31',
            sortBy: 'total',
            sortDirection: 'asc',
            summaryCurrency: 'EUR',
        ));

        $this->assertSame('/v1/quotes', $this->mockClient->lastGetPath);
        $this->assertSame([
            'statuses' => ['sent', 'expired'],
            'companyIds' => ['c-1', 'c-2'],
            'currencies' => ['USD', 'EUR'],
            'createdBy' => ['u-1'],
            'createdByApiKeys' => 'true',
            'validUntilWindow' => 'thisMonth',
            'validUntilFrom' => '2026-10-01',
            'validUntilTo' => '2026-10-31',
            'sortBy' => 'total',
            'sortDirection' => 'asc',
            'summaryCurrency' => 'EUR',
        ], $this->mockClient->lastGetParams);
    }

    public function testListQuotesStillTakesOneCurrency(): void
    {
        $this->mockClient->setGetReturn(['results' => [], 'totalRecords' => 0]);

        TurboQuote::listQuotes(new ListQuotesRequest(companyId: 'c-1', currency: 'GBP'));

        $this->assertSame(['companyId' => 'c-1', 'currency' => 'GBP'], $this->mockClient->lastGetParams);
    }

    public function testListQuotesReturnsCountsSummaryAndExpiry(): void
    {
        $this->mockClient->setGetReturn([
            'results' => [['id' => 'q-1', 'status' => 'sent', 'isExpired' => true, 'isSignatureExpired' => false, 'lineItemCount' => 3]],
            'totalRecords' => 1,
            'statusCounts' => ['all' => 1, 'sent' => 1, 'expired' => 1],
            'summary' => [
                'currency' => 'USD',
                'openPipeline' => ['total' => 1200.5, 'count' => 2],
                'winRate' => ['percent' => null, 'accepted' => 0, 'declined' => 0, 'windowDays' => 90],
            ],
        ]);

        $result = TurboQuote::listQuotes();

        $this->assertNotNull($result->statusCounts);
        $this->assertSame(1, $result->statusCounts->expired);
        $this->assertSame(0, $result->statusCounts->draft);
        $this->assertInstanceOf(QuoteSummary::class, $result->summary);
        $this->assertNull($result->summary->winRate['percent']);
        $this->assertSame(1200.5, $result->summary->openPipeline['total']);
        $this->assertTrue($result->results[0]->isExpired);
        $this->assertFalse($result->results[0]->isSignatureExpired);
        $this->assertSame(3, $result->results[0]->lineItemCount);
    }

    public function testListProductsSendsSeveralValuesAndSort(): void
    {
        $this->mockClient->setGetReturn(['results' => [], 'totalRecords' => 0]);

        TurboQuote::listProducts(new ListProductsRequest(
            billingFrequency: ['monthly', 'annual'],
            currency: ['USD', 'INR'],
            sortBy: 'listPrice',
            sortDirection: 'desc',
        ));

        $this->assertSame([
            'billingFrequency' => ['monthly', 'annual'],
            'currency' => ['USD', 'INR'],
            'sortBy' => 'listPrice',
            'sortDirection' => 'desc',
        ], $this->mockClient->lastGetParams);
    }

    public function testListPriceBooksSendsSort(): void
    {
        $this->mockClient->setGetReturn(['results' => [['id' => 'pb-1', 'overrideCount' => 2]], 'totalRecords' => 1]);

        $result = TurboQuote::listPriceBooks(new ListPriceBooksRequest(sortBy: 'overrideCount', sortDirection: 'desc'));

        $this->assertSame(['sortBy' => 'overrideCount', 'sortDirection' => 'desc'], $this->mockClient->lastGetParams);
        $this->assertSame(2, $result->results[0]->overrideCount);
    }

    public function testListBundlesSendsSeveralCurrenciesAndSort(): void
    {
        $this->mockClient->setGetReturn([
            'results' => [['id' => 'b-1', 'itemCount' => 2, 'billingTotals' => ['monthly' => 100, 'one-time' => 500]]],
            'totalRecords' => 1,
        ]);

        $result = TurboQuote::listBundles(new ListBundlesRequest(currency: ['USD', 'EUR'], sortBy: 'itemCount', sortDirection: 'asc'));

        $this->assertSame(['currency' => ['USD', 'EUR'], 'sortBy' => 'itemCount', 'sortDirection' => 'asc'], $this->mockClient->lastGetParams);
        $this->assertSame(2, $result->results[0]->itemCount);
        $this->assertSame(['monthly' => 100.0, 'one-time' => 500.0], $result->results[0]->billingTotals);
    }

    public function testListCompaniesSendsSort(): void
    {
        $this->mockClient->setGetReturn(['results' => [['id' => 'c-1', 'email' => 'ap@acme.test']], 'totalRecords' => 1]);

        $result = TurboQuote::listCompanies(new ListCompaniesRequest(sortBy: 'contactCount', sortDirection: 'desc'));

        $this->assertSame(['sortBy' => 'contactCount', 'sortDirection' => 'desc'], $this->mockClient->lastGetParams);
        $this->assertSame('ap@acme.test', $result->results[0]->email);
    }

    public function testListContactsSendsSeveralCompaniesAndSort(): void
    {
        $this->mockClient->setGetReturn(['results' => [], 'totalRecords' => 0]);

        TurboQuote::listContacts(new ListContactsRequest(companyIds: ['c-1', 'c-2'], sortBy: 'name', sortDirection: 'asc'));

        $this->assertSame(['companyIds' => ['c-1', 'c-2'], 'sortBy' => 'name', 'sortDirection' => 'asc'], $this->mockClient->lastGetParams);
    }

    public function testListCompanyContactsSendsSortAndReturnsContactCount(): void
    {
        $this->mockClient->setGetReturn([
            'results' => [], 'totalRecords' => 0, 'company' => ['id' => 'c-1', 'name' => 'Acme', 'contactCount' => 1],
        ]);

        $result = TurboQuote::listCompanyContacts('c-1', new ListContactsRequest(sortBy: 'createdOn', sortDirection: 'desc'));

        $this->assertSame('/v1/companies/c-1/contacts', $this->mockClient->lastGetPath);
        $this->assertSame(['sortBy' => 'createdOn', 'sortDirection' => 'desc'], $this->mockClient->lastGetParams);
        $this->assertNotNull($result->company);
        $this->assertSame(1, $result->company->contactCount);
    }

    public function testListTypesSendsSort(): void
    {
        $this->mockClient->setGetReturn(['results' => [], 'totalRecords' => 0]);

        TurboQuote::listTypes(new ListTypesRequest(categoryType: 'product_category', sortBy: 'usageCount', sortDirection: 'desc'));

        $this->assertSame(
            ['categoryType' => 'product_category', 'sortBy' => 'usageCount', 'sortDirection' => 'desc'],
            $this->mockClient->lastGetParams
        );
    }

    // ============================================
    // QUOTE READS
    // ============================================

    public function testGetQuoteSummary(): void
    {
        $this->mockClient->setGetReturn(['summary' => ['currency' => 'EUR', 'openPipeline' => ['total' => 10, 'count' => 1]]]);

        $result = TurboQuote::getQuoteSummary(new QuoteSummaryRequest(currencies: ['EUR', 'USD'], summaryCurrency: 'EUR'));

        $this->assertSame('/v1/quotes/summary', $this->mockClient->lastGetPath);
        $this->assertSame(['currencies' => ['EUR', 'USD'], 'summaryCurrency' => 'EUR'], $this->mockClient->lastGetParams);
        $this->assertSame('EUR', $result->currency);
        $this->assertSame(1, $result->openPipeline['count']);
    }

    public function testGetQuoteSummaryWithoutOptionsSendsNoParams(): void
    {
        $this->mockClient->setGetReturn(['summary' => ['currency' => 'USD']]);

        TurboQuote::getQuoteSummary();

        $this->assertSame([], $this->mockClient->lastGetParams);
    }

    public function testListQuoteCreators(): void
    {
        $this->mockClient->setGetReturn(['results' => [
            ['id' => 'u-1', 'name' => 'Ana Lee', 'email' => 'ana@acme.test', 'isAPIKey' => false, 'apiKeyDeleted' => false],
            ['id' => 'u-2', 'name' => 'Zapier key', 'email' => null, 'isAPIKey' => true, 'apiKeyDeleted' => true],
        ]]);

        $result = TurboQuote::listQuoteCreators();

        $this->assertSame('/v1/quotes/creators', $this->mockClient->lastGetPath);
        $this->assertCount(2, $result);
        $this->assertInstanceOf(QuoteCreator::class, $result[0]);
        $this->assertSame('Ana Lee', $result[0]->name);
        $this->assertNull($result[1]->email);
        $this->assertTrue($result[1]->isAPIKey);
        $this->assertTrue($result[1]->apiKeyDeleted);
    }

    public function testGetNextQuoteNumber(): void
    {
        $this->mockClient->setGetReturn(['results' => ['nextNumber' => 'Q-2026-0042', 'sequence' => 42, 'canEdit' => true]]);

        $result = TurboQuote::getNextQuoteNumber();

        $this->assertSame('/v1/quotes/number-config/next', $this->mockClient->lastGetPath);
        $this->assertInstanceOf(NextQuoteNumber::class, $result);
        $this->assertSame('Q-2026-0042', $result->nextNumber);
        $this->assertSame(42, $result->sequence);
        $this->assertTrue($result->canEdit);
    }

    // ============================================
    // OPEN QUOTES
    // ============================================

    public function testGetCompanyOpenQuotes(): void
    {
        $this->mockClient->setGetReturn([
            'results' => [['id' => 'q-1', 'quoteNumber' => 'Q-1', 'name' => 'Renewal', 'status' => 'sent', 'updatedOn' => '2026-10-01']],
            'totalRecords' => 1,
        ]);

        $result = TurboQuote::getCompanyOpenQuotes('c-1');

        $this->assertSame('/v1/companies/c-1/open-quotes', $this->mockClient->lastGetPath);
        $this->assertInstanceOf(OpenQuotesResponse::class, $result);
        $this->assertSame(1, $result->totalRecords);
        $this->assertSame('Q-1', $result->results[0]->quoteNumber);
        $this->assertSame('sent', $result->results[0]->status);
    }

    public function testGetContactOpenQuotes(): void
    {
        $this->mockClient->setGetReturn(['results' => [], 'totalRecords' => 0]);

        $result = TurboQuote::getContactOpenQuotes('ct-1');

        $this->assertSame('/v1/contacts/ct-1/open-quotes', $this->mockClient->lastGetPath);
        $this->assertSame(0, $result->totalRecords);
    }

    // ============================================
    // IMAGES
    // ============================================

    public function testGetProductQuoteImages(): void
    {
        $images = ['p-1' => [['id' => 'i-1', 'productId' => 'p-1', 'displayOrder' => 0]], 'p-2' => []];
        $this->mockClient->setPostReturn(['results' => $images]);

        $result = TurboQuote::getProductQuoteImages(['p-1', 'p-2']);

        $this->assertSame('/v1/products/quote-images', $this->mockClient->lastPostPath);
        $this->assertSame(['productIds' => ['p-1', 'p-2']], $this->mockClient->lastPostData);
        $this->assertSame($images, $result);
    }

    public function testGetQuoteLineItemImages(): void
    {
        $this->mockClient->setGetReturn(['results' => ['li-1' => [['id' => 'img-1', 'lineItemId' => 'li-1', 'displayOrder' => 0]]]]);

        $result = TurboQuote::getQuoteLineItemImages('q-1');

        $this->assertSame('/v1/quotes/q-1/items/images', $this->mockClient->lastGetPath);
        $this->assertInstanceOf(LineItemImage::class, $result['li-1'][0]);
        $this->assertSame('img-1', $result['li-1'][0]->id);
    }

    public function testGetLineItemImages(): void
    {
        $this->mockClient->setGetReturn(['results' => [['id' => 'img-1', 'lineItemId' => 'li-1', 'displayOrder' => 0]]]);

        $result = TurboQuote::getLineItemImages('q-1', 'li-1');

        $this->assertSame('/v1/quotes/q-1/items/li-1/images', $this->mockClient->lastGetPath);
        $this->assertSame('img-1', $result[0]->id);
    }

    public function testAddLineItemImagesUploadsImagesPartsWithDetectedTypes(): void
    {
        $this->mockClient->setPostFormDataReturn(['results' => [['id' => 'img-1'], ['id' => 'img-2']], 'message' => 'Images added']);

        $result = TurboQuote::addLineItemImages('q-1', 'li-1', [self::PNG, self::JPEG]);

        $this->assertSame('/v1/quotes/q-1/items/li-1/images', $this->mockClient->lastPostFormDataPath);
        $parts = $this->mockClient->lastPostFormDataMultipart;
        $this->assertSame(['images', 'images'], array_column($parts, 'name'));
        $this->assertSame('image/png', $parts[0]['headers']['Content-Type']);
        $this->assertSame('image.png', $parts[0]['filename']);
        $this->assertSame('image/jpeg', $parts[1]['headers']['Content-Type']);
        $this->assertSame(self::PNG, $parts[0]['contents']);
        $this->assertCount(2, $result);
        $this->assertSame('img-2', $result[1]->id);
    }

    public function testReorderLineItemImages(): void
    {
        $this->mockClient->setPutReturn(['results' => [['id' => 'img-2'], ['id' => 'img-1']]]);

        $result = TurboQuote::reorderLineItemImages('q-1', 'li-1', ['img-2', 'img-1']);

        $this->assertSame('/v1/quotes/q-1/items/li-1/images/order', $this->mockClient->lastPutPath);
        $this->assertSame(['imageIds' => ['img-2', 'img-1']], $this->mockClient->lastPutData);
        $this->assertSame('img-2', $result[0]->id);
    }

    public function testRemoveLineItemImage(): void
    {
        $this->mockClient->setDeleteReturn(['results' => [['id' => 'img-2']], 'message' => 'Image removed']);

        $result = TurboQuote::removeLineItemImage('q-1', 'li-1', 'img-1');

        $this->assertSame('/v1/quotes/q-1/items/li-1/images/img-1', $this->mockClient->lastDeletePath);
        $this->assertSame('img-2', $result[0]->id);
    }

    // ============================================
    // NAMED DUPLICATES
    // ============================================

    /**
     * @return array<string, array{string, string}>
     */
    public static function duplicateProvider(): array
    {
        return [
            'quote' => ['duplicateQuote', '/v1/quotes/x-1/duplicate'],
            'product' => ['duplicateProduct', '/v1/products/x-1/duplicate'],
            'price book' => ['duplicatePriceBook', '/v1/pricebooks/x-1/duplicate'],
            'bundle' => ['duplicateBundle', '/v1/bundles/x-1/duplicate'],
        ];
    }

    /**
     * @dataProvider duplicateProvider
     */
    public function testDuplicateSendsTheNameForTheCopy(string $method, string $path): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'x-2', 'name' => 'Q4 copy']]);

        $result = TurboQuote::$method('x-1', 'Q4 copy');

        $this->assertSame($path, $this->mockClient->lastPostPath);
        $this->assertSame(['name' => 'Q4 copy'], $this->mockClient->lastPostData);
        $this->assertSame('x-2', $result->id);
    }

    /**
     * @dataProvider duplicateProvider
     */
    public function testDuplicateWithoutANameSendsNoBody(string $method, string $path): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'x-2']]);

        TurboQuote::$method('x-1');

        $this->assertSame($path, $this->mockClient->lastPostPath);
        $this->assertNull($this->mockClient->lastPostData);
    }

    // ============================================
    // REQUEST FIELDS
    // ============================================

    public function testCreateCompanySendsTheEmail(): void
    {
        $this->mockClient->setPostReturn(['result' => ['id' => 'c-1']]);

        TurboQuote::createCompany(new CreateCompanyRequest(
            name: 'Acme',
            contacts: [['name' => 'Ana', 'email' => 'ana@acme.test']],
            email: 'ap@acme.test',
        ));

        $this->assertSame('ap@acme.test', $this->mockClient->lastPostData['email']);
    }

    public function testUpdateCompanySendsAnExplicitNullEmail(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'c-1']]);

        TurboQuote::updateCompany('c-1', new UpdateCompanyRequest(email: null, includeEmail: true));

        $this->assertSame(['email' => null], $this->mockClient->lastPatchData);
    }

    public function testUpdatePriceBookSendsResetProductPricing(): void
    {
        $this->mockClient->setPatchReturn(['result' => ['id' => 'pb-1']]);

        TurboQuote::updatePriceBook('pb-1', new UpdatePriceBookRequest(resetProductPricing: true));

        $this->assertSame(['resetProductPricing' => true], $this->mockClient->lastPatchData);
    }
}
