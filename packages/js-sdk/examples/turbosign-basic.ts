/**
 * Basic TurboSign Example
 *
 * This example demonstrates the basic 3-step workflow for getting a document signed
 */

import { TurboSign } from '@turbodocx/sdk';
import * as fs from 'fs';

async function basicSignatureExample() {
  // Configure TurboSign with your API key
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here'
  });

  try {
    // Read the PDF file
    const pdfFile = fs.readFileSync('./sample-contract.pdf');

    // Step 1: Upload the document
    console.log('Uploading document...');
    const upload = await TurboSign.uploadDocument(pdfFile, 'Contract.pdf');
    console.log('Document uploaded:', upload.documentId);

    // Step 2: Add recipients
    console.log('Adding recipients...');
    const recipients = await TurboSign.addRecipients(upload.documentId, [
      {
        email: 'john.doe@example.com',
        name: 'John Doe',
        order: 1
      },
      {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        order: 2
      }
    ]);
    console.log('Recipients added:', recipients.recipients.length);

    // Step 3: Prepare for signing with signature fields
    console.log('Preparing document for signing...');
    const prepared = await TurboSign.prepareForSigning(upload.documentId, {
      fields: [
        {
          type: 'signature',
          recipientId: recipients.recipients[0].id,
          page: 1,
          x: 100,
          y: 650,
          width: 200,
          height: 50,
          pageWidth: 612,   // Standard US Letter width in points
          pageHeight: 792   // Standard US Letter height in points
        },
        {
          type: 'date',
          recipientId: recipients.recipients[0].id,
          page: 1,
          x: 100,
          y: 600,
          width: 150,
          height: 30,
          pageWidth: 612,
          pageHeight: 792
        },
        {
          type: 'signature',
          recipientId: recipients.recipients[1].id,
          page: 1,
          x: 350,
          y: 650,
          width: 200,
          height: 50,
          pageWidth: 612,
          pageHeight: 792
        },
        {
          type: 'date',
          recipientId: recipients.recipients[1].id,
          page: 1,
          x: 350,
          y: 600,
          width: 150,
          height: 30,
          pageWidth: 612,
          pageHeight: 792
        }
      ],
      webhookUrl: 'https://your-app.com/webhooks/signature-completed',
      sendEmails: true
    });

    console.log('Document prepared!');
    console.log('Sign URLs:');
    prepared.recipients.forEach(recipient => {
      console.log(`  ${recipient.name}: ${recipient.signUrl}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
basicSignatureExample();
