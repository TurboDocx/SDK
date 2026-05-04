/**
 * Shared types for the TurboQuote module
 */

export type QuoteStatus = 'draft' | 'pending_approval' | 'sent' | 'accepted' | 'declined' | 'voided';

export type BillingFrequency = 'monthly' | 'quarterly' | 'annual' | 'one-time';

export type LineItemType = 'product' | 'bundle';

export type RenewalPeriod = 'monthly' | 'quarterly' | 'annually';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'INR' | (string & {});

export type CategoryType = 'product_category' | 'pricebook_type' | 'company_industry' | 'bundle_category';

export interface PaginationParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  results: T[];
  totalRecords: number;
}

export interface SuccessResponse {
  success: boolean;
  message?: string;
}
