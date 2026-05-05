# frozen_string_literal: true

require "spec_helper"

RSpec.describe TurboDocxSdk::ResponseNormalizer do
  describe "boolean coercion (MySQL tinyint)" do
    it "converts 0 to false for known boolean fields" do
      input = { "isActive" => 0, "isDefault" => 0, "showInCatalog" => 0 }
      result = described_class.normalize(input)
      expect(result["isActive"]).to be false
      expect(result["isDefault"]).to be false
      expect(result["showInCatalog"]).to be false
    end

    it "converts 1 to true for known boolean fields" do
      input = { "isActive" => 1, "isDefault" => 1, "showInCatalog" => 1 }
      result = described_class.normalize(input)
      expect(result["isActive"]).to be true
      expect(result["isDefault"]).to be true
      expect(result["showInCatalog"]).to be true
    end

    it "handles all known boolean fields" do
      input = {
        "isActive" => 1,
        "isDefault" => 0,
        "showInCatalog" => 1,
        "showInQuoteBuilder" => 0,
        "showItemsToEndUser" => 1,
        "syncWithProducts" => 0,
        "isPrimaryAdmin" => 1,
        "canManageOrgs" => 1,
        "canManageUsers" => 0,
        "canManageBilling" => 1,
        "canViewAuditLog" => 0,
        "hasFileDownload" => 1,
        "hasGDrive" => 0,
        "rdWatermark" => 1
      }
      result = described_class.normalize(input)
      expect(result["isActive"]).to be true
      expect(result["isDefault"]).to be false
      expect(result["showInCatalog"]).to be true
      expect(result["showInQuoteBuilder"]).to be false
      expect(result["showItemsToEndUser"]).to be true
      expect(result["syncWithProducts"]).to be false
      expect(result["isPrimaryAdmin"]).to be true
      expect(result["canManageOrgs"]).to be true
      expect(result["canManageUsers"]).to be false
      expect(result["canManageBilling"]).to be true
      expect(result["canViewAuditLog"]).to be false
      expect(result["hasFileDownload"]).to be true
      expect(result["hasGDrive"]).to be false
      expect(result["rdWatermark"]).to be true
    end

    it "leaves actual booleans unchanged" do
      input = { "isActive" => true, "isDefault" => false }
      result = described_class.normalize(input)
      expect(result["isActive"]).to be true
      expect(result["isDefault"]).to be false
    end

    it "does not convert non-boolean fields that happen to be 0 or 1" do
      input = { "quantity" => 1, "offset" => 0, "name" => "test" }
      result = described_class.normalize(input)
      expect(result["quantity"]).to eq(1)
      expect(result["offset"]).to eq(0)
      expect(result["name"]).to eq("test")
    end
  end

  describe "decimal coercion (MySQL decimal strings)" do
    it "converts string decimals to numbers for known numeric fields" do
      input = { "listPrice" => "99.99", "cost" => "50.00", "unitPrice" => "25.50" }
      result = described_class.normalize(input)
      expect(result["listPrice"]).to eq(99.99)
      expect(result["cost"]).to eq(50.0)
      expect(result["unitPrice"]).to eq(25.5)
    end

    it "handles all known decimal fields" do
      input = {
        "listPrice" => "100.00",
        "cost" => "50.00",
        "unitPrice" => "75.50",
        "discountPercent" => "10.00",
        "subtotal" => "67.95",
        "grandTotal" => "1234.56",
        "subtotalMonthly" => "500.00",
        "subtotalQuarterly" => "1500.00",
        "subtotalAnnual" => "6000.00",
        "subtotalOneTime" => "200.00",
        "taxAmount" => "48.00",
        "taxRate" => "8.50",
        "bundleDiscountPercent" => "15.00",
        "totalListPrice" => "1000.00",
        "totalFinalPrice" => "850.00",
        "totalCost" => "400.00",
        "finalPrice" => "85.00",
        "marginPercent" => "45.00"
      }
      result = described_class.normalize(input)
      expect(result["listPrice"]).to eq(100.0)
      expect(result["cost"]).to eq(50.0)
      expect(result["unitPrice"]).to eq(75.5)
      expect(result["discountPercent"]).to eq(10.0)
      expect(result["subtotal"]).to eq(67.95)
      expect(result["grandTotal"]).to eq(1234.56)
      expect(result["subtotalMonthly"]).to eq(500.0)
      expect(result["subtotalQuarterly"]).to eq(1500.0)
      expect(result["subtotalAnnual"]).to eq(6000.0)
      expect(result["subtotalOneTime"]).to eq(200.0)
      expect(result["taxAmount"]).to eq(48.0)
      expect(result["taxRate"]).to eq(8.5)
      expect(result["bundleDiscountPercent"]).to eq(15.0)
      expect(result["totalListPrice"]).to eq(1000.0)
      expect(result["totalFinalPrice"]).to eq(850.0)
      expect(result["totalCost"]).to eq(400.0)
      expect(result["finalPrice"]).to eq(85.0)
      expect(result["marginPercent"]).to eq(45.0)
    end

    it "leaves actual numbers unchanged" do
      input = { "listPrice" => 99.99, "quantity" => 5 }
      result = described_class.normalize(input)
      expect(result["listPrice"]).to eq(99.99)
      expect(result["quantity"]).to eq(5)
    end

    it "handles null decimal fields" do
      input = { "cost" => nil, "taxRate" => nil, "marginPercent" => nil }
      result = described_class.normalize(input)
      expect(result["cost"]).to be_nil
      expect(result["taxRate"]).to be_nil
      expect(result["marginPercent"]).to be_nil
    end

    it "does not convert non-numeric string fields" do
      input = { "name" => "99.99", "quoteNumber" => "Q-2026-00001", "status" => "draft" }
      result = described_class.normalize(input)
      expect(result["name"]).to eq("99.99")
      expect(result["quoteNumber"]).to eq("Q-2026-00001")
      expect(result["status"]).to eq("draft")
    end
  end

  describe "nested objects" do
    it "normalizes fields in nested objects" do
      input = {
        "id" => "q-1",
        "isActive" => 1,
        "grandTotal" => "500.00",
        "company" => {
          "id" => "c-1",
          "isActive" => 1,
          "name" => "Acme"
        },
        "contact" => {
          "id" => "ct-1",
          "isActive" => 0
        }
      }
      result = described_class.normalize(input)
      expect(result["isActive"]).to be true
      expect(result["grandTotal"]).to eq(500.0)
      expect(result["company"]["isActive"]).to be true
      expect(result["company"]["name"]).to eq("Acme")
      expect(result["contact"]["isActive"]).to be false
    end

    it "normalizes deeply nested objects" do
      input = {
        "items" => [{
          "id" => "li-1",
          "isActive" => 1,
          "unitPrice" => "50.00",
          "showItemsToEndUser" => 0,
          "product" => {
            "id" => "p-1",
            "isActive" => 1,
            "listPrice" => "100.00",
            "showInCatalog" => 1
          }
        }]
      }
      result = described_class.normalize(input)
      expect(result["items"][0]["isActive"]).to be true
      expect(result["items"][0]["unitPrice"]).to eq(50.0)
      expect(result["items"][0]["showItemsToEndUser"]).to be false
      expect(result["items"][0]["product"]["isActive"]).to be true
      expect(result["items"][0]["product"]["listPrice"]).to eq(100.0)
      expect(result["items"][0]["product"]["showInCatalog"]).to be true
    end
  end

  describe "arrays" do
    it "normalizes objects inside arrays" do
      input = [
        { "id" => "1", "isActive" => 1, "listPrice" => "10.00" },
        { "id" => "2", "isActive" => 0, "listPrice" => "20.00" }
      ]
      result = described_class.normalize(input)
      expect(result[0]["isActive"]).to be true
      expect(result[0]["listPrice"]).to eq(10.0)
      expect(result[1]["isActive"]).to be false
      expect(result[1]["listPrice"]).to eq(20.0)
    end

    it "handles results array pattern" do
      input = {
        "results" => [
          { "id" => "1", "isActive" => 1, "grandTotal" => "100.00" },
          { "id" => "2", "isActive" => 0, "grandTotal" => "200.00" }
        ],
        "totalRecords" => 2
      }
      result = described_class.normalize(input)
      expect(result["results"][0]["isActive"]).to be true
      expect(result["results"][0]["grandTotal"]).to eq(100.0)
      expect(result["results"][1]["isActive"]).to be false
      expect(result["results"][1]["grandTotal"]).to eq(200.0)
      expect(result["totalRecords"]).to eq(2)
    end
  end

  describe "edge cases" do
    it "returns primitives unchanged" do
      expect(described_class.normalize("hello")).to eq("hello")
      expect(described_class.normalize(42)).to eq(42)
      expect(described_class.normalize(nil)).to be_nil
    end

    it "handles empty objects" do
      expect(described_class.normalize({})).to eq({})
    end

    it "handles empty arrays" do
      expect(described_class.normalize([])).to eq([])
    end

    it "does not mutate the original object" do
      input = { "isActive" => 1, "listPrice" => "99.99" }
      result = described_class.normalize(input)
      expect(input["isActive"]).to eq(1)
      expect(input["listPrice"]).to eq("99.99")
      expect(result["isActive"]).to be true
      expect(result["listPrice"]).to eq(99.99)
    end
  end
end
