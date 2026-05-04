/**
 * TypeScript types for TurboQuote — Company entity and request/response types
 */

import type { PaginationParams, PaginatedResponse } from './quote-shared';

// ============================================
// DOMAIN TYPES
// ============================================

export interface Company {
  id: string;
  orgId: string;
  name: string;
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
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateCompanyContactInput {
  name: string;
  email: string;
  phone?: string;
  title?: string;
}

export interface CreateCompanyRequest {
  name: string;
  contacts: CreateCompanyContactInput[];
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  industryId?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  industryId?: string;
}

export interface ListCompaniesOptions extends PaginationParams {
  industryIds?: string | string[];
}

// ============================================
// RESPONSE TYPES
// ============================================

export type CompanyListResponse = PaginatedResponse<Company>;
