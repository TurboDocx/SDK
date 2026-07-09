/**
 * TurboQuote Module Tests
 *
 * Tests for all TurboQuote SDK operations organized by entity:
 * - Configuration
 * - Quotes (CRUD + status + PDF)
 * - Line Items
 * - Products
 * - Bundles
 * - Price Books
 * - Companies
 * - Contacts
 * - Templates
 * - Types/Categories
 * - Convenience methods (createAndSend)
 */

import { TurboQuote } from "../src/modules/quote";
import { HttpClient } from "../src/http";

jest.mock("../src/http", () => {
  const actual = jest.requireActual("../src/http");
  return {
    ...actual,
    HttpClient: jest.fn(),
  };
});

const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe("TurboQuote Module", () => {
  let mockClient: {
    get: jest.Mock;
    post: jest.Mock;
    patch: jest.Mock;
    delete: jest.Mock;
    getRaw: jest.Mock;
    postFormData: jest.Mock;
    patchFormData: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (TurboQuote as any).client = undefined;

    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      getRaw: jest.fn(),
      postFormData: jest.fn(),
      patchFormData: jest.fn(),
    };

    MockedHttpClient.mockImplementation(() => mockClient as any);
  });

  // ============================================
  // CONFIGURATION
  // ============================================

  describe("configure", () => {
    it("should configure the client with API key and org ID", () => {
      TurboQuote.configure({
        apiKey: "test-api-key",
        orgId: "test-org-id",
      });
      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        orgId: "test-org-id",
        skipSenderValidation: true,
      });
    });

    it("should configure with custom base URL", () => {
      TurboQuote.configure({
        apiKey: "test-key",
        orgId: "org-1",
        baseUrl: "https://custom.api.com",
      });
      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: "test-key",
        orgId: "org-1",
        baseUrl: "https://custom.api.com",
        skipSenderValidation: true,
      });
    });

    it("should configure with access token instead of API key", () => {
      TurboQuote.configure({
        accessToken: "oauth-token",
        orgId: "org-1",
      });
      expect(MockedHttpClient).toHaveBeenCalledWith({
        accessToken: "oauth-token",
        orgId: "org-1",
        skipSenderValidation: true,
      });
    });

    it("should auto-initialize from env vars when not configured", async () => {
      const mockResponse = { results: [], totalRecords: 0 };
      mockClient.get.mockResolvedValue(mockResponse);

      await TurboQuote.listQuotes();
      expect(MockedHttpClient).toHaveBeenCalledWith({ skipSenderValidation: true });
    });
  });

  // ============================================
  // QUOTE NUMBER CONFIG
  // ============================================

  describe("quote number config", () => {
    const sampleFormat = {
      prefix: "Q",
      yearToken: "four" as const,
      monthToken: "off" as const,
      separator: "-",
      padWidth: 5,
      suffix: "",
      startNumber: 1,
      resetCadence: "yearly" as const,
    };

    it("should get the quote number config and unwrap results", async () => {
      mockClient.get.mockResolvedValue({ results: { format: sampleFormat, currentFloor: 1 } });

      const result = await TurboQuote.getQuoteNumberConfig();

      expect(result.format.prefix).toBe("Q");
      expect(result.currentFloor).toBe(1);
      expect(mockClient.get).toHaveBeenCalledWith("/v1/quotes/number-config");
    });

    it("should update the quote number config via PATCH and unwrap results", async () => {
      const format = { ...sampleFormat, prefix: "INV", yearToken: "none" as const, padWidth: 4, startNumber: 1000, resetCadence: "never" as const };
      mockClient.patch.mockResolvedValue({ results: { format, currentFloor: 1000 } });

      const result = await TurboQuote.updateQuoteNumberConfig(format);

      expect(result.format.prefix).toBe("INV");
      expect(result.currentFloor).toBe(1000);
      expect(mockClient.patch).toHaveBeenCalledWith("/v1/quotes/number-config", format);
    });
  });

  // ============================================
  // QUOTES — CRUD
  // ============================================

  describe("Quotes CRUD", () => {
    beforeEach(() => {
      TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });
    });

    it("should list quotes with pagination and filters", async () => {
      const mockResponse = {
        results: [{ id: "q-1", name: "Test Quote", status: "draft" }],
        totalRecords: 1,
      };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await TurboQuote.listQuotes({ limit: 10, statuses: "draft", query: "test" });

      expect(result.results).toHaveLength(1);
      expect(result.totalRecords).toBe(1);
      expect(mockClient.get).toHaveBeenCalledWith(
        "/v1/quotes",
        expect.objectContaining({ limit: "10", statuses: "draft", query: "test" })
      );
    });

    it("should pass array statuses as string array (not comma-joined)", async () => {
      const mockResponse = { results: [], totalRecords: 0 };
      mockClient.get.mockResolvedValue(mockResponse);

      await TurboQuote.listQuotes({ statuses: ["draft", "sent"] });

      expect(mockClient.get).toHaveBeenCalledWith(
        "/v1/quotes",
        expect.objectContaining({ statuses: ["draft", "sent"] })
      );
    });

    it("should accept pending_approval as a valid quote status filter", async () => {
      const mockResponse = {
        results: [{ id: "q-1", name: "Pending Quote", status: "pending_approval" }],
        totalRecords: 1,
      };
      mockClient.get.mockResolvedValue(mockResponse);

      await TurboQuote.listQuotes({ statuses: "pending_approval" });

      expect(mockClient.get).toHaveBeenCalledWith(
        "/v1/quotes",
        expect.objectContaining({ statuses: "pending_approval" })
      );
    });

    it("should accept pending_approval in a multi-status array filter", async () => {
      const mockResponse = { results: [], totalRecords: 0 };
      mockClient.get.mockResolvedValue(mockResponse);

      await TurboQuote.listQuotes({ statuses: ["draft", "pending_approval", "sent"] });

      expect(mockClient.get).toHaveBeenCalledWith(
        "/v1/quotes",
        expect.objectContaining({ statuses: ["draft", "pending_approval", "sent"] })
      );
    });

    it("should create a quote and unwrap result", async () => {
      const mockQuote = { id: "q-1", name: "My Quote", status: "draft", quoteNumber: "Q-2026-00001" };
      mockClient.post.mockResolvedValue({ result: mockQuote, message: "Quote created successfully" });

      const result = await TurboQuote.createQuote({ name: "My Quote", companyId: "c-1", contactId: "ct-1" });

      expect(result.id).toBe("q-1");
      expect(result.status).toBe("draft");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/quotes",
        { name: "My Quote", companyId: "c-1", contactId: "ct-1" }
      );
    });

    it("should create a quote with all optional fields", async () => {
      const mockQuote = { id: "q-2", name: "Full Quote", status: "draft" };
      mockClient.post.mockResolvedValue({ result: mockQuote, message: "Quote created successfully" });

      await TurboQuote.createQuote({
        name: "Full Quote",
        companyId: "comp-1",
        contactId: "cont-1",
        currency: "EUR",
        termDays: 60,
        taxRate: 8.25,
        validUntil: "2026-12-31",
        priceBookId: "pb-1",
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/quotes",
        expect.objectContaining({
          name: "Full Quote",
          companyId: "comp-1",
          currency: "EUR",
          termDays: 60,
          taxRate: 8.25,
        })
      );
    });

    it("should get a quote by ID, unwrap result, and include statusInfo", async () => {
      const mockQuote = { id: "q-1", name: "Test Quote", status: "sent", lineItems: [] };
      const mockStatusInfo = { currentStatus: "sent", canSend: false, canAccept: true, canDecline: true, canVoid: true, isTerminal: false };
      mockClient.get.mockResolvedValue({ result: mockQuote, statusInfo: mockStatusInfo });

      const result = await TurboQuote.getQuote("q-1");

      expect(result.id).toBe("q-1");
      expect(result.statusInfo).toEqual(mockStatusInfo);
      expect(mockClient.get).toHaveBeenCalledWith("/v1/quotes/q-1");
    });

    it("should update a quote and unwrap result", async () => {
      const mockQuote = { id: "q-1", name: "Updated Name", taxRate: 10 };
      mockClient.patch.mockResolvedValue({ result: mockQuote, message: "Quote updated successfully" });

      const result = await TurboQuote.updateQuote("q-1", { name: "Updated Name", taxRate: 10 });

      expect(result.name).toBe("Updated Name");
      expect(mockClient.patch).toHaveBeenCalledWith(
        "/v1/quotes/q-1",
        { name: "Updated Name", taxRate: 10 }
      );
    });

    it("should delete a quote", async () => {
      const mockResponse = { message: "Quote deleted successfully" };
      mockClient.delete.mockResolvedValue(mockResponse);

      const result = await TurboQuote.deleteQuote("q-1");

      expect(result.message).toBe("Quote deleted successfully");
      expect(mockClient.delete).toHaveBeenCalledWith("/v1/quotes/q-1");
    });

    it("should duplicate a quote and unwrap result", async () => {
      const mockQuote = { id: "q-2", name: "Test Quote (Copy)", status: "draft", quoteNumber: "Q-2026-00002" };
      mockClient.post.mockResolvedValue({ result: mockQuote, message: "Quote duplicated successfully" });

      const result = await TurboQuote.duplicateQuote("q-1");

      expect(result.id).toBe("q-2");
      expect(result.status).toBe("draft");
      expect(mockClient.post).toHaveBeenCalledWith("/v1/quotes/q-1/duplicate");
    });

    it("should apply a price book and return full response with counts", async () => {
      const mockQuote = { id: "q-1", priceBookId: "pb-1" };
      mockClient.post.mockResolvedValue({ result: mockQuote, updatedCount: 3, skippedCount: 1, message: "Pricebook applied: 3 product(s) updated, 1 skipped" });

      const result = await TurboQuote.applyPriceBook("q-1", "pb-1");

      expect(result.quote.priceBookId).toBe("pb-1");
      expect(result.updatedCount).toBe(3);
      expect(result.skippedCount).toBe(1);
      expect(result.message).toBe("Pricebook applied: 3 product(s) updated, 1 skipped");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/quotes/q-1/apply-pricebook",
        { priceBookId: "pb-1" }
      );
    });

    it("should remove a price book and unwrap result", async () => {
      const mockQuote = { id: "q-1", priceBookId: null };
      mockClient.post.mockResolvedValue({ result: mockQuote, message: "Pricebook removed from quote" });

      const result = await TurboQuote.removePriceBook("q-1");

      expect(result.priceBookId).toBeNull();
      expect(mockClient.post).toHaveBeenCalledWith("/v1/quotes/q-1/remove-pricebook");
    });

    it("should download a quote PDF", async () => {
      const mockPdf = new ArrayBuffer(1024);
      mockClient.getRaw.mockResolvedValue(mockPdf);

      const result = await TurboQuote.downloadQuotePdf("q-1");

      expect(result).toBe(mockPdf);
      expect(mockClient.getRaw).toHaveBeenCalledWith("/v1/quotes/q-1/pdf");
    });
  });

  // ============================================
  // QUOTES — STATUS TRANSITIONS
  // ============================================

  describe("Quote Status", () => {
    beforeEach(() => {
      TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });
    });

    it("should send a quote and remap result to quote", async () => {
      const mockResponse = { result: { id: "q-1", status: "sent" }, message: "Quote sent" };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await TurboQuote.sendQuote("q-1", {
        ccEmails: ["admin@example.com"],
      });

      expect(result.quote.status).toBe("sent");
      expect(result.message).toBe("Quote sent");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/quotes/q-1/send",
        { ccEmails: ["admin@example.com"] }
      );
    });

    it("should send a quote without options", async () => {
      const mockResponse = { result: { id: "q-1", status: "sent" }, message: "Quote sent" };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await TurboQuote.sendQuote("q-1");

      expect(result.quote.id).toBe("q-1");
      expect(mockClient.post).toHaveBeenCalledWith("/v1/quotes/q-1/send", undefined);
    });

    it("should send a quote with a deliverable and return documentId", async () => {
      const mockResponse = { result: { id: "q-1", status: "sent" }, message: "Quote sent with deliverable", documentId: "doc-2" };
      mockClient.post.mockResolvedValue(mockResponse);

      const result = await TurboQuote.sendQuoteWithDeliverable("q-1", {
        deliverableId: "del-1",
        mergePosition: "end",
      });

      expect(result.quote.status).toBe("sent");
      expect(result.documentId).toBe("doc-2");
      expect(result.message).toBe("Quote sent with deliverable");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/quotes/q-1/send-with-deliverable",
        { deliverableId: "del-1", mergePosition: "end" }
      );
    });

    it("should decline a quote with object param and unwrap result", async () => {
      const mockQuote = { id: "q-1", status: "declined" };
      mockClient.post.mockResolvedValue({ result: mockQuote, message: "Quote declined" });

      const result = await TurboQuote.declineQuote("q-1", { reason: "Budget not approved" });

      expect(result.status).toBe("declined");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/quotes/q-1/decline",
        { reason: "Budget not approved" }
      );
    });

    it("should void a quote with object param and unwrap result", async () => {
      const mockQuote = { id: "q-1", status: "voided" };
      mockClient.post.mockResolvedValue({ result: mockQuote, message: "Quote voided successfully" });

      const result = await TurboQuote.voidQuote("q-1", { reason: "Replaced by new quote" });

      expect(result.status).toBe("voided");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/quotes/q-1/void",
        { reason: "Replaced by new quote" }
      );
    });

    it("should handle an expired sent quote and unwrap result", async () => {
      const mockQuote = { id: "q-2", status: "draft", quoteNumber: "Q-2026-00003" };
      mockClient.post.mockResolvedValue({ result: mockQuote, message: "Expired quote processed" });

      const result = await TurboQuote.handleExpiredQuote("q-1", {
        action: "void",
        reason: "Expired",
        newValidUntil: "2026-12-31",
      });

      expect(result.status).toBe("draft");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/quotes/q-1/handle-expired-sent",
        { action: "void", reason: "Expired", newValidUntil: "2026-12-31" }
      );
    });
  });

  // ============================================
  // LINE ITEMS
  // ============================================

  describe("Line Items", () => {
    beforeEach(() => {
      TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });
    });

    it("should list line items for a quote", async () => {
      const mockResponse = { results: [{ id: "li-1", productName: "Widget" }], totalRecords: 1 };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await TurboQuote.listLineItems("q-1");

      expect(result.results).toHaveLength(1);
      expect(mockClient.get).toHaveBeenCalledWith("/v1/quotes/q-1/items", undefined);
    });

    it("should add a single product line item and unwrap results", async () => {
      const mockItems = [{ id: "li-1", productId: "prod-1", quantity: 2 }];
      mockClient.post.mockResolvedValue({ results: mockItems, message: "1 line item(s) added successfully" });

      const item = { productId: "prod-1" as string | null, productName: "Widget", unitPrice: 50, billingFrequency: "monthly" as const, quantity: 2 };
      const result = await TurboQuote.addLineItems("q-1", item);

      expect(result).toHaveLength(1);
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/quotes/q-1/items",
        [item]
      );
    });

    it("addLineItems custom line item sends explicit productId null", async () => {
      // Backend joiAddProductLineItemSchema declares productId as .allow(null).required():
      // the key MUST be present even when null (that's how a custom/ad-hoc line item is
      // expressed). If a serializer drops the null key, the backend 400s. This locks the
      // JS SDK's wire format to emit an explicit "productId":null.
      const mockFetch = jest.fn();
      global.fetch = mockFetch as any;
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: { get: () => "application/json" },
        json: async () => ({
          data: { results: [{ id: "li-1" }], message: "1 line item(s) added successfully" },
        }),
      });

      // Use the real HttpClient (the file-level jest.mock otherwise swaps in mockClient,
      // so global.fetch would never be reached) to exercise actual JSON.stringify serialization.
      const ActualHttpClient = jest.requireActual("../src/http").HttpClient;
      MockedHttpClient.mockImplementation((...args: any[]) => new ActualHttpClient(...args));
      TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });

      const customItem = {
        productId: null as string | null,
        productName: "Custom Service",
        unitPrice: 500,
        billingFrequency: "one-time" as const,
        quantity: 1,
      };

      await TurboQuote.addLineItems("q-1", customItem);

      const sentBody = mockFetch.mock.calls[0][1].body as string;
      expect(sentBody).toContain('"productId":null');
    });

    it("should add multiple product line items as batch", async () => {
      const mockItems = [{ id: "li-1" }, { id: "li-2" }];
      mockClient.post.mockResolvedValue({ results: mockItems, message: "2 line item(s) added successfully" });

      const items = [
        { productId: "prod-1" as string | null, productName: "Widget A", unitPrice: 50, billingFrequency: "monthly" as const, quantity: 5 },
        { productId: "prod-2" as string | null, productName: "Widget B", unitPrice: 75, billingFrequency: "monthly" as const, quantity: 1, discountPercent: 10 },
      ];
      const result = await TurboQuote.addLineItems("q-1", items);

      expect(result).toHaveLength(2);
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/quotes/q-1/items",
        items
      );
    });

    it("should add a single bundle line item and unwrap results", async () => {
      const mockItems = [{ id: "li-3", bundleId: "bun-1", lineItemType: "bundle" }];
      mockClient.post.mockResolvedValue({ results: mockItems, message: "1 bundle(s) added successfully" });

      const result = await TurboQuote.addBundleLineItems("q-1", { bundleId: "bun-1", bundleName: "Starter Pack" });

      expect(result).toHaveLength(1);
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/quotes/q-1/items/bundle",
        [{ bundleId: "bun-1", bundleName: "Starter Pack" }]
      );
    });

    it("should update a line item and unwrap result", async () => {
      const mockItem = { id: "li-1", quantity: 10, unitPrice: 50 };
      mockClient.patch.mockResolvedValue({ result: mockItem, message: "Line item updated successfully" });

      const result = await TurboQuote.updateLineItem("q-1", "li-1", { quantity: 10, unitPrice: 50 });

      expect(result.quantity).toBe(10);
      expect(mockClient.patch).toHaveBeenCalledWith(
        "/v1/quotes/q-1/items/li-1",
        { quantity: 10, unitPrice: 50 }
      );
    });

    it("should remove a line item", async () => {
      const mockResponse = { message: "Line item removed successfully" };
      mockClient.delete.mockResolvedValue(mockResponse);

      const result = await TurboQuote.removeLineItem("q-1", "li-1");

      expect(result.message).toBe("Line item removed successfully");
      expect(mockClient.delete).toHaveBeenCalledWith("/v1/quotes/q-1/items/li-1");
    });
  });

  // ============================================
  // PRODUCTS
  // ============================================

  describe("Products", () => {
    beforeEach(() => {
      TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });
    });

    it("should list products with filters", async () => {
      const mockResponse = { results: [{ id: "p-1", name: "Widget" }], totalRecords: 1 };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await TurboQuote.listProducts({ billingFrequency: "monthly", limit: 25 });

      expect(result.results).toHaveLength(1);
      expect(mockClient.get).toHaveBeenCalledWith(
        "/v1/products",
        expect.objectContaining({ billingFrequency: "monthly", limit: "25" })
      );
    });

    it("should create a product without images and unwrap result", async () => {
      const mockProduct = { id: "p-1", name: "Widget Pro", listPrice: 99.99 };
      mockClient.post.mockResolvedValue({ result: mockProduct, message: "Product created successfully" });

      const result = await TurboQuote.createProduct({
        name: "Widget Pro",
        listPrice: 99.99,
        billingFrequency: "monthly",
        categoryId: "cat-1",
      });

      expect(result.name).toBe("Widget Pro");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/products",
        { name: "Widget Pro", listPrice: 99.99, billingFrequency: "monthly", categoryId: "cat-1" }
      );
    });

    it("should get a product by ID and unwrap result", async () => {
      const mockProduct = { id: "p-1", name: "Widget", images: [] };
      mockClient.get.mockResolvedValue({ result: mockProduct });

      const result = await TurboQuote.getProduct("p-1");

      expect(result.id).toBe("p-1");
      expect(mockClient.get).toHaveBeenCalledWith("/v1/products/p-1");
    });

    it("should update a product without images and unwrap result", async () => {
      const mockProduct = { id: "p-1", name: "Updated Widget", listPrice: 149.99 };
      mockClient.patch.mockResolvedValue({ result: mockProduct, message: "Product updated successfully" });

      const result = await TurboQuote.updateProduct("p-1", { name: "Updated Widget", listPrice: 149.99 });

      expect(result.name).toBe("Updated Widget");
      expect(mockClient.patch).toHaveBeenCalledWith(
        "/v1/products/p-1",
        { name: "Updated Widget", listPrice: 149.99 }
      );
    });

    it("should delete a product", async () => {
      const mockResponse = { message: "Product deleted successfully" };
      mockClient.delete.mockResolvedValue(mockResponse);

      const result = await TurboQuote.deleteProduct("p-1");

      expect(result.message).toBe("Product deleted successfully");
      expect(mockClient.delete).toHaveBeenCalledWith("/v1/products/p-1");
    });

    it("should duplicate a product and unwrap result", async () => {
      const mockProduct = { id: "p-2", name: "Widget Pro (Copy)" };
      mockClient.post.mockResolvedValue({ result: mockProduct, message: "Product duplicated successfully" });

      const result = await TurboQuote.duplicateProduct("p-1");

      expect(result.id).toBe("p-2");
      expect(mockClient.post).toHaveBeenCalledWith("/v1/products/p-1/duplicate");
    });

    it("should pack product fields into a 'data' JSON field when creating with images", async () => {
      const mockProduct = { id: "p-1", name: "Widget", listPrice: 99 };
      mockClient.postFormData.mockResolvedValue({ result: mockProduct, message: "Product created successfully" });

      const fakeImage = Buffer.from("fake-image");
      await TurboQuote.createProduct({
        name: "Widget",
        listPrice: 99,
        billingFrequency: "monthly",
        categoryId: "cat-1",
        images: [fakeImage],
      });

      expect(mockClient.postFormData).toHaveBeenCalledWith(
        "/v1/products",
        expect.any(FormData)
      );

      const formData = mockClient.postFormData.mock.calls[0][1] as FormData;
      const dataField = formData.get("data");
      expect(dataField).toBeTruthy();

      const parsed = JSON.parse(dataField as string);
      expect(parsed.name).toBe("Widget");
      expect(parsed.listPrice).toBe(99);
      expect(parsed.billingFrequency).toBe("monthly");
      expect(parsed.categoryId).toBe("cat-1");
    });

    it("should pack product fields into 'data' JSON field on update with images", async () => {
      const mockProduct = { id: "p-1", name: "Updated Widget" };
      mockClient.patchFormData.mockResolvedValue({ result: mockProduct, message: "Product updated successfully" });

      const fakeImage = Buffer.from("fake-image");
      await TurboQuote.updateProduct("p-1", {
        name: "Updated Widget",
        images: [fakeImage],
        imageIdsToKeep: ["img-id-1"],
      });

      expect(mockClient.patchFormData).toHaveBeenCalledWith(
        "/v1/products/p-1",
        expect.any(FormData)
      );

      const formData = mockClient.patchFormData.mock.calls[0][1] as FormData;
      const dataField = formData.get("data");
      expect(dataField).toBeTruthy();

      const parsed = JSON.parse(dataField as string);
      expect(parsed.name).toBe("Updated Widget");
      expect(parsed.imageIdsToKeep).toEqual(["img-id-1"]);
    });

    it("should detect MIME type from magic bytes for Buffer images", async () => {
      const mockProduct = { id: "p-1", name: "Widget" };
      mockClient.postFormData.mockResolvedValue({ result: mockProduct, message: "Product created successfully" });

      // JPEG magic bytes: 0xFF 0xD8 0xFF
      const jpegBuffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
      // PNG magic bytes: 0x89 0x50 0x4E 0x47
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A]);

      await TurboQuote.createProduct({
        name: "Widget",
        listPrice: 50,
        billingFrequency: "one-time",
        categoryId: "cat-1",
        images: [jpegBuffer, pngBuffer],
      });

      const formData = mockClient.postFormData.mock.calls[0][1] as FormData;
      const imageEntries = formData.getAll("images");
      expect(imageEntries).toHaveLength(2);

      // Verify JPEG Blob has correct MIME type
      const jpegBlob = imageEntries[0] as Blob;
      expect(jpegBlob.type).toBe("image/jpeg");

      // Verify PNG Blob has correct MIME type
      const pngBlob = imageEntries[1] as Blob;
      expect(pngBlob.type).toBe("image/png");
    });

    it("should get primary images and unwrap results", async () => {
      const mockImageMap = { "p-1": { id: "img-1", productId: "p-1" }, "p-2": null };
      mockClient.post.mockResolvedValue({ results: mockImageMap });

      const result = await TurboQuote.getProductPrimaryImages(["p-1", "p-2"]);

      expect(result["p-1"]).toEqual({ id: "img-1", productId: "p-1" });
      expect(result["p-2"]).toBeNull();
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/products/primary-images",
        { productIds: ["p-1", "p-2"] }
      );
    });
  });

  // ============================================
  // PRICE BOOKS
  // ============================================

  describe("Price Books", () => {
    beforeEach(() => {
      TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });
    });

    it("should list price books", async () => {
      const mockResponse = { results: [{ id: "pb-1", name: "Standard" }], totalRecords: 1 };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await TurboQuote.listPriceBooks();

      expect(result.results).toHaveLength(1);
      expect(mockClient.get).toHaveBeenCalledWith("/v1/pricebooks", undefined);
    });

    it("should create a price book and unwrap result", async () => {
      const mockPriceBook = { id: "pb-1", name: "Partner Pricing", discountPercent: 15 };
      mockClient.post.mockResolvedValue({ result: mockPriceBook, message: "PriceBook created successfully" });

      const result = await TurboQuote.createPriceBook({
        name: "Partner Pricing",
        priceBookTypeId: "pbt-1",
        validFrom: "2026-01-01",
        discountPercent: 15,
      });

      expect(result.name).toBe("Partner Pricing");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/pricebooks",
        { name: "Partner Pricing", priceBookTypeId: "pbt-1", validFrom: "2026-01-01", discountPercent: 15 }
      );
    });

    it("should default discountPercent to 0 when omitted (backend requires it on POST)", async () => {
      // Backend joiPriceBook POST schema requires discountPercent (omitting it returns 400).
      // The SDK fills the backend's documented default (0) so a pricebook with per-product
      // pricing (no blanket discount) can be created without forcing the caller to pass 0.
      mockClient.post.mockResolvedValue({ result: { id: "pb-1", name: "No Discount" } });

      await TurboQuote.createPriceBook({
        name: "No Discount",
        priceBookTypeId: "pbt-1",
        validFrom: "2026-01-01",
      });

      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/pricebooks",
        expect.objectContaining({ discountPercent: 0 })
      );
    });

    it("should get a price book by ID and unwrap result", async () => {
      const mockPriceBook = { id: "pb-1", name: "Standard" };
      mockClient.get.mockResolvedValue({ result: mockPriceBook });

      const result = await TurboQuote.getPriceBook("pb-1");

      expect(result.id).toBe("pb-1");
      expect(mockClient.get).toHaveBeenCalledWith("/v1/pricebooks/pb-1");
    });

    it("should update a price book and unwrap result", async () => {
      const mockPriceBook = { id: "pb-1", name: "Updated", discountPercent: 20 };
      mockClient.patch.mockResolvedValue({ result: mockPriceBook, message: "PriceBook updated successfully" });

      const result = await TurboQuote.updatePriceBook("pb-1", { discountPercent: 20 });

      expect(result.discountPercent).toBe(20);
    });

    it("should delete a price book", async () => {
      mockClient.delete.mockResolvedValue({ message: "PriceBook deleted successfully" });

      const result = await TurboQuote.deletePriceBook("pb-1");

      expect(result.message).toBe("PriceBook deleted successfully");
    });

    it("should duplicate a price book and unwrap result", async () => {
      mockClient.post.mockResolvedValue({ result: { id: "pb-2", name: "Standard (Copy)" }, message: "Pricebook duplicated successfully" });

      const result = await TurboQuote.duplicatePriceBook("pb-1");

      expect(result.id).toBe("pb-2");
      expect(mockClient.post).toHaveBeenCalledWith("/v1/pricebooks/pb-1/duplicate");
    });

    it("should list products in a price book", async () => {
      const mockResponse = { results: [{ productId: "p-1", discountPercent: 10 }], totalRecords: 1 };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await TurboQuote.listPriceBookProducts("pb-1");

      expect(result.results).toHaveLength(1);
      expect(mockClient.get).toHaveBeenCalledWith("/v1/pricebooks/pb-1/products", undefined);
    });
  });

  // ============================================
  // BUNDLES
  // ============================================

  describe("Bundles", () => {
    beforeEach(() => {
      TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });
    });

    it("should list bundles", async () => {
      const mockResponse = { results: [{ id: "b-1", name: "Starter Pack" }], totalRecords: 1 };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await TurboQuote.listBundles();

      expect(result.results).toHaveLength(1);
    });

    it("should create a bundle and unwrap result", async () => {
      const mockBundle = { id: "b-1", name: "Starter Pack", items: [] };
      mockClient.post.mockResolvedValue({ result: mockBundle, message: "Bundle created successfully" });

      const result = await TurboQuote.createBundle({
        name: "Starter Pack",
        categoryId: "cat-1",
        items: [{ productId: "p-1", unitPrice: 50, billingFrequency: "monthly" }],
      });

      expect(result.name).toBe("Starter Pack");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/bundles",
        expect.objectContaining({ name: "Starter Pack", categoryId: "cat-1" })
      );
    });

    it("should get a bundle by ID and unwrap result", async () => {
      mockClient.get.mockResolvedValue({ result: { id: "b-1", items: [] } });

      const result = await TurboQuote.getBundle("b-1");

      expect(result.id).toBe("b-1");
      expect(mockClient.get).toHaveBeenCalledWith("/v1/bundles/b-1");
    });

    it("should update a bundle and unwrap result", async () => {
      mockClient.patch.mockResolvedValue({ result: { id: "b-1", name: "Pro Pack" }, message: "Bundle updated successfully" });

      const result = await TurboQuote.updateBundle("b-1", { name: "Pro Pack" });

      expect(result.name).toBe("Pro Pack");
    });

    it("should delete a bundle", async () => {
      mockClient.delete.mockResolvedValue({ message: "Bundle deleted successfully" });

      const result = await TurboQuote.deleteBundle("b-1");

      expect(result.message).toBe("Bundle deleted successfully");
    });

    it("should duplicate a bundle and unwrap result", async () => {
      mockClient.post.mockResolvedValue({ result: { id: "b-2" }, message: "Bundle duplicated successfully" });

      const result = await TurboQuote.duplicateBundle("b-1");

      expect(result.id).toBe("b-2");
      expect(mockClient.post).toHaveBeenCalledWith("/v1/bundles/b-1/duplicate");
    });
  });

  // ============================================
  // COMPANIES
  // ============================================

  describe("Companies", () => {
    beforeEach(() => {
      TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });
    });

    it("should list companies", async () => {
      const mockResponse = { results: [{ id: "c-1", name: "Acme Corp" }], totalRecords: 1 };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await TurboQuote.listCompanies({ query: "acme" });

      expect(result.results).toHaveLength(1);
      expect(mockClient.get).toHaveBeenCalledWith(
        "/v1/companies",
        expect.objectContaining({ query: "acme" })
      );
    });

    it("should create a company and unwrap result", async () => {
      const mockCompany = { id: "c-1", name: "Acme Corp" };
      mockClient.post.mockResolvedValue({ result: mockCompany, message: "Company created successfully" });

      const result = await TurboQuote.createCompany({
        name: "Acme Corp",
        contacts: [{ name: "John Doe", email: "john@acme.com" }],
        city: "Austin",
        state: "TX",
      });

      expect(result.name).toBe("Acme Corp");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/companies",
        { name: "Acme Corp", contacts: [{ name: "John Doe", email: "john@acme.com" }], city: "Austin", state: "TX" }
      );
    });

    it("should get a company by ID and unwrap result", async () => {
      mockClient.get.mockResolvedValue({ result: { id: "c-1", name: "Acme" } });

      const result = await TurboQuote.getCompany("c-1");

      expect(result.id).toBe("c-1");
      expect(mockClient.get).toHaveBeenCalledWith("/v1/companies/c-1");
    });

    it("should update a company and unwrap result", async () => {
      mockClient.patch.mockResolvedValue({ result: { id: "c-1", name: "Acme Inc" }, message: "Company updated successfully" });

      const result = await TurboQuote.updateCompany("c-1", { name: "Acme Inc" });

      expect(result.name).toBe("Acme Inc");
    });

    it("should delete a company", async () => {
      mockClient.delete.mockResolvedValue({ message: "Company deleted successfully" });

      const result = await TurboQuote.deleteCompany("c-1");

      expect(result.message).toBe("Company deleted successfully");
    });

    it("should list contacts for a company", async () => {
      const mockResponse = { results: [{ id: "ct-1", name: "John Doe" }], totalRecords: 1 };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await TurboQuote.listCompanyContacts("c-1");

      expect(result.results).toHaveLength(1);
      expect(mockClient.get).toHaveBeenCalledWith("/v1/companies/c-1/contacts", undefined);
    });
  });

  // ============================================
  // CONTACTS
  // ============================================

  describe("Contacts", () => {
    beforeEach(() => {
      TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });
    });

    it("should list contacts with optional company filter", async () => {
      const mockResponse = { results: [{ id: "ct-1", name: "Jane" }], totalRecords: 1 };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await TurboQuote.listContacts({ companyId: "c-1" });

      expect(result.results).toHaveLength(1);
      expect(mockClient.get).toHaveBeenCalledWith(
        "/v1/contacts",
        expect.objectContaining({ companyId: "c-1" })
      );
    });

    it("should create a contact and unwrap result", async () => {
      const mockContact = { id: "ct-1", name: "John Doe", email: "john@example.com" };
      mockClient.post.mockResolvedValue({ result: mockContact, message: "Contact created successfully" });

      const result = await TurboQuote.createContact({
        name: "John Doe",
        companyId: "c-1",
        email: "john@example.com",
      });

      expect(result.name).toBe("John Doe");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/contacts",
        { name: "John Doe", companyId: "c-1", email: "john@example.com" }
      );
    });

    it("should update a contact and unwrap result", async () => {
      mockClient.patch.mockResolvedValue({ result: { id: "ct-1", name: "Jane Doe" }, message: "Contact updated successfully" });

      const result = await TurboQuote.updateContact("ct-1", { name: "Jane Doe" });

      expect(result.name).toBe("Jane Doe");
    });

    it("should delete a contact", async () => {
      mockClient.delete.mockResolvedValue({ message: "Contact deleted successfully" });

      const result = await TurboQuote.deleteContact("ct-1");

      expect(result.message).toBe("Contact deleted successfully");
    });
  });

  // ============================================
  // TEMPLATES
  // ============================================

  describe("Templates", () => {
    beforeEach(() => {
      TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });
    });

    it("should list all templates", async () => {
      const mockResponse = { results: [{ id: "t-1", primaryColor: "#0066FF" }, { id: "t-2", primaryColor: "#FF0000" }], totalRecords: 2 };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await TurboQuote.listTemplates();

      expect(result.results).toHaveLength(2);
      expect(mockClient.get).toHaveBeenCalledWith("/v1/quote-templates", undefined);
    });

    it("should list templates with pagination and query params", async () => {
      const mockResponse = { results: [{ id: "t-1", primaryColor: "#0066FF" }], totalRecords: 1 };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await TurboQuote.listTemplates({ query: "sales", limit: 10, offset: 0 });

      expect(result.results).toHaveLength(1);
      expect(mockClient.get).toHaveBeenCalledWith("/v1/quote-templates", { query: "sales", limit: "10", offset: "0" });
    });

    it("should get a template by ID and unwrap result", async () => {
      const mockTemplate = { id: "t-1", primaryColor: "#0066FF" };
      mockClient.get.mockResolvedValue({ result: mockTemplate });

      const result = await TurboQuote.getTemplateById("t-1");

      expect(result.id).toBe("t-1");
      expect(mockClient.get).toHaveBeenCalledWith("/v1/quote-templates/t-1");
    });

    it("should get the org template and unwrap result", async () => {
      const mockTemplate = { id: "t-1", primaryColor: "#0066FF" };
      mockClient.get.mockResolvedValue({ result: mockTemplate, message: "Template found" });

      const result = await TurboQuote.getTemplate();

      expect(result.id).toBe("t-1");
      expect(mockClient.get).toHaveBeenCalledWith("/v1/quote-template");
    });

    it("should create a template and unwrap result", async () => {
      const mockTemplate = { id: "t-1", primaryColor: "#0066FF" };
      mockClient.post.mockResolvedValue({ result: mockTemplate, message: "Template created successfully" });

      const result = await TurboQuote.createTemplate({ primaryColor: "#0066FF", senderName: "Sales" });

      expect(result.id).toBe("t-1");
      expect(mockClient.post).toHaveBeenCalledWith(
        "/v1/quote-templates",
        { primaryColor: "#0066FF", senderName: "Sales" }
      );
    });

    it("should update a template and unwrap result", async () => {
      mockClient.patch.mockResolvedValue({ result: { id: "t-1", primaryColor: "#FF0000" }, message: "Template updated successfully" });

      const result = await TurboQuote.updateTemplate("t-1", { primaryColor: "#FF0000" });

      expect(result.primaryColor).toBe("#FF0000");
      expect(mockClient.patch).toHaveBeenCalledWith(
        "/v1/quote-templates/t-1",
        { primaryColor: "#FF0000" }
      );
    });

    it("should delete a template", async () => {
      mockClient.delete.mockResolvedValue({ message: "Template deleted successfully" });

      const result = await TurboQuote.deleteTemplate("t-1");

      expect(result.message).toBe("Template deleted successfully");
      expect(mockClient.delete).toHaveBeenCalledWith("/v1/quote-templates/t-1");
    });
  });

  // ============================================
  // TYPES / CATEGORIES
  // ============================================

  describe("Types / Categories", () => {
    beforeEach(() => {
      TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });
    });

    it("should list types by category", async () => {
      const mockResponse = { results: [{ id: "type-1", name: "Technology" }], totalRecords: 1 };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await TurboQuote.listTypes({ categoryType: "company_industry" });

      expect(result.results).toHaveLength(1);
      expect(mockClient.get).toHaveBeenCalledWith(
        "/v1/types",
        expect.objectContaining({ categoryType: "company_industry" })
      );
    });

    it("should list types without options", async () => {
      const mockResponse = { results: [], totalRecords: 0 };
      mockClient.get.mockResolvedValue(mockResponse);

      const result = await TurboQuote.listTypes();

      expect(result.results).toHaveLength(0);
      expect(mockClient.get).toHaveBeenCalledWith("/v1/types", undefined);
    });

    it("should create a type and unwrap result", async () => {
      const mockType = { id: "type-1", name: "SaaS", categoryType: "product_category" };
      mockClient.post.mockResolvedValue({ result: mockType, message: "Type created successfully" });

      const result = await TurboQuote.createType({ name: "SaaS", categoryType: "product_category" });

      expect(result.name).toBe("SaaS");
    });

    it("should update a type and unwrap result", async () => {
      mockClient.patch.mockResolvedValue({ result: { id: "type-1", name: "Software" }, message: "Type updated successfully" });

      const result = await TurboQuote.updateType("type-1", { name: "Software" });

      expect(result.name).toBe("Software");
    });

    it("should delete a type", async () => {
      mockClient.delete.mockResolvedValue({ message: "Type deleted successfully" });

      const result = await TurboQuote.deleteType("type-1");

      expect(result.message).toBe("Type deleted successfully");
    });
  });

  // ============================================
  // BULK CREATES (partial-success import endpoints)
  // ============================================

  describe("Bulk Creates", () => {
    // All six bulk endpoints share the same wire contract: POST {resource}/bulk
    // with { rows: [...] }, response { results: { imported, failed, adjusted } }.
    const bulkResult = {
      imported: 2,
      failed: [{ row: 3, reason: "A product with this name already exists" }],
      adjusted: [],
    };

    beforeEach(() => {
      TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });
      mockClient.post.mockResolvedValue({ results: bulkResult });
    });

    it("should POST product rows to /v1/products/bulk wrapped in { rows } and unwrap results", async () => {
      const rows = [
        { name: "Widget A", listPrice: 10, billingFrequency: "monthly" as const, categoryId: "cat-1" },
        { name: "Widget B", listPrice: 20, billingFrequency: "one-time" as const, categoryId: "cat-1" },
      ];

      const result = await TurboQuote.bulkCreateProducts(rows);

      expect(mockClient.post).toHaveBeenCalledWith("/v1/products/bulk", { rows });
      expect(result.imported).toBe(2);
      expect(result.failed).toEqual([{ row: 3, reason: "A product with this name already exists" }]);
      expect(result.adjusted).toEqual([]);
    });

    it("should POST price book rows to /v1/pricebooks/bulk", async () => {
      const rows = [{ name: "EMEA 2026", priceBookTypeId: "type-1", validFrom: "2026-01-01", discountPercent: 5 }];
      await TurboQuote.bulkCreatePriceBooks(rows);
      expect(mockClient.post).toHaveBeenCalledWith("/v1/pricebooks/bulk", { rows });
    });

    it("should POST bundle rows to /v1/bundles/bulk", async () => {
      const rows = [
        {
          name: "Starter Pack",
          categoryId: "cat-1",
          items: [{ productId: "p-1", unitPrice: 10, billingFrequency: "monthly" as const, quantity: 2 }],
        },
      ];
      await TurboQuote.bulkCreateBundles(rows);
      expect(mockClient.post).toHaveBeenCalledWith("/v1/bundles/bulk", { rows });
    });

    it("should POST company rows (each with contacts) to /v1/companies/bulk", async () => {
      const rows = [
        { name: "Acme Corp", contacts: [{ name: "Jane Doe", email: "jane@acme.com" }] },
      ];
      await TurboQuote.bulkCreateCompanies(rows);
      expect(mockClient.post).toHaveBeenCalledWith("/v1/companies/bulk", { rows });
    });

    it("should POST contact rows (each with companyId) to /v1/contacts/bulk", async () => {
      const rows = [{ name: "John Smith", companyId: "c-1", email: "john@acme.com" }];
      await TurboQuote.bulkCreateContacts(rows);
      expect(mockClient.post).toHaveBeenCalledWith("/v1/contacts/bulk", { rows });
    });

    it("should POST type rows to /v1/types/bulk", async () => {
      const rows = [{ name: "Hardware", categoryType: "product_category" as const }];
      await TurboQuote.bulkCreateTypes(rows);
      expect(mockClient.post).toHaveBeenCalledWith("/v1/types/bulk", { rows });
    });

    it("should surface partial-success details (failed rows are 1-indexed, not thrown)", async () => {
      mockClient.post.mockResolvedValue({
        results: { imported: 1, failed: [{ row: 2, reason: "Company not found" }], adjusted: [{ row: 1, reason: "Dropped unknown product" }] },
      });

      const result = await TurboQuote.bulkCreateContacts([
        { name: "Ok Row", companyId: "c-1" },
        { name: "Bad Row", companyId: "missing" },
      ]);

      expect(result.imported).toBe(1);
      expect(result.failed[0]).toEqual({ row: 2, reason: "Company not found" });
      expect(result.adjusted[0]).toEqual({ row: 1, reason: "Dropped unknown product" });
    });
  });

  // ============================================
  // CONVENIENCE — createAndSend
  // ============================================

  describe("createAndSend", () => {
    beforeEach(() => {
      TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });
    });

    it("should create a quote, add items, and send in one call", async () => {
      const mockQuote = { id: "q-1", name: "Enterprise License", status: "draft" };
      const mockItems = { results: [{ id: "li-1" }], message: "1 line item(s) added successfully" };
      const mockSendResponse = { result: { ...mockQuote, status: "sent" }, message: "Sent" };

      mockClient.post
        .mockResolvedValueOnce({ result: mockQuote, message: "Quote created successfully" })
        .mockResolvedValueOnce(mockItems)
        .mockResolvedValueOnce(mockSendResponse);

      const result = await TurboQuote.createAndSend({
        name: "Enterprise License",
        companyId: "c-1",
        contactId: "ct-1",
        items: [{ productId: "p-1", productName: "Widget", unitPrice: 99, billingFrequency: "monthly", quantity: 10 }],
        send: { ccEmails: ["admin@example.com"] },
      });

      expect(result.quote.status).toBe("sent");
      expect((result as any).documentId).toBeUndefined();

      const postCalls = mockClient.post.mock.calls;
      expect(postCalls[0][0]).toBe("/v1/quotes");
      expect(postCalls[1][0]).toBe("/v1/quotes/q-1/items");
      expect(postCalls[2][0]).toBe("/v1/quotes/q-1/send");
    });

    it("should create and send without items", async () => {
      const mockQuote = { id: "q-1", name: "Simple Quote", status: "draft" };
      const mockSendResponse = { result: { ...mockQuote, status: "sent" }, message: "Sent" };

      mockClient.post
        .mockResolvedValueOnce({ result: mockQuote, message: "Quote created successfully" })
        .mockResolvedValueOnce(mockSendResponse);

      const result = await TurboQuote.createAndSend({
        name: "Simple Quote",
        companyId: "c-1",
        contactId: "ct-1",
      });

      expect(result.quote.status).toBe("sent");
      const postCalls = mockClient.post.mock.calls;
      expect(postCalls).toHaveLength(2);
      expect(postCalls[0][0]).toBe("/v1/quotes");
      expect(postCalls[1][0]).toBe("/v1/quotes/q-1/send");
    });

    it("should create and send with bundle items", async () => {
      const mockQuote = { id: "q-1", name: "Bundle Quote", status: "draft" };
      const mockBundleItems = { results: [{ id: "li-1", lineItemType: "bundle" }], message: "1 bundle(s) added successfully" };
      const mockSendResponse = { result: { ...mockQuote, status: "sent" }, message: "Sent" };

      mockClient.post
        .mockResolvedValueOnce({ result: mockQuote, message: "Quote created successfully" })
        .mockResolvedValueOnce(mockBundleItems)
        .mockResolvedValueOnce(mockSendResponse);

      const result = await TurboQuote.createAndSend({
        name: "Bundle Quote",
        companyId: "c-1",
        contactId: "ct-1",
        bundleItems: [{ bundleId: "b-1", bundleName: "Starter Pack" }],
      });

      expect(result.quote.status).toBe("sent");
      const postCalls = mockClient.post.mock.calls;
      expect(postCalls[1][0]).toBe("/v1/quotes/q-1/items/bundle");
    });
  });

  // ============================================
  // ERROR HANDLING
  // ============================================

  describe("Error Handling", () => {
    it("should propagate API errors from HttpClient", async () => {
      const apiError = { statusCode: 404, message: "Quote not found" };
      mockClient.get.mockRejectedValue(apiError);
      TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });

      await expect(TurboQuote.getQuote("invalid")).rejects.toEqual(apiError);
    });

    it("should propagate validation errors", async () => {
      const validationError = { statusCode: 400, message: "Name is required" };
      mockClient.post.mockRejectedValue(validationError);
      TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });

      await expect(TurboQuote.createQuote({ name: "", companyId: "c-1", contactId: "ct-1" })).rejects.toEqual(validationError);
    });
  });
});
