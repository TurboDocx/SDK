/**
 * TurboSign SDK - Reminders & Expiration Example
 *
 * This example demonstrates the per-document reminder + expiration schedule and the
 * standalone reminder nudge:
 * 1. Configure the SDK
 * 2. Send a document WITH a reminder cadence and an expiry deadline
 * 3. Read the deadline back off the status endpoint
 * 4. Nudge whoever's turn it is to sign
 * 5. Handle a recipient who isn't eligible for a reminder
 *
 * Run it:
 *   TURBODOCX_API_KEY=... TURBODOCX_ORG_ID=... TURBODOCX_SENDER_EMAIL=... \
 *   EXAMPLE_DELIVERABLE_ID=... npx ts-node examples/turbosign-reminders-expiration.ts
 */

import { TurboSign } from '../src';
import type { Recipient, Field } from '../src/types/sign';

async function main() {
  // 1. Configure with your API credentials
  TurboSign.configure({
    apiKey: process.env.TURBODOCX_API_KEY!,
    orgId: process.env.TURBODOCX_ORG_ID!,
    senderEmail: process.env.TURBODOCX_SENDER_EMAIL!,
    senderName: 'Reminders Example',
  });

  const recipients: Recipient[] = [
    { name: 'Example Signer', email: 'signer@example.com', signingOrder: 1 },
  ];

  const fields: Field[] = [
    {
      type: 'signature',
      page: 1,
      x: 100,
      y: 500,
      width: 200,
      height: 50,
      recipientEmail: 'signer@example.com',
    },
  ];

  // 2. Send with a schedule.
  //
  // Every schedule field is optional — omit one and it inherits your organization's
  // E-Signature default. Both reminders and expiration ship OFF by default, so a send with
  // none of these fields behaves exactly as it always has.
  //
  // Durations are `{ value, unit }`. They are JSON-encoded on the wire because
  // multipart/form-data (the file-upload path) cannot carry a nested value — the SDK handles
  // that for you on both the multipart and JSON paths.
  console.log('Sending with a reminder + expiration schedule...');
  const sent = await TurboSign.sendSignature({
    deliverableId: process.env.EXAMPLE_DELIVERABLE_ID!,
    recipients,
    fields,
    documentName: 'Reminders & Expiration Example',
    documentDescription: 'Demonstrates the per-document schedule.',

    // Reminders — chase the signer until they act, or until the cap is spent.
    remindersEnabled: true,
    reminderDelay: { value: 2, unit: 'days' },     // time to the FIRST reminder
    reminderInterval: { value: 1, unit: 'days' },  // gap between later ones
    maxReminders: 3,                               // -1 = unlimited, 0 = none

    // Expiration — close the signing window, and warn before it shuts.
    expirationEnabled: true,
    expireAfter: { value: 14, unit: 'days' },
    expirationWarning: { value: 2, unit: 'days' },         // 0 = never warn
    expirationWarningInterval: { value: 1, unit: 'days' },
  });
  console.log('  documentId:', sent.documentId, '| status:', sent.status);

  // 3. The deadline is frozen onto the document at send time, so later changes to your org
  //    defaults never move it. Read it back off the status endpoint.
  const status = await TurboSign.getStatus(sent.documentId);
  console.log('  status:', status.status);
  console.log('  expiresAt:', status.expiresAt ?? '(never — expiration is off)');

  // 4. Nudge whoever's turn it is.
  //
  // This is a STANDALONE nudge: it ignores the cadence above, works even when reminders are
  // disabled or the cap is spent, and does not consume that cap. Omit the recipient ids to
  // remind everyone eligible — do NOT pass an empty array, which the API rejects.
  console.log('Sending a reminder...');
  const { results } = await TurboSign.sendReminder(sent.documentId);
  for (const result of results) {
    // Only signers at the CURRENT signing order are emailed. Anyone else comes back as a
    // `skipped_*` status rather than being silently dropped, so you can tell whether anyone
    // actually received something.
    console.log(`  ${result.recipientId}: ${result.status}`);
  }

  // 5. Naming an ineligible recipient is all-or-nothing: the API rejects the whole request
  //    and sends nothing, rather than partially succeeding.
  try {
    await TurboSign.sendReminder(sent.documentId, ['00000000-0000-4000-8000-000000000001']);
  } catch (error) {
    console.log('  ineligible recipient correctly rejected:', (error as Error).message);
  }
}

main().catch((error) => {
  console.error('Example failed:', error);
  process.exit(1);
});
