# frozen_string_literal: true

require "spec_helper"

# TurboQuote: list sorting and filters, the quote summary / creators / next number reads,
# open quotes, product quote images, custom line item images, named duplicates, company
# email and price book reset.
RSpec.describe TurboDocxSdk::TurboQuote do
  let(:mock_client) { instance_double(TurboDocxSdk::HttpClient) }
  let(:png) { "\x89PNG\r\n\x1a\n\x00".b }
  let(:jpeg) { "\xFF\xD8\xFF\xE0\x00".b }

  before do
    described_class.instance_variable_set(:@client, nil)
    allow(TurboDocxSdk::HttpClient).to receive(:new).and_return(mock_client)
  end

  # ============================================
  # SORTING AND FILTERS
  # ============================================

  describe ".list_quotes" do
    it "sends the sort, the new filters and the summary currency" do
      allow(mock_client).to receive(:get).and_return({ "results" => [], "totalRecords" => 0 })

      described_class.list_quotes(
        "sortBy" => "total",
        "sortDirection" => "asc",
        "statuses" => %w[sent expired],
        "companyIds" => %w[c-1 c-2],
        "currencies" => %w[USD EUR],
        "createdBy" => ["u-1"],
        "createdByApiKeys" => true,
        "validUntilWindow" => "thisMonth",
        "validUntilFrom" => "2026-10-01",
        "validUntilTo" => "2026-10-31",
        "summaryCurrency" => "EUR"
      )

      expect(mock_client).to have_received(:get).with("/v1/quotes", {
                                                        "sortBy" => "total",
                                                        "sortDirection" => "asc",
                                                        "statuses" => %w[sent expired],
                                                        "companyIds" => %w[c-1 c-2],
                                                        "currencies" => %w[USD EUR],
                                                        "createdBy" => ["u-1"],
                                                        "createdByApiKeys" => "true",
                                                        "validUntilWindow" => "thisMonth",
                                                        "validUntilFrom" => "2026-10-01",
                                                        "validUntilTo" => "2026-10-31",
                                                        "summaryCurrency" => "EUR"
                                                      })
    end

    it "returns the tab counts, the summary and each quote's expiry flag" do
      allow(mock_client).to receive(:get).and_return({
                                                       "results" => [{ "id" => "q-1", "isExpired" => true, "lineItemCount" => 3 }],
                                                       "totalRecords" => 1,
                                                       "statusCounts" => { "expired" => 1 },
                                                       "summary" => { "currency" => "USD", "winRate" => { "percent" => nil } }
                                                     })

      result = described_class.list_quotes

      expect(result["statusCounts"]["expired"]).to eq(1)
      expect(result["summary"]["winRate"]["percent"]).to be_nil
      expect(result["results"][0]["isExpired"]).to be(true)
      expect(result["results"][0]["lineItemCount"]).to eq(3)
    end
  end

  it "list_products sends several billing frequencies and currencies, and the sort" do
    allow(mock_client).to receive(:get).and_return({ "results" => [], "totalRecords" => 0 })

    described_class.list_products(
      "billingFrequency" => %w[monthly annual], "currency" => %w[USD INR],
      "sortBy" => "listPrice", "sortDirection" => "desc"
    )

    expect(mock_client).to have_received(:get).with("/v1/products", {
                                                      "billingFrequency" => %w[monthly annual], "currency" => %w[USD INR],
                                                      "sortBy" => "listPrice", "sortDirection" => "desc"
                                                    })
  end

  it "list_price_books, list_bundles, list_companies, list_types send the sort" do
    allow(mock_client).to receive(:get).and_return({ "results" => [], "totalRecords" => 0 })

    described_class.list_price_books("sortBy" => "overrideCount", "sortDirection" => "desc")
    described_class.list_bundles("currency" => %w[USD EUR], "sortBy" => "itemCount", "sortDirection" => "asc")
    described_class.list_companies("sortBy" => "contactCount", "sortDirection" => "desc")
    described_class.list_types("categoryType" => "product_category", "sortBy" => "usageCount", "sortDirection" => "desc")

    expect(mock_client).to have_received(:get).with("/v1/pricebooks", { "sortBy" => "overrideCount", "sortDirection" => "desc" })
    expect(mock_client).to have_received(:get).with("/v1/bundles", { "currency" => %w[USD EUR], "sortBy" => "itemCount", "sortDirection" => "asc" })
    expect(mock_client).to have_received(:get).with("/v1/companies", { "sortBy" => "contactCount", "sortDirection" => "desc" })
    expect(mock_client).to have_received(:get).with("/v1/types", {
                                                      "categoryType" => "product_category", "sortBy" => "usageCount", "sortDirection" => "desc"
                                                    })
  end

  it "list_contacts sends several companies and the sort" do
    allow(mock_client).to receive(:get).and_return({ "results" => [], "totalRecords" => 0 })

    described_class.list_contacts("companyIds" => %w[c-1 c-2], "sortBy" => "name", "sortDirection" => "asc")

    expect(mock_client).to have_received(:get).with("/v1/contacts", {
                                                      "companyIds" => %w[c-1 c-2], "sortBy" => "name", "sortDirection" => "asc"
                                                    })
  end

  it "list_company_contacts sends the sort and returns the company's contact count" do
    allow(mock_client).to receive(:get).and_return({ "results" => [], "totalRecords" => 0, "company" => { "contactCount" => 1 } })

    result = described_class.list_company_contacts("c-1", "sortBy" => "createdOn", "sortDirection" => "desc")

    expect(mock_client).to have_received(:get).with("/v1/companies/c-1/contacts", { "sortBy" => "createdOn", "sortDirection" => "desc" })
    expect(result["company"]["contactCount"]).to eq(1)
  end

  # ============================================
  # QUOTE READS
  # ============================================

  describe ".get_quote_summary" do
    it "gets the summary for the filters and unwraps it" do
      summary = { "currency" => "EUR", "openPipeline" => { "total" => 10, "count" => 1 } }
      allow(mock_client).to receive(:get).and_return({ "summary" => summary })

      result = described_class.get_quote_summary("currencies" => %w[EUR USD], "summaryCurrency" => "EUR")

      expect(mock_client).to have_received(:get).with("/v1/quotes/summary", { "currencies" => %w[EUR USD], "summaryCurrency" => "EUR" })
      expect(result).to eq(summary)
    end

    it "sends no params without options" do
      allow(mock_client).to receive(:get).and_return({ "summary" => {} })

      described_class.get_quote_summary

      expect(mock_client).to have_received(:get).with("/v1/quotes/summary", nil)
    end
  end

  it "list_quote_creators returns the people and API keys who created quotes" do
    creators = [
      { "id" => "u-1", "name" => "Ana Lee", "email" => "ana@acme.test", "isAPIKey" => false, "apiKeyDeleted" => false },
      { "id" => "u-2", "name" => "Zapier key", "email" => nil, "isAPIKey" => true, "apiKeyDeleted" => true }
    ]
    allow(mock_client).to receive(:get).and_return({ "results" => creators })

    expect(described_class.list_quote_creators).to eq(creators)
    expect(mock_client).to have_received(:get).with("/v1/quotes/creators")
  end

  it "get_next_quote_number returns the next number" do
    next_number = { "nextNumber" => "Q-2026-0042", "sequence" => 42, "canEdit" => true }
    allow(mock_client).to receive(:get).and_return({ "results" => next_number })

    expect(described_class.get_next_quote_number).to eq(next_number)
    expect(mock_client).to have_received(:get).with("/v1/quotes/number-config/next")
  end

  # ============================================
  # OPEN QUOTES
  # ============================================

  it "get_company_open_quotes and get_contact_open_quotes list what blocks a delete" do
    response = { "results" => [{ "id" => "q-1", "quoteNumber" => "Q-1", "status" => "sent" }], "totalRecords" => 1 }
    allow(mock_client).to receive(:get).and_return(response)

    expect(described_class.get_company_open_quotes("c-1")).to eq(response)
    expect(described_class.get_contact_open_quotes("ct-1")).to eq(response)
    expect(mock_client).to have_received(:get).with("/v1/companies/c-1/open-quotes")
    expect(mock_client).to have_received(:get).with("/v1/contacts/ct-1/open-quotes")
  end

  # ============================================
  # IMAGES
  # ============================================

  it "get_product_quote_images posts the product ids" do
    images = { "p-1" => [{ "id" => "i-1" }], "p-2" => [] }
    allow(mock_client).to receive(:post).and_return({ "results" => images })

    expect(described_class.get_product_quote_images(%w[p-1 p-2])).to eq(images)
    expect(mock_client).to have_received(:post).with("/v1/products/quote-images", { "productIds" => %w[p-1 p-2] })
  end

  describe "custom line item images" do
    it "get_quote_line_item_images returns images keyed by line item" do
      by_item = { "li-1" => [{ "id" => "img-1" }] }
      allow(mock_client).to receive(:get).and_return({ "results" => by_item })

      expect(described_class.get_quote_line_item_images("q-1")).to eq(by_item)
      expect(mock_client).to have_received(:get).with("/v1/quotes/q-1/items/images")
    end

    it "get_line_item_images returns one item's images" do
      allow(mock_client).to receive(:get).and_return({ "results" => [{ "id" => "img-1" }] })

      expect(described_class.get_line_item_images("q-1", "li-1")).to eq([{ "id" => "img-1" }])
      expect(mock_client).to have_received(:get).with("/v1/quotes/q-1/items/li-1/images")
    end

    it "add_line_item_images uploads 'images' parts with detected types and no data part" do
      captured = nil
      allow(mock_client).to receive(:post_form_data) do |path, form|
        captured = [path, form]
        { "results" => [{ "id" => "img-1" }, { "id" => "img-2" }] }
      end

      result = described_class.add_line_item_images("q-1", "li-1", [StringIO.new(png), StringIO.new(jpeg)])

      path, form = captured
      expect(path).to eq("/v1/quotes/q-1/items/li-1/images")
      expect(form.keys).to eq(["images"])
      expect(form["images"].map { |part| part[:content_type] }).to eq(%w[image/png image/jpeg])
      expect(form["images"].map { |part| part[:filename] }).to eq(%w[image.png image.jpg])
      expect(result.size).to eq(2)
    end

    it "reorder_line_item_images puts the ids first to last" do
      allow(mock_client).to receive(:put).and_return({ "results" => [{ "id" => "img-2" }, { "id" => "img-1" }] })

      result = described_class.reorder_line_item_images("q-1", "li-1", %w[img-2 img-1])

      expect(mock_client).to have_received(:put).with("/v1/quotes/q-1/items/li-1/images/order", { "imageIds" => %w[img-2 img-1] })
      expect(result.first["id"]).to eq("img-2")
    end

    it "remove_line_item_image returns the images left" do
      allow(mock_client).to receive(:delete).and_return({ "results" => [{ "id" => "img-2" }] })

      expect(described_class.remove_line_item_image("q-1", "li-1", "img-1")).to eq([{ "id" => "img-2" }])
      expect(mock_client).to have_received(:delete).with("/v1/quotes/q-1/items/li-1/images/img-1")
    end
  end

  # ============================================
  # NAMED DUPLICATES
  # ============================================

  {
    duplicate_quote: "/v1/quotes/x-1/duplicate",
    duplicate_product: "/v1/products/x-1/duplicate",
    duplicate_price_book: "/v1/pricebooks/x-1/duplicate",
    duplicate_bundle: "/v1/bundles/x-1/duplicate"
  }.each do |method, path|
    it "#{method} sends the name for the copy" do
      allow(mock_client).to receive(:post).and_return({ "result" => { "id" => "x-2" } })

      expect(described_class.public_send(method, "x-1", name: "Q4 copy")).to eq({ "id" => "x-2" })
      expect(mock_client).to have_received(:post).with(path, { "name" => "Q4 copy" })
    end

    it "#{method} without a name sends no body" do
      allow(mock_client).to receive(:post).and_return({ "result" => { "id" => "x-2" } })

      described_class.public_send(method, "x-1")

      expect(mock_client).to have_received(:post).with(path)
    end
  end

  # ============================================
  # REQUEST FIELDS
  # ============================================

  it "create_company sends the company email" do
    allow(mock_client).to receive(:post).and_return({ "result" => { "id" => "c-1" } })

    described_class.create_company(
      "name" => "Acme", "email" => "ap@acme.test", "contacts" => [{ "name" => "Ana", "email" => "ana@acme.test" }]
    )

    expect(mock_client).to have_received(:post).with("/v1/companies", hash_including("email" => "ap@acme.test"))
  end

  it "update_company sends an explicit null email" do
    allow(mock_client).to receive(:patch).and_return({ "result" => { "id" => "c-1" } })

    described_class.update_company("c-1", { "email" => nil })

    expect(mock_client).to have_received(:patch).with("/v1/companies/c-1", { "email" => nil })
  end

  it "update_price_book sends resetProductPricing" do
    allow(mock_client).to receive(:patch).and_return({ "result" => { "id" => "pb-1" } })

    described_class.update_price_book("pb-1", { "resetProductPricing" => true })

    expect(mock_client).to have_received(:patch).with("/v1/pricebooks/pb-1", { "resetProductPricing" => true })
  end
end
