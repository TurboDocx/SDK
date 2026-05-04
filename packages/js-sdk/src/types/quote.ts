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
import type { AddLineItemRequest, AddBundleLineItemRequest } from './quote-line-item';

// ============================================
// DOMAIN TYPES
// ============================================

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
  company?: Record<string, unknown>;
  contact?: Record<string, unknown>;
  lineItems?: Record<string, unknown>[];
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
  renewalPeriod?: RenewalPeriod;
  validUntil?: string;
  taxRate?: number;
  priceBookId?: string;
}

export interface UpdateQuoteRequest {
  name?: string;
  companyId?: string;
  contactId?: string;
  termDays?: number;
  renewalPeriod?: RenewalPeriod | null;
  validUntil?: string;
  taxRate?: number;
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

export interface SendQuoteWithDeliverableRequest extends SendQuoteRequest {
  deliverableId: string;
  mergePosition?: 'beginning' | 'end';
}

export interface SendQuoteResponse {
  result: Quote;
  message: string;
  signatureDocumentId?: string;
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
  signatureDocumentId?: string;
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

