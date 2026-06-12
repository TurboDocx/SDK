/**
 * TurboQuote Payments — END-TO-END test bed (Approach A).
 *
 * Exercises the full chain we own, against a LIVE backend + Stripe sandbox, using the public SDK:
 *
 *   SDK.getPaymentConnectionStatus  → org can collect (dev/staging auto-onboarded, captcha-free)
 *   SDK.createPaymentLink           → real Stripe Checkout session on the connected account
 *   SDK.getPaymentStatus            → 'pending'
 *   sign + POST checkout.session.completed → the backend's Connect webhook (exactly as Stripe would;
 *                                            Stripe's hosted card capture is bot-blocked, so we feed
 *                                            the provider event ourselves — it's Stripe's code, not ours)
 *   SDK.getPaymentStatus            → 'paid'   (reconciliation flipped the row)
 *
 * It is GUARDED: without the env below it `describe.skip`s, so `npm test` stays green. Run it with:
 *
 *   E2E_PAYMENTS=1 \
 *   E2E_BASE_URL=http://localhost:3000 \
 *   E2E_API_KEY=<org-admin TDX api key> \
 *   E2E_ORG_ID=<org uuid> \
 *   E2E_QUOTE_ID=<a quote owned by the org> \
 *   E2E_WEBHOOK_URL=http://localhost:3000/v1/quote-payments/webhook \
 *   E2E_STRIPE_CONNECT_WEBHOOK_SECRET=whsec_... \
 *   npx jest e2e/turboquote-payments.e2e.test.ts
 */
import * as crypto from 'crypto';

import { TurboQuote } from '../src/modules/quote';

const env = process.env;
const enabled =
  env.E2E_PAYMENTS === '1' &&
  !!env.E2E_BASE_URL &&
  (!!env.E2E_API_KEY || !!env.E2E_ACCESS_TOKEN) &&
  !!env.E2E_ORG_ID &&
  !!env.E2E_QUOTE_ID &&
  !!env.E2E_WEBHOOK_URL &&
  !!env.E2E_STRIPE_CONNECT_WEBHOOK_SECRET;

/** Build a Stripe-signed webhook POST body + header for a checkout.session.completed event. */
function signStripeEvent(payload: object, secret: string): { body: string; header: string } {
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${body}`;
  const signature = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');
  return { body, header: `t=${timestamp},v1=${signature}` };
}

async function poll<T>(fn: () => Promise<T>, predicate: (v: T) => boolean, attempts = 12, delayMs = 1000): Promise<T> {
  let last: T;
  for (let i = 0; i < attempts; i++) {
    last = await fn();
    if (predicate(last)) return last;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return last!;
}

(enabled ? describe : describe.skip)('E2E: TurboQuote payments (live)', () => {
  beforeAll(() => {
    TurboQuote.configure({
      apiKey: env.E2E_API_KEY,
      accessToken: env.E2E_ACCESS_TOKEN,
      orgId: env.E2E_ORG_ID!,
      baseUrl: env.E2E_BASE_URL!,
    });
  });

  it('runs create-link → signed completion → paid, end to end', async () => {
    const quoteId = env.E2E_QUOTE_ID!;

    // 1) Org can collect.
    const connection = await TurboQuote.getPaymentConnectionStatus();
    expect(connection.chargesEnabled).toBe(true);

    // 2) Create a real pay link (Stripe Checkout session on the connected account).
    const link = await TurboQuote.createPaymentLink(quoteId, { buyerEmail: 'buyer-e2e@example.com' });
    expect(link.checkoutUrl).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    expect(link.paymentId).toBeTruthy();

    // 3) Status is pending; capture the Stripe checkout session id.
    const pending = await TurboQuote.getPaymentStatus(quoteId);
    expect(pending.status).toBe('pending');
    const checkoutId = pending.checkoutId!;
    expect(checkoutId).toMatch(/^cs_/);

    // 4) Feed a correctly-signed checkout.session.completed to the backend (as Stripe would).
    const event = {
      id: `evt_e2e_${Date.now()}`,
      object: 'event',
      type: 'checkout.session.completed',
      data: { object: { id: checkoutId, object: 'checkout.session', customer: 'cus_e2e' } },
    };
    const { body, header } = signStripeEvent(event, env.E2E_STRIPE_CONNECT_WEBHOOK_SECRET!);
    const resp = await fetch(env.E2E_WEBHOOK_URL!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Stripe-Signature': header },
      body,
    });
    expect(resp.status).toBe(200);

    // 5) Reconciliation flips the row to paid.
    const settled = await poll(() => TurboQuote.getPaymentStatus(quoteId), (s) => s.status === 'paid');
    expect(settled.status).toBe('paid');
  }, 30000);
});
