/**
 * TurboSign Multi-Party Example - Template Anchors
 *
 * This example shows sending a document to multiple recipients with template anchors.
 * Add anchors like {signature_ceo}, {name_ceo}, {title_ceo}, {date_ceo} in your PDF.
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
        // Company A fields - use {signature_ceo}, {name_ceo}, {title_ceo}, {date_ceo} in PDF
        {
          type: 'signature',
          recipientEmail: 'ceo@company-a.com',
          template: {
            anchor: '{signature_ceo}',
            placement: 'replace',
            size: { width: 200, height: 50 }
          }
        },
        {
          type: 'full_name',
          recipientEmail: 'ceo@company-a.com',
          template: {
            anchor: '{name_ceo}',
            placement: 'replace',
            size: { width: 200, height: 30 }
          }
        },
        {
          type: 'title',
          recipientEmail: 'ceo@company-a.com',
          defaultValue: 'Chief Executive Officer',
          template: {
            anchor: '{title_ceo}',
            placement: 'replace',
            size: { width: 200, height: 30 }
          }
        },
        {
          type: 'date',
          recipientEmail: 'ceo@company-a.com',
          template: {
            anchor: '{date_ceo}',
            placement: 'replace',
            size: { width: 150, height: 30 }
          }
        },

        // Company B fields - use {signature_legal}, {name_legal}, {company_legal}, {date_legal} in PDF
        {
          type: 'signature',
          recipientEmail: 'legal@company-b.com',
          template: {
            anchor: '{signature_legal}',
            placement: 'replace',
            size: { width: 200, height: 50 }
          }
        },
        {
          type: 'full_name',
          recipientEmail: 'legal@company-b.com',
          template: {
            anchor: '{name_legal}',
            placement: 'replace',
            size: { width: 200, height: 30 }
          }
        },
        {
          type: 'company',
          recipientEmail: 'legal@company-b.com',
          defaultValue: 'Company B Legal Corp',
          template: {
            anchor: '{company_legal}',
            placement: 'replace',
            size: { width: 200, height: 30 }
          }
        },
        {
          type: 'date',
          recipientEmail: 'legal@company-b.com',
          template: {
            anchor: '{date_legal}',
            placement: 'replace',
            size: { width: 150, height: 30 }
          }
        },

        // Company C fields - use {signature_cfo}, {name_cfo}, {date_cfo} in PDF
        {
          type: 'signature',
          recipientEmail: 'cfo@company-c.com',
          template: {
            anchor: '{signature_cfo}',
            placement: 'replace',
            size: { width: 200, height: 50 }
          }
        },
        {
          type: 'full_name',
          recipientEmail: 'cfo@company-c.com',
          template: {
            anchor: '{name_cfo}',
            placement: 'replace',
            size: { width: 200, height: 30 }
          }
        },
        {
          type: 'date',
          recipientEmail: 'cfo@company-c.com',
          template: {
            anchor: '{date_cfo}',
            placement: 'replace',
            size: { width: 150, height: 30 }
          }
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
