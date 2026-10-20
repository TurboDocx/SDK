/**
 * TypeScript types for TurboQuote — Bundle entity and request/response types
 */

import type {
  BillingFrequency,
  Currency,
  DiscountType,
  OneOrMany,
  PaginationParams,
  PaginatedResponse,
  SortDirection,
} from './quote-shared';
import type { Product } from './product';

// ============================================
// DOMAIN TYPES
// ============================================

export type BundleItemStatus = 'active' | 'product_deleted' | 'product_unavailable' | 'currency_mismatch';

export interface BundleItem {
  id: string;
  orgId: string;
  bundleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountType: DiscountType | null;
  discountAmount: number | null;
  finalPrice: number;
  cost: number | null;
  billingFrequency: BillingFrequency;
  itemStatus: BundleItemStatus;
  isActive: boolean;
  createdBy: string | null;
  createdOn: string;
  updatedOn: string;
  product?: Product;
}

export interface Bundle {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  sku: string | null;
  categoryId: string | null;
  bundleDiscountPercent: number;
  bundleDiscountType: DiscountType | null;
  bundleDiscountAmount: number | null;
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
  category?: { id: string; name: string; categoryType: string };
  /** listBundles only: the bundle's active items. */
  itemCount?: number;
  /**
   * listBundles only: the bundle price per billing frequency, with the bundle discount shared in
   * proportion. A bundle mixing billing frequencies has one entry per frequency.
   */
  billingTotals?: Partial<Record<BillingFrequency, number>>;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface BundleItemInput {
  productId: string;
  unitPrice: number;
  billingFrequency: BillingFrequency;
  quantity?: number;
  discountPercent?: number;
  discountType?: DiscountType;
  discountAmount?: number;
  finalPrice?: number;
  cost?: number | null;
}

export interface CreateBundleRequest {
  name: string;
  categoryId: string;
  items?: BundleItemInput[];
  description?: string | null;
  sku?: string | null;
  bundleDiscountPercent?: number;
  bundleDiscountType?: DiscountType;
  bundleDiscountAmount?: number;
  currency?: Currency;
  showItemsToEndUser?: boolean;
  showInCatalog?: boolean;
  syncWithProducts?: boolean;
}

export interface UpdateBundleRequest {
  name?: string;
  items?: BundleItemInput[];
  description?: string | null;
  sku?: string | null;
  categoryId?: string;
  bundleDiscountPercent?: number;
  bundleDiscountType?: DiscountType;
  bundleDiscountAmount?: number;
  currency?: Currency;
  showItemsToEndUser?: boolean;
  showInCatalog?: boolean;
  syncWithProducts?: boolean;
}

/** `name` | `itemCount` | `totalListPrice` | `totalFinalPrice` | `createdOn` */
export type BundleSortBy = 'name' | 'itemCount' | 'totalListPrice' | 'totalFinalPrice' | 'createdOn';

export interface ListBundlesOptions extends PaginationParams {
  categoryIds?: string | string[];
  currency?: OneOrMany<Currency>;
  showInCatalog?: boolean;
  /** Default `createdOn` newest first. */
  sortBy?: BundleSortBy;
  sortDirection?: SortDirection;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface BundleListResponse extends PaginatedResponse<Bundle> {
  totalBundles: number;
  activeBundles: number;
  totalCategories: number;
  catalogValue: number;
}
