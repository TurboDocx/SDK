/**
 * Advanced TurboSign Example
 *
 * This example demonstrates additional operations like checking status,
 * downloading signed documents, and managing signature requests
 */

import { TurboSign } from '@turbodocx/sdk';
import * as fs from 'fs';

async function advancedExample() {
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here'
  });

  const documentId = 'your-document-id'; // From a previous signature request

  try {
    // Check document status
    console.log('Checking document status...');
    const status = await TurboSign.getStatus(documentId);
    console.log('Status:', status.status);
    console.log('Recipients:');
    status.recipients.forEach(recipient => {
      console.log(`  ${recipient.name} (${recipient.email}): ${recipient.status}`);
      if (recipient.signedAt) {
        console.log(`    Signed at: ${recipient.signedAt}`);
      }
    });

    // If document is completed, download it
    if (status.status === 'completed') {
      console.log('\nDownloading signed document...');
      const response = await TurboSign.download(documentId);
      const buffer = await response.arrayBuffer();
      fs.writeFileSync('./signed-contract.pdf', Buffer.from(buffer));
      console.log('Signed document saved to ./signed-contract.pdf');

      // Get audit trail
      console.log('\nFetching audit trail...');
      const auditTrail = await TurboSign.getAuditTrail(documentId);
      console.log('Audit trail entries:', auditTrail.entries.length);
      auditTrail.entries.forEach(entry => {
        console.log(`  ${entry.timestamp}: ${entry.event} by ${entry.actor}`);
      });
    }

    // If document is pending, you can resend emails
    if (status.status === 'sent') {
      console.log('\nResending signature emails...');
      // Resend to all recipients (empty array or specific recipient IDs)
      await TurboSign.resend(documentId, []);
      console.log('Emails resent successfully');
    }

    // To cancel a signature request (requires a reason)
    // await TurboSign.void(documentId, 'Document needs to be revised');
    // console.log('Document voided');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
advancedExample();
