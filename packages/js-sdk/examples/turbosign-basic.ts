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

    // Step 2: Add recipients and update document details
    console.log('Adding recipients...');
    const result = await TurboSign.saveDocumentDetails(
      upload.documentId,
      {
        name: 'Contract Agreement - Updated',
        description: 'This document requires electronic signatures from both parties. Please review all content carefully before signing.'
      },
      [
        {
          name: 'John Smith',
          email: 'john.smith@company.com',
          signingOrder: 1,
          metadata: {
            color: 'hsl(200, 75%, 50%)',
            lightColor: 'hsl(200, 75%, 93%)'
          }
        },
        {
          name: 'Jane Doe',
          email: 'jane.doe@partner.com',
          signingOrder: 2,
          metadata: {
            color: 'hsl(270, 75%, 50%)',
            lightColor: 'hsl(270, 75%, 93%)'
          }
        }
      ]
    );
    console.log('Recipients added:', result.recipients.length);

    // Step 3: Prepare for signing with signature fields
    console.log('Preparing document for signing...');
    const prepared = await TurboSign.prepareForSigning(upload.documentId, {
      fields: [
        {
          type: 'signature',
          recipientId: result.recipients[0].id,
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
          recipientId: result.recipients[0].id,
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
          recipientId: result.recipients[1].id,
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
          recipientId: result.recipients[1].id,
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
