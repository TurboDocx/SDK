/**
 * Example: Send a Template Set Up in TurboDocx (Signer Roles)
 *
 * Set the template up once in TurboDocx:
 *   1. Upload a PDF as a template.
 *   2. On its Signatures tab, add each signer as a role (e.g. "Client", "Countersigner").
 *      Tick "Fill in name and email when sending" for a role that changes every time;
 *      give a role a name and email when it's always the same person (e.g. your countersigner).
 *   3. Drag each role's fields onto the PDF and save the signature setup.
 *
 * Then send it from code by naming each recipient's role. The fields saved for that role come
 * with it, so you never pass coordinates or anchors.
 *
 * Use this when: the same document goes out again and again with different signers.
 *
 * Run with: TEMPLATE_ID=<your template id> npx ts-node examples/turbosign-template-roles.ts
 */

import { TurboSign } from '@turbodocx/sdk';

async function sendTemplateWithRolesExample() {
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here',
    orgId: process.env.TURBODOCX_ORG_ID || 'your-org-id-here',
    senderEmail: process.env.TURBODOCX_SENDER_EMAIL || 'support@yourcompany.com',
    senderName: process.env.TURBODOCX_SENDER_NAME || 'Your Company Name',
  });

  const templateId = process.env.TEMPLATE_ID || 'your-template-id-here';

  try {
    // 1. See the template's roles. The keys are also shown under "Use via API" on the
    //    template's page in TurboDocx.
    const { roles } = await TurboSign.getTemplateSignatureSetup(templateId);

    console.log('Template roles (in signing order):');
    roles.forEach((role) => {
      const signer = role.hasSavedSigner
        ? `saved signer ${role.defaultName} <${role.defaultEmail}>`
        : 'filled in when sending';
      console.log(`  ${role.order}. ${role.key} (${role.label}): ${signer}, ${role.fieldCount} field(s)`);
    });

    // 2. Pass a recipient for every role filled in when sending. A role with a saved signer can
    //    be left out (its saved signer is used), or passed to send to someone else this time.
    const result = await TurboSign.sendSignature({
      templateId,
      recipients: [
        { role: 'client', name: 'Jane Doe', email: 'jane@client.com' },
        // 'countersigner' left out: the signer saved on the template is used
      ],
      // No fields: the template's saved fields come with each role. Any fields you add here
      // are placed in addition to them (e.g. an extra witness signature).
    });

    console.log('\n✅ Document sent!');
    console.log('Document ID:', result.documentId);

    // 3. Track it like any other document.
    const { recipients, summary } = await TurboSign.getRecipients(result.documentId);
    console.log(`\n${summary.completed} of ${summary.total} signed, still waiting on ${summary.waitingOn}`);
    recipients.forEach((recipient) => {
      console.log(`  ${recipient.name} <${recipient.email}>: ${recipient.effectiveStatus}`);
    });
  } catch (error) {
    // A role the template doesn't have, or a role with no saved signer that you left out,
    // comes back as a ValidationError whose message names the role and lists the valid ones.
    console.error('Error:', error);
  }
}

// Run the example
sendTemplateWithRolesExample();
