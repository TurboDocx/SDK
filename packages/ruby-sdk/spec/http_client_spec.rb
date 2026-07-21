# frozen_string_literal: true

require "spec_helper"

RSpec.describe TurboDocxSdk::HttpClient do
  # Clear all TURBODOCX env vars for every test to prevent leakage
  # from the developer's environment.
  around do |example|
    original_api_key = ENV["TURBODOCX_API_KEY"]
    original_base_url = ENV["TURBODOCX_BASE_URL"]
    original_org_id = ENV["TURBODOCX_ORG_ID"]
    original_sender_email = ENV["TURBODOCX_SENDER_EMAIL"]
    original_sender_name = ENV["TURBODOCX_SENDER_NAME"]
    ENV["TURBODOCX_API_KEY"] = nil
    ENV["TURBODOCX_BASE_URL"] = nil
    ENV["TURBODOCX_ORG_ID"] = nil
    ENV["TURBODOCX_SENDER_EMAIL"] = nil
    ENV["TURBODOCX_SENDER_NAME"] = nil
    begin
      example.run
    ensure
      ENV["TURBODOCX_API_KEY"] = original_api_key
      ENV["TURBODOCX_BASE_URL"] = original_base_url
      ENV["TURBODOCX_ORG_ID"] = original_org_id
      ENV["TURBODOCX_SENDER_EMAIL"] = original_sender_email
      ENV["TURBODOCX_SENDER_NAME"] = original_sender_name
    end
  end

  # ============================================
  # CONSTRUCTOR VALIDATION
  # ============================================

  describe "#initialize" do
    it "raises AuthenticationError when no API key or access token is provided" do
      expect {
        described_class.new(skip_sender_validation: true)
      }.to raise_error(TurboDocxSdk::AuthenticationError, /API key or access token is required/)
    end

    it "accepts an API key" do
      client = described_class.new(api_key: "test-key", skip_sender_validation: true)
      expect(client).to be_a(described_class)
    end

    it "accepts an access token instead of API key" do
      client = described_class.new(access_token: "oauth-token", skip_sender_validation: true)
      expect(client).to be_a(described_class)
    end

    it "raises ValidationError when senderEmail is missing and skip_sender_validation is false" do
      expect {
        described_class.new(api_key: "test-key")
      }.to raise_error(TurboDocxSdk::ValidationError, /senderEmail is required/)
    end

    it "does not raise when senderEmail is missing and skip_sender_validation is true" do
      expect {
        described_class.new(api_key: "test-key", skip_sender_validation: true)
      }.not_to raise_error
    end

    it "does not raise when senderEmail is provided" do
      expect {
        described_class.new(api_key: "test-key", sender_email: "user@example.com")
      }.not_to raise_error
    end
  end

  # ============================================
  # ENV VAR FALLBACK
  # ============================================

  describe "env var fallback" do
    it "falls back to TURBODOCX_API_KEY env var" do
      ENV["TURBODOCX_API_KEY"] = "env-api-key"
      client = described_class.new(skip_sender_validation: true)
      expect(client).to be_a(described_class)
    end

    it "falls back to TURBODOCX_SENDER_EMAIL env var" do
      ENV["TURBODOCX_SENDER_EMAIL"] = "env-sender@example.com"
      client = described_class.new(api_key: "test-key")
      expect(client).to be_a(described_class)
    end

    it "raises AuthenticationError when no API key in args or env" do
      ENV["TURBODOCX_API_KEY"] = nil
      expect {
        described_class.new(skip_sender_validation: true)
      }.to raise_error(TurboDocxSdk::AuthenticationError)
    end

    it "raises ValidationError when no sender_email in args or env" do
      ENV["TURBODOCX_SENDER_EMAIL"] = nil
      expect {
        described_class.new(api_key: "test-key")
      }.to raise_error(TurboDocxSdk::ValidationError)
    end
  end

  # ============================================
  # SENDER CONFIG
  # ============================================

  describe "#sender_config" do
    it "returns sender email and name" do
      client = described_class.new(
        api_key: "test-key",
        sender_email: "sender@example.com",
        sender_name: "Test Sender"
      )
      config = client.sender_config
      expect(config).to eq({
        "senderEmail" => "sender@example.com",
        "senderName" => "Test Sender"
      })
    end

    it "returns nil sender name when not provided" do
      client = described_class.new(
        api_key: "test-key",
        sender_email: "sender@example.com"
      )
      config = client.sender_config
      expect(config["senderEmail"]).to eq("sender@example.com")
      expect(config["senderName"]).to be_nil
    end
  end

  # ============================================
  # DEFAULT BASE URL
  # ============================================

  describe "default base URL" do
    it "uses default base URL when not provided" do
      client = described_class.new(api_key: "test-key", skip_sender_validation: true)
      expect(client).to be_a(described_class)
      # The default base URL is https://api.turbodocx.com (verified via constant)
      expect(TurboDocxSdk::HttpClient::DEFAULT_BASE_URL).to eq("https://api.turbodocx.com")
    end
  end

  # ============================================
  # EXCEPTION CAUSE CHAINING (R3)
  # ============================================

  describe "exception cause chaining" do
    it "preserves SocketError as .cause when raising NetworkError" do
      client = described_class.new(api_key: "test-key", skip_sender_validation: true)
      original_error = SocketError.new("getaddrinfo: Name or service not known")

      allow(client).to receive(:http_request).and_raise(original_error)

      begin
        client.get("/test")
        raise "Expected NetworkError to be raised"
      rescue TurboDocxSdk::NetworkError => e
        expect(e).to be_a(TurboDocxSdk::NetworkError)
        expect(e.message).to include("Network request failed")
        expect(e.cause).to be_a(SocketError)
        expect(e.cause.message).to eq("getaddrinfo: Name or service not known")
      end
    end

    it "preserves Errno::ECONNREFUSED as .cause when raising NetworkError" do
      client = described_class.new(api_key: "test-key", skip_sender_validation: true)
      original_error = Errno::ECONNREFUSED.new("Connection refused")

      allow(client).to receive(:http_request).and_raise(original_error)

      begin
        client.get("/test")
        raise "Expected NetworkError to be raised"
      rescue TurboDocxSdk::NetworkError => e
        expect(e.cause).to be_a(Errno::ECONNREFUSED)
      end
    end

    it "preserves cause in form data requests" do
      client = described_class.new(api_key: "test-key", skip_sender_validation: true)
      original_error = SocketError.new("network down")

      # Stub build_url to return a valid URI, then let request_form_data's http_request fail
      allow(client).to receive(:http_request).and_raise(original_error)

      begin
        client.post_form_data("/test", { "key" => "value" })
        raise "Expected NetworkError to be raised"
      rescue TurboDocxSdk::NetworkError => e
        expect(e.cause).to be_a(SocketError)
      end
    end
  end

  # The API reports failures in several envelopes. Reading only the top-level message/error
  # loses the actionable reason ("senderEmail must be a valid email address") and the specific
  # code (QUOTE_NOT_FOUND) — and for the nested `error: {...}` shape used across TurboQuote,
  # would surface the inspected Hash instead of the message.
  describe "error detail and code extraction" do
    let(:client) { described_class.new(api_key: "test-key", skip_sender_validation: true) }

    def error_response(status, body)
      double(code: status.to_s, message: "Error", body: JSON.generate(body))
    end

    def raised_by(status, body)
      client.send(:handle_error_response, error_response(status, body))
      raise "expected an error to be raised"
    rescue TurboDocxSdk::TurboDocxError => e
      e
    end

    it "surfaces the per-field reason instead of the generic envelope message" do
      error = raised_by(400, {
                          "message" => "There was an issue validating the body",
                          "type" => "ValidationError",
                          "data" => { "errors" => [{ "message" => "senderEmail must be a valid email address" }] }
                        })

      expect(error).to be_a(TurboDocxSdk::ValidationError)
      expect(error.message).to include("senderEmail must be a valid email address")
    end

    it "joins multiple field errors so every failure is reported" do
      error = raised_by(400, {
                          "message" => "There was an issue validating the body",
                          "data" => { "errors" => [{ "message" => "a is bad" }, { "message" => "b is required" }] }
                        })

      expect(error.message).to include("a is bad")
      expect(error.message).to include("b is required")
    end

    it "falls back to the top-level message when there are no field errors" do
      error = raised_by(400, {
                          "message" => "A sender email is required for API-key requests.",
                          "error" => "SenderEmailRequired"
                        })

      expect(error.message).to eq("A sender email is required for API-key requests.")
      # `error` alongside a `message` is the CODE, not the message.
      expect(error.code).to eq("SenderEmailRequired")
    end

    it "ignores an empty errors array rather than blanking the message" do
      error = raised_by(400, { "message" => "There was an issue validating the body", "data" => { "errors" => [] } })

      expect(error.message).to eq("There was an issue validating the body")
    end

    it "reads message and code out of a nested error object" do
      error = raised_by(404, { "error" => { "message" => "Quote not found", "code" => "QUOTE_NOT_FOUND" } })

      expect(error).to be_a(TurboDocxSdk::NotFoundError)
      expect(error.message).to eq("Quote not found")
      expect(error.code).to eq("QUOTE_NOT_FOUND")
    end

    it "surfaces per-row reasons from a top-level errors array (bulk validation)" do
      error = raised_by(400, {
                          "message" => "Bulk validation failed",
                          "type" => "BulkValidationFailed",
                          "errors" => [{ "message" => "Row 1 invalid" }, { "message" => "Row 3 required" }]
                        })

      expect(error.message).to include("Row 1 invalid")
      expect(error.message).to include("Row 3 required")
    end

    it "reads the code from a top-level type" do
      error = raised_by(400, { "message" => "Recipient name is required", "type" => "RecipientNameRequired" })

      expect(error.code).to eq("RecipientNameRequired")
    end

    it "treats a lone error string as the message, not the code" do
      # SingleStepRoutes sends {error: <message>, code: <type>}.
      error = raised_by(400, { "error" => "Document could not be prepared", "code" => "TemplateProcessingFailed" })

      expect(error.message).to eq("Document could not be prepared")
      expect(error.code).to eq("TemplateProcessingFailed")
    end

    it "keeps the class default code when the API sends none" do
      error = raised_by(404, { "message" => "Resource missing" })

      expect(error.code).to eq("NOT_FOUND")
    end

    it "lets an API-supplied code win over the class default" do
      # The default must never mask a real code the backend sent.
      error = raised_by(404, { "message" => "Quote missing", "code" => "QUOTE_NOT_FOUND" })

      expect(error.code).to eq("QUOTE_NOT_FOUND")
    end

    it "gives every error subclass a default code" do
      # Parity guard: all six SDKs populate `code` for every typed error.
      expect(TurboDocxSdk::AuthenticationError.new("x").code).to eq("AUTHENTICATION_ERROR")
      expect(TurboDocxSdk::AuthorizationError.new("x").code).to eq("AUTHORIZATION_ERROR")
      expect(TurboDocxSdk::ValidationError.new("x").code).to eq("VALIDATION_ERROR")
      expect(TurboDocxSdk::NotFoundError.new("x").code).to eq("NOT_FOUND")
      expect(TurboDocxSdk::ConflictError.new("x").code).to eq("CONFLICT")
      expect(TurboDocxSdk::RateLimitError.new("x").code).to eq("RATE_LIMIT_EXCEEDED")
      expect(TurboDocxSdk::NetworkError.new("x").code).to eq("NETWORK_ERROR")
    end
  end
end
