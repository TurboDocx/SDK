/**
 * TurboQuote Example: Quote Renaming & Duplicate Naming
 *
 * A small, self-contained app that asserts the naming contract documented in
 * docs/SDKs/quote-javascript.md. It creates everything it needs and cleans up after itself.
 *
 * What it proves:
 * - `name` is trimmed on createQuote and updateQuote; whitespace-only is a 400
 * - the 255-character limit is applied AFTER trimming
 * - duplicateQuote names the copy `Copy of <source>`, truncated to 255
 * - renaming is draft-only — a sent quote refuses the rename
 *
 * Row ids (S20, S29, …) refer to docs/QUOTE_RENAME_SDK_TEST_PLAN.md, so a failure here
 * can be quoted straight into that plan.
 *
 * Send-dependent checks (S72) need an org whose quote template has a sender name + email.
 * They are skipped unless RUN_SEND_CHECKS=1, and reported as skipped rather than passed.
 *
 * Run: npx tsx examples/quote-rename/index.ts
 */

import { TurboQuote } from '@turbodocx/sdk';

interface CheckResult {
  id: string;
  description: string;
  outcome: 'pass' | 'fail' | 'skip';
  detail: string;
}

const results: CheckResult[] = [];

function record(id: string, description: string, passed: boolean, detail: string): void {
  results.push({ id, description, outcome: passed ? 'pass' : 'fail', detail });
  console.log(`  ${passed ? 'PASS' : 'FAIL'}  ${id}  ${description}\n        ${detail}`);
}

function skip(id: string, description: string, reason: string): void {
  results.push({ id, description, outcome: 'skip', detail: reason });
  console.log(`  SKIP  ${id}  ${description}\n        ${reason}`);
}

/** Runs a call expected to fail validation and reports the status code it actually produced. */
async function expectRejection(
  id: string,
  description: string,
  call: () => Promise<unknown>,
): Promise<void> {
  try {
    await call();
    record(id, description, false, 'the call SUCCEEDED — a 400 was expected');
  } catch (error) {
    // Duck-typed rather than instanceof so this reads the same as the other five SDKs.
    const statusCode = (error as { statusCode?: number }).statusCode;
    const message = (error as { message?: string }).message ?? String(error);
    record(id, description, statusCode === 400, `status=${statusCode} message=${message}`);
  }
}

async function quoteRenameExample(): Promise<void> {
  TurboQuote.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here',
    orgId: process.env.TURBODOCX_ORG_ID || 'your-org-id-here',
    baseUrl: process.env.TURBODOCX_BASE_URL || 'https://api.turbodocx.com',
  });

  const createdQuoteIds: string[] = [];
  let companyId = '';
  let contactId = '';

  try {
    // =============================================
    // 1. SET UP — a company and contact to hang quotes off
    //    (TurboQuoteHeader.companyId is NOT NULL, so this is mandatory)
    // =============================================
    console.log('1. Creating company and contact...\n');

    const company = await TurboQuote.createCompany({
      name: `Rename Example Co ${Date.now()}`,
      contacts: [{ name: 'Dana Reed', email: 'dana@rename-example.test' }],
      country: 'US',
    });
    companyId = company.id;

    const contact = await TurboQuote.createContact({
      name: 'Dana Reed',
      companyId: company.id,
      email: 'dana@rename-example.test',
    });
    contactId = contact.id;

    const newQuote = async (name: string) => {
      const quote = await TurboQuote.createQuote({ name, companyId, contactId });
      createdQuoteIds.push(quote.id);
      return quote;
    };

    // =============================================
    // 2. TRIMMING ON CREATE
    // =============================================
    console.log('\n2. Trimming on create\n');

    const padded = await newQuote('  Acme Q3  ');
    record('S20', 'createQuote trims leading/trailing whitespace', padded.name === 'Acme Q3', `name=${JSON.stringify(padded.name)}`);

    const interior = await newQuote('Acme  Corp');
    record('S44', 'interior whitespace is preserved (trim is not a normalise)', interior.name === 'Acme  Corp', `name=${JSON.stringify(interior.name)}`);

    const unicode = await newQuote('案件 🚀 Ünïcode');
    record('S31', 'unicode and emoji survive round-trip', unicode.name === '案件 🚀 Ünïcode', `name=${JSON.stringify(unicode.name)}`);

    await expectRejection('S22', 'whitespace-only name is rejected on create', () =>
      TurboQuote.createQuote({ name: '   ', companyId, contactId }));

    await expectRejection('S24', 'tab/newline-only name is rejected on create', () =>
      TurboQuote.createQuote({ name: '\t\n', companyId, contactId }));

    await expectRejection('S25', 'empty name is rejected on create', () =>
      TurboQuote.createQuote({ name: '', companyId, contactId }));

    // =============================================
    // 3. LENGTH BOUNDARIES — the limit applies AFTER trimming
    // =============================================
    console.log('\n3. Length boundaries\n');

    const atLimit = await newQuote('A'.repeat(255));
    record('S26', '255 characters is accepted (inclusive maximum)', atLimit.name.length === 255, `length=${atLimit.name.length}`);

    await expectRejection('S27', '256 characters is rejected', () =>
      TurboQuote.createQuote({ name: 'A'.repeat(256), companyId, contactId }));

    const paddedToLimit = await newQuote(`  ${'B'.repeat(255)}  `);
    record('S28', '255 chars wrapped in whitespace is accepted — trim runs before the length check', paddedToLimit.name.length === 255, `length=${paddedToLimit.name.length}`);

    // =============================================
    // 4. RENAMING A DRAFT
    // =============================================
    console.log('\n4. Renaming a draft\n');

    const source = await newQuote('Acme Q3');
    const renamed = await TurboQuote.updateQuote(source.id, { name: 'Acme Q3 — Revised' });
    record('S2', 'updateQuote renames a draft', renamed.name === 'Acme Q3 — Revised', `name=${JSON.stringify(renamed.name)}`);

    const trimmedOnUpdate = await TurboQuote.updateQuote(source.id, { name: '  Acme Q3 — Final  ' });
    record('S21', 'updateQuote trims the new name', trimmedOnUpdate.name === 'Acme Q3 — Final', `name=${JSON.stringify(trimmedOnUpdate.name)}`);

    await expectRejection('S23a', 'whitespace-only name is rejected on update', () =>
      TurboQuote.updateQuote(source.id, { name: '   ' }));

    const afterRejection = await TurboQuote.getQuote(source.id);
    record('S23b', 'the rejected rename left the stored name untouched', afterRejection.name === 'Acme Q3 — Final', `name=${JSON.stringify(afterRejection.name)}`);

    // =============================================
    // 5. DUPLICATE NAMING
    // =============================================
    console.log('\n5. Duplicate naming\n');

    const copy = await TurboQuote.duplicateQuote(source.id);
    createdQuoteIds.push(copy.id);
    record('S3', 'duplicateQuote prefixes the copy with "Copy of "', copy.name === 'Copy of Acme Q3 — Final', `name=${JSON.stringify(copy.name)}`);

    record('S13', 'the copy is built from the CURRENT name, not the name at creation', !copy.name.includes('Acme Q3 — Revised') && copy.name.includes('Final'), `source was renamed twice; copy=${JSON.stringify(copy.name)}`);

    const copyOfCopy = await TurboQuote.duplicateQuote(copy.id);
    createdQuoteIds.push(copyOfCopy.id);
    record('S30', 'duplicating a copy genuinely stacks the prefix (unlike a renewal)', copyOfCopy.name === `Copy of ${copy.name}`, `name=${JSON.stringify(copyOfCopy.name)}`);

    const longSource = await newQuote('C'.repeat(255));
    const longCopy = await TurboQuote.duplicateQuote(longSource.id);
    createdQuoteIds.push(longCopy.id);
    record('S29', 'a copy of a 255-char name is truncated to 255, so the insert cannot overflow', longCopy.name.length === 255 && longCopy.name.startsWith('Copy of '), `length=${longCopy.name.length} prefix=${JSON.stringify(longCopy.name.slice(0, 12))}`);

    // =============================================
    // 6. RENAME IS DRAFT-ONLY
    // =============================================
    console.log('\n6. Rename is draft-only\n');

    if (process.env.RUN_SEND_CHECKS === '1') {
      const toSend = await newQuote('Sent Quote Rename Check');
      await TurboQuote.sendQuote(toSend.id);
      await expectRejection('S72', 'a sent quote refuses a rename', () =>
        TurboQuote.updateQuote(toSend.id, { name: 'Renamed After Send' }));
    } else {
      skip('S72', 'a sent quote refuses a rename', 'set RUN_SEND_CHECKS=1 with a send-capable org (sender name + email on the org quote template)');
    }

    // =============================================
    // 7. SUMMARY
    // =============================================
    const passed = results.filter(r => r.outcome === 'pass').length;
    const failed = results.filter(r => r.outcome === 'fail').length;
    const skipped = results.filter(r => r.outcome === 'skip').length;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`  ${passed} passed · ${failed} failed · ${skipped} skipped`);
    console.log(`${'='.repeat(60)}\n`);

    if (failed > 0) {
      console.log('Failed rows:');
      for (const result of results.filter(r => r.outcome === 'fail')) {
        console.log(`  ${result.id}  ${result.description} — ${result.detail}`);
      }
      process.exitCode = 1;
    }
  } finally {
    // =============================================
    // CLEANUP — leave the org as we found it
    // =============================================
    console.log('\nCleaning up...');
    for (const quoteId of createdQuoteIds) {
      await TurboQuote.deleteQuote(quoteId).catch(() => undefined);
    }
    if (contactId) await TurboQuote.deleteContact(contactId).catch(() => undefined);
    if (companyId) await TurboQuote.deleteCompany(companyId).catch(() => undefined);
    console.log('Done.');
  }
}

quoteRenameExample().catch(error => {
  console.error('Example failed:', error);
  process.exit(1);
});
