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
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateQuoteRequest {
  name: string;
  companyId: string;
  contactId: string;
  currency?: Currency;
  termDays?: number;
  renewalPeriod?: RenewalPeriod | null;
  validUntil?: string | null;
  taxRate?: number | null;
  priceBookId?: string | null;
}

export interface UpdateQuoteRequest {
  name?: string;
  companyId?: string;
  contactId?: string;
  termDays?: number;
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
}

export interface SendQuoteWithDeliverableRequest {
  deliverableId: string;
  mergePosition: 'beginning' | 'end';
  ccEmails?: string[];
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
  reason: string;
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
