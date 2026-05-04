/**
 * TurboQuote Example: Templates, Workflows, Approvals & Status Transitions
 *
 * This example demonstrates advanced TurboQuote operations:
 *
 * Templates:
 * - getTemplate(), createTemplate(), updateTemplate(), deleteTemplate()
 *
 * Types & Categories:
 * - createType(), listTypes(), updateType(), deleteType()
 *
 * Approval Workflows:
 * - createWorkflow(), listWorkflows(), getWorkflow(), updateWorkflow()
 * - activateWorkflow(), deactivateWorkflow(), deleteWorkflow()
 * - approveQuote(), listApprovalRequests(), getApprovalActivity()
 *
 * Quote Status Transitions:
 * - sendQuote(), declineQuote(), voidQuote(), handleExpiredQuote()
 *
 * CRM & Quote Operations:
 * - createCompany(), getCompany(), updateCompany()
 * - createContact(), updateContact(), listCompanyContacts()
 * - createQuote(), duplicateQuote(), deleteQuote()
 * - addLineItems(), removeLineItem()
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

    // Check if a template already exists
    try {
      const existingTemplate = await TurboQuote.getTemplate();
      console.log(`  Existing template found: ${existingTemplate.id}`);
      console.log(`  Primary color: ${existingTemplate.primaryColor}`);
    } catch {
      console.log('  No existing template found.');
    }

    // Create a new template
    const template = await TurboQuote.createTemplate({
      primaryColor: '#1a73e8',
      primaryTextColor: '#ffffff',
      disclaimer: 'Prices valid for 30 days from issue date.',
      termsAndConditions: 'Payment due within 30 days of acceptance. All prices are in USD unless otherwise specified. This quote is subject to our standard service agreement.',
      closingMessage: 'Thank you for your business! We look forward to working with you.',
      senderName: 'Sales Team',
      senderEmail: 'sales@yourcompany.com',
      senderPhone: '+1-555-0100',
      contactEmail: 'support@yourcompany.com',
    });

    console.log('Template created!');
    console.log(`  ID: ${template.id}`);
    console.log(`  Primary Color: ${template.primaryColor}`);
    console.log(`  Sender: ${template.senderName} (${template.senderEmail})\n`);

    // Update the template
    const updatedTemplate = await TurboQuote.updateTemplate(template.id, {
      closingMessage: 'Thank you for choosing us! Questions? Contact support@yourcompany.com.',
      logoUrl: 'https://yourcompany.com/logo.png',
    });

    console.log('Template updated!');
    console.log(`  Closing Message: ${updatedTemplate.closingMessage}`);
    console.log(`  Logo URL: ${updatedTemplate.logoUrl}\n`);

    // =============================================
    // 3. TYPES & CATEGORIES
    // =============================================
    console.log('3. Managing types & categories...');

    const industryType = await TurboQuote.createType({
      name: 'Technology',
      categoryType: 'company_industry',
    });
    console.log(`  Industry type created: ${industryType.name} (${industryType.id})`);

    // List types with usage data
    const industries = await TurboQuote.listTypes({
      categoryType: 'company_industry',
      includeUsage: true,
    });
    console.log(`  Found ${industries.totalRecords} industry type(s):`);
    for (const t of industries.results) {
      console.log(`    - ${t.name} (default: ${t.isDefault})`);
    }

    // Update a type
    const updatedType = await TurboQuote.updateType(industryType.id, {
      name: 'Technology & SaaS',
    });
    console.log(`  Type renamed to: ${updatedType.name}\n`);

    // =============================================
    // 4. CRM SETUP — company, contact, update, list
    // =============================================
    console.log('4. Setting up CRM records...');

    const company = await TurboQuote.createCompany({
      name: 'TechStart Inc',
      contacts: [{ name: 'Alex Johnson', email: 'alex@techstart.com' }],
      city: 'Austin',
      state: 'TX',
      country: 'US',
      industryId: industryType.id,
    });
    console.log(`  Company created: ${company.name} (${company.id})`);

    // Get and update company
    const companyDetail = await TurboQuote.getCompany(company.id);
    console.log(`  Company detail: ${companyDetail.name}, ${companyDetail.city}, ${companyDetail.state}`);

    const updatedCompany = await TurboQuote.updateCompany(company.id, {
      phone: '+1-555-0300',
    });
    console.log(`  Company phone updated: ${updatedCompany.phone}`);

    const contact = await TurboQuote.createContact({
      name: 'Alex Johnson',
      companyId: company.id,
      email: 'alex@techstart.com',
      title: 'CTO',
    });
    console.log(`  Contact created: ${contact.name} (${contact.id})`);

    // Update contact
    const updatedContact = await TurboQuote.updateContact(contact.id, {
      title: 'VP of Engineering',
      phone: '+1-555-0200',
    });
    console.log(`  Contact updated: ${updatedContact.name}, ${updatedContact.title}`);

    // List company contacts
    const companyContacts = await TurboQuote.listCompanyContacts(company.id);
    console.log(`  ${company.name} has ${companyContacts.totalRecords} contact(s):`);
    for (const c of companyContacts.results) {
      console.log(`    - ${c.name} (${c.title || 'no title'})`);
    }
    console.log();

    // =============================================
    // 5. APPROVAL WORKFLOWS
    // =============================================
    console.log('5. Creating approval workflow...');

    const workflow = await TurboQuote.createWorkflow({
      name: 'High-Value Quote Approval',
      description: 'Requires manager approval for quotes with discounts over 20% or totals over $10,000',
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

    console.log('Workflow created!');
    console.log(`  ID: ${workflow.id}`);
    console.log(`  Name: ${workflow.name}`);
    console.log(`  Nodes: ${workflow.nodes.length}`);
    console.log(`  Edges: ${workflow.edges.length}`);
    console.log(`  Active: ${workflow.isActive}\n`);

    // =============================================
    // 6. ACTIVATE WORKFLOW
    // =============================================
    console.log('6. Activating workflow...');

    const activeWorkflow = await TurboQuote.activateWorkflow(workflow.id);
    console.log(`  Workflow "${activeWorkflow.name}" is now active: ${activeWorkflow.isActive}\n`);

    // =============================================
    // 7. LIST & INSPECT WORKFLOWS
    // =============================================
    console.log('7. Listing workflows...');

    const workflows = await TurboQuote.listWorkflows({ limit: 10 });
    console.log(`Found ${workflows.totalRecords} workflow(s):`);
    for (const wf of workflows.results) {
      console.log(`  - ${wf.name} (active: ${wf.isActive}, nodes: ${wf.nodes.length})`);
    }

    const wfDetail = await TurboQuote.getWorkflow(workflow.id);
    console.log(`\nWorkflow detail: ${wfDetail.name}`);
    console.log(`  Description: ${wfDetail.description}`);
    for (const node of wfDetail.nodes) {
      console.log(`  Node "${node.data.label}" (${node.type})`);
    }

    // Update workflow
    const updatedWorkflow = await TurboQuote.updateWorkflow(workflow.id, {
      description: 'Requires manager approval for high-value quotes — updated threshold',
    });
    console.log(`\n  Workflow description updated: ${updatedWorkflow.description}\n`);

    // =============================================
    // 8. APPROVAL REQUESTS
    // =============================================
    console.log('8. Checking approval requests...');

    const approvalRequests = await TurboQuote.listApprovalRequests({ limit: 10 });
    console.log(`Found ${approvalRequests.totalRecords} pending approval request(s)`);
    for (const req of approvalRequests.results) {
      console.log(`  - Quote ${req.quoteId}: status=${req.status}, node=${req.currentNodeId}`);
    }
    console.log();

    // =============================================
    // 9. QUOTE STATUS TRANSITIONS
    // =============================================
    console.log('9. Demonstrating quote status transitions...');

    // Create a quote, add items, send, then decline
    const quote1 = await TurboQuote.createQuote({
      name: 'Status Demo — Decline Flow',
      companyId: company.id,
      contactId: contact.id,
      currency: 'USD',
    });
    console.log(`  Created quote: ${quote1.quoteNumber} (${quote1.status})`);

    // Add a line item
    const lineItems = await TurboQuote.addLineItems(quote1.id, {
      productId: process.env.PRODUCT_ID_1 || 'your-product-id-here',
      productName: 'Consulting Service',
      quantity: 1,
      unitPrice: 500.00,
      billingFrequency: 'monthly',
    });
    console.log(`  Added ${lineItems.length} line item(s)`);

    // Remove the line item (demonstrating removeLineItem)
    await TurboQuote.removeLineItem(quote1.id, lineItems[0].id);
    console.log(`  Removed line item: ${lineItems[0].id}`);

    // Re-add for sending
    await TurboQuote.addLineItems(quote1.id, {
      productId: process.env.PRODUCT_ID_1 || 'your-product-id-here',
      productName: 'Consulting Service',
      quantity: 1,
      unitPrice: 500.00,
      billingFrequency: 'monthly',
    });

    const sent1 = await TurboQuote.sendQuote(quote1.id);
    console.log(`  Sent quote: ${sent1.message ?? 'sent'}`);


    // Check approval activity
    const activity = await TurboQuote.getApprovalActivity(quote1.id);
    console.log(`  Approval state: ${activity.approvalState?.status || 'none'}`);
    console.log(`  Approval actions: ${activity.actions.length}`);

    // Approve the quote (if it requires approval)
    if (activity.approvalState?.status === 'pending') {
      const approvalResult = await TurboQuote.approveQuote(quote1.id, {
        action: 'approved',
        comments: 'Looks good, approved for sending.',
      });
      console.log(`  Approval result: ${approvalResult.message}`);
    }

    // Decline
    const declined = await TurboQuote.declineQuote(quote1.id, 'Budget not approved for this quarter');
    console.log(`  Declined quote: ${declined.status}\n`);

    // Create another quote, send, then void
    const quote2 = await TurboQuote.createQuote({
      name: 'Status Demo — Void Flow',
      companyId: company.id,
      contactId: contact.id,
      currency: 'USD',
    });
    console.log(`  Created quote: ${quote2.quoteNumber} (${quote2.status})`);

    await TurboQuote.sendQuote(quote2.id);
    console.log('  Sent quote');

    const voided = await TurboQuote.voidQuote(quote2.id, 'Replaced by updated pricing');
    console.log(`  Voided quote: ${voided.status}\n`);

    // Handle expired quote
    console.log('  Handling expired quote...');
    try {
      await TurboQuote.handleExpiredQuote(quote1.id, {
        action: 'void',
        reason: 'Quote expired, issuing replacement',
        newValidUntil: '2026-12-31',
      });
      console.log('  Expired quote handled');
    } catch (expiredError: any) {
      console.log(`  (Expected — quote may not be in expired state: ${expiredError.message})`);
    }
    console.log();

    // =============================================
    // 10. DUPLICATE A QUOTE
    // =============================================
    console.log('10. Duplicating voided quote for re-quoting...');

    const duplicated = await TurboQuote.duplicateQuote(quote2.id);
    console.log(`  Original: ${quote2.quoteNumber} (${voided.status})`);
    console.log(`  Duplicate: ${duplicated.quoteNumber} (${duplicated.status})\n`);

    // =============================================
    // 11. DEACTIVATE & DELETE WORKFLOW
    // =============================================
    console.log('11. Deactivating and deleting workflow...');

    const deactivated = await TurboQuote.deactivateWorkflow(workflow.id);
    console.log(`  Workflow deactivated: ${deactivated.isActive}`);

    await TurboQuote.deleteWorkflow(workflow.id);
    console.log('  Workflow deleted\n');

    // =============================================
    // 12. CLEANUP
    // =============================================
    console.log('12. Cleaning up...');

    await TurboQuote.deleteQuote(duplicated.id);
    console.log(`  Deleted quote: ${duplicated.quoteNumber}`);

    await TurboQuote.deleteQuote(quote2.id);
    console.log(`  Deleted quote: ${quote2.quoteNumber}`);

    await TurboQuote.deleteQuote(quote1.id);
    console.log(`  Deleted quote: ${quote1.quoteNumber}`);

    await TurboQuote.deleteTemplate(template.id);
    console.log(`  Deleted template: ${template.id}`);

    await TurboQuote.deleteContact(contact.id);
    console.log(`  Deleted contact: ${contact.name}`);

    await TurboQuote.deleteCompany(company.id);
    console.log(`  Deleted company: ${company.name}`);

    await TurboQuote.deleteType(industryType.id);
    console.log(`  Deleted type: ${updatedType.name}`);

    console.log('\n=== Advanced example completed successfully! ===');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.statusCode) {
      console.error(`Status Code: ${error.statusCode}`);
    }
  }
}

// Run the example
advancedExample();
