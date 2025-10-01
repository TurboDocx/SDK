/**
 * TurboSign From Deliverable Example
 *
 * This example demonstrates creating a signature document from an existing deliverable
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

    // Create signature document from an existing deliverable
    const upload = await TurboSign.createFromDeliverable(
      deliverableId,
      'Contract from Deliverable',
      'Created from deliverable for signing'
    );

    console.log('Document created:', upload.documentId);
    console.log('Status:', upload.status);

    // Now continue with the normal signing workflow
    console.log('\nAdding recipients...');
    const recipients = await TurboSign.addRecipients(upload.documentId, [
      {
        email: 'signer@example.com',
        name: 'John Doe',
        order: 1
      }
    ]);

    console.log('Recipients added:', recipients.recipients.length);

    // Add signature fields
    console.log('\nPreparing for signing...');
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
          pageWidth: 612,  // Standard US Letter width in points
          pageHeight: 792  // Standard US Letter height in points
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
        }
      ],
      sendEmails: true
    });

    console.log('Document ready for signing!');
    console.log('Sign URL:', prepared.recipients[0].signUrl);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
createFromDeliverableExample();
