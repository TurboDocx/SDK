# frozen_string_literal: true

require "spec_helper"
require_relative "../lib/turbodocx_sdk/turbo_webhooks"
require "openssl"

RSpec.describe TurboDocxSdk::TurboWebhooks do
  let(:mock_client) { instance_double(TurboDocxSdk::HttpClient) }

  before do
    described_class.instance_variable_set(:@client, nil)
    allow(TurboDocxSdk::HttpClient).to receive(:new).and_return(mock_client)
  end

  # ============================================
  # CONFIGURATION
  # ============================================

  describe ".configure" do
    it "configures the client with skip_sender_validation hardcoded true" do
      described_class.configure(api_key: "test-api-key", org_id: "test-org-id")
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: "test-api-key",
        access_token: nil,
        org_id: "test-org-id",
        base_url: nil,
        skip_sender_validation: true
      )
    end

    it "configures with access token instead of API key" do
      described_class.configure(access_token: "oauth-token", org_id: "org-123")
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: nil,
        access_token: "oauth-token",
        org_id: "org-123",
        base_url: nil,
        skip_sender_validation: true
      )
    end

    it "configures with custom base URL" do
      described_class.configure(api_key: "k", org_id: "o", base_url: "https://custom.example.com")
      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: "k",
        access_token: nil,
        org_id: "o",
        base_url: "https://custom.example.com",
        skip_sender_validation: true
      )
    end

    it "auto-initializes from env vars when not configured" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("TURBODOCX_API_KEY").and_return("env-key")
      allow(ENV).to receive(:[]).with("TURBODOCX_ORG_ID").and_return("env-org")
      allow(mock_client).to receive(:get).and_return({})

      described_class.get_webhook

      expect(TurboDocxSdk::HttpClient).to have_received(:new).with(
        api_key: "env-key",
        access_token: nil,
        org_id: "env-org",
        base_url: nil,
        skip_sender_validation: true
      )
    end

    it "raises a descriptive error when not configured and env vars are absent" do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with("TURBODOCX_API_KEY").and_return(nil)
      allow(ENV).to receive(:[]).with("TURBODOCX_ORG_ID").and_return(nil)

      expect {
        described_class.get_webhook
      }.to raise_error(TurboDocxSdk::TurboDocxError, /must be configured before use/)
    end
  end

  # ============================================
  # createWebhook
  # ============================================

  describe ".create_webhook" do
    before { described_class.configure(api_key: "k", org_id: "o") }

    it "POSTs to /api/webhooks with the fixed signature name and unwraps data" do
      envelope = {
        "data" => { "id" => "wh-1", "secret" => "whsec_abc123" },
        "message" => "Webhook created successfully. Save the secret - it won't be shown again."
      }
      allow(mock_client).to receive(:post).and_return(envelope)

      result = described_class.create_webhook(
        urls: ["https://example.com/hook"],
        events: ["signature.document.completed", "signature.document.voided"]
      )

      expect(result).to eq("id" => "wh-1", "secret" => "whsec_abc123")
      expect(mock_client).to have_received(:post).with(
        "/api/webhooks",
        {
          "name" => "signature",
          "urls" => ["https://example.com/hook"],
          "events" => ["signature.document.completed", "signature.document.voided"]
        }
      )
    end
  end

  # ============================================
  # getWebhook
  # ============================================

  describe ".get_webhook" do
    before { described_class.configure(api_key: "k", org_id: "o") }

    it "GETs /api/webhooks/signature and returns the auto-unwrapped body" do
      body = {
        "id" => "wh-1",
        "name" => "signature",
        "urls" => ["https://example.com/hook"],
        "events" => ["signature.document.completed"],
        "isActive" => true,
        "deliveryStats" => { "totalDeliveries" => 5, "successfulDeliveries" => 4, "failedDeliveries" => 1, "pendingRetries" => 0 },
        "availableEvents" => ["signature.document.completed", "signature.document.voided"]
      }
      allow(mock_client).to receive(:get).and_return(body)

      result = described_class.get_webhook

      expect(result).to eq(body)
      expect(mock_client).to have_received(:get).with("/api/webhooks/signature")
    end
  end

  # ============================================
  # updateWebhook
  # ============================================

  describe ".update_webhook" do
    before { described_class.configure(api_key: "k", org_id: "o") }

    it "PATCHes /api/webhooks/signature with camelCase keys and unwraps data" do
      envelope = {
        "data" => { "id" => "wh-1", "name" => "signature", "isActive" => false },
        "message" => "Webhook updated successfully"
      }
      allow(mock_client).to receive(:patch).and_return(envelope)

      result = described_class.update_webhook(is_active: false)

      expect(result).to eq("id" => "wh-1", "name" => "signature", "isActive" => false)
      expect(mock_client).to have_received(:patch).with(
        "/api/webhooks/signature",
        { "isActive" => false }
      )
    end

    it "maps urls and events through unchanged and omits untouched fields" do
      envelope = { "data" => { "id" => "wh-1" }, "message" => "Webhook updated successfully" }
      allow(mock_client).to receive(:patch).and_return(envelope)

      described_class.update_webhook(
        urls: ["https://new.example.com/hook"],
        events: ["signature.document.voided"]
      )

      expect(mock_client).to have_received(:patch).with(
        "/api/webhooks/signature",
        {
          "urls" => ["https://new.example.com/hook"],
          "events" => ["signature.document.voided"]
        }
      )
    end
  end

  # ============================================
  # deleteWebhook
  # ============================================

  describe ".delete_webhook" do
    before { described_class.configure(api_key: "k", org_id: "o") }

    it "DELETEs /api/webhooks/signature and returns the message envelope whole" do
      allow(mock_client).to receive(:delete).and_return({ "message" => "Webhook deleted successfully" })

      result = described_class.delete_webhook

      expect(result).to eq("message" => "Webhook deleted successfully")
      expect(mock_client).to have_received(:delete).with("/api/webhooks/signature")
    end
  end

  # ============================================
  # testWebhook
  # ============================================

  describe ".test_webhook" do
    before { described_class.configure(api_key: "k", org_id: "o") }

    it "POSTs to /api/webhooks/signature/test with eventType + payload and unwraps data" do
      envelope = {
        "data" => {
          "deliveries" => [],
          "summary" => { "total" => 1, "successful" => 1, "failed" => 0, "errors" => [] }
        },
        "message" => "Test webhook sent successfully"
      }
      allow(mock_client).to receive(:post).and_return(envelope)

      result = described_class.test_webhook(
        event_type: "signature.document.completed",
        payload: { "documentId" => "doc-1" }
      )

      expect(result["summary"]["total"]).to eq(1)
      expect(mock_client).to have_received(:post).with(
        "/api/webhooks/signature/test",
        {
          "eventType" => "signature.document.completed",
          "payload" => { "documentId" => "doc-1" }
        }
      )
    end
  end

  # ============================================
  # notifyWebhook
  # ============================================

  describe ".notify_webhook" do
    before { described_class.configure(api_key: "k", org_id: "o") }

    it "POSTs to /api/webhooks/signature/notify with eventType + payload and unwraps data" do
      envelope = {
        "data" => {
          "deliveries" => [],
          "summary" => { "total" => 1, "successful" => 1, "failed" => 0, "errors" => [] }
        },
        "message" => "Manual notification sent successfully"
      }
      allow(mock_client).to receive(:post).and_return(envelope)

      result = described_class.notify_webhook(
        event_type: "signature.document.voided",
        payload: { "documentId" => "doc-2" }
      )

      expect(result["summary"]["successful"]).to eq(1)
      expect(mock_client).to have_received(:post).with(
        "/api/webhooks/signature/notify",
        {
          "eventType" => "signature.document.voided",
          "payload" => { "documentId" => "doc-2" }
        }
      )
    end
  end

  # ============================================
  # regenerateWebhookSecret
  # ============================================

  describe ".regenerate_webhook_secret" do
    before { described_class.configure(api_key: "k", org_id: "o") }

    it "POSTs to /api/webhooks/signature/regenerate (no body) and unwraps data" do
      envelope = {
        "data" => { "id" => "wh-1", "secret" => "whsec_new", "regeneratedAt" => "2026-01-01T00:00:00.000Z" },
        "message" => "Webhook secret regenerated successfully."
      }
      allow(mock_client).to receive(:post).and_return(envelope)

      result = described_class.regenerate_webhook_secret

      expect(result).to eq("id" => "wh-1", "secret" => "whsec_new", "regeneratedAt" => "2026-01-01T00:00:00.000Z")
      expect(mock_client).to have_received(:post).with("/api/webhooks/signature/regenerate")
    end
  end

  # ============================================
  # listWebhookDeliveries
  # ============================================

  describe ".list_webhook_deliveries" do
    before { described_class.configure(api_key: "k", org_id: "o") }

    it "GETs /api/webhooks/signature/deliveries with no params by default" do
      body = { "results" => [], "totalRecords" => 0, "limit" => 20, "offset" => 0 }
      allow(mock_client).to receive(:get).and_return(body)

      result = described_class.list_webhook_deliveries

      expect(result).to eq(body)
      expect(mock_client).to have_received(:get).with("/api/webhooks/signature/deliveries", {})
    end

    it "passes filters through as camelCase query params" do
      body = { "results" => [], "totalRecords" => 0, "limit" => 5, "offset" => 10 }
      allow(mock_client).to receive(:get).and_return(body)

      described_class.list_webhook_deliveries(
        limit: 5,
        offset: 10,
        event_type: "signature.document.completed",
        is_delivered: true,
        http_status: 200
      )

      expect(mock_client).to have_received(:get).with(
        "/api/webhooks/signature/deliveries",
        {
          "limit" => 5,
          "offset" => 10,
          "eventType" => "signature.document.completed",
          "isDelivered" => true,
          "httpStatus" => 200
        }
      )
    end
  end

  # ============================================
  # replayWebhookDelivery
  # ============================================

  describe ".replay_webhook_delivery" do
    before { described_class.configure(api_key: "k", org_id: "o") }

    it "POSTs to /api/webhooks/signature/replay with deliveryId and unwraps data" do
      envelope = {
        "data" => { "id" => "del-2", "webhookId" => "wh-1", "eventType" => "signature.document.completed", "attemptCount" => 1 },
        "message" => "Delivery replayed"
      }
      allow(mock_client).to receive(:post).and_return(envelope)

      result = described_class.replay_webhook_delivery("del-1")

      expect(result).to eq("id" => "del-2", "webhookId" => "wh-1", "eventType" => "signature.document.completed", "attemptCount" => 1)
      expect(mock_client).to have_received(:post).with(
        "/api/webhooks/signature/replay",
        { "deliveryId" => "del-1" }
      )
    end
  end

  # ============================================
  # getWebhookStats
  # ============================================

  describe ".get_webhook_stats" do
    before { described_class.configure(api_key: "k", org_id: "o") }

    it "GETs /api/webhooks/signature/stats with no params by default" do
      body = { "webhook" => { "id" => "wh-1" }, "period" => { "days" => 30 }, "summary" => {}, "eventBreakdown" => [] }
      allow(mock_client).to receive(:get).and_return(body)

      result = described_class.get_webhook_stats

      expect(result).to eq(body)
      expect(mock_client).to have_received(:get).with("/api/webhooks/signature/stats", {})
    end

    it "passes days through as a query param" do
      body = { "webhook" => { "id" => "wh-1" }, "period" => { "days" => 7 }, "summary" => {}, "eventBreakdown" => [] }
      allow(mock_client).to receive(:get).and_return(body)

      described_class.get_webhook_stats(days: 7)

      expect(mock_client).to have_received(:get).with(
        "/api/webhooks/signature/stats",
        { "days" => 7 }
      )
    end
  end

  # ============================================
  # ERROR HANDLING
  # ============================================

  describe "Error Handling" do
    before { described_class.configure(api_key: "k", org_id: "o") }

    it "propagates conflict errors from create (duplicate signature webhook)" do
      allow(mock_client).to receive(:post).and_raise(TurboDocxSdk::ConflictError, "Webhook already exists")
      expect {
        described_class.create_webhook(urls: ["https://e.com/h"], events: ["signature.document.completed"])
      }.to raise_error(TurboDocxSdk::ConflictError, "Webhook already exists")
    end

    it "propagates not found errors from get" do
      allow(mock_client).to receive(:get).and_raise(TurboDocxSdk::NotFoundError, "Webhook not found")
      expect { described_class.get_webhook }.to raise_error(TurboDocxSdk::NotFoundError, "Webhook not found")
    end

    it "propagates validation errors from update (non-HTTPS url)" do
      allow(mock_client).to receive(:patch).and_raise(TurboDocxSdk::ValidationError, "All webhook URLs must use HTTPS")
      expect {
        described_class.update_webhook(urls: ["http://insecure.example.com/h"])
      }.to raise_error(TurboDocxSdk::ValidationError, "All webhook URLs must use HTTPS")
    end
  end
end

# ============================================
# verify_webhook_signature (free module function)
# ============================================

RSpec.describe "TurboDocxSdk.verify_webhook_signature" do
  let(:secret) { "whsec_test_secret" }
  let(:payload) { '{"event":"signature.document.completed","data":{"documentId":"doc-1"}}' }

  def sign(body, timestamp, key)
    digest = OpenSSL::HMAC.hexdigest("SHA256", key, "#{timestamp}.#{body}")
    "sha256=#{digest}"
  end

  it "returns true for a valid signature within tolerance" do
    ts = Time.now.to_i.to_s
    sig = sign(payload, ts, secret)

    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: payload,
        signature_header: sig,
        timestamp_header: ts,
        secret: secret
      )
    ).to be(true)
  end

  it "returns false when the body is tampered" do
    ts = Time.now.to_i.to_s
    sig = sign(payload, ts, secret)

    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: '{"event":"tampered"}',
        signature_header: sig,
        timestamp_header: ts,
        secret: secret
      )
    ).to be(false)
  end

  it "returns false when the secret is wrong" do
    ts = Time.now.to_i.to_s
    sig = sign(payload, ts, "wrong-secret")

    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: payload,
        signature_header: sig,
        timestamp_header: ts,
        secret: secret
      )
    ).to be(false)
  end

  it "returns false when the timestamp is outside tolerance" do
    stale_ts = (Time.now.to_i - 1000).to_s
    sig = sign(payload, stale_ts, secret)

    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: payload,
        signature_header: sig,
        timestamp_header: stale_ts,
        secret: secret,
        tolerance_seconds: 300
      )
    ).to be(false)
  end

  it "accepts a stale timestamp when tolerance check is disabled (0)" do
    stale_ts = (Time.now.to_i - 1_000_000).to_s
    sig = sign(payload, stale_ts, secret)

    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: payload,
        signature_header: sig,
        timestamp_header: stale_ts,
        secret: secret,
        tolerance_seconds: 0
      )
    ).to be(true)
  end

  it "honors an injected now() for deterministic timestamp checks" do
    fixed = 1_700_000_000
    sig = sign(payload, fixed.to_s, secret)

    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: payload,
        signature_header: sig,
        timestamp_header: fixed.to_s,
        secret: secret,
        now: -> { fixed + 10 }
      )
    ).to be(true)
  end

  it "returns false on missing signature header" do
    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: payload, signature_header: "", timestamp_header: Time.now.to_i.to_s, secret: secret
      )
    ).to be(false)
  end

  it "returns false on missing timestamp header" do
    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: payload, signature_header: "sha256=deadbeef", timestamp_header: "", secret: secret
      )
    ).to be(false)
  end

  it "returns false on missing secret" do
    ts = Time.now.to_i.to_s
    sig = sign(payload, ts, secret)
    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: payload, signature_header: sig, timestamp_header: ts, secret: ""
      )
    ).to be(false)
  end

  it "returns false on a non-numeric timestamp" do
    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: payload, signature_header: "sha256=deadbeef", timestamp_header: "not-a-number", secret: secret
      )
    ).to be(false)
  end

  # --- Contract: "never raises on bad input -- always returns a boolean" ---

  it "returns false (never raises) when signature_header is not a String" do
    ts = Time.now.to_i.to_s
    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: payload, signature_header: 12345, timestamp_header: ts, secret: secret
      )
    ).to be(false)
  end

  it "returns false (never raises) when timestamp_header is not a String" do
    sig = sign(payload, Time.now.to_i, secret)
    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: payload, signature_header: sig, timestamp_header: Time.now.to_i, secret: secret
      )
    ).to be(false)
  end

  it "returns false (never raises) when secret is not a String" do
    ts = Time.now.to_i.to_s
    sig = sign(payload, ts, secret)
    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: payload, signature_header: sig, timestamp_header: ts, secret: 99
      )
    ).to be(false)
  end

  it "honors an injected now() that returns a Time object (not just an Integer)" do
    fixed = 1_700_000_000
    sig = sign(payload, fixed.to_s, secret)

    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: payload,
        signature_header: sig,
        timestamp_header: fixed.to_s,
        secret: secret,
        now: -> { Time.at(fixed + 10) }
      )
    ).to be(true)
  end

  it "fails closed (rejects) when tolerance_seconds is negative" do
    ts = Time.now.to_i.to_s
    sig = sign(payload, ts, secret)

    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: payload,
        signature_header: sig,
        timestamp_header: ts,
        secret: secret,
        tolerance_seconds: -1
      )
    ).to be(false)
  end
end

RSpec.describe "TurboDocxSdk.secure_compare visibility" do
  it "is not exposed as a public module method" do
    expect(TurboDocxSdk).not_to respond_to(:secure_compare)
  end

  it "is still callable internally (verify_webhook_signature works)" do
    secret = "whsec_internal"
    ts = Time.now.to_i.to_s
    body = '{"event":"x"}'
    sig = "sha256=#{OpenSSL::HMAC.hexdigest('SHA256', secret, "#{ts}.#{body}")}"
    expect(
      TurboDocxSdk.verify_webhook_signature(
        payload: body, signature_header: sig, timestamp_header: ts, secret: secret
      )
    ).to be(true)
  end
end
