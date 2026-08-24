/**
 * TypeScript types for TurboQuote — Quote entity and request/response types
 */

import type {
  QuoteStatus,
  BillingFrequency,
  RenewalPeriod,
  Currency,
  PaginationParams,
  PaginatedResponse,
} from './quote-shared';
import type { AddLineItemRequest, AddBundleLineItemRequest, LineItem } from './quote-line-item';
import type { Company } from './company';
import type { Contact } from './contact';
import type { PriceBook } from './pricebook';
import type { SignatureScheduleOptions } from './sign';

// ============================================
// DOMAIN TYPES
// ============================================

export interface QuoteStatusInfo {
  currentStatus: string;
  canSend: boolean;
  canAccept: boolean;
  canDecline: boolean;
  canVoid: boolean;
  isTerminal: boolean;
}

/**
 * The resolved "Prepared by" identity shown on the quote PDF and preview, returned by
 * `getQuote` alongside the quote.
 *
 * Resolved server-side, not derived from `creator`: it applies the org quote template first,
 * then the creator, and for a quote created by an API key it yields the API key's label with
 * no email (an API key has no mailbox). Prefer this over reading `creator` for any
 * customer-facing display — `creator` may be the internal API service account.
 *
 * Both fields are optional: a quote can have no resolvable sender email (e.g. an API-created
 * quote whose org template has no sender email). Render a placeholder for an absent field.
 */
export interface QuotePreparedBy {
  name?: string;
  email?: string;
}

export interface Quote {
  id: string;
  orgId: string;
  quoteNumber: string;
  name: string;
  status: QuoteStatus;
  companyId: string;
  contactId: string;
  priceBookId: string | null;
  termDays: number;
  renewalPeriod: RenewalPeriod | null;
  sentAt: string | null;
  validUntil: string | null;
  taxRate: number | null;
  currency: Currency;
  subtotalMonthly: number;
  subtotalQuarterly: number;
  subtotalAnnual: number;
  subtotalOneTime: number;
  taxAmount: number;
  grandTotal: number;
  isActive: boolean;
  createdBy: string | null;
  createdOn: string;
  updatedOn: string;
  company?: Company;
  contact?: Contact;
  lineItems?: LineItem[];
  priceBook?: PriceBook;
  creator?: { id: string; firstName: string; lastName: string };
  statusInfo?: QuoteStatusInfo;
  // Folded on by getQuote from the response's sibling `preparedBy`. See QuotePreparedBy.
  preparedBy?: QuotePreparedBy;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateQuoteRequest {
  name: string;
  companyId: string;
  contactId: string;
  currency?: Currency;
  /** 0–3650, or -1 for auto-renewal. Defaults to 60 when omitted. */
  termDays?: number;
  /** Required when `termDays` is -1; must be null/omitted for any other term (400 otherwise). */
  renewalPeriod?: RenewalPeriod | null;
  validUntil?: string | null;
  taxRate?: number | null;
  priceBookId?: string | null;
}

export interface UpdateQuoteRequest {
  name?: string;
  companyId?: string;
  contactId?: string;
  /** 0–3650, or -1 for auto-renewal. */
  termDays?: number;
  /** Required when `termDays` is -1; must be null/omitted for any other term (400 otherwise). */
  renewalPeriod?: RenewalPeriod | null;
  validUntil?: string | null;
  taxRate?: number | null;
  currency?: Currency;
  priceBookId?: string | null;
}

export interface ListQuotesOptions extends PaginationParams {
  statuses?: QuoteStatus | QuoteStatus[];
  companyId?: string;
  contactId?: string;
  currency?: Currency;
}

export interface SendQuoteRequest {
  ccEmails?: string[];
  validUntil?: string;
  /**
   * Per-quote reminder + expiration overrides, layered over the org defaults. Omit to inherit
   * the org policy as it stands at send time. Durations are plain `{ value, unit }` objects
   * (quote send is a JSON endpoint).
   *
   * Quote expiry is pinned to `validUntil`, so `expireAfter` is ignored when expiration is on;
   * `expirationEnabled` still toggles it. The reminder/warning cadence must fit within
   * `validUntil` or the send is rejected.
   * @see SignatureScheduleOptions
   */
  remindersEnabled?: SignatureScheduleOptions['remindersEnabled'];
  reminderDelay?: SignatureScheduleOptions['reminderDelay'];
  reminderInterval?: SignatureScheduleOptions['reminderInterval'];
  maxReminders?: SignatureScheduleOptions['maxReminders'];
  expirationEnabled?: SignatureScheduleOptions['expirationEnabled'];
  expireAfter?: SignatureScheduleOptions['expireAfter'];
  expirationWarning?: SignatureScheduleOptions['expirationWarning'];
  expirationWarningInterval?: SignatureScheduleOptions['expirationWarningInterval'];
}

export interface SendQuoteWithDeliverableRequest {
  deliverableId: string;
  mergePosition: 'beginning' | 'end';
  ccEmails?: string[];
  /**
   * Per-quote reminder + expiration overrides, layered over the org defaults. Omit to inherit
   * the org policy as it stands at send time. Durations are plain `{ value, unit }` objects
   * (quote send is a JSON endpoint).
   *
   * Quote expiry is pinned to the quote's `validUntil`, so `expireAfter` is ignored when
   * expiration is on; `expirationEnabled` still toggles it. The reminder/warning cadence must
   * fit within `validUntil` or the send is rejected.
   * @see SignatureScheduleOptions
   */
  remindersEnabled?: SignatureScheduleOptions['remindersEnabled'];
  reminderDelay?: SignatureScheduleOptions['reminderDelay'];
  reminderInterval?: SignatureScheduleOptions['reminderInterval'];
  maxReminders?: SignatureScheduleOptions['maxReminders'];
  expirationEnabled?: SignatureScheduleOptions['expirationEnabled'];
  expireAfter?: SignatureScheduleOptions['expireAfter'];
  expirationWarning?: SignatureScheduleOptions['expirationWarning'];
  expirationWarningInterval?: SignatureScheduleOptions['expirationWarningInterval'];
}

export interface SendQuoteResponse {
  quote: Quote;
  message: string;
}

export interface SendQuoteWithDeliverableResponse {
  quote: Quote;
  message: string;
  documentId: string;
}

export interface DeclineQuoteRequest {
  reason?: string; // optional for a draft quote, still required by the backend once the quote is sent
}

export interface VoidQuoteRequest {
  reason: string;
}

export interface ApplyPriceBookResponse {
  quote: Quote;
  message: string;
  updatedCount: number;
  skippedCount: number;
}

export interface HandleExpiredQuoteRequest {
  action: 'void' | 'decline';
  reason: string;
  newValidUntil: string;
}

export interface CreateAndSendRequest extends CreateQuoteRequest {
  items?: AddLineItemRequest[];
  bundleItems?: AddBundleLineItemRequest[];
  send?: SendQuoteRequest;
}

export interface CreateAndSendResponse {
  quote: Quote;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface QuoteListStats {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  declined: number;
  voided: number;
  totalPipeline: Array<{ currency: string; total: number }>;
  activeQuotes: number;
  monthlyRecurringRevenue: Array<{ currency: string; total: number }>;
  winRate: number;
  avgMargin: number;
  quotesThisMonth: number;
}

export interface QuoteListResponse extends PaginatedResponse<Quote> {
  stats: QuoteListStats;
}


// ============================================
// QUOTE NUMBER CONFIG
// ============================================

export type QuoteNumberYearToken = 'none' | 'two' | 'four';
export type QuoteNumberMonthToken = 'off' | 'two';
export type QuoteNumberResetCadence = 'never' | 'yearly' | 'monthly';

/** Per-org quote numbering format (all fields required by the backend). */
export interface QuoteNumberFormat {
  prefix: string;
  yearToken: QuoteNumberYearToken;
  monthToken: QuoteNumberMonthToken;
  separator: string;
  padWidth: number;
  suffix: string;
  startNumber: number;
  resetCadence: QuoteNumberResetCadence;
}

export interface QuoteNumberConfig {
  format: QuoteNumberFormat;
  /** Per-period issued floor; startNumber can't be set below this. */
  currentFloor: number;
}
