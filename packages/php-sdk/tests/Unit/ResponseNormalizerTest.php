<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Utils\ResponseNormalizer;

/**
 * Response Normalizer Tests
 *
 * MySQL returns tinyint(1) as 0/1 and decimal columns as strings.
 * The normalizer coerces these to proper boolean/number types so SDK
 * consumers always get the types declared in the PHPDoc annotations.
 */
final class ResponseNormalizerTest extends TestCase
{
    // ============================================
    // BOOLEAN COERCION (MySQL tinyint)
    // ============================================

    public function testConvert0ToFalseForKnownBooleanFields(): void
    {
        $input = ['isActive' => 0, 'isDefault' => 0, 'showInCatalog' => 0];
        $result = ResponseNormalizer::normalizeResponse($input);
        $this->assertSame(false, $result['isActive']);
        $this->assertSame(false, $result['isDefault']);
        $this->assertSame(false, $result['showInCatalog']);
    }

    public function testConvert1ToTrueForKnownBooleanFields(): void
    {
        $input = ['isActive' => 1, 'isDefault' => 1, 'showInCatalog' => 1];
        $result = ResponseNormalizer::normalizeResponse($input);
        $this->assertSame(true, $result['isActive']);
        $this->assertSame(true, $result['isDefault']);
        $this->assertSame(true, $result['showInCatalog']);
    }

    public function testHandleAllKnownBooleanFields(): void
    {
        $input = [
            'isActive' => 1,
            'isDefault' => 0,
            'showInCatalog' => 1,
            'showInQuoteBuilder' => 0,
            'showItemsToEndUser' => 1,
            'syncWithProducts' => 0,
            'isPrimaryAdmin' => 1,
            'canManageOrgs' => 1,
            'canManageUsers' => 0,
            'canManageBilling' => 1,
            'canViewAuditLog' => 0,
            'hasFileDownload' => 1,
            'hasGDrive' => 0,
            'rdWatermark' => 1,
        ];
        $result = ResponseNormalizer::normalizeResponse($input);

        $this->assertSame(true, $result['isActive']);
        $this->assertSame(false, $result['isDefault']);
        $this->assertSame(true, $result['showInCatalog']);
        $this->assertSame(false, $result['showInQuoteBuilder']);
        $this->assertSame(true, $result['showItemsToEndUser']);
        $this->assertSame(false, $result['syncWithProducts']);
        $this->assertSame(true, $result['isPrimaryAdmin']);
        $this->assertSame(true, $result['canManageOrgs']);
        $this->assertSame(false, $result['canManageUsers']);
        $this->assertSame(true, $result['canManageBilling']);
        $this->assertSame(false, $result['canViewAuditLog']);
        $this->assertSame(true, $result['hasFileDownload']);
        $this->assertSame(false, $result['hasGDrive']);
        $this->assertSame(true, $result['rdWatermark']);
    }

    public function testLeaveActualBooleansUnchanged(): void
    {
        $input = ['isActive' => true, 'isDefault' => false];
        $result = ResponseNormalizer::normalizeResponse($input);
        $this->assertSame(true, $result['isActive']);
        $this->assertSame(false, $result['isDefault']);
    }

    public function testNotConvertNonBooleanFieldsThatAre0Or1(): void
    {
        $input = ['quantity' => 1, 'offset' => 0, 'name' => 'test'];
        $result = ResponseNormalizer::normalizeResponse($input);
        $this->assertSame(1, $result['quantity']);
        $this->assertSame(0, $result['offset']);
        $this->assertSame('test', $result['name']);
    }

    // ============================================
    // DECIMAL COERCION (MySQL decimal strings)
    // ============================================

    public function testConvertStringDecimalsToFloats(): void
    {
        $input = ['listPrice' => '99.99', 'cost' => '50.00', 'unitPrice' => '25.50'];
        $result = ResponseNormalizer::normalizeResponse($input);
        $this->assertSame(99.99, $result['listPrice']);
        $this->assertSame(50.0, $result['cost']);
        $this->assertSame(25.5, $result['unitPrice']);
    }

    public function testHandleAllKnownDecimalFields(): void
    {
        $input = [
            'listPrice' => '100.00',
            'cost' => '50.00',
            'unitPrice' => '75.50',
            'discountPercent' => '10.00',
            'subtotal' => '67.95',
            'grandTotal' => '1234.56',
            'subtotalMonthly' => '500.00',
            'subtotalQuarterly' => '1500.00',
            'subtotalAnnual' => '6000.00',
            'subtotalOneTime' => '200.00',
            'taxAmount' => '48.00',
            'taxRate' => '8.50',
            'bundleDiscountPercent' => '15.00',
            'totalListPrice' => '1000.00',
            'totalFinalPrice' => '850.00',
            'totalCost' => '400.00',
            'finalPrice' => '85.00',
            'marginPercent' => '45.00',
        ];
        $result = ResponseNormalizer::normalizeResponse($input);

        $this->assertSame(100.0, $result['listPrice']);
        $this->assertSame(50.0, $result['cost']);
        $this->assertSame(75.5, $result['unitPrice']);
        $this->assertSame(10.0, $result['discountPercent']);
        $this->assertSame(67.95, $result['subtotal']);
        $this->assertSame(1234.56, $result['grandTotal']);
        $this->assertSame(500.0, $result['subtotalMonthly']);
        $this->assertSame(1500.0, $result['subtotalQuarterly']);
        $this->assertSame(6000.0, $result['subtotalAnnual']);
        $this->assertSame(200.0, $result['subtotalOneTime']);
        $this->assertSame(48.0, $result['taxAmount']);
        $this->assertSame(8.5, $result['taxRate']);
        $this->assertSame(15.0, $result['bundleDiscountPercent']);
        $this->assertSame(1000.0, $result['totalListPrice']);
        $this->assertSame(850.0, $result['totalFinalPrice']);
        $this->assertSame(400.0, $result['totalCost']);
        $this->assertSame(85.0, $result['finalPrice']);
        $this->assertSame(45.0, $result['marginPercent']);
    }

    public function testLeaveActualNumbersUnchanged(): void
    {
        $input = ['listPrice' => 99.99, 'quantity' => 5];
        $result = ResponseNormalizer::normalizeResponse($input);
        $this->assertSame(99.99, $result['listPrice']);
        $this->assertSame(5, $result['quantity']);
    }

    public function testHandleNullDecimalFields(): void
    {
        $input = ['cost' => null, 'taxRate' => null, 'marginPercent' => null];
        $result = ResponseNormalizer::normalizeResponse($input);
        $this->assertNull($result['cost']);
        $this->assertNull($result['taxRate']);
        $this->assertNull($result['marginPercent']);
    }

    public function testNotConvertNonNumericStringFields(): void
    {
        $input = ['name' => '99.99', 'quoteNumber' => 'Q-2026-00001', 'status' => 'draft'];
        $result = ResponseNormalizer::normalizeResponse($input);
        $this->assertSame('99.99', $result['name']);
        $this->assertSame('Q-2026-00001', $result['quoteNumber']);
        $this->assertSame('draft', $result['status']);
    }

    // ============================================
    // NESTED OBJECTS
    // ============================================

    public function testNormalizeFieldsInNestedObjects(): void
    {
        $input = [
            'id' => 'q-1',
            'isActive' => 1,
            'grandTotal' => '500.00',
            'company' => [
                'id' => 'c-1',
                'isActive' => 1,
                'name' => 'Acme',
            ],
            'contact' => [
                'id' => 'ct-1',
                'isActive' => 0,
            ],
        ];
        $result = ResponseNormalizer::normalizeResponse($input);

        $this->assertSame(true, $result['isActive']);
        $this->assertSame(500.0, $result['grandTotal']);
        $this->assertSame(true, $result['company']['isActive']);
        $this->assertSame('Acme', $result['company']['name']);
        $this->assertSame(false, $result['contact']['isActive']);
    }

    public function testNormalizeDeeplyNestedObjects(): void
    {
        $input = [
            'items' => [
                [
                    'id' => 'li-1',
                    'isActive' => 1,
                    'unitPrice' => '50.00',
                    'showItemsToEndUser' => 0,
                    'product' => [
                        'id' => 'p-1',
                        'isActive' => 1,
                        'listPrice' => '100.00',
                        'showInCatalog' => 1,
                    ],
                ],
            ],
        ];
        $result = ResponseNormalizer::normalizeResponse($input);

        $this->assertSame(true, $result['items'][0]['isActive']);
        $this->assertSame(50.0, $result['items'][0]['unitPrice']);
        $this->assertSame(false, $result['items'][0]['showItemsToEndUser']);
        $this->assertSame(true, $result['items'][0]['product']['isActive']);
        $this->assertSame(100.0, $result['items'][0]['product']['listPrice']);
        $this->assertSame(true, $result['items'][0]['product']['showInCatalog']);
    }

    // ============================================
    // ARRAYS
    // ============================================

    public function testNormalizeObjectsInsideArrays(): void
    {
        $input = [
            ['id' => '1', 'isActive' => 1, 'listPrice' => '10.00'],
            ['id' => '2', 'isActive' => 0, 'listPrice' => '20.00'],
        ];
        $result = ResponseNormalizer::normalizeResponse($input);

        $this->assertSame(true, $result[0]['isActive']);
        $this->assertSame(10.0, $result[0]['listPrice']);
        $this->assertSame(false, $result[1]['isActive']);
        $this->assertSame(20.0, $result[1]['listPrice']);
    }

    public function testHandleResultsArrayPattern(): void
    {
        $input = [
            'results' => [
                ['id' => '1', 'isActive' => 1, 'grandTotal' => '100.00'],
                ['id' => '2', 'isActive' => 0, 'grandTotal' => '200.00'],
            ],
            'totalRecords' => 2,
        ];
        $result = ResponseNormalizer::normalizeResponse($input);

        $this->assertSame(true, $result['results'][0]['isActive']);
        $this->assertSame(100.0, $result['results'][0]['grandTotal']);
        $this->assertSame(false, $result['results'][1]['isActive']);
        $this->assertSame(200.0, $result['results'][1]['grandTotal']);
        $this->assertSame(2, $result['totalRecords']);
    }

    // ============================================
    // EDGE CASES
    // ============================================

    public function testReturnPrimitivesUnchanged(): void
    {
        $this->assertSame('hello', ResponseNormalizer::normalizeResponse('hello'));
        $this->assertSame(42, ResponseNormalizer::normalizeResponse(42));
        $this->assertNull(ResponseNormalizer::normalizeResponse(null));
    }

    public function testHandleEmptyArrays(): void
    {
        $this->assertSame([], ResponseNormalizer::normalizeResponse([]));
    }

    public function testHandleEmptyAssociativeArray(): void
    {
        // In PHP, an empty array is always a list, so this is the same as empty array
        $this->assertSame([], ResponseNormalizer::normalizeResponse([]));
    }

    public function testNotMutateOriginalArray(): void
    {
        $input = ['isActive' => 1, 'listPrice' => '99.99'];
        $result = ResponseNormalizer::normalizeResponse($input);

        // Original unchanged
        $this->assertSame(1, $input['isActive']);
        $this->assertSame('99.99', $input['listPrice']);

        // Normalized
        $this->assertSame(true, $result['isActive']);
        $this->assertSame(99.99, $result['listPrice']);
    }
}
