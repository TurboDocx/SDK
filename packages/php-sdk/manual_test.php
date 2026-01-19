<?php

/**
 * TurboSign PHP SDK - Manual Test Suite
 *
 * Run: php manual_test.php
 *
 * Make sure to configure the values below before running.
 */

declare(strict_types=1);

require __DIR__ . '/vendor/autoload.php';

use TurboDocx\TurboSign;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Types\Recipient;
use TurboDocx\Types\Field;
use TurboDocx\Types\SignatureFieldType;
use TurboDocx\Types\TemplateConfig;
use TurboDocx\Types\FieldPlacement;
use TurboDocx\Types\Requests\CreateSignatureReviewLinkRequest;
use TurboDocx\Types\Requests\SendSignatureRequest;
use TurboDocx\Exceptions\TurboDocxException;

// =============================================
// CONFIGURE THESE VALUES BEFORE RUNNING
// =============================================
const API_KEY = 'TDX-your-api-key-here';           // Replace with your actual TurboDocx API key
const BASE_URL = 'https://api.turbodocx.com';      // Replace with your API URL
const ORG_ID = 'your-organization-uuid-here';      // Replace with your organization UUID

const TEST_PDF_PATH = '/path/to/your/test-document.pdf';  // Replace with path to your test PDF/DOCX
const TEST_EMAIL = 'recipient@example.com';               // Replace with a real email to receive notifications
const FILE_URL = 'https://example.com/sample-document.pdf'; // Replace with publicly accessible PDF URL

// Initialize client
TurboSign::configure(new HttpClientConfig(
    apiKey: API_KEY,
    orgId: ORG_ID,
    baseUrl: BASE_URL,
    senderEmail: 'sender@example.com',     // Reply-to email for signature requests
    senderName: 'Your Company Name'        // Sender name shown in emails
));

// =============================================
// TEST FUNCTIONS
// =============================================

/**
 * Test 1: Prepare document for review (no emails sent) - using fileLink
 */
function testCreateSignatureReviewLink(): string
{
    echo "\n--- Test 1: createSignatureReviewLink (using fileLink) ---\n";

    $result = TurboSign::createSignatureReviewLink(
        new CreateSignatureReviewLinkRequest(
            recipients: [
                new Recipient('Signer One', TEST_EMAIL, 1),
            ],
            fields: [
                new Field(
                    type: SignatureFieldType::SIGNATURE,
                    recipientEmail: TEST_EMAIL,
                    page: 1,
                    x: 100,
                    y: 550,
                    width: 200,
                    height: 50
                ),
                new Field(
                    type: SignatureFieldType::CHECKBOX,
                    recipientEmail: TEST_EMAIL,
                    page: 1,
                    x: 320,
                    y: 550,
                    width: 50,
                    height: 50,
                    defaultValue: 'true'
                ),
            ],
            fileLink: FILE_URL,
            documentName: 'Review Test Document (fileLink)'
        )
    );

    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
    return $result->documentId;
}

/**
 * Test 2: Prepare document for signing and send emails
 */
function testSendSignature(): string
{
    echo "\n--- Test 2: sendSignature (using file buffer with template fields) ---\n";

    $pdfBytes = file_get_contents(TEST_PDF_PATH);
    if ($pdfBytes === false) {
        throw new \RuntimeException('Failed to read test PDF file');
    }

    $result = TurboSign::sendSignature(
        new SendSignatureRequest(
            recipients: [
                new Recipient('Test User', TEST_EMAIL, 1),
            ],
            fields: [
                // Template-based field using anchor text
                new Field(
                    type: SignatureFieldType::TEXT,
                    recipientEmail: TEST_EMAIL,
                    template: new TemplateConfig(
                        anchor: '{placeholder}',
                        placement: FieldPlacement::REPLACE,
                        size: ['width' => 200, 'height' => 80],
                        offset: ['x' => 0, 'y' => 0],
                        caseSensitive: true,
                        useRegex: false
                    ),
                    defaultValue: 'Sample Text',
                    isMultiline: true,
                    required: true
                ),
                // Coordinate-based field (traditional approach)
                new Field(
                    type: SignatureFieldType::LAST_NAME,
                    recipientEmail: TEST_EMAIL,
                    page: 1,
                    x: 100,
                    y: 650,
                    width: 200,
                    height: 50,
                    defaultValue: 'Doe'
                ),
            ],
            file: $pdfBytes,
            documentName: 'Signing Test Document (Template Fields)',
            documentDescription: 'Testing template-based field positioning',
            ccEmails: ['cc@example.com']
        )
    );

    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
    return $result->documentId;
}

/**
 * Test 3: Get document status
 */
function testGetStatus(string $documentId): void
{
    echo "\n--- Test 3: getStatus ---\n";

    $result = TurboSign::getStatus($documentId);
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 4: Download signed document
 */
function testDownload(string $documentId): void
{
    echo "\n--- Test 4: download ---\n";

    $result = TurboSign::download($documentId);
    echo "Result: PDF received, size: " . strlen($result) . " bytes\n";

    // Save to file
    $outputPath = './downloaded-document.pdf';
    file_put_contents($outputPath, $result);
    echo "File saved to: $outputPath\n";
}

/**
 * Test 5: Resend signature emails
 * @param array<string> $recipientIds
 */
function testResend(string $documentId, array $recipientIds): void
{
    echo "\n--- Test 5: resend ---\n";

    $result = TurboSign::resend($documentId, $recipientIds);
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 6: Void document
 */
function testVoid(string $documentId): void
{
    echo "\n--- Test 6: void ---\n";

    $result = TurboSign::void($documentId, 'Testing void functionality');
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

/**
 * Test 7: Get audit trail
 */
function testGetAuditTrail(string $documentId): void
{
    echo "\n--- Test 7: getAuditTrail ---\n";

    $result = TurboSign::getAuditTrail($documentId);
    echo "Result: " . json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
}

// =============================================
// MAIN TEST RUNNER
// =============================================

function main(): void
{
    echo "==============================================\n";
    echo "TurboSign PHP SDK - Manual Test Suite\n";
    echo "==============================================\n";

    // Check if test PDF exists
    if (!file_exists(TEST_PDF_PATH)) {
        echo "\nError: Test PDF not found at " . TEST_PDF_PATH . "\n";
        echo "Please add a test PDF file and update TEST_PDF_PATH.\n";
        exit(1);
    }

    try {
        // Uncomment and run tests as needed:

        // Test 1: Prepare for Review (uses fileLink, doesn't need PDF file)
        // $reviewDocId = testCreateSignatureReviewLink();

        // Test 2: Prepare for Signing (creates a new document)
        // $signDocId = testSendSignature();

        // Test 3: Get Status (replace with actual document ID)
        // testGetStatus('document-uuid-here');

        // Test 4: Download (replace with actual document ID)
        // testDownload('document-uuid-here');

        // Test 5: Resend (replace with actual document ID and recipient ID)
        // testResend('document-uuid-here', ['recipient-uuid-here']);

        // Test 6: Void (do this last as it cancels the document)
        // testVoid('document-uuid-here');

        // Test 7: Get Audit Trail (replace with actual document ID)
        // testGetAuditTrail('document-uuid-here');

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
