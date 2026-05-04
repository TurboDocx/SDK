/**
 * TypeScript types for TurboQuote — Quote Template entity and request/response types
 */

// ============================================
// DOMAIN TYPES
// ============================================

export interface QuoteTemplate {
  id: string;
  orgId: string;
  logoUrl: string | null;
  primaryColor: string;
  primaryTextColor: string;
  disclaimer: string | null;
  termsAndConditions: string | null;
  closingMessage: string | null;
  senderName: string | null;
  senderPhone: string | null;
  senderEmail: string | null;
  contactEmail: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdOn: string;
  updatedOn: string;
}

// ============================================
// REQUEST TYPES
// ============================================

export interface CreateQuoteTemplateRequest {
  logoUrl?: string;
  primaryColor?: string;
  primaryTextColor?: string;
  disclaimer?: string;
  termsAndConditions?: string;
  closingMessage?: string;
  senderName?: string;
  senderPhone?: string;
  senderEmail?: string;
  contactEmail?: string;
}

export type UpdateQuoteTemplateRequest = CreateQuoteTemplateRequest;
