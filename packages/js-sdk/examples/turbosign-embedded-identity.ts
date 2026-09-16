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

import { TurboSign } from '@turbodocx/sdk';
import * as fs from 'fs';

async function embeddedIdentityExample() {
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here',
    orgId: process.env.TURBODOCX_ORG_ID || 'your-org-id-here',
    senderEmail: process.env.TURBODOCX_SENDER_EMAIL || 'support@yourcompany.com',
    senderName: process.env.TURBODOCX_SENDER_NAME || 'Your Company Name',
  });

  const pdfFile = fs.readFileSync('../../ExampleAssets/sample-contract.pdf');

  // 0) OPTIONAL: check what your org allows before you start. These org-wide GATES are set once by
  //    an admin (in E-Signature settings, on the Identity & embedding tab, or via the organization
  //    preferences API) and apply to every send. They are read-only from the SDK. The per-recipient
  //    MODE below is the part you choose on each signer, not here.
  const settings = await TurboSign.getEmbeddedSigningSettings();
  if (!settings.enabled) {
    throw new Error('Embedded signing is not enabled for this organization. An admin can turn it on in E-Signature settings.');
  }
  console.log(
    `Embedded signing enabled. external_idv allowed: ${settings.allowExternalIdv}, override allowed: ${settings.allowIdentityOverride}.\n`,
  );

  // 1) Prepare the document with an EMBEDDED recipient. This is the baseline: no
  //    `identityVerification`, so the signer opens their signing URL and signs directly, with no
  //    extra verification step. The signer's real email is always the signer of record.
  //    `externalId` is your own key for the signer (an Airtable row, a CRM id) so you can request
  //    the signing URL later without storing TurboDocx's recipient id.
  const sent = await TurboSign.sendSignature({
    file: pdfFile,
    documentName: 'Service Agreement',
    recipients: [
      {
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
        // identityVerification: { mode: 'otp', channel: 'email' },
        //
        //   external_idv: your own identity provider already verified the signer; you assert it
        //   when you request the signing URL (see step 2).
        // identityVerification: { mode: 'external_idv', provider: 'CAPA' },
        //
        //   override: opt out of verification for development/testing (recorded as not-verified).
        // identityVerification: { mode: 'override', overrideIdentityVerification: true, reason: 'Sandbox testing' },
      },
    ],
    fields: [
      {
        type: 'signature',
        recipientEmail: 'jane@example.com',
        template: { anchor: '{signature1}', placement: 'replace', size: { width: 100, height: 30 } },
      },
    ],
  });

  console.log(`Document ${sent.documentId} prepared.\n`);

  // 2) When the signer is ready (they clicked "Sign now" in YOUR app, and you have confirmed the
  //    logged-in user is this recipient), request a signing URL. Mint it at click time and never
  //    store it (for the bypass modes below the URL is single-use and expires in minutes). This
  //    call works whether or not the recipient has identity verification configured.
  const link = await TurboSign.createSigningUrl(sent.documentId, {
    // Select the recipient by YOUR externalId (or pass recipientId instead, exactly one):
    externalId: 'your_customer_123',
    // OPTIONAL: only for external_idv recipients, pass the assertion from your identity provider:
    // identityAssertion: {
    //   provider: 'CAPA',
    //   verificationId: 'capa_verif_8f2a91',
    //   verifiedAt: new Date().toISOString(),
    //   subjectEmail: 'jane@example.com',
    // },
    returnUrl: 'https://app.yourcompany.com/signed', // where the signer returns after signing (https)
  });

  console.log('Open this URL for the signer (new tab, redirect, or iframe):');
  console.log(`  ${link.url}`);
  // With no identityVerification, `identityVerificationMode` is null and `pendingChecks` is [].
  console.log(`  mode: ${link.identityVerificationMode ?? '(none)'}`);
  // For `otp`, pendingChecks lists the passcode step the signer clears on the page
  // (e.g. ['email_otp']); with no verification, or for external_idv/override, it is [].
  console.log(`  pendingChecks: ${JSON.stringify(link.pendingChecks)}`);
  console.log(`  expiresAt: ${link.expiresAt ?? '(no separate expiry; follows the document window)'}`);

  // 3) The signing page does the rest. What `url` is depends on the recipient's mode:
  //    - no verification or otp: the reusable signing link (a `?token=` URL). For otp the page asks
  //      for the passcode first; with no verification it opens the document straight away. The link
  //      follows the document's own signing window and survives a refresh.
  //    - external_idv or override: a single-use, short-lived link (a `?sut=` URL) that the page
  //      redeems once when opened. Mint a fresh one each time; do not reuse it.
  //    Watch the `completed` webhook to know when signing finishes, then download the signed PDF.
  //    If a signer was verified, the certificate of completion carries the identity-verification line.
  //
  // If you embed the page in an iframe, ask your org admin to add your app's origin to the
  // "Allowed embedding domains" list in the E-Signature settings (Identity & embedding tab). You
  // can read the current list from `settings.allowedFrameAncestors` above.
}

embeddedIdentityExample().catch((err) => {
  console.error('Embedded identity example failed:', err);
  process.exit(1);
});
