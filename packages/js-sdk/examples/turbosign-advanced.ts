/**
 * Advanced TurboSign Example - Template Anchors with Advanced Features
 *
 * This example demonstrates advanced features:
 * - Various field types (signature, date, text, checkbox, company, title)
 * - Readonly fields with default values
 * - Required fields
 * - Multiline text fields
 * - Management operations (resend, void, audit trail, download)
 */

import { TurboSign } from '@turbodocx/sdk';
import * as fs from 'fs';

async function advancedTemplateExample() {
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here'
  });

  try {
    const pdfFile = fs.readFileSync('./contract.pdf');

    console.log('Sending document with advanced template features...\n');

    const result = await TurboSign.sendSignature({
      file: pdfFile,
      documentName: 'Advanced Contract',
      documentDescription: 'Contract with advanced signature field features',
      recipients: [
        {
          name: 'John Doe',
          email: 'john@example.com',
          signingOrder: 1
        }
      ],
      fields: [
        // Signature field
        {
          type: 'signature',
          recipientEmail: 'john@example.com',
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

    console.log('✅ Document sent!\n');
    console.log('Document ID:', result.documentId);

    // Get status and show management operations
    const documentId = result.documentId;
    const status = await TurboSign.getStatus(documentId);

    console.log('Status:', status.status);
    console.log('Sign URL:', status.recipients[0].signUrl);

    // Example management operations:

    // 1. Resend email if needed
    // await TurboSign.resend(documentId, []);

    // 2. Void document if needed
    // await TurboSign.void(documentId, 'Contract needs revision');

    // 3. Get audit trail when completed
    // const audit = await TurboSign.getAuditTrail(documentId);

    // 4. Download signed document when completed
    // const blob = await TurboSign.download(documentId);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
advancedTemplateExample();
