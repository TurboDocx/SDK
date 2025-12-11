/**
 * Basic TurboSign Example - Coordinate-Based Positioning
 *
 * This example demonstrates using X/Y coordinates for field placement.
 * Use this when you don't have template anchors in your PDF.
 * For most cases, use template anchors instead (see turbosign-send-simple.ts)
 */

import { TurboSign } from '@turbodocx/sdk';
import * as fs from 'fs';

async function coordinateBasedExample() {
  // Configure TurboSign with your API key
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here'
  });

  try {
    // Read the PDF file
    const pdfFile = fs.readFileSync('./sample-contract.pdf');

    // Send signature request using X/Y coordinates
    console.log('Sending document with coordinate-based fields...');
    const result = await TurboSign.sendSignature({
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
        // First recipient - using coordinates
        {
          type: 'signature',
          recipientEmail: 'john.smith@company.com',
          page: 1,        // Page number (1-indexed)
          x: 100,         // X position in pixels from left
          y: 650,         // Y position in pixels from bottom
          width: 200,     // Width in pixels
          height: 50      // Height in pixels
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
        // Second recipient
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

    console.log('\n✅ Document sent!');
    console.log('Document ID:', result.documentId);
    console.log('Message:', result.message);

    // Get document status to see sign URLs
    const status = await TurboSign.getStatus(result.documentId);
    console.log('\nRecipients:');
    status.recipients.forEach(recipient => {
      console.log(`  ${recipient.name} (${recipient.email})`);
      console.log(`    Status: ${recipient.status}`);
      console.log(`    Sign URL: ${recipient.signUrl}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
coordinateBasedExample();
