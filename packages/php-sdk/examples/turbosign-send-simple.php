<?php

/**
 * Example 1: Send Signature Directly - Template Anchors
 *
 * This example sends a document directly to recipients for signature.
 * Uses template anchors like {signature1} and {date1} in your PDF.
 *
 * Use this when: You want to send immediately without review
 */

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use TurboDocx\TurboSign;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Types\Recipient;
use TurboDocx\Types\Field;
use TurboDocx\Types\SignatureFieldType;
use TurboDocx\Types\TemplateConfig;
use TurboDocx\Types\FieldPlacement;
use TurboDocx\Types\Requests\SendSignatureRequest;

function sendDirectlyExample(): void
{
    TurboSign::configure(new HttpClientConfig(
        apiKey: getenv('TURBODOCX_API_KEY') ?: 'your-api-key-here',
        orgId: getenv('TURBODOCX_ORG_ID') ?: 'your-org-id-here',
        senderEmail: getenv('TURBODOCX_SENDER_EMAIL') ?: 'support@yourcompany.com',
        senderName: getenv('TURBODOCX_SENDER_NAME') ?: 'Your Company Name'
    ));

    try {
        $pdfFile = file_get_contents(__DIR__ . '/../../ExampleAssets/sample-contract.pdf');

        echo "Sending document directly to recipients...\n\n";

        $result = TurboSign::sendSignature(
            new SendSignatureRequest(
                recipients: [
                    new Recipient('John Doe', 'john@example.com', 1),
                    new Recipient('Jane Smith', 'jane@example.com', 2),
                ],
                fields: [
                    // First recipient's fields - using template anchors
                    new Field(
                        type: SignatureFieldType::FULL_NAME,
                        recipientEmail: 'john@example.com',
                        template: new TemplateConfig(
                            anchor: '{name1}',
                            placement: FieldPlacement::REPLACE,
                            size: ['width' => 100, 'height' => 30]
                        )
                    ),
                    new Field(
                        type: SignatureFieldType::SIGNATURE,
                        recipientEmail: 'john@example.com',
                        template: new TemplateConfig(
                            anchor: '{signature1}',       // Text in your PDF to replace
                            placement: FieldPlacement::REPLACE,          // Replace the anchor text
                            size: ['width' => 100, 'height' => 30]
                        )
                    ),
                    new Field(
                        type: SignatureFieldType::DATE,
                        recipientEmail: 'john@example.com',
                        template: new TemplateConfig(
                            anchor: '{date1}',
                            placement: FieldPlacement::REPLACE,
                            size: ['width' => 75, 'height' => 30]
                        )
                    ),
                    // Second recipient's fields
                    new Field(
                        type: SignatureFieldType::FULL_NAME,
                        recipientEmail: 'jane@example.com',
                        template: new TemplateConfig(
                            anchor: '{name2}',
                            placement: FieldPlacement::REPLACE,
                            size: ['width' => 100, 'height' => 30]
                        )
                    ),
                    new Field(
                        type: SignatureFieldType::SIGNATURE,
                        recipientEmail: 'jane@example.com',
                        template: new TemplateConfig(
                            anchor: '{signature2}',
                            placement: FieldPlacement::REPLACE,
                            size: ['width' => 100, 'height' => 30]
                        )
                    ),
                    new Field(
                        type: SignatureFieldType::DATE,
                        recipientEmail: 'jane@example.com',
                        template: new TemplateConfig(
                            anchor: '{date2}',
                            placement: FieldPlacement::REPLACE,
                            size: ['width' => 75, 'height' => 30]
                        )
                    ),
                ],
                file: $pdfFile,
                documentName: 'Partnership Agreement',
                documentDescription: 'Q1 2025 Partnership Agreement - Please review and sign'
            )
        );

        echo "✅ Document sent successfully!\n\n";
        echo "Document ID: {$result->documentId}\n";
        echo "Message: {$result->message}\n";

        // To get sign URLs and recipient details, use getStatus
        try {
            $status = TurboSign::getStatus($result->documentId);
            if (!empty($status->recipients)) {
                echo "\nSign URLs:\n";
                foreach ($status->recipients as $recipient) {
                    echo "  {$recipient->name}: {$recipient->signUrl}\n";
                }
            }
        } catch (Exception $statusError) {
            echo "\nNote: Could not fetch recipient sign URLs\n";
        }

    } catch (Exception $error) {
        echo "Error: {$error->getMessage()}\n";
    }
}

// Run the example
sendDirectlyExample();
