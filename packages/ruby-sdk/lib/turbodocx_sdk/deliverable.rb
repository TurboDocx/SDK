# frozen_string_literal: true

require "json"
require_relative "http_client"

module TurboDocxSdk
  # Deliverable module -- document generation and management operations.
  #
  # Provides operations for generating documents from templates, managing
  # deliverables, and downloading files.
  #
  # All methods are class-level (static pattern). Call +configure+ once,
  # then invoke any method directly on the class.
  #
  #   TurboDocxSdk::Deliverable.configure(api_key: "...", org_id: "...")
  #   result = TurboDocxSdk::Deliverable.generate_deliverable(...)
  #
  class Deliverable
    class << self
      # Configure the Deliverable module with API credentials.
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
      # DELIVERABLE CRUD
      # ============================================

      # List deliverables with pagination, search, and filtering.
      #
      # @param options [Hash, nil] :limit, :offset, :query, :show_tags
      # @return [Hash] { "results" => [...], "totalRecords" => N }
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_deliverables(options = nil)
        client = get_client
        params = {}

        if options
          limit = fetch_option(options, :limit, "limit")
          offset = fetch_option(options, :offset, "offset")
          query = fetch_option(options, :query, "query")
          show_tags = fetch_option(options, :show_tags, :showTags, "show_tags", "showTags")

          params[:limit] = limit unless limit.nil?
          params[:offset] = offset unless offset.nil?
          params[:query] = query unless query.nil?
          params[:showTags] = show_tags unless show_tags.nil?
        end

        client.get("/v1/deliverable", params)
      end

      # Generate a new deliverable document from a template with variable substitution.
      #
      # @param request [Hash] :templateId (required), :name (required),
      #   :variables (Array, required), :description, :tags
      # @return [Hash] { "results" => { "deliverable" => {...} } }
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def generate_deliverable(request)
        client = get_client
        client.post("/v1/deliverable", request)
      end

      # Get full details of a single deliverable, including variables, fonts, and template info.
      #
      # @param id [String]
      # @param options [Hash, nil] :show_tags
      # @return [Hash] the deliverable record
      # @raise [NotFoundError] if the deliverable does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_deliverable_details(id, options = nil)
        client = get_client
        params = {}
        if options
          show_tags = fetch_option(options, :show_tags, :showTags, "show_tags", "showTags")
          params[:showTags] = show_tags unless show_tags.nil?
        end

        response = client.get("/v1/deliverable/#{id}", params)
        response["results"]
      end

      # Update a deliverable's name, description, or tags.
      #
      # Note: When providing tags, all existing tags are replaced.
      #
      # @param id [String]
      # @param request [Hash] :name, :description, :tags (all optional)
      # @return [Hash] { "message" => "...", "deliverableId" => "..." }
      # @raise [NotFoundError] if the deliverable does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_deliverable_info(id, request)
        client = get_client
        client.patch("/v1/deliverable/#{id}", request)
      end

      # Soft-delete a deliverable.
      #
      # @param id [String]
      # @return [Hash] { "message" => "...", "deliverableId" => "..." }
      # @raise [NotFoundError] if the deliverable does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def delete_deliverable(id)
        client = get_client
        client.delete("/v1/deliverable/#{id}")
      end

      # ============================================
      # FILE DOWNLOADS
      # ============================================

      # Download the original source file (DOCX or PPTX) of a deliverable.
      #
      # @param deliverable_id [String]
      # @return [String] raw file bytes
      # @raise [NotFoundError] if the deliverable does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def download_source_file(deliverable_id)
        client = get_client
        client.get_raw("/v1/deliverable/file/#{deliverable_id}")
      end

      # Download the PDF version of a deliverable.
      #
      # @param deliverable_id [String]
      # @return [String] raw PDF bytes
      # @raise [NotFoundError] if the deliverable does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def download_pdf(deliverable_id)
        client = get_client
        client.get_raw("/v1/deliverable/file/pdf/#{deliverable_id}")
      end

      private

      # Lazy-initialize an HttpClient from env vars if not configured.
      def get_client
        @client ||= HttpClient.new(skip_sender_validation: true)
      end

      # Fetch an option value, accepting any of the given keys (symbol or string).
      def fetch_option(options, *keys)
        keys.each do |key|
          return options[key] if options.key?(key)
        end
        nil
      end
    end
  end
end
