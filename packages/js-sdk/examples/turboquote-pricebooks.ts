/**
 * TurboQuote Example: Price Books & Quote Pricing
 *
 * Fully self-contained — creates all data it needs, then cleans up.
 * Just add your API key and run.
 *
 * Methods demonstrated:
 * - configure()
 * - createType(), deleteType()
 * - createProduct(), deleteProduct()
 * - createCompany(), deleteCompany()
 * - createContact(), deleteContact()
 * - createPriceBook(), listPriceBooks(), getPriceBook(), updatePriceBook()
 * - listPriceBookProducts(), duplicatePriceBook(), deletePriceBook()
 * - createQuote(), applyPriceBook(), removePriceBook(), deleteQuote()
 * - sendQuoteWithDeliverable() (optional — requires a TurboDocx deliverable)
 *
 * Run: npx tsx examples/turboquote-pricebooks.ts
 */

import { TurboQuote } from '@turbodocx/sdk';

async function priceBookExample(): Promise<void> {
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
    // 2. SET UP — categories, products, CRM
    // =============================================
    console.log('2. Setting up prerequisites...');

    const pbType = await TurboQuote.createType({
      name: 'Customer Tier',
      categoryType: 'pricebook_type',
    });
    console.log(`  Price book type: ${pbType.name}`);

    const productCategory = await TurboQuote.createType({
      name: 'Cloud Services',
      categoryType: 'product_category',
    });

    const product1 = await TurboQuote.createProduct({
      name: 'Cloud Storage (1TB)',
      listPrice: 99.99,
      billingFrequency: 'monthly',
      sku: 'CLD-STR-1TB',
      categoryId: productCategory.id,
      currency: 'USD',
    });
    console.log(`  Product 1: ${product1.name} — $${product1.listPrice}/mo`);

    const product2 = await TurboQuote.createProduct({
      name: 'API Gateway',
      listPrice: 199.99,
      billingFrequency: 'monthly',
      sku: 'API-GW-001',
      categoryId: productCategory.id,
      currency: 'USD',
    });
    console.log(`  Product 2: ${product2.name} — $${product2.listPrice}/mo`);

    const company = await TurboQuote.createCompany({
      name: 'PriceBook Demo Corp',
      contacts: [{ name: 'Sam Buyer', email: 'sam@demo.com' }],
    });

    const contact = await TurboQuote.createContact({
      name: 'Sam Buyer',
      companyId: company.id,
      email: 'sam@demo.com',
    });
    console.log(`  Company: ${company.name}, Contact: ${contact.name}\n`);

    // =============================================
    // 3. CREATE A PRICE BOOK
    // =============================================
    console.log('3. Creating price book...');

    const priceBook = await TurboQuote.createPriceBook({
      name: 'Enterprise Tier',
      priceBookTypeId: pbType.id,
      description: 'Discounted pricing for enterprise customers',
      discountPercent: 15,
      validFrom: '2026-01-01',
      validTo: '2026-12-31',
      showInQuoteBuilder: true,
      productPricing: [
        { productId: product1.id, discountPercent: 20 },
        { productId: product2.id, finalPrice: 149.99 },
      ],
    });

    console.log(`  ${priceBook.name}: ${priceBook.discountPercent}% default discount`);
    console.log(`  Valid: ${priceBook.validFrom} to ${priceBook.validTo}\n`);

    // =============================================
    // 4. LIST & GET PRICE BOOKS
    // =============================================
    console.log('4. Browsing price books...');

    const priceBooks = await TurboQuote.listPriceBooks({ showInQuoteBuilder: true, limit: 10 });
    console.log(`  ${priceBooks.totalRecords} price book(s) visible in quote builder`);

    const pbDetail = await TurboQuote.getPriceBook(priceBook.id);
    console.log(`  ${pbDetail.name}: ${pbDetail.productPricing?.length || 0} product overrides\n`);

    // =============================================
    // 5. UPDATE PRICE BOOK
    // =============================================
    console.log('5. Updating price book...');

    const updatedPB = await TurboQuote.updatePriceBook(priceBook.id, {
      discountPercent: 20,
      description: 'Enterprise tier — increased discount for H2 2026',
      productPricing: [
        { productId: product1.id, discountPercent: 25 },
        { productId: product2.id, finalPrice: 139.99 },
      ],
    });
    console.log(`  New default discount: ${updatedPB.discountPercent}%\n`);

    // =============================================
    // 6. LIST PRICE BOOK PRODUCTS
    // =============================================
    console.log('6. Listing price book products...');

    const pbProducts = await TurboQuote.listPriceBookProducts(priceBook.id, { limit: 10 });
    console.log(`  ${pbProducts.totalRecords} product pricing override(s)`);
    for (const pp of pbProducts.results) {
      console.log(`    - Product ${pp.productId}: ${pp.discountPercent}% off → $${pp.finalPrice}`);
    }
    console.log();

    // =============================================
    // 7. DUPLICATE PRICE BOOK
    // =============================================
    console.log('7. Duplicating price book...');

    const seasonalPB = await TurboQuote.duplicatePriceBook(priceBook.id);
    console.log(`  Copy: ${seasonalPB.name} (${seasonalPB.id})\n`);

    // =============================================
    // 8. APPLY PRICE BOOK TO QUOTE
    // =============================================
    console.log('8. Applying price book to a quote...');

    const quote = await TurboQuote.createQuote({
      name: 'Enterprise Quote — Demo Corp',
      companyId: company.id,
      contactId: contact.id,
      currency: 'USD',
      termDays: 30,
    });
    console.log(`  Quote: ${quote.quoteNumber}`);

    const quotePB = await TurboQuote.applyPriceBook(quote.id, priceBook.id);
    console.log(`  Applied price book: ${quotePB.priceBookId}\n`);

    // =============================================
    // 9. SEND QUOTE WITH DELIVERABLE (optional)
    // =============================================
    // sendQuoteWithDeliverable merges a TurboDocx-generated document
    // (e.g., a cover letter or SOW) with the quote PDF before sending.
    // Requires a real deliverableId — skip gracefully if not available.
    if (process.env.DELIVERABLE_ID) {
      console.log('9. Sending quote with deliverable...');
      const sendResult = await TurboQuote.sendQuoteWithDeliverable(quote.id, {
        deliverableId: process.env.DELIVERABLE_ID,
        mergePosition: 'beginning',
      });
      console.log(`  ✅ ${sendResult.message}`);
      if (sendResult.signatureDocumentId) {
        console.log(`  Signature Doc: ${sendResult.signatureDocumentId}`);
      }
      console.log();
    } else {
      console.log('9. Skipping sendQuoteWithDeliverable (set DELIVERABLE_ID env var to test)\n');
    }

    // =============================================
    // 10. REMOVE PRICE BOOK FROM QUOTE
    // =============================================
    console.log('10. Removing price book from quote...');

    const quoteNoPB = await TurboQuote.removePriceBook(quote.id);
    console.log(`  priceBookId is now: ${quoteNoPB.priceBookId}\n`);

    // =============================================
    // 11. CLEANUP
    // =============================================
    console.log('11. Cleaning up...');

    await TurboQuote.deleteQuote(quote.id);
    await TurboQuote.deletePriceBook(seasonalPB.id);
    await TurboQuote.deletePriceBook(priceBook.id);
    await TurboQuote.deleteContact(contact.id);
    await TurboQuote.deleteCompany(company.id);
    await TurboQuote.deleteProduct(product2.id);
    await TurboQuote.deleteProduct(product1.id);
    await TurboQuote.deleteType(productCategory.id);
    await TurboQuote.deleteType(pbType.id);

    console.log('  ✅ All test data removed');
    console.log('\n=== Price book example completed successfully! ===');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.statusCode) {
      console.error(`Status Code: ${error.statusCode}`);
    }
  }
}

priceBookExample();
