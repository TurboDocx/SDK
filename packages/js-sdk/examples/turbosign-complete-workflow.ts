/**
 * Complete TurboSign Workflow Example
 *
 * This example demonstrates using the createSignatureRequest method
 * for a streamlined one-call workflow
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

    // Complete workflow in one call
    console.log('Creating signature request...');
    const result = await TurboSign.createSignatureRequest({
      file: pdfFile,
      fileName: 'Contract.pdf',
      recipients: [
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
      ],
      fields: [
        {
          type: 'signature',
          recipientId: 'john.doe@example.com', // Will be mapped to actual ID
          page: 1,
          x: 100,
          y: 650,
          width: 200,
          height: 50
        },
        {
          type: 'date',
          recipientId: 'john.doe@example.com',
          page: 1,
          x: 100,
          y: 600
        },
        {
          type: 'signature',
          recipientId: 'jane.smith@example.com',
          page: 1,
          x: 350,
          y: 650,
          width: 200,
          height: 50
        }
      ],
      webhookUrl: 'https://your-app.com/webhooks/signature',
      message: 'Please review and sign this contract.',
      sendEmails: true
    });

    console.log('Signature request created!');
    console.log('Document ID:', result.documentId);
    console.log('Status:', result.status);
    console.log('\nSign URLs:');
    result.recipients.forEach(recipient => {
      console.log(`  ${recipient.name}: ${recipient.signUrl}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
completeWorkflowExample();
