/**
 * TypeScript types for TurboQuote — Contact entity and request/response types
 */

import type { OneOrMany, PaginationParams, PaginatedResponse, SortDirection } from './quote-shared';
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

/** `name` | `createdOn` */
export type ContactSortBy = 'name' | 'createdOn';

/** Options for `listCompanyContacts`. */
export interface ListCompanyContactsOptions extends PaginationParams {
  /** Default `createdOn` newest first. */
  sortBy?: ContactSortBy;
  sortDirection?: SortDirection;
}

export interface ListContactsOptions extends ListCompanyContactsOptions {
  companyId?: string;
  /** Several companies. */
  companyIds?: OneOrMany<string>;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface ContactListResponse extends PaginatedResponse<Contact> {
  /**
   * The company, when the list is for one company (`listCompanyContacts`, or `companyId`).
   * `contactCount` is its active contacts whatever the search — a company can't lose its last one.
   */
  company?: Company & { contactCount?: number };
}
