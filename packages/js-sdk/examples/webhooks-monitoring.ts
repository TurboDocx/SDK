/**
 * Webhooks Monitoring Example
 *
 * This example demonstrates monitoring webhook deliveries, viewing statistics,
 * testing webhooks, and managing webhook configurations.
 */

import { Webhooks, WebhookEvent } from '@turbodocx/sdk';

async function monitorWebhooksExample() {
  // Configure Webhooks module
  Webhooks.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here'
  });

  try {
    const webhookName = 'signature-webhook';

    // ==================================================
    // 1. List all webhooks
    // ==================================================
    console.log('📋 Listing all webhooks...\n');

    const webhooks = await Webhooks.list({ limit: 10 });

    console.log(`Found ${webhooks.totalRecords} webhook(s):\n`);
    webhooks.results.forEach(wh => {
      console.log(`  • ${wh.name} (${wh.isActive ? 'Active' : 'Inactive'})`);
      console.log(`    Events: ${wh.events.join(', ')}`);
      console.log(`    Total deliveries: ${wh.totalDeliveries || 0}`);
      console.log(`    Success rate: ${
        wh.totalDeliveries && wh.successfulDeliveries
          ? Math.round((wh.successfulDeliveries / wh.totalDeliveries) * 100)
          : 0
      }%`);
      console.log('');
    });

    // ==================================================
    // 2. Test a webhook
    // ==================================================
    console.log('🧪 Testing webhook...\n');

    const testResult = await Webhooks.test(
      webhookName,
      WebhookEvent.SIGNATURE_DOCUMENT_COMPLETED,
      {
        documentId: 'test-doc-123',
        completedAt: new Date().toISOString(),
        testMode: true
      }
    );

    console.log('Test results:');
    console.log(`  Total URLs: ${testResult.summary.total}`);
    console.log(`  Successful: ${testResult.summary.successful}`);
    console.log(`  Failed: ${testResult.summary.failed}\n`);

    if (testResult.summary.failed > 0) {
      console.log('Failed deliveries:');
      testResult.deliveries
        .filter(d => !d.isDelivered)
        .forEach(d => {
          console.log(`  ❌ ${d.url}`);
          console.log(`     Error: ${d.errorMessage}`);
          console.log(`     HTTP Status: ${d.httpStatus || 'N/A'}\n`);
        });
    }

    // ==================================================
    // 3. Get webhook statistics
    // ==================================================
    console.log('📊 Getting webhook statistics (last 7 days)...\n');

    const stats = await Webhooks.getStats(webhookName, 7);

    console.log('Overall Statistics:');
    console.log(`  Period: ${stats.period.days} days`);
    console.log(`  Total deliveries: ${stats.summary.totalDeliveries}`);
    console.log(`  Successful: ${stats.summary.successfulDeliveries}`);
    console.log(`  Failed: ${stats.summary.failedDeliveries}`);
    console.log(`  Pending retries: ${stats.summary.pendingRetries}`);
    console.log(`  Success rate: ${stats.summary.successRate}%`);
    if (stats.summary.avgResponseTime) {
      console.log(`  Avg response time: ${stats.summary.avgResponseTime}ms`);
    }
    console.log('');

    console.log('Breakdown by event type:');
    stats.eventBreakdown.forEach(event => {
      console.log(`  ${event.eventType}:`);
      console.log(`    Total: ${event.total}`);
      console.log(`    Success rate: ${event.successRate}%`);
    });
    console.log('');

    // ==================================================
    // 4. Get recent webhook deliveries
    // ==================================================
    console.log('📬 Recent webhook deliveries...\n');

    const deliveries = await Webhooks.getDeliveries(webhookName, {
      limit: 5,
      isDelivered: false // Show only failed deliveries
    });

    if (deliveries.results.length > 0) {
      console.log(`Found ${deliveries.totalRecords} failed delivery(ies):\n`);

      deliveries.results.forEach(delivery => {
        console.log(`  Delivery ID: ${delivery.id}`);
        console.log(`  Event: ${delivery.eventType}`);
        console.log(`  URL: ${delivery.url}`);
        console.log(`  Attempts: ${delivery.attemptCount}/${delivery.maxAttempts}`);
        console.log(`  Error: ${delivery.errorMessage || 'N/A'}`);
        console.log(`  HTTP Status: ${delivery.httpStatus || 'N/A'}`);
        console.log(`  Created: ${delivery.createdOn}`);
        console.log('');
      });

      // ==================================================
      // 5. Replay a failed delivery
      // ==================================================
      if (deliveries.results.length > 0) {
        console.log('🔄 Replaying first failed delivery...\n');

        const firstFailed = deliveries.results[0];
        const replayed = await Webhooks.replayDelivery(webhookName, firstFailed.id);

        console.log('Replay result:');
        console.log(`  Delivery ID: ${replayed.id}`);
        console.log(`  Status: ${replayed.status}`);
        console.log(`  Delivered: ${replayed.isDelivered ? 'Yes' : 'No'}`);
        if (replayed.errorMessage) {
          console.log(`  Error: ${replayed.errorMessage}`);
        }
        console.log('');
      }
    } else {
      console.log('✅ No failed deliveries found!\n');
    }

    // ==================================================
    // 6. Update webhook configuration
    // ==================================================
    console.log('⚙️  Updating webhook configuration...\n');

    const updated = await Webhooks.update(webhookName, {
      // You can update any of these:
      // urls: ['https://new-url.com/webhooks/turbosign'],
      // events: [WebhookEvent.SIGNATURE_DOCUMENT_COMPLETED],
      isActive: true
    });

    console.log('Webhook updated successfully!');
    console.log(`  Active: ${updated.isActive}\n`);

    // ==================================================
    // 7. Get webhook details
    // ==================================================
    console.log('🔍 Getting webhook details...\n');

    const webhook = await Webhooks.get(webhookName);

    console.log('Webhook configuration:');
    console.log(`  Name: ${webhook.name}`);
    console.log(`  ID: ${webhook.id}`);
    console.log(`  Active: ${webhook.isActive}`);
    console.log(`  URLs: ${webhook.urls.join(', ')}`);
    console.log(`  Events: ${webhook.events.join(', ')}`);
    console.log(`  Created: ${webhook.createdOn}`);
    console.log(`  Updated: ${webhook.updatedOn}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the example
monitorWebhooksExample();
