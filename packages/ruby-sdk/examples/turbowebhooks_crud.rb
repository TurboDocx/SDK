# frozen_string_literal: true

# TurboWebhooks CRUD example.
#
# Walks through the full lifecycle plus the error paths you actually hit
# in practice:
#
#   1. configure against the TurboDocx API
#   2. create the signature webhook
#   3. trigger the conflict path (second create with the same name -> 409)
#   4. read (get) the webhook + its delivery stats
#   5. update its URL list and confirm the change
#   6. test-fire it (and surface per-URL failure strings)
#   7. rotate its secret
#   8. list past delivery attempts
#   9. delete it
#  10. confirm reads against the now-deleted webhook return 404
#
# Run:
#
#   export TURBODOCX_API_KEY=TDX-...
#   export TURBODOCX_ORG_ID=...
#   ruby examples/turbowebhooks_crud.rb
#
# Optionally override the API host with TURBODOCX_BASE_URL.
#
# Requires an admin-scoped TDX- API key. The webhook route gate is
# requireOrgRole(administrator); a non-admin key will 403 here.

require_relative "../lib/turbodocx_sdk"
require "json"

# The URL the webhook will POST to when an event fires. The backend enforces
# HTTPS-only -- non-HTTPS URLs return 400 ValidationError.
RECEIVER_URL = "https://your-server.example.com/webhooks/turbodocx"

EVENT_DOCUMENT_COMPLETED = "signature.document.completed"
EVENT_DOCUMENT_VOIDED = "signature.document.voided"

def section(title)
  puts
  puts "─" * 60
  puts "▸ #{title}"
  puts "─" * 60
end

def pretty(value)
  JSON.pretty_generate(value)
rescue StandardError
  "<unserializable>"
end

def turbowebhooks_crud_example
  # Configure the TurboWebhooks client. skip_sender_validation is hardcoded
  # true internally -- webhooks don't send emails; only TurboSign needs a
  # sender email.
  base_url = ENV["TURBODOCX_BASE_URL"] || "https://api.turbodocx.com"
  TurboDocxSdk::TurboWebhooks.configure(
    api_key: ENV["TURBODOCX_API_KEY"] || "your-admin-tdx-key-here",
    org_id: ENV["TURBODOCX_ORG_ID"] || "your-org-id-here",
    base_url: base_url
  )

  puts "Configured TurboWebhooks against #{base_url}"
  puts "Org: #{ENV['TURBODOCX_ORG_ID'] || 'your-org-id-here'}"

  # ────────────────────────────────────────────────────────────
  # 1. CREATE
  # ────────────────────────────────────────────────────────────
  section("CREATE webhook")

  begin
    created = TurboDocxSdk::TurboWebhooks.create_webhook(
      urls: [RECEIVER_URL],
      events: [EVENT_DOCUMENT_COMPLETED, EVENT_DOCUMENT_VOIDED]
    )
    puts "Created. Save this secret -- it is shown ONCE:"
    puts "  id:     #{created['id']}"
    puts "  secret: #{created['secret']}"
  rescue TurboDocxSdk::ConflictError
    # The webhook already exists from a previous run. That's fine -- continue
    # so we can still exercise update / test / delete.
    puts "A signature webhook already exists for this org (409). Continuing."
  end

  # ────────────────────────────────────────────────────────────
  # 2. CONFLICT PATH — create again, expect 409
  # ────────────────────────────────────────────────────────────
  section("Trigger duplicate-name conflict (expect 409)")

  begin
    TurboDocxSdk::TurboWebhooks.create_webhook(
      urls: [RECEIVER_URL],
      events: [EVENT_DOCUMENT_COMPLETED]
    )
    puts "Unexpected: second create succeeded. Did the webhook get deleted between calls?"
  rescue TurboDocxSdk::ConflictError => e
    puts "Got the expected 409 ConflictError."
    puts "  message:     #{e.message}"
    puts "  status_code: #{e.status_code}"
    puts "  code:        #{e.code}"
  end

  # ────────────────────────────────────────────────────────────
  # 3. READ
  # ────────────────────────────────────────────────────────────
  section("GET webhook")

  webhook = TurboDocxSdk::TurboWebhooks.get_webhook
  puts "Webhook:"
  puts "  id:        #{webhook['id']}"
  puts "  name:      #{webhook['name']}"
  puts "  urls:      #{pretty(webhook['urls'])}"
  puts "  events:    #{pretty(webhook['events'])}"
  puts "  isActive:  #{webhook['isActive']}"
  puts "  stats:     #{pretty(webhook['deliveryStats'])}"

  # ────────────────────────────────────────────────────────────
  # 4. UPDATE
  # ────────────────────────────────────────────────────────────
  section("UPDATE webhook (replace URL list)")

  updated = TurboDocxSdk::TurboWebhooks.update_webhook(urls: [RECEIVER_URL])
  puts "Updated. New URLs:\n#{pretty(updated['urls'])}"

  # ────────────────────────────────────────────────────────────
  # 5. TEST FIRE — surface per-URL errors
  # ────────────────────────────────────────────────────────────
  section("TEST-fire webhook")

  begin
    result = TurboDocxSdk::TurboWebhooks.test_webhook(
      event_type: EVENT_DOCUMENT_COMPLETED,
      payload: {
        "documentId" => "00000000-0000-0000-0000-000000000000",
        "documentName" => "CRUD-example test fire"
      }
    )
    summary = result["summary"]
    puts "Summary: #{summary['successful']}/#{summary['total']} successful, #{summary['failed']} failed"
    errors = summary["errors"] || []
    unless errors.empty?
      puts "Per-URL errors:"
      errors.each { |err| puts "  - #{err}" }
    end
  rescue TurboDocxSdk::TurboDocxError => e
    puts "Test-fire failed: #{e.class} — #{e.message}"
  end

  # ────────────────────────────────────────────────────────────
  # 6. ROTATE SECRET
  # ────────────────────────────────────────────────────────────
  section("Rotate webhook secret")

  rotated = TurboDocxSdk::TurboWebhooks.regenerate_webhook_secret
  puts "Rotated. New secret (shown ONCE, save it):"
  puts "  secret:        #{rotated['secret']}"
  puts "  regeneratedAt: #{rotated['regeneratedAt']}"

  # ────────────────────────────────────────────────────────────
  # 7. LIST DELIVERIES
  # ────────────────────────────────────────────────────────────
  section("List recent delivery attempts")

  deliveries = TurboDocxSdk::TurboWebhooks.list_webhook_deliveries(limit: 5)
  puts "Total recorded: #{deliveries['totalRecords']}"
  (deliveries["results"] || []).each_with_index do |d, i|
    status = d["httpStatus"] || "pending"
    delivered = d["isDelivered"] ? "OK" : "FAIL"
    puts "  [#{i}] #{d['eventType']} → #{status} (#{delivered}) at #{d['createdOn']}"
  end

  # ────────────────────────────────────────────────────────────
  # 8. DELETE
  # ────────────────────────────────────────────────────────────
  section("DELETE webhook")

  del_result = TurboDocxSdk::TurboWebhooks.delete_webhook
  puts "Deleted. Server says: #{del_result['message']}"

  # ────────────────────────────────────────────────────────────
  # 9. POST-DELETE READ — expect 404
  # ────────────────────────────────────────────────────────────
  section("GET after delete (expect 404)")

  begin
    TurboDocxSdk::TurboWebhooks.get_webhook
    puts "Unexpected: read after delete succeeded."
  rescue TurboDocxSdk::NotFoundError => e
    puts "Got the expected 404 NotFoundError: #{e.message}"
  end
end

# ────────────────────────────────────────────────────────────
# Top-level error handler — catches anything the per-section blocks didn't.
# Each branch is dedicated so the message tells you exactly which class of
# failure occurred.
# ────────────────────────────────────────────────────────────
begin
  turbowebhooks_crud_example
  puts "\n✓ CRUD walkthrough complete."
rescue TurboDocxSdk::AuthenticationError => e
  puts "\n[401] Authentication failed: #{e.message}"
  puts "Check TURBODOCX_API_KEY. The webhook routes require an admin TDX- key."
  exit 1
rescue TurboDocxSdk::AuthorizationError => e
  puts "\n[403] Authorization failed: #{e.message}"
  puts "Webhook routes require the org administrator role."
  exit 1
rescue TurboDocxSdk::ValidationError => e
  puts "\n[400] Validation error: #{e.message}"
  exit 1
rescue TurboDocxSdk::NotFoundError => e
  puts "\n[404] Not found: #{e.message}"
  exit 1
rescue TurboDocxSdk::RateLimitError => e
  puts "\n[429] Rate limited: #{e.message}"
  exit 1
rescue TurboDocxSdk::ConflictError => e
  puts "\n[409] Conflict: #{e.message}"
  exit 1
rescue TurboDocxSdk::NetworkError => e
  puts "\n[network] Could not reach the backend: #{e.message}"
  exit 1
rescue TurboDocxSdk::TurboDocxError => e
  status_label = e.status_code.nil? ? "?" : e.status_code.to_s
  puts "\n[#{status_label}] #{e.message}"
  exit 1
end
