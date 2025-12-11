/**
 * Complete TurboSign Workflow Example
 *
 * This example demonstrates a complete workflow:
 * 1. Send signature request
 * 2. Check status
 * 3. Download signed document
 * 4. Get audit trail
 */

import { TurboSign } from '@turbodocx/sdk';
import * as fs from 'fs';

async function completeWorkflowExample() {
  // Configure TurboSign
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here'
  });

  try {
    const pdfFile = fs.readFileSync('./sample-contract.pdf');

    // Step 1: Send signature request
    console.log('Step 1: Sending signature request...');
    const result = await TurboSign.sendSignature({
      file: pdfFile,
      documentName: 'Contract.pdf',
      documentDescription: 'Please review and sign this contract',
      recipients: [
        {
          email: 'john.doe@example.com',
          name: 'John Doe',
          signingOrder: 1
        },
        {
          email: 'jane.smith@example.com',
          name: 'Jane Smith',
          signingOrder: 2
        }
      ],
      fields: [
        {
          type: 'signature',
          recipientEmail: 'john.doe@example.com',
          page: 1,
          x: 100,
          y: 650,
          width: 200,
          height: 50
        },
        {
          type: 'date',
          recipientEmail: 'john.doe@example.com',
          page: 1,
          x: 100,
          y: 600,
          width: 150,
          height: 30
        },
        {
          type: 'signature',
          recipientEmail: 'jane.smith@example.com',
          page: 1,
          x: 350,
          y: 650,
          width: 200,
          height: 50
        }
      ]
    });

    console.log('✓ Document sent!');
    console.log('Document ID:', result.documentId);

    const documentId = result.documentId;

    // Step 2: Check document status
    console.log('\nStep 2: Checking document status...');
    const status = await TurboSign.getStatus(documentId);
    console.log('Status:', status.status);
    console.log('Recipients:');
    status.recipients.forEach(recipient => {
      console.log(`  ${recipient.name} (${recipient.email}): ${recipient.status}`);
      if (recipient.signUrl) {
        console.log(`    Sign URL: ${recipient.signUrl}`);
      }
    });

    // Step 3: If completed, download signed document
    if (status.status === 'completed') {
      console.log('\nStep 3: Downloading signed document...');
      const blob = await TurboSign.download(documentId);
      const buffer = await blob.arrayBuffer();
      fs.writeFileSync('./signed-contract.pdf', new Uint8Array(buffer));
      console.log('✓ Signed document saved to ./signed-contract.pdf');

      // Step 4: Get audit trail
      console.log('\nStep 4: Fetching audit trail...');
      const auditTrail = await TurboSign.getAuditTrail(documentId);
      console.log('Audit trail entries:', auditTrail.entries.length);
      auditTrail.entries.forEach(entry => {
        console.log(`  ${entry.timestamp}: ${entry.event} by ${entry.actor}`);
      });
    } else {
      console.log('\n⏳ Document not yet completed');
      console.log('Use TurboSign.resend() to resend emails if needed');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
completeWorkflowExample();
