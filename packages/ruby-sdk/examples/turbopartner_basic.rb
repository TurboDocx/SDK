# frozen_string_literal: true

# TurboPartner Example: Organization Lifecycle
#
# This example demonstrates the full TurboPartner partner management flow:
# 1. Create an organization with entitlements
# 2. Add a user to the organization
# 3. Create an API key for the organization
# 4. List organizations and users
# 5. Clean up resources
#
# Set environment variables before running:
#   export TURBODOCX_PARTNER_API_KEY=TDXP-your-key
#   export TURBODOCX_PARTNER_ID=your-partner-uuid

require "turbodocx_sdk"

# 1. Configure the partner client
TurboDocxSdk::TurboPartner.configure(
  partner_api_key: ENV.fetch("TURBODOCX_PARTNER_API_KEY", "TDXP-your-key-here"),
  partner_id:      ENV.fetch("TURBODOCX_PARTNER_ID", "your-partner-uuid")
)

# 2. Create an organization with entitlements
puts "Creating organization..."
org = TurboDocxSdk::TurboPartner.create_organization(
  "name"     => "Acme Corporation",
  "features" => {
    "maxUsers"        => 25,
    "maxStorage"      => 5 * 1024 * 1024 * 1024, # 5 GB
    "maxTemplates"    => 100,
    "maxSignatures"   => 500,
    "hasTDAI"         => true,
    "hasPptx"         => true,
    "hasFileDownload" => true
  }
)
org_id = org["data"]["id"]
puts "Created organization: #{org['data']['name']} (ID: #{org_id})\n\n"

# 3. Add a user to the organization
puts "Adding user to organization..."
user = TurboDocxSdk::TurboPartner.add_user_to_organization(
  org_id,
  "email" => "admin@acme.com",
  "role"  => "admin"
)
puts "Added user: #{user['data']['email']} (Role: #{user['data']['role']})\n\n"

# 4. Create an API key for the organization
puts "Creating organization API key..."
api_key = TurboDocxSdk::TurboPartner.create_organization_api_key(
  org_id,
  "name" => "Production Key",
  "role" => "admin"
)
puts "Created API key: #{api_key['data']['name']}"
puts "Key value: #{api_key['data']['key']}\n\n"

# 5. List all organizations
puts "Listing organizations..."
orgs = TurboDocxSdk::TurboPartner.list_organizations(limit: 10)
puts "Total organizations: #{orgs['data']['totalRecords']}"
orgs["data"]["results"].each do |o|
  puts "  - #{o['name']} (ID: #{o['id']})"
end
puts

# 6. Get full organization details (includes features + tracking)
puts "Getting organization details..."
details = TurboDocxSdk::TurboPartner.get_organization_details(org_id)
puts "Organization: #{details['data']['name']}"
if details["data"]["features"] && details["data"]["features"]["maxUsers"]
  puts "  Max Users: #{details['data']['features']['maxUsers']}"
end
if details["data"]["tracking"]
  puts "  Current Users: #{details['data']['tracking']['numUsers']}"
end
puts

# 7. List users in the organization
puts "Listing organization users..."
users = TurboDocxSdk::TurboPartner.list_organization_users(org_id)
puts "Total users: #{users['data']['totalRecords']}"
users["data"]["results"].each do |u|
  puts "  - #{u['email']} (#{u['role']})"
end

puts "\nDone! Organization is fully provisioned."
