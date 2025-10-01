/**
 * TurboSign.send() with recipientEmail Example
 *
 * This example shows using recipientEmail instead of recipientIndex
 * for more explicit field assignment. Great when you have many recipients
 * and want to be crystal clear about who signs what.
 */

import { TurboSign } from '@turbodocx/sdk';
import * as fs from 'fs';

async function sendWithEmailsExample() {
  // Configure TurboSign
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here'
  });

  try {
    const pdfFile = fs.readFileSync('./multi-party-agreement.pdf');

    console.log('Sending multi-party agreement...\n');

    const result = await TurboSign.send({
      file: pdfFile,
      fileName: 'Multi-Party Service Agreement',
      description: 'This agreement requires signatures from all three parties',
      recipients: [
        { email: 'ceo@company-a.com', name: 'Alice CEO' },
        { email: 'legal@company-b.com', name: 'Bob Legal' },
        { email: 'cfo@company-c.com', name: 'Carol CFO' }
      ],
      fields: [
        // Page 1: Company A signatures
        {
          type: 'signature',
          page: 1,
          x: 100,
          y: 650,
          recipientEmail: 'ceo@company-a.com'
        },
        {
          type: 'full_name',
          page: 1,
          x: 100,
          y: 610,
          recipientEmail: 'ceo@company-a.com'
        },
        {
          type: 'title',
          page: 1,
          x: 100,
          y: 580,
          recipientEmail: 'ceo@company-a.com',
          defaultValue: 'Chief Executive Officer'
        },
        {
          type: 'date',
          page: 1,
          x: 100,
          y: 550,
          recipientEmail: 'ceo@company-a.com'
        },

        // Page 2: Company B signatures
        {
          type: 'signature',
          page: 2,
          x: 100,
          y: 650,
          recipientEmail: 'legal@company-b.com'
        },
        {
          type: 'full_name',
          page: 2,
          x: 100,
          y: 610,
          recipientEmail: 'legal@company-b.com'
        },
        {
          type: 'company',
          page: 2,
          x: 100,
          y: 580,
          recipientEmail: 'legal@company-b.com',
          defaultValue: 'Company B Legal Inc.'
        },
        {
          type: 'date',
          page: 2,
          x: 100,
          y: 550,
          recipientEmail: 'legal@company-b.com'
        },

        // Page 3: Company C signatures
        {
          type: 'signature',
          page: 3,
          x: 100,
          y: 650,
          recipientEmail: 'cfo@company-c.com'
        },
        {
          type: 'full_name',
          page: 3,
          x: 100,
          y: 610,
          recipientEmail: 'cfo@company-c.com'
        },
        {
          type: 'date',
          page: 3,
          x: 100,
          y: 550,
          recipientEmail: 'cfo@company-c.com'
        }
      ]
      // Webhooks are configured at organization level - see webhooks-setup.ts
    });

    console.log('Document sent successfully!\n');
    console.log('Document ID:', result.documentId);
    console.log('Status:', result.status);
    console.log('\nRecipients:');

    result.recipients.forEach(recipient => {
      console.log(`\n  ${recipient.signingOrder}. ${recipient.name}`);
      console.log(`     Email: ${recipient.email}`);
      console.log(`     Sign URL: ${recipient.signUrl}`);
      console.log(`     Color: ${recipient.color}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
sendWithEmailsExample();
