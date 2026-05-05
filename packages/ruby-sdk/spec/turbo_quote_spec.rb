# frozen_string_literal: true

require "spec_helper"

RSpec.describe TurboDocxSdk::TurboQuote do
  let(:mock_client) { instance_double(TurboDocxSdk::HttpClient) }

  before do
    described_class.instance_variable_set(:@client, nil)
    allow(TurboDocxSdk::HttpClient).to receive(:new).and_return(mock_client)
  end

  # ============================================
  # CONFIGURATION
  # ============================================

  describe ".configure" do
    it "configures the client with API key and org ID" do
      described_class.configure(api_key: "test-api-key", org_id: "test-org-id")
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: "test-api-key",
        access_token: nil,
        org_id: "test-org-id",
        base_url: nil,
        skip_sender_validation: true
      )
    end

    it "configures with custom base URL" do
      described_class.configure(api_key: "test-key", org_id: "org-1", base_url: "https://custom.api.com")
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: "test-key",
        access_token: nil,
        org_id: "org-1",
        base_url: "https://custom.api.com",
        skip_sender_validation: true
      )
    end

    it "configures with access token instead of API key" do
      described_class.configure(access_token: "oauth-token", org_id: "org-1")
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: nil,
        access_token: "oauth-token",
        org_id: "org-1",
        base_url: nil,
        skip_sender_validation: true
      )
    end

    it "auto-initializes from env vars when not configured" do
      mock_response = { "results" => [], "totalRecords" => 0 }
      allow(mock_client).to receive(:get).and_return(mock_response)

      described_class.list_quotes
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(skip_sender_validation: true)
    end
  end

  # ============================================
  # QUOTES -- CRUD
  # ============================================

  describe "Quotes CRUD" do
    before { described_class.configure(api_key: "test-key", org_id: "org-1") }

    it "lists quotes with pagination and filters" do
      mock_response = {
        "results" => [{ "id" => "q-1", "name" => "Test Quote", "status" => "draft" }],
        "totalRecords" => 1
      }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.list_quotes("limit" => 10, "statuses" => "draft", "query" => "test")

      expect(result["results"].length).to eq(1)
      expect(result["totalRecords"]).to eq(1)
      expect(mock_client).to have_received(:get).with(
        "/v1/quotes",
        hash_including("limit" => "10", "statuses" => "draft", "query" => "test")
      )
    end

    it "passes array statuses as string array (not comma-joined)" do
      mock_response = { "results" => [], "totalRecords" => 0 }
      allow(mock_client).to receive(:get).and_return(mock_response)

      described_class.list_quotes("statuses" => %w[draft sent])

      expect(mock_client).to have_received(:get).with(
        "/v1/quotes",
        hash_including("statuses" => %w[draft sent])
      )
    end

    it "creates a quote and unwraps result" do
      mock_quote = { "id" => "q-1", "name" => "My Quote", "status" => "draft", "quoteNumber" => "Q-2026-00001" }
      allow(mock_client).to receive(:post).and_return({ "result" => mock_quote, "message" => "Quote created successfully" })

      result = described_class.create_quote("name" => "My Quote", "companyId" => "c-1", "contactId" => "ct-1")

      expect(result["id"]).to eq("q-1")
      expect(result["status"]).to eq("draft")
      expect(mock_client).to have_received(:post).with(
        "/v1/quotes",
        { "name" => "My Quote", "companyId" => "c-1", "contactId" => "ct-1" }
      )
    end

    it "creates a quote with all optional fields" do
      mock_quote = { "id" => "q-2", "name" => "Full Quote", "status" => "draft" }
      allow(mock_client).to receive(:post).and_return({ "result" => mock_quote, "message" => "Quote created successfully" })

      described_class.create_quote(
        "name" => "Full Quote",
        "companyId" => "comp-1",
        "contactId" => "cont-1",
        "currency" => "EUR",
        "termDays" => 60,
        "taxRate" => 8.25,
        "validUntil" => "2026-12-31",
        "priceBookId" => "pb-1"
      )

      expect(mock_client).to have_received(:post).with(
        "/v1/quotes",
        hash_including(
          "name" => "Full Quote",
          "companyId" => "comp-1",
          "currency" => "EUR",
          "termDays" => 60,
          "taxRate" => 8.25
        )
      )
    end

    it "gets a quote by ID, unwraps result, and includes statusInfo" do
      mock_quote = { "id" => "q-1", "name" => "Test Quote", "status" => "sent", "lineItems" => [] }
      mock_status_info = { "currentStatus" => "sent", "canSend" => false, "canAccept" => true, "canDecline" => true, "canVoid" => true, "isTerminal" => false }
      allow(mock_client).to receive(:get).and_return({ "result" => mock_quote, "statusInfo" => mock_status_info })

      result = described_class.get_quote("q-1")

      expect(result["id"]).to eq("q-1")
      expect(result["statusInfo"]).to eq(mock_status_info)
      expect(mock_client).to have_received(:get).with("/v1/quotes/q-1")
    end

    it "updates a quote and unwraps result" do
      mock_quote = { "id" => "q-1", "name" => "Updated Name", "taxRate" => 10 }
      allow(mock_client).to receive(:patch).and_return({ "result" => mock_quote, "message" => "Quote updated successfully" })

      result = described_class.update_quote("q-1", "name" => "Updated Name", "taxRate" => 10)

      expect(result["name"]).to eq("Updated Name")
      expect(mock_client).to have_received(:patch).with(
        "/v1/quotes/q-1",
        { "name" => "Updated Name", "taxRate" => 10 }
      )
    end

    it "deletes a quote" do
      mock_response = { "message" => "Quote deleted successfully" }
      allow(mock_client).to receive(:delete).and_return(mock_response)

      result = described_class.delete_quote("q-1")

      expect(result["message"]).to eq("Quote deleted successfully")
      expect(mock_client).to have_received(:delete).with("/v1/quotes/q-1")
    end

    it "duplicates a quote and unwraps result" do
      mock_quote = { "id" => "q-2", "name" => "Test Quote (Copy)", "status" => "draft", "quoteNumber" => "Q-2026-00002" }
      allow(mock_client).to receive(:post).and_return({ "result" => mock_quote, "message" => "Quote duplicated successfully" })

      result = described_class.duplicate_quote("q-1")

      expect(result["id"]).to eq("q-2")
      expect(result["status"]).to eq("draft")
      expect(mock_client).to have_received(:post).with("/v1/quotes/q-1/duplicate")
    end

    it "applies a price book and returns full response with counts" do
      mock_quote = { "id" => "q-1", "priceBookId" => "pb-1" }
      allow(mock_client).to receive(:post).and_return({
        "result" => mock_quote,
        "updatedCount" => 3,
        "skippedCount" => 1,
        "message" => "Pricebook applied: 3 product(s) updated, 1 skipped"
      })

      result = described_class.apply_price_book("q-1", "pb-1")

      expect(result["quote"]["priceBookId"]).to eq("pb-1")
      expect(result["updatedCount"]).to eq(3)
      expect(result["skippedCount"]).to eq(1)
      expect(result["message"]).to eq("Pricebook applied: 3 product(s) updated, 1 skipped")
      expect(mock_client).to have_received(:post).with(
        "/v1/quotes/q-1/apply-pricebook",
        { "priceBookId" => "pb-1" }
      )
    end

    it "removes a price book and unwraps result" do
      mock_quote = { "id" => "q-1", "priceBookId" => nil }
      allow(mock_client).to receive(:post).and_return({ "result" => mock_quote, "message" => "Pricebook removed from quote" })

      result = described_class.remove_price_book("q-1")

      expect(result["priceBookId"]).to be_nil
      expect(mock_client).to have_received(:post).with("/v1/quotes/q-1/remove-pricebook")
    end

    it "downloads a quote PDF" do
      mock_pdf = "fake-pdf-bytes"
      allow(mock_client).to receive(:get_raw).and_return(mock_pdf)

      result = described_class.download_quote_pdf("q-1")

      expect(result).to eq(mock_pdf)
      expect(mock_client).to have_received(:get_raw).with("/v1/quotes/q-1/pdf")
    end
  end

  # ============================================
  # QUOTES -- STATUS TRANSITIONS
  # ============================================

  describe "Quote Status" do
    before { described_class.configure(api_key: "test-key", org_id: "org-1") }

    it "sends a quote and remaps result to quote" do
      mock_response = { "result" => { "id" => "q-1", "status" => "sent" }, "message" => "Quote sent" }
      allow(mock_client).to receive(:post).and_return(mock_response)

      result = described_class.send_quote("q-1", "ccEmails" => ["admin@example.com"])

      expect(result["quote"]["status"]).to eq("sent")
      expect(result["message"]).to eq("Quote sent")
      expect(mock_client).to have_received(:post).with(
        "/v1/quotes/q-1/send",
        { "ccEmails" => ["admin@example.com"] }
      )
    end

    it "sends a quote without options" do
      mock_response = { "result" => { "id" => "q-1", "status" => "sent" }, "message" => "Quote sent" }
      allow(mock_client).to receive(:post).and_return(mock_response)

      result = described_class.send_quote("q-1")

      expect(result["quote"]["id"]).to eq("q-1")
      expect(mock_client).to have_received(:post).with("/v1/quotes/q-1/send", nil)
    end

    it "sends a quote with a deliverable and returns documentId" do
      mock_response = {
        "result" => { "id" => "q-1", "status" => "sent" },
        "message" => "Quote sent with deliverable",
        "documentId" => "doc-2"
      }
      allow(mock_client).to receive(:post).and_return(mock_response)

      result = described_class.send_quote_with_deliverable("q-1",
        "deliverableId" => "del-1",
        "mergePosition" => "end"
      )

      expect(result["quote"]["status"]).to eq("sent")
      expect(result["documentId"]).to eq("doc-2")
      expect(result["message"]).to eq("Quote sent with deliverable")
      expect(mock_client).to have_received(:post).with(
        "/v1/quotes/q-1/send-with-deliverable",
        { "deliverableId" => "del-1", "mergePosition" => "end" }
      )
    end

    it "declines a quote with object param and unwraps result" do
      mock_quote = { "id" => "q-1", "status" => "declined" }
      allow(mock_client).to receive(:post).and_return({ "result" => mock_quote, "message" => "Quote declined" })

      result = described_class.decline_quote("q-1", "reason" => "Budget not approved")

      expect(result["status"]).to eq("declined")
      expect(mock_client).to have_received(:post).with(
        "/v1/quotes/q-1/decline",
        { "reason" => "Budget not approved" }
      )
    end

    it "voids a quote with object param and unwraps result" do
      mock_quote = { "id" => "q-1", "status" => "voided" }
      allow(mock_client).to receive(:post).and_return({ "result" => mock_quote, "message" => "Quote voided successfully" })

      result = described_class.void_quote("q-1", "reason" => "Replaced by new quote")

      expect(result["status"]).to eq("voided")
      expect(mock_client).to have_received(:post).with(
        "/v1/quotes/q-1/void",
        { "reason" => "Replaced by new quote" }
      )
    end

    it "handles an expired sent quote and unwraps result" do
      mock_quote = { "id" => "q-2", "status" => "draft", "quoteNumber" => "Q-2026-00003" }
      allow(mock_client).to receive(:post).and_return({ "result" => mock_quote, "message" => "Expired quote processed" })

      result = described_class.handle_expired_quote("q-1",
        "action" => "void",
        "reason" => "Expired",
        "newValidUntil" => "2026-12-31"
      )

      expect(result["status"]).to eq("draft")
      expect(mock_client).to have_received(:post).with(
        "/v1/quotes/q-1/handle-expired-sent",
        { "action" => "void", "reason" => "Expired", "newValidUntil" => "2026-12-31" }
      )
    end
  end

  # ============================================
  # LINE ITEMS
  # ============================================

  describe "Line Items" do
    before { described_class.configure(api_key: "test-key", org_id: "org-1") }

    it "lists line items for a quote" do
      mock_response = { "results" => [{ "id" => "li-1", "productName" => "Widget" }], "totalRecords" => 1 }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.list_line_items("q-1")

      expect(result["results"].length).to eq(1)
      expect(mock_client).to have_received(:get).with("/v1/quotes/q-1/items", nil)
    end

    it "adds a single product line item and unwraps results" do
      mock_items = [{ "id" => "li-1", "productId" => "prod-1", "quantity" => 2 }]
      allow(mock_client).to receive(:post).and_return({ "results" => mock_items, "message" => "1 line item(s) added successfully" })

      item = { "productId" => "prod-1", "productName" => "Widget", "unitPrice" => 50, "billingFrequency" => "monthly", "quantity" => 2 }
      result = described_class.add_line_items("q-1", item)

      expect(result.length).to eq(1)
      expect(mock_client).to have_received(:post).with(
        "/v1/quotes/q-1/items",
        [item]
      )
    end

    it "adds multiple product line items as batch" do
      mock_items = [{ "id" => "li-1" }, { "id" => "li-2" }]
      allow(mock_client).to receive(:post).and_return({ "results" => mock_items, "message" => "2 line item(s) added successfully" })

      items = [
        { "productId" => "prod-1", "productName" => "Widget A", "unitPrice" => 50, "billingFrequency" => "monthly", "quantity" => 5 },
        { "productId" => "prod-2", "productName" => "Widget B", "unitPrice" => 75, "billingFrequency" => "monthly", "quantity" => 1, "discountPercent" => 10 }
      ]
      result = described_class.add_line_items("q-1", items)

      expect(result.length).to eq(2)
      expect(mock_client).to have_received(:post).with(
        "/v1/quotes/q-1/items",
        items
      )
    end

    it "adds a single bundle line item and unwraps results" do
      mock_items = [{ "id" => "li-3", "bundleId" => "bun-1", "lineItemType" => "bundle" }]
      allow(mock_client).to receive(:post).and_return({ "results" => mock_items, "message" => "1 bundle(s) added successfully" })

      result = described_class.add_bundle_line_items("q-1", "bundleId" => "bun-1", "bundleName" => "Starter Pack")

      expect(result.length).to eq(1)
      expect(mock_client).to have_received(:post).with(
        "/v1/quotes/q-1/items/bundle",
        [{ "bundleId" => "bun-1", "bundleName" => "Starter Pack" }]
      )
    end

    it "updates a line item and unwraps result" do
      mock_item = { "id" => "li-1", "quantity" => 10, "unitPrice" => 50 }
      allow(mock_client).to receive(:patch).and_return({ "result" => mock_item, "message" => "Line item updated successfully" })

      result = described_class.update_line_item("q-1", "li-1", "quantity" => 10, "unitPrice" => 50)

      expect(result["quantity"]).to eq(10)
      expect(mock_client).to have_received(:patch).with(
        "/v1/quotes/q-1/items/li-1",
        { "quantity" => 10, "unitPrice" => 50 }
      )
    end

    it "removes a line item" do
      mock_response = { "message" => "Line item removed successfully" }
      allow(mock_client).to receive(:delete).and_return(mock_response)

      result = described_class.remove_line_item("q-1", "li-1")

      expect(result["message"]).to eq("Line item removed successfully")
      expect(mock_client).to have_received(:delete).with("/v1/quotes/q-1/items/li-1")
    end
  end

  # ============================================
  # PRODUCTS
  # ============================================

  describe "Products" do
    before { described_class.configure(api_key: "test-key", org_id: "org-1") }

    it "lists products with filters" do
      mock_response = { "results" => [{ "id" => "p-1", "name" => "Widget" }], "totalRecords" => 1 }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.list_products("billingFrequency" => "monthly", "limit" => 25)

      expect(result["results"].length).to eq(1)
      expect(mock_client).to have_received(:get).with(
        "/v1/products",
        hash_including("billingFrequency" => "monthly", "limit" => "25")
      )
    end

    it "creates a product without images and unwraps result" do
      mock_product = { "id" => "p-1", "name" => "Widget Pro", "listPrice" => 99.99 }
      allow(mock_client).to receive(:post).and_return({ "result" => mock_product, "message" => "Product created successfully" })

      result = described_class.create_product(
        "name" => "Widget Pro",
        "listPrice" => 99.99,
        "billingFrequency" => "monthly",
        "categoryId" => "cat-1"
      )

      expect(result["name"]).to eq("Widget Pro")
      expect(mock_client).to have_received(:post).with(
        "/v1/products",
        { "name" => "Widget Pro", "listPrice" => 99.99, "billingFrequency" => "monthly", "categoryId" => "cat-1" }
      )
    end

    it "gets a product by ID and unwraps result" do
      mock_product = { "id" => "p-1", "name" => "Widget", "images" => [] }
      allow(mock_client).to receive(:get).and_return({ "result" => mock_product })

      result = described_class.get_product("p-1")

      expect(result["id"]).to eq("p-1")
      expect(mock_client).to have_received(:get).with("/v1/products/p-1")
    end

    it "updates a product without images and unwraps result" do
      mock_product = { "id" => "p-1", "name" => "Updated Widget", "listPrice" => 149.99 }
      allow(mock_client).to receive(:patch).and_return({ "result" => mock_product, "message" => "Product updated successfully" })

      result = described_class.update_product("p-1", "name" => "Updated Widget", "listPrice" => 149.99)

      expect(result["name"]).to eq("Updated Widget")
      expect(mock_client).to have_received(:patch).with(
        "/v1/products/p-1",
        { "name" => "Updated Widget", "listPrice" => 149.99 }
      )
    end

    it "deletes a product" do
      mock_response = { "message" => "Product deleted successfully" }
      allow(mock_client).to receive(:delete).and_return(mock_response)

      result = described_class.delete_product("p-1")

      expect(result["message"]).to eq("Product deleted successfully")
      expect(mock_client).to have_received(:delete).with("/v1/products/p-1")
    end

    it "duplicates a product and unwraps result" do
      mock_product = { "id" => "p-2", "name" => "Widget Pro (Copy)" }
      allow(mock_client).to receive(:post).and_return({ "result" => mock_product, "message" => "Product duplicated successfully" })

      result = described_class.duplicate_product("p-1")

      expect(result["id"]).to eq("p-2")
      expect(mock_client).to have_received(:post).with("/v1/products/p-1/duplicate")
    end

    it "creates a product with images via form data" do
      mock_product = { "id" => "p-1", "name" => "Widget", "listPrice" => 99 }
      allow(mock_client).to receive(:post_form_data).and_return({ "result" => mock_product, "message" => "Product created successfully" })

      fake_image = StringIO.new("fake-image")
      described_class.create_product(
        "name" => "Widget",
        "listPrice" => 99,
        "billingFrequency" => "monthly",
        "categoryId" => "cat-1",
        "images" => [fake_image]
      )

      expect(mock_client).to have_received(:post_form_data).with(
        "/v1/products",
        hash_including("data")
      )
    end

    it "updates a product with images via form data" do
      mock_product = { "id" => "p-1", "name" => "Updated Widget" }
      allow(mock_client).to receive(:patch_form_data).and_return({ "result" => mock_product, "message" => "Product updated successfully" })

      fake_image = StringIO.new("fake-image")
      described_class.update_product("p-1",
        "name" => "Updated Widget",
        "images" => [fake_image],
        "imageIdsToKeep" => ["img-id-1"]
      )

      expect(mock_client).to have_received(:patch_form_data).with(
        "/v1/products/p-1",
        hash_including("data")
      )
    end

    it "does not mutate the original request hash in create_product" do
      mock_product = { "id" => "p-1", "name" => "Widget", "listPrice" => 99 }
      allow(mock_client).to receive(:post_form_data).and_return({ "result" => mock_product, "message" => "Product created successfully" })

      request = { "name" => "Widget", "listPrice" => 99, "images" => [StringIO.new("fake-image")] }
      original_request = request.dup

      described_class.create_product(request)

      expect(request).to eq(original_request)
    end

    it "does not mutate the original request hash in update_product" do
      mock_product = { "id" => "p-1", "name" => "Updated Widget" }
      allow(mock_client).to receive(:patch_form_data).and_return({ "result" => mock_product, "message" => "Product updated successfully" })

      request = { "name" => "Updated Widget", "images" => [StringIO.new("fake-image")] }
      original_request = request.dup

      described_class.update_product("p-1", request)

      expect(request).to eq(original_request)
    end

    it "gets primary images and unwraps results" do
      mock_image_map = { "p-1" => { "id" => "img-1", "productId" => "p-1" }, "p-2" => nil }
      allow(mock_client).to receive(:post).and_return({ "results" => mock_image_map })

      result = described_class.get_product_primary_images(%w[p-1 p-2])

      expect(result["p-1"]).to eq({ "id" => "img-1", "productId" => "p-1" })
      expect(result["p-2"]).to be_nil
      expect(mock_client).to have_received(:post).with(
        "/v1/products/primary-images",
        { "productIds" => %w[p-1 p-2] }
      )
    end
  end

  # ============================================
  # PRICE BOOKS
  # ============================================

  describe "Price Books" do
    before { described_class.configure(api_key: "test-key", org_id: "org-1") }

    it "lists price books" do
      mock_response = { "results" => [{ "id" => "pb-1", "name" => "Standard" }], "totalRecords" => 1 }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.list_price_books

      expect(result["results"].length).to eq(1)
      expect(mock_client).to have_received(:get).with("/v1/pricebooks", nil)
    end

    it "creates a price book and unwraps result" do
      mock_price_book = { "id" => "pb-1", "name" => "Partner Pricing", "discountPercent" => 15 }
      allow(mock_client).to receive(:post).and_return({ "result" => mock_price_book, "message" => "PriceBook created successfully" })

      result = described_class.create_price_book(
        "name" => "Partner Pricing",
        "priceBookTypeId" => "pbt-1",
        "validFrom" => "2026-01-01",
        "discountPercent" => 15
      )

      expect(result["name"]).to eq("Partner Pricing")
      expect(mock_client).to have_received(:post).with(
        "/v1/pricebooks",
        { "name" => "Partner Pricing", "priceBookTypeId" => "pbt-1", "validFrom" => "2026-01-01", "discountPercent" => 15 }
      )
    end

    it "gets a price book by ID and unwraps result" do
      mock_price_book = { "id" => "pb-1", "name" => "Standard" }
      allow(mock_client).to receive(:get).and_return({ "result" => mock_price_book })

      result = described_class.get_price_book("pb-1")

      expect(result["id"]).to eq("pb-1")
      expect(mock_client).to have_received(:get).with("/v1/pricebooks/pb-1")
    end

    it "updates a price book and unwraps result" do
      mock_price_book = { "id" => "pb-1", "name" => "Updated", "discountPercent" => 20 }
      allow(mock_client).to receive(:patch).and_return({ "result" => mock_price_book, "message" => "PriceBook updated successfully" })

      result = described_class.update_price_book("pb-1", "discountPercent" => 20)

      expect(result["discountPercent"]).to eq(20)
    end

    it "deletes a price book" do
      allow(mock_client).to receive(:delete).and_return({ "message" => "PriceBook deleted successfully" })

      result = described_class.delete_price_book("pb-1")

      expect(result["message"]).to eq("PriceBook deleted successfully")
    end

    it "duplicates a price book and unwraps result" do
      allow(mock_client).to receive(:post).and_return({ "result" => { "id" => "pb-2", "name" => "Standard (Copy)" }, "message" => "Pricebook duplicated successfully" })

      result = described_class.duplicate_price_book("pb-1")

      expect(result["id"]).to eq("pb-2")
      expect(mock_client).to have_received(:post).with("/v1/pricebooks/pb-1/duplicate")
    end

    it "lists products in a price book" do
      mock_response = { "results" => [{ "productId" => "p-1", "discountPercent" => 10 }], "totalRecords" => 1 }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.list_price_book_products("pb-1")

      expect(result["results"].length).to eq(1)
      expect(mock_client).to have_received(:get).with("/v1/pricebooks/pb-1/products", nil)
    end
  end

  # ============================================
  # BUNDLES
  # ============================================

  describe "Bundles" do
    before { described_class.configure(api_key: "test-key", org_id: "org-1") }

    it "lists bundles" do
      mock_response = { "results" => [{ "id" => "b-1", "name" => "Starter Pack" }], "totalRecords" => 1 }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.list_bundles

      expect(result["results"].length).to eq(1)
    end

    it "creates a bundle and unwraps result" do
      mock_bundle = { "id" => "b-1", "name" => "Starter Pack", "items" => [] }
      allow(mock_client).to receive(:post).and_return({ "result" => mock_bundle, "message" => "Bundle created successfully" })

      result = described_class.create_bundle(
        "name" => "Starter Pack",
        "categoryId" => "cat-1",
        "items" => [{ "productId" => "p-1", "unitPrice" => 50, "billingFrequency" => "monthly" }]
      )

      expect(result["name"]).to eq("Starter Pack")
      expect(mock_client).to have_received(:post).with(
        "/v1/bundles",
        hash_including("name" => "Starter Pack", "categoryId" => "cat-1")
      )
    end

    it "gets a bundle by ID and unwraps result" do
      allow(mock_client).to receive(:get).and_return({ "result" => { "id" => "b-1", "items" => [] } })

      result = described_class.get_bundle("b-1")

      expect(result["id"]).to eq("b-1")
      expect(mock_client).to have_received(:get).with("/v1/bundles/b-1")
    end

    it "updates a bundle and unwraps result" do
      allow(mock_client).to receive(:patch).and_return({ "result" => { "id" => "b-1", "name" => "Pro Pack" }, "message" => "Bundle updated successfully" })

      result = described_class.update_bundle("b-1", "name" => "Pro Pack")

      expect(result["name"]).to eq("Pro Pack")
    end

    it "deletes a bundle" do
      allow(mock_client).to receive(:delete).and_return({ "message" => "Bundle deleted successfully" })

      result = described_class.delete_bundle("b-1")

      expect(result["message"]).to eq("Bundle deleted successfully")
    end

    it "duplicates a bundle and unwraps result" do
      allow(mock_client).to receive(:post).and_return({ "result" => { "id" => "b-2" }, "message" => "Bundle duplicated successfully" })

      result = described_class.duplicate_bundle("b-1")

      expect(result["id"]).to eq("b-2")
      expect(mock_client).to have_received(:post).with("/v1/bundles/b-1/duplicate")
    end
  end

  # ============================================
  # COMPANIES
  # ============================================

  describe "Companies" do
    before { described_class.configure(api_key: "test-key", org_id: "org-1") }

    it "lists companies" do
      mock_response = { "results" => [{ "id" => "c-1", "name" => "Acme Corp" }], "totalRecords" => 1 }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.list_companies("query" => "acme")

      expect(result["results"].length).to eq(1)
      expect(mock_client).to have_received(:get).with(
        "/v1/companies",
        hash_including("query" => "acme")
      )
    end

    it "creates a company and unwraps result" do
      mock_company = { "id" => "c-1", "name" => "Acme Corp" }
      allow(mock_client).to receive(:post).and_return({ "result" => mock_company, "message" => "Company created successfully" })

      result = described_class.create_company(
        "name" => "Acme Corp",
        "contacts" => [{ "name" => "John Doe", "email" => "john@acme.com" }],
        "city" => "Austin",
        "state" => "TX"
      )

      expect(result["name"]).to eq("Acme Corp")
      expect(mock_client).to have_received(:post).with(
        "/v1/companies",
        { "name" => "Acme Corp", "contacts" => [{ "name" => "John Doe", "email" => "john@acme.com" }], "city" => "Austin", "state" => "TX" }
      )
    end

    it "gets a company by ID and unwraps result" do
      allow(mock_client).to receive(:get).and_return({ "result" => { "id" => "c-1", "name" => "Acme" } })

      result = described_class.get_company("c-1")

      expect(result["id"]).to eq("c-1")
      expect(mock_client).to have_received(:get).with("/v1/companies/c-1")
    end

    it "updates a company and unwraps result" do
      allow(mock_client).to receive(:patch).and_return({ "result" => { "id" => "c-1", "name" => "Acme Inc" }, "message" => "Company updated successfully" })

      result = described_class.update_company("c-1", "name" => "Acme Inc")

      expect(result["name"]).to eq("Acme Inc")
    end

    it "deletes a company" do
      allow(mock_client).to receive(:delete).and_return({ "message" => "Company deleted successfully" })

      result = described_class.delete_company("c-1")

      expect(result["message"]).to eq("Company deleted successfully")
    end

    it "lists contacts for a company" do
      mock_response = { "results" => [{ "id" => "ct-1", "name" => "John Doe" }], "totalRecords" => 1 }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.list_company_contacts("c-1")

      expect(result["results"].length).to eq(1)
      expect(mock_client).to have_received(:get).with("/v1/companies/c-1/contacts", nil)
    end
  end

  # ============================================
  # CONTACTS
  # ============================================

  describe "Contacts" do
    before { described_class.configure(api_key: "test-key", org_id: "org-1") }

    it "lists contacts with optional company filter" do
      mock_response = { "results" => [{ "id" => "ct-1", "name" => "Jane" }], "totalRecords" => 1 }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.list_contacts("companyId" => "c-1")

      expect(result["results"].length).to eq(1)
      expect(mock_client).to have_received(:get).with(
        "/v1/contacts",
        hash_including("companyId" => "c-1")
      )
    end

    it "creates a contact and unwraps result" do
      mock_contact = { "id" => "ct-1", "name" => "John Doe", "email" => "john@example.com" }
      allow(mock_client).to receive(:post).and_return({ "result" => mock_contact, "message" => "Contact created successfully" })

      result = described_class.create_contact(
        "name" => "John Doe",
        "companyId" => "c-1",
        "email" => "john@example.com"
      )

      expect(result["name"]).to eq("John Doe")
      expect(mock_client).to have_received(:post).with(
        "/v1/contacts",
        { "name" => "John Doe", "companyId" => "c-1", "email" => "john@example.com" }
      )
    end

    it "updates a contact and unwraps result" do
      allow(mock_client).to receive(:patch).and_return({ "result" => { "id" => "ct-1", "name" => "Jane Doe" }, "message" => "Contact updated successfully" })

      result = described_class.update_contact("ct-1", "name" => "Jane Doe")

      expect(result["name"]).to eq("Jane Doe")
    end

    it "deletes a contact" do
      allow(mock_client).to receive(:delete).and_return({ "message" => "Contact deleted successfully" })

      result = described_class.delete_contact("ct-1")

      expect(result["message"]).to eq("Contact deleted successfully")
    end
  end

  # ============================================
  # TEMPLATES
  # ============================================

  describe "Templates" do
    before { described_class.configure(api_key: "test-key", org_id: "org-1") }

    it "lists all templates" do
      mock_response = {
        "results" => [{ "id" => "t-1", "primaryColor" => "#0066FF" }, { "id" => "t-2", "primaryColor" => "#FF0000" }],
        "totalRecords" => 2
      }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.list_templates

      expect(result["results"].length).to eq(2)
      expect(mock_client).to have_received(:get).with("/v1/quote-templates", nil)
    end

    it "lists templates with pagination and query params" do
      mock_response = { "results" => [{ "id" => "t-1", "primaryColor" => "#0066FF" }], "totalRecords" => 1 }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.list_templates("query" => "sales", "limit" => 10, "offset" => 0)

      expect(result["results"].length).to eq(1)
      expect(mock_client).to have_received(:get).with("/v1/quote-templates", { "query" => "sales", "limit" => "10", "offset" => "0" })
    end

    it "gets a template by ID and unwraps result" do
      mock_template = { "id" => "t-1", "primaryColor" => "#0066FF" }
      allow(mock_client).to receive(:get).and_return({ "result" => mock_template })

      result = described_class.get_template_by_id("t-1")

      expect(result["id"]).to eq("t-1")
      expect(mock_client).to have_received(:get).with("/v1/quote-templates/t-1")
    end

    it "gets the org template and unwraps result" do
      mock_template = { "id" => "t-1", "primaryColor" => "#0066FF" }
      allow(mock_client).to receive(:get).and_return({ "result" => mock_template, "message" => "Template found" })

      result = described_class.get_template

      expect(result["id"]).to eq("t-1")
      expect(mock_client).to have_received(:get).with("/v1/quote-template")
    end

    it "creates a template and unwraps result" do
      mock_template = { "id" => "t-1", "primaryColor" => "#0066FF" }
      allow(mock_client).to receive(:post).and_return({ "result" => mock_template, "message" => "Template created successfully" })

      result = described_class.create_template("primaryColor" => "#0066FF", "senderName" => "Sales")

      expect(result["id"]).to eq("t-1")
      expect(mock_client).to have_received(:post).with(
        "/v1/quote-templates",
        { "primaryColor" => "#0066FF", "senderName" => "Sales" }
      )
    end

    it "updates a template and unwraps result" do
      allow(mock_client).to receive(:patch).and_return({ "result" => { "id" => "t-1", "primaryColor" => "#FF0000" }, "message" => "Template updated successfully" })

      result = described_class.update_template("t-1", "primaryColor" => "#FF0000")

      expect(result["primaryColor"]).to eq("#FF0000")
      expect(mock_client).to have_received(:patch).with(
        "/v1/quote-templates/t-1",
        { "primaryColor" => "#FF0000" }
      )
    end

    it "deletes a template" do
      allow(mock_client).to receive(:delete).and_return({ "message" => "Template deleted successfully" })

      result = described_class.delete_template("t-1")

      expect(result["message"]).to eq("Template deleted successfully")
      expect(mock_client).to have_received(:delete).with("/v1/quote-templates/t-1")
    end
  end

  # ============================================
  # TYPES / CATEGORIES
  # ============================================

  describe "Types / Categories" do
    before { described_class.configure(api_key: "test-key", org_id: "org-1") }

    it "lists types by category" do
      mock_response = { "results" => [{ "id" => "type-1", "name" => "Technology" }], "totalRecords" => 1 }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.list_types("categoryType" => "company_industry")

      expect(result["results"].length).to eq(1)
      expect(mock_client).to have_received(:get).with(
        "/v1/types",
        hash_including("categoryType" => "company_industry")
      )
    end

    it "lists types without options" do
      mock_response = { "results" => [], "totalRecords" => 0 }
      allow(mock_client).to receive(:get).and_return(mock_response)

      result = described_class.list_types

      expect(result["results"].length).to eq(0)
      expect(mock_client).to have_received(:get).with("/v1/types", nil)
    end

    it "creates a type and unwraps result" do
      mock_type = { "id" => "type-1", "name" => "SaaS", "categoryType" => "product_category" }
      allow(mock_client).to receive(:post).and_return({ "result" => mock_type, "message" => "Type created successfully" })

      result = described_class.create_type("name" => "SaaS", "categoryType" => "product_category")

      expect(result["name"]).to eq("SaaS")
    end

    it "updates a type and unwraps result" do
      allow(mock_client).to receive(:patch).and_return({ "result" => { "id" => "type-1", "name" => "Software" }, "message" => "Type updated successfully" })

      result = described_class.update_type("type-1", "name" => "Software")

      expect(result["name"]).to eq("Software")
    end

    it "deletes a type" do
      allow(mock_client).to receive(:delete).and_return({ "message" => "Type deleted successfully" })

      result = described_class.delete_type("type-1")

      expect(result["message"]).to eq("Type deleted successfully")
    end
  end

  # ============================================
  # CONVENIENCE -- createAndSend
  # ============================================

  describe ".create_and_send" do
    before { described_class.configure(api_key: "test-key", org_id: "org-1") }

    it "creates a quote, adds items, and sends in one call" do
      mock_quote = { "id" => "q-1", "name" => "Enterprise License", "status" => "draft" }
      mock_items = { "results" => [{ "id" => "li-1" }], "message" => "1 line item(s) added successfully" }
      mock_send_response = { "result" => mock_quote.merge("status" => "sent"), "message" => "Sent" }

      call_count = 0
      allow(mock_client).to receive(:post) do |*_args|
        call_count += 1
        case call_count
        when 1 then { "result" => mock_quote, "message" => "Quote created successfully" }
        when 2 then mock_items
        when 3 then mock_send_response
        end
      end

      result = described_class.create_and_send(
        "name" => "Enterprise License",
        "companyId" => "c-1",
        "contactId" => "ct-1",
        "items" => [{ "productId" => "p-1", "productName" => "Widget", "unitPrice" => 99, "billingFrequency" => "monthly", "quantity" => 10 }],
        "send" => { "ccEmails" => ["admin@example.com"] }
      )

      expect(result["quote"]["status"]).to eq("sent")

      post_calls = []
      # Collect the call arguments
      expect(mock_client).to have_received(:post).exactly(3).times
    end

    it "creates and sends without items" do
      mock_quote = { "id" => "q-1", "name" => "Simple Quote", "status" => "draft" }
      mock_send_response = { "result" => mock_quote.merge("status" => "sent"), "message" => "Sent" }

      call_count = 0
      allow(mock_client).to receive(:post) do |*_args|
        call_count += 1
        case call_count
        when 1 then { "result" => mock_quote, "message" => "Quote created successfully" }
        when 2 then mock_send_response
        end
      end

      result = described_class.create_and_send(
        "name" => "Simple Quote",
        "companyId" => "c-1",
        "contactId" => "ct-1"
      )

      expect(result["quote"]["status"]).to eq("sent")
      expect(mock_client).to have_received(:post).exactly(2).times
    end

    it "creates and sends with bundle items" do
      mock_quote = { "id" => "q-1", "name" => "Bundle Quote", "status" => "draft" }
      mock_bundle_items = { "results" => [{ "id" => "li-1", "lineItemType" => "bundle" }], "message" => "1 bundle(s) added successfully" }
      mock_send_response = { "result" => mock_quote.merge("status" => "sent"), "message" => "Sent" }

      call_count = 0
      allow(mock_client).to receive(:post) do |path, *_args|
        call_count += 1
        case call_count
        when 1 then { "result" => mock_quote, "message" => "Quote created successfully" }
        when 2 then mock_bundle_items
        when 3 then mock_send_response
        end
      end

      result = described_class.create_and_send(
        "name" => "Bundle Quote",
        "companyId" => "c-1",
        "contactId" => "ct-1",
        "bundleItems" => [{ "bundleId" => "b-1", "bundleName" => "Starter Pack" }]
      )

      expect(result["quote"]["status"]).to eq("sent")
      expect(mock_client).to have_received(:post).with("/v1/quotes/q-1/items/bundle", anything)
    end

    it "does not mutate the original request hash in create_and_send" do
      mock_quote = { "id" => "q-1", "name" => "Enterprise License", "status" => "draft" }
      mock_items = { "results" => [{ "id" => "li-1" }], "message" => "1 line item(s) added successfully" }
      mock_send_response = { "result" => mock_quote.merge("status" => "sent"), "message" => "Sent" }

      call_count = 0
      allow(mock_client).to receive(:post) do |*_args|
        call_count += 1
        case call_count
        when 1 then { "result" => mock_quote, "message" => "Quote created successfully" }
        when 2 then mock_items
        when 3 then mock_send_response
        end
      end

      request = {
        "name" => "Enterprise License",
        "companyId" => "c-1",
        "contactId" => "ct-1",
        "items" => [{ "productId" => "p-1", "productName" => "Widget", "unitPrice" => 99, "billingFrequency" => "monthly", "quantity" => 10 }],
        "send" => { "ccEmails" => ["admin@example.com"] }
      }
      original_request = request.dup

      described_class.create_and_send(request)

      expect(request).to eq(original_request)
    end
  end

  # ============================================
  # ERROR HANDLING
  # ============================================

  describe "Error Handling" do
    it "propagates API errors from HttpClient" do
      api_error = { "statusCode" => 404, "message" => "Quote not found" }
      allow(mock_client).to receive(:get).and_raise(TurboDocxSdk::NotFoundError, "Quote not found")
      described_class.configure(api_key: "test-key", org_id: "org-1")

      expect { described_class.get_quote("invalid") }.to raise_error(TurboDocxSdk::NotFoundError, "Quote not found")
    end

    it "propagates validation errors" do
      allow(mock_client).to receive(:post).and_raise(TurboDocxSdk::ValidationError, "Name is required")
      described_class.configure(api_key: "test-key", org_id: "org-1")

      expect {
        described_class.create_quote("name" => "", "companyId" => "c-1", "contactId" => "ct-1")
      }.to raise_error(TurboDocxSdk::ValidationError, "Name is required")
    end
  end
end
