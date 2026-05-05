# frozen_string_literal: true

require_relative "http_client"

module TurboDocxSdk
  # TurboPartner module -- partner portal management operations.
  #
  # All methods are class-level (static pattern). Call +configure+ once,
  # then invoke any method directly on the class.
  #
  #   TurboDocxSdk::TurboPartner.configure(partner_api_key: "TDXP-...", partner_id: "...")
  #   orgs = TurboDocxSdk::TurboPartner.list_organizations
  #
  class TurboPartner
    class << self
      # Configure the TurboPartner module with partner API credentials.
      #
      # @param partner_api_key [String] Partner API key (TDXP- prefix)
      # @param partner_id [String] Partner UUID
      # @param base_url [String, nil]
      def configure(partner_api_key:, partner_id:, base_url: nil)
        @client = HttpClient.new(
          api_key: partner_api_key,
          base_url: base_url,
          skip_sender_validation: true
        )
        @partner_id = partner_id
      end

      # ============================================
      # ORGANIZATION MANAGEMENT
      # ============================================

      def create_organization(request)
        client = get_client
        client.post("/partner/#{partner_id}/organization", request)
      end

      def list_organizations(request = nil)
        client = get_client
        client.get("/partner/#{partner_id}/organizations", to_query_params(request))
      end

      def get_organization_details(organization_id)
        client = get_client
        client.get("/partner/#{partner_id}/organizations/#{organization_id}")
      end

      def update_organization_info(organization_id, request)
        client = get_client
        client.patch("/partner/#{partner_id}/organizations/#{organization_id}", request)
      end

      def delete_organization(organization_id)
        client = get_client
        client.delete("/partner/#{partner_id}/organizations/#{organization_id}")
      end

      def update_organization_entitlements(organization_id, request)
        client = get_client
        client.patch("/partner/#{partner_id}/organizations/#{organization_id}/entitlements", request)
      end

      # ============================================
      # ORGANIZATION USER MANAGEMENT
      # ============================================

      def list_organization_users(organization_id, request = nil)
        client = get_client
        client.get("/partner/#{partner_id}/organizations/#{organization_id}/users", to_query_params(request))
      end

      def add_user_to_organization(organization_id, request)
        client = get_client
        client.post("/partner/#{partner_id}/organizations/#{organization_id}/users", request)
      end

      def update_organization_user_role(organization_id, user_id, request)
        client = get_client
        client.patch("/partner/#{partner_id}/organizations/#{organization_id}/users/#{user_id}", request)
      end

      def remove_user_from_organization(organization_id, user_id)
        client = get_client
        client.delete("/partner/#{partner_id}/organizations/#{organization_id}/users/#{user_id}")
      end

      def resend_organization_invitation_to_user(organization_id, user_id)
        client = get_client
        client.post("/partner/#{partner_id}/organizations/#{organization_id}/users/#{user_id}/resend-invitation")
      end

      # ============================================
      # ORGANIZATION API KEY MANAGEMENT
      # ============================================

      def list_organization_api_keys(organization_id, request = nil)
        client = get_client
        client.get("/partner/#{partner_id}/organizations/#{organization_id}/apikeys", to_query_params(request))
      end

      def create_organization_api_key(organization_id, request)
        client = get_client
        client.post("/partner/#{partner_id}/organizations/#{organization_id}/apikeys", request)
      end

      def update_organization_api_key(organization_id, api_key_id, request)
        client = get_client
        client.patch("/partner/#{partner_id}/organizations/#{organization_id}/apikeys/#{api_key_id}", request)
      end

      def revoke_organization_api_key(organization_id, api_key_id)
        client = get_client
        client.delete("/partner/#{partner_id}/organizations/#{organization_id}/apikeys/#{api_key_id}")
      end

      # ============================================
      # PARTNER API KEY MANAGEMENT
      # ============================================

      def list_partner_api_keys(request = nil)
        client = get_client
        client.get("/partner/#{partner_id}/api-keys", to_query_params(request))
      end

      def create_partner_api_key(request)
        client = get_client
        client.post("/partner/#{partner_id}/api-keys", request)
      end

      def update_partner_api_key(key_id, request)
        client = get_client
        client.patch("/partner/#{partner_id}/api-keys/#{key_id}", request)
      end

      def revoke_partner_api_key(key_id)
        client = get_client
        client.delete("/partner/#{partner_id}/api-keys/#{key_id}")
      end

      # ============================================
      # PARTNER USER MANAGEMENT
      # ============================================

      def list_partner_portal_users(request = nil)
        client = get_client
        client.get("/partner/#{partner_id}/users", to_query_params(request))
      end

      def add_user_to_partner_portal(request)
        client = get_client
        client.post("/partner/#{partner_id}/users", request)
      end

      def update_partner_user_permissions(user_id, request)
        client = get_client
        client.patch("/partner/#{partner_id}/users/#{user_id}", request)
      end

      def remove_user_from_partner_portal(user_id)
        client = get_client
        client.delete("/partner/#{partner_id}/users/#{user_id}")
      end

      def resend_partner_portal_invitation_to_user(user_id)
        client = get_client
        client.post("/partner/#{partner_id}/users/#{user_id}/resend-invitation")
      end

      # ============================================
      # AUDIT LOGS
      # ============================================

      def get_partner_audit_logs(request = nil)
        client = get_client
        client.get("/partner/#{partner_id}/audit-logs", to_query_params(request))
      end

      private

      def get_client
        unless @client
          partner_api_key = ENV["TURBODOCX_PARTNER_API_KEY"]
          pid = ENV["TURBODOCX_PARTNER_ID"]
          unless partner_api_key && pid
            raise "TurboPartner must be configured before use. Call TurboPartner.configure() " \
                  "or set TURBODOCX_PARTNER_API_KEY and TURBODOCX_PARTNER_ID environment variables."
          end
          configure(partner_api_key: partner_api_key, partner_id: pid)
        end
        @client
      end

      def partner_id
        unless @partner_id
          get_client # triggers auto-init
        end
        @partner_id
      end

      def to_query_params(request)
        return nil if request.nil? || request.empty?

        params = {}
        request.each do |key, value|
          str_key = key.to_s
          next if value.nil?

          case value
          when true, false
            params[str_key] = value ? "true" : "false"
          else
            params[str_key] = value.to_s
          end
        end
        params.empty? ? nil : params
      end
    end
  end
end
