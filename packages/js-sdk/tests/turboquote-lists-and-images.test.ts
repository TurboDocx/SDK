/**
 * TurboQuote: list sorting and filters, the quote summary / creators / next number reads,
 * open quotes, product quote images, custom line item images, named duplicates, company
 * email and price book reset.
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

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);

describe("TurboQuote lists, reads and images", () => {
  let mockClient: {
    get: jest.Mock;
    post: jest.Mock;
    put: jest.Mock;
    patch: jest.Mock;
    delete: jest.Mock;
    postFormData: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (TurboQuote as any).client = undefined;
    mockClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn(),
      postFormData: jest.fn(),
    };
    MockedHttpClient.mockImplementation(() => mockClient as any);
    TurboQuote.configure({ apiKey: "test-key", orgId: "org-1" });
  });

  // ============================================
  // SORTING AND FILTERS
  // ============================================

  describe("listQuotes", () => {
    it("sends the sort, the new filters and the summary currency as query params", async () => {
      mockClient.get.mockResolvedValue({ results: [], totalRecords: 0 });

      await TurboQuote.listQuotes({
        sortBy: "total",
        sortDirection: "asc",
        statuses: ["sent", "expired"],
        companyIds: ["c-1", "c-2"],
        currencies: ["USD", "EUR"],
        createdBy: ["u-1"],
        createdByApiKeys: true,
        validUntilWindow: "thisMonth",
        validUntilFrom: "2026-10-01",
        validUntilTo: "2026-10-31",
        summaryCurrency: "EUR",
      });

      expect(mockClient.get).toHaveBeenCalledWith("/v1/quotes", {
        sortBy: "total",
        sortDirection: "asc",
        statuses: ["sent", "expired"],
        companyIds: ["c-1", "c-2"],
        currencies: ["USD", "EUR"],
        createdBy: ["u-1"],
        createdByApiKeys: "true",
        validUntilWindow: "thisMonth",
        validUntilFrom: "2026-10-01",
        validUntilTo: "2026-10-31",
        summaryCurrency: "EUR",
      });
    });

    it("still takes one currency through the original currency param", async () => {
      mockClient.get.mockResolvedValue({ results: [], totalRecords: 0 });

      await TurboQuote.listQuotes({ currency: "GBP", companyId: "c-1" });

      expect(mockClient.get).toHaveBeenCalledWith("/v1/quotes", { currency: "GBP", companyId: "c-1" });
    });

    it("returns the tab counts, the summary and each quote's expiry flag", async () => {
      const response = {
        results: [{ id: "q-1", status: "sent", isExpired: true, isSignatureExpired: false, lineItemCount: 3 }],
        totalRecords: 1,
        stats: { total: 1 },
        statusCounts: { all: 1, draft: 0, sent: 1, accepted: 0, declined: 0, voided: 0, expired: 1 },
        summary: {
          currency: "USD",
          openPipeline: { total: 0, count: 0 },
          completed: { accepted: 0, declined: 0 },
          createdThisMonth: { count: 1 },
          waitingToSign: { count: 0 },
          wonThisMonth: { count: 0 },
          currencies: ["USD"],
          winRate: { percent: null, accepted: 0, declined: 0, windowDays: 90 },
          monthlyRecurring: { total: 0, count: 0 },
        },
      };
      mockClient.get.mockResolvedValue(response);

      const result = await TurboQuote.listQuotes();

      expect(result.statusCounts?.expired).toBe(1);
      expect(result.summary?.winRate.percent).toBeNull();
      expect(result.results[0].isExpired).toBe(true);
      expect(result.results[0].lineItemCount).toBe(3);
    });
  });

  it("listProducts sends several billing frequencies and currencies, and the sort", async () => {
    mockClient.get.mockResolvedValue({ results: [], totalRecords: 0 });

    await TurboQuote.listProducts({
      billingFrequency: ["monthly", "annual"],
      currency: ["USD", "INR"],
      sortBy: "listPrice",
      sortDirection: "desc",
    });

    expect(mockClient.get).toHaveBeenCalledWith("/v1/products", {
      billingFrequency: ["monthly", "annual"],
      currency: ["USD", "INR"],
      sortBy: "listPrice",
      sortDirection: "desc",
    });
  });

  it("listPriceBooks sends the sort", async () => {
    mockClient.get.mockResolvedValue({ results: [{ id: "pb-1", overrideCount: 2 }], totalRecords: 1 });

    const result = await TurboQuote.listPriceBooks({ sortBy: "overrideCount", sortDirection: "desc" });

    expect(mockClient.get).toHaveBeenCalledWith("/v1/pricebooks", { sortBy: "overrideCount", sortDirection: "desc" });
    expect(result.results[0].overrideCount).toBe(2);
  });

  it("listBundles sends several currencies and the sort", async () => {
    mockClient.get.mockResolvedValue({
      results: [{ id: "b-1", itemCount: 2, billingTotals: { monthly: 100, "one-time": 500 } }],
      totalRecords: 1,
    });

    const result = await TurboQuote.listBundles({ currency: ["USD", "EUR"], sortBy: "itemCount", sortDirection: "asc" });

    expect(mockClient.get).toHaveBeenCalledWith("/v1/bundles", {
      currency: ["USD", "EUR"],
      sortBy: "itemCount",
      sortDirection: "asc",
    });
    expect(result.results[0].billingTotals?.["one-time"]).toBe(500);
  });

  it("listCompanies sends the sort", async () => {
    mockClient.get.mockResolvedValue({ results: [{ id: "c-1", email: "ap@acme.test" }], totalRecords: 1 });

    const result = await TurboQuote.listCompanies({ sortBy: "contactCount", sortDirection: "desc" });

    expect(mockClient.get).toHaveBeenCalledWith("/v1/companies", { sortBy: "contactCount", sortDirection: "desc" });
    expect(result.results[0].email).toBe("ap@acme.test");
  });

  it("listContacts sends several companies and the sort", async () => {
    mockClient.get.mockResolvedValue({ results: [], totalRecords: 0 });

    await TurboQuote.listContacts({ companyIds: ["c-1", "c-2"], sortBy: "name", sortDirection: "asc" });

    expect(mockClient.get).toHaveBeenCalledWith("/v1/contacts", {
      companyIds: ["c-1", "c-2"],
      sortBy: "name",
      sortDirection: "asc",
    });
  });

  it("listCompanyContacts sends the sort and returns the company's contact count", async () => {
    mockClient.get.mockResolvedValue({ results: [], totalRecords: 0, company: { id: "c-1", contactCount: 1 } });

    const result = await TurboQuote.listCompanyContacts("c-1", { sortBy: "createdOn", sortDirection: "desc" });

    expect(mockClient.get).toHaveBeenCalledWith("/v1/companies/c-1/contacts", {
      sortBy: "createdOn",
      sortDirection: "desc",
    });
    expect(result.company?.contactCount).toBe(1);
  });

  it("listTypes sends the sort", async () => {
    mockClient.get.mockResolvedValue({ results: [], totalRecords: 0 });

    await TurboQuote.listTypes({ categoryType: "product_category", sortBy: "usageCount", sortDirection: "desc" });

    expect(mockClient.get).toHaveBeenCalledWith("/v1/types", {
      categoryType: "product_category",
      sortBy: "usageCount",
      sortDirection: "desc",
    });
  });

  // ============================================
  // QUOTE READS
  // ============================================

  describe("getQuoteSummary", () => {
    it("gets the summary for the filters and returns it unwrapped", async () => {
      const summary = { currency: "EUR", openPipeline: { total: 10, count: 1 } };
      mockClient.get.mockResolvedValue({ summary });

      const result = await TurboQuote.getQuoteSummary({ currencies: ["EUR", "USD"], summaryCurrency: "EUR" });

      expect(mockClient.get).toHaveBeenCalledWith("/v1/quotes/summary", {
        currencies: ["EUR", "USD"],
        summaryCurrency: "EUR",
      });
      expect(result).toEqual(summary);
    });

    it("sends no params when called without options", async () => {
      mockClient.get.mockResolvedValue({ summary: { currency: "USD" } });

      await TurboQuote.getQuoteSummary();

      expect(mockClient.get).toHaveBeenCalledWith("/v1/quotes/summary", undefined);
    });
  });

  it("listQuoteCreators returns the people and API keys who created quotes", async () => {
    const creators = [
      { id: "u-1", name: "Ana Lee", email: "ana@acme.test", isAPIKey: false, apiKeyDeleted: false },
      { id: "u-2", name: "Zapier key", email: null, isAPIKey: true, apiKeyDeleted: true },
    ];
    mockClient.get.mockResolvedValue({ results: creators });

    const result = await TurboQuote.listQuoteCreators();

    expect(mockClient.get).toHaveBeenCalledWith("/v1/quotes/creators");
    expect(result).toEqual(creators);
  });

  it("getNextQuoteNumber returns the next number without moving the counter", async () => {
    mockClient.get.mockResolvedValue({ results: { nextNumber: "Q-2026-0042", sequence: 42, canEdit: true } });

    const result = await TurboQuote.getNextQuoteNumber();

    expect(mockClient.get).toHaveBeenCalledWith("/v1/quotes/number-config/next");
    expect(result).toEqual({ nextNumber: "Q-2026-0042", sequence: 42, canEdit: true });
  });

  // ============================================
  // OPEN QUOTES
  // ============================================

  it("getCompanyOpenQuotes lists the open quotes for a company", async () => {
    const response = {
      results: [{ id: "q-1", quoteNumber: "Q-1", name: "Renewal", status: "sent", updatedOn: "2026-10-01" }],
      totalRecords: 1,
    };
    mockClient.get.mockResolvedValue(response);

    const result = await TurboQuote.getCompanyOpenQuotes("c-1");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/companies/c-1/open-quotes");
    expect(result).toEqual(response);
  });

  it("getContactOpenQuotes lists the open quotes made out to a contact", async () => {
    mockClient.get.mockResolvedValue({ results: [], totalRecords: 0 });

    const result = await TurboQuote.getContactOpenQuotes("ct-1");

    expect(mockClient.get).toHaveBeenCalledWith("/v1/contacts/ct-1/open-quotes");
    expect(result.totalRecords).toBe(0);
  });

  // ============================================
  // IMAGES
  // ============================================

  it("getProductQuoteImages posts the product ids and returns up to three images each", async () => {
    const images = { "p-1": [{ id: "i-1", productId: "p-1", displayOrder: 0 }], "p-2": [] };
    mockClient.post.mockResolvedValue({ results: images });

    const result = await TurboQuote.getProductQuoteImages(["p-1", "p-2"]);

    expect(mockClient.post).toHaveBeenCalledWith("/v1/products/quote-images", { productIds: ["p-1", "p-2"] });
    expect(result).toEqual(images);
  });

  describe("custom line item images", () => {
    it("getQuoteLineItemImages returns every custom item's images keyed by line item id", async () => {
      const byItem = { "li-1": [{ id: "img-1", lineItemId: "li-1", displayOrder: 0 }] };
      mockClient.get.mockResolvedValue({ results: byItem });

      const result = await TurboQuote.getQuoteLineItemImages("q-1");

      expect(mockClient.get).toHaveBeenCalledWith("/v1/quotes/q-1/items/images");
      expect(result).toEqual(byItem);
    });

    it("getLineItemImages returns one item's images in order", async () => {
      const images = [{ id: "img-1", lineItemId: "li-1", displayOrder: 0 }];
      mockClient.get.mockResolvedValue({ results: images });

      const result = await TurboQuote.getLineItemImages("q-1", "li-1");

      expect(mockClient.get).toHaveBeenCalledWith("/v1/quotes/q-1/items/li-1/images");
      expect(result).toEqual(images);
    });

    it("addLineItemImages uploads each image as an 'images' part with its detected type", async () => {
      mockClient.postFormData.mockResolvedValue({ results: [{ id: "img-1" }, { id: "img-2" }], message: "Images added" });

      const result = await TurboQuote.addLineItemImages("q-1", "li-1", [PNG, JPEG]);

      expect(mockClient.postFormData).toHaveBeenCalledWith("/v1/quotes/q-1/items/li-1/images", expect.any(FormData));
      const formData = mockClient.postFormData.mock.calls[0][1] as FormData;
      const parts = formData.getAll("images") as File[];
      expect(parts).toHaveLength(2);
      expect(parts[0].type).toBe("image/png");
      expect(parts[1].type).toBe("image/jpeg");
      // Images only: no JSON "data" part
      expect(formData.get("data")).toBeNull();
      expect(result).toEqual([{ id: "img-1" }, { id: "img-2" }]);
    });

    it("reorderLineItemImages puts the image ids first to last", async () => {
      mockClient.put.mockResolvedValue({ results: [{ id: "img-2" }, { id: "img-1" }], message: "Image order saved" });

      const result = await TurboQuote.reorderLineItemImages("q-1", "li-1", ["img-2", "img-1"]);

      expect(mockClient.put).toHaveBeenCalledWith("/v1/quotes/q-1/items/li-1/images/order", {
        imageIds: ["img-2", "img-1"],
      });
      expect(result).toEqual([{ id: "img-2" }, { id: "img-1" }]);
    });

    it("removeLineItemImage deletes one image and returns the ones left", async () => {
      mockClient.delete.mockResolvedValue({ results: [{ id: "img-2" }], message: "Image removed" });

      const result = await TurboQuote.removeLineItemImage("q-1", "li-1", "img-1");

      expect(mockClient.delete).toHaveBeenCalledWith("/v1/quotes/q-1/items/li-1/images/img-1");
      expect(result).toEqual([{ id: "img-2" }]);
    });
  });

  // ============================================
  // NAMED DUPLICATES
  // ============================================

  describe("duplicates take an optional name", () => {
    it.each([
      ["duplicateQuote", "/v1/quotes/x-1/duplicate"],
      ["duplicateProduct", "/v1/products/x-1/duplicate"],
      ["duplicatePriceBook", "/v1/pricebooks/x-1/duplicate"],
      ["duplicateBundle", "/v1/bundles/x-1/duplicate"],
    ] as const)("%s sends the name for the copy", async (method, path) => {
      mockClient.post.mockResolvedValue({ result: { id: "x-2", name: "Q4 copy" } });

      const result = await (TurboQuote as any)[method]("x-1", { name: "Q4 copy" });

      expect(mockClient.post).toHaveBeenCalledWith(path, { name: "Q4 copy" });
      expect(result).toEqual({ id: "x-2", name: "Q4 copy" });
    });

    it.each([
      ["duplicateQuote", "/v1/quotes/x-1/duplicate"],
      ["duplicateProduct", "/v1/products/x-1/duplicate"],
      ["duplicatePriceBook", "/v1/pricebooks/x-1/duplicate"],
      ["duplicateBundle", "/v1/bundles/x-1/duplicate"],
    ] as const)("%s without a name sends no body (the API names it \"Copy of …\")", async (method, path) => {
      mockClient.post.mockResolvedValue({ result: { id: "x-2" } });

      await (TurboQuote as any)[method]("x-1");

      expect(mockClient.post).toHaveBeenCalledWith(path);
    });
  });

  // ============================================
  // REQUEST FIELDS
  // ============================================

  it("createCompany sends the company email", async () => {
    mockClient.post.mockResolvedValue({ result: { id: "c-1" } });

    await TurboQuote.createCompany({
      name: "Acme",
      email: "ap@acme.test",
      contacts: [{ name: "Ana", email: "ana@acme.test" }],
    });

    expect(mockClient.post).toHaveBeenCalledWith(
      "/v1/companies",
      expect.objectContaining({ email: "ap@acme.test" })
    );
  });

  it("updateCompany sends an explicit null email to clear it", async () => {
    mockClient.patch.mockResolvedValue({ result: { id: "c-1" } });

    await TurboQuote.updateCompany("c-1", { email: null });

    expect(mockClient.patch).toHaveBeenCalledWith("/v1/companies/c-1", { email: null });
  });

  it("updatePriceBook sends resetProductPricing", async () => {
    mockClient.patch.mockResolvedValue({ result: { id: "pb-1" } });

    await TurboQuote.updatePriceBook("pb-1", { resetProductPricing: true });

    expect(mockClient.patch).toHaveBeenCalledWith("/v1/pricebooks/pb-1", { resetProductPricing: true });
  });
});
