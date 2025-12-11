/**
 * Example 2: Review Link - Template Anchors
 *
 * This example creates a review link first, then sends manually.
 * Uses template anchors like {signature1} and {date1} in your PDF.
 *
 * Use this when: You want to review the document before sending
 */

import { TurboSign } from '@turbodocx/sdk';
import * as fs from 'fs';

async function reviewLinkExample() {
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here',
    orgId: process.env.TURBODOCX_ORG_ID || 'your-org-id-here',
    senderEmail: process.env.TURBODOCX_SENDER_EMAIL || 'support@yourcompany.com',
    senderName: process.env.TURBODOCX_SENDER_NAME || 'Your Company Name'
  });

  try {
    const pdfFile = fs.readFileSync('../../ExampleAssets/sample-contract.pdf');

    console.log('Creating review link with template anchors...\n');
    const result = await TurboSign.createSignatureReviewLink({
      file: pdfFile,
      documentName: 'Contract Agreement',
      documentDescription: 'This document requires electronic signatures from both parties.',
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
        // First recipient - using template anchors
        {
          type: 'signature',
          recipientEmail: 'nicolas@turbodocx.com',
          template: {
            anchor: '{signature1}',
            placement: 'replace',
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
        // Second recipient
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

    console.log('\n✅ Review link created!');
    console.log('Document ID:', result.documentId);
    console.log('Status:', result.status);
    console.log('Preview URL:', result.previewUrl);

    if (result.recipients) {
      console.log('\nRecipients:');
      result.recipients.forEach(recipient => {
        console.log(`  ${recipient.name} (${recipient.email}) - ${recipient.status}`);
      });
    }

    console.log('\nYou can now:');
    console.log('1. Review the document at the preview URL');
    console.log('2. Send to recipients using: await TurboSign.send(documentId);');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
reviewLinkExample();
