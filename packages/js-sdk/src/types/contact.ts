/**
 * TypeScript types for TurboQuote — Contact entity and request/response types
 */

import type { PaginationParams, PaginatedResponse } from './quote-shared';
import type { Company } from './company';

// ============================================
// DOMAIN TYPES
// ============================================

export interface Contact {
  id: string;
  orgId: string;
  companyId: string;
  name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdOn: string;
  updatedOn: string;
  company?: Company;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateContactRequest {
  name: string;
  companyId: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
}

export interface UpdateContactRequest {
  name?: string;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
}

export interface ListContactsOptions extends PaginationParams {
  companyId?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export type ContactListResponse = PaginatedResponse<Contact>;
