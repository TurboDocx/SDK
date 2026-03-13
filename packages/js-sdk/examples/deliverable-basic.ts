/**
 * Deliverable SDK - Basic Usage Example
 *
 * This example demonstrates the complete deliverable workflow:
 * 1. Configure the SDK
 * 2. Generate a deliverable from a template
 * 3. List deliverables
 * 4. Get deliverable details
 * 5. Download the source file and PDF
 * 6. Update and delete a deliverable
 */

import * as fs from 'fs';
import { Deliverable } from '../src';

async function main() {
  // 1. Configure with your API credentials
  Deliverable.configure({
    apiKey: process.env.TURBODOCX_API_KEY!,
    orgId: process.env.TURBODOCX_ORG_ID!,
  });

  // 2. Generate a deliverable from a template
  console.log('Generating deliverable...');
  const created = await Deliverable.generateDeliverable({
    templateId: 'YOUR_TEMPLATE_ID',
    name: 'Employee Contract - John Smith',
    description: 'Employment contract for senior developer',
    variables: [
      { placeholder: '{EmployeeName}', text: 'John Smith', mimeType: 'text' },
      { placeholder: '{CompanyName}', text: 'TechCorp Solutions Inc.', mimeType: 'text' },
      { placeholder: '{JobTitle}', text: 'Senior Software Engineer', mimeType: 'text' },
    ],
    tags: ['hr', 'contract', 'employee'],
  });
  const deliverableId = created.results.deliverable.id;
  console.log(`Created deliverable: ${deliverableId}`);

  // 3. List deliverables
  console.log('\nListing deliverables...');
  const list = await Deliverable.listDeliverables({
    limit: 5,
    showTags: true,
  });
  console.log(`Found ${list.totalRecords} deliverables`);
  for (const d of list.results) {
    console.log(`  - ${d.name} (${d.id})`);
  }

  // 4. Get full details
  console.log('\nGetting deliverable details...');
  const details = await Deliverable.getDeliverableDetails(deliverableId, {
    showTags: true,
  });
  console.log(`Name: ${details.name}`);
  console.log(`Template: ${details.templateName}`);
  console.log(`Variables: ${details.variables?.length ?? 0}`);
  console.log(`Tags: ${details.tags?.map(t => t.name).join(', ')}`);

  // 5. Download files
  console.log('\nDownloading source file...');
  const sourceFile = await Deliverable.downloadSourceFile(deliverableId);
  fs.writeFileSync('contract.docx', Buffer.from(sourceFile));
  console.log('Saved contract.docx');

  console.log('Downloading PDF...');
  const pdfFile = await Deliverable.downloadPDF(deliverableId);
  fs.writeFileSync('contract.pdf', Buffer.from(pdfFile));
  console.log('Saved contract.pdf');

  // 6. Update the deliverable
  console.log('\nUpdating deliverable...');
  const updated = await Deliverable.updateDeliverableInfo(deliverableId, {
    name: 'Employee Contract - John Smith (Final)',
    tags: ['hr', 'contract', 'finalized'],
  });
  console.log(updated.message);

  // 7. Browse deliverable items
  console.log('\nBrowsing deliverable items...');
  const items = await Deliverable.listDeliverableItems({
    limit: 10,
    showTags: true,
  });
  console.log(`Found ${items.totalRecords} items`);

  // 8. Delete the deliverable (soft delete)
  // const deleted = await Deliverable.deleteDeliverable(deliverableId);
  // console.log(deleted.message);

  console.log('\nDone!');
}

main().catch(console.error);
