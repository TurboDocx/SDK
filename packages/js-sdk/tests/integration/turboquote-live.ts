/**
 * TurboQuote SDK — Live Integration Test
 *
 * Exercises every SDK method against a running backend and validates
 * response shapes match the TypeScript type contracts.
 *
 * Usage: npx ts-node tests/integration/turboquote-live.ts
 */

import { TurboQuote } from '../../src/modules/quote';

const API_KEY = 'TDX-b708c06a364d49da88a1f2c8daf4bc0e-04c7695298d927240d066adfcfd1b848318631f2816f222b28b858e87ff7ceb5';
const ORG_ID = 'b5a5c6b4-80c9-4ad8-bea8-4fb75c3e988c';
const BASE_URL = 'http://localhost:3000';

let passed = 0;
let failed = 0;
const failures: { method: string; error: string; details?: any }[] = [];

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function assertShape(obj: any, fields: Record<string, string>, label: string) {
  for (const [field, type] of Object.entries(fields)) {
    const val = obj[field];
    if (type === 'string') assert(typeof val === 'string', `${label}.${field} expected string, got ${typeof val}`);
    else if (type === 'string|null') assert(val === null || typeof val === 'string', `${label}.${field} expected string|null, got ${typeof val}: ${val}`);
    else if (type === 'number') assert(typeof val === 'number', `${label}.${field} expected number, got ${typeof val}`);
    else if (type === 'number|null') assert(val === null || typeof val === 'number', `${label}.${field} expected number|null, got ${typeof val}`);
    else if (type === 'boolean') assert(typeof val === 'boolean', `${label}.${field} expected boolean, got ${typeof val}`);
    else if (type === 'array') assert(Array.isArray(val), `${label}.${field} expected array, got ${typeof val}`);
    else if (type === 'object') assert(typeof val === 'object' && val !== null, `${label}.${field} expected object, got ${typeof val}`);
    else if (type === 'defined') assert(val !== undefined, `${label}.${field} expected defined, got undefined`);
  }
}

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err: any) {
    failed++;
    const msg = err?.message || String(err);
    failures.push({ method: name, error: msg, details: err?.response || err?.statusCode });
    console.log(`  ✗ ${name}`);
    console.log(`    → ${msg}`);
  }
}

async function run() {
  console.log('\n═══════════════════════════════════════════');
  console.log(' TurboQuote SDK — Live Integration Tests');
  console.log(' Target:', BASE_URL);
  console.log(' Org:', ORG_ID);
  console.log('═══════════════════════════════════════════\n');

  TurboQuote.configure({ apiKey: API_KEY, orgId: ORG_ID, baseUrl: BASE_URL });

  // Track created IDs for cleanup
  let categoryId: string = '';
  let companyId: string = '';
  let contactId: string = '';
  let productId: string = '';
  let bundleId: string = '';
  let priceBookId: string = '';
  let quoteId: string = '';
  let lineItemId: string = '';
  let templateId: string = '';

  // ─────────────────────────────────────────
  console.log('▸ Types / Categories');
  // ─────────────────────────────────────────

  await test('listTypes()', async () => {
    const result = await TurboQuote.listTypes({ categoryType: 'product_category' });
    assert(Array.isArray(result.results), 'results should be array');
    assert(typeof result.totalRecords === 'number', 'totalRecords should be number');
    if (result.results.length > 0) {
      assertShape(result.results[0], {
        id: 'string', orgId: 'string', name: 'string',
        categoryType: 'string', isDefault: 'boolean', isActive: 'boolean',
        createdOn: 'string', updatedOn: 'string',
      }, 'QuoteType');
    }
  });

  await test('createType()', async () => {
    const result = await TurboQuote.createType({ name: 'SDK Test Category', categoryType: 'product_category' });
    assertShape(result, {
      id: 'string', orgId: 'string', name: 'string',
      categoryType: 'string', isActive: 'boolean',
    }, 'QuoteType');
    categoryId = result.id;
  });

  await test('updateType()', async () => {
    const result = await TurboQuote.updateType(categoryId, { name: 'SDK Test Category Updated' });
    assert(result.name === 'SDK Test Category Updated', `name should be updated, got: ${result.name}`);
  });

  // ─────────────────────────────────────────
  console.log('\n▸ Companies');
  // ─────────────────────────────────────────

  await test('listCompanies()', async () => {
    const result = await TurboQuote.listCompanies();
    assert(Array.isArray(result.results), 'results should be array');
    assert(typeof result.totalRecords === 'number', 'totalRecords should be number');
  });

  await test('createCompany()', async () => {
    const result = await TurboQuote.createCompany({
      name: 'SDK Test Company',
      contacts: [{ name: 'Test Contact', email: 'test@sdktest.com' }],
    });
    assertShape(result, {
      id: 'string', orgId: 'string', name: 'string', isActive: 'boolean',
      createdOn: 'string', updatedOn: 'string',
    }, 'Company');
    companyId = result.id;
  });

  await test('getCompany()', async () => {
    const result = await TurboQuote.getCompany(companyId);
    assert(result.id === companyId, 'id mismatch');
    assert(result.name === 'SDK Test Company', 'name mismatch');
  });

  await test('updateCompany()', async () => {
    const result = await TurboQuote.updateCompany(companyId, { name: 'SDK Test Company Updated' });
    assert(result.name === 'SDK Test Company Updated', 'name not updated');
  });

  await test('listCompanyContacts()', async () => {
    const result = await TurboQuote.listCompanyContacts(companyId);
    assert(Array.isArray(result.results), 'results should be array');
    assert(result.results.length > 0, 'should have at least 1 contact from company creation');
    contactId = result.results[0].id;
  });

  // ─────────────────────────────────────────
  console.log('\n▸ Contacts');
  // ─────────────────────────────────────────

  await test('listContacts()', async () => {
    const result = await TurboQuote.listContacts();
    assert(Array.isArray(result.results), 'results should be array');
    assert(typeof result.totalRecords === 'number', 'totalRecords should be number');
  });

  await test('createContact()', async () => {
    const result = await TurboQuote.createContact({
      name: 'SDK Contact 2',
      companyId: companyId,
      email: 'contact2@sdktest.com',
    });
    assertShape(result, {
      id: 'string', orgId: 'string', companyId: 'string',
      name: 'string', isActive: 'boolean',
    }, 'Contact');
    contactId = result.id; // use this contact going forward
  });

  await test('updateContact()', async () => {
    const result = await TurboQuote.updateContact(contactId, { name: 'SDK Contact 2 Updated' });
    assert(result.name === 'SDK Contact 2 Updated', 'name not updated');
  });

  // ─────────────────────────────────────────
  console.log('\n▸ Products');
  // ─────────────────────────────────────────

  await test('listProducts()', async () => {
    const result = await TurboQuote.listProducts();
    assert(Array.isArray(result.results), 'results should be array');
    assert(typeof result.totalRecords === 'number', 'totalRecords should be number');
    assert(typeof result.totalProducts === 'number', 'totalProducts expected');
    assert(typeof result.activeProducts === 'number', 'activeProducts expected');
    assert(typeof result.totalCategories === 'number', 'totalCategories expected');
    assert(typeof result.catalogValue === 'number', 'catalogValue expected');
  });

  await test('createProduct()', async () => {
    const result = await TurboQuote.createProduct({
      name: 'SDK Test Product',
      listPrice: 99.99,
      billingFrequency: 'monthly',
      categoryId: categoryId,
    });
    assertShape(result, {
      id: 'string', orgId: 'string', name: 'string',
      listPrice: 'number', billingFrequency: 'string',
      categoryId: 'string', isActive: 'boolean',
      createdOn: 'string', updatedOn: 'string',
    }, 'Product');
    productId = result.id;
  });

  await test('getProduct()', async () => {
    const result = await TurboQuote.getProduct(productId);
    assert(result.id === productId, 'id mismatch');
    assert(result.name === 'SDK Test Product', 'name mismatch');
  });

  await test('updateProduct()', async () => {
    const result = await TurboQuote.updateProduct(productId, { name: 'SDK Test Product Updated', listPrice: 149.99 });
    assert(result.name === 'SDK Test Product Updated', 'name not updated');
    assert(result.listPrice === 149.99, `listPrice not updated, got ${result.listPrice}`);
  });

  await test('duplicateProduct()', async () => {
    const result = await TurboQuote.duplicateProduct(productId);
    assert(result.id !== productId, 'duplicate should have new id');
    assert(result.name.includes('SDK Test Product'), 'duplicate should have similar name');
    // cleanup duplicate
    await TurboQuote.deleteProduct(result.id);
  });

  await test('getProductPrimaryImages()', async () => {
    const result = await TurboQuote.getProductPrimaryImages([productId]);
    assert(typeof result === 'object', 'should be an object');
    // The product has no images, so expect null or the key to exist
    assert(productId in result || Object.keys(result).length === 0, 'should contain productId key or be empty');
  });

  // ─────────────────────────────────────────
  console.log('\n▸ Bundles');
  // ─────────────────────────────────────────

  await test('listBundles()', async () => {
    const result = await TurboQuote.listBundles();
    assert(Array.isArray(result.results), 'results should be array');
    assert(typeof result.totalRecords === 'number', 'totalRecords should be number');
    assert(typeof result.totalBundles === 'number', 'totalBundles expected');
    assert(typeof result.activeBundles === 'number', 'activeBundles expected');
  });

  await test('createBundle()', async () => {
    const result = await TurboQuote.createBundle({
      name: 'SDK Test Bundle',
      categoryId: categoryId,
      items: [{
        productId: productId,
        unitPrice: 99.99,
        billingFrequency: 'monthly',
        quantity: 1,
      }],
    });
    assertShape(result, {
      id: 'string', orgId: 'string', name: 'string',
      isActive: 'boolean', createdOn: 'string', updatedOn: 'string',
    }, 'Bundle');
    bundleId = result.id;
  });

  await test('getBundle()', async () => {
    const result = await TurboQuote.getBundle(bundleId);
    assert(result.id === bundleId, 'id mismatch');
    assert(result.name === 'SDK Test Bundle', 'name mismatch');
  });

  await test('updateBundle()', async () => {
    const result = await TurboQuote.updateBundle(bundleId, { name: 'SDK Test Bundle Updated' });
    assert(result.name === 'SDK Test Bundle Updated', 'name not updated');
  });

  await test('duplicateBundle()', async () => {
    const result = await TurboQuote.duplicateBundle(bundleId);
    assert(result.id !== bundleId, 'duplicate should have new id');
    await TurboQuote.deleteBundle(result.id);
  });

  // ─────────────────────────────────────────
  console.log('\n▸ Price Books');
  // ─────────────────────────────────────────

  // Need a pricebook_type category for pricebooks
  let priceBookTypeId: string = '';
  await test('createType(pricebook_type)', async () => {
    const result = await TurboQuote.createType({ name: 'SDK PB Type', categoryType: 'pricebook_type' });
    priceBookTypeId = result.id;
    assert(result.categoryType === 'pricebook_type', 'wrong categoryType');
  });

  await test('listPriceBooks()', async () => {
    const result = await TurboQuote.listPriceBooks();
    assert(Array.isArray(result.results), 'results should be array');
    assert(typeof result.totalRecords === 'number', 'totalRecords should be number');
    assert(typeof result.totalPriceBooks === 'number', 'totalPriceBooks expected');
    assert(typeof result.activeInBuilder === 'number', 'activeInBuilder expected');
  });

  await test('createPriceBook()', async () => {
    const result = await TurboQuote.createPriceBook({
      name: 'SDK Test PriceBook',
      priceBookTypeId: priceBookTypeId,
      validFrom: new Date().toISOString(),
      discountPercent: 10,
      productPricing: [{
        productId: productId,
        discountPercent: 15,
        finalPrice: 84.99,
      }],
    });
    assertShape(result, {
      id: 'string', orgId: 'string', name: 'string',
      discountPercent: 'number', isActive: 'boolean',
    }, 'PriceBook');
    priceBookId = result.id;
  });

  await test('getPriceBook()', async () => {
    const result = await TurboQuote.getPriceBook(priceBookId);
    assert(result.id === priceBookId, 'id mismatch');
    assert(result.name === 'SDK Test PriceBook', 'name mismatch');
  });

  await test('updatePriceBook()', async () => {
    const result = await TurboQuote.updatePriceBook(priceBookId, { name: 'SDK Test PriceBook Updated' });
    assert(result.name === 'SDK Test PriceBook Updated', 'name not updated');
  });

  await test('listPriceBookProducts()', async () => {
    const result = await TurboQuote.listPriceBookProducts(priceBookId);
    assert(Array.isArray(result.results), 'results should be array');
    assert(typeof result.totalRecords === 'number', 'totalRecords should be number');
  });

  await test('duplicatePriceBook()', async () => {
    const result = await TurboQuote.duplicatePriceBook(priceBookId);
    assert(result.id !== priceBookId, 'duplicate should have new id');
    await TurboQuote.deletePriceBook(result.id);
  });

  // ─────────────────────────────────────────
  console.log('\n▸ Quotes');
  // ─────────────────────────────────────────

  await test('listQuotes()', async () => {
    const result = await TurboQuote.listQuotes();
    assert(Array.isArray(result.results), 'results should be array');
    assert(typeof result.totalRecords === 'number', 'totalRecords should be number');
    assertShape(result.stats, {
      total: 'number', draft: 'number', sent: 'number',
      accepted: 'number', declined: 'number', voided: 'number',
      activeQuotes: 'number', winRate: 'number', quotesThisMonth: 'number',
    }, 'QuoteListStats');
    assert(Array.isArray(result.stats.totalPipeline), 'totalPipeline should be array');
    assert(Array.isArray(result.stats.monthlyRecurringRevenue), 'MRR should be array');
  });

  await test('listQuotes(statuses filter)', async () => {
    const result = await TurboQuote.listQuotes({ statuses: ['draft', 'sent'] });
    assert(Array.isArray(result.results), 'results should be array');
  });

  await test('createQuote()', async () => {
    const result = await TurboQuote.createQuote({
      name: 'SDK Test Quote',
      companyId: companyId,
      contactId: contactId,
      currency: 'USD',
      termDays: 30,
    });
    assertShape(result, {
      id: 'string', orgId: 'string', quoteNumber: 'string',
      name: 'string', status: 'string', companyId: 'string',
      contactId: 'string', currency: 'string',
      subtotalMonthly: 'number', subtotalQuarterly: 'number',
      subtotalAnnual: 'number', subtotalOneTime: 'number',
      taxAmount: 'number', grandTotal: 'number',
      isActive: 'boolean', createdOn: 'string', updatedOn: 'string',
    }, 'Quote');
    assert(result.status === 'draft', `expected draft status, got ${result.status}`);
    quoteId = result.id;
  });

  await test('getQuote() + statusInfo', async () => {
    const result = await TurboQuote.getQuote(quoteId);
    assert(result.id === quoteId, 'id mismatch');
    assert(result.statusInfo !== undefined, 'statusInfo should be populated');
    if (result.statusInfo) {
      assertShape(result.statusInfo, {
        currentStatus: 'string',
        canSend: 'boolean', canAccept: 'boolean',
        canDecline: 'boolean', canVoid: 'boolean',
        isTerminal: 'boolean',
      }, 'QuoteStatusInfo');
    }
  });

  await test('updateQuote()', async () => {
    const result = await TurboQuote.updateQuote(quoteId, { name: 'SDK Test Quote Updated', taxRate: 8.5 });
    assert(result.name === 'SDK Test Quote Updated', 'name not updated');
  });

  await test('duplicateQuote()', async () => {
    const dup = await TurboQuote.duplicateQuote(quoteId);
    assert(dup.id !== quoteId, 'duplicate should have new id');
    assert(dup.status === 'draft', 'duplicate should be draft');
    // cleanup
    await TurboQuote.deleteQuote(dup.id);
  });

  // ─────────────────────────────────────────
  console.log('\n▸ Line Items');
  // ─────────────────────────────────────────

  await test('addLineItems(single)', async () => {
    const result = await TurboQuote.addLineItems(quoteId, {
      productId: productId,
      productName: 'SDK Test Product Updated',
      unitPrice: 149.99,
      billingFrequency: 'monthly',
      quantity: 2,
    });
    assert(Array.isArray(result), 'should return array');
    assert(result.length === 1, `expected 1 item, got ${result.length}`);
    assertShape(result[0], {
      id: 'string', quoteId: 'string', productName: 'string',
      unitPrice: 'number', quantity: 'number', subtotal: 'number',
      billingFrequency: 'string', isActive: 'boolean',
    }, 'LineItem');
    lineItemId = result[0].id;
  });

  await test('addLineItems(batch)', async () => {
    const result = await TurboQuote.addLineItems(quoteId, [
      { productId: null, productName: 'Custom Item 1', unitPrice: 50, billingFrequency: 'one-time' },
      { productId: null, productName: 'Custom Item 2', unitPrice: 75, billingFrequency: 'annual' },
    ]);
    assert(Array.isArray(result), 'should return array');
    assert(result.length === 2, `expected 2 items, got ${result.length}`);
  });

  await test('addBundleLineItems()', async () => {
    const result = await TurboQuote.addBundleLineItems(quoteId, {
      bundleId: bundleId,
      bundleName: 'SDK Test Bundle Updated',
      quantity: 1,
    });
    assert(Array.isArray(result), 'should return array');
    assert(result.length >= 1, 'should return at least 1 bundle line item');
  });

  await test('listLineItems()', async () => {
    const result = await TurboQuote.listLineItems(quoteId);
    assert(Array.isArray(result.results), 'results should be array');
    assert(typeof result.totalRecords === 'number', 'totalRecords should be number');
    assert(result.results.length >= 4, `expected at least 4 line items, got ${result.results.length}`);
  });

  await test('updateLineItem()', async () => {
    const result = await TurboQuote.updateLineItem(quoteId, lineItemId, { quantity: 5, unitPrice: 129.99 });
    assert(result.quantity === 5, `quantity not updated, got ${result.quantity}`);
    assert(result.unitPrice === 129.99, `unitPrice not updated, got ${result.unitPrice}`);
  });

  await test('removeLineItem()', async () => {
    const result = await TurboQuote.removeLineItem(quoteId, lineItemId);
    assert(typeof result.message === 'string', 'should have message');
  });

  // ─────────────────────────────────────────
  console.log('\n▸ Quote — Price Book Operations');
  // ─────────────────────────────────────────

  await test('applyPriceBook()', async () => {
    const result = await TurboQuote.applyPriceBook(quoteId, priceBookId);
    assertShape(result, {
      message: 'string',
      updatedCount: 'number',
      skippedCount: 'number',
    }, 'ApplyPriceBookResponse');
    assert(result.quote !== undefined, 'should have quote');
  });

  await test('removePriceBook()', async () => {
    const result = await TurboQuote.removePriceBook(quoteId);
    assert(result.id === quoteId, 'should return the quote');
  });

  // ─────────────────────────────────────────
  console.log('\n▸ Quote — Status Transitions');
  // ─────────────────────────────────────────

  await test('sendQuote()', async () => {
    const result = await TurboQuote.sendQuote(quoteId);
    assertShape(result, { message: 'string' }, 'SendQuoteResponse');
    assert(result.quote !== undefined, 'should have quote');
    assert(result.quote.status === 'sent', `expected sent status, got ${result.quote.status}`);
  });

  await test('declineQuote()', async () => {
    const result = await TurboQuote.declineQuote(quoteId, { reason: 'SDK integration test' });
    assert(result.status === 'declined', `expected declined status, got ${result.status}`);
  });

  // Create another quote for void test
  let voidQuoteId = '';
  await test('voidQuote()', async () => {
    const q = await TurboQuote.createQuote({
      name: 'SDK Void Test',
      companyId: companyId,
      contactId: contactId,
    });
    voidQuoteId = q.id;
    // Add a line item so we can send it
    await TurboQuote.addLineItems(voidQuoteId, {
      productId: null, productName: 'Void test item', unitPrice: 10, billingFrequency: 'one-time',
    });
    await TurboQuote.sendQuote(voidQuoteId);
    const result = await TurboQuote.voidQuote(voidQuoteId, { reason: 'SDK void test' });
    assert(result.status === 'voided', `expected voided status, got ${result.status}`);
  });

  // ─────────────────────────────────────────
  console.log('\n▸ Quote — PDF');
  // ─────────────────────────────────────────

  await test('downloadQuotePdf()', async () => {
    // Use the sent/declined quote
    const result = await TurboQuote.downloadQuotePdf(quoteId);
    assert(result instanceof ArrayBuffer, 'should return ArrayBuffer');
    assert(result.byteLength > 0, 'PDF should not be empty');
  });

  // ─────────────────────────────────────────
  console.log('\n▸ Templates');
  // ─────────────────────────────────────────

  await test('listTemplates()', async () => {
    const result = await TurboQuote.listTemplates();
    assert(Array.isArray(result.results), 'results should be array');
    assert(typeof result.totalRecords === 'number', 'totalRecords should be number');
  });

  await test('listTemplates(with query)', async () => {
    const result = await TurboQuote.listTemplates({ limit: 5, offset: 0 });
    assert(Array.isArray(result.results), 'results should be array');
  });

  await test('getTemplate()', async () => {
    const result = await TurboQuote.getTemplate();
    assertShape(result, {
      id: 'string', orgId: 'string', primaryColor: 'string',
      isActive: 'boolean', createdOn: 'string', updatedOn: 'string',
    }, 'QuoteTemplate');
    templateId = result.id;
  });

  await test('getTemplateById()', async () => {
    if (!templateId) { console.log('    (skipped — no template available)'); return; }
    const result = await TurboQuote.getTemplateById(templateId);
    assert(result.id === templateId, 'id mismatch');
  });

  await test('createTemplate()', async () => {
    const result = await TurboQuote.createTemplate({
      primaryColor: '#123456',
      senderName: 'SDK Test Sender',
    });
    assertShape(result, {
      id: 'string', orgId: 'string', primaryColor: 'string',
    }, 'QuoteTemplate');
    assert(result.primaryColor === '#123456', `color mismatch: ${result.primaryColor}`);
    templateId = result.id;
  });

  await test('updateTemplate()', async () => {
    const result = await TurboQuote.updateTemplate(templateId, { primaryColor: '#654321' });
    assert(result.primaryColor === '#654321', 'color not updated');
  });

  await test('deleteTemplate()', async () => {
    const result = await TurboQuote.deleteTemplate(templateId);
    assert(typeof result.message === 'string', 'should have message');
  });

  // ─────────────────────────────────────────
  console.log('\n▸ Convenience — createAndSend');
  // ─────────────────────────────────────────

  await test('createAndSend()', async () => {
    const result = await TurboQuote.createAndSend({
      name: 'SDK CreateAndSend Test',
      companyId: companyId,
      contactId: contactId,
      items: [
        { productId: null, productName: 'Quick item', unitPrice: 200, billingFrequency: 'one-time' },
      ],
    });
    assert(result.quote !== undefined, 'should have quote');
    assert(result.quote.status === 'sent', `expected sent, got ${result.quote.status}`);
    // cleanup
    await TurboQuote.voidQuote(result.quote.id, { reason: 'cleanup' });
    await TurboQuote.deleteQuote(result.quote.id);
  });

  // ─────────────────────────────────────────
  console.log('\n▸ Cleanup');
  // ─────────────────────────────────────────

  await test('deleteQuote()', async () => {
    const result = await TurboQuote.deleteQuote(quoteId);
    assert(typeof result.message === 'string', 'should have message');
  });

  if (voidQuoteId) {
    await test('deleteQuote(void test)', async () => {
      const result = await TurboQuote.deleteQuote(voidQuoteId);
      assert(typeof result.message === 'string', 'should have message');
    });
  }

  await test('deleteBundle()', async () => {
    const result = await TurboQuote.deleteBundle(bundleId);
    assert(typeof result.message === 'string', 'should have message');
  });

  await test('deletePriceBook()', async () => {
    const result = await TurboQuote.deletePriceBook(priceBookId);
    assert(typeof result.message === 'string', 'should have message');
  });

  await test('deleteProduct()', async () => {
    const result = await TurboQuote.deleteProduct(productId);
    assert(typeof result.message === 'string', 'should have message');
  });

  await test('deleteContact()', async () => {
    const result = await TurboQuote.deleteContact(contactId);
    assert(typeof result.message === 'string', 'should have message');
  });

  await test('deleteCompany()', async () => {
    const result = await TurboQuote.deleteCompany(companyId);
    assert(typeof result.message === 'string', 'should have message');
  });

  await test('deleteType(product_category)', async () => {
    const result = await TurboQuote.deleteType(categoryId);
    assert(typeof result.message === 'string', 'should have message');
  });

  await test('deleteType(pricebook_type)', async () => {
    const result = await TurboQuote.deleteType(priceBookTypeId);
    assert(typeof result.message === 'string', 'should have message');
  });

  // ─────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log(` Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════');

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  • ${f.method}: ${f.error}`);
      if (f.details) console.log(`    details: ${JSON.stringify(f.details).slice(0, 200)}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
