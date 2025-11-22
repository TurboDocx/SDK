# frozen_string_literal: true

module TurboDocx
  class Error < StandardError
    attr_reader :status_code, :code

    def initialize(message, status_code: nil, code: nil)
      @status_code = status_code
      @code = code
      super(message)
    end
  end

  class AuthenticationError < Error; end
  class ValidationError < Error; end
  class NotFoundError < Error; end
end
