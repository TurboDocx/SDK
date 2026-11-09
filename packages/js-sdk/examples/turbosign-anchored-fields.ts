/**
 * Example: Anchored Fields on a Template's Signature Setup
 *
 * An anchored field ties a signature field to a tag such as {ClientSign} in a Word template, for
 * one signer role. Wherever the tag appears in a document generated from the template, the field
 * goes there, sized to fit the tag.
 *
 * Before you run it:
 *   - A Word template containing the tag, with at least one signer role saved on its Signatures tab.
 *   - A deliverable generated from that template in which the tag still appears as text. Generate
 *     it after the tag is a signature field, or give the tag's variable its own tag as the value.
 *
 * Environment:
 *   TURBODOCX_API_KEY       an administrator or contributor API key
 *   TURBODOCX_ORG_ID        your organization id
 *   TURBODOCX_SENDER_EMAIL  the sender shown on the document
 *   TURBODOCX_BASE_URL      optional, defaults to https://api.turbodocx.com
 *   TEMPLATE_ID             the Word template
 *   DELIVERABLE_ID          a deliverable generated from that template
 *   ROLE_KEY                optional, the signer role that fills the tag (default "client")
 *   ANCHOR_TAG              optional, the tag (default "{ClientSign}")
 *   SIGNER_NAME, SIGNER_EMAIL  optional, who the review link is prepared for
 *
 * Run with: TEMPLATE_ID=... DELIVERABLE_ID=... npx ts-node examples/turbosign-anchored-fields.ts
 */

import { TurboSign } from '@turbodocx/sdk';

async function anchoredFieldsExample() {
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here',
    orgId: process.env.TURBODOCX_ORG_ID || 'your-org-id-here',
    senderEmail: process.env.TURBODOCX_SENDER_EMAIL || 'support@yourcompany.com',
    senderName: process.env.TURBODOCX_SENDER_NAME || 'Your Company Name',
    baseUrl: process.env.TURBODOCX_BASE_URL || 'https://api.turbodocx.com',
  });

  const templateId = process.env.TEMPLATE_ID || 'your-template-id-here';
  const deliverableId = process.env.DELIVERABLE_ID || 'your-deliverable-id-here';
  const roleKey = process.env.ROLE_KEY || 'client';
  const anchor = process.env.ANCHOR_TAG || '{ClientSign}';
  const signer = {
    name: process.env.SIGNER_NAME || 'Jane Doe',
    email: process.env.SIGNER_EMAIL || 'jane@example.com',
  };

  try {
    // 1. Save a signature field on the tag for the role. Adding the same type on the same tag
    //    for the same role again returns the existing field.
    const { fieldId, tagBecameSignatureField } = await TurboSign.addTemplateSignatureAnchor({
      templateId,
      roleKey,
      type: 'signature',
      anchor,
    });
    console.log(`1. Anchored field ${fieldId} added on ${anchor} for role "${roleKey}"`);
    if (tagBecameSignatureField) console.log('   The tag is now a signature field, not a text variable');

    // 2. Read the setup back: every anchored field, and how many each role has.
    const setup = await TurboSign.getTemplateSignatureSetup(templateId);
    console.log('2. Anchored fields on the template:');
    setup.anchors.forEach((a) => {
      console.log(`   ${a.anchor} -> ${a.roleKey} (${a.type})${a.notFound ? ', tag not in the template' : ''}`);
    });
    setup.roles.forEach((role) => {
      console.log(`   Role ${role.key}: ${role.anchoredFieldCount} anchored of ${role.fieldCount} field(s)`);
    });

    // 3. Prepare the deliverable for signing with your own field on the tag. applySignatureSetup
    //    matches it to the saved anchored field (same tag and type), so it fits the tag and a tag
    //    missing from the document is skipped instead of failing. A review link sends no email;
    //    sendSignature takes the same request and emails the signer.
    const result = await TurboSign.createSignatureReviewLink({
      deliverableId,
      documentName: 'Anchored Fields Example',
      applySignatureSetup: true,
      recipients: [{ ...signer, signingOrder: 1 }],
      fields: [{ type: 'signature', recipientEmail: signer.email, template: { anchor } }],
    });
    console.log(`3. Review link ready for document ${result.documentId}`);
    console.log(`   Preview: ${result.previewUrl}`);

    // 4. Remove the anchored field. The tag goes back to being a text variable.
    const { signatureSetup } = await TurboSign.removeTemplateSignatureAnchor(templateId, fieldId);
    console.log(`4. Anchored field ${fieldId} removed, ${signatureSetup.fields.length} field(s) left in the setup`);
  } catch (error) {
    // A role the template doesn't have is a NotFoundError (SignerRoleNotFound); a tag held by
    // another role, or already holding a different field, is a ConflictError.
    console.error('Error:', error);
    process.exitCode = 1;
  }
}

// Run the example
anchoredFieldsExample();
