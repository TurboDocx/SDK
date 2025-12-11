/**
 * TurboSign From Deliverable Example - Template Anchors
 *
 * This example demonstrates creating a signature document from an existing deliverable
 * (a document previously generated with TurboDocx).
 *
 * Add anchors like {signature} and {date} in your TurboDocx template.
 */

import { TurboSign } from '@turbodocx/sdk';

async function createFromDeliverableExample() {
  // Configure TurboSign with your API key
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here'
  });

  const deliverableId = 'your-deliverable-id'; // From a previously generated document

  try {
    console.log('Creating signature document from deliverable...');

    // Send signature request using a deliverable ID instead of file upload
    const result = await TurboSign.sendSignature({
      deliverableId: deliverableId,
      documentName: 'Contract from Deliverable',
      documentDescription: 'Created from deliverable for signing',
      recipients: [
        {
          name: 'John Doe',
          email: 'signer@example.com',
          signingOrder: 1
        }
      ],
      fields: [
        {
          type: 'signature',
          recipientEmail: 'signer@example.com',
          template: {
            anchor: '{signature}',
            placement: 'replace',
            size: { width: 200, height: 50 }
          }
        },
        {
          type: 'date',
          recipientEmail: 'signer@example.com',
          template: {
            anchor: '{date}',
            placement: 'replace',
            size: { width: 150, height: 30 }
          }
        }
      ]
    });

    console.log('\n✅ Document sent successfully!');
    console.log('Document ID:', result.documentId);
    console.log('Message:', result.message);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
createFromDeliverableExample();
