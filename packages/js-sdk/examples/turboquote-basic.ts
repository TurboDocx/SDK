/**
 * TurboQuote Example: Quote Lifecycle + createAndSend Shortcut
 *
 * This example demonstrates the most common quoting workflow:
 * - createCompany(), createContact() — set up CRM records
 * - createQuote(), getQuote(), updateQuote(), listQuotes() — quote CRUD
 * - addLineItems() (single + batch), addBundleLineItems(), listLineItems(), updateLineItem() — line items
 * - sendQuote() — send quote to recipients
 * - downloadQuotePdf() — download as PDF
 * - createAndSend() — convenience method (create + add items + send in one call)
 * - deleteQuote(), deleteContact(), deleteCompany() — cleanup
 *
 * Run: npx tsx examples/turboquote-basic.ts
 */

import { TurboQuote } from '@turbodocx/sdk';
import * as fs from 'fs';

async function quoteLifecycleExample(): Promise<void> {
  // =============================================
  // 1. CONFIGURE
  // =============================================
  TurboQuote.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here',
    orgId: process.env.TURBODOCX_ORG_ID || 'your-org-id-here',
    baseUrl: process.env.TURBODOCX_BASE_URL || 'https://api.turbodocx.com',
  });

  try {
    // =============================================
    // 2. SET UP CRM — create company + contact
    // =============================================
    console.log('2. Creating company...');

    const company = await TurboQuote.createCompany({
      name: 'Acme Corporation',
      contacts: [{ name: 'Jane Smith', email: 'jane@acme.com' }],
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      phone: '+1-555-0100',
    });

    console.log('Company created!');
    console.log(`  ID: ${company.id}`);
    console.log(`  Name: ${company.name}\n`);

    console.log('Creating contact...');

    const contact = await TurboQuote.createContact({
      name: 'Jane Smith',
      companyId: company.id,
      email: 'jane@acme.com',
      title: 'VP of Engineering',
    });

    console.log('Contact created!');
    console.log(`  ID: ${contact.id}`);
    console.log(`  Name: ${contact.name}`);
    console.log(`  Email: ${contact.email}\n`);

    // Verify CRM records
    const companies = await TurboQuote.listCompanies({ query: 'Acme', limit: 5 });
    console.log(`Found ${companies.totalRecords} company(ies) matching "Acme"`);

    const contacts = await TurboQuote.listContacts({ companyId: company.id });
    console.log(`Found ${contacts.totalRecords} contact(s) for Acme Corporation\n`);

    // =============================================
    // 3. CREATE A QUOTE
    // =============================================
    console.log('3. Creating quote...');

    const quote = await TurboQuote.createQuote({
      name: 'Acme Corp - Q3 Enterprise License',
      companyId: company.id,
      contactId: contact.id,
      currency: 'USD',
      termDays: 30,
      renewalPeriod: 'annually',
    });

    console.log('Quote created!');
    console.log(`  ID: ${quote.id}`);
    console.log(`  Number: ${quote.quoteNumber}`);
    console.log(`  Status: ${quote.status}`);
    console.log(`  Currency: ${quote.currency}\n`);

    // Get full quote details
    const quoteDetails = await TurboQuote.getQuote(quote.id);
    console.log(`Quote "${quoteDetails.name}" valid for ${quoteDetails.termDays} days`);

    // Update the quote name
    const updatedQuote = await TurboQuote.updateQuote(quote.id, {
      name: 'Acme Corp - Q3 Enterprise License (Revised)',
      taxRate: 8.5,
    });
    console.log(`Updated quote name: ${updatedQuote.name}\n`);

    // List quotes
    const quoteList = await TurboQuote.listQuotes({ statuses: 'draft', limit: 5 });
    console.log(`Found ${quoteList.totalRecords} draft quote(s)`);
    for (const q of quoteList.results) {
      console.log(`  - ${q.quoteNumber}: ${q.name}`);
    }
    console.log();

    // =============================================
    // 4. ADD LINE ITEMS — single, then batch
    // =============================================
    console.log('4. Adding line items...');

    // Single item
    const singleItems = await TurboQuote.addLineItems(quote.id, {
      productId: process.env.PRODUCT_ID_1 || 'your-product-id-here',
      productName: 'Widget Pro',
      quantity: 10,
      unitPrice: 99.99,
      billingFrequency: 'monthly',
    });

    console.log('Single line item added!');
    console.log(`  Product: ${singleItems[0].productName}`);
    console.log(`  Subtotal: $${singleItems[0].subtotal}\n`);

    // Batch of 2 items
    const batchItems = await TurboQuote.addLineItems(quote.id, [
      {
        productId: process.env.PRODUCT_ID_2 || 'your-product-id-2-here',
        productName: 'Widget Basic',
        quantity: 5,
        unitPrice: 49.99,
        billingFrequency: 'monthly',
      },
      {
        productId: process.env.PRODUCT_ID_3 || 'your-product-id-3-here',
        productName: 'Implementation Fee',
        quantity: 1,
        unitPrice: 2500.00,
        billingFrequency: 'one-time',
        discountPercent: 10,
      },
    ]);

    console.log(`Batch added ${batchItems.length} line items`);
    for (const item of batchItems) {
      console.log(`  - ${item.productName}: ${item.quantity} x $${item.unitPrice} = $${item.subtotal}`);
    }

    // Add a bundle line item (single or batch, same pattern as addLineItems)
    const bundleItems = await TurboQuote.addBundleLineItems(quote.id, {
      bundleId: process.env.BUNDLE_ID || 'your-bundle-id-here',
      bundleName: 'Starter Pack',
      quantity: 1,
    });

    console.log(`\nBundle line item added: ${bundleItems[0].bundleName}`);
    console.log(`  Subtotal: $${bundleItems[0].subtotal}\n`);

    // =============================================
    // 5. UPDATE A LINE ITEM
    // =============================================
    console.log('5. Updating first line item...');

    const updatedItem = await TurboQuote.updateLineItem(quote.id, singleItems[0].id, {
      quantity: 15,
      discountPercent: 5,
    });

    console.log('Line item updated!');
    console.log(`  Quantity: ${updatedItem.quantity}`);
    console.log(`  Discount: ${updatedItem.discountPercent}%`);
    console.log(`  New Subtotal: $${updatedItem.subtotal}\n`);

    // =============================================
    // 6. LIST LINE ITEMS
    // =============================================
    console.log('6. Listing all line items...');

    const lineItems = await TurboQuote.listLineItems(quote.id);

    console.log(`Quote has ${lineItems.totalRecords} line item(s):`);
    for (const item of lineItems.results) {
      const freq = item.billingFrequency || 'n/a';
      console.log(`  - ${item.productName}: ${item.quantity} x $${item.unitPrice} (${freq}) = $${item.subtotal}`);
    }
    console.log();

    // =============================================
    // 7. SEND THE QUOTE
    // =============================================
    console.log('7. Sending quote...');

    const sendResult = await TurboQuote.sendQuote(quote.id, {
      ccEmails: ['sales-archive@yourcompany.com'],
    });

    console.log('✅ Quote sent!');
    console.log(`  Message: ${sendResult.message}`);
    if (sendResult.signatureDocumentId) {
      console.log(`  Signature Document ID: ${sendResult.signatureDocumentId}`);
    }
    console.log();

    // =============================================
    // 8. DOWNLOAD QUOTE PDF
    // =============================================
    console.log('8. Downloading quote PDF...');

    const pdfBuffer = await TurboQuote.downloadQuotePdf(quote.id);
    const outputPath = `quote-${quote.quoteNumber}.pdf`;
    fs.writeFileSync(outputPath, Buffer.from(pdfBuffer));

    console.log(`✅ PDF saved to ${outputPath}\n`);

    // =============================================
    // 9. SHORTCUT: createAndSend()
    // =============================================
    console.log('9. Using createAndSend() shortcut...');

    const quickResult = await TurboQuote.createAndSend({
      name: 'Acme Corp - Quick Quote',
      companyId: company.id,
      contactId: contact.id,
      currency: 'USD',
      termDays: 14,
      items: [
        {
          productId: process.env.PRODUCT_ID_1 || 'your-product-id-here',
          productName: 'Widget Pro',
          unitPrice: 99.99,
          billingFrequency: 'monthly',
          quantity: 5,
        },
      ],
    });

    console.log('✅ Quote created and sent in one call!');
    console.log(`  Quote Number: ${quickResult.quote.quoteNumber}`);
    console.log(`  Status: ${quickResult.quote.status}`);
    if (quickResult.signatureDocumentId) {
      console.log(`  Signature Document ID: ${quickResult.signatureDocumentId}`);
    }
    console.log();

    // =============================================
    // 10. CLEANUP
    // =============================================
    console.log('10. Cleaning up...');

    await TurboQuote.deleteQuote(quote.id);
    console.log(`  Deleted quote: ${quote.quoteNumber}`);

    await TurboQuote.deleteQuote(quickResult.quote.id);
    console.log(`  Deleted quote: ${quickResult.quote.quoteNumber}`);

    await TurboQuote.deleteContact(contact.id);
    console.log(`  Deleted contact: ${contact.name}`);

    await TurboQuote.deleteCompany(company.id);
    console.log(`  Deleted company: ${company.name}`);

    console.log('\n=== Quote lifecycle example completed successfully! ===');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.statusCode) {
      console.error(`Status Code: ${error.statusCode}`);
    }
  }
}

// Run the example
quoteLifecycleExample();
