/**
 * TurboWebhooks CRUD example.
 *
 * Walks through the full lifecycle plus the error paths you actually hit
 * in practice:
 *
 *   1. configure() against the TurboDocx API
 *   2. create the signature webhook
 *   3. trigger the conflict path (second create with the same name → 409)
 *   4. read (get) the webhook + its delivery stats
 *   5. update its URL list and confirm the change
 *   6. test-fire it (and surface per-URL failure strings)
 *   7. rotate its secret
 *   8. list past delivery attempts
 *   9. delete it
 *  10. confirm reads against the now-deleted webhook return 404
 *
 * Run:
 *
 *   export TURBODOCX_API_KEY=TDX-...
 *   export TURBODOCX_ORG_ID=...
 *   npx tsx examples/turbowebhooks-crud.ts
 *
 * Optionally override the API host with TURBODOCX_BASE_URL.
 *
 * Requires an admin-scoped TDX- API key. The webhook route gate is
 * requireOrgRole(administrator); a non-admin key will 403 here.
 */

import {
  TurboWebhooks,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  ConflictError,
  NetworkError,
  TurboDocxError,
} from '@turbodocx/sdk';

/**
 * The URL the webhook will POST to when an event fires. The backend
 * enforces HTTPS-only — non-HTTPS URLs return 400 ValidationError.
 */
const RECEIVER_URL = 'https://your-server.example.com/webhooks/turbodocx';

const EVENT_DOCUMENT_COMPLETED = 'signature.document.completed';
const EVENT_DOCUMENT_VOIDED = 'signature.document.voided';

function section(title: string): void {
  console.log('');
  console.log('─'.repeat(60));
  console.log(`▸ ${title}`);
  console.log('─'.repeat(60));
}

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '<unserializable>';
  }
}

async function turbowebhooksCrudExample(): Promise<void> {
  // Configure the TurboWebhooks client. skipSenderValidation is hardcoded
  // inside TurboWebhooks.configure() because webhooks don't send emails —
  // only TurboSign needs a senderEmail.
  TurboWebhooks.configure({
    apiKey: process.env.TURBODOCX_API_KEY ?? 'your-admin-tdx-key-here',
    orgId: process.env.TURBODOCX_ORG_ID ?? 'your-org-id-here',
    baseUrl: process.env.TURBODOCX_BASE_URL ?? 'https://api.turbodocx.com',
  });

  console.log(
    `Configured TurboWebhooks against ${process.env.TURBODOCX_BASE_URL ?? 'https://api.turbodocx.com'}`,
  );
  console.log(`Org: ${process.env.TURBODOCX_ORG_ID ?? 'your-org-id-here'}`);

  // ────────────────────────────────────────────────────────────
  // 1. CREATE
  // ────────────────────────────────────────────────────────────
  section('CREATE webhook');

  try {
    const created = await TurboWebhooks.createWebhook({
      urls: [RECEIVER_URL],
      events: [EVENT_DOCUMENT_COMPLETED, EVENT_DOCUMENT_VOIDED],
    });
    console.log('Created. Save this secret — it is shown ONCE:');
    console.log(`  id:     ${created.id}`);
    console.log(`  secret: ${created.secret}`);
  } catch (e) {
    if (e instanceof ConflictError) {
      // The webhook already exists from a previous run. That's fine —
      // continue with the rest of the example so you can still exercise
      // update / test / delete. Any other error bubbles to the top-level
      // handler below where each branch has its own dedicated message.
      console.log('A signature webhook already exists for this org (409). Continuing.');
    } else {
      throw e;
    }
  }

  // ────────────────────────────────────────────────────────────
  // 2. CONFLICT PATH — create again, expect 409
  // ────────────────────────────────────────────────────────────
  section('Trigger duplicate-name conflict (expect 409)');

  try {
    await TurboWebhooks.createWebhook({
      urls: [RECEIVER_URL],
      events: [EVENT_DOCUMENT_COMPLETED],
    });
    console.log('Unexpected: second create succeeded. Did the webhook get deleted between calls?');
  } catch (e) {
    if (e instanceof ConflictError) {
      console.log('Got the expected 409 ConflictError.');
      console.log(`  message:    ${e.message}`);
      console.log(`  statusCode: ${e.statusCode}`);
      console.log(`  code:       ${e.code}`);
    } else {
      throw e;
    }
  }

  // ────────────────────────────────────────────────────────────
  // 3. READ
  // ────────────────────────────────────────────────────────────
  section('GET webhook');

  const webhook = await TurboWebhooks.getWebhook();
  console.log('Webhook:');
  console.log(`  id:        ${webhook.id}`);
  console.log(`  name:      ${webhook.name}`);
  console.log(`  urls:      ${pretty(webhook.urls)}`);
  console.log(`  events:    ${pretty(webhook.events)}`);
  console.log(`  isActive:  ${webhook.isActive}`);
  console.log(`  stats:     ${pretty(webhook.deliveryStats)}`);

  // ────────────────────────────────────────────────────────────
  // 4. UPDATE
  // ────────────────────────────────────────────────────────────
  section('UPDATE webhook (replace URL list)');

  const updated = await TurboWebhooks.updateWebhook({ urls: [RECEIVER_URL] });
  console.log(`Updated. New URLs:\n${pretty(updated.urls)}`);

  // ────────────────────────────────────────────────────────────
  // 5. TEST FIRE — surface per-URL errors
  // ────────────────────────────────────────────────────────────
  section('TEST-fire webhook');

  try {
    const result = await TurboWebhooks.testWebhook({
      eventType: EVENT_DOCUMENT_COMPLETED,
      payload: {
        documentId: '00000000-0000-0000-0000-000000000000',
        documentName: 'CRUD-example test fire',
        completedAt: new Date().toISOString(),
      },
    });
    const summary = result.summary;
    console.log(
      `Summary: ${summary.successful}/${summary.total} successful, ${summary.failed} failed`,
    );
    if (summary.errors.length > 0) {
      console.log('Per-URL errors:');
      for (const err of summary.errors) {
        console.log(`  - ${err}`);
      }
    }
  } catch (e) {
    if (e instanceof TurboDocxError) {
      console.log(`Test-fire failed: ${e.name} — ${e.message}`);
    } else {
      throw e;
    }
  }

  // ────────────────────────────────────────────────────────────
  // 6. ROTATE SECRET
  // ────────────────────────────────────────────────────────────
  section('Rotate webhook secret');

  const rotated = await TurboWebhooks.regenerateWebhookSecret();
  console.log('Rotated. New secret (shown ONCE, save it):');
  console.log(`  secret:        ${rotated.secret}`);
  console.log(`  regeneratedAt: ${rotated.regeneratedAt}`);

  // ────────────────────────────────────────────────────────────
  // 7. LIST DELIVERIES
  // ────────────────────────────────────────────────────────────
  section('List recent delivery attempts');

  const deliveries = await TurboWebhooks.listWebhookDeliveries({ limit: 5 });
  console.log(`Total recorded: ${deliveries.totalRecords}`);
  deliveries.results.forEach((d, i) => {
    const status = d.httpStatus ?? 'pending';
    const delivered = d.isDelivered ? 'OK' : 'FAIL';
    console.log(`  [${i}] ${d.eventType} → ${status} (${delivered}) at ${d.createdOn}`);
  });

  // ────────────────────────────────────────────────────────────
  // 8. DELETE
  // ────────────────────────────────────────────────────────────
  section('DELETE webhook');

  const delResult = await TurboWebhooks.deleteWebhook();
  console.log(`Deleted. Server says: ${delResult.message}`);

  // ────────────────────────────────────────────────────────────
  // 9. POST-DELETE READ — expect 404
  // ────────────────────────────────────────────────────────────
  section('GET after delete (expect 404)');

  try {
    await TurboWebhooks.getWebhook();
    console.log('Unexpected: read after delete succeeded.');
  } catch (e) {
    if (e instanceof NotFoundError) {
      console.log(`Got the expected 404 NotFoundError: ${e.message}`);
    } else {
      throw e;
    }
  }
}

// ────────────────────────────────────────────────────────────
// Top-level error handler — catches anything the per-section
// blocks didn't handle. Each branch is dedicated so the message
// tells you exactly which class of failure occurred.
// ────────────────────────────────────────────────────────────
turbowebhooksCrudExample()
  .then(() => {
    console.log('\n✓ CRUD walkthrough complete.');
  })
  .catch((e: unknown) => {
    if (e instanceof AuthenticationError) {
      console.error(`\n[401] Authentication failed: ${e.message}`);
      console.error('Check TURBODOCX_API_KEY. The webhook routes require an admin TDX- key.');
    } else if (e instanceof AuthorizationError) {
      console.error(`\n[403] Authorization failed: ${e.message}`);
      console.error('Webhook routes require the org administrator role.');
    } else if (e instanceof ValidationError) {
      console.error(`\n[400] Validation error: ${e.message}`);
    } else if (e instanceof NotFoundError) {
      console.error(`\n[404] Not found: ${e.message}`);
    } else if (e instanceof RateLimitError) {
      console.error(`\n[429] Rate limited: ${e.message}`);
    } else if (e instanceof ConflictError) {
      console.error(`\n[409] Conflict: ${e.message}`);
    } else if (e instanceof NetworkError) {
      const configuredBaseUrl = process.env.TURBODOCX_BASE_URL ?? 'https://api.turbodocx.com';
      console.error(`\n[network] Could not reach the backend: ${e.message}`);
      console.error(`Could not reach ${configuredBaseUrl}.`);
    } else if (e instanceof TurboDocxError) {
      const statusLabel = e.statusCode === undefined ? '?' : String(e.statusCode);
      console.error(`\n[${statusLabel}] ${e.message}`);
    } else {
      console.error('\nUnexpected error:', e);
    }
    process.exit(1);
  });
