/**
 * TypeScript types for TurboQuote — Contact entity and request/response types
 */

import type { PaginationParams, PaginatedResponse } from './quote-shared';

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
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateContactRequest {
  name: string;
  companyId: string;
  email?: string;
  phone?: string;
  title?: string;
}

export interface UpdateContactRequest {
  name?: string;
  email?: string;
  phone?: string;
  title?: string;
  companyId?: string;
}

export interface ListContactsOptions extends PaginationParams {
  companyId?: string;
}

// ============================================
// RESPONSE TYPES
// ============================================

export type ContactListResponse = PaginatedResponse<Contact>;
