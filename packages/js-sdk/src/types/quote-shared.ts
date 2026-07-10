/**
 * Shared types for the TurboQuote module
 */

export type QuoteStatus = 'draft' | 'pending_approval' | 'sent' | 'accepted' | 'declined' | 'voided';

export type BillingFrequency = 'monthly' | 'quarterly' | 'annual' | 'one-time';

export type LineItemType = 'product' | 'bundle';

export type RenewalPeriod = 'weekly' | 'monthly' | 'quarterly' | 'annually';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'INR';

export type CategoryType = 'product_category' | 'pricebook_type' | 'company_industry' | 'bundle_category';

export type DiscountType = 'percent' | 'amount';

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

/**
 * A row reported back by a bulk-create endpoint — either a row that failed to
 * import, or a row that imported with a server-side adjustment (e.g. a bundle
 * item whose product wasn't found was dropped). `row` is the 1-indexed position
 * of the row in the request payload.
 */
export interface BulkImportRowIssue {
  row: number;
  reason: string;
}

/**
 * Partial-success result returned by every TurboQuote bulk-create endpoint
 * (products, price books, bundles, companies, contacts, types).
 *
 * Rows are processed sequentially; a failed row does NOT roll back rows that
 * already succeeded. Requests are capped at 500 rows (HTTP 400 above the cap).
 */
export interface BulkImportResult {
  imported: number;
  failed: BulkImportRowIssue[];
  adjusted: BulkImportRowIssue[];
}
