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

      # The quote list's summary cards (pipeline, win rate, monthly recurring...) for a set of
      # filters, in one currency (+summaryCurrency+). Takes the list_quotes filters; the status
      # filter is ignored.
      #
      # @param options [Hash, nil] filters (camelCase keys, as for list_quotes)
      # @return [Hash] the summary ("currency", "openPipeline", "winRate", ...)
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_quote_summary(options = nil)
        client = get_client
        client.get("/v1/quotes/summary", to_query_params(options))["summary"]
      end

      # The people and API keys who created the org's quotes -- the ids for the +createdBy+ filter.
      #
      # @return [Array<Hash>] each { "id", "name", "email" (nil for an API key), "isAPIKey", "apiKeyDeleted" }
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_quote_creators
        client = get_client
        client.get("/v1/quotes/creators")["results"]
      end

      # Create a new quote.
      #
      # @param request [Hash] :name (required), :companyId (required), :contactId (required),
      #   :currency, :termDays, :renewalPeriod, :validUntil, :taxRate, :priceBookId
      #
      #   +termDays+ defaults to 60 and maxes out at 3650. Pass +-1+ for auto-renewal:
      #   +renewalPeriod+ (one of RenewalPeriod::ALL) is REQUIRED when +termDays+ is +-1+
      #   and must be omitted/nil for every other +termDays+ value.
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
      # @return [Hash] the quote, with "statusInfo" and "preparedBy" merged in if present
      # @raise [NotFoundError] if the quote does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      #
      # "preparedBy" is the resolved "Prepared by" identity ({ "name", "email" }) shown on the
      # quote PDF and preview. Resolved server-side from the org template then the creator; for
      # an API-key-created quote it is the API key's label with no email. Prefer it over
      # "creator" for customer-facing display — "creator" may be the internal API service user.
      def get_quote(id)
        client = get_client
        response = client.get("/v1/quotes/#{id}")
        quote = response["result"]
        quote["statusInfo"] = response["statusInfo"] if response["statusInfo"]
        quote["preparedBy"] = response["preparedBy"] if response["preparedBy"]
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

      # Delete a quote. A sent quote is refused (void it instead), and so is an accepted one.
      #
      # @param id [String]
      # @return [Hash] { "message" => "..." }
      # @raise [ConflictError] for a sent (CANNOT_DELETE_SENT_QUOTE) or accepted
      #   (CANNOT_DELETE_ACCEPTED_QUOTE) quote
      # @raise [NotFoundError] if the quote does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def delete_quote(id)
        client = get_client
        client.delete("/v1/quotes/#{id}")
      end

      # Duplicate a bundle. +name+ names the copy; left out, it is "Copy of <name>".
      #
      # @param id [String]
      # @param name [String, nil] the copy's name
      # @param name [String, nil] the copy's name
      # @param name [String, nil] the copy's name
      # @param name [String, nil] the copy's name
      # @return [Hash] the duplicated quote
      # @raise [NotFoundError] if the quote does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def duplicate_quote(id, name: nil)
        post_duplicate("/v1/quotes/#{id}/duplicate", name)
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
      # The +request+ hash is forwarded to the API verbatim as the JSON body, so any camelCase
      # key the endpoint accepts flows through untouched -- no key is whitelisted or re-cased.
      #
      # @param id [String]
      # @param request [Hash, nil] :ccEmails, :validUntil, and the optional reminder/expiration
      #   SCHEDULE fields (same eight as +TurboSign.send_signature+, sent FLAT on the JSON body):
      #   - +remindersEnabled+ [Boolean], +maxReminders+ [Integer], +expirationEnabled+ [Boolean]
      #   - +reminderDelay+ / +reminderInterval+ / +expireAfter+ / +expirationWarning+ /
      #     +expirationWarningInterval+ — each a duration +{ value:, unit: }+ (plain object; this
      #     is a JSON endpoint, so durations are NOT JSON-encoded the way the multipart signature
      #     path encodes them). Keys are camelCase like every other send key.
      #   CONSTRAINT: quote expiry is pinned to +validUntil+, so +expireAfter+ is ignored when
      #   expiration is on (+expirationEnabled+ still toggles it); the reminder/warning cadence
      #   applies (layered over org defaults) and must fit within +validUntil+ or the send is rejected.
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
      # Like +send_quote+, the +request+ hash is forwarded to the API verbatim as the JSON body.
      #
      # @param id [String]
      # @param request [Hash] :deliverableId, :mergePosition, :ccEmails, and the same
      #   optional reminder/expiration SCHEDULE fields as +send_quote+ (the eight camelCase keys:
      #   +remindersEnabled+, +maxReminders+, +expirationEnabled+ scalars plus +reminderDelay+ /
      #   +reminderInterval+ / +expireAfter+ / +expirationWarning+ / +expirationWarningInterval+
      #   durations as plain +{ value:, unit: }+ objects), sent FLAT on the JSON body.
      #   CONSTRAINT: quote expiry is pinned to +validUntil+, so +expireAfter+ is ignored when
      #   expiration is on (+expirationEnabled+ still toggles it); the reminder/warning cadence
      #   applies (layered over org defaults) and must fit within +validUntil+ or the send is rejected.
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

      # Handle an expired sent quote. Voids or declines the original quote and
      # creates a duplicate carrying the new +newValidUntil+ date.
      #
      # @param id [String]
      # @param request [Hash] all three keys are required:
      #   - +action+ [String] — +"void"+ or +"decline"+ (no other value is accepted)
      #   - +reason+ [String] — max 190 characters
      #   - +newValidUntil+ [String] — ISO 8601 date for the replacement quote
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
      # @param items [Hash, Array<Hash>] single item or array of items (1-50). Each item includes:
      #   - +productId+ [String, nil] — REQUIRED key; catalog product ID (uuid).
      #     The value may be +nil+ for an ad-hoc item, but the key must be present.
      #   - +productName+ [String] — REQUIRED; display name
      #   - +unitPrice+ [Numeric] — REQUIRED; price per unit
      #   - +billingFrequency+ [String] — REQUIRED; one of BillingFrequency::ALL
      #   - +quantity+ [Integer] — default 1
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

      # Add bundle line items to a quote. The server expands the bundle's children
      # itself -- do NOT send child products.
      #
      # @param quote_id [String]
      # @param items [Hash, Array<Hash>] single item or array of items (1-50). Each item includes:
      #   - +bundleId+ [String] — REQUIRED; catalog bundle ID
      #   - +bundleName+ [String] — REQUIRED; display name
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
      # CUSTOM LINE ITEM IMAGES
      # Up to three per custom item (a line with no catalog product), PNG or JPEG,
      # 2MB each. Changes are allowed on draft quotes only.
      # ============================================

      # Every custom line item's images (up to three, in order), keyed by line item id.
      #
      # @param quote_id [String]
      # @return [Hash] line_item_id => Array<Hash>
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_quote_line_item_images(quote_id)
        client = get_client
        client.get("/v1/quotes/#{quote_id}/items/images")["results"]
      end

      # One custom line item's images, in order.
      #
      # @param quote_id [String]
      # @param item_id [String]
      # @return [Array<Hash>]
      # @raise [NotFoundError] if the quote or line item does not exist
      # @raise [NetworkError] on connection failure
      def get_line_item_images(quote_id, item_id)
        client = get_client
        client.get("/v1/quotes/#{quote_id}/items/#{item_id}/images")["results"]
      end

      # Add images to a custom line item. Returns all of its images.
      #
      # @param quote_id [String]
      # @param item_id [String]
      # @param images [Array<String, IO>] file paths or IO objects (PNG or JPEG)
      # @return [Array<Hash>]
      # @raise [ValidationError] on a wrong type, a too-large image, more than three, or a sent quote
      # @raise [NetworkError] on connection failure
      def add_line_item_images(quote_id, item_id, images)
        client = get_client
        response = client.post_form_data(
          "/v1/quotes/#{quote_id}/items/#{item_id}/images", { "images" => image_parts(images) }
        )
        response["results"]
      end

      # Set the order of a custom line item's images, first to last.
      #
      # @param quote_id [String]
      # @param item_id [String]
      # @param image_ids [Array<String>]
      # @return [Array<Hash>] the images in their new order
      # @raise [ValidationError] on invalid ids or a sent quote
      # @raise [NetworkError] on connection failure
      def reorder_line_item_images(quote_id, item_id, image_ids)
        client = get_client
        client.put("/v1/quotes/#{quote_id}/items/#{item_id}/images/order", { "imageIds" => image_ids })["results"]
      end

      # Remove one image from a custom line item. Returns the images left.
      #
      # @param quote_id [String]
      # @param item_id [String]
      # @param image_id [String]
      # @return [Array<Hash>]
      # @raise [NotFoundError] if the image does not exist
      # @raise [NetworkError] on connection failure
      def remove_line_item_image(quote_id, item_id, image_id)
        client = get_client
        client.delete("/v1/quotes/#{quote_id}/items/#{item_id}/images/#{image_id}")["results"]
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
      # @param rows [Array<Hash>] product rows, same field shapes as +create_product+.
      #   Each row requires +name+, +categoryId+ (a TurboQuote type uuid — there is no
      #   +categoryName+ shorthand; resolve or create the category first), +listPrice+
      #   and +billingFrequency+.
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
      def duplicate_product(id, name: nil)
        post_duplicate("/v1/products/#{id}/duplicate", name)
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

      # The images each product shows on a quote: up to three, in display order.
      #
      # @param product_ids [Array<String>] 1-100 product ids
      # @return [Hash] product_id => Array<Hash> (empty when none)
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_product_quote_images(product_ids)
        client = get_client
        response = client.post("/v1/products/quote-images", { "productIds" => product_ids })
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
      def duplicate_price_book(id, name: nil)
        post_duplicate("/v1/pricebooks/#{id}/duplicate", name)
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
      def duplicate_bundle(id, name: nil)
        post_duplicate("/v1/bundles/#{id}/duplicate", name)
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

      # Delete a company and its contacts. Refused while it has open quotes (draft or
      # sent) -- see +get_company_open_quotes+.
      #
      # @param id [String]
      # @return [Hash] { "message" => "..." }
      # @raise [ConflictError] with code CompanyHasOpenQuotes
      # @raise [NotFoundError] if the company does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def delete_company(id)
        client = get_client
        client.delete("/v1/companies/#{id}")
      end

      # The open quotes (draft or sent) for a company: what blocks deleting it.
      #
      # @param company_id [String]
      # @return [Hash] { "results" => [{ "id", "quoteNumber", "name", "status", "updatedOn" }], "totalRecords" => N }
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_company_open_quotes(company_id)
        client = get_client
        client.get("/v1/companies/#{company_id}/open-quotes")
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

      # Delete a contact. Refused when they are the company's only contact, or the contact on
      # open quotes -- see +get_contact_open_quotes+.
      #
      # @param id [String]
      # @return [Hash] { "message" => "..." }
      # @raise [ConflictError] with code LastContact or ContactHasOpenQuotes
      # @raise [NotFoundError] if the contact does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def delete_contact(id)
        client = get_client
        client.delete("/v1/contacts/#{id}")
      end

      # The open quotes (draft or sent) made out to a contact: what blocks deleting them.
      #
      # @param contact_id [String]
      # @return [Hash] { "results" => [...], "totalRecords" => N }
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_contact_open_quotes(contact_id)
        client = get_client
        client.get("/v1/contacts/#{contact_id}/open-quotes")
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

      # The number the next new quote will get. Read only -- the counter doesn't move, so a quote
      # created by someone else in between takes it first.
      #
      # @return [Hash] { "nextNumber" => String, "sequence" => Integer, "canEdit" => Boolean }
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_next_quote_number
        client = get_client
        client.get("/v1/quotes/number-config/next")["results"]
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

      # POST to a duplicate endpoint: the copy's name when given, else no body (the API names
      # the copy "Copy of ...").
      def post_duplicate(path, name)
        client = get_client
        unwrap(name.nil? ? client.post(path) : client.post(path, { "name" => name }))
      end

      # Build form data hash for product creation/update with images.
      def build_product_form_data(data_fields, images)
        form_data = {}
        form_data["data"] = JSON.generate(data_fields)

        file_parts = image_parts(images, io_filename: "image.bin")
        form_data["images"] = file_parts unless file_parts.empty?
        form_data
      end

      # One multipart part per image: a path keeps its basename, an IO is named
      # +io_filename+ (default image.<detected ext>). The type comes from the bytes.
      def image_parts(images, io_filename: nil)
        images.filter_map do |image|
          if image.is_a?(String)
            content = File.binread(image)
            { io: StringIO.new(content), filename: File.basename(image), content_type: detect_image_type(content) }
          elsif image.respond_to?(:read)
            content = image.read
            type = detect_image_type(content)
            ext = { "image/png" => "png", "image/jpeg" => "jpg" }.fetch(type, "bin")
            { io: StringIO.new(content), filename: io_filename || "image.#{ext}", content_type: type }
          end
        end
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
