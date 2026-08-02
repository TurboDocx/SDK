/**
 * TurboQuote Example: Online Payments (Stripe Connect)
 *
 * Sellers connect their own payment provider (Stripe Connect today) and collect for quotes
 * directly from their customers — the org is the merchant of record, TurboDocx is the platform.
 * This example is the runnable, end-to-end version of the live smoke test: it builds a real
 * quote, then exercises every public payment method against it.
 *
 * Fully self-contained — creates all data it needs, then cleans up. Add your API key and run.
 *
 * Methods demonstrated:
 * - configure()
 * - getPaymentConnectionStatus()   — is the org set up to collect? what can the provider do?
 * - createPaymentLink()            — hosted checkout URL to send the buyer to
 * - getPaymentStatus()             — the quote's latest payment status
 * - verifyWebhookSignature()       — verify an incoming `quote.payment.succeeded` webhook
 *
 * Run: npx tsx examples/turboquote-payments.ts
 *
 * Prerequisite: the org must have a connected payment provider that can charge. In a
 * development/staging backend the connect flow auto-provisions a chargeable Stripe test account;
 * in production the org admin completes Stripe onboarding first (Settings → Connect Stripe Account).
 * If the org can't charge yet, this example prints what's missing and skips the pay-link step.
 */

import {
  TurboQuote,
  verifyWebhookSignature,
  QuotePaymentEvents,
  QuotePaymentSucceededPayload,
} from '@turbodocx/sdk';

async function quotePaymentsExample(): Promise<void> {
  // =============================================
  // 1. CONFIGURE
  // =============================================
  TurboQuote.configure({
    apiKey: process.env.TURBODOCX_API_KEY || 'your-api-key-here',
    orgId: process.env.TURBODOCX_ORG_ID || 'your-org-id-here',
    baseUrl: process.env.TURBODOCX_BASE_URL || 'https://api.turbodocx.com',
  });

  // Track what we create so cleanup runs even if a step throws.
  let companyId: string | undefined;
  let contactId: string | undefined;
  let categoryId: string | undefined;
  let productId: string | undefined;
  let quoteId: string | undefined;

  try {
    // =============================================
    // 2. CHECK THE ORG CAN COLLECT PAYMENTS
    // =============================================
    // Always check connection status before creating a pay link — createPaymentLink() fails if the
    // provider can't charge. `capabilities` tells you which optional features the provider supports
    // (reference metadata on the charge, native webhook events, subscriptions, customer portal).
    console.log('2. Checking payment connection status...');

    const connection = await TurboQuote.getPaymentConnectionStatus();
    console.log(`  Connected:       ${connection.connected}`);
    console.log(`  Charges enabled: ${connection.chargesEnabled}`);
    console.log(`  Payouts enabled: ${connection.payoutsEnabled}`);
    console.log(`  Capabilities:    ${JSON.stringify(connection.capabilities)}`);

    if (!connection.chargesEnabled) {
      console.log(
        `\n  ⚠️  Org cannot collect payments yet. Outstanding requirements: ${
          connection.requirementsDue.join(', ') || '(provider not connected)'
        }`,
      );
      console.log('  Connect a payment provider (Settings → Connect Stripe Account), then re-run.');
      return;
    }
    console.log();

    // =============================================
    // 3. BUILD A QUOTE TO CHARGE FOR
    // =============================================
    console.log('3. Building a quote to charge for...');

    const category = await TurboQuote.createType({
      name: 'Payments Example Products',
      categoryType: 'product_category',
    });
    categoryId = category.id;

    const product = await TurboQuote.createProduct({
      name: 'Annual License',
      listPrice: 5000.0,
      billingFrequency: 'one-time',
      categoryId: category.id,
      currency: 'USD',
    });
    productId = product.id;

    const company = await TurboQuote.createCompany({
      name: 'Buyer Co',
      contacts: [{ name: 'Sam Buyer', email: 'buyer-e2e@example.com' }],
    });
    companyId = company.id;

    const contact = await TurboQuote.createContact({
      name: 'Sam Buyer',
      companyId: company.id,
      email: 'buyer-e2e@example.com',
    });
    contactId = contact.id;

    const quote = await TurboQuote.createQuote({
      name: 'Buyer Co - Annual License',
      companyId: company.id,
      contactId: contact.id,
      currency: 'USD',
      termDays: 0, // one-time purchase
    });
    quoteId = quote.id;

    await TurboQuote.addLineItems(quote.id, {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.listPrice,
      billingFrequency: 'one-time',
    });

    console.log(`  Quote ${quote.quoteNumber} ready (${quote.id})\n`);

    // =============================================
    // 4. CREATE A HOSTED PAY LINK
    // =============================================
    // Returns the hosted checkout URL to send the buyer to, plus a stable paymentId (the payment of
    // record). buyerEmail is optional — it falls back to the quote's contact email.
    console.log('4. Creating a hosted pay link...');

    const link = await TurboQuote.createPaymentLink(quote.id, {
      buyerEmail: 'buyer-e2e@example.com',
    });
    console.log(`  Payment id:   ${link.paymentId}`);
    console.log(`  Checkout URL: ${link.checkoutUrl}\n`);

    // =============================================
    // 5. CHECK PAYMENT STATUS
    // =============================================
    // Before the buyer pays, status is 'pending'. After they complete checkout (reconciled from the
    // provider webhook), it flips to 'paid'. An unpaid quote with no payment row reports 'none'.
    console.log('5. Checking payment status...');

    const status = await TurboQuote.getPaymentStatus(quote.id);
    console.log(`  Status:       ${status.status}`);
    console.log(`  Amount due:   ${status.amountDueToday} ${status.currency}`);
    console.log(`  Provider:     ${status.providerName}`);
    console.log(`  Checkout id:  ${status.checkoutId}\n`);

    console.log('  Send the buyer to the checkout URL above to complete the payment.');
    console.log('  When they pay, TurboDocx fires a `quote.payment.succeeded` webhook (next).\n');

    // =============================================
    // 6. CONSUME THE quote.payment.succeeded WEBHOOK
    // =============================================
    // TurboDocx delivers a provider-agnostic `quote.payment.succeeded` webhook when a quote is paid.
    // In your receiver, verify the signature against the RAW request body (never JSON.parse first),
    // then act on the typed payload. Below is a self-contained illustration of a receiver.
    console.log('6. Verifying a `quote.payment.succeeded` webhook (illustration)...');

    // These three values arrive on the incoming HTTP request in your webhook receiver:
    //   rawBody   = the exact bytes of req.body (use express.raw({ type: 'application/json' }))
    //   signature = req.headers['x-turbodocx-signature']  (format: 'sha256=<hex>')
    //   timestamp = req.headers['x-turbodocx-timestamp']  (unix seconds, as string)
    //   secret    = the webhook secret from TurboWebhooks.createWebhook()
    function handleQuotePaymentWebhook(
      rawBody: string,
      signature: string,
      timestamp: string,
      secret: string,
    ): void {
      if (!verifyWebhookSignature(rawBody, signature, timestamp, secret)) {
        console.log('    ✗ Invalid signature — reject (401).');
        return;
      }

      // Real delivery envelope (from the backend WebhookService): the event name is the top-level
      // `event` key; the typed payload is under `data`. `event_id`/`created_at`/`version` ride along.
      const event = JSON.parse(rawBody) as {
        event: string;
        event_id: string;
        created_at: string;
        version: string;
        data: QuotePaymentSucceededPayload;
      };

      if (event.event === QuotePaymentEvents.PAYMENT_SUCCEEDED) {
        const p = event.data;
        console.log(`    ✓ Verified. Quote ${p.quote_number} paid: ${p.amount} ${p.currency} at ${p.paid_at}`);
        // Fulfill the order, mark the deal closed-won, notify the seller, etc.
      }
    }

    // Demonstration only — sign a sample payload with a sample secret so the helper returns true.
    // (In your receiver you do NOT compute the signature; it arrives on the request.) We use the
    // current time so the payload falls inside the helper's default 300s replay-protection window.
    const sampleSecret = 'whsec_example_secret';
    const now = new Date();
    const samplePayload = JSON.stringify({
      event: QuotePaymentEvents.PAYMENT_SUCCEEDED,
      event_id: 'evt_example0000000000000000000000',
      created_at: now.toISOString(),
      version: '1.0',
      data: {
        quote_id: quote.id,
        quote_number: quote.quoteNumber,
        quote_name: quote.name,
        payment_id: link.paymentId,
        status: 'paid',
        amount: 5000.0,
        currency: 'USD',
        provider: 'stripe_connect',
        paid_at: now.toISOString(),
      } satisfies QuotePaymentSucceededPayload,
    });
    const sampleTimestamp = String(Math.floor(now.getTime() / 1000));
    const { createHmac } = await import('crypto');
    const sampleSignature =
      'sha256=' + createHmac('sha256', sampleSecret).update(`${sampleTimestamp}.${samplePayload}`).digest('hex');

    handleQuotePaymentWebhook(samplePayload, sampleSignature, sampleTimestamp, sampleSecret);
    console.log();

    console.log('=== Payments example completed successfully! ===');
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    if (error.statusCode) {
      console.error(`Status Code: ${error.statusCode}`);
    }
  } finally {
    // =============================================
    // 7. CLEANUP
    // =============================================
    console.log('\n7. Cleaning up...');
    if (quoteId) await TurboQuote.deleteQuote(quoteId).catch(() => {});
    if (contactId) await TurboQuote.deleteContact(contactId).catch(() => {});
    if (companyId) await TurboQuote.deleteCompany(companyId).catch(() => {});
    if (productId) await TurboQuote.deleteProduct(productId).catch(() => {});
    if (categoryId) await TurboQuote.deleteType(categoryId).catch(() => {});
    console.log('  ✅ Test data removed');
  }
}

quotePaymentsExample();
