<?php

/**
 * Example: Anchored Fields on a Template's Signature Setup
 *
 * An anchored field ties a signature field to a tag such as {ClientSign} in a Word template, for
 * one signer role. Wherever the tag appears in a document generated from the template, the field
 * goes there, sized to fit the tag.
 *
 * If the tag is already a signature field of the role, step 1 returns that saved field and the
 * example leaves it in place at the end. It only removes a field this run created.
 *
 * Before you run it:
 *   - A Word template containing the tag, with at least one signer role saved on its Signatures tab.
 *   - A deliverable generated from that template in which the tag still appears as text. Generate
 *     it after the tag is a signature field, or give the tag's variable its own tag as the value.
 *
 * Environment:
 *   TURBODOCX_API_KEY       an administrator or contributor API key
 *   TURBODOCX_ORG_ID        your organization id
 *   TURBODOCX_SENDER_EMAIL  the sender shown on the document
 *   TURBODOCX_BASE_URL      optional, defaults to https://api.turbodocx.com
 *   TEMPLATE_ID             the Word template
 *   DELIVERABLE_ID          a deliverable generated from that template
 *   ROLE_KEY                optional, the signer role that fills the tag (default "client")
 *   ANCHOR_TAG              optional, the tag (default "{ClientSign}")
 *   SIGNER_NAME, SIGNER_EMAIL  optional, who the review link is prepared for
 *
 * Run with: TEMPLATE_ID=... DELIVERABLE_ID=... php examples/turbosign-anchored-fields.php
 */

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use TurboDocx\TurboSign;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Exceptions\TurboDocxException;
use TurboDocx\Types\Field;
use TurboDocx\Types\Recipient;
use TurboDocx\Types\SignatureFieldType;
use TurboDocx\Types\TemplateConfig;
use TurboDocx\Types\Requests\AddTemplateSignatureAnchorRequest;
use TurboDocx\Types\Requests\CreateSignatureReviewLinkRequest;

function anchoredFieldsExample(): void
{
    TurboSign::configure(new HttpClientConfig(
        apiKey: getenv('TURBODOCX_API_KEY') ?: 'your-api-key-here',
        orgId: getenv('TURBODOCX_ORG_ID') ?: 'your-org-id-here',
        senderEmail: getenv('TURBODOCX_SENDER_EMAIL') ?: 'support@yourcompany.com',
        senderName: getenv('TURBODOCX_SENDER_NAME') ?: 'Your Company Name',
        baseUrl: getenv('TURBODOCX_BASE_URL') ?: 'https://api.turbodocx.com'
    ));

    $templateId = getenv('TEMPLATE_ID') ?: 'your-template-id-here';
    $deliverableId = getenv('DELIVERABLE_ID') ?: 'your-deliverable-id-here';
    $roleKey = getenv('ROLE_KEY') ?: 'client';
    $anchor = getenv('ANCHOR_TAG') ?: '{ClientSign}';
    $signerName = getenv('SIGNER_NAME') ?: 'Jane Doe';
    $signerEmail = getenv('SIGNER_EMAIL') ?: 'jane@example.com';

    try {
        // 1. Save a signature field on the tag for the role. Adding the same type on the same tag
        //    for the same role again returns the existing field (and would update any size,
        //    offset, placement, defaultValue or isReadonly sent, so this sends none).
        $added = TurboSign::addTemplateSignatureAnchor(new AddTemplateSignatureAnchorRequest(
            templateId: $templateId,
            roleKey: $roleKey,
            type: SignatureFieldType::SIGNATURE,
            anchor: $anchor
        ));
        if ($added->tagBecameSignatureField) {
            echo "1. Anchored field {$added->fieldId} added on {$anchor} for role \"{$roleKey}\"\n";
            echo "   The tag is now a signature field: the template's own values for it were cleared\n";
        } else {
            echo "1. {$anchor} is already a signature field of role \"{$roleKey}\" (field {$added->fieldId})\n";
        }

        // 2. Read the setup back: every anchored field, and how many each role has. An older
        //    backend sends neither, so anchors is then empty and anchoredFieldCount 0.
        $setup = TurboSign::getTemplateSignatureSetup($templateId);
        echo "2. Anchored fields on the template:\n";
        foreach ($setup->anchors as $a) {
            $missing = $a->notFound ? ', tag not in the template' : '';
            echo "   {$a->anchor} -> {$a->roleKey} ({$a->type}){$missing}\n";
        }
        foreach ($setup->roles as $role) {
            echo "   Role {$role->key}: {$role->anchoredFieldCount} anchored of {$role->fieldCount} field(s)\n";
        }

        // 3. Prepare the deliverable for signing with your own field on the tag. applySignatureSetup
        //    matches it to the saved anchored field (same tag and type), so it fits the tag and a tag
        //    missing from the document is skipped instead of failing. A review link sends no email;
        //    sendSignature takes the same request fields and emails the signer.
        $result = TurboSign::createSignatureReviewLink(new CreateSignatureReviewLinkRequest(
            recipients: [new Recipient(name: $signerName, email: $signerEmail, signingOrder: 1)],
            fields: [
                new Field(
                    type: SignatureFieldType::SIGNATURE,
                    recipientEmail: $signerEmail,
                    template: new TemplateConfig(anchor: $anchor)
                ),
            ],
            deliverableId: $deliverableId,
            documentName: 'Anchored Fields Example',
            applySignatureSetup: true
        ));
        echo "3. Review link ready for document {$result->documentId}\n";
        echo "   Preview: {$result->previewUrl}\n";

        // 4. Remove the anchored field, but only if this run created it: a field that was already
        //    saved on the tag is someone's real setup. Removing it does not bring back the values
        //    the template's variable had before the tag became a signature field.
        if ($added->tagBecameSignatureField) {
            $removed = TurboSign::removeTemplateSignatureAnchor($templateId, $added->fieldId);
            $left = count($removed->signatureSetup['fields'] ?? []);
            echo "4. Anchored field {$added->fieldId} removed, {$left} field(s) left in the setup\n";
        } else {
            echo "4. Anchored field {$added->fieldId} was already saved before this run, so it was left in place\n";
        }
    } catch (TurboDocxException $error) {
        // A role the template doesn't have is a NotFoundException (SignerRoleNotFound); a tag held
        // by another role, or already holding a different field, is a ConflictException.
        echo "Error: {$error->getMessage()}\n";
        exit(1);
    }
}

// Run the example
anchoredFieldsExample();
