# frozen_string_literal: true

module TurboDocxSdk
  # Base error class for all TurboDocx SDK errors.
  class TurboDocxError < StandardError
    attr_reader :status_code, :code

    def initialize(message = "TurboDocx API error", status_code: nil, code: nil)
      @status_code = status_code
      @code = code
      super(message)
    end
  end

  # Raised when authentication fails (HTTP 401).
  class AuthenticationError < TurboDocxError
    def initialize(message = "Authentication failed")
      super(message, status_code: 401, code: "AUTHENTICATION_ERROR")
    end
  end

  # Raised when request validation fails (HTTP 400).
  class ValidationError < TurboDocxError
    def initialize(message)
      super(message, status_code: 400, code: "VALIDATION_ERROR")
    end
  end

  # Raised when the requested resource is not found (HTTP 404).
  class NotFoundError < TurboDocxError
    def initialize(message = "Resource not found")
      super(message, status_code: 404, code: "NOT_FOUND")
    end
  end

  # Raised when rate limit is exceeded (HTTP 429).
  class RateLimitError < TurboDocxError
    def initialize(message = "Rate limit exceeded")
      super(message, status_code: 429, code: "RATE_LIMIT_EXCEEDED")
    end
  end

  # Raised on network/connection failures (no HTTP status).
  class NetworkError < TurboDocxError
    def initialize(message)
      super(message, status_code: nil, code: "NETWORK_ERROR")
    end
  end
end
