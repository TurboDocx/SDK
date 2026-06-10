/**
 * TypeScript types for TurboQuote — Line Item entity and request/response types
 */

import type {
  BillingFrequency,
  DiscountType,
  LineItemType,
  PaginatedResponse,
} from './quote-shared';
import type { Product } from './product';

// ============================================
// DOMAIN TYPES
// ============================================

export interface LineItem {
  id: string;
  orgId: string;
  quoteId: string;
  lineItemType: LineItemType;
  parentLineItemId: string | null;
  productId: string | null;
  productName: string | null;
  productSku: string | null;
  productDescription: string | null;
  bundleId: string | null;
  bundleName: string | null;
  bundleDescription: string | null;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountType: DiscountType | null;
  discountAmount: number | null;
  displayOrder: number | null;
  subtotal: number;
  cost: number | null;
  marginPercent: number | null;
  categoryId: string | null;
  categoryName: string | null;
  billingFrequency: BillingFrequency | null;
  showItemsToEndUser: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdOn: string;
  updatedOn: string;
  product?: Product;
  childLineItems?: LineItem[];
}

// ============================================
// REQUEST TYPES
// ============================================

export interface AddLineItemRequest {
  productId: string | null;
  productName: string;
  unitPrice: number;
  billingFrequency: BillingFrequency;
  quantity?: number;
  discountPercent?: number;
  discountType?: DiscountType;
  discountAmount?: number;
  categoryId?: string | null;
  categoryName?: string | null;
  cost?: number | null;
  productSku?: string | null;
  productDescription?: string | null;
}

export interface AddBundleLineItemRequest {
  bundleId: string;
  bundleName: string;
  quantity?: number;
  discountPercent?: number;
  discountType?: DiscountType;
  discountAmount?: number;
  bundleDescription?: string | null;
  showItemsToEndUser?: boolean;
}

export interface UpdateLineItemRequest {
  quantity?: number;
  unitPrice?: number;
  discountPercent?: number;
  discountType?: DiscountType;
  discountAmount?: number;
  displayOrder?: number | null;
  billingFrequency?: BillingFrequency;
  categoryId?: string | null;
  categoryName?: string | null;
  cost?: number | null;
  showItemsToEndUser?: boolean;
  productName?: string;
  productSku?: string | null;
  productDescription?: string | null;
}

export interface ListLineItemsOptions {
  limit?: number;
  offset?: number;
  lineItemType?: LineItemType;
  billingFrequency?: BillingFrequency;
  parentLineItemId?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export type LineItemListResponse = PaginatedResponse<LineItem>;
