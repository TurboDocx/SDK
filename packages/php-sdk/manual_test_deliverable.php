<?php

/**
 * Deliverable PHP SDK - Manual Test Suite
 *
 * Run: php manual_test_deliverable.php
 *
 * Make sure to configure the values below before running.
 */

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

use TurboDocx\Deliverable;
use TurboDocx\Config\DeliverableConfig;
use TurboDocx\Exceptions\TurboDocxException;

// =============================================
// CONFIGURE THESE VALUES BEFORE RUNNING
// =============================================
const API_KEY = 'your-api-key-here';              // Replace with your actual TurboDocx API key
const BASE_URL = 'http://localhost:3000';          // Replace with your API URL
const ORG_ID = 'your-organization-id-here';        // Replace with your organization UUID

const TEMPLATE_ID = 'your-template-id-here';              // Replace with a valid template UUID
const DELIVERABLE_ID = 'your-deliverable-id-here';        // Replace with a valid deliverable UUID
const DELIVERABLE_ITEM_ID = 'your-deliverable-item-id-here'; // Replace with a valid deliverable item UUID

// Initialize client (no senderEmail needed for Deliverable)
Deliverable::configure(new DeliverableConfig(
    apiKey: API_KEY,
    orgId: ORG_ID,
    baseUrl: BASE_URL,
));

// =============================================
// TEST FUNCTIONS
// =============================================

/**
 * Test 1: List deliverables with pagination
 */
function testListDeliverables(): void
{
    echo "\n--- Test 1: listDeliverables ---\n";

    $result = Deliverable::listDeliverables([
        'limit' => 10,
        'offset' => 0,
        'showTags' => true,
    ]);

    echo "Total Records: " . $result['totalRecords'] . "\n";
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 2: Generate a deliverable from a template
 */
function testGenerateDeliverable(): string
{
    echo "\n--- Test 2: generateDeliverable ---\n";

    $result = Deliverable::generateDeliverable([
        'name' => 'SDK Manual Test Document',
        'templateId' => TEMPLATE_ID,
        'variables' => [
            ['placeholder' => '{CompanyName}', 'text' => 'TechCorp Inc.', 'mimeType' => 'text'],
            ['placeholder' => '{EmployeeName}', 'text' => 'John Smith', 'mimeType' => 'text'],
        ],
        'tags' => ['sdk-test', 'manual'],
    ]);

    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
    return $result['results']['deliverable']['id'];
}

/**
 * Test 3: Get full deliverable details
 */
function testGetDeliverableDetails(string $deliverableId): void
{
    echo "\n--- Test 3: getDeliverableDetails ---\n";

    $result = Deliverable::getDeliverableDetails($deliverableId, showTags: true);
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 4: Update deliverable name and tags
 */
function testUpdateDeliverableInfo(string $deliverableId): void
{
    echo "\n--- Test 4: updateDeliverableInfo ---\n";

    $result = Deliverable::updateDeliverableInfo($deliverableId, [
        'name' => 'SDK Manual Test Document (Updated)',
        'tags' => ['sdk-test', 'manual', 'updated'],
    ]);

    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 5: Soft-delete a deliverable
 */
function testDeleteDeliverable(string $deliverableId): void
{
    echo "\n--- Test 5: deleteDeliverable ---\n";

    $result = Deliverable::deleteDeliverable($deliverableId);
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 6: Download source file (DOCX/PPTX)
 */
function testDownloadSourceFile(string $deliverableId): void
{
    echo "\n--- Test 6: downloadSourceFile ---\n";

    $result = Deliverable::downloadSourceFile($deliverableId);
    echo "Result: File received, size: " . strlen($result) . " bytes\n";

    $outputPath = './downloaded-deliverable.docx';
    file_put_contents($outputPath, $result);
    echo "File saved to: $outputPath\n";
}

/**
 * Test 7: Download PDF version
 */
function testDownloadPDF(string $deliverableId): void
{
    echo "\n--- Test 7: downloadPDF ---\n";

    $result = Deliverable::downloadPDF($deliverableId);
    echo "Result: PDF received, size: " . strlen($result) . " bytes\n";

    $outputPath = './downloaded-deliverable.pdf';
    file_put_contents($outputPath, $result);
    echo "File saved to: $outputPath\n";
}

/**
 * Test 8: List deliverable items
 */
function testListDeliverableItems(): void
{
    echo "\n--- Test 8: listDeliverableItems ---\n";

    $result = Deliverable::listDeliverableItems([
        'limit' => 10,
        'showTags' => true,
        'column0' => 'createdOn',
        'order0' => 'desc',
    ]);

    echo "Total Records: " . $result['totalRecords'] . "\n";
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 9: Get a single deliverable item
 */
function testGetDeliverableItem(string $itemId): void
{
    echo "\n--- Test 9: getDeliverableItem ---\n";

    $result = Deliverable::getDeliverableItem($itemId, showTags: true);
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

// =============================================
// MAIN TEST RUNNER
// =============================================

function main(): void
{
    echo "==============================================\n";
    echo "Deliverable PHP SDK - Manual Test Suite\n";
    echo "==============================================\n";

    try {
        // Uncomment and run tests as needed:

        // Test 1: List Deliverables
        // testListDeliverables();

        // Test 2: Generate Deliverable (replace TEMPLATE_ID above)
        // $newId = testGenerateDeliverable();

        // Test 3: Get Deliverable Details (replace with actual deliverable ID)
        // testGetDeliverableDetails(DELIVERABLE_ID);

        // Test 4: Update Deliverable Info (replace with actual deliverable ID)
        // testUpdateDeliverableInfo(DELIVERABLE_ID);

        // Test 5: Delete Deliverable (run last — soft-deletes the deliverable)
        // testDeleteDeliverable(DELIVERABLE_ID);

        // Test 6: Download Source File (replace with actual deliverable ID)
        // testDownloadSourceFile(DELIVERABLE_ID);

        // Test 7: Download PDF (replace with actual deliverable ID)
        // testDownloadPDF(DELIVERABLE_ID);

        // Test 8: List Deliverable Items
        // testListDeliverableItems();

        // Test 9: Get Deliverable Item (replace with actual deliverable item ID)
        // testGetDeliverableItem(DELIVERABLE_ITEM_ID);

        echo "\n==============================================\n";
        echo "All tests completed successfully!\n";
        echo "==============================================\n";

    } catch (TurboDocxException $e) {
        echo "\n==============================================\n";
        echo "TEST FAILED\n";
        echo "==============================================\n";
        echo "Error: " . $e->getMessage() . "\n";
        if ($e->getStatusCode() !== null) {
            echo "Status Code: " . $e->getStatusCode() . "\n";
        }
        if ($e->getErrorCode() !== null) {
            echo "Error Code: " . $e->getErrorCode() . "\n";
        }
        exit(1);
    } catch (\Exception $e) {
        echo "\n==============================================\n";
        echo "TEST FAILED\n";
        echo "==============================================\n";
        echo "Error: " . $e->getMessage() . "\n";
        exit(1);
    }
}

// Run the tests
main();
