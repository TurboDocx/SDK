<?php

/**
 * Example 3: Advanced - Coordinate-based Positioning
 *
 * This example demonstrates:
 * - Coordinate-based field positioning
 * - Various field types (checkbox, readonly fields)
 * - Sequential signing workflow
 *
 * Use this when: You need precise control over field positions
 */

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use TurboDocx\TurboSign;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Types\Recipient;
use TurboDocx\Types\Field;
use TurboDocx\Types\SignatureFieldType;
use TurboDocx\Types\Requests\SendSignatureRequest;

function advancedExample(): void
{
    TurboSign::configure(new HttpClientConfig(
        apiKey: getenv('TURBODOCX_API_KEY') ?: 'your-api-key-here',
        orgId: getenv('TURBODOCX_ORG_ID') ?: 'your-org-id-here',
        senderEmail: getenv('TURBODOCX_SENDER_EMAIL') ?: 'support@yourcompany.com',
        senderName: getenv('TURBODOCX_SENDER_NAME') ?: 'Your Company Name'
    ));

    try {
        $pdfFile = file_get_contents(__DIR__ . '/../../ExampleAssets/advanced-contract.pdf');

        echo "Sending document with advanced field types...\n\n";

        $result = TurboSign::sendSignature(
            new SendSignatureRequest(
                recipients: [
                    new Recipient('John Doe', 'john@example.com', 1),
                    new Recipient('Jane Smith', 'jane@example.com', 2)
                ],
                fields: [
                    // First recipient - coordinate-based positioning
                    new Field(
                        type: SignatureFieldType::SIGNATURE,
                        recipientEmail: 'john@example.com',
                        page: 1,
                        x: 100,
                        y: 500,
                        width: 200,
                        height: 50
                    ),
                    new Field(
                        type: SignatureFieldType::DATE,
                        recipientEmail: 'john@example.com',
                        page: 1,
                        x: 100,
                        y: 560,
                        width: 150,
                        height: 30
                    ),
                    // Checkbox field (pre-checked)
                    new Field(
                        type: SignatureFieldType::CHECKBOX,
                        recipientEmail: 'john@example.com',
                        page: 1,
                        x: 100,
                        y: 600,
                        width: 20,
                        height: 20,
                        defaultValue: 'true',  // Pre-checked
                        isReadonly: false      // Allow user to uncheck
                    ),
                    // Readonly text field (pre-filled, non-editable)
                    new Field(
                        type: SignatureFieldType::TEXT,
                        recipientEmail: 'john@example.com',
                        page: 1,
                        x: 130,
                        y: 600,
                        width: 300,
                        height: 30,
                        defaultValue: 'I agree to the terms and conditions',
                        isReadonly: true,
                        backgroundColor: '#f0f0f0'
                    ),
                    // Second recipient - sequential signing
                    new Field(
                        type: SignatureFieldType::SIGNATURE,
                        recipientEmail: 'jane@example.com',
                        page: 1,
                        x: 100,
                        y: 700,
                        width: 200,
                        height: 50
                    ),
                    new Field(
                        type: SignatureFieldType::DATE,
                        recipientEmail: 'jane@example.com',
                        page: 1,
                        x: 100,
                        y: 760,
                        width: 150,
                        height: 30
                    ),
                    // Multiline text field
                    new Field(
                        type: SignatureFieldType::TEXT,
                        recipientEmail: 'jane@example.com',
                        page: 2,
                        x: 100,
                        y: 100,
                        width: 400,
                        height: 100,
                        isMultiline: true,
                        required: true
                    )
                ],
                file: $pdfFile,
                documentName: 'Advanced Contract',
                documentDescription: 'Contract with various field types and sequential signing'
            )
        );

        echo "✅ Document sent successfully!\n\n";
        echo "Document ID: {$result->documentId}\n";
        echo "Message: {$result->message}\n";

        // Poll for status until completed
        echo "\nPolling for completion...\n";
        $maxAttempts = 10;
        $attempt = 0;

        while ($attempt < $maxAttempts) {
            sleep(2); // Wait 2 seconds
            $status = TurboSign::getStatus($result->documentId);

            echo "Status: {$status->status->value}\n";

            if ($status->status->value === 'completed') {
                echo "\n✅ Document completed!\n";
                echo "Signed at: {$status->completedAt}\n";

                // Download the signed document
                $signedPdf = TurboSign::download($result->documentId);
                file_put_contents('signed-document.pdf', $signedPdf);
                echo "Downloaded signed document to: signed-document.pdf\n";

                break;
            }

            $attempt++;
        }

    } catch (Exception $error) {
        echo "Error: {$error->getMessage()}\n";
    }
}

// Run the example
advancedExample();
