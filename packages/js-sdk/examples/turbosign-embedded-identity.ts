/**
 * Example: Embedded Signing with Identity Verification
 *
 * Embedded signing takes a signer from your own app straight to a TurboSign signing page,
 * without sending signing-link emails. When the signer is ready, your backend asks TurboSign for a
 * short-lived signing URL and opens it (a new tab, a redirect, or an iframe).
 *
 * Every embedded signer is verified in one of three ways:
 *   - otp          TurboSign sends a one-time passcode (email or SMS)
 *   - external_idv your own identity provider verified them; you assert it when requesting the URL
 *   - override     no verification (development/testing; recorded as not-verified on the certificate)
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

  // 1) Prepare the document with an EMBEDDED recipient. The signer's real email is always the
  //    signer of record. `externalId` is your own key for the signer (an Airtable row, a CRM id)
  //    so you can request the signing URL later without storing TurboDocx's recipient id.
  const sent = await TurboSign.sendSignature({
    file: pdfFile,
    documentName: 'Service Agreement',
    recipients: [
      {
        name: 'Jane Doe',
        email: 'jane@example.com',
        phone: '+15551234567', // required if the passcode is delivered by SMS
        signingOrder: 1,
        externalId: 'your_customer_123',
        // Pick ONE identity-verification mode:
        identityVerification: { mode: 'otp', channel: 'email' },
        // { mode: 'external_idv', provider: 'CAPA' }
        // { mode: 'override', overrideIdentityVerification: true, reason: 'Sandbox testing' }
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
  //    logged-in user is this recipient), request a signing URL. Request it at click time — never
  //    store it: the single-use URLs expire quickly by design.
  const link = await TurboSign.createSigningUrl(sent.documentId, {
    // Select the recipient by YOUR externalId (or pass recipientId instead — exactly one):
    externalId: 'your_customer_123',
    // For external_idv recipients, pass the assertion from your own identity provider:
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
  console.log(`  mode: ${link.identityVerificationMode}`);
  // For `otp`, pendingChecks lists the passcode step the signer clears on the page
  // (e.g. ['email_otp']); for external_idv/override it is [] and the URL is single-use.
  console.log(`  pendingChecks: ${JSON.stringify(link.pendingChecks)}`);
  console.log(`  expiresAt: ${link.expiresAt ?? '(no separate expiry; follows the document window)'}`);

  // 3) The signing page does the rest: for external_idv/override it redeems the single-use token
  //    and shows the document; for otp it asks for the passcode first. Watch the `completed`
  //    webhook to know when signing finishes, then download the signed PDF — its certificate of
  //    completion carries the identity-verification line for this signer.
  //
  // If you embed the page in an iframe, ask your org admin to add your app's origin to the
  // "Allowed embedding domains" list in the E-Signature settings (Identity & embedding tab).
}

embeddedIdentityExample().catch((err) => {
  console.error('Embedded identity example failed:', err);
  process.exit(1);
});
