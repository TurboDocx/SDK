# frozen_string_literal: true

require_relative "turbodocx/version"
require_relative "turbodocx/errors"
require_relative "turbodocx/http_client"
require_relative "turbodocx/turbo_sign"
require_relative "turbodocx/client"

module TurboDocx
  class << self
    attr_accessor :api_key, :base_url

    def configure
      yield self
    end
  end
end
