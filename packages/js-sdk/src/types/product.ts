/**
 * TypeScript types for TurboQuote — Product entity and request/response types
 */

import type { BillingFrequency, Currency, PaginationParams, PaginatedResponse } from './quote-shared';

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

export interface ListProductsOptions extends PaginationParams {
  categoryIds?: string | string[];
  billingFrequency?: BillingFrequency;
  currency?: Currency;
  showInCatalog?: boolean;
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
