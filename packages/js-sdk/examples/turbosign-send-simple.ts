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
          name: 'John Doe',
          email: 'john@example.com',
          signingOrder: 1
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          signingOrder: 2
        }
      ],
      fields: [
        // First recipient's fields - using template anchors
        {
          type: 'full_name',
          recipientEmail: 'john@example.com',
          template: {
            anchor: '{name1}',
            placement: 'replace',
            size: { width: 100, height: 30 }
          }
        },
        {
          type: 'signature',
          recipientEmail: 'john@example.com',
          template: {
            anchor: '{signature1}',       // Text in your PDF to replace
            placement: 'replace',          // Replace the anchor text
            size: { width: 100, height: 30 }
          }
        },
        {
          type: 'date',
          recipientEmail: 'john@example.com',
          template: {
            anchor: '{date1}',
            placement: 'replace',
            size: { width: 75, height: 30 }
          }
        },
        // Second recipient's fields
        {
          type: 'full_name',
          recipientEmail: 'jane@example.com',
          template: {
            anchor: '{name2}',
            placement: 'replace',
            size: { width: 100, height: 30 }
          }
        },
        {
          type: 'signature',
          recipientEmail: 'jane@example.com',
          template: {
            anchor: '{signature2}',
            placement: 'replace',
            size: { width: 100, height: 30 }
          }
        },
        {
          type: 'date',
          recipientEmail: 'jane@example.com',
          template: {
            anchor: '{date2}',
            placement: 'replace',
            size: { width: 75, height: 30 }
          }
        }
      ]
    });

    console.log('✅ Document sent successfully!\n');
    console.log('Document ID:', result.documentId);
    console.log('Message:', result.message);

    // Signing links are emailed to recipients — they are not returned by the API.
    // getRecipients reports who has signed and who you are still waiting on.
    try {
      const { recipients, summary } = await TurboSign.getRecipients(result.documentId);
      console.log(
        `\n${summary.completed} of ${summary.total} signed, still waiting on ${summary.waitingOn}`
      );
      recipients.forEach(recipient => {
        console.log(`  ${recipient.name} <${recipient.email}>: ${recipient.effectiveStatus}`);
      });
    } catch (statusError) {
      console.log('\nNote: Could not fetch recipient status');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
sendDirectlyExample();
