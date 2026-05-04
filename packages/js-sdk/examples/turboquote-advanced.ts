/**
 * TurboQuote Example: Templates, Workflows, Approvals & Status Transitions
 *
 * Fully self-contained — creates all data it needs, then cleans up.
 * Just add your API key and run.
 *
 * Methods demonstrated:
 * - configure()
 * - getTemplate(), createTemplate(), updateTemplate(), deleteTemplate()
 * - createType(), listTypes(), updateType(), deleteType()
 * - createCompany(), getCompany(), updateCompany(), listCompanyContacts(), deleteCompany()
 * - createContact(), updateContact(), deleteContact()
 * - createWorkflow(), listWorkflows(), getWorkflow(), updateWorkflow()
 * - activateWorkflow(), deactivateWorkflow(), deleteWorkflow()
 * - approveQuote(), listApprovalRequests(), getApprovalActivity()
 * - createProduct(), deleteProduct()
 * - createQuote(), addLineItems(), removeLineItem()
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

    try {
      const existingTemplate = await TurboQuote.getTemplate();
      console.log(`  Existing template found: ${existingTemplate.id}`);
    } catch {
      console.log('  No existing template.');
    }

    const template = await TurboQuote.createTemplate({
      primaryColor: '#1a73e8',
      primaryTextColor: '#ffffff',
      disclaimer: 'Prices valid for 30 days from issue date.',
      termsAndConditions: 'Payment due within 30 days of acceptance.',
      closingMessage: 'Thank you for your business!',
      senderName: 'Sales Team',
      senderEmail: 'sales@yourcompany.com',
      senderPhone: '+1-555-0100',
      contactEmail: 'support@yourcompany.com',
    });
    console.log(`  Created template: ${template.id}`);

    const updatedTemplate = await TurboQuote.updateTemplate(template.id, {
      closingMessage: 'Thank you for choosing us!',
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
    // 5. APPROVAL WORKFLOWS
    // =============================================
    console.log('5. Creating approval workflow...');

    const workflow = await TurboQuote.createWorkflow({
      name: 'High-Value Quote Approval',
      description: 'Requires manager approval for quotes over $10,000',
      nodes: [
        {
          id: 'start-1',
          type: 'start',
          data: { label: 'Quote Submitted' },
          position: { x: 0, y: 100 },
        },
        {
          id: 'cond-1',
          type: 'condition',
          data: {
            label: 'Grand Total > $10,000?',
            condition: { field: 'price', operator: '>', value: 10000 },
          },
          position: { x: 250, y: 100 },
        },
        {
          id: 'approve-1',
          type: 'approval',
          data: {
            label: 'Sales Manager Approval',
            approvers: ['manager@yourcompany.com'],
            requireAll: true,
            timeoutHours: 48,
          },
          position: { x: 500, y: 100 },
        },
      ],
      edges: [
        { id: 'e1', source: 'start-1', target: 'cond-1' },
        { id: 'e2', source: 'cond-1', target: 'approve-1' },
      ],
      viewport: { x: 0, y: 0, zoom: 1 },
    });

    console.log(`  ${workflow.name}: ${workflow.nodes.length} nodes, ${workflow.edges.length} edges\n`);

    // =============================================
    // 6. ACTIVATE & INSPECT WORKFLOW
    // =============================================
    console.log('6. Activating and inspecting workflow...');

    const activeWorkflow = await TurboQuote.activateWorkflow(workflow.id);
    console.log(`  Active: ${activeWorkflow.isActive}`);

    const workflows = await TurboQuote.listWorkflows({ limit: 10 });
    console.log(`  ${workflows.totalRecords} workflow(s) in org`);

    const wfDetail = await TurboQuote.getWorkflow(workflow.id);
    for (const node of wfDetail.nodes) {
      console.log(`    Node: "${node.data.label}" (${node.type})`);
    }

    const updatedWorkflow = await TurboQuote.updateWorkflow(workflow.id, {
      description: 'Updated threshold — requires approval for high-value quotes',
    });
    console.log(`  Description updated: ${updatedWorkflow.description}\n`);

    // =============================================
    // 7. APPROVAL REQUESTS
    // =============================================
    console.log('7. Checking approval requests...');

    const approvalRequests = await TurboQuote.listApprovalRequests({ limit: 10 });
    console.log(`  ${approvalRequests.totalRecords} pending approval request(s)\n`);

    // =============================================
    // 8. QUOTE STATUS TRANSITIONS
    // =============================================
    console.log('8. Demonstrating quote status transitions...');

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

    // Check approval activity
    const activity = await TurboQuote.getApprovalActivity(quote1.id);
    console.log(`  Approval state: ${activity.approvalState?.status || 'none'}`);

    if (activity.approvalState?.status === 'pending') {
      const approvalResult = await TurboQuote.approveQuote(quote1.id, {
        action: 'approved',
        comments: 'Looks good, approved.',
      });
      console.log(`  Approved: ${approvalResult.message}`);
    }

    const declined = await TurboQuote.declineQuote(quote1.id, 'Budget not approved');
    console.log(`  Declined: ${declined.status}`);

    // --- Void flow ---
    const quote2 = await TurboQuote.createQuote({
      name: 'Status Demo — Void Flow',
      companyId: company.id,
      contactId: contact.id,
      currency: 'USD',
    });

    await TurboQuote.sendQuote(quote2.id);
    const voided = await TurboQuote.voidQuote(quote2.id, 'Replaced by updated pricing');
    console.log(`  Voided: ${voided.status}`);

    // Handle expired quote (may fail if quote isn't in expired state)
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
    // 9. DUPLICATE A QUOTE
    // =============================================
    console.log('9. Duplicating voided quote...');

    const duplicated = await TurboQuote.duplicateQuote(quote2.id);
    console.log(`  Original: ${quote2.quoteNumber} (${voided.status})`);
    console.log(`  Copy: ${duplicated.quoteNumber} (${duplicated.status})\n`);

    // =============================================
    // 10. DEACTIVATE & DELETE WORKFLOW
    // =============================================
    console.log('10. Deactivating and deleting workflow...');

    const deactivated = await TurboQuote.deactivateWorkflow(workflow.id);
    console.log(`  Active: ${deactivated.isActive}`);

    await TurboQuote.deleteWorkflow(workflow.id);
    console.log('  Workflow deleted\n');

    // =============================================
    // 11. CLEANUP
    // =============================================
    console.log('11. Cleaning up...');

    await TurboQuote.deleteQuote(duplicated.id);
    await TurboQuote.deleteQuote(quote2.id);
    await TurboQuote.deleteQuote(quote1.id);
    await TurboQuote.deleteTemplate(template.id);
    await TurboQuote.deleteProduct(product.id);
    await TurboQuote.deleteContact(contact.id);
    await TurboQuote.deleteCompany(company.id);
    await TurboQuote.deleteType(productCategory.id);
    await TurboQuote.deleteType(industryType.id);

    console.log('  ✅ All test data removed');
    console.log('\n=== Advanced example completed successfully! ===');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.statusCode) {
      console.error(`Status Code: ${error.statusCode}`);
    }
  }
}

advancedExample();
