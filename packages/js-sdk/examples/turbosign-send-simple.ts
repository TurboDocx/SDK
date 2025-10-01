/**
 * ✨ Magical TurboSign.send() Example
 *
 * This example shows how incredibly simple it is to get a document signed
 * using the new TurboSign.send() method. Just ~15 lines of actual code!
 */

import { TurboSign } from '@turbodocx/sdk';
import * as fs from 'fs';

async function magicalSendExample() {
  // Configure TurboSign
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here'
  });

  try {
    const pdfFile = fs.readFileSync('./sample-contract.pdf');

    console.log('✨ Sending document with magical one-liner...\n');

    // That's it! One method call handles everything:
    // - Uploads document
    // - Creates recipients with auto-generated colors
    // - Auto-assigns signing order based on array position
    // - Maps recipient indices to IDs automatically
    // - Applies smart field size defaults
    // - Prepares and sends for signing
    const result = await TurboSign.send({
      file: pdfFile,
      fileName: 'Partnership Agreement', // Optional: auto-extracted from file if not provided
      description: 'Q1 2025 Partnership Agreement - Please review and sign',
      recipients: [
        // No need to specify order or signingOrder - array position determines order!
        { email: 'john.doe@example.com', name: 'John Doe' },
        { email: 'jane.smith@example.com', name: 'Jane Smith' }
      ],
      fields: [
        // Use recipientIndex (much simpler than mapping IDs!)
        // No need to specify width, height, pageWidth, pageHeight - smart defaults applied!
        { type: 'signature', page: 1, x: 100, y: 650, recipientIndex: 0 },
        { type: 'date', page: 1, x: 100, y: 600, recipientIndex: 0 },
        { type: 'signature', page: 1, x: 350, y: 650, recipientIndex: 1 },
        { type: 'date', page: 1, x: 350, y: 600, recipientIndex: 1 }
      ],
      webhookUrl: 'https://your-app.com/webhooks/signature',
      // sendEmails defaults to true - no need to specify!
    });

    console.log('🎉 Document sent successfully!\n');
    console.log('📄 Document ID:', result.documentId);
    console.log('📊 Status:', result.status);
    console.log('📅 Prepared at:', result.preparedAt);
    console.log('\n🔗 Sign URLs:');

    result.recipients.forEach(recipient => {
      console.log(`\n  👤 ${recipient.name} (${recipient.email})`);
      console.log(`     Order: ${recipient.signingOrder}`);
      console.log(`     Status: ${recipient.status}`);
      console.log(`     Color: ${recipient.color}`);
      console.log(`     URL: ${recipient.signUrl}`);
    });

    console.log('\n✅ All done! That was easy! 🚀');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the example
magicalSendExample();
