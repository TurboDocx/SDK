# frozen_string_literal: true

# TurboPartner Example: API Key & User Management
#
# This example demonstrates partner-level management:
# - Partner API key creation with scoped permissions
# - Partner portal user management
# - Audit log querying
#
# Set environment variables before running:
#   export TURBODOCX_PARTNER_API_KEY=TDXP-your-key
#   export TURBODOCX_PARTNER_ID=your-partner-uuid

require "turbodocx_sdk"

TurboDocxSdk::TurboPartner.configure(
  partner_api_key: ENV.fetch("TURBODOCX_PARTNER_API_KEY", "TDXP-your-key-here"),
  partner_id:      ENV.fetch("TURBODOCX_PARTNER_ID", "your-partner-uuid")
)

# --- Partner API Keys ---

# Create a scoped partner API key (read-only for orgs and audit).
# Scope strings are available as constants under TurboDocxSdk::PartnerScope.
puts "Creating scoped partner API key..."
key = TurboDocxSdk::TurboPartner.create_partner_api_key(
  "name"        => "Read-Only Monitoring Key",
  "description" => "For monitoring dashboard - read-only access",
  "scopes"      => [
    TurboDocxSdk::PartnerScope::ORG_READ,
    TurboDocxSdk::PartnerScope::ORG_USERS_READ,
    TurboDocxSdk::PartnerScope::AUDIT_READ,
  ]
)
puts "Created key: #{key['data']['name']}"
puts "Key value: #{key['data']['key']}"
puts "Scopes: #{key['data']['scopes']}\n\n"

# List all partner API keys
puts "Listing partner API keys..."
keys = TurboDocxSdk::TurboPartner.list_partner_api_keys
keys["data"]["results"].each do |k|
  puts "  - #{k['name']} (ID: #{k['id']})"
end
puts

# --- Partner Portal Users ---

# Add a user to the partner portal with specific permissions
puts "Adding partner portal user..."
user = TurboDocxSdk::TurboPartner.add_user_to_partner_portal(
  "email"       => "ops@yourcompany.com",
  "role"        => "member",
  "permissions" => {
    "canManageOrgs"     => true,
    "canManageOrgUsers" => true,
    "canViewAuditLogs"  => true
    # Other permissions default to false
  }
)
puts "Added partner user: #{user['data']['email']} (Role: #{user['data']['role']})\n\n"

# List partner portal users
puts "Listing partner portal users..."
users = TurboDocxSdk::TurboPartner.list_partner_portal_users
users["data"]["results"].each do |u|
  admin = u["isPrimaryAdmin"] ? " [PRIMARY ADMIN]" : ""
  puts "  - #{u['email']} (#{u['role']})#{admin}"
end
puts

# --- Audit Logs ---

# Query recent audit logs
puts "Fetching recent audit logs..."
logs = TurboDocxSdk::TurboPartner.get_partner_audit_logs(limit: 5)
puts "Total log entries: #{logs['data']['totalRecords']} (showing first #{logs['data']['results'].length})"
logs["data"]["results"].each do |entry|
  puts "  [#{entry['createdOn']}] #{entry['action']} #{entry['resourceType']} (success: #{entry['success']})"
end

puts "\nDone!"
