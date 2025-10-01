/**
 * Webhooks Setup Example
 *
 * This example shows how to set up webhooks for receiving real-time
 * notifications when signature events occur. Webhooks are configured
 * at the ORGANIZATION level and apply to ALL signature requests.
 */

import { Webhooks, WebhookEvent } from '@turbodocx/sdk';

async function setupWebhooksExample() {
  // Configure Webhooks module
  Webhooks.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here'
  });

  try {
    console.log('🔔 Setting up TurboSign webhooks...\n');

    // Create a new webhook for signature events
    const webhook = await Webhooks.create(
      'signature-webhook',
      [
        'https://your-app.com/webhooks/turbosign'
        // You can add multiple URLs (max 10) for redundancy:
        // 'https://backup.your-app.com/webhooks/turbosign'
      ],
      [
        WebhookEvent.SIGNATURE_DOCUMENT_COMPLETED,
        WebhookEvent.SIGNATURE_DOCUMENT_VOIDED
      ]
    );

    console.log('✅ Webhook created successfully!\n');
    console.log('📝 Webhook Details:');
    console.log('  Name:', webhook.name);
    console.log('  ID:', webhook.id);
    console.log('  URLs:', webhook.urls);
    console.log('  Events:', webhook.events);
    console.log('  Active:', webhook.isActive);

    console.log('\n🔐 IMPORTANT - Save this secret securely!');
    console.log('Secret:', webhook.secret);
    console.log('\n⚠️  This secret will NOT be shown again!');
    console.log('You need it to verify webhook signatures.');

    console.log('\n📖 Next steps:');
    console.log('1. Save the secret in your environment variables');
    console.log('2. Implement webhook endpoint at:', webhook.urls[0]);
    console.log('3. Verify webhook signatures using the secret');
    console.log('4. Test the webhook (see webhooks-monitoring.ts example)');

    console.log('\n💡 Sample webhook verification code:');
    console.log(`
const crypto = require('crypto');

function verifyWebhook(payload, timestamp, signature, secret) {
  const signedPayload = timestamp + '.' + JSON.stringify(payload);
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return signature === expectedSignature;
}

// In your webhook endpoint:
app.post('/webhooks/turbosign', (req, res) => {
  const timestamp = req.headers['x-turbodocx-timestamp'];
  const signature = req.headers['x-turbodocx-signature'];
  const event = req.headers['x-turbodocx-event'];

  if (verifyWebhook(req.body, timestamp, signature, '${webhook.secret}')) {
    // Process the webhook event
    console.log('Event:', event);
    console.log('Data:', req.body);
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid signature' });
  }
});
    `);

  } catch (error) {
    console.error('❌ Error setting up webhook:', error);
  }
}

// Run the example
setupWebhooksExample();
