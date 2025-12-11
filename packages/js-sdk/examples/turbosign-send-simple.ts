/**
 * Simple TurboSign Example
 *
 * This example shows the simplest way to send a document for signature
 */

import { TurboSign } from '@turbodocx/sdk';
import * as fs from 'fs';

async function simpleExample() {
  // Configure TurboSign
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here'
  });

  try {
    const pdfFile = fs.readFileSync('./sample-contract.pdf');

    console.log('Sending document for signature...\n');

    // Send signature request - one method call does everything
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
        // First recipient's fields
        {
          type: 'signature',
          page: 1,
          x: 100,
          y: 650,
          width: 200,
          height: 50,
          recipientEmail: 'john.doe@example.com'
        },
        {
          type: 'date',
          page: 1,
          x: 100,
          y: 600,
          width: 150,
          height: 30,
          recipientEmail: 'john.doe@example.com'
        },
        // Second recipient's fields
        {
          type: 'signature',
          page: 1,
          x: 350,
          y: 650,
          width: 200,
          height: 50,
          recipientEmail: 'jane.smith@example.com'
        },
        {
          type: 'date',
          page: 1,
          x: 350,
          y: 600,
          width: 150,
          height: 30,
          recipientEmail: 'jane.smith@example.com'
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
simpleExample();
