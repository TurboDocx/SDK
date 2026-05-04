/**
 * Shared types for the TurboQuote module
 */

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'voided';

export type BillingFrequency = 'monthly' | 'quarterly' | 'annual' | 'one-time';

export type LineItemType = 'product' | 'bundle';

export type RenewalPeriod = 'weekly' | 'monthly' | 'quarterly' | 'annually';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'INR';

export type CategoryType = 'product_category' | 'pricebook_type' | 'company_industry' | 'bundle_category';

export interface PaginationParams {
  limit?: number;
  offset?: number;
  query?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  totalRecords: number;
}

export interface SuccessResponse {
  message: string;
}
