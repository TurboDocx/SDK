# frozen_string_literal: true

require "openssl"
require_relative "http_client"

module TurboDocxSdk
  # The fixed name used for the single SDK-managed webhook per org.
  # Mirrors the convention enforced by the UI's Signature Webhooks settings.
  SIGNATURE_WEBHOOK_NAME = "signature"

  # TurboWebhooks module -- org-scoped signature webhook subscription.
  #
  # The SDK is intentionally locked to a single webhook per org, identified by
  # the fixed name +signature+. This matches the UI's "Signature Webhooks"
  # settings page so SDK-created webhooks show up where users expect to manage
  # them. To manage multiple webhooks per org, call the REST API directly.
  #
  # All routes require an administrator TDX- API key. Webhook management does
  # not send signature emails, so +skip_sender_validation: true+ is hardcoded
  # inside +configure+ and +get_client+.
  #
  # POST/PATCH responses come back as +{ data, message }+ envelopes which
  # +smart_unwrap+ leaves intact (it only unwraps single-key +{ data }+).
  # Methods that hit non-GET routes extract +["data"]+ explicitly. GET routes
  # are auto-unwrapped by the HttpClient.
  #
  #   TurboDocxSdk::TurboWebhooks.configure(api_key: "...", org_id: "...")
  #   created = TurboDocxSdk::TurboWebhooks.create_webhook(
  #     urls: ["https://example.com/hook"],
  #     events: ["signature.document.completed"]
  #   )
  #
  class TurboWebhooks
    class << self
      # Configure the TurboWebhooks module with API credentials.
      #
      # Hardcodes +skip_sender_validation: true+ -- webhook management never
      # sends signature emails.
      #
      # @param api_key [String, nil]
      # @param access_token [String, nil]
      # @param org_id [String, nil]
      # @param base_url [String, nil]
      # @raise [AuthenticationError] if no API key or access token is provided
      def configure(api_key: nil, access_token: nil, org_id: nil, base_url: nil)
        @client = HttpClient.new(
          api_key: api_key,
          access_token: access_token,
          org_id: org_id,
          base_url: base_url,
          skip_sender_validation: true
        )
      end

      # Create the org's signature webhook. The returned +secret+ is shown
      # ONCE; store it on receipt -- it cannot be retrieved later.
      #
      # If a webhook named +signature+ already exists, the backend returns 409
      # ConflictError. Update the existing webhook with +update_webhook+ or
      # delete it first.
      #
      # @param urls [Array<String>] HTTPS-only endpoint URLs (HTTP returns 400)
      # @param events [Array<String>] subscribed event types
      # @return [Hash] { "id" => ..., "secret" => ... }
      # @raise [ConflictError] if the signature webhook already exists
      # @raise [ValidationError] on invalid request data (e.g. non-HTTPS url)
      def create_webhook(urls:, events:)
        client = get_client
        envelope = client.post(
          "/api/webhooks",
          { "name" => SIGNATURE_WEBHOOK_NAME, "urls" => urls, "events" => events }
        )
        envelope["data"]
      end

      # Get the org's signature webhook with delivery stats + available events.
      #
      # @return [Hash] the webhook with "deliveryStats" and "availableEvents"
      # @raise [NotFoundError] if the signature webhook does not exist
      def get_webhook
        get_client.get("/api/webhooks/#{SIGNATURE_WEBHOOK_NAME}")
      end

      # Patch one or more fields on the signature webhook. Only fields the
      # caller explicitly provides are sent; untouched fields are omitted.
      #
      # @param urls [Array<String>, nil] HTTPS-only endpoint URLs
      # @param events [Array<String>, nil] subscribed event types
      # @param is_active [Boolean, nil] enable/disable delivery
      # @return [Hash] the updated webhook
      # @raise [NotFoundError] if the signature webhook does not exist
      # @raise [ValidationError] on invalid request data (e.g. non-HTTPS url)
      def update_webhook(urls: :__unset, events: :__unset, is_active: :__unset)
        patch = {}
        patch["urls"] = urls unless urls == :__unset
        patch["events"] = events unless events == :__unset
        patch["isActive"] = is_active unless is_active == :__unset

        envelope = get_client.patch("/api/webhooks/#{SIGNATURE_WEBHOOK_NAME}", patch)
        envelope["data"]
      end

      # Soft-delete the signature webhook and its delivery history.
      #
      # @return [Hash] { "message" => ... }
      # @raise [NotFoundError] if the signature webhook does not exist
      def delete_webhook
        get_client.delete("/api/webhooks/#{SIGNATURE_WEBHOOK_NAME}")
      end

      # Send a test delivery to all URLs configured on the signature webhook.
      #
      # @param event_type [String] the event type to simulate
      # @param payload [Hash] the event payload
      # @return [Hash] { "deliveries" => [...], "summary" => {...} }
      def test_webhook(event_type:, payload:)
        envelope = get_client.post(
          "/api/webhooks/#{SIGNATURE_WEBHOOK_NAME}/test",
          { "eventType" => event_type, "payload" => payload }
        )
        envelope["data"]
      end

      # Send a manual notification to all URLs configured on the signature
      # webhook. Routes through the same backend handler as +test_webhook+ --
      # only the response/error message strings differ.
      #
      # @param event_type [String] the event type to send
      # @param payload [Hash] the event payload
      # @return [Hash] { "deliveries" => [...], "summary" => {...} }
      def notify_webhook(event_type:, payload:)
        envelope = get_client.post(
          "/api/webhooks/#{SIGNATURE_WEBHOOK_NAME}/notify",
          { "eventType" => event_type, "payload" => payload }
        )
        envelope["data"]
      end

      # Rotate the webhook's HMAC secret. The new secret is shown ONCE; old
      # signatures will fail immediately.
      #
      # @return [Hash] { "id" => ..., "secret" => ..., "regeneratedAt" => ... }
      def regenerate_webhook_secret
        envelope = get_client.post("/api/webhooks/#{SIGNATURE_WEBHOOK_NAME}/regenerate")
        envelope["data"]
      end

      # List historical delivery attempts for the signature webhook.
      #
      # @param limit [Integer, nil]
      # @param offset [Integer, nil]
      # @param event_type [String, nil]
      # @param is_delivered [Boolean, nil]
      # @param http_status [Integer, nil]
      # @return [Hash] { "results" => [...], "totalRecords" => N, "limit" => ..., "offset" => ... }
      def list_webhook_deliveries(limit: nil, offset: nil, event_type: nil, is_delivered: nil, http_status: nil)
        params = {}
        params["limit"] = limit unless limit.nil?
        params["offset"] = offset unless offset.nil?
        params["eventType"] = event_type unless event_type.nil?
        params["isDelivered"] = is_delivered unless is_delivered.nil?
        params["httpStatus"] = http_status unless http_status.nil?

        get_client.get("/api/webhooks/#{SIGNATURE_WEBHOOK_NAME}/deliveries", params)
      end

      # Manually retry a specific past delivery by ID.
      #
      # @param delivery_id [String]
      # @return [Hash] the freshly-created delivery row
      def replay_webhook_delivery(delivery_id)
        envelope = get_client.post(
          "/api/webhooks/#{SIGNATURE_WEBHOOK_NAME}/replay",
          { "deliveryId" => delivery_id }
        )
        envelope["data"]
      end

      # Aggregate delivery stats over a sliding window (days).
      #
      # @param days [Integer, nil] 1-365, default 30 (server-side default)
      # @return [Hash] { "webhook" => {...}, "period" => {...}, "summary" => {...}, "eventBreakdown" => [...] }
      def get_webhook_stats(days: nil)
        params = {}
        params["days"] = days unless days.nil?
        get_client.get("/api/webhooks/#{SIGNATURE_WEBHOOK_NAME}/stats", params)
      end

      private

      # Lazy fallback to env-driven config. Mirrors the explicit env-var check
      # used by the JS module -- descriptive error rather than a silent
      # auto-configure.
      def get_client
        return @client if @client

        api_key = ENV["TURBODOCX_API_KEY"]
        org_id = ENV["TURBODOCX_ORG_ID"]
        unless api_key && org_id
          raise TurboDocxError.new(
            "TurboWebhooks must be configured before use. Call TurboWebhooks.configure() " \
            "or set TURBODOCX_API_KEY and TURBODOCX_ORG_ID environment variables."
          )
        end

        configure(api_key: api_key, org_id: org_id)
        @client
      end
    end
  end

  # Verify a TurboDocx webhook delivery signature.
  #
  # Verifies the +X-TurboDocx-Signature+ header on an incoming webhook
  # delivery. Format matches the backend's signature generation:
  #   - Header:        X-TurboDocx-Signature: sha256=<hex>
  #   - Timestamp:     X-TurboDocx-Timestamp: <unix-seconds>
  #   - String signed: "<timestamp>.<raw_body>"
  #   - Algorithm:     HMAC-SHA256
  #
  # Enforces a configurable timestamp tolerance (default 300s) to prevent
  # replay attacks. Uses a constant-time comparison and never raises on bad
  # input -- always returns a boolean.
  #
  # @param payload [String] the raw request body, AS RECEIVED. Do NOT parse
  #   then re-serialize; whitespace must match exactly.
  # @param signature_header [String] value of the +X-TurboDocx-Signature+
  #   header (format: "sha256=<hex>").
  # @param timestamp_header [String] value of the +X-TurboDocx-Timestamp+
  #   header (Unix epoch seconds, as string).
  # @param secret [String] webhook secret returned by +create_webhook+ or
  #   +regenerate_webhook_secret+.
  # @param tolerance_seconds [Integer] max acceptable age of the timestamp,
  #   in seconds. Defaults to 300. Set to 0 to disable the timestamp check
  #   (NOT recommended in production).
  # @param now [Proc, nil] override the "current time" function for
  #   deterministic testing. Returns Unix epoch seconds. Defaults to
  #   +Time.now.to_i+.
  # @return [Boolean] true iff the signature is valid AND the timestamp is
  #   within tolerance.
  def self.verify_webhook_signature(payload:, signature_header:, timestamp_header:, secret:, tolerance_seconds: 300, now: nil)
    # Non-String / nil / empty inputs all fail closed -- honoring the
    # documented "never raises on bad input" contract without relying on the
    # rescue below (which only covers Integer() parse failures).
    return false unless signature_header.is_a?(String) && !signature_header.empty?
    return false unless timestamp_header.is_a?(String) && !timestamp_header.empty?
    return false unless secret.is_a?(String) && !secret.empty?

    # tolerance_seconds == 0 disables the replay window. Any non-zero value
    # enforces it; a negative value fails closed (rejects everything) rather
    # than silently disabling the check.
    unless tolerance_seconds.zero?
      ts = Integer(timestamp_header, 10)
      # now may return a Time or an Integer; coerce both to epoch seconds.
      current_time = now ? now.call.to_i : Time.now.to_i
      return false if (current_time - ts).abs > tolerance_seconds
    end

    body = payload.is_a?(String) ? payload : payload.to_s
    digest = OpenSSL::HMAC.hexdigest("SHA256", secret, "#{timestamp_header}.#{body}")
    expected = "sha256=#{digest}"

    secure_compare(expected, signature_header)
  rescue ArgumentError, TypeError
    # Non-numeric timestamp (Integer() raised) or similar bad input.
    false
  end

  # Constant-time string comparison. Prefers Rack::Utils.secure_compare when
  # Rack is available; otherwise falls back to a manual constant-time compare
  # so the SDK never takes on Rack as a runtime dependency.
  def self.secure_compare(a, b)
    if defined?(Rack::Utils) && Rack::Utils.respond_to?(:secure_compare)
      return Rack::Utils.secure_compare(a, b)
    end

    return false unless a.bytesize == b.bytesize

    l = a.unpack("C*")
    res = 0
    b.each_byte { |byte| res |= byte ^ l.shift }
    res.zero?
  end
  private_class_method :secure_compare
end
