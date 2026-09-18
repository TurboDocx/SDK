<?php

/**
 * Example: Embedded Signing (with optional Identity Verification)
 *
 * Embedded signing takes a signer from your own app straight to a TurboSign signing page,
 * without sending signing-link emails. At its core it is two steps: your backend asks TurboSign
 * for a signing URL for the recipient, then opens it (a new tab, a redirect, or an iframe). That
 * is all embedded signing needs. A plain embedded recipient signs with no extra verification step.
 *
 * Identity verification is an OPTIONAL layer on top. Add `identityVerification` to a recipient
 * ONLY when you want an extra check before they sign, in one of these modes:
 *   - otp          TurboSign runs a one-time-passcode challenge (email or SMS)
 *   - external_idv your own identity provider verified them; you assert it when requesting the URL
 *   - override     opt out of verification (development/testing; recorded as not-verified on the certificate)
 *
 * Without `identityVerification`, `createSigningUrl` still works: `identityVerificationMode` comes
 * back null and `pendingChecks` is empty, and the signing page opens straight to the document.
 *
 * Use this when: you embed signing in your own product and control the signer's session yourself.
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
use TurboDocx\Types\IdentityVerification;
use TurboDocx\Types\IdentityAssertion;
use TurboDocx\Types\Requests\SendSignatureRequest;
use TurboDocx\Types\Requests\CreateSigningUrlRequest;

function embeddedIdentityExample(): void
{
    TurboSign::configure(new HttpClientConfig(
        apiKey: getenv('TURBODOCX_API_KEY') ?: 'your-api-key-here',
        orgId: getenv('TURBODOCX_ORG_ID') ?: 'your-org-id-here',
        senderEmail: getenv('TURBODOCX_SENDER_EMAIL') ?: 'support@yourcompany.com',
        senderName: getenv('TURBODOCX_SENDER_NAME') ?: 'Your Company Name'
    ));

    try {
        $pdfFile = file_get_contents(__DIR__ . '/../../ExampleAssets/sample-contract.pdf');

        // 0) OPTIONAL: check what your org allows before you start. These org-wide GATES are set once by
        //    an admin (in E-Signature settings, on the Identity & embedding tab, or via the organization
        //    preferences API) and apply to every send. They are read-only from the SDK. The per-recipient
        //    MODE below is the part you choose on each signer, not here.
        $settings = TurboSign::getEmbeddedSigningSettings();
        if (!$settings->enabled) {
            throw new RuntimeException('Embedded signing is not enabled for this organization. An admin can turn it on in E-Signature settings.');
        }
        $allowExternalIdv = $settings->allowExternalIdv ? 'true' : 'false';
        $allowIdentityOverride = $settings->allowIdentityOverride ? 'true' : 'false';
        echo "Embedded signing enabled. external_idv allowed: {$allowExternalIdv}, override allowed: {$allowIdentityOverride}.\n\n";

        // 1) Prepare the document with an EMBEDDED recipient. This is the baseline: no
        //    `identityVerification`, so the signer opens their signing URL and signs directly, with no
        //    extra verification step. The signer's real email is always the signer of record.
        //    `externalId` is your own key for the signer (an Airtable row, a CRM id) so you can request
        //    the signing URL later without storing TurboDocx's recipient id.
        $sent = TurboSign::sendSignature(
            new SendSignatureRequest(
                recipients: [
                    new Recipient(
                        name: 'Jane Doe',
                        email: 'jane@example.com',
                        signingOrder: 1,
                        externalId: 'your_customer_123',

                        // OPTIONAL: add identity verification to require an extra check before signing.
                        // Leave this out entirely for a plain embedded recipient (the baseline above). To turn
                        // it on, uncomment exactly ONE of the modes below:
                        //
                        //   otp: TurboSign challenges the signer with a one-time passcode before the document
                        //   opens. Use channel 'sms' to text the passcode; then also set the recipient's `phone`.
                        // identityVerification: IdentityVerification::otp('email'),
                        //
                        //   external_idv: your own identity provider already verified the signer; you assert it
                        //   when you request the signing URL (see step 2).
                        // identityVerification: IdentityVerification::externalIdv('CAPA'),
                        //
                        //   override: opt out of verification for development/testing (recorded as not-verified).
                        // identityVerification: IdentityVerification::override('Sandbox testing'),
                    ),
                ],
                fields: [
                    new Field(
                        type: SignatureFieldType::SIGNATURE,
                        recipientEmail: 'jane@example.com',
                        template: new TemplateConfig(
                            anchor: '{signature1}',
                            placement: FieldPlacement::REPLACE,
                            size: ['width' => 100, 'height' => 30]
                        )
                    ),
                ],
                file: $pdfFile,
                documentName: 'Service Agreement'
            )
        );

        echo "Document {$sent->documentId} prepared.\n\n";

        // 2) When the signer is ready (they clicked "Sign now" in YOUR app, and you have confirmed the
        //    logged-in user is this recipient), request a signing URL. Mint it at click time and never
        //    store it (for the bypass modes below the URL is single-use and expires in minutes). This
        //    call works whether or not the recipient has identity verification configured.
        $link = TurboSign::createSigningUrl(
            $sent->documentId,
            new CreateSigningUrlRequest(
                // Select the recipient by YOUR externalId (or pass recipientId instead, exactly one):
                externalId: 'your_customer_123',
                // OPTIONAL: only for external_idv recipients, pass the assertion from your identity provider:
                // identityAssertion: new IdentityAssertion(
                //     provider: 'CAPA',
                //     verificationId: 'capa_verif_8f2a91',
                //     verifiedAt: date('c'),
                //     subjectEmail: 'jane@example.com',
                // ),
                returnUrl: 'https://app.yourcompany.com/signed' // where the signer returns after signing (https)
            )
        );

        // With no identityVerification, `identityVerificationMode` is null and `pendingChecks` is [].
        $mode = $link->identityVerificationMode ?? '(none)';
        // For `otp`, pendingChecks lists the passcode step the signer clears on the page
        // (e.g. ['email_otp']); with no verification, or for external_idv/override, it is [].
        $pendingChecks = json_encode($link->pendingChecks);
        $expiresAt = $link->expiresAt ?? '(no separate expiry; follows the document window)';

        echo "Open this URL for the signer (new tab, redirect, or iframe):\n";
        echo "  {$link->url}\n";
        echo "  mode: {$mode}\n";
        echo "  pendingChecks: {$pendingChecks}\n";
        echo "  expiresAt: {$expiresAt}\n";

        // 3) The signing page does the rest. What `url` is depends on the recipient's mode:
        //    - no verification or otp: the reusable signing link (a `?token=` URL). For otp the page asks
        //      for the passcode first; with no verification it opens the document straight away. The link
        //      follows the document's own signing window and survives a refresh.
        //    - external_idv or override: a single-use, short-lived link (a `?sut=` URL) that the page
        //      redeems once when opened. Mint a fresh one each time; do not reuse it.
        //    Watch the `completed` webhook to know when signing finishes, then download the signed PDF.
        //    If a signer was verified, the certificate of completion carries the identity-verification line.
        //
        // `link->url` is an embeddable signing URL (/e-signature/embed/...). If you frame it, the browser
        // enforces a per-tenant Content-Security-Policy: frame-ancestors on the page, so an origin that is
        // NOT on the org's allow-list is HARD-BLOCKED from embedding (not merely warned). Ask your org admin
        // to add your app's origin to the "Allowed embedding domains" list in the E-Signature settings
        // (Identity & embedding tab); you can read the current list from `settings->allowedFrameAncestors`
        // above. The non-embedded email-invite signing links (/e-signature/sign/...) deny all framing.

    } catch (Exception $error) {
        echo "Error: {$error->getMessage()}\n";
    }
}

// Run the example
embeddedIdentityExample();
