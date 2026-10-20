/**
 * TypeScript types for TurboQuote — Type/Category entity and request/response types
 */

import type { CategoryType, PaginationParams, PaginatedResponse, SortDirection } from './quote-shared';

// ============================================
// DOMAIN TYPES
// ============================================

export interface QuoteType {
  id: string;
  orgId: string;
  name: string;
  categoryType: CategoryType;
  isDefault: boolean;
  isActive: boolean;
  createdBy: string | null;
  createdOn: string;
  updatedOn: string;
  usage?: {
    inUse: boolean;
    usageCount: number;
    usedIn: string[];
  };
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateQuoteTypeRequest {
  name: string;
  categoryType: CategoryType;
}

export interface UpdateQuoteTypeRequest {
  name?: string;
}

/** `name` | `usageCount` (usage needs a `categoryType`; without one it sorts by name) */
export type QuoteTypeSortBy = 'name' | 'usageCount';

export interface ListTypesOptions extends PaginationParams {
  categoryType?: CategoryType;
  includeUsage?: boolean;
  /** Default `name` A to Z. */
  sortBy?: QuoteTypeSortBy;
  sortDirection?: SortDirection;
}

// ============================================
// RESPONSE TYPES
// ============================================

export type QuoteTypeListResponse = PaginatedResponse<QuoteType>;
