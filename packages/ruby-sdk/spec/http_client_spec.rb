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
end
