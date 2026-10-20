/**
 * TypeScript types for TurboQuote — PriceBook entity and request/response types
 */

import type { DiscountType, PaginationParams, PaginatedResponse, SortDirection } from './quote-shared';
import type { Product } from './product';

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
  product?: Product;
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
  priceBookType?: { id: string; name: string; categoryType: string };
  productCount?: number;
  /**
   * listPriceBooks only: products with their own price in this book (an amount discount, or a
   * percent different from the book's discount).
   */
  overrideCount?: number;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface PriceBookProductPricingInput {
  productId: string;
  discountPercent?: number;
  discountType?: DiscountType;
  discountAmount?: number;
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
  /**
   * Put every product of the book back on the book's own discount. Applied before any
   * `productPricing` in the same request.
   */
  resetProductPricing?: boolean;
}

/** `name` | `discountPercent` | `overrideCount` | `validFrom` | `validTo` | `createdOn` */
export type PriceBookSortBy = 'name' | 'discountPercent' | 'overrideCount' | 'validFrom' | 'validTo' | 'createdOn';

export interface ListPriceBooksOptions extends PaginationParams {
  priceBookTypeIds?: string | string[];
  showInQuoteBuilder?: boolean;
  /** Default `createdOn` newest first. */
  sortBy?: PriceBookSortBy;
  sortDirection?: SortDirection;
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
