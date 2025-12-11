/**
 * Simple TurboSign Example - Template Anchors
 *
 * This example shows the MOST COMMON way to send a document for signature
 * using template anchors like {signature} in your PDF instead of coordinates
 */

import { TurboSign } from '@turbodocx/sdk';
import * as fs from 'fs';

async function simpleTemplateExample() {
  // Configure TurboSign
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here'
  });

  try {
    // Your PDF should have text like: {signature1}, {date1}, {signature2}, {date2}
    const pdfFile = fs.readFileSync('./sample-contract.pdf');

    console.log('Sending document for signature using template anchors...\n');

    // Send signature request - fields will replace the {tags} in your PDF
    const result = await TurboSign.sendSignature({
      file: pdfFile,
      documentName: 'Partnership Agreement',
      documentDescription: 'Q1 2025 Partnership Agreement - Please review and sign',
      recipients: [
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          signingOrder: 1
        },
        {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          signingOrder: 2
        }
      ],
      fields: [
        // First recipient's fields - using template anchors
        {
          type: 'signature',
          recipientEmail: 'john.doe@example.com',
          template: {
            anchor: '{signature1}',       // Text in your PDF to replace
            placement: 'replace',          // Replace the anchor text
            size: { width: 200, height: 50 }
          }
        },
        {
          type: 'date',
          recipientEmail: 'john.doe@example.com',
          template: {
            anchor: '{date1}',
            placement: 'replace',
            size: { width: 150, height: 30 }
          }
        },
        // Second recipient's fields
        {
          type: 'signature',
          recipientEmail: 'jane.smith@example.com',
          template: {
            anchor: '{signature2}',
            placement: 'replace',
            size: { width: 200, height: 50 }
          }
        },
        {
          type: 'date',
          recipientEmail: 'jane.smith@example.com',
          template: {
            anchor: '{date2}',
            placement: 'replace',
            size: { width: 150, height: 30 }
          }
        }
      ]
    });

    console.log('✅ Document sent successfully!\n');
    console.log('Document ID:', result.documentId);
    console.log('Message:', result.message);

    // To get sign URLs and recipient details, use getStatus
    const status = await TurboSign.getStatus(result.documentId);
    console.log('\nSign URLs:');
    status.recipients.forEach(recipient => {
      console.log(`  ${recipient.name}: ${recipient.signUrl}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
simpleTemplateExample();
