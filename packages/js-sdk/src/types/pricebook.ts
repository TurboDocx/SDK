/**
 * TypeScript types for TurboQuote — PriceBook entity and request/response types
 */

import type { PaginationParams, PaginatedResponse } from './quote-shared';

// ============================================
// DOMAIN TYPES
// ============================================

export interface PriceBookProductPricing {
  id?: string;
  priceBookId?: string;
  productId: string;
  discountPercent: number;
  finalPrice: number;
  orgId?: string;
  isActive?: boolean;
  createdBy?: string | null;
  createdOn?: string;
  updatedOn?: string;
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

export interface PriceBookProductPricingInput {
  productId: string;
  discountPercent?: number;
  finalPrice?: number;
}

export interface CreatePriceBookRequest {
  name: string;
  priceBookTypeId: string;
  validFrom: string;
  discountPercent?: number;
  description?: string;
  validTo?: string;
  isDefault?: boolean;
  showInQuoteBuilder?: boolean;
  productPricing?: PriceBookProductPricingInput[];
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
  productPricing?: PriceBookProductPricingInput[];
}

export interface ListPriceBooksOptions extends PaginationParams {
  priceBookTypeIds?: string | string[];
  showInQuoteBuilder?: boolean;
}

export interface ListPriceBookProductsOptions extends PaginationParams {
  categoryIds?: string | string[];
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface PriceBookListResponse extends PaginatedResponse<PriceBook> {
  totalPriceBooks: number;
  activeInBuilder: number;
  totalProducts: number;
  defaultPriceBookName: string | null;
}

export type PriceBookProductListResponse = PaginatedResponse<PriceBookProductPricing>;
