# frozen_string_literal: true

require "net/http"
require "uri"
require "json"
require "securerandom"
require "stringio"
require_relative "errors"
require_relative "response_normalizer"

module TurboDocxSdk
  # Low-level HTTP client for the TurboDocx API.
  #
  # Handles authentication, error mapping, response unwrapping, and
  # the response normalizer pipeline.
  class HttpClient
    DEFAULT_BASE_URL = "https://api.turbodocx.com"

    # @param api_key [String, nil]
    # @param access_token [String, nil]
    # @param base_url [String, nil]
    # @param org_id [String, nil]
    # @param sender_email [String, nil]
    # @param sender_name [String, nil]
    # @param skip_sender_validation [Boolean]
    # @raise [AuthenticationError] if no API key or access token is provided
    # @raise [ValidationError] if senderEmail is missing and validation is not skipped
    def initialize(
      api_key: nil,
      access_token: nil,
      base_url: nil,
      org_id: nil,
      sender_email: nil,
      sender_name: nil,
      skip_sender_validation: false
    )
      @api_key = api_key || ENV["TURBODOCX_API_KEY"]
      @access_token = access_token
      @base_url = base_url || ENV["TURBODOCX_BASE_URL"] || DEFAULT_BASE_URL
      @org_id = org_id || ENV["TURBODOCX_ORG_ID"]
      @sender_email = sender_email || ENV["TURBODOCX_SENDER_EMAIL"]
      @sender_name = sender_name || ENV["TURBODOCX_SENDER_NAME"]

      unless @api_key || @access_token
        raise AuthenticationError, "API key or access token is required"
      end

      unless @sender_email || skip_sender_validation
        raise ValidationError,
              'senderEmail is required. This email will be used as the reply-to address for signature requests. ' \
              'Without it, emails will default to "API Service User via TurboSign".'
      end
    end

    # @return [Hash] sender email and name configuration
    def sender_config
      { "senderEmail" => @sender_email, "senderName" => @sender_name }
    end

    # GET request.
    # @param path [String]
    # @param params [Hash, nil] query params (values may be String or Array<String>)
    # @return [Object] parsed, unwrapped, normalized response
    # @raise [AuthenticationError] on 401 response
    # @raise [NotFoundError] on 404 response
    # @raise [RateLimitError] on 429 response
    # @raise [ValidationError] on 400 response
    # @raise [NetworkError] on connection failure
    def get(path, params = nil)
      url = build_url(path, params)
      request = Net::HTTP::Get.new(url)
      apply_headers(request)
      execute(request, url)
    end

    # POST request with JSON body.
    # @param path [String]
    # @param data [Hash, nil] request body
    # @return [Object] parsed, unwrapped, normalized response
    # @raise [ValidationError] on 400 response
    # @raise [AuthenticationError] on 401 response
    # @raise [NotFoundError] on 404 response
    # @raise [RateLimitError] on 429 response
    # @raise [NetworkError] on connection failure
    def post(path, data = nil)
      url = build_url(path)
      request = Net::HTTP::Post.new(url)
      apply_headers(request)
      if data
        request.body = JSON.generate(data)
      end
      execute(request, url)
    end

    # PATCH request with JSON body.
    # @param path [String]
    # @param data [Hash, nil] request body
    # @return [Object] parsed, unwrapped, normalized response
    # @raise [ValidationError] on 400 response
    # @raise [AuthenticationError] on 401 response
    # @raise [NotFoundError] on 404 response
    # @raise [RateLimitError] on 429 response
    # @raise [NetworkError] on connection failure
    def patch(path, data = nil)
      url = build_url(path)
      request = Net::HTTP::Patch.new(url)
      apply_headers(request)
      if data
        request.body = JSON.generate(data)
      end
      execute(request, url)
    end

    # DELETE request.
    # @param path [String]
    # @return [Object] parsed, unwrapped, normalized response
    # @raise [AuthenticationError] on 401 response
    # @raise [NotFoundError] on 404 response
    # @raise [RateLimitError] on 429 response
    # @raise [NetworkError] on connection failure
    def delete(path)
      url = build_url(path)
      request = Net::HTTP::Delete.new(url)
      apply_headers(request)
      execute(request, url)
    end

    # GET returning raw binary (for PDF downloads etc.).
    # @param path [String]
    # @param params [Hash, nil] query params
    # @return [String] raw response body bytes
    # @raise [AuthenticationError] on 401 response
    # @raise [NotFoundError] on 404 response
    # @raise [NetworkError] on connection failure
    def get_raw(path, params = nil)
      url = build_url(path, params)
      request = Net::HTTP::Get.new(url)
      apply_headers(request, content_type: false)
      execute_raw(request, url)
    end

    # POST with multipart/form-data.
    # @param path [String]
    # @param form_data [Hash] keys are field names, values are strings or
    #   Hashes with :io, :filename, :content_type for file parts.
    # @return [Object] parsed, unwrapped, normalized response
    # @raise [ValidationError] on 400 response
    # @raise [AuthenticationError] on 401 response
    # @raise [NetworkError] on connection failure
    def post_form_data(path, form_data)
      request_form_data("POST", path, form_data)
    end

    # PATCH with multipart/form-data.
    # @param path [String]
    # @param form_data [Hash] keys are field names, values are strings or
    #   Hashes with :io, :filename, :content_type for file parts.
    # @return [Object] parsed, unwrapped, normalized response
    # @raise [ValidationError] on 400 response
    # @raise [AuthenticationError] on 401 response
    # @raise [NetworkError] on connection failure
    def patch_form_data(path, form_data)
      request_form_data("PATCH", path, form_data)
    end

    # Upload a file (used by TurboSign).
    # @param api_path [String]
    # @param file [String, IO] file path or IO-like object
    # @param field_name [String] form field name for the file
    # @param additional_data [Hash, nil] extra form fields
    # @return [Object] parsed, unwrapped, normalized response
    # @raise [ValidationError] if the file input type is unsupported or on 400 response
    # @raise [AuthenticationError] on 401 response
    # @raise [NetworkError] on connection failure
    def upload_file(api_path, file, field_name: "file", additional_data: nil)
      parts = {}

      if file.is_a?(String)
        # file path
        content = File.binread(file)
        filename = File.basename(file)
        mime = detect_file_type(content)
        parts[field_name] = { io: StringIO.new(content), filename: filename, content_type: mime }
      elsif file.respond_to?(:read)
        content = file.read
        mime = detect_file_type(content)
        filename = additional_data&.dig("fileName") || "document.bin"
        parts[field_name] = { io: StringIO.new(content), filename: filename, content_type: mime }
      else
        raise ValidationError, "Unsupported file input type: #{file.class}"
      end

      if additional_data
        additional_data.each do |key, value|
          next if key == "fileName"
          parts[key.to_s] = value.is_a?(Hash) || value.is_a?(Array) ? JSON.generate(value) : value.to_s
        end
      end

      post_form_data(api_path, parts)
    end

    private

    def build_url(path, params = nil)
      url_str = "#{@base_url}#{path}"
      if params && !params.empty?
        query_parts = []
        params.each do |key, value|
          if value.is_a?(Array)
            value.each { |v| query_parts << "#{URI.encode_www_form_component(key)}=#{URI.encode_www_form_component(v)}" }
          else
            query_parts << "#{URI.encode_www_form_component(key)}=#{URI.encode_www_form_component(value)}"
          end
        end
        url_str += "?#{query_parts.join("&")}"
      end
      URI.parse(url_str)
    end

    def apply_headers(request, content_type: true)
      request["Content-Type"] = "application/json" if content_type
      if @access_token
        request["Authorization"] = "Bearer #{@access_token}"
      elsif @api_key
        request["Authorization"] = "Bearer #{@api_key}"
      end
      request["x-rapiddocx-org-id"] = @org_id if @org_id
    end

    def execute(request, url)
      response = http_request(request, url)
      handle_error_response(response) unless response.is_a?(Net::HTTPSuccess)

      content_type = response["content-type"]
      if content_type && content_type.include?("application/json")
        json_data = JSON.parse(response.body)
        ResponseNormalizer.normalize(smart_unwrap(json_data))
      else
        response.body
      end
    rescue TurboDocxError
      raise
    rescue StandardError => e
      raise NetworkError, "Network request failed: #{e.message}"
    end

    def execute_raw(request, url)
      response = http_request(request, url)
      handle_error_response(response) unless response.is_a?(Net::HTTPSuccess)
      response.body
    rescue TurboDocxError
      raise
    rescue StandardError => e
      raise NetworkError, "Network request failed: #{e.message}"
    end

    def http_request(request, url)
      http = Net::HTTP.new(url.host, url.port)
      http.use_ssl = url.scheme == "https"
      http.request(request)
    end

    def request_form_data(method, path, form_data)
      url = build_url(path)
      boundary = "----TurboDocxSdk#{SecureRandom.hex(16)}"

      body = build_multipart_body(form_data, boundary)

      klass = method == "PATCH" ? Net::HTTP::Patch : Net::HTTP::Post
      request = klass.new(url)
      request["Content-Type"] = "multipart/form-data; boundary=#{boundary}"
      if @access_token
        request["Authorization"] = "Bearer #{@access_token}"
      elsif @api_key
        request["Authorization"] = "Bearer #{@api_key}"
      end
      request["x-rapiddocx-org-id"] = @org_id if @org_id
      request.body = body

      execute_multipart(request, url)
    rescue TurboDocxError
      raise
    rescue StandardError => e
      raise NetworkError, "Form data request failed: #{e.message}"
    end

    def build_multipart_body(form_data, boundary)
      parts = []
      form_data.each do |key, value|
        if value.is_a?(Array)
          # Multiple parts under the same field name (e.g. multiple images)
          value.each { |item| append_part(parts, key, item, boundary) }
        else
          append_part(parts, key, value, boundary)
        end
      end
      parts << "--#{boundary}--\r\n"
      parts.join
    end

    def append_part(parts, key, value, boundary)
      if value.is_a?(Hash) && value.key?(:io)
        # File part
        parts << "--#{boundary}\r\n"
        parts << "Content-Disposition: form-data; name=\"#{key}\"; filename=\"#{value[:filename]}\"\r\n"
        parts << "Content-Type: #{value[:content_type]}\r\n\r\n"
        io = value[:io]
        io.rewind if io.respond_to?(:rewind)
        parts << io.read
        parts << "\r\n"
      else
        # Text part
        parts << "--#{boundary}\r\n"
        parts << "Content-Disposition: form-data; name=\"#{key}\"\r\n\r\n"
        parts << value.to_s
        parts << "\r\n"
      end
    end

    def execute_multipart(request, url)
      response = http_request(request, url)
      handle_error_response(response) unless response.is_a?(Net::HTTPSuccess)
      json_data = JSON.parse(response.body)
      ResponseNormalizer.normalize(smart_unwrap(json_data))
    end

    # Smart unwrap: if response has ONLY a "data" key, extract its value.
    def smart_unwrap(data)
      if data.is_a?(Hash)
        keys = data.keys
        if keys.length == 1 && keys[0] == "data"
          return data["data"]
        end
      end
      data
    end

    def handle_error_response(response)
      message = "HTTP #{response.code}: #{response.message}"
      begin
        error_data = JSON.parse(response.body)
        message = error_data["message"] || error_data["error"] || message
      rescue StandardError
        # If response is not JSON, use status text
      end

      code = response.code.to_i
      case code
      when 400 then raise ValidationError, message
      when 401 then raise AuthenticationError, message
      when 404 then raise NotFoundError, message
      when 429 then raise RateLimitError, message
      else raise TurboDocxError.new(message, status_code: code)
      end
    end

    def detect_file_type(content)
      bytes = content.bytes
      # PDF: %PDF
      if bytes[0] == 0x25 && bytes[1] == 0x50 && bytes[2] == 0x44 && bytes[3] == 0x46
        return "application/pdf"
      end
      # ZIP-based (DOCX, PPTX): PK
      if bytes[0] == 0x50 && bytes[1] == 0x4B
        snippet = content[0, [content.length, 2000].min]
        if snippet.include?("ppt/")
          return "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        end
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      end
      "application/octet-stream"
    end
  end
end
