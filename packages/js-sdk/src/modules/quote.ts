/**
 * TurboQuote Module — Quoting operations
 */

import * as fs from 'fs';
import * as nodePath from 'path';
import { HttpClient, QuoteClientConfig, detectFileType } from '../http';
import type { PaginationParams, SuccessResponse } from '../types/quote-shared';
import type {
  Quote,
  QuoteStatusInfo,
  CreateQuoteRequest,
  UpdateQuoteRequest,
  ListQuotesOptions,
  QuoteListResponse,
  SendQuoteRequest,
  SendQuoteWithDeliverableRequest,
  SendQuoteResponse,
  SendQuoteWithDeliverableResponse,
  HandleExpiredQuoteRequest,
  CreateAndSendRequest,
  CreateAndSendResponse,
  DeclineQuoteRequest,
  VoidQuoteRequest,
  ApplyPriceBookResponse,
} from '../types/quote';
import type {
  LineItem,
  AddLineItemRequest,
  AddBundleLineItemRequest,
  UpdateLineItemRequest,
  ListLineItemsOptions,
  LineItemListResponse,
} from '../types/quote-line-item';
import type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ListProductsOptions,
  ProductListResponse,
  ProductPrimaryImagesResponse,
} from '../types/product';
import type {
  PriceBook,
  CreatePriceBookRequest,
  UpdatePriceBookRequest,
  ListPriceBooksOptions,
  PriceBookListResponse,
  ListPriceBookProductsOptions,
  PriceBookProductListResponse,
} from '../types/pricebook';
import type {
  Bundle,
  CreateBundleRequest,
  UpdateBundleRequest,
  ListBundlesOptions,
  BundleListResponse,
} from '../types/bundle';
import type {
  Company,
  CreateCompanyRequest,
  UpdateCompanyRequest,
  ListCompaniesOptions,
  CompanyListResponse,
} from '../types/company';
import type {
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  ListContactsOptions,
  ContactListResponse,
} from '../types/contact';
import type {
  QuoteTemplate,
  QuoteTemplateListResponse,
  CreateQuoteTemplateRequest,
  UpdateQuoteTemplateRequest,
} from '../types/quote-template';
import type {
  QuoteType,
  CreateQuoteTypeRequest,
  UpdateQuoteTypeRequest,
  ListTypesOptions,
  QuoteTypeListResponse,
} from '../types/quote-type';


function toQueryParams(request?: Record<string, any>): Record<string, string | string[]> | undefined {
  if (!request) return undefined;

  const params: Record<string, string | string[]> = {};
  for (const [key, value] of Object.entries(request)) {
    if (value !== undefined && value !== null) {
      if (typeof value === 'boolean') {
        params[key] = value ? 'true' : 'false';
      } else if (Array.isArray(value)) {
        params[key] = value.map(String);
      } else {
        params[key] = String(value);
      }
    }
  }
  return Object.keys(params).length > 0 ? params : undefined;
}

function buildProductFormData(request: Record<string, any>): FormData {
  const formData = new FormData();
  const { images, ...dataFields } = request;

  formData.append('data', JSON.stringify(dataFields));

  if (images) {
    for (const image of images as Array<string | File | Buffer>) {
      if (typeof image === 'string') {
        const fileBuffer = fs.readFileSync(image);
        const detected = detectFileType(fileBuffer);
        const blob = new Blob([fileBuffer], { type: detected.mimetype });
        formData.append('images', blob, nodePath.basename(image));
      } else if (image instanceof Buffer) {
        const detected = detectFileType(image);
        const blob = new Blob([image], { type: detected.mimetype });
        formData.append('images', blob, `image.${detected.extension}`);
      } else {
        formData.append('images', image as File, (image as File).name);
      }
    }
  }

  return formData;
}

export class TurboQuote {
  private static client: HttpClient;

  static configure(config: QuoteClientConfig): void {
    this.client = new HttpClient({
      ...config,
      skipSenderValidation: true,
    });
  }

  private static getClient(): HttpClient {
    if (!this.client) {
      this.client = new HttpClient({ skipSenderValidation: true });
    }
    return this.client;
  }

  // Backend single-entity responses come as { result: T, message?: string }
  // after smartUnwrap strips the outer { data: ... } wrapper.
  private static unwrap<T>(response: { result: T }): T {
    return response.result;
  }

  // ============================================
  // QUOTES — CRUD
  // ============================================

  static async listQuotes(options?: ListQuotesOptions): Promise<QuoteListResponse> {
    const client = this.getClient();
    return client.get<QuoteListResponse>('/v1/quotes', toQueryParams(options));
  }

  static async createQuote(request: CreateQuoteRequest): Promise<Quote> {
    const client = this.getClient();
    return this.unwrap(await client.post<{ result: Quote }>('/v1/quotes', request));
  }

  static async getQuote(id: string): Promise<Quote> {
    const client = this.getClient();
    const response = await client.get<{ result: Quote; statusInfo?: QuoteStatusInfo }>(`/v1/quotes/${id}`);
    const quote = response.result;
    if (response.statusInfo) {
      quote.statusInfo = response.statusInfo;
    }
    return quote;
  }

  static async updateQuote(id: string, request: UpdateQuoteRequest): Promise<Quote> {
    const client = this.getClient();
    return this.unwrap(await client.patch<{ result: Quote }>(`/v1/quotes/${id}`, request));
  }

  static async deleteQuote(id: string): Promise<SuccessResponse> {
    const client = this.getClient();
    return client.delete<SuccessResponse>(`/v1/quotes/${id}`);
  }

  static async duplicateQuote(id: string): Promise<Quote> {
    const client = this.getClient();
    return this.unwrap(await client.post<{ result: Quote }>(`/v1/quotes/${id}/duplicate`));
  }

  static async applyPriceBook(quoteId: string, priceBookId: string): Promise<ApplyPriceBookResponse> {
    const client = this.getClient();
    const response = await client.post<{ result: Quote; message: string; updatedCount: number; skippedCount: number }>(`/v1/quotes/${quoteId}/apply-pricebook`, { priceBookId });
    return {
      quote: response.result,
      message: response.message,
      updatedCount: response.updatedCount,
      skippedCount: response.skippedCount,
    };
  }

  static async removePriceBook(quoteId: string): Promise<Quote> {
    const client = this.getClient();
    return this.unwrap(await client.post<{ result: Quote }>(`/v1/quotes/${quoteId}/remove-pricebook`));
  }

  static async downloadQuotePdf(id: string): Promise<ArrayBuffer> {
    const client = this.getClient();
    return client.getRaw(`/v1/quotes/${id}/pdf`);
  }

  // ============================================
  // QUOTES — STATUS TRANSITIONS
  // ============================================

  static async sendQuote(id: string, request?: SendQuoteRequest): Promise<SendQuoteResponse> {
    const client = this.getClient();
    const response = await client.post<{ result: Quote; message: string }>(`/v1/quotes/${id}/send`, request);
    return {
      quote: response.result,
      message: response.message,
    };
  }

  static async sendQuoteWithDeliverable(id: string, request: SendQuoteWithDeliverableRequest): Promise<SendQuoteWithDeliverableResponse> {
    const client = this.getClient();
    const response = await client.post<{ result: Quote; message: string; documentId: string }>(`/v1/quotes/${id}/send-with-deliverable`, request);
    return {
      quote: response.result,
      message: response.message,
      documentId: response.documentId,
    };
  }

  static async declineQuote(id: string, request: DeclineQuoteRequest): Promise<Quote> {
    const client = this.getClient();
    return this.unwrap(await client.post<{ result: Quote }>(`/v1/quotes/${id}/decline`, request));
  }

  static async voidQuote(id: string, request: VoidQuoteRequest): Promise<Quote> {
    const client = this.getClient();
    return this.unwrap(await client.post<{ result: Quote }>(`/v1/quotes/${id}/void`, request));
  }

  static async handleExpiredQuote(id: string, request: HandleExpiredQuoteRequest): Promise<Quote> {
    const client = this.getClient();
    return this.unwrap(await client.post<{ result: Quote }>(`/v1/quotes/${id}/handle-expired-sent`, request));
  }

  // ============================================
  // LINE ITEMS
  // ============================================

  static async listLineItems(quoteId: string, options?: ListLineItemsOptions): Promise<LineItemListResponse> {
    const client = this.getClient();
    return client.get<LineItemListResponse>(`/v1/quotes/${quoteId}/items`, toQueryParams(options));
  }

  static async addLineItems(quoteId: string, items: AddLineItemRequest | AddLineItemRequest[]): Promise<LineItem[]> {
    const client = this.getClient();
    const payload = Array.isArray(items) ? items : [items];
    const response = await client.post<{ results: LineItem[] }>(`/v1/quotes/${quoteId}/items`, payload);
    return response.results;
  }

  static async addBundleLineItems(quoteId: string, items: AddBundleLineItemRequest | AddBundleLineItemRequest[]): Promise<LineItem[]> {
    const client = this.getClient();
    const payload = Array.isArray(items) ? items : [items];
    const response = await client.post<{ results: LineItem[] }>(`/v1/quotes/${quoteId}/items/bundle`, payload);
    return response.results;
  }

  static async updateLineItem(quoteId: string, itemId: string, request: UpdateLineItemRequest): Promise<LineItem> {
    const client = this.getClient();
    return this.unwrap(await client.patch<{ result: LineItem }>(`/v1/quotes/${quoteId}/items/${itemId}`, request));
  }

  static async removeLineItem(quoteId: string, itemId: string): Promise<SuccessResponse> {
    const client = this.getClient();
    return client.delete<SuccessResponse>(`/v1/quotes/${quoteId}/items/${itemId}`);
  }

  // ============================================
  // PRODUCTS
  // ============================================

  static async listProducts(options?: ListProductsOptions): Promise<ProductListResponse> {
    const client = this.getClient();
    return client.get<ProductListResponse>('/v1/products', toQueryParams(options));
  }

  static async createProduct(request: CreateProductRequest): Promise<Product> {
    const client = this.getClient();
    if (request.images && request.images.length > 0) {
      const formData = buildProductFormData(request);
      return this.unwrap(await client.postFormData<{ result: Product }>('/v1/products', formData));
    }
    return this.unwrap(await client.post<{ result: Product }>('/v1/products', request));
  }

  static async getProduct(id: string): Promise<Product> {
    const client = this.getClient();
    return this.unwrap(await client.get<{ result: Product }>(`/v1/products/${id}`));
  }

  static async updateProduct(id: string, request: UpdateProductRequest): Promise<Product> {
    const client = this.getClient();
    if (request.images && request.images.length > 0) {
      const formData = buildProductFormData(request);
      return this.unwrap(await client.patchFormData<{ result: Product }>(`/v1/products/${id}`, formData));
    }
    return this.unwrap(await client.patch<{ result: Product }>(`/v1/products/${id}`, request));
  }

  static async deleteProduct(id: string): Promise<SuccessResponse> {
    const client = this.getClient();
    return client.delete<SuccessResponse>(`/v1/products/${id}`);
  }

  static async duplicateProduct(id: string): Promise<Product> {
    const client = this.getClient();
    return this.unwrap(await client.post<{ result: Product }>(`/v1/products/${id}/duplicate`));
  }

  static async getProductPrimaryImages(productIds: string[]): Promise<ProductPrimaryImagesResponse> {
    const client = this.getClient();
    const response = await client.post<{ results: ProductPrimaryImagesResponse }>('/v1/products/primary-images', { productIds });
    return response.results;
  }

  // ============================================
  // PRICE BOOKS
  // ============================================

  static async listPriceBooks(options?: ListPriceBooksOptions): Promise<PriceBookListResponse> {
    const client = this.getClient();
    return client.get<PriceBookListResponse>('/v1/pricebooks', toQueryParams(options));
  }

  static async createPriceBook(request: CreatePriceBookRequest): Promise<PriceBook> {
    const client = this.getClient();
    // Backend requires discountPercent on POST (omitting it returns 400) even though its
    // schema documents a default of 0. Fill that default when the caller omits it so a
    // pricebook with per-product pricing (no blanket discount) just works.
    const body = { ...request, discountPercent: request.discountPercent ?? 0 };
    return this.unwrap(await client.post<{ result: PriceBook }>('/v1/pricebooks', body));
  }

  static async getPriceBook(id: string): Promise<PriceBook> {
    const client = this.getClient();
    return this.unwrap(await client.get<{ result: PriceBook }>(`/v1/pricebooks/${id}`));
  }

  static async updatePriceBook(id: string, request: UpdatePriceBookRequest): Promise<PriceBook> {
    const client = this.getClient();
    return this.unwrap(await client.patch<{ result: PriceBook }>(`/v1/pricebooks/${id}`, request));
  }

  static async deletePriceBook(id: string): Promise<SuccessResponse> {
    const client = this.getClient();
    return client.delete<SuccessResponse>(`/v1/pricebooks/${id}`);
  }

  static async duplicatePriceBook(id: string): Promise<PriceBook> {
    const client = this.getClient();
    return this.unwrap(await client.post<{ result: PriceBook }>(`/v1/pricebooks/${id}/duplicate`));
  }

  static async listPriceBookProducts(id: string, options?: ListPriceBookProductsOptions): Promise<PriceBookProductListResponse> {
    const client = this.getClient();
    return client.get<PriceBookProductListResponse>(`/v1/pricebooks/${id}/products`, toQueryParams(options));
  }

  // ============================================
  // BUNDLES
  // ============================================

  static async listBundles(options?: ListBundlesOptions): Promise<BundleListResponse> {
    const client = this.getClient();
    return client.get<BundleListResponse>('/v1/bundles', toQueryParams(options));
  }

  static async createBundle(request: CreateBundleRequest): Promise<Bundle> {
    const client = this.getClient();
    return this.unwrap(await client.post<{ result: Bundle }>('/v1/bundles', request));
  }

  static async getBundle(id: string): Promise<Bundle> {
    const client = this.getClient();
    return this.unwrap(await client.get<{ result: Bundle }>(`/v1/bundles/${id}`));
  }

  static async updateBundle(id: string, request: UpdateBundleRequest): Promise<Bundle> {
    const client = this.getClient();
    return this.unwrap(await client.patch<{ result: Bundle }>(`/v1/bundles/${id}`, request));
  }

  static async deleteBundle(id: string): Promise<SuccessResponse> {
    const client = this.getClient();
    return client.delete<SuccessResponse>(`/v1/bundles/${id}`);
  }

  static async duplicateBundle(id: string): Promise<Bundle> {
    const client = this.getClient();
    return this.unwrap(await client.post<{ result: Bundle }>(`/v1/bundles/${id}/duplicate`));
  }

  // ============================================
  // COMPANIES
  // ============================================

  static async listCompanies(options?: ListCompaniesOptions): Promise<CompanyListResponse> {
    const client = this.getClient();
    return client.get<CompanyListResponse>('/v1/companies', toQueryParams(options));
  }

  static async createCompany(request: CreateCompanyRequest): Promise<Company> {
    const client = this.getClient();
    return this.unwrap(await client.post<{ result: Company }>('/v1/companies', request));
  }

  static async getCompany(id: string): Promise<Company> {
    const client = this.getClient();
    return this.unwrap(await client.get<{ result: Company }>(`/v1/companies/${id}`));
  }

  static async updateCompany(id: string, request: UpdateCompanyRequest): Promise<Company> {
    const client = this.getClient();
    return this.unwrap(await client.patch<{ result: Company }>(`/v1/companies/${id}`, request));
  }

  static async deleteCompany(id: string): Promise<SuccessResponse> {
    const client = this.getClient();
    return client.delete<SuccessResponse>(`/v1/companies/${id}`);
  }

  static async listCompanyContacts(companyId: string, options?: PaginationParams): Promise<ContactListResponse> {
    const client = this.getClient();
    return client.get<ContactListResponse>(`/v1/companies/${companyId}/contacts`, toQueryParams(options));
  }

  // ============================================
  // CONTACTS
  // ============================================

  static async listContacts(options?: ListContactsOptions): Promise<ContactListResponse> {
    const client = this.getClient();
    return client.get<ContactListResponse>('/v1/contacts', toQueryParams(options));
  }

  static async createContact(request: CreateContactRequest): Promise<Contact> {
    const client = this.getClient();
    return this.unwrap(await client.post<{ result: Contact }>('/v1/contacts', request));
  }

  static async updateContact(id: string, request: UpdateContactRequest): Promise<Contact> {
    const client = this.getClient();
    return this.unwrap(await client.patch<{ result: Contact }>(`/v1/contacts/${id}`, request));
  }

  static async deleteContact(id: string): Promise<SuccessResponse> {
    const client = this.getClient();
    return client.delete<SuccessResponse>(`/v1/contacts/${id}`);
  }

  // ============================================
  // TEMPLATES
  // ============================================

  static async listTemplates(options?: PaginationParams): Promise<QuoteTemplateListResponse> {
    const client = this.getClient();
    return client.get<QuoteTemplateListResponse>('/v1/quote-templates', toQueryParams(options));
  }

  static async getTemplate(): Promise<QuoteTemplate> {
    const client = this.getClient();
    return this.unwrap(await client.get<{ result: QuoteTemplate }>('/v1/quote-template'));
  }

  static async getTemplateById(id: string): Promise<QuoteTemplate> {
    const client = this.getClient();
    return this.unwrap(await client.get<{ result: QuoteTemplate }>(`/v1/quote-templates/${id}`));
  }

  static async createTemplate(request: CreateQuoteTemplateRequest): Promise<QuoteTemplate> {
    const client = this.getClient();
    return this.unwrap(await client.post<{ result: QuoteTemplate }>('/v1/quote-templates', request));
  }

  static async updateTemplate(id: string, request: UpdateQuoteTemplateRequest): Promise<QuoteTemplate> {
    const client = this.getClient();
    return this.unwrap(await client.patch<{ result: QuoteTemplate }>(`/v1/quote-templates/${id}`, request));
  }

  static async deleteTemplate(id: string): Promise<SuccessResponse> {
    const client = this.getClient();
    return client.delete<SuccessResponse>(`/v1/quote-templates/${id}`);
  }

  // ============================================
  // TYPES / CATEGORIES
  // ============================================

  static async listTypes(options?: ListTypesOptions): Promise<QuoteTypeListResponse> {
    const client = this.getClient();
    return client.get<QuoteTypeListResponse>('/v1/types', toQueryParams(options));
  }

  static async createType(request: CreateQuoteTypeRequest): Promise<QuoteType> {
    const client = this.getClient();
    return this.unwrap(await client.post<{ result: QuoteType }>('/v1/types', request));
  }

  static async updateType(id: string, request: UpdateQuoteTypeRequest): Promise<QuoteType> {
    const client = this.getClient();
    return this.unwrap(await client.patch<{ result: QuoteType }>(`/v1/types/${id}`, request));
  }

  static async deleteType(id: string): Promise<SuccessResponse> {
    const client = this.getClient();
    return client.delete<SuccessResponse>(`/v1/types/${id}`);
  }

  // ============================================
  // CONVENIENCE
  // ============================================

  static async createAndSend(request: CreateAndSendRequest): Promise<CreateAndSendResponse> {
    const client = this.getClient();
    const { items, bundleItems, send, ...quoteFields } = request;

    const quote = this.unwrap(await client.post<{ result: Quote }>('/v1/quotes', quoteFields));

    if (items && items.length > 0) {
      await client.post<{ results: LineItem[] }>(`/v1/quotes/${quote.id}/items`, items);
    }

    if (bundleItems && bundleItems.length > 0) {
      await client.post<{ results: LineItem[] }>(`/v1/quotes/${quote.id}/items/bundle`, bundleItems);
    }

    const sendResponse = await client.post<{ result: Quote; message: string }>(`/v1/quotes/${quote.id}/send`, send);

    return {
      quote: sendResponse.result,
    };
  }
}
