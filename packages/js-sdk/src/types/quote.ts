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
  SortDirection,
  OneOrMany,
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
  creator?: { id: string; firstName: string; lastName: string; email?: string | null; isAPIKey?: boolean };
  statusInfo?: QuoteStatusInfo;
  // Folded on by getQuote from the response's sibling `preparedBy`. See QuotePreparedBy.
  preparedBy?: QuotePreparedBy;
  /** listQuotes only: how many line items the quote has. */
  lineItemCount?: number;
  /** listQuotes only: the quote's signature request has expired (expiration was on and its deadline passed). */
  isSignatureExpired?: boolean;
  /**
   * listQuotes only: a draft or sent quote whose Valid until day has passed (UTC), or whose
   * signature has expired. The same rule as the `expired` status filter.
   */
  isExpired?: boolean;
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

/**
 * A quote list status filter: a stored status, or `expired` — a draft or sent quote whose Valid
 * until day has passed (UTC) or whose signature has expired. `expired` is not a stored status.
 */
export type QuoteListStatusFilter = QuoteStatus | 'expired';

/** `updatedOn` | `createdOn` | `total` (grand total) | `validUntil` | `quoteNumber` */
export type QuoteSortBy = 'updatedOn' | 'createdOn' | 'total' | 'validUntil' | 'quoteNumber';

/**
 * Valid until windows, in UTC days: `thisWeek` = today through today + 6, `thisMonth` = the
 * current calendar month, `past` = before today.
 */
export type QuoteValidUntilWindow = 'thisWeek' | 'thisMonth' | 'past';

/** The filters shared by `listQuotes` and `getQuoteSummary`. */
export interface QuoteListFilters {
  /** Matches quote number, quote name, company name, contact name and contact email. */
  query?: string;
  statuses?: OneOrMany<QuoteListStatusFilter>;
  /** One company. Merged with `companyIds`. */
  companyId?: string;
  companyIds?: OneOrMany<string>;
  contactId?: string;
  /** One currency or several. Merged with `currencies`. */
  currency?: OneOrMany<Currency>;
  currencies?: OneOrMany<Currency>;
  /** Ids of the users (or API keys) who created the quotes — see `listQuoteCreators`. */
  createdBy?: OneOrMany<string>;
  /** Quotes created by any API key. ORed with `createdBy`. */
  createdByApiKeys?: boolean;
  validUntilWindow?: QuoteValidUntilWindow;
  /** Inclusive YYYY-MM-DD bounds on Valid until, combined with the window. */
  validUntilFrom?: string;
  validUntilTo?: string;
  /** Currency of the returned `summary` (default: the one filtered currency, else USD). */
  summaryCurrency?: Currency;
}

export interface ListQuotesOptions extends QuoteListFilters {
  limit?: number;
  offset?: number;
  /** Default `createdOn` newest first. */
  sortBy?: QuoteSortBy;
  sortDirection?: SortDirection;
}

export type QuoteSummaryOptions = QuoteListFilters;

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

/**
 * Quotes per list tab. Every filter applies except `statuses`, so each count is what that tab
 * would hold. `expired` overlaps `draft` and `sent` (an expired quote keeps its stored status).
 */
export interface QuoteStatusCounts {
  all: number;
  draft: number;
  pending_approval: number;
  sent: number;
  accepted: number;
  declined: number;
  voided: number;
  expired: number;
}

/**
 * The quote list's summary cards, in one currency. Search, company, creator and Valid until
 * filters apply; the status filter and the currency list don't.
 */
export interface QuoteSummary {
  currency: Currency;
  /** Draft and sent quotes that aren't expired. */
  openPipeline: { total: number; count: number };
  /** Every accepted and every declined quote. */
  completed: { accepted: number; declined: number };
  /** Quotes created since the 1st of this month (UTC). */
  createdThisMonth: { count: number };
  /** Sent quotes that aren't expired. */
  waitingToSign: { count: number };
  /** Quotes accepted since the 1st of this month (UTC). */
  wonThisMonth: { count: number };
  /** Every currency the org's quotes are in, A to Z. */
  currencies: Currency[];
  /** accepted / (accepted + declined) over the last `windowDays`; `percent` is null when none were decided. */
  winRate: { percent: number | null; accepted: number; declined: number; windowDays: number };
  /** Monthly subtotal of accepted quotes; `count` = accepted quotes with a monthly amount. */
  monthlyRecurring: { total: number; count: number };
}

export interface QuoteListResponse extends PaginatedResponse<Quote> {
  stats: QuoteListStats;
  statusCounts?: QuoteStatusCounts;
  summary?: QuoteSummary;
}

/** Someone who created quotes in the org: a person, or an API key. */
export interface QuoteCreator {
  /** The user id — the value for the `createdBy` filter. */
  id: string;
  /** A person's name (else email), or the API key's name. */
  name: string;
  /** Null for an API key. */
  email: string | null;
  isAPIKey: boolean;
  /** An API key that has since been deleted (its quotes stay). */
  apiKeyDeleted: boolean;
}

/** The number the next new quote will get. Read only: the counter doesn't move. */
export interface NextQuoteNumber {
  nextNumber: string;
  sequence: number;
  /** Whether the caller can change the numbering (administrators). */
  canEdit: boolean;
}

/** Optional settings for a duplicate. */
export interface DuplicateOptions {
  /** The copy's name. Left out (or blank), the copy is called "Copy of <name>". */
  name?: string;
}

/** An open quote (draft, pending approval or sent) for a company or contact. */
export interface OpenQuoteSummary {
  id: string;
  quoteNumber: string;
  name: string | null;
  status: QuoteStatus;
  updatedOn: string;
}

/** The open quotes that block deleting a company or contact: the newest 50, and how many in all. */
export type OpenQuotesResponse = PaginatedResponse<OpenQuoteSummary>;

/** An image on a custom line item (a line with no catalog product). */
export interface LineItemImage {
  id: string;
  lineItemId: string;
  fileId: string;
  displayOrder: number;
  fileName: string;
  fileType: string;
  /** Base64 data URL: "data:image/png;base64,..." */
  imageData?: string;
}

/** Each custom line item's images (up to three, in order), keyed by line item id. */
export interface QuoteLineItemImagesResponse {
  [lineItemId: string]: LineItemImage[];
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
