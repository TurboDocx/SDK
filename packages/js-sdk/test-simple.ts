/**
 * Test script for turbosign-send-simple.ts
 * Using real emails: nicolas@turbodocx.com and nicolas+signer2@turbodocx.com
 */

import { TurboSign } from './dist/index.js';
import * as fs from 'fs';

async function testSimpleExample() {
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here'
  });

  try {
    // For now, we need a PDF with {signature1} and {date1} anchors
    // Let's check if there's a sample PDF
    const pdfPath = './sample-contract.pdf';

    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ PDF file not found: ${pdfPath}`);
      console.log('Please create a PDF with {signature1} and {date1} anchors');
      return;
    }

    const pdfFile = fs.readFileSync(pdfPath);

    console.log('Sending signature request to nicolas@turbodocx.com...\n');

    const result = await TurboSign.sendSignature({
      file: pdfFile,
      documentName: 'Simple Test Contract',
      documentDescription: 'Test document with template anchors',
      recipients: [
        {
          email: 'nicolas@turbodocx.com',
          name: 'Nicolas',
          signingOrder: 1
        }
      ],
      fields: [
        {
          type: 'signature',
          recipientEmail: 'nicolas@turbodocx.com',
          template: {
            anchor: '{signature1}',
            placement: 'replace',
            size: { width: 200, height: 50 }
          }
        },
        {
          type: 'date',
          recipientEmail: 'nicolas@turbodocx.com',
          template: {
            anchor: '{date1}',
            placement: 'replace',
            size: { width: 150, height: 30 }
          }
        }
      ]
    });

    console.log('✅ Document sent successfully!\n');
    console.log('Document ID:', result.documentId);
    console.log('Message:', result.message);

    // Get status to show sign URL
    const status = await TurboSign.getStatus(result.documentId);
    console.log('\nStatus:', status.status);
    console.log('Sign URL:', status.recipients[0].signUrl);

    console.log('\n📧 CHECK YOUR INBOX at nicolas@turbodocx.com');
    console.log('Or use the sign URL above to sign the document');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSimpleExample();
