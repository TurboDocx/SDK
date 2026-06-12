/**
 * TurboDocx SDK - Main entry point
 */

// Export modules
export { TurboSign } from './modules/sign';
export { TurboPartner } from './modules/partner';
export { TurboWebhooks } from './modules/webhooks';
export { Deliverable } from './modules/deliverable';
export { TurboQuote } from './modules/quote';

// Export types
export * from './types/sign';
export * from './types/partner';
export * from './types/webhooks';
export * from './types/deliverable';
export {
  type QuoteStatus,
  type BillingFrequency,
  type LineItemType,
  type RenewalPeriod,
  type Currency,
  type CategoryType,
  type DiscountType,
  type PaginationParams,
  type PaginatedResponse,
  type SuccessResponse,
} from './types/quote-shared';
export * from './types/quote';
export * from './types/quote-payment';
export * from './types/quote-line-item';
export * from './types/product';
export * from './types/bundle';
export * from './types/pricebook';
export * from './types/company';
export * from './types/contact';
export * from './types/quote-template';
export * from './types/quote-type';

// Export errors
export * from './utils/errors';

// Export webhook signature verification helper
export { verifyWebhookSignature, VerifyWebhookSignatureOptions } from './utils/verifyWebhookSignature';

// Export HTTP client config types
export type { HttpClientConfig, PartnerClientConfig, QuoteClientConfig } from './http';
