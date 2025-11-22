# frozen_string_literal: true

require "faraday"
require "faraday/multipart"
require "json"

module TurboDocx
  class HttpClient
    DEFAULT_BASE_URL = "https://api.turbodocx.com"

    def initialize(api_key:, access_token: nil, base_url: nil)
      @api_key = api_key
      @access_token = access_token
      @base_url = (base_url || DEFAULT_BASE_URL).chomp("/")
    end

    def get(path)
      response = connection.get(path)
      handle_response(response)
    end

    def get_raw(path)
      response = connection.get(path)
      handle_raw_response(response)
    end

    def post(path, body)
      response = connection.post(path) do |req|
        req.headers["Content-Type"] = "application/json"
        req.body = body.to_json
      end
      handle_response(response)
    end

    def upload_file(path, file, file_name, form_data)
      response = multipart_connection.post(path) do |req|
        req.body = form_data.merge(
          file: Faraday::Multipart::FilePart.new(
            StringIO.new(file),
            "application/octet-stream",
            file_name
          )
        )
      end
      handle_response(response)
    end

    private

    def connection
      @connection ||= Faraday.new(url: @base_url) do |f|
        f.request :json
        f.response :json
        f.adapter Faraday.default_adapter
        f.headers.merge!(auth_headers)
      end
    end

    def multipart_connection
      @multipart_connection ||= Faraday.new(url: @base_url) do |f|
        f.request :multipart
        f.response :json
        f.adapter Faraday.default_adapter
        f.headers.merge!(auth_headers)
      end
    end

    def auth_headers
      headers = {}
      headers["X-API-Key"] = @api_key if @api_key
      headers["Authorization"] = "Bearer #{@access_token}" if @access_token
      headers
    end

    def handle_response(response)
      return response.body if response.success?

      handle_error(response)
    end

    def handle_raw_response(response)
      return response.body if response.success?

      handle_error(response)
    end

    def handle_error(response)
      body = response.body || {}
      message = body["message"] || "API Error"
      code = body["code"]

      raise Error.new(message, status_code: response.status, code: code)
    end
  end
end
