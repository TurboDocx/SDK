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

import { TurboSign } from '@turbodocx/sdk';
import * as fs from 'fs';

async function advancedFieldsExample() {
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here',
    orgId: process.env.TURBODOCX_ORG_ID || 'your-org-id-here',
    senderEmail: process.env.TURBODOCX_SENDER_EMAIL || 'support@yourcompany.com',
    senderName: process.env.TURBODOCX_SENDER_NAME || 'Your Company Name'
  });

  try {
    const pdfFile = fs.readFileSync('../../ExampleAssets/advanced-contract.pdf');

    console.log('Creating review link with advanced field types...\n');

    const result = await TurboSign.createSignatureReviewLink({
      file: pdfFile,
      documentName: 'Advanced Contract',
      documentDescription: 'Contract with advanced signature field features',
      recipients: [
        {
          name: 'Nicolas',
          email: 'nicolas@turbodocx.com',
          signingOrder: 1
        }
      ],
      fields: [
        // Signature field
        {
          type: 'signature',
          recipientEmail: 'nicolas@turbodocx.com',
          template: {
            anchor: '{signature}',
            placement: 'replace',
            size: { width: 200, height: 50 }
          }
        },

        // Date field
        {
          type: 'date',
          recipientEmail: 'john@example.com',
          template: {
            anchor: '{date}',
            placement: 'replace',
            size: { width: 150, height: 30 }
          }
        },

        // Text input field
        {
          type: 'text',
          recipientEmail: 'john@example.com',
          template: {
            anchor: '{printed_name}',
            placement: 'replace',
            size: { width: 200, height: 30 }
          }
        },

        // Readonly field with default value (pre-filled)
        {
          type: 'company',
          recipientEmail: 'john@example.com',
          defaultValue: 'Acme Corporation',
          isReadonly: true,
          template: {
            anchor: '{company}',
            placement: 'replace',
            size: { width: 200, height: 30 }
          }
        },

        // Required checkbox with default checked
        {
          type: 'checkbox',
          recipientEmail: 'john@example.com',
          defaultValue: 'true',
          required: true,
          template: {
            anchor: '{terms_checkbox}',
            placement: 'replace',
            size: { width: 20, height: 20 }
          }
        },

        // Title field
        {
          type: 'title',
          recipientEmail: 'john@example.com',
          template: {
            anchor: '{title}',
            placement: 'replace',
            size: { width: 150, height: 30 }
          }
        },

        // Multiline text field
        {
          type: 'text',
          recipientEmail: 'john@example.com',
          isMultiline: true,
          template: {
            anchor: '{notes}',
            placement: 'replace',
            size: { width: 400, height: 100 }
          }
        }
      ]
    });

    console.log('✅ Review link created!\n');
    console.log('Document ID:', result.documentId);
    console.log('Status:', result.status);
    console.log('Preview URL:', result.previewUrl);

    if (result.recipients) {
      console.log('\nRecipients:');
      result.recipients.forEach(recipient => {
        console.log(`  ${recipient.name} (${recipient.email}) - ${recipient.status}`);
      });
    }

    console.log('\nNext steps:');
    console.log('1. Review the document at the preview URL');
    console.log('2. Send to recipients: await TurboSign.send(documentId);');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
advancedFieldsExample();
