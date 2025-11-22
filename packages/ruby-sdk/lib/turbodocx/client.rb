# frozen_string_literal: true

module TurboDocx
  # Main client for TurboDocx API
  class Client
    attr_reader :turbo_sign

    def initialize(api_key: nil, access_token: nil, base_url: nil)
      api_key ||= TurboDocx.api_key
      access_token ||= ENV["TURBODOCX_ACCESS_TOKEN"]
      base_url ||= TurboDocx.base_url

      if (api_key.nil? || api_key.empty?) && (access_token.nil? || access_token.empty?)
        raise ArgumentError, "API key or access token is required"
      end

      http_client = HttpClient.new(
        api_key: api_key,
        access_token: access_token,
        base_url: base_url
      )

      @turbo_sign = TurboSign.new(http_client)
    end
  end
end
