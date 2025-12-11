/**
 * Example 1: Send Signature Directly - Template Anchors
 *
 * This example sends a document directly to recipients for signature.
 * Uses template anchors like {signature1} and {date1} in your PDF.
 *
 * Use this when: You want to send immediately without review
 */

import { TurboSign } from '@turbodocx/sdk';
import * as fs from 'fs';

async function sendDirectlyExample() {
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here',
    orgId: process.env.TURBODOCX_ORG_ID || 'your-org-id-here',
    senderEmail: process.env.TURBODOCX_SENDER_EMAIL || 'support@yourcompany.com',
    senderName: process.env.TURBODOCX_SENDER_NAME || 'Your Company Name'
  });

  try {
    const pdfFile = fs.readFileSync('../../ExampleAssets/sample-contract.pdf');

    console.log('Sending document directly to recipients...\n');

    const result = await TurboSign.sendSignature({
      file: pdfFile,
      documentName: 'Partnership Agreement',
      documentDescription: 'Q1 2025 Partnership Agreement - Please review and sign',
      recipients: [
        {
          name: 'Nicolas',
          email: 'nicolas@turbodocx.com',
          signingOrder: 1
        },
        {
          name: 'Nicolas Signer',
          email: 'nicolas+signer@turbodocx.com',
          signingOrder: 2
        }
      ],
      fields: [
        // First recipient's fields - using template anchors
        {
          type: 'signature',
          recipientEmail: 'nicolas@turbodocx.com',
          template: {
            anchor: '{signature1}',       // Text in your PDF to replace
            placement: 'replace',          // Replace the anchor text
            size: { width: 200, height: 50 }
          }
        },
        {
          type: 'date',
          recipientEmail: 'nicolas@turbodocx.com',
          template: {
            anchor: '{date1}',
            placement: 'replace',
            size: { width: 150, height: 30 }
          }
        },
        // Second recipient's fields
        {
          type: 'signature',
          recipientEmail: 'nicolas+signer@turbodocx.com',
          template: {
            anchor: '{signature2}',
            placement: 'replace',
            size: { width: 200, height: 50 }
          }
        },
        {
          type: 'date',
          recipientEmail: 'nicolas+signer@turbodocx.com',
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
    try {
      const status = await TurboSign.getStatus(result.documentId);
      if (status?.recipients) {
        console.log('\nSign URLs:');
        status.recipients.forEach(recipient => {
          console.log(`  ${recipient.name}: ${recipient.signUrl}`);
        });
      }
    } catch (statusError) {
      console.log('\nNote: Could not fetch recipient sign URLs');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
sendDirectlyExample();
