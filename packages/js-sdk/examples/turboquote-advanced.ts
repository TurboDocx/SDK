/**
 * TurboQuote Example: Templates, Types, CRM & Quote Status Transitions
 *
 * Fully self-contained — creates all data it needs, then cleans up.
 * Just add your API key and run.
 *
 * Methods demonstrated:
 * - configure()
 * - getTemplate(), updateTemplate(), deleteTemplate()
 * - createType(), listTypes(), updateType(), deleteType()
 * - createCompany(), getCompany(), updateCompany(), listCompanyContacts(), deleteCompany()
 * - createContact(), updateContact(), deleteContact()
 * - createProduct(), deleteProduct()
 * - createQuote(), addLineItems(), updateLineItem(), removeLineItem()
 * - sendQuote(), declineQuote(), voidQuote(), handleExpiredQuote()
 * - duplicateQuote(), deleteQuote()
 *
 * Run: npx tsx examples/turboquote-advanced.ts
 */

import { TurboQuote } from '@turbodocx/sdk';

async function advancedExample(): Promise<void> {
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
    // 2. QUOTE TEMPLATE — branding & terms
    // =============================================
    console.log('2. Managing quote template...');

    // getTemplate() auto-provisions: if the org has no template yet, the API creates one from the
    // org's branding and returns it. So there is always a template to update, and createTemplate()
    // is effectively unreachable — on an established org it returns 400 TEMPLATE_ALREADY_EXISTS.
    // The correct flow is getTemplate() -> updateTemplate().
    const template = await TurboQuote.getTemplate();
    console.log(`  Template: ${template.id}`);

    const updatedTemplate = await TurboQuote.updateTemplate(template.id, {
      primaryColor: '#1a73e8',
      primaryTextColor: '#ffffff',
      disclaimer: 'Prices valid for 30 days from issue date.',
      termsAndConditions: 'Payment due within 30 days of acceptance.',
      closingMessage: 'Thank you for choosing us!',
      senderName: 'Sales Team',
      senderEmail: 'sales@yourcompany.com',
      senderPhone: '+1-555-0100',
      contactEmail: 'support@yourcompany.com',
    });
    console.log(`  Updated closing message: ${updatedTemplate.closingMessage}\n`);

    // =============================================
    // 3. TYPES & CATEGORIES
    // =============================================
    console.log('3. Managing types & categories...');

    const industryType = await TurboQuote.createType({
      name: 'Technology',
      categoryType: 'company_industry',
    });
    console.log(`  Industry: ${industryType.name} (${industryType.id})`);

    const industries = await TurboQuote.listTypes({
      categoryType: 'company_industry',
      includeUsage: true,
    });
    console.log(`  ${industries.totalRecords} industry type(s) in org`);

    const updatedType = await TurboQuote.updateType(industryType.id, {
      name: 'Technology & SaaS',
    });
    console.log(`  Renamed to: ${updatedType.name}\n`);

    // =============================================
    // 4. CRM SETUP — company, contact, product
    // =============================================
    console.log('4. Setting up CRM and catalog...');

    const company = await TurboQuote.createCompany({
      name: 'TechStart Inc',
      contacts: [{ name: 'Alex Johnson', email: 'alex@techstart.com' }],
      city: 'Austin',
      state: 'TX',
      country: 'US',
      industryId: industryType.id,
    });

    const companyDetail = await TurboQuote.getCompany(company.id);
    console.log(`  Company: ${companyDetail.name}, ${companyDetail.city}, ${companyDetail.state}`);

    const updatedCompany = await TurboQuote.updateCompany(company.id, { phone: '+1-555-0300' });
    console.log(`  Phone updated: ${updatedCompany.phone}`);

    const contact = await TurboQuote.createContact({
      name: 'Alex Johnson',
      companyId: company.id,
      email: 'alex@techstart.com',
      title: 'CTO',
    });
    console.log(`  Contact: ${contact.name}`);

    const updatedContact = await TurboQuote.updateContact(contact.id, {
      title: 'VP of Engineering',
      phone: '+1-555-0200',
    });
    console.log(`  Title updated: ${updatedContact.title}`);

    const companyContacts = await TurboQuote.listCompanyContacts(company.id);
    console.log(`  ${companyContacts.totalRecords} contact(s) for ${company.name}`);

    const productCategory = await TurboQuote.createType({
      name: 'Consulting',
      categoryType: 'product_category',
    });

    const product = await TurboQuote.createProduct({
      name: 'Consulting Service',
      listPrice: 500.00,
      billingFrequency: 'monthly',
      categoryId: productCategory.id,
      currency: 'USD',
    });
    console.log(`  Product: ${product.name} — $${product.listPrice}/mo\n`);

    // =============================================
    // 5. QUOTE STATUS TRANSITIONS
    // =============================================
    console.log('5. Demonstrating quote status transitions...');

    // --- Decline flow ---
    const quote1 = await TurboQuote.createQuote({
      name: 'Status Demo — Decline Flow',
      companyId: company.id,
      contactId: contact.id,
      currency: 'USD',
    });
    console.log(`  Created: ${quote1.quoteNumber} (${quote1.status})`);

    // Add a line item, then remove it (demonstrating removeLineItem)
    const lineItems = await TurboQuote.addLineItems(quote1.id, {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.listPrice,
      billingFrequency: 'monthly',
    });
    console.log(`  Added line item: ${lineItems[0].id}`);

    // Update line item — set a flat-dollar discount and display order
    const updatedItem = await TurboQuote.updateLineItem(quote1.id, lineItems[0].id, {
      discountType: 'amount',
      discountAmount: 50,
      displayOrder: 0,
    });
    console.log(`  Discount updated: ${updatedItem.discountType} $${updatedItem.discountAmount}`);

    await TurboQuote.removeLineItem(quote1.id, lineItems[0].id);
    console.log(`  Removed line item: ${lineItems[0].id}`);

    // Re-add for sending
    await TurboQuote.addLineItems(quote1.id, {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.listPrice,
      billingFrequency: 'monthly',
    });

    const sent1 = await TurboQuote.sendQuote(quote1.id);
    console.log(`  Sent: ${sent1.message}`);

    const declined = await TurboQuote.declineQuote(quote1.id, { reason: 'Budget not approved' });
    console.log(`  Declined: ${declined.status}`);

    // --- Void flow ---
    const quote2 = await TurboQuote.createQuote({
      name: 'Status Demo — Void Flow',
      companyId: company.id,
      contactId: contact.id,
      currency: 'USD',
    });

    await TurboQuote.addLineItems(quote2.id, {
      productId: product.id,
      productName: product.name,
      quantity: 2,
      unitPrice: product.listPrice,
      billingFrequency: 'monthly',
    });

    await TurboQuote.sendQuote(quote2.id);
    const voided = await TurboQuote.voidQuote(quote2.id, { reason: 'Replaced by updated pricing' });
    console.log(`  Voided: ${voided.status}`);

    // Handle expired quote (may fail if quote is not in expired state)
    try {
      await TurboQuote.handleExpiredQuote(quote1.id, {
        action: 'void',
        reason: 'Quote expired, issuing replacement',
        newValidUntil: '2026-12-31',
      });
      console.log('  Expired quote handled');
    } catch {
      console.log('  (handleExpiredQuote skipped — quote not in expired state)');
    }
    console.log();

    // =============================================
    // 6. DUPLICATE A QUOTE
    // =============================================
    console.log('6. Duplicating voided quote...');

    const duplicated = await TurboQuote.duplicateQuote(quote2.id);
    console.log(`  Original: ${quote2.quoteNumber} (${voided.status})`);
    console.log(`  Copy: ${duplicated.quoteNumber} (${duplicated.status})\n`);

    // =============================================
    // 7. CLEANUP
    // =============================================
    console.log('7. Cleaning up...');

    await TurboQuote.deleteQuote(duplicated.id);
    await TurboQuote.deleteQuote(quote2.id);
    await TurboQuote.deleteQuote(quote1.id);
    // deleteTemplate is really "reset to org branding defaults" — the next getTemplate() call
    // regenerates a template from the org's branding.
    await TurboQuote.deleteTemplate(template.id);
    await TurboQuote.deleteProduct(product.id);
    await TurboQuote.deleteContact(contact.id);
    await TurboQuote.deleteCompany(company.id);
    await TurboQuote.deleteType(productCategory.id);
    await TurboQuote.deleteType(industryType.id);

    console.log('  All test data removed');
    console.log('\n=== Advanced example completed successfully! ===');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.statusCode) {
      console.error(`Status Code: ${error.statusCode}`);
    }
  }
}

advancedExample();
