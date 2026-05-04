/**
 * TurboQuote Example: Price Books & Quote Pricing
 *
 * This example demonstrates price book management and quote pricing:
 * - createType() — create pricebook_type category
 * - createProduct() — set up products for pricing overrides
 * - createPriceBook() — with product-level pricing
 * - listPriceBooks(), getPriceBook() — browse price books
 * - updatePriceBook() — change discounts and product pricing
 * - listPriceBookProducts() — see resolved product pricing
 * - duplicatePriceBook() — create seasonal variant
 * - createQuote(), applyPriceBook(), removePriceBook() — pricing on quotes
 * - sendQuoteWithDeliverable() — send quote merged with a TurboDocx deliverable
 * - deleteQuote(), deletePriceBook(), deleteProduct(), deleteType() — cleanup
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
    // 2. SET UP — pricebook type + products
    // =============================================
    console.log('2. Setting up prerequisites...');

    const pbType = await TurboQuote.createType({
      name: 'Customer Tier',
      categoryType: 'pricebook_type',
    });
    console.log(`  Price book type created: ${pbType.name} (${pbType.id})`);

    const productCategory = await TurboQuote.createType({
      name: 'Cloud Services',
      categoryType: 'product_category',
    });
    console.log(`  Product category created: ${productCategory.name}`);

    const product1 = await TurboQuote.createProduct({
      name: 'Cloud Storage (1TB)',
      listPrice: 99.99,
      billingFrequency: 'monthly',
      sku: 'CLD-STR-1TB',
      categoryId: productCategory.id,
      currency: 'USD',
    });
    console.log(`  Product 1 created: ${product1.name} — $${product1.listPrice}/mo`);

    const product2 = await TurboQuote.createProduct({
      name: 'API Gateway',
      listPrice: 199.99,
      billingFrequency: 'monthly',
      sku: 'API-GW-001',
      categoryId: productCategory.id,
      currency: 'USD',
    });
    console.log(`  Product 2 created: ${product2.name} — $${product2.listPrice}/mo\n`);

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

    console.log('Price book created!');
    console.log(`  ID: ${priceBook.id}`);
    console.log(`  Name: ${priceBook.name}`);
    console.log(`  Default Discount: ${priceBook.discountPercent}%`);
    console.log(`  Valid: ${priceBook.validFrom} to ${priceBook.validTo}`);
    console.log(`  Show in Quote Builder: ${priceBook.showInQuoteBuilder}\n`);

    // =============================================
    // 4. LIST & GET PRICE BOOKS
    // =============================================
    console.log('4. Listing price books...');

    const priceBooks = await TurboQuote.listPriceBooks({
      showInQuoteBuilder: true,
      limit: 10,
    });

    console.log(`Found ${priceBooks.totalRecords} price book(s) visible in quote builder:`);
    for (const pb of priceBooks.results) {
      console.log(`  - ${pb.name}: ${pb.discountPercent}% default discount`);
    }
    console.log();

    const pbDetail = await TurboQuote.getPriceBook(priceBook.id);
    console.log(`Price book detail: ${pbDetail.name}`);
    console.log(`  Description: ${pbDetail.description}`);
    if (pbDetail.productPricing) {
      console.log(`  Product pricing overrides: ${pbDetail.productPricing.length}`);
      for (const pp of pbDetail.productPricing) {
        if (pp.discountPercent !== undefined) {
          console.log(`    - Product ${pp.productId}: ${pp.discountPercent}% discount`);
        }
        if (pp.finalPrice !== undefined) {
          console.log(`    - Product ${pp.productId}: fixed $${pp.finalPrice}`);
        }
      }
    }
    console.log();

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

    console.log('Price book updated!');
    console.log(`  New Default Discount: ${updatedPB.discountPercent}%`);
    console.log(`  Description: ${updatedPB.description}\n`);

    // =============================================
    // 6. LIST PRICE BOOK PRODUCTS
    // =============================================
    console.log('6. Listing price book products...');

    const pbProducts = await TurboQuote.listPriceBookProducts(priceBook.id, { limit: 10 });

    console.log(`Price book has ${pbProducts.totalRecords} product pricing override(s):`);
    for (const pp of pbProducts.results) {
      const pricing = pp.finalPrice !== undefined
        ? `fixed $${pp.finalPrice}`
        : `${pp.discountPercent}% discount`;
      console.log(`  - Product ${pp.productId}: ${pricing}`);
    }
    console.log();

    // =============================================
    // 7. DUPLICATE PRICE BOOK
    // =============================================
    console.log('7. Duplicating price book for seasonal variant...');

    const seasonalPB = await TurboQuote.duplicatePriceBook(priceBook.id);

    console.log('Price book duplicated!');
    console.log(`  Original: ${priceBook.name} (${priceBook.id})`);
    console.log(`  Copy: ${seasonalPB.name} (${seasonalPB.id})\n`);

    // =============================================
    // 8. APPLY PRICE BOOK TO QUOTE
    // =============================================
    console.log('8. Creating quote and applying price book...');

    const quote = await TurboQuote.createQuote({
      name: 'Enterprise Quote — Acme Corp',
      companyId: process.env.COMPANY_ID || 'your-company-id-here',
      contactId: process.env.CONTACT_ID || 'your-contact-id-here',
      currency: 'USD',
      termDays: 30,
    });
    console.log(`  Quote created: ${quote.quoteNumber}`);

    const quotePB = await TurboQuote.applyPriceBook(quote.id, priceBook.id);
    console.log(`  Price book applied: ${quotePB.priceBookId}`);
    console.log(`  Quote price book ID is now: ${quotePB.priceBookId}\n`);

    // =============================================
    // 9. SEND QUOTE WITH DELIVERABLE
    // =============================================
    console.log('9. Sending quote merged with a TurboDocx deliverable...');

    // sendQuoteWithDeliverable merges a TurboDocx-generated document
    // (e.g., a cover letter or SOW) with the quote PDF before sending
    try {
      const sendResult = await TurboQuote.sendQuoteWithDeliverable(quote.id, {
        deliverableId: process.env.DELIVERABLE_ID || 'your-deliverable-id-here',
        mergePosition: 'beginning',
      });

      console.log('✅ Quote sent with deliverable!');
      console.log(`  Message: ${sendResult.message}`);
      if (sendResult.signatureDocumentId) {
        console.log(`  Signature Document ID: ${sendResult.signatureDocumentId}`);
      }
    } catch (sendError: any) {
      console.log(`  (Skipped — sendQuoteWithDeliverable requires a real deliverable ID)`);
      console.log(`  Error: ${sendError.message}`);
    }
    console.log();

    // =============================================
    // 10. REMOVE PRICE BOOK FROM QUOTE
    // =============================================
    console.log('10. Removing price book from quote...');

    const quoteNoPB = await TurboQuote.removePriceBook(quote.id);
    console.log(`  Price book removed. priceBookId is now: ${quoteNoPB.priceBookId}\n`);

    // =============================================
    // 11. CLEANUP
    // =============================================
    console.log('11. Cleaning up...');

    await TurboQuote.deleteQuote(quote.id);
    console.log(`  Deleted quote: ${quote.quoteNumber}`);

    await TurboQuote.deletePriceBook(seasonalPB.id);
    console.log(`  Deleted price book: ${seasonalPB.name}`);

    await TurboQuote.deletePriceBook(priceBook.id);
    console.log(`  Deleted price book: ${priceBook.name}`);

    await TurboQuote.deleteProduct(product2.id);
    console.log(`  Deleted product: ${product2.name}`);

    await TurboQuote.deleteProduct(product1.id);
    console.log(`  Deleted product: ${product1.name}`);

    await TurboQuote.deleteType(productCategory.id);
    console.log(`  Deleted type: ${productCategory.name}`);

    await TurboQuote.deleteType(pbType.id);
    console.log(`  Deleted type: ${pbType.name}`);

    console.log('\n=== Price book example completed successfully! ===');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.statusCode) {
      console.error(`Status Code: ${error.statusCode}`);
    }
  }
}

// Run the example
priceBookExample();
