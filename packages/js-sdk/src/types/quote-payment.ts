/**
 * TurboQuote payments — public types.
 *
 * Sellers connect a payment provider (Stripe Connect today) and collect for quotes directly. This
 * surface lets integrators create a pay link, check a quote's payment status, check the org can
 * collect, and consume the `quote.payment.succeeded` webhook. The shape is provider-agnostic; a
 * provider's `capabilities` declares which optional features it supports.
 */

/** Lifecycle status of a quote's payment. */
export type QuotePaymentStatusValue = 'none' | 'pending' | 'partial' | 'paid' | 'failed' | 'overdue';

/** Result of creating a pay link for a quote. */
export interface QuotePaymentLink {
  /** Hosted checkout URL to send the buyer to. */
  checkoutUrl: string;
  /** The TurboQuotePayment id (stable id for this payment of record). */
  paymentId: string;
}

export interface CreatePaymentLinkOptions {
  /** Buyer email override; falls back to the quote's contact email. */
  buyerEmail?: string;
}

/** A quote's current payment status (latest active payment). */
export interface QuotePaymentStatus {
  status: QuotePaymentStatusValue;
  paymentId: string | null;
  amountDueToday: number | null;
  currency: string | null;
  providerName: string | null;
  checkoutId: string | null;
  updatedOn: string | null;
}

/** Optional capabilities the active payment provider supports (per-vendor limitations). */
export interface PaymentProviderCapabilities {
  supportsReferenceMetadata: boolean;
  supportsWebhookEvents: boolean;
  supportsSubscriptions: boolean;
  supportsCustomerPortal: boolean;
}

/** Whether the org is set up to collect payments. */
export interface QuotePaymentConnectionStatus {
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  requirementsDue: string[];
  capabilities: PaymentProviderCapabilities;
}

/** TurboQuote-native payment webhook event types (consume via TurboWebhooks). */
export const QuotePaymentEvents = {
  PAYMENT_SUCCEEDED: 'quote.payment.succeeded',
} as const;

export type QuotePaymentEvent = (typeof QuotePaymentEvents)[keyof typeof QuotePaymentEvents];

/** Payload `data` of a `quote.payment.succeeded` webhook. */
export interface QuotePaymentSucceededPayload {
  quote_id: string;
  quote_number: string | null;
  quote_name: string | null;
  payment_id: string;
  status: string;
  amount: number | null;
  currency: string | null;
  provider: string | null;
  paid_at: string;
}
