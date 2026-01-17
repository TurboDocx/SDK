<?php

/**
 * Example 2: Review Link - Template Anchors
 *
 * This example creates a review link first, then sends manually.
 * Uses template anchors like {signature1} and {date1} in your PDF.
 *
 * Use this when: You want to review the document before sending
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
use TurboDocx\Types\Requests\CreateSignatureReviewLinkRequest;

function reviewLinkExample(): void
{
    TurboSign::configure(new HttpClientConfig(
        apiKey: getenv('TURBODOCX_API_KEY') ?: 'your-api-key-here',
        orgId: getenv('TURBODOCX_ORG_ID') ?: 'your-org-id-here',
        senderEmail: getenv('TURBODOCX_SENDER_EMAIL') ?: 'support@yourcompany.com',
        senderName: getenv('TURBODOCX_SENDER_NAME') ?: 'Your Company Name'
    ));

    try {
        $pdfFile = file_get_contents(__DIR__ . '/../../ExampleAssets/sample-contract.pdf');

        echo "Creating review link with template anchors...\n\n";

        $result = TurboSign::createSignatureReviewLink(
            new CreateSignatureReviewLinkRequest(
                recipients: [
                    new Recipient('John Doe', 'john@example.com', 1),
                    new Recipient('Jane Smith', 'jane@example.com', 2),
                ],
                fields: [
                    // First recipient - using template anchors
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
                            anchor: '{signature1}',
                            placement: FieldPlacement::REPLACE,
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
                    // Second recipient
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
                documentName: 'Contract Agreement',
                documentDescription: 'This document requires electronic signatures from both parties.'
            )
        );

        echo "✅ Review link created!\n";
        echo "Document ID: {$result->documentId}\n";
        echo "Status: {$result->status}\n";
        echo "Preview URL: {$result->previewUrl}\n";

        if ($result->recipients !== null) {
            echo "\nRecipients:\n";
            foreach ($result->recipients as $recipient) {
                echo "  {$recipient['name']} ({$recipient['email']}) - {$recipient['status']}\n";
            }
        }

        echo "\nYou can now:\n";
        echo "1. Review the document at the preview URL\n";
        echo "2. Send to recipients using: TurboSign::send(documentId);\n";

    } catch (Exception $error) {
        echo "Error: {$error->getMessage()}\n";
    }
}

// Run the example
reviewLinkExample();
