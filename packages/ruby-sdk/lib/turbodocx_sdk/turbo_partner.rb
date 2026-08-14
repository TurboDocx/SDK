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
      # @raise [AuthenticationError] if the partner API key is invalid
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

      # Create a new organization.
      #
      # @param request [Hash] organization data (:name, :metadata, :features)
      # @return [Hash] the created organization
      # @raise [ValidationError] on invalid request data or if not configured
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def create_organization(request)
        client = get_client
        client.post("/partner/#{partner_id}/organization", request)
      end

      # List organizations with optional pagination and search.
      #
      # @param request [Hash, nil] :limit, :offset, :search
      # @return [Hash] paginated list of organizations
      # @raise [ValidationError] if not configured and no env vars
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_organizations(request = nil)
        client = get_client
        client.get("/partner/#{partner_id}/organizations", to_query_params(request))
      end

      # Get detailed information about an organization.
      #
      # @param organization_id [String]
      # @return [Hash] organization details with features and tracking
      # @raise [NotFoundError] if the organization does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_organization_details(organization_id)
        client = get_client
        client.get("/partner/#{partner_id}/organizations/#{organization_id}")
      end

      # Update an organization's info.
      #
      # @param organization_id [String]
      # @param request [Hash] fields to update
      # @return [Hash] the updated organization
      # @raise [NotFoundError] if the organization does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_organization_info(organization_id, request)
        client = get_client
        client.patch("/partner/#{partner_id}/organizations/#{organization_id}", request)
      end

      # Delete an organization.
      #
      # @param organization_id [String]
      # @return [Hash] deletion confirmation
      # @raise [NotFoundError] if the organization does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def delete_organization(organization_id)
        client = get_client
        client.delete("/partner/#{partner_id}/organizations/#{organization_id}")
      end

      # Update an organization's entitlements (features and tracking).
      #
      # @param organization_id [String]
      # @param request [Hash] :features, :tracking
      # @return [Hash] updated entitlements
      # @raise [NotFoundError] if the organization does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_organization_entitlements(organization_id, request)
        client = get_client
        client.patch("/partner/#{partner_id}/organizations/#{organization_id}/entitlements", request)
      end

      # Read the TurboSign display preferences for one of the partner's organizations.
      #
      # Returns only the partner-settable preference keys, each with its effective
      # value (defaults applied for keys the org never set).
      #
      # @param organization_id [String]
      # @return [Hash] the organization's partner-settable preferences under +data.preferences+
      #   (+hideSignatureOutline+, +hideSignatureHash+, +lockedFieldsBackground+,
      #   +allowDownloadBeforeSigning+ booleans)
      # @raise [NotFoundError] if the organization does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_organization_preferences(organization_id)
        client = get_client
        client.get("/partner/#{partner_id}/organizations/#{organization_id}/preferences")
      end

      # Set TurboSign display preferences for one of the partner's organizations.
      #
      # Pass only the keys you want to change; each must be a boolean. The keys stay
      # camelCase verbatim (+hideSignatureOutline+, +hideSignatureHash+,
      # +lockedFieldsBackground+, +allowDownloadBeforeSigning+) -- they are the API
      # contract, not Ruby names.
      #
      # @param organization_id [String]
      # @param preferences [Hash] the preference keys to change (only these are sent)
      # @return [Hash] the organization's updated partner-settable preferences under +data.preferences+
      # @raise [NotFoundError] if the organization does not exist
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_organization_preferences(organization_id, preferences)
        client = get_client
        # Wrap under :preferences without mutating the caller's hash.
        client.patch(
          "/partner/#{partner_id}/organizations/#{organization_id}/preferences",
          { "preferences" => preferences.dup }
        )
      end

      # ============================================
      # ORGANIZATION USER MANAGEMENT
      # ============================================

      # List users in an organization.
      #
      # @param organization_id [String]
      # @param request [Hash, nil] :limit, :offset, :search
      # @return [Hash] paginated list of users
      # @raise [NotFoundError] if the organization does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_organization_users(organization_id, request = nil)
        client = get_client
        client.get("/partner/#{partner_id}/organizations/#{organization_id}/users", to_query_params(request))
      end

      # Add a user to an organization.
      #
      # @param organization_id [String]
      # @param request [Hash] :email, :role (+"admin"+, +"contributor"+, +"user"+ or +"viewer"+ --
      #   the org role enum; the partner role +"member"+ is NOT valid here)
      # @return [Hash] the added user
      # @raise [ValidationError] on invalid request data
      # @raise [NotFoundError] if the organization does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def add_user_to_organization(organization_id, request)
        client = get_client
        client.post("/partner/#{partner_id}/organizations/#{organization_id}/users", request)
      end

      # Update a user's role in an organization.
      #
      # @param organization_id [String]
      # @param user_id [String]
      # @param request [Hash] :role (+"admin"+, +"contributor"+, +"user"+ or +"viewer"+)
      # @return [Hash] the updated user
      # @raise [NotFoundError] if the organization or user does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_organization_user_role(organization_id, user_id, request)
        client = get_client
        client.patch("/partner/#{partner_id}/organizations/#{organization_id}/users/#{user_id}", request)
      end

      # Remove a user from an organization.
      #
      # @param organization_id [String]
      # @param user_id [String]
      # @return [Hash] removal confirmation
      # @raise [NotFoundError] if the organization or user does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def remove_user_from_organization(organization_id, user_id)
        client = get_client
        client.delete("/partner/#{partner_id}/organizations/#{organization_id}/users/#{user_id}")
      end

      # Resend an organization invitation to a user.
      #
      # @param organization_id [String]
      # @param user_id [String]
      # @return [Hash] resend confirmation
      # @raise [NotFoundError] if the organization or user does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def resend_organization_invitation_to_user(organization_id, user_id)
        client = get_client
        client.post("/partner/#{partner_id}/organizations/#{organization_id}/users/#{user_id}/resend-invitation")
      end

      # ============================================
      # ORGANIZATION API KEY MANAGEMENT
      # ============================================

      # List API keys for an organization.
      #
      # @param organization_id [String]
      # @param request [Hash, nil] :limit, :offset, :search
      # @return [Hash] paginated list of API keys
      # @raise [NotFoundError] if the organization does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_organization_api_keys(organization_id, request = nil)
        client = get_client
        client.get("/partner/#{partner_id}/organizations/#{organization_id}/apikeys", to_query_params(request))
      end

      # Create an API key for an organization.
      #
      # @param organization_id [String]
      # @param request [Hash] :name, :role (org role enum:
      #   +"admin"+, +"contributor"+, +"user"+ or +"viewer"+)
      # @return [Hash] the created API key (includes full key value)
      # @raise [ValidationError] on invalid request data
      # @raise [NotFoundError] if the organization does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def create_organization_api_key(organization_id, request)
        client = get_client
        client.post("/partner/#{partner_id}/organizations/#{organization_id}/apikeys", request)
      end

      # Update an organization API key.
      #
      # @param organization_id [String]
      # @param api_key_id [String]
      # @param request [Hash] fields to update
      # @return [Hash] the updated API key
      # @raise [NotFoundError] if the organization or API key does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_organization_api_key(organization_id, api_key_id, request)
        client = get_client
        client.patch("/partner/#{partner_id}/organizations/#{organization_id}/apikeys/#{api_key_id}", request)
      end

      # Revoke an organization API key.
      #
      # @param organization_id [String]
      # @param api_key_id [String]
      # @return [Hash] revocation confirmation
      # @raise [NotFoundError] if the organization or API key does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def revoke_organization_api_key(organization_id, api_key_id)
        client = get_client
        client.delete("/partner/#{partner_id}/organizations/#{organization_id}/apikeys/#{api_key_id}")
      end

      # ============================================
      # PARTNER API KEY MANAGEMENT
      # ============================================

      # List partner API keys.
      #
      # @param request [Hash, nil] :limit, :offset
      # @return [Hash] paginated list of partner API keys
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_partner_api_keys(request = nil)
        client = get_client
        client.get("/partner/#{partner_id}/api-keys", to_query_params(request))
      end

      # Create a partner API key.
      #
      # @param request [Hash] :name, :scopes, :description
      # @return [Hash] the created partner API key (includes full key value)
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def create_partner_api_key(request)
        client = get_client
        client.post("/partner/#{partner_id}/api-keys", request)
      end

      # Update a partner API key.
      #
      # @param key_id [String]
      # @param request [Hash] fields to update
      # @return [Hash] the updated partner API key
      # @raise [NotFoundError] if the API key does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_partner_api_key(key_id, request)
        client = get_client
        client.patch("/partner/#{partner_id}/api-keys/#{key_id}", request)
      end

      # Revoke a partner API key.
      #
      # @param key_id [String]
      # @return [Hash] revocation confirmation
      # @raise [NotFoundError] if the API key does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def revoke_partner_api_key(key_id)
        client = get_client
        client.delete("/partner/#{partner_id}/api-keys/#{key_id}")
      end

      # ============================================
      # PARTNER USER MANAGEMENT
      # ============================================

      # List partner portal users.
      #
      # @param request [Hash, nil] :limit, :offset, :search
      # @return [Hash] paginated list of partner users
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def list_partner_portal_users(request = nil)
        client = get_client
        client.get("/partner/#{partner_id}/users", to_query_params(request))
      end

      # Add a user to the partner portal.
      #
      # @param request [Hash] :email, :role (partner role enum: +"admin"+, +"member"+ or
      #   +"viewer"+ -- the org roles +"contributor"+/+"user"+ are NOT valid here),
      #   :permissions. When :permissions is supplied it must carry ALL SEVEN keys --
      #   +canManageOrgs+, +canManageOrgUsers+, +canManagePartnerUsers+,
      #   +canManageOrgAPIKeys+, +canManagePartnerAPIKeys+, +canUpdateEntitlements+,
      #   +canViewAuditLogs+ (booleans). A partial permissions object is a 400.
      # @return [Hash] the added user
      # @raise [ValidationError] on invalid request data
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def add_user_to_partner_portal(request)
        client = get_client
        client.post("/partner/#{partner_id}/users", request)
      end

      # Update a partner user's permissions.
      #
      # The :permissions object itself is optional, but there is no partial update:
      # if you send it, send all seven keys or the backend returns a 400.
      #
      # @param user_id [String]
      # @param request [Hash] :role (+"admin"+, +"member"+ or +"viewer"+), :permissions
      #   (ALL SEVEN of +canManageOrgs+, +canManageOrgUsers+, +canManagePartnerUsers+,
      #   +canManageOrgAPIKeys+, +canManagePartnerAPIKeys+, +canUpdateEntitlements+,
      #   +canViewAuditLogs+)
      # @return [Hash] the updated user
      # @raise [NotFoundError] if the user does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def update_partner_user_permissions(user_id, request)
        client = get_client
        client.patch("/partner/#{partner_id}/users/#{user_id}", request)
      end

      # Remove a user from the partner portal.
      #
      # @param user_id [String]
      # @return [Hash] removal confirmation
      # @raise [NotFoundError] if the user does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def remove_user_from_partner_portal(user_id)
        client = get_client
        client.delete("/partner/#{partner_id}/users/#{user_id}")
      end

      # Resend a partner portal invitation to a user.
      #
      # @param user_id [String]
      # @return [Hash] resend confirmation
      # @raise [NotFoundError] if the user does not exist
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def resend_partner_portal_invitation_to_user(user_id)
        client = get_client
        client.post("/partner/#{partner_id}/users/#{user_id}/resend-invitation")
      end

      # ============================================
      # AUDIT LOGS
      # ============================================

      # Get partner audit logs with optional filters.
      #
      # @param request [Hash, nil] :limit, :offset, :action, :resourceType, :success, :startDate, :endDate
      # @return [Hash] paginated list of audit log entries
      # @raise [AuthenticationError] on invalid credentials
      # @raise [NetworkError] on connection failure
      def get_partner_audit_logs(request = nil)
        client = get_client
        client.get("/partner/#{partner_id}/audit-logs", to_query_params(request))
      end

      private

      def get_client
        @client ||= begin
          partner_api_key = ENV["TURBODOCX_PARTNER_API_KEY"]
          pid = ENV["TURBODOCX_PARTNER_ID"]
          unless partner_api_key && pid
            raise ValidationError, "TurboPartner must be configured before use. Call TurboPartner.configure() " \
                  "or set TURBODOCX_PARTNER_API_KEY and TURBODOCX_PARTNER_ID environment variables."
          end
          configure(partner_api_key: partner_api_key, partner_id: pid)
          @client
        end
      end

      def partner_id
        @partner_id || begin
          get_client # triggers auto-init
          @partner_id
        end
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
          when Array
            # Preserve as a string array so HttpClient#build_url emits repeated
            # keys (?k=a&k=b) rather than a JSON-stringified blob. Mirrors
            # TurboQuote#to_query_params.
            params[str_key] = value.map(&:to_s)
          else
            params[str_key] = value.to_s
          end
        end
        params.empty? ? nil : params
      end
    end
  end
end
