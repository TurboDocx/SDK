/**
 * TypeScript types for TurboQuote — Company entity and request/response types
 */

import type { PaginationParams, PaginatedResponse, SortDirection } from './quote-shared';
import type { QuoteType } from './quote-type';

// ============================================
// DOMAIN TYPES
// ============================================

export interface Company {
  id: string;
  orgId: string;
  name: string;
  /** The company's own email. Null for companies created without one. */
  email: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  industryId: string | null;
  lastActivityDate: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdOn: string;
  updatedOn: string;
  contactCount?: number;
  industry?: QuoteType;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateCompanyContactInput {
  name: string;
  email: string;
  phone?: string | null;
  title?: string | null;
}

export interface CreateCompanyRequest {
  name: string;
  contacts: CreateCompanyContactInput[];
  /** The company's own email (optional through the API; the TurboDocx app requires it). */
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  industryId?: string | null;
}

export interface UpdateCompanyRequest {
  name?: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  industryId?: string | null;
}

/** `name` | `contactCount` | `lastActivityDate` */
export type CompanySortBy = 'name' | 'contactCount' | 'lastActivityDate';

export interface ListCompaniesOptions extends PaginationParams {
  industryIds?: string | string[];
  /** Default `lastActivityDate` most recent first. */
  sortBy?: CompanySortBy;
  sortDirection?: SortDirection;
}

// ============================================
// RESPONSE TYPES
// ============================================

export type CompanyListResponse = PaginatedResponse<Company>;
