# frozen_string_literal: true

require "spec_helper"
require "turbodocx_sdk"

# Client-context header tests (parity with JS tests/http-client-context.test.ts).
#
# The audit trail records device/location from request headers. The SDK must
# send a descriptive User-Agent starting with "@turbodocx/sdk/", a timezone, a
# language, an optional client IP (X-Forwarded-For -> geolocation), and a device
# fingerprint.
RSpec.describe TurboDocxSdk::ClientContext do
  describe ".resolve_headers" do
    it "sends a descriptive TurboDocx SDK User-Agent by default" do
      ua = described_class.resolve_headers(nil)["User-Agent"]
      expect(ua).to start_with("@turbodocx/sdk/")
    end

    it "lets the caller override the User-Agent" do
      ctx = described_class.new(user_agent: "my-app/9.9 (worker)")
      expect(described_class.resolve_headers(ctx)["User-Agent"]).to eq("my-app/9.9 (worker)")
    end

    it "sends an Accept-Language from the host locale by default" do
      original = { all: ENV["LC_ALL"], msg: ENV["LC_MESSAGES"], lang: ENV["LANG"] }
      ENV["LC_ALL"] = nil
      ENV["LC_MESSAGES"] = nil
      ENV["LANG"] = "en_US.UTF-8"
      begin
        expect(described_class.resolve_headers(nil)["Accept-Language"]).to eq("en-US")
      ensure
        ENV["LC_ALL"] = original[:all]
        ENV["LC_MESSAGES"] = original[:msg]
        ENV["LANG"] = original[:lang]
      end
    end

    it "lets the caller override the language" do
      ctx = described_class.new(language: "fr-FR")
      expect(described_class.resolve_headers(ctx)["Accept-Language"]).to eq("fr-FR")
    end

    it "lets the caller override the timezone" do
      ctx = described_class.new(timezone: "America/New_York")
      expect(described_class.resolve_headers(ctx)["X-Timezone"]).to eq("America/New_York")
    end

    it "does NOT send X-Forwarded-For by default" do
      expect(described_class.resolve_headers(nil)).not_to have_key("X-Forwarded-For")
    end

    it "sends X-Forwarded-For when the caller supplies a client IP" do
      ctx = described_class.new(ip_address: "203.0.113.7")
      expect(described_class.resolve_headers(ctx)["X-Forwarded-For"]).to eq("203.0.113.7")
    end

    it "sends a non-empty X-Device-Fingerprint by default and honors overrides" do
      expect(described_class.resolve_headers(nil)["X-Device-Fingerprint"]).not_to be_empty
      ctx = described_class.new(device_fingerprint: "fp-abc")
      expect(described_class.resolve_headers(ctx)["X-Device-Fingerprint"]).to eq("fp-abc")
    end
  end

  describe "HttpClient wiring" do
    it "applies context headers (User-Agent, X-Forwarded-For) onto requests" do
      client = TurboDocxSdk::HttpClient.new(
        api_key: "TDX-test-key",
        org_id: "org-test",
        sender_email: "support@example.com",
        client_context: described_class.new(ip_address: "203.0.113.7")
      )
      request = Net::HTTP::Get.new(URI.parse("http://localhost/api/test"))
      client.send(:apply_headers, request)

      expect(request["User-Agent"]).to start_with("@turbodocx/sdk/")
      expect(request["X-Forwarded-For"]).to eq("203.0.113.7")
      # SDK protocol headers still win.
      expect(request["Content-Type"]).to eq("application/json")
      expect(request["Authorization"]).to eq("Bearer TDX-test-key")
      expect(request["x-rapiddocx-org-id"]).to eq("org-test")
    end
  end
end
