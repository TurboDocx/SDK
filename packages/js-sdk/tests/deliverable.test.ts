/**
 * Deliverable Module Tests
 *
 * Tests for SDK operations:
 * - listDeliverables
 * - generateDeliverable
 * - getDeliverableDetails
 * - updateDeliverableInfo
 * - deleteDeliverable
 * - downloadSourceFile
 * - downloadPDF
 */

import { Deliverable } from "../src/modules/deliverable";
import { HttpClient } from "../src/http";

// Mock the HttpClient
jest.mock("../src/http");

const MockedHttpClient = HttpClient as jest.MockedClass<typeof HttpClient>;

describe("Deliverable Module", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset static client
    (Deliverable as any).client = undefined;
  });

  describe("configure", () => {
    it("should configure the client with API key and org ID", () => {
      Deliverable.configure({
        apiKey: "test-api-key",
        orgId: "test-org-id",
      });
      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        accessToken: undefined,
        orgId: "test-org-id",
        baseUrl: undefined,
        skipSenderValidation: true,
      });
    });

    it("should configure with custom base URL", () => {
      Deliverable.configure({
        apiKey: "test-api-key",
        orgId: "test-org-id",
        baseUrl: "https://custom-api.example.com",
      });
      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: "test-api-key",
        accessToken: undefined,
        orgId: "test-org-id",
        baseUrl: "https://custom-api.example.com",
        skipSenderValidation: true,
      });
    });

    it("should configure with access token instead of API key", () => {
      Deliverable.configure({
        accessToken: "oauth-token",
        orgId: "test-org-id",
      });
      expect(MockedHttpClient).toHaveBeenCalledWith({
        apiKey: undefined,
        accessToken: "oauth-token",
        orgId: "test-org-id",
        baseUrl: undefined,
        skipSenderValidation: true,
      });
    });
  });

  describe("listDeliverables", () => {
    it("should list deliverables with default options", async () => {
      const mockResponse = {
        results: [
          {
            id: "del-1",
            name: "Contract A",
            description: "A contract",
            templateId: "tmpl-1",
            createdBy: "user-1",
            isActive: true,
            createdOn: "2024-01-15T14:12:10.721Z",
            updatedOn: "2024-01-15T14:13:45.724Z",
          },
        ],
        totalRecords: 1,
      };

      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      Deliverable.configure({ apiKey: "test-key", orgId: "org-1" });

      const result = await Deliverable.listDeliverables();

      expect(result.results).toHaveLength(1);
      expect(result.totalRecords).toBe(1);
      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        "/v1/deliverable",
        {}
      );
    });

    it("should pass query parameters", async () => {
      const mockResponse = { results: [], totalRecords: 0 };
      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      Deliverable.configure({ apiKey: "test-key", orgId: "org-1" });

      await Deliverable.listDeliverables({
        limit: 10,
        offset: 20,
        query: "contract",
        showTags: true,
      });

      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        "/v1/deliverable",
        {
          limit: 10,
          offset: 20,
          query: "contract",
          showTags: true,
        }
      );
    });
  });

  describe("generateDeliverable", () => {
    it("should generate a deliverable from a template", async () => {
      const mockResponse = {
        results: {
          deliverable: {
            id: "del-new",
            name: "Employee Contract - John Smith",
            description: "Employment contract",
            templateId: "tmpl-1",
            createdBy: "user-1",
            createdOn: "2024-01-15T14:12:10.721Z",
            updatedOn: "2024-01-15T14:12:10.721Z",
            isActive: true,
            defaultFont: "",
            fonts: null,
          },
        },
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      Deliverable.configure({ apiKey: "test-key", orgId: "org-1" });

      const result = await Deliverable.generateDeliverable({
        name: "Employee Contract - John Smith",
        templateId: "tmpl-1",
        variables: [
          { placeholder: "{EmployeeName}", text: "John Smith", mimeType: "text" },
          { placeholder: "{CompanyName}", text: "TechCorp Inc.", mimeType: "text" },
        ],
        tags: ["hr", "contract"],
      });

      expect(result.results.deliverable.id).toBe("del-new");
      expect(MockedHttpClient.prototype.post).toHaveBeenCalledWith(
        "/v1/deliverable",
        {
          name: "Employee Contract - John Smith",
          templateId: "tmpl-1",
          variables: [
            { placeholder: "{EmployeeName}", text: "John Smith", mimeType: "text" },
            { placeholder: "{CompanyName}", text: "TechCorp Inc.", mimeType: "text" },
          ],
          tags: ["hr", "contract"],
        }
      );
    });

    it("should support variable stacks for repeating content", async () => {
      const mockResponse = {
        results: {
          deliverable: {
            id: "del-stack",
            name: "Project Report",
            description: "",
            templateId: "tmpl-2",
            createdBy: "user-1",
            isActive: true,
            createdOn: "2024-01-15T14:12:10.721Z",
            updatedOn: "2024-01-15T14:12:10.721Z",
          },
        },
      };

      MockedHttpClient.prototype.post = jest.fn().mockResolvedValue(mockResponse);
      Deliverable.configure({ apiKey: "test-key", orgId: "org-1" });

      const result = await Deliverable.generateDeliverable({
        name: "Project Report",
        templateId: "tmpl-2",
        variables: [
          {
            placeholder: "{ProjectPhase}",
            mimeType: "html",
            variableStack: {
              "0": { text: "<p>Phase 1: Assess</p>", mimeType: "html" },
              "1": { text: "<p>Phase 2: Remediate</p>", mimeType: "html" },
            },
          },
        ],
      });

      expect(result.results.deliverable.id).toBe("del-stack");
    });
  });

  describe("getDeliverableDetails", () => {
    it("should get full deliverable details", async () => {
      const mockResponse = {
        results: {
          id: "del-1",
          name: "Employee Contract",
          description: "Employment contract",
          templateId: "tmpl-1",
          templateName: "Contract Template",
          templateNotDeleted: true,
          defaultFont: "Arial",
          fonts: [{ name: "Arial", usage: "body" }],
          email: "admin@company.com",
          fileSize: 287456,
          fileType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          isActive: true,
          createdBy: "user-1",
          createdOn: "2024-01-15T14:12:10.721Z",
          updatedOn: "2024-01-15T14:13:45.724Z",
          variables: [
            { placeholder: "{EmployeeName}", text: "John Smith", mimeType: "text" },
          ],
        },
      };

      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      Deliverable.configure({ apiKey: "test-key", orgId: "org-1" });

      const result = await Deliverable.getDeliverableDetails("del-1");

      expect(result.id).toBe("del-1");
      expect(result.templateName).toBe("Contract Template");
      expect(result.variables).toHaveLength(1);
      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        "/v1/deliverable/del-1",
        {}
      );
    });

    it("should pass showTags option", async () => {
      const mockResponse = {
        results: {
          id: "del-1",
          name: "Contract",
          tags: [{ id: "tag-1", name: "hr" }],
          isActive: true,
          createdBy: "user-1",
          createdOn: "2024-01-15T14:12:10.721Z",
          updatedOn: "2024-01-15T14:13:45.724Z",
        },
      };

      MockedHttpClient.prototype.get = jest.fn().mockResolvedValue(mockResponse);
      Deliverable.configure({ apiKey: "test-key", orgId: "org-1" });

      const result = await Deliverable.getDeliverableDetails("del-1", { showTags: true });

      expect(result.tags).toHaveLength(1);
      expect(MockedHttpClient.prototype.get).toHaveBeenCalledWith(
        "/v1/deliverable/del-1",
        { showTags: true }
      );
    });
  });

  describe("updateDeliverableInfo", () => {
    it("should update deliverable name and tags", async () => {
      const mockResponse = {
        message: "Deliverable updated successfully",
        deliverableId: "del-1",
      };

      MockedHttpClient.prototype.patch = jest.fn().mockResolvedValue(mockResponse);
      Deliverable.configure({ apiKey: "test-key", orgId: "org-1" });

      const result = await Deliverable.updateDeliverableInfo("del-1", {
        name: "Updated Contract",
        tags: ["hr", "finalized"],
      });

      expect(result.message).toBe("Deliverable updated successfully");
      expect(result.deliverableId).toBe("del-1");
      expect(MockedHttpClient.prototype.patch).toHaveBeenCalledWith(
        "/v1/deliverable/del-1",
        { name: "Updated Contract", tags: ["hr", "finalized"] }
      );
    });
  });

  describe("deleteDeliverable", () => {
    it("should soft-delete a deliverable", async () => {
      const mockResponse = {
        message: "Deliverable deleted successfully",
        deliverableId: "del-1",
      };

      MockedHttpClient.prototype.delete = jest.fn().mockResolvedValue(mockResponse);
      Deliverable.configure({ apiKey: "test-key", orgId: "org-1" });

      const result = await Deliverable.deleteDeliverable("del-1");

      expect(result.message).toBe("Deliverable deleted successfully");
      expect(MockedHttpClient.prototype.delete).toHaveBeenCalledWith(
        "/v1/deliverable/del-1"
      );
    });
  });

  describe("downloadSourceFile", () => {
    it("should download source file as ArrayBuffer", async () => {
      const mockArrayBuffer = new ArrayBuffer(1024);

      MockedHttpClient.prototype.getRaw = jest.fn().mockResolvedValue(mockArrayBuffer);
      Deliverable.configure({ apiKey: "test-key", orgId: "org-1" });

      const result = await Deliverable.downloadSourceFile("del-1");

      expect(result).toBe(mockArrayBuffer);
      expect(MockedHttpClient.prototype.getRaw).toHaveBeenCalledWith(
        "/v1/deliverable/file/del-1"
      );
    });
  });

  describe("downloadPDF", () => {
    it("should download PDF as ArrayBuffer", async () => {
      const mockArrayBuffer = new ArrayBuffer(2048);

      MockedHttpClient.prototype.getRaw = jest.fn().mockResolvedValue(mockArrayBuffer);
      Deliverable.configure({ apiKey: "test-key", orgId: "org-1" });

      const result = await Deliverable.downloadPDF("del-1");

      expect(result).toBe(mockArrayBuffer);
      expect(MockedHttpClient.prototype.getRaw).toHaveBeenCalledWith(
        "/v1/deliverable/file/pdf/del-1"
      );
    });
  });

  describe("Error Handling", () => {
    it("should throw error when not configured", async () => {
      await expect(Deliverable.listDeliverables()).rejects.toThrow(
        "Deliverable not configured"
      );
    });

    it("should handle API errors gracefully", async () => {
      const apiError = {
        statusCode: 404,
        message: "Deliverable not found",
      };

      MockedHttpClient.prototype.get = jest.fn().mockRejectedValue(apiError);
      Deliverable.configure({ apiKey: "test-key", orgId: "org-1" });

      await expect(
        Deliverable.getDeliverableDetails("invalid-id")
      ).rejects.toEqual(apiError);
    });

    it("should handle validation errors", async () => {
      const validationError = {
        statusCode: 400,
        message: '"name" length must be at least 3 characters long',
      };

      MockedHttpClient.prototype.post = jest.fn().mockRejectedValue(validationError);
      Deliverable.configure({ apiKey: "test-key", orgId: "org-1" });

      await expect(
        Deliverable.generateDeliverable({
          name: "AB",
          templateId: "tmpl-1",
          variables: [],
        })
      ).rejects.toEqual(validationError);
    });
  });
});
