/**
 * Basic TurboSign Example - Review Before Sending
 *
 * This example demonstrates creating a review link first (no emails sent),
 * then you can check the document before sending signature requests
 */

import { TurboSign } from '@turbodocx/sdk';
import * as fs from 'fs';

async function basicReviewExample() {
  // Configure TurboSign with your API key
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here'
  });

  try {
    // Read the PDF file
    const pdfFile = fs.readFileSync('./sample-contract.pdf');

    // Create a review link (no emails sent yet)
    console.log('Creating signature review link...');
    const reviewResult = await TurboSign.createSignatureReviewLink({
      file: pdfFile,
      documentName: 'Contract Agreement',
      documentDescription: 'This document requires electronic signatures from both parties.',
      recipients: [
        {
          name: 'John Smith',
          email: 'john.smith@company.com',
          signingOrder: 1
        },
        {
          name: 'Jane Doe',
          email: 'jane.doe@partner.com',
          signingOrder: 2
        }
      ],
      fields: [
        {
          type: 'signature',
          recipientEmail: 'john.smith@company.com',
          page: 1,
          x: 100,
          y: 650,
          width: 200,
          height: 50
        },
        {
          type: 'date',
          recipientEmail: 'john.smith@company.com',
          page: 1,
          x: 100,
          y: 600,
          width: 150,
          height: 30
        },
        {
          type: 'signature',
          recipientEmail: 'jane.doe@partner.com',
          page: 1,
          x: 350,
          y: 650,
          width: 200,
          height: 50
        },
        {
          type: 'date',
          recipientEmail: 'jane.doe@partner.com',
          page: 1,
          x: 350,
          y: 600,
          width: 150,
          height: 30
        }
      ]
    });

    console.log('\n✅ Review link created!');
    console.log('Document ID:', reviewResult.documentId);
    console.log('Review URL:', reviewResult.reviewUrl);
    console.log('\n👀 Review the document and field placement at the URL above');
    console.log('   Then use TurboSign.sendSignature() to send signature requests\n');

    // Get document status
    const status = await TurboSign.getStatus(reviewResult.documentId);
    console.log('Document status:', status.status);
    console.log('Recipients:', status.recipients.length);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
basicReviewExample();
