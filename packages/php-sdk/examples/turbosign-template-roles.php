<?php

/**
 * Example: Send a Template Set Up in TurboDocx (Signer Roles)
 *
 * Set the template up once in TurboDocx:
 *   1. Upload a PDF as a template.
 *   2. On its Signatures tab, add each signer as a role (e.g. "Client", "Countersigner").
 *      Tick "Fill in name and email when sending" for a role that changes every time;
 *      give a role a name and email when it's always the same person (e.g. your countersigner).
 *   3. Drag each role's fields onto the PDF and save the signature setup.
 *
 * Then send it from code by naming each recipient's role. The fields saved for that role come
 * with it, so you never pass coordinates or anchors.
 *
 * Use this when: the same document goes out again and again with different signers.
 *
 * Run with: TEMPLATE_ID=<your template id> php examples/turbosign-template-roles.php
 */

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use TurboDocx\TurboSign;
use TurboDocx\Config\HttpClientConfig;
use TurboDocx\Types\Recipient;
use TurboDocx\Types\Requests\SendSignatureRequest;

function sendTemplateWithRolesExample(): void
{
    TurboSign::configure(new HttpClientConfig(
        apiKey: getenv('TURBODOCX_API_KEY') ?: 'your-api-key-here',
        orgId: getenv('TURBODOCX_ORG_ID') ?: 'your-org-id-here',
        senderEmail: getenv('TURBODOCX_SENDER_EMAIL') ?: 'support@yourcompany.com',
        senderName: getenv('TURBODOCX_SENDER_NAME') ?: 'Your Company Name'
    ));

    $templateId = getenv('TEMPLATE_ID') ?: 'your-template-id-here';

    try {
        // 1. See the template's roles. The keys are also shown under "Use via API" on the
        //    template's page in TurboDocx.
        $setup = TurboSign::getTemplateSignatureSetup($templateId);

        echo "Template roles (in signing order):\n";
        foreach ($setup->roles as $role) {
            $signer = $role->hasSavedSigner
                ? "saved signer {$role->defaultName} <{$role->defaultEmail}>"
                : 'filled in when sending';
            echo "  {$role->order}. {$role->key} ({$role->label}): {$signer}, {$role->fieldCount} field(s)\n";
        }

        // 2. Pass a recipient for every role filled in when sending. A role with a saved signer can
        //    be left out (its saved signer is used), or passed to send to someone else this time.
        $result = TurboSign::sendSignature(
            new SendSignatureRequest(
                recipients: [
                    new Recipient(name: 'Jane Doe', email: 'jane@client.com', role: 'client'),
                    // 'countersigner' left out: the signer saved on the template is used
                ],
                // No fields: the template's saved fields come with each role. Any fields you add
                // here are placed in addition to them (e.g. an extra witness signature).
                templateId: $templateId
            )
        );

        echo "\n✅ Document sent!\n";
        echo "Document ID: {$result->documentId}\n";

        // 3. Track it like any other document.
        $progress = TurboSign::getRecipients($result->documentId);
        echo "\n{$progress->summary->completed} of {$progress->summary->total} signed, ";
        echo "still waiting on {$progress->summary->waitingOn}\n";
        foreach ($progress->recipients as $recipient) {
            echo "  {$recipient->name} <{$recipient->email}>: {$recipient->effectiveStatus}\n";
        }
    } catch (Exception $error) {
        // A role the template doesn't have, or a role with no saved signer that you left out,
        // comes back as a ValidationException whose message names the role and lists the valid ones.
        echo "Error: {$error->getMessage()}\n";
    }
}

// Run the example
sendTemplateWithRolesExample();
