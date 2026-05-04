/**
 * TypeScript types for TurboQuote — PriceBook entity and request/response types
 */

import type { PaginationParams, PaginatedResponse } from './quote-shared';

// ============================================
// DOMAIN TYPES
// ============================================

export interface PriceBookProductPricing {
  productId: string;
  discountPercent?: number;
  finalPrice?: number;
}

export interface PriceBook {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  priceBookTypeId: string;
  discountPercent: number;
  validFrom: string;
  validTo: string | null;
  isDefault: boolean;
  showInQuoteBuilder: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdOn: string;
  updatedOn: string;
  productPricing?: PriceBookProductPricing[];
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreatePriceBookRequest {
  name: string;
  priceBookTypeId?: string;
  description?: string;
  discountPercent?: number;
  validFrom?: string;
  validTo?: string;
  isDefault?: boolean;
  showInQuoteBuilder?: boolean;
  productPricing?: PriceBookProductPricing[];
}

export interface UpdatePriceBookRequest {
  name?: string;
  priceBookTypeId?: string;
  description?: string;
  discountPercent?: number;
  validFrom?: string;
  validTo?: string;
  isDefault?: boolean;
  showInQuoteBuilder?: boolean;
  productPricing?: PriceBookProductPricing[];
}

export interface ListPriceBooksOptions extends PaginationParams {
  showInQuoteBuilder?: boolean;
}

export interface ListPriceBookProductsOptions extends PaginationParams {
  categoryIds?: string[];
}

// ============================================
// RESPONSE TYPES
// ============================================

export type PriceBookListResponse = PaginatedResponse<PriceBook>;

export type PriceBookProductListResponse = PaginatedResponse<PriceBookProductPricing>;
