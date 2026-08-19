<?php

/**
 * Example: Conditional (IF/THEN) Fields
 *
 * A checkbox can control other fields so signers only see what applies to them:
 *   - Give a CHECKBOX field a stable metadata.fieldKey (new FieldMetadata(fieldKey: ...)).
 *   - Give a dependent field a metadata.conditional rule that references that key.
 *       operator: ConditionalOperator::IS_CHECKED | ::IS_NOT_CHECKED  -- when the rule fires.
 *       action:   ConditionalAction::SHOW   (hidden until the rule fires)
 *                 ConditionalAction::UNLOCK (visible but read-only until the rule fires).
 *
 * One checkbox can drive any number of dependent fields -- give them the same
 * controllingFieldKey. Uses createSignatureReviewLink (no emails are sent).
 */

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use TurboDocx\TurboSign;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Types\Recipient;
use TurboDocx\Types\Field;
use TurboDocx\Types\SignatureFieldType;
use TurboDocx\Types\FieldMetadata;
use TurboDocx\Types\FieldConditional;
use TurboDocx\Types\ConditionalOperator;
use TurboDocx\Types\ConditionalAction;
use TurboDocx\Types\Requests\CreateSignatureReviewLinkRequest;

function conditionalFieldsExample(): void
{
    TurboSign::configure(new HttpClientConfig(
        apiKey: getenv('TURBODOCX_API_KEY') ?: 'your-api-key-here',
        orgId: getenv('TURBODOCX_ORG_ID') ?: 'your-org-id-here',
        senderEmail: getenv('TURBODOCX_SENDER_EMAIL') ?: 'support@yourcompany.com',
        senderName: getenv('TURBODOCX_SENDER_NAME') ?: 'Your Company Name'
    ));

    try {
        $pdfFile = file_get_contents(__DIR__ . '/../../ExampleAssets/advanced-contract.pdf');

        echo "Creating a review link with conditional fields...\n\n";

        $result = TurboSign::createSignatureReviewLink(
            new CreateSignatureReviewLinkRequest(
                recipients: [
                    new Recipient('John Doe', 'john@example.com', 1),
                ],
                fields: [
                    // Controlling checkboxes -- each carries a stable fieldKey.
                    new Field(type: SignatureFieldType::CHECKBOX, recipientEmail: 'john@example.com', page: 1, x: 60, y: 120, width: 20, height: 20, metadata: new FieldMetadata(fieldKey: 'request_changes')),
                    new Field(type: SignatureFieldType::CHECKBOX, recipientEmail: 'john@example.com', page: 1, x: 60, y: 300, width: 20, height: 20, metadata: new FieldMetadata(fieldKey: 'override_amount')),
                    new Field(type: SignatureFieldType::CHECKBOX, recipientEmail: 'john@example.com', page: 1, x: 60, y: 480, width: 20, height: 20, metadata: new FieldMetadata(fieldKey: 'consent')),

                    // show + is_checked -- HIDDEN until "request_changes" is checked.
                    new Field(
                        type: SignatureFieldType::TEXT,
                        recipientEmail: 'john@example.com',
                        page: 1,
                        x: 120,
                        y: 120,
                        width: 260,
                        height: 40,
                        metadata: new FieldMetadata(conditional: new FieldConditional(controllingFieldKey: 'request_changes', operator: ConditionalOperator::IS_CHECKED, action: ConditionalAction::SHOW))
                    ),
                    // ONE checkbox driving a SECOND dependent (same controllingFieldKey) -- a signature.
                    new Field(
                        type: SignatureFieldType::SIGNATURE,
                        recipientEmail: 'john@example.com',
                        page: 1,
                        x: 120,
                        y: 180,
                        width: 200,
                        height: 50,
                        metadata: new FieldMetadata(conditional: new FieldConditional(controllingFieldKey: 'request_changes', operator: ConditionalOperator::IS_CHECKED, action: ConditionalAction::SHOW))
                    ),

                    // unlock + is_checked -- VISIBLE but locked until "override_amount" is checked.
                    new Field(
                        type: SignatureFieldType::TEXT,
                        recipientEmail: 'john@example.com',
                        page: 1,
                        x: 120,
                        y: 300,
                        width: 150,
                        height: 30,
                        defaultValue: '1000.00',
                        metadata: new FieldMetadata(conditional: new FieldConditional(controllingFieldKey: 'override_amount', operator: ConditionalOperator::IS_CHECKED, action: ConditionalAction::UNLOCK))
                    ),

                    // show + is_not_checked -- a "please explain" box shown only while consent is WITHHELD.
                    new Field(
                        type: SignatureFieldType::TEXT,
                        recipientEmail: 'john@example.com',
                        page: 1,
                        x: 120,
                        y: 480,
                        width: 260,
                        height: 40,
                        metadata: new FieldMetadata(conditional: new FieldConditional(controllingFieldKey: 'consent', operator: ConditionalOperator::IS_NOT_CHECKED, action: ConditionalAction::SHOW))
                    ),

                    // A normal required signature with no rule -- always visible, always required.
                    new Field(type: SignatureFieldType::SIGNATURE, recipientEmail: 'john@example.com', page: 1, x: 120, y: 620, width: 200, height: 50, required: true),
                ],
                file: $pdfFile,
                documentName: 'Conditional Fields Demo'
            )
        );

        echo "✅ Review link created!\n\n";
        echo "Document ID: {$result->documentId}\n";
        echo "Preview URL: {$result->previewUrl}\n";

        // Validation: a malformed rule (unknown operator/action, or a missing/empty
        //   controllingFieldKey) is rejected with HTTP 400 and code "InvalidConditionalRule"
        //   (thrown as a ValidationError).
        // Fail-open: a well-formed rule whose controllingFieldKey matches NO checkbox is NOT an
        //   error -- the dependent field stays visible/editable. Double-check your keys match.
    } catch (\Throwable $error) {
        echo "Error: {$error->getMessage()}\n";
    }
}

conditionalFieldsExample();
