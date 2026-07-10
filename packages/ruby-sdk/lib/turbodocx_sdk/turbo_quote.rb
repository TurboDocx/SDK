# frozen_string_literal: true

require "json"
require "stringio"
require_relative "http_client"

module TurboDocxSdk
  # TurboQuote module -- quoting operations.
  #
  # All methods are class-level (static pattern). Call +configure+ once,
  # then invoke any method directly on the class.
  #
  #   TurboDocxSdk::TurboQuote.configure(api_key: "...", org_id: "...")
  #   quotes = TurboDocxSdk::TurboQuote.list_quotes(limit: 10)
  #
  class TurboQuote
    class << self
      # Configure the TurboQuote module with API credentials.
      #
      # @param api_key [String, nil]
      # @param access_token [String, nil]
      # @param org_id [String, nil]
      # @param base_url [String, nil]
      # @raise [AuthenticationError] if no API key or access token is provided
      def configure(api_key: nil, access_token: nil, org_id: nil, base_url: nil)
        @client = HttpClient.new(
          api_key: api_key,
          access_token: access_token,
          org_id: org_id,
          base_url: base_url,
          skip_sender_validation: true
        )
      end

      # ============================================
      # QUOTES -- CRUD
      # ============================================

      # List quotes with optional pagination and filters.
      #
      # @param options [Hash, nil] :limit, :offset, :query, :statuses, :companyId, :contactId, :currency
      # @return [Hash] { "results" => [...], "totalRecords" => N, "stats" => {...} }
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_quotes(options = nil)
        client = get_client
        client.get("/v1/quotes", to_query_params(options))
      end

      # Create a new quote.
      #
      # @param request [Hash] :name (required), :companyId (required), :contactId (required),
      #   :currency, :termDays, :renewalPeriod, :validUntil, :taxRate, :priceBookId
      # @return [Hash] the created quote
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def create_quote(request)
        client = get_client
        unwrap(client.post("/v1/quotes", request))
      end

      # Get a quote by ID.
      #
      # @param id [String]
      # @return [Hash] the quote, with "statusInfo" merged in if present
      # @raise [NotFoundError] if the quote does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_quote(id)
        client = get_client
        response = client.get("/v1/quotes/#{id}")
        quote = response["result"]
        quote["statusInfo"] = response["statusInfo"] if response["statusInfo"]
        quote
      end

      # Update a quote.
      #
      # @param id [String]
      # @param request [Hash] fields to update
      # @return [Hash] the updated quote
      # @raise [NotFoundError] if the quote does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_quote(id, request)
        client = get_client
        unwrap(client.patch("/v1/quotes/#{id}", request))
      end

      # Delete a quote.
      #
      # @param id [String]
      # @return [Hash] { "message" => "..." }
      # @raise [NotFoundError] if the quote does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def delete_quote(id)
        client = get_client
        client.delete("/v1/quotes/#{id}")
      end

      # Duplicate a quote.
      #
      # @param id [String]
      # @return [Hash] the duplicated quote
      # @raise [NotFoundError] if the quote does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def duplicate_quote(id)
        client = get_client
        unwrap(client.post("/v1/quotes/#{id}/duplicate"))
      end

      # Apply a price book to a quote.
      #
      # @param quote_id [String]
      # @param price_book_id [String]
      # @return [Hash] { "quote" => {...}, "message" => "...", "updatedCount" => N, "skippedCount" => N }
      # @raise [NotFoundError] if the quote does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def apply_price_book(quote_id, price_book_id)
        client = get_client
        response = client.post("/v1/quotes/#{quote_id}/apply-pricebook", { "priceBookId" => price_book_id })
        {
          "quote" => response["result"],
          "message" => response["message"],
          "updatedCount" => response["updatedCount"],
          "skippedCount" => response["skippedCount"]
        }
      end

      # Remove a price book from a quote.
      #
      # @param quote_id [String]
      # @return [Hash] the updated quote
      # @raise [NotFoundError] if the quote does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def remove_price_book(quote_id)
        client = get_client
        unwrap(client.post("/v1/quotes/#{quote_id}/remove-pricebook"))
      end

      # Download a quote as PDF (raw binary).
      #
      # @param id [String]
      # @return [String] raw PDF bytes
      # @raise [NotFoundError] if the quote does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def download_quote_pdf(id)
        client = get_client
        client.get_raw("/v1/quotes/#{id}/pdf")
      end

      # ============================================
      # QUOTES -- STATUS TRANSITIONS
      # ============================================

      # Send a quote.
      #
      # @param id [String]
      # @param request [Hash, nil] :ccEmails, :validUntil
      # @return [Hash] { "quote" => {...}, "message" => "..." }
      # @raise [NotFoundError] if the quote does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def send_quote(id, request = nil)
        client = get_client
        response = client.post("/v1/quotes/#{id}/send", request)
        {
          "quote" => response["result"],
          "message" => response["message"]
        }
      end

      # Send a quote with a deliverable attachment.
      #
      # @param id [String]
      # @param request [Hash] :deliverableId, :mergePosition, :ccEmails
      # @return [Hash] { "quote" => {...}, "message" => "...", "documentId" => "..." }
      # @raise [NotFoundError] if the quote does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def send_quote_with_deliverable(id, request)
        client = get_client
        response = client.post("/v1/quotes/#{id}/send-with-deliverable", request)
        {
          "quote" => response["result"],
          "message" => response["message"],
          "documentId" => response["documentId"]
        }
      end

      # Decline a quote.
      #
      # @param id [String]
      # @param request [Hash] :reason
      # @return [Hash] the declined quote
      # @raise [NotFoundError] if the quote does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def decline_quote(id, request)
        client = get_client
        unwrap(client.post("/v1/quotes/#{id}/decline", request))
      end

      # Void a quote.
      #
      # @param id [String]
      # @param request [Hash] :reason
      # @return [Hash] the voided quote
      # @raise [NotFoundError] if the quote does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def void_quote(id, request)
        client = get_client
        unwrap(client.post("/v1/quotes/#{id}/void", request))
      end

      # Handle an expired sent quote.
      #
      # @param id [String]
      # @param request [Hash] :action, :reason, :newValidUntil
      # @return [Hash] the processed quote
      # @raise [NotFoundError] if the quote does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def handle_expired_quote(id, request)
        client = get_client
        unwrap(client.post("/v1/quotes/#{id}/handle-expired-sent", request))
      end

      # ============================================
      # LINE ITEMS
      # ============================================

      # List line items for a quote.
      #
      # @param quote_id [String]
      # @param options [Hash, nil] :limit, :offset, :lineItemType, :billingFrequency, :parentLineItemId
      # @return [Hash] { "results" => [...], "totalRecords" => N }
      # @raise [NotFoundError] if the quote does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_line_items(quote_id, options = nil)
        client = get_client
        client.get("/v1/quotes/#{quote_id}/items", to_query_params(options))
      end

      # Add product line items to a quote.
      #
      # @param quote_id [String]
      # @param items [Hash, Array<Hash>] single item or array of items. Each item may include:
      #   - +productId+ [String] — catalog product ID (optional)
      #   - +productName+ [String] — display name
      #   - +unitPrice+ [Numeric] — price per unit
      #   - +billingFrequency+ [String] — one of BillingFrequency::ALL
      #   - +quantity+ [Integer]
      #   - +discountType+ [String, nil] — +"percent"+ or +"amount"+ (default +"percent"+);
      #     see DiscountType
      #   - +discountAmount+ [Numeric, nil] — discount value (min 0, 2 decimal places, default 0)
      # @return [Array<Hash>] the created line items
      # @raise [NotFoundError] if the quote does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def add_line_items(quote_id, items)
        client = get_client
        payload = items.is_a?(Array) ? items : [items]
        response = client.post("/v1/quotes/#{quote_id}/items", payload)
        response["results"]
      end

      # Add bundle line items to a quote.
      #
      # @param quote_id [String]
      # @param items [Hash, Array<Hash>] single item or array of items. Each item may include:
      #   - +bundleId+ [String] — catalog bundle ID
      #   - +bundleName+ [String] — display name
      #   - +quantity+ [Integer]
      #   - +discountType+ [String, nil] — +"percent"+ or +"amount"+ (default +"percent"+);
      #     see DiscountType
      #   - +discountAmount+ [Numeric, nil] — discount value (min 0, 2 decimal places, default 0)
      # @return [Array<Hash>] the created line items
      # @raise [NotFoundError] if the quote does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def add_bundle_line_items(quote_id, items)
        client = get_client
        payload = items.is_a?(Array) ? items : [items]
        response = client.post("/v1/quotes/#{quote_id}/items/bundle", payload)
        response["results"]
      end

      # Update a line item.
      #
      # @param quote_id [String]
      # @param item_id [String]
      # @param request [Hash] fields to update. May include:
      #   - +unitPrice+ [Numeric]
      #   - +quantity+ [Integer]
      #   - +discountType+ [String, nil] — +"percent"+ or +"amount"+; see DiscountType
      #   - +discountAmount+ [Numeric, nil] — discount value (min 0, 2 decimal places)
      #   - +displayOrder+ [Integer, nil] — sort order (integer >=0); pass +nil+ to clear
      # @return [Hash] the updated line item
      # @raise [NotFoundError] if the quote or line item does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_line_item(quote_id, item_id, request)
        client = get_client
        unwrap(client.patch("/v1/quotes/#{quote_id}/items/#{item_id}", request))
      end

      # Remove a line item from a quote.
      #
      # @param quote_id [String]
      # @param item_id [String]
      # @return [Hash] { "message" => "..." }
      # @raise [NotFoundError] if the quote or line item does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def remove_line_item(quote_id, item_id)
        client = get_client
        client.delete("/v1/quotes/#{quote_id}/items/#{item_id}")
      end

      # ============================================
      # PRODUCTS
      # ============================================

      # List products with optional filters.
      #
      # @param options [Hash, nil] :limit, :offset, :query, :categoryIds, :billingFrequency, :currency, :showInCatalog
      # @return [Hash] paginated response with stats
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_products(options = nil)
        client = get_client
        client.get("/v1/products", to_query_params(options))
      end

      # Create a product.
      #
      # @param request [Hash] product fields; may include :images (array of file paths or IO)
      # @return [Hash] the created product
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def create_product(request)
        client = get_client
        data = request.dup
        images = data.delete("images") || data.delete(:images)
        if images && !images.empty?
          form_data = build_product_form_data(data, images)
          unwrap(client.post_form_data("/v1/products", form_data))
        else
          unwrap(client.post("/v1/products", data))
        end
      end

      # Bulk create products (administrator or contributor). Partial success:
      # rows that fail are reported in "failed" (1-indexed "row" + "reason")
      # without aborting the rest; server-adjusted rows appear in "adjusted".
      #
      # @param rows [Array<Hash>] product rows, same field shapes as +create_product+
      # @return [Hash] { "imported" => N, "failed" => [...], "adjusted" => [...] }
      # @raise [ValidationError] on an invalid request envelope
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def bulk_create_products(rows)
        client = get_client
        response = client.post("/v1/products/bulk", { "rows" => rows })
        response["results"]
      end

      # Get a product by ID.
      #
      # @param id [String]
      # @return [Hash] the product
      # @raise [NotFoundError] if the product does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_product(id)
        client = get_client
        unwrap(client.get("/v1/products/#{id}"))
      end

      # Update a product.
      #
      # @param id [String]
      # @param request [Hash] fields to update; may include :images
      # @return [Hash] the updated product
      # @raise [NotFoundError] if the product does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_product(id, request)
        client = get_client
        data = request.dup
        images = data.delete("images") || data.delete(:images)
        if images && !images.empty?
          form_data = build_product_form_data(data, images)
          unwrap(client.patch_form_data("/v1/products/#{id}", form_data))
        else
          unwrap(client.patch("/v1/products/#{id}", data))
        end
      end

      # Delete a product.
      #
      # @param id [String]
      # @return [Hash] { "message" => "..." }
      # @raise [NotFoundError] if the product does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def delete_product(id)
        client = get_client
        client.delete("/v1/products/#{id}")
      end

      # Duplicate a product.
      #
      # @param id [String]
      # @return [Hash] the duplicated product
      # @raise [NotFoundError] if the product does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def duplicate_product(id)
        client = get_client
        unwrap(client.post("/v1/products/#{id}/duplicate"))
      end

      # Get primary images for multiple products.
      #
      # @param product_ids [Array<String>]
      # @return [Hash] product_id => image_hash or nil
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_product_primary_images(product_ids)
        client = get_client
        response = client.post("/v1/products/primary-images", { "productIds" => product_ids })
        response["results"]
      end

      # ============================================
      # PRICE BOOKS
      # ============================================

      # List price books.
      #
      # @param options [Hash, nil]
      # @return [Hash] paginated response with stats
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_price_books(options = nil)
        client = get_client
        client.get("/v1/pricebooks", to_query_params(options))
      end

      # Create a price book.
      #
      # @param request [Hash] price book fields. May include:
      #   - +name+ [String]
      #   - +priceBookTypeId+ [String]
      #   - +discountPercent+ [Numeric] — default discount for all products in this book
      #   - +validFrom+ [String] — ISO date
      #   - +validTo+ [String] — ISO date
      #   - +showInQuoteBuilder+ [Boolean]
      #   - +productPricing+ [Array<Hash>] — per-product overrides; each entry may include:
      #       +:productId+, +:discountType+ (+"percent"+|+"amount"+), +:discountAmount+ (Numeric)
      # @return [Hash] the created price book
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def create_price_book(request)
        client = get_client
        # Backend requires discountPercent on POST (omitting it 400s) and rejects null; coerce a
        # missing OR explicit-nil value to the documented default 0 (matches JS/Go/PHP/Java).
        data = request.dup
        dp = data["discountPercent"]
        dp = data[:discountPercent] if dp.nil?
        if dp.nil?
          data.delete(:discountPercent)
          data["discountPercent"] = 0
        end
        unwrap(client.post("/v1/pricebooks", data))
      end

      # Bulk create price books (administrator or contributor). Partial success:
      # rows that fail are reported in "failed" (1-indexed "row" + "reason")
      # without aborting the rest; server-adjusted rows appear in "adjusted".
      #
      # @param rows [Array<Hash>] price book rows, same field shapes as +create_price_book+
      # @return [Hash] { "imported" => N, "failed" => [...], "adjusted" => [...] }
      # @raise [ValidationError] on an invalid request envelope
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def bulk_create_price_books(rows)
        client = get_client
        response = client.post("/v1/pricebooks/bulk", { "rows" => rows })
        response["results"]
      end

      # Get a price book by ID.
      #
      # @param id [String]
      # @return [Hash] the price book
      # @raise [NotFoundError] if the price book does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_price_book(id)
        client = get_client
        unwrap(client.get("/v1/pricebooks/#{id}"))
      end

      # Update a price book.
      #
      # @param id [String]
      # @param request [Hash] fields to update. May include:
      #   - +productPricing+ [Array<Hash>] — per-product overrides; each entry may include:
      #       +:productId+, +:discountType+ (+"percent"+|+"amount"+), +:discountAmount+ (Numeric)
      # @return [Hash] the updated price book
      # @raise [NotFoundError] if the price book does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_price_book(id, request)
        client = get_client
        unwrap(client.patch("/v1/pricebooks/#{id}", request))
      end

      # Delete a price book.
      #
      # @param id [String]
      # @return [Hash] { "message" => "..." }
      # @raise [NotFoundError] if the price book does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def delete_price_book(id)
        client = get_client
        client.delete("/v1/pricebooks/#{id}")
      end

      # Duplicate a price book.
      #
      # @param id [String]
      # @return [Hash] the duplicated price book
      # @raise [NotFoundError] if the price book does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def duplicate_price_book(id)
        client = get_client
        unwrap(client.post("/v1/pricebooks/#{id}/duplicate"))
      end

      # List products in a price book.
      #
      # @param id [String]
      # @param options [Hash, nil]
      # @return [Hash] paginated response
      # @raise [NotFoundError] if the price book does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_price_book_products(id, options = nil)
        client = get_client
        client.get("/v1/pricebooks/#{id}/products", to_query_params(options))
      end

      # ============================================
      # BUNDLES
      # ============================================

      # List bundles.
      #
      # @param options [Hash, nil]
      # @return [Hash] paginated response with stats
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_bundles(options = nil)
        client = get_client
        client.get("/v1/bundles", to_query_params(options))
      end

      # Create a bundle.
      #
      # @param request [Hash] bundle fields. Required: +:categoryId+. Optional fields include:
      #   - +name+ [String]
      #   - +categoryId+ [String] — REQUIRED; bundle category ID
      #   - +sku+ [String]
      #   - +description+ [String]
      #   - +currency+ [String] — see Currency
      #   - +bundleDiscountType+ [String, nil] — +"percent"+ or +"amount"+; see DiscountType
      #   - +bundleDiscountAmount+ [Numeric, nil] — bundle-level discount value (min 0, 2 decimal places)
      #   - +showInCatalog+ [Boolean]
      #   - +showItemsToEndUser+ [Boolean]
      #   - +items+ [Array<Hash>] — bundle item inputs; each may include +discountType+, +discountAmount+
      # @return [Hash] the created bundle
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def create_bundle(request)
        client = get_client
        unwrap(client.post("/v1/bundles", request))
      end

      # Bulk create bundles (administrator or contributor). Partial success:
      # rows that fail are reported in "failed" (1-indexed "row" + "reason")
      # without aborting the rest; server-adjusted rows appear in "adjusted"
      # (e.g. a bundle item whose product wasn't found was dropped).
      #
      # @param rows [Array<Hash>] bundle rows, same field shapes as +create_bundle+
      # @return [Hash] { "imported" => N, "failed" => [...], "adjusted" => [...] }
      # @raise [ValidationError] on an invalid request envelope
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def bulk_create_bundles(rows)
        client = get_client
        response = client.post("/v1/bundles/bulk", { "rows" => rows })
        response["results"]
      end

      # Get a bundle by ID.
      #
      # @param id [String]
      # @return [Hash] the bundle
      # @raise [NotFoundError] if the bundle does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_bundle(id)
        client = get_client
        unwrap(client.get("/v1/bundles/#{id}"))
      end

      # Update a bundle.
      #
      # @param id [String]
      # @param request [Hash] fields to update. May include:
      #   - +bundleDiscountType+ [String, nil] — +"percent"+ or +"amount"+; see DiscountType
      #   - +bundleDiscountAmount+ [Numeric, nil] — bundle-level discount value (min 0, 2 decimal places)
      # @return [Hash] the updated bundle
      # @raise [NotFoundError] if the bundle does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_bundle(id, request)
        client = get_client
        unwrap(client.patch("/v1/bundles/#{id}", request))
      end

      # Delete a bundle.
      #
      # @param id [String]
      # @return [Hash] { "message" => "..." }
      # @raise [NotFoundError] if the bundle does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def delete_bundle(id)
        client = get_client
        client.delete("/v1/bundles/#{id}")
      end

      # Duplicate a bundle.
      #
      # @param id [String]
      # @return [Hash] the duplicated bundle
      # @raise [NotFoundError] if the bundle does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def duplicate_bundle(id)
        client = get_client
        unwrap(client.post("/v1/bundles/#{id}/duplicate"))
      end

      # ============================================
      # COMPANIES
      # ============================================

      # List companies.
      #
      # @param options [Hash, nil]
      # @return [Hash] paginated response
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_companies(options = nil)
        client = get_client
        client.get("/v1/companies", to_query_params(options))
      end

      # Create a company.
      #
      # @param request [Hash] :name, :contacts (array), :phone, :city, :state, :country, :industryId
      # @return [Hash] the created company
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def create_company(request)
        client = get_client
        unwrap(client.post("/v1/companies", request))
      end

      # Bulk create companies (administrator or contributor). Each row requires
      # a +contacts+ array with at least one contact. Partial success: rows
      # that fail are reported in "failed" (1-indexed "row" + "reason") without
      # aborting the rest; server-adjusted rows appear in "adjusted".
      #
      # @param rows [Array<Hash>] company rows, same field shapes as +create_company+
      # @return [Hash] { "imported" => N, "failed" => [...], "adjusted" => [...] }
      # @raise [ValidationError] on an invalid request envelope
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def bulk_create_companies(rows)
        client = get_client
        response = client.post("/v1/companies/bulk", { "rows" => rows })
        response["results"]
      end

      # Get a company by ID.
      #
      # @param id [String]
      # @return [Hash] the company
      # @raise [NotFoundError] if the company does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_company(id)
        client = get_client
        unwrap(client.get("/v1/companies/#{id}"))
      end

      # Update a company.
      #
      # @param id [String]
      # @param request [Hash]
      # @return [Hash] the updated company
      # @raise [NotFoundError] if the company does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_company(id, request)
        client = get_client
        unwrap(client.patch("/v1/companies/#{id}", request))
      end

      # Delete a company.
      #
      # @param id [String]
      # @return [Hash] { "message" => "..." }
      # @raise [NotFoundError] if the company does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def delete_company(id)
        client = get_client
        client.delete("/v1/companies/#{id}")
      end

      # List contacts for a company.
      #
      # @param company_id [String]
      # @param options [Hash, nil]
      # @return [Hash] paginated response
      # @raise [NotFoundError] if the company does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_company_contacts(company_id, options = nil)
        client = get_client
        client.get("/v1/companies/#{company_id}/contacts", to_query_params(options))
      end

      # ============================================
      # CONTACTS
      # ============================================

      # List contacts.
      #
      # @param options [Hash, nil] :companyId, :limit, :offset, :query
      # @return [Hash] paginated response
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_contacts(options = nil)
        client = get_client
        client.get("/v1/contacts", to_query_params(options))
      end

      # Create a contact.
      #
      # @param request [Hash] :name, :companyId, :email, :phone, :title
      # @return [Hash] the created contact
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def create_contact(request)
        client = get_client
        unwrap(client.post("/v1/contacts", request))
      end

      # Bulk create contacts (administrator or contributor). Each row requires
      # a +companyId+. Partial success: rows that fail are reported in "failed"
      # (1-indexed "row" + "reason") without aborting the rest; server-adjusted
      # rows appear in "adjusted".
      #
      # @param rows [Array<Hash>] contact rows, same field shapes as +create_contact+
      # @return [Hash] { "imported" => N, "failed" => [...], "adjusted" => [...] }
      # @raise [ValidationError] on an invalid request envelope
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def bulk_create_contacts(rows)
        client = get_client
        response = client.post("/v1/contacts/bulk", { "rows" => rows })
        response["results"]
      end

      # Update a contact.
      #
      # @param id [String]
      # @param request [Hash]
      # @return [Hash] the updated contact
      # @raise [NotFoundError] if the contact does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_contact(id, request)
        client = get_client
        unwrap(client.patch("/v1/contacts/#{id}", request))
      end

      # Delete a contact.
      #
      # @param id [String]
      # @return [Hash] { "message" => "..." }
      # @raise [NotFoundError] if the contact does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def delete_contact(id)
        client = get_client
        client.delete("/v1/contacts/#{id}")
      end

      # ============================================
      # TEMPLATES
      # ============================================

      # List quote templates.
      #
      # @param options [Hash, nil] :limit, :offset, :query
      # @return [Hash] { "results" => [...], "totalRecords" => N }
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_templates(options = nil)
        client = get_client
        client.get("/v1/quote-templates", to_query_params(options))
      end

      # Get the org's current quote template.
      #
      # @return [Hash] the template
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_template
        client = get_client
        unwrap(client.get("/v1/quote-template"))
      end

      # Get a quote template by ID.
      #
      # @param id [String]
      # @return [Hash] the template
      # @raise [NotFoundError] if the template does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_template_by_id(id)
        client = get_client
        unwrap(client.get("/v1/quote-templates/#{id}"))
      end

      # Create a quote template.
      #
      # @param request [Hash]
      # @return [Hash] the created template
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def create_template(request)
        client = get_client
        unwrap(client.post("/v1/quote-templates", request))
      end

      # Update a quote template.
      #
      # @param id [String]
      # @param request [Hash]
      # @return [Hash] the updated template
      # @raise [NotFoundError] if the template does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_template(id, request)
        client = get_client
        unwrap(client.patch("/v1/quote-templates/#{id}", request))
      end

      # Delete a quote template.
      #
      # @param id [String]
      # @return [Hash] { "message" => "..." }
      # @raise [NotFoundError] if the template does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def delete_template(id)
        client = get_client
        client.delete("/v1/quote-templates/#{id}")
      end

      # ============================================
      # TYPES / CATEGORIES
      # ============================================

      # List types/categories.
      #
      # @param options [Hash, nil] :categoryType, :includeUsage, :limit, :offset, :query
      # @return [Hash] paginated response
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_types(options = nil)
        client = get_client
        client.get("/v1/types", to_query_params(options))
      end

      # Create a type/category.
      #
      # @param request [Hash] :name, :categoryType
      # @return [Hash] the created type
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def create_type(request)
        client = get_client
        unwrap(client.post("/v1/types", request))
      end

      # Bulk create types/categories (administrator or contributor). Partial
      # success: rows that fail are reported in "failed" (1-indexed "row" +
      # "reason") without aborting the rest; server-adjusted rows appear in
      # "adjusted".
      #
      # @param rows [Array<Hash>] type rows, same field shapes as +create_type+
      # @return [Hash] { "imported" => N, "failed" => [...], "adjusted" => [...] }
      # @raise [ValidationError] on an invalid request envelope
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def bulk_create_types(rows)
        client = get_client
        response = client.post("/v1/types/bulk", { "rows" => rows })
        response["results"]
      end

      # Update a type/category.
      #
      # @param id [String]
      # @param request [Hash]
      # @return [Hash] the updated type
      # @raise [NotFoundError] if the type does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_type(id, request)
        client = get_client
        unwrap(client.patch("/v1/types/#{id}", request))
      end

      # Delete a type/category.
      #
      # @param id [String]
      # @return [Hash] { "message" => "..." }
      # @raise [NotFoundError] if the type does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def delete_type(id)
        client = get_client
        client.delete("/v1/types/#{id}")
      end

      # ============================================
      # QUOTE NUMBER CONFIG
      # ============================================

      # Get the org's quote-number configuration (admin only).
      #
      # @return [Hash] { "format" => {...}, "currentFloor" => Integer } where +format+ has the
      #   keys +prefix+, +yearToken+ (see QuoteNumberYearToken), +monthToken+ (see
      #   QuoteNumberMonthToken), +separator+, +padWidth+ (Integer), +suffix+,
      #   +startNumber+ (Integer), and +resetCadence+ (see QuoteNumberResetCadence)
      # @raise [AuthorizationError] if the caller is not an admin
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_quote_number_config
        client = get_client
        response = client.get("/v1/quotes/number-config")
        response["results"]
      end

      # Update the org's quote-number configuration (admin only).
      #
      # @param format [Hash] the full format object; all keys are required and passed verbatim
      #   (camelCase): +prefix+ [String], +yearToken+ [String] (see QuoteNumberYearToken),
      #   +monthToken+ [String] (see QuoteNumberMonthToken), +separator+ [String],
      #   +padWidth+ [Integer] (0-12), +suffix+ [String], +startNumber+ [Integer] (>= 0),
      #   +resetCadence+ [String] (see QuoteNumberResetCadence)
      # @return [Hash] { "format" => {...}, "currentFloor" => Integer } (same shape as +get_quote_number_config+)
      # @raise [AuthorizationError] if the caller is not an admin
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_quote_number_config(format)
        client = get_client
        response = client.patch("/v1/quotes/number-config", format)
        response["results"]
      end

      # ============================================
      # CONVENIENCE
      # ============================================

      # Create a quote, optionally add items, and send -- all in one call.
      #
      # @param request [Hash] quote fields plus :items, :bundleItems, :send
      # @return [Hash] { "quote" => {...} }
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def create_and_send(request)
        client = get_client

        # Separate convenience keys from core quote fields
        data = request.dup
        items = data.delete("items") || data.delete(:items)
        bundle_items = data.delete("bundleItems") || data.delete(:bundleItems)
        send_opts = data.delete("send") || data.delete(:send)
        quote_fields = data

        quote = unwrap(client.post("/v1/quotes", quote_fields))

        if items && !items.empty?
          client.post("/v1/quotes/#{quote["id"]}/items", items)
        end

        if bundle_items && !bundle_items.empty?
          client.post("/v1/quotes/#{quote["id"]}/items/bundle", bundle_items)
        end

        send_response = client.post("/v1/quotes/#{quote["id"]}/send", send_opts)

        { "quote" => send_response["result"] }
      end

      private

      # Lazy-initialize an HttpClient from env vars if not configured.
      def get_client
        @client ||= HttpClient.new(skip_sender_validation: true)
      end

      # Extract { "result" => T } -> T
      def unwrap(response)
        response["result"]
      end

      # Convert a Ruby hash to query parameter hash (string values).
      # Returns nil if the result would be empty.
      def to_query_params(request)
        return nil if request.nil? || request.empty?

        params = {}
        request.each do |key, value|
          str_key = key.to_s
          next if value.nil?

          case value
          when true, false
            params[str_key] = value ? "true" : "false"
          when Array
            params[str_key] = value.map(&:to_s)
          else
            params[str_key] = value.to_s
          end
        end
        params.empty? ? nil : params
      end

      # Build form data hash for product creation/update with images.
      def build_product_form_data(data_fields, images)
        form_data = {}
        form_data["data"] = JSON.generate(data_fields)

        file_parts = []
        images.each do |image|
          if image.is_a?(String)
            # File path
            content = File.binread(image)
            file_parts << {
              io: StringIO.new(content),
              filename: File.basename(image),
              content_type: detect_image_type(content)
            }
          elsif image.respond_to?(:read)
            content = image.read
            file_parts << {
              io: StringIO.new(content),
              filename: "image.bin",
              content_type: detect_image_type(content)
            }
          end
        end
        form_data["images"] = file_parts unless file_parts.empty?
        form_data
      end

      # Detect MIME type for product images from magic bytes.
      # Supports PNG, JPEG, GIF, and WEBP; falls back to application/octet-stream.
      def detect_image_type(content)
        bytes = content.bytes
        # PNG: \x89PNG
        return "image/png" if bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47
        # JPEG: \xFF\xD8\xFF
        return "image/jpeg" if bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF
        # GIF: GIF8
        return "image/gif" if bytes[0] == 0x47 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x38
        # WEBP: RIFF????WEBP
        if bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46
          return "image/webp" if content.length >= 12 && content[8, 4] == "WEBP"
        end
        "application/octet-stream"
      end
    end
  end
end
