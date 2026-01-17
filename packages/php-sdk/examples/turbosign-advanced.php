<?php

/**
 * Example 3: Review Link - Advanced Field Types
 *
 * This example demonstrates advanced field types and features:
 * - Multiple field types: signature, date, text, checkbox, company, title
 * - Readonly fields with default values
 * - Required fields
 * - Multiline text fields
 *
 * Use this when: You need complex forms with varied input types
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

function advancedFieldsExample(): void
{
    TurboSign::configure(new HttpClientConfig(
        apiKey: getenv('TURBODOCX_API_KEY') ?: 'your-api-key-here',
        orgId: getenv('TURBODOCX_ORG_ID') ?: 'your-org-id-here',
        senderEmail: getenv('TURBODOCX_SENDER_EMAIL') ?: 'support@yourcompany.com',
        senderName: getenv('TURBODOCX_SENDER_NAME') ?: 'Your Company Name'
    ));

    try {
        $pdfFile = file_get_contents(__DIR__ . '/../../ExampleAssets/advanced-contract.pdf');

        echo "Creating review link with advanced field types...\n\n";

        $result = TurboSign::createSignatureReviewLink(
            new CreateSignatureReviewLinkRequest(
                recipients: [
                    new Recipient('John Doe', 'john@example.com', 1),
                ],
                fields: [
                    // Signature field
                    new Field(
                        type: SignatureFieldType::SIGNATURE,
                        recipientEmail: 'john@example.com',
                        template: new TemplateConfig(
                            anchor: '{signature}',
                            placement: FieldPlacement::REPLACE,
                            size: ['width' => 100, 'height' => 30]
                        )
                    ),

                    // Date field
                    new Field(
                        type: SignatureFieldType::DATE,
                        recipientEmail: 'john@example.com',
                        template: new TemplateConfig(
                            anchor: '{date}',
                            placement: FieldPlacement::REPLACE,
                            size: ['width' => 75, 'height' => 30]
                        )
                    ),

                    // Full name field
                    new Field(
                        type: SignatureFieldType::FULL_NAME,
                        recipientEmail: 'john@example.com',
                        template: new TemplateConfig(
                            anchor: '{printed_name}',
                            placement: FieldPlacement::REPLACE,
                            size: ['width' => 100, 'height' => 20]
                        )
                    ),

                    // Readonly field with default value (pre-filled)
                    new Field(
                        type: SignatureFieldType::COMPANY,
                        recipientEmail: 'john@example.com',
                        defaultValue: 'TurboDocx',
                        isReadonly: true,
                        template: new TemplateConfig(
                            anchor: '{company}',
                            placement: FieldPlacement::REPLACE,
                            size: ['width' => 100, 'height' => 20]
                        )
                    ),

                    // Required checkbox with default checked
                    new Field(
                        type: SignatureFieldType::CHECKBOX,
                        recipientEmail: 'john@example.com',
                        defaultValue: 'true',
                        required: true,
                        template: new TemplateConfig(
                            anchor: '{terms_checkbox}',
                            placement: FieldPlacement::REPLACE,
                            size: ['width' => 20, 'height' => 20]
                        )
                    ),

                    // Title field
                    new Field(
                        type: SignatureFieldType::TITLE,
                        recipientEmail: 'john@example.com',
                        template: new TemplateConfig(
                            anchor: '{title}',
                            placement: FieldPlacement::REPLACE,
                            size: ['width' => 75, 'height' => 30]
                        )
                    ),

                    // Multiline text field
                    new Field(
                        type: SignatureFieldType::TEXT,
                        recipientEmail: 'john@example.com',
                        isMultiline: true,
                        template: new TemplateConfig(
                            anchor: '{notes}',
                            placement: FieldPlacement::REPLACE,
                            size: ['width' => 200, 'height' => 50]
                        )
                    ),
                ],
                file: $pdfFile,
                documentName: 'Advanced Contract',
                documentDescription: 'Contract with advanced signature field features'
            )
        );

        echo "✅ Review link created!\n\n";
        echo "Document ID: {$result->documentId}\n";
        echo "Status: {$result->status}\n";
        echo "Preview URL: {$result->previewUrl}\n";

        if ($result->recipients !== null) {
            echo "\nRecipients:\n";
            foreach ($result->recipients as $recipient) {
                echo "  {$recipient['name']} ({$recipient['email']}) - {$recipient['status']}\n";
            }
        }

        echo "\nNext steps:\n";
        echo "1. Review the document at the preview URL\n";
        echo "2. Send to recipients: TurboSign::send(documentId);\n";

    } catch (Exception $error) {
        echo "Error: {$error->getMessage()}\n";
    }
}

// Run the example
advancedFieldsExample();
