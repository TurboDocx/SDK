/**
 * Example: Conditional (IF/THEN) Fields
 *
 * A checkbox can control other fields so signers only see what applies to them:
 *   - Give a `checkbox` field a stable `metadata.fieldKey`.
 *   - Give a dependent field a `metadata.conditional` rule that references that key.
 *     - operator: "is_checked" | "is_not_checked"  — when the rule fires.
 *     - action:   "show"   (hidden until the rule fires)
 *                 "unlock" (visible but read-only until the rule fires).
 *
 * One checkbox can drive any number of dependent fields — give them the same
 * `controllingFieldKey`. This example uses `createSignatureReviewLink` (no emails are
 * sent) so you can run it and inspect the preview.
 *
 * Use this when: a form has follow-up questions that only matter in some cases
 * ("If you request changes, explain what to change").
 */

import { TurboSign, ValidationError } from '@turbodocx/sdk';
import * as fs from 'fs';

async function conditionalFieldsExample() {
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here',
    orgId: process.env.TURBODOCX_ORG_ID || 'your-org-id-here',
    senderEmail: process.env.TURBODOCX_SENDER_EMAIL || 'support@yourcompany.com',
    senderName: process.env.TURBODOCX_SENDER_NAME || 'Your Company Name'
  });

  try {
    const pdfFile = fs.readFileSync('../../ExampleAssets/advanced-contract.pdf');

    console.log('Creating a review link with conditional fields...\n');

    const result = await TurboSign.createSignatureReviewLink({
      file: pdfFile,
      documentName: 'Conditional Fields Demo',
      recipients: [{ name: 'John Doe', email: 'john@example.com', signingOrder: 1 }],
      fields: [
        // ── Controlling checkboxes — each carries a stable fieldKey ──────────────
        { type: 'checkbox', recipientEmail: 'john@example.com', page: 1, x: 60, y: 120, width: 20, height: 20, metadata: { fieldKey: 'request_changes' } },
        { type: 'checkbox', recipientEmail: 'john@example.com', page: 1, x: 60, y: 300, width: 20, height: 20, metadata: { fieldKey: 'override_amount' } },
        { type: 'checkbox', recipientEmail: 'john@example.com', page: 1, x: 60, y: 480, width: 20, height: 20, metadata: { fieldKey: 'consent' } },

        // show + is_checked — HIDDEN until "request_changes" is checked.
        {
          type: 'text', recipientEmail: 'john@example.com', page: 1, x: 120, y: 120, width: 260, height: 40, defaultValue: '',
          metadata: { conditional: { controllingFieldKey: 'request_changes', operator: 'is_checked', action: 'show' } }
        },
        // ONE checkbox driving a SECOND dependent (same controllingFieldKey) — a signature.
        {
          type: 'signature', recipientEmail: 'john@example.com', page: 1, x: 120, y: 180, width: 200, height: 50,
          metadata: { conditional: { controllingFieldKey: 'request_changes', operator: 'is_checked', action: 'show' } }
        },

        // unlock + is_checked — VISIBLE but locked (read-only) until "override_amount" is checked.
        {
          type: 'text', recipientEmail: 'john@example.com', page: 1, x: 120, y: 300, width: 150, height: 30, defaultValue: '1000.00',
          metadata: { conditional: { controllingFieldKey: 'override_amount', operator: 'is_checked', action: 'unlock' } }
        },

        // show + is_not_checked — a "please explain" box shown only while consent is WITHHELD.
        {
          type: 'text', recipientEmail: 'john@example.com', page: 1, x: 120, y: 480, width: 260, height: 40, defaultValue: '',
          metadata: { conditional: { controllingFieldKey: 'consent', operator: 'is_not_checked', action: 'show' } }
        },

        // A normal required signature with no rule — always visible, always required.
        { type: 'signature', recipientEmail: 'john@example.com', page: 1, x: 120, y: 620, width: 200, height: 50, required: true }
      ]
    });

    console.log('✅ Review link created!\n');
    console.log('Document ID:', result.documentId);
    console.log('Preview URL:', result.previewUrl);

    // ── Good to know ─────────────────────────────────────────────────────────────
    // Validation: a malformed rule (unknown operator/action, or a missing/empty
    //   controllingFieldKey) is rejected with HTTP 400 and code "InvalidConditionalRule".
    //   You can catch it as a ValidationError — see conditionalValidationExample() below.
    // Fail-open: a well-formed rule whose controllingFieldKey matches NO checkbox is NOT an
    //   error — the dependent field simply stays visible/editable (so a typo can't strand a
    //   field as permanently hidden). Double-check your keys match exactly.
  } catch (error) {
    console.error('Error:', error);
  }
}

/**
 * Optional: shows how a malformed rule surfaces. The API rejects it BEFORE creating anything.
 */
async function conditionalValidationExample() {
  try {
    await TurboSign.createSignatureReviewLink({
      file: fs.readFileSync('../../ExampleAssets/advanced-contract.pdf'),
      recipients: [{ name: 'John Doe', email: 'john@example.com', signingOrder: 1 }],
      fields: [
        { type: 'checkbox', recipientEmail: 'john@example.com', page: 1, x: 60, y: 120, width: 20, height: 20, metadata: { fieldKey: 'agree' } },
        {
          type: 'text', recipientEmail: 'john@example.com', page: 1, x: 120, y: 120, width: 260, height: 40,
          // "is_ticked" is not a valid operator — the API will reject this.
          metadata: { conditional: { controllingFieldKey: 'agree', operator: 'is_ticked' as never, action: 'show' } }
        }
      ]
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      console.log(`Rejected as expected: ${error.code} — ${error.message}`);
    } else {
      throw error;
    }
  }
}

// Run the example
conditionalFieldsExample();
// conditionalValidationExample();
