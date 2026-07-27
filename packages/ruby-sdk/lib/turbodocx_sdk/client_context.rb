# frozen_string_literal: true

require "socket"
require "digest"
require "rbconfig"

module TurboDocxSdk
  # Client-context detection for audit-trail device/location reporting.
  #
  # The TurboDocx backend derives the signature audit trail's device + location
  # from the request's User-Agent, X-Timezone, Accept-Language, X-Forwarded-For
  # and X-Device-Fingerprint headers. When the SDK runs in a container/VM these
  # should describe that environment instead of defaulting to a generic
  # User-Agent (recorded as device "Unknown") and a loopback/proxy IP (location
  # "Unknown").
  #
  # The backend only classifies a request as an SDK call when the User-Agent
  # starts with the canonical "@turbodocx/sdk/<version>" token, so the
  # auto-generated User-Agent always uses that prefix.
  #
  # Everything here is best-effort: detection failures degrade to a bare SDK
  # User-Agent rather than raising.
  class ClientContext
    attr_reader :user_agent, :ip_address, :timezone, :language, :device_fingerprint

    # @param user_agent [String, nil] override the auto-generated descriptive User-Agent
    # @param ip_address [String, nil] client IP reported as X-Forwarded-For for geolocation.
    #   Opt-in: omitted by default so a container's private IP never overrides the
    #   production load balancer's real public IP (X-Forwarded-For is leftmost-wins).
    # @param timezone [String, nil] override the auto-detected timezone (X-Timezone)
    # @param language [String, nil] override the auto-detected BCP-47 tag (Accept-Language)
    # @param device_fingerprint [String, nil] override the auto-generated device fingerprint
    def initialize(user_agent: nil, ip_address: nil, timezone: nil, language: nil, device_fingerprint: nil)
      @user_agent = user_agent
      @ip_address = ip_address
      @timezone = timezone
      @language = language
      @device_fingerprint = device_fingerprint
    end

    class << self
      # Resolve the effective client-context request headers, applying caller
      # overrides over auto-detected host values.
      # @param ctx [ClientContext, nil]
      # @return [Hash{String=>String}]
      def resolve_headers(ctx = nil)
        headers = {}

        headers["User-Agent"] = present(ctx&.user_agent) ? ctx.user_agent : build_default_user_agent

        timezone = present(ctx&.timezone) ? ctx.timezone : detect_timezone
        headers["X-Timezone"] = timezone if present(timezone)

        language = present(ctx&.language) ? ctx.language : detect_locale
        headers["Accept-Language"] = language if present(language)

        fingerprint = present(ctx&.device_fingerprint) ? ctx.device_fingerprint : build_device_fingerprint
        headers["X-Device-Fingerprint"] = fingerprint if present(fingerprint)

        # Opt-in only (see #ip_address).
        headers["X-Forwarded-For"] = ctx.ip_address if ctx && present(ctx.ip_address)

        headers
      end

      # e.g. "@turbodocx/sdk/0.4.0 (Ruby/3.2.2; linux; x86_64; host=svc-1)".
      def build_default_user_agent
        base = "@turbodocx/sdk/#{sdk_version}"
        host = Socket.gethostname
        return base if host.nil? || host.empty?

        os_name = RbConfig::CONFIG["host_os"]
        arch = RbConfig::CONFIG["host_cpu"]
        "#{base} (Ruby/#{RUBY_VERSION}; #{os_name}; #{arch}; host=#{host})"
      rescue StandardError
        "@turbodocx/sdk/#{sdk_version}"
      end

      # Detect the host timezone name (e.g. "UTC"); "" if unavailable.
      def detect_timezone
        Time.now.zone.to_s
      rescue StandardError
        ""
      end

      # Detect the host BCP-47 language tag (e.g. "en-US") from the environment;
      # "" if unavailable or a non-language locale (C/POSIX).
      def detect_locale
        raw = ENV["LC_ALL"] || ENV["LC_MESSAGES"] || ENV["LANG"] || ""
        return "" if raw.empty?

        tag = raw.split(".").first.to_s.tr("_", "-").strip
        return "" if tag.empty? || %w[C POSIX].include?(tag.upcase)

        tag
      rescue StandardError
        ""
      end

      # Stable, non-reversible fingerprint of the host; "" if unavailable.
      def build_device_fingerprint
        host = Socket.gethostname
        return "" if host.nil? || host.empty?

        seed = [host, RbConfig::CONFIG["host_os"], RbConfig::CONFIG["host_cpu"]].join("|")
        Digest::SHA256.hexdigest(seed)
      rescue StandardError
        ""
      end

      private

      def sdk_version
        defined?(TurboDocxSdk::VERSION) ? TurboDocxSdk::VERSION : "0.0.0"
      end

      def present(value)
        !value.nil? && !value.to_s.empty?
      end
    end
  end
end
