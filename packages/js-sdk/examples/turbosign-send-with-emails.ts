/**
 * TurboSign Multi-Party Example
 *
 * This example shows sending a document to multiple recipients with various field types
 */

import { TurboSign } from '@turbodocx/sdk';
import * as fs from 'fs';

async function multiPartyExample() {
  // Configure TurboSign
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here'
  });

  try {
    const pdfFile = fs.readFileSync('./multi-party-agreement.pdf');

    console.log('Sending multi-party agreement...\n');

    const result = await TurboSign.sendSignature({
      file: pdfFile,
      documentName: 'Multi-Party Service Agreement',
      documentDescription: 'This agreement requires signatures from all three parties',
      recipients: [
        { email: 'ceo@company-a.com', name: 'Alice CEO', signingOrder: 1 },
        { email: 'legal@company-b.com', name: 'Bob Legal', signingOrder: 2 },
        { email: 'cfo@company-c.com', name: 'Carol CFO', signingOrder: 3 }
      ],
      fields: [
        // Page 1: Company A signatures
        {
          type: 'signature',
          page: 1,
          x: 100,
          y: 650,
          width: 200,
          height: 50,
          recipientEmail: 'ceo@company-a.com'
        },
        {
          type: 'full_name',
          page: 1,
          x: 100,
          y: 610,
          width: 200,
          height: 30,
          recipientEmail: 'ceo@company-a.com'
        },
        {
          type: 'title',
          page: 1,
          x: 100,
          y: 580,
          width: 200,
          height: 30,
          recipientEmail: 'ceo@company-a.com',
          defaultValue: 'Chief Executive Officer'
        },
        {
          type: 'date',
          page: 1,
          x: 100,
          y: 550,
          width: 150,
          height: 30,
          recipientEmail: 'ceo@company-a.com'
        },

        // Page 2: Company B signatures
        {
          type: 'signature',
          page: 2,
          x: 100,
          y: 650,
          width: 200,
          height: 50,
          recipientEmail: 'legal@company-b.com'
        },
        {
          type: 'full_name',
          page: 2,
          x: 100,
          y: 610,
          width: 200,
          height: 30,
          recipientEmail: 'legal@company-b.com'
        },
        {
          type: 'company',
          page: 2,
          x: 100,
          y: 580,
          width: 200,
          height: 30,
          recipientEmail: 'legal@company-b.com',
          defaultValue: 'Company B Legal Corp'
        },
        {
          type: 'date',
          page: 2,
          x: 100,
          y: 550,
          width: 150,
          height: 30,
          recipientEmail: 'legal@company-b.com'
        },

        // Page 3: Company C signatures
        {
          type: 'signature',
          page: 3,
          x: 100,
          y: 650,
          width: 200,
          height: 50,
          recipientEmail: 'cfo@company-c.com'
        },
        {
          type: 'full_name',
          page: 3,
          x: 100,
          y: 610,
          width: 200,
          height: 30,
          recipientEmail: 'cfo@company-c.com'
        },
        {
          type: 'date',
          page: 3,
          x: 100,
          y: 580,
          width: 150,
          height: 30,
          recipientEmail: 'cfo@company-c.com'
        }
      ],
      ccEmails: ['legal-team@company-a.com', 'compliance@company-b.com']
    });

    console.log('✅ Multi-party agreement sent!\n');
    console.log('Document ID:', result.documentId);
    console.log('Message:', result.message);

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the example
multiPartyExample();
