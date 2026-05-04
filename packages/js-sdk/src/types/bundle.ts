/**
 * TypeScript types for TurboQuote — Bundle entity and request/response types
 */

import type { BillingFrequency, Currency, PaginationParams, PaginatedResponse } from './quote-shared';

// ============================================
// DOMAIN TYPES
// ============================================

export interface BundleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  finalPrice?: number;
  cost: number | null;
  billingFrequency: BillingFrequency;
}

export interface Bundle {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  sku: string | null;
  categoryId: string | null;
  bundleDiscountPercent: number;
  totalListPrice: number;
  totalFinalPrice: number;
  totalCost: number;
  currency: Currency;
  showItemsToEndUser: boolean;
  showInCatalog: boolean;
  syncWithProducts: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdOn: string;
  updatedOn: string;
  items?: BundleItem[];
}

// ============================================
// REQUEST TYPES
// ============================================

export interface BundleItemInput {
  productId: string;
  quantity?: number;
  unitPrice: number;
  discountPercent?: number;
  cost?: number | null;
  billingFrequency: BillingFrequency;
}

export interface CreateBundleRequest {
  name: string;
  items: BundleItemInput[];
  description?: string;
  sku?: string;
  categoryId?: string;
  bundleDiscountPercent?: number;
  currency?: Currency;
  showItemsToEndUser?: boolean;
  showInCatalog?: boolean;
  syncWithProducts?: boolean;
}

export interface UpdateBundleRequest {
  name?: string;
  items?: BundleItemInput[];
  description?: string;
  sku?: string;
  categoryId?: string;
  bundleDiscountPercent?: number;
  currency?: Currency;
  showItemsToEndUser?: boolean;
  showInCatalog?: boolean;
  syncWithProducts?: boolean;
}

export interface ListBundlesOptions extends PaginationParams {
  categoryId?: string;
  currency?: Currency;
}

// ============================================
// RESPONSE TYPES
// ============================================

export type BundleListResponse = PaginatedResponse<Bundle>;
