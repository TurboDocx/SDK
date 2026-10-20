/**
 * TypeScript types for TurboQuote — Product entity and request/response types
 */

import type { BillingFrequency, Currency, OneOrMany, PaginationParams, PaginatedResponse, SortDirection } from './quote-shared';

// ============================================
// DOMAIN TYPES
// ============================================

export interface ProductImage {
  id: string;
  productId: string;
  fileId: string;
  fileName: string;
  fileType: string;
  displayOrder: number;
  imageData?: string;
}

export interface Product {
  id: string;
  orgId: string;
  name: string;
  sku: string | null;
  description: string | null;
  detailedSpecification: string | null;
  internalNotes: string | null;
  categoryId: string;
  listPrice: number;
  cost: number | null;
  minimumOrderQuantity: number;
  billingFrequency: BillingFrequency;
  currency: Currency;
  showInCatalog: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdOn: string;
  updatedOn: string;
  images?: ProductImage[];
  category?: { id: string; name: string; categoryType: string };
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateProductRequest {
  name: string;
  listPrice: number;
  billingFrequency: BillingFrequency;
  categoryId: string;
  sku?: string;
  description?: string;
  detailedSpecification?: string;
  internalNotes?: string;
  cost?: number;
  minimumOrderQuantity?: number;
  currency?: Currency;
  showInCatalog?: boolean;
  images?: Array<string | File | Buffer>;
}

export interface UpdateProductRequest {
  name?: string;
  listPrice?: number;
  billingFrequency?: BillingFrequency;
  sku?: string;
  description?: string;
  detailedSpecification?: string;
  internalNotes?: string;
  categoryId?: string;
  cost?: number;
  minimumOrderQuantity?: number;
  currency?: Currency;
  showInCatalog?: boolean;
  images?: Array<string | File | Buffer>;
  imageIdsToKeep?: string[];
  imageOrder?: string[];
}

/** `name` | `listPrice` | `createdOn` */
export type ProductSortBy = 'name' | 'listPrice' | 'createdOn';

export interface ListProductsOptions extends PaginationParams {
  categoryIds?: string | string[];
  billingFrequency?: OneOrMany<BillingFrequency>;
  currency?: OneOrMany<Currency>;
  showInCatalog?: boolean;
  /** Default `createdOn` newest first. */
  sortBy?: ProductSortBy;
  sortDirection?: SortDirection;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface ProductListResponse extends PaginatedResponse<Product> {
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  catalogValue: number;
}

export interface ProductPrimaryImagesResponse {
  [productId: string]: ProductImage | null;
}

/** The images each product shows on a quote: up to three, in display order (empty when none). */
export interface ProductQuoteImagesResponse {
  [productId: string]: ProductImage[];
}
