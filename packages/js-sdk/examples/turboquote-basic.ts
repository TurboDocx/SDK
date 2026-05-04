/**
 * TurboQuote Example: Quote Lifecycle + createAndSend Shortcut
 *
 * Fully self-contained — creates all data it needs, then cleans up.
 * Just add your API key and run.
 *
 * Methods demonstrated:
 * - configure()
 * - createCompany(), listCompanies(), deleteCompany()
 * - createContact(), listContacts(), deleteContact()
 * - createType(), deleteType()
 * - createProduct(), deleteProduct()
 * - createBundle(), deleteBundle()
 * - createQuote(), getQuote(), updateQuote(), listQuotes(), deleteQuote()
 * - addLineItems() (single + batch), addBundleLineItems(), listLineItems(), updateLineItem()
 * - sendQuote(), downloadQuotePdf()
 * - createAndSend()
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
    // 2. SET UP CATALOG — category, products, bundle
    // =============================================
    console.log('2. Setting up product catalog...');

    const category = await TurboQuote.createType({
      name: 'Example Products',
      categoryType: 'product_category',
    });

    const bundleCategory = await TurboQuote.createType({
      name: 'Example Bundles',
      categoryType: 'bundle_category',
    });

    const product1 = await TurboQuote.createProduct({
      name: 'Widget Pro',
      listPrice: 99.99,
      billingFrequency: 'monthly',
      categoryId: category.id,
      currency: 'USD',
    });

    const product2 = await TurboQuote.createProduct({
      name: 'Widget Basic',
      listPrice: 49.99,
      billingFrequency: 'monthly',
      categoryId: category.id,
      currency: 'USD',
    });

    const product3 = await TurboQuote.createProduct({
      name: 'Implementation Fee',
      listPrice: 2500.00,
      billingFrequency: 'one-time',
      categoryId: category.id,
      currency: 'USD',
    });

    const bundle = await TurboQuote.createBundle({
      name: 'Starter Pack',
      categoryId: bundleCategory.id,
      items: [
        { productId: product1.id, unitPrice: 99.99, billingFrequency: 'monthly', quantity: 1 },
        { productId: product2.id, unitPrice: 49.99, billingFrequency: 'monthly', quantity: 1 },
      ],
      currency: 'USD',
    });

    console.log(`  Created category: ${category.name}`);
    console.log(`  Created products: ${product1.name}, ${product2.name}, ${product3.name}`);
    console.log(`  Created bundle: ${bundle.name}\n`);

    // =============================================
    // 3. SET UP CRM — company + contact
    // =============================================
    console.log('3. Creating company and contact...');

    const company = await TurboQuote.createCompany({
      name: 'Acme Corporation',
      contacts: [{ name: 'Jane Smith', email: 'jane@acme.com' }],
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      phone: '+1-555-0100',
    });
    console.log(`  Company: ${company.name} (${company.id})`);

    const contact = await TurboQuote.createContact({
      name: 'Jane Smith',
      companyId: company.id,
      email: 'jane@acme.com',
      title: 'VP of Engineering',
    });
    console.log(`  Contact: ${contact.name} (${contact.email})`);

    // Verify CRM records
    const companies = await TurboQuote.listCompanies({ query: 'Acme', limit: 5 });
    console.log(`  Found ${companies.totalRecords} company(ies) matching "Acme"`);

    const contacts = await TurboQuote.listContacts({ companyId: company.id });
    console.log(`  Found ${contacts.totalRecords} contact(s) for ${company.name}\n`);

    // =============================================
    // 4. CREATE A QUOTE
    // =============================================
    console.log('4. Creating quote...');

    const quote = await TurboQuote.createQuote({
      name: 'Acme Corp - Q3 Enterprise License',
      companyId: company.id,
      contactId: contact.id,
      currency: 'USD',
      termDays: 30,
      renewalPeriod: 'annually',
    });

    console.log(`  Number: ${quote.quoteNumber}`);
    console.log(`  Status: ${quote.status}`);

    const quoteDetails = await TurboQuote.getQuote(quote.id);
    console.log(`  Term: ${quoteDetails.termDays} days`);

    const updatedQuote = await TurboQuote.updateQuote(quote.id, {
      name: 'Acme Corp - Q3 Enterprise License (Revised)',
      taxRate: 8.5,
    });
    console.log(`  Updated: ${updatedQuote.name}`);

    const quoteList = await TurboQuote.listQuotes({ statuses: 'draft', limit: 5 });
    console.log(`  ${quoteList.totalRecords} draft quote(s) in org\n`);

    // =============================================
    // 5. ADD LINE ITEMS — single, batch, bundle
    // =============================================
    console.log('5. Adding line items...');

    // Single item
    const singleItems = await TurboQuote.addLineItems(quote.id, {
      productId: product1.id,
      productName: product1.name,
      quantity: 10,
      unitPrice: product1.listPrice,
      billingFrequency: 'monthly',
    });
    console.log(`  Added: ${singleItems[0].productName} x${singleItems[0].quantity}`);

    // Batch of 2 items
    const batchItems = await TurboQuote.addLineItems(quote.id, [
      {
        productId: product2.id,
        productName: product2.name,
        quantity: 5,
        unitPrice: product2.listPrice,
        billingFrequency: 'monthly',
      },
      {
        productId: product3.id,
        productName: product3.name,
        quantity: 1,
        unitPrice: product3.listPrice,
        billingFrequency: 'one-time',
        discountPercent: 10,
      },
    ]);
    console.log(`  Batch added ${batchItems.length} items`);

    // Bundle line item
    const bundleItems = await TurboQuote.addBundleLineItems(quote.id, {
      bundleId: bundle.id,
      bundleName: bundle.name,
      quantity: 1,
    });
    console.log(`  Bundle added: ${bundleItems[0].bundleName}\n`);

    // =============================================
    // 6. UPDATE A LINE ITEM
    // =============================================
    console.log('6. Updating first line item...');

    const updatedItem = await TurboQuote.updateLineItem(quote.id, singleItems[0].id, {
      quantity: 15,
      discountPercent: 5,
    });
    console.log(`  Quantity: ${updatedItem.quantity}, Discount: ${updatedItem.discountPercent}%\n`);

    // =============================================
    // 7. LIST LINE ITEMS
    // =============================================
    console.log('7. Listing all line items...');

    const lineItems = await TurboQuote.listLineItems(quote.id);
    console.log(`  ${lineItems.totalRecords} line item(s):`);
    for (const item of lineItems.results) {
      console.log(`    - ${item.productName}: ${item.quantity} x $${item.unitPrice}`);
    }
    console.log();

    // =============================================
    // 8. SEND THE QUOTE
    // =============================================
    console.log('8. Sending quote...');

    const sendResult = await TurboQuote.sendQuote(quote.id);
    console.log(`  ✅ ${sendResult.message}`);
    if (sendResult.signatureDocumentId) {
      console.log(`  Signature Doc: ${sendResult.signatureDocumentId}`);
    }
    console.log();

    // =============================================
    // 9. DOWNLOAD QUOTE PDF
    // =============================================
    console.log('9. Downloading quote PDF...');

    const pdfBuffer = await TurboQuote.downloadQuotePdf(quote.id);
    const outputPath = `quote-${quote.quoteNumber}.pdf`;
    fs.writeFileSync(outputPath, Buffer.from(pdfBuffer));
    console.log(`  ✅ Saved to ${outputPath}\n`);

    // =============================================
    // 10. SHORTCUT: createAndSend()
    // =============================================
    console.log('10. Using createAndSend() shortcut...');

    const quickResult = await TurboQuote.createAndSend({
      name: 'Acme Corp - Quick Quote',
      companyId: company.id,
      contactId: contact.id,
      currency: 'USD',
      termDays: 14,
      items: [
        {
          productId: product1.id,
          productName: product1.name,
          unitPrice: product1.listPrice,
          billingFrequency: 'monthly',
          quantity: 5,
        },
      ],
    });

    console.log(`  ✅ ${quickResult.quote.quoteNumber} created and sent!`);
    console.log();

    // =============================================
    // 11. CLEANUP
    // =============================================
    console.log('11. Cleaning up...');

    await TurboQuote.deleteQuote(quote.id);
    await TurboQuote.deleteQuote(quickResult.quote.id);
    await TurboQuote.deleteContact(contact.id);
    await TurboQuote.deleteCompany(company.id);
    await TurboQuote.deleteBundle(bundle.id);
    await TurboQuote.deleteProduct(product3.id);
    await TurboQuote.deleteProduct(product2.id);
    await TurboQuote.deleteProduct(product1.id);
    await TurboQuote.deleteType(bundleCategory.id);
    await TurboQuote.deleteType(category.id);

    console.log('  ✅ All test data removed');
    console.log('\n=== Quote lifecycle example completed successfully! ===');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.statusCode) {
      console.error(`Status Code: ${error.statusCode}`);
    }
  }
}

quoteLifecycleExample();
