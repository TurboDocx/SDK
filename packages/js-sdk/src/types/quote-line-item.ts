/**
 * TypeScript types for TurboQuote — Line Item entity and request/response types
 */

import type {
  BillingFrequency,
  LineItemType,
  PaginationParams,
  PaginatedResponse,
} from './quote-shared';

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
  categoryId?: string;
  categoryName?: string;
  cost?: number;
  productSku?: string;
  productDescription?: string;
}

export interface AddBundleLineItemRequest {
  bundleId: string;
  bundleName: string;
  quantity?: number;
  discountPercent?: number;
  bundleDescription?: string;
  showItemsToEndUser?: boolean;
}

export interface UpdateLineItemRequest {
  quantity?: number;
  unitPrice?: number;
  discountPercent?: number;
  billingFrequency?: BillingFrequency;
  categoryId?: string;
  categoryName?: string;
  cost?: number;
  showItemsToEndUser?: boolean;
  productName?: string;
  productSku?: string;
  productDescription?: string;
}

export interface ListLineItemsOptions extends PaginationParams {
  lineItemType?: LineItemType;
  billingFrequency?: BillingFrequency;
  parentLineItemId?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export type LineItemListResponse = PaginatedResponse<LineItem>;
