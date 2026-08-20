# frozen_string_literal: true

# TurboQuote Example: Quote Renaming & Duplicate Naming
#
# A small, self-contained app that asserts the naming contract documented in
# docs/SDKs/quote-ruby.md. It creates everything it needs and cleans up after itself.
#
# What it proves:
# - `name` is trimmed on create_quote and update_quote; whitespace-only is a 400
# - the 255-character limit is applied AFTER trimming
# - duplicate_quote names the copy `Copy of <source>`, truncated to 255
# - renaming is draft-only — a sent quote refuses the rename
#
# Row ids (S20, S29, ...) refer to docs/QUOTE_RENAME_SDK_TEST_PLAN.md, so a failure here
# can be quoted straight into that plan.
#
# Send-dependent checks (S72) need an org whose quote template has a sender name + email.
# They are skipped unless RUN_SEND_CHECKS=1, and reported as skipped rather than passed.
#
# Set environment variables before running:
#   export TURBODOCX_API_KEY=your-api-key
#   export TURBODOCX_ORG_ID=your-org-uuid
#
# Run: ruby examples/quote-rename/main.rb

require "turbodocx_sdk"

RESULTS = []

def record(row_id, description, passed, detail)
  RESULTS << { id: row_id, description: description, outcome: passed ? :pass : :fail, detail: detail }
  puts "  #{passed ? 'PASS' : 'FAIL'}  #{row_id}  #{description}\n        #{detail}"
end

def skip(row_id, description, reason)
  RESULTS << { id: row_id, description: description, outcome: :skip, detail: reason }
  puts "  SKIP  #{row_id}  #{description}\n        #{reason}"
end

# Runs a call expected to fail validation and reports the status code it produced.
def expect_rejection(row_id, description)
  yield
  record(row_id, description, false, "the call SUCCEEDED — a 400 was expected")
rescue StandardError => e
  status_code = e.respond_to?(:status_code) ? e.status_code : nil
  record(row_id, description, status_code == 400, "status=#{status_code} message=#{e.message}")
end

TurboDocxSdk::TurboQuote.configure(
  api_key:  ENV["TURBODOCX_API_KEY"],
  org_id:   ENV["TURBODOCX_ORG_ID"],
  base_url: ENV.fetch("TURBODOCX_BASE_URL", "https://api.turbodocx.com")
)

created_quote_ids = []
company_id = nil
contact_id = nil
any_failed = false

begin
  # =============================================
  # 1. SET UP — a company and contact to hang quotes off
  #    (TurboQuoteHeader.companyId is NOT NULL, so this is mandatory)
  # =============================================
  puts "1. Creating company and contact...\n\n"

  company = TurboDocxSdk::TurboQuote.create_company(
    "name"     => "Rename Example Co #{(Time.now.to_f * 1000).to_i}",
    "country"  => "US",
    "contacts" => [{ "name" => "Dana Reed", "email" => "dana@rename-example.example.com" }]
  )
  company_id = company["id"]

  contact = TurboDocxSdk::TurboQuote.create_contact(
    "name"      => "Dana Reed",
    "companyId" => company_id,
    "email"     => "dana@rename-example.example.com"
  )
  contact_id = contact["id"]

  new_quote = lambda do |name|
    quote = TurboDocxSdk::TurboQuote.create_quote(
      "name" => name, "companyId" => company_id, "contactId" => contact_id
    )
    created_quote_ids << quote["id"]
    quote
  end

  # =============================================
  # 2. TRIMMING ON CREATE
  # =============================================
  puts "\n2. Trimming on create\n\n"

  padded = new_quote.call("  Acme Q3  ")
  record("S20", "create_quote trims leading/trailing whitespace",
         padded["name"] == "Acme Q3", "name=#{padded['name'].inspect}")

  interior = new_quote.call("Acme  Corp")
  record("S44", "interior whitespace is preserved (trim is not a normalise)",
         interior["name"] == "Acme  Corp", "name=#{interior['name'].inspect}")

  unicode_quote = new_quote.call("案件 🚀 Ünïcode")
  record("S31", "unicode and emoji survive round-trip",
         unicode_quote["name"] == "案件 🚀 Ünïcode", "name=#{unicode_quote['name'].inspect}")

  expect_rejection("S22", "whitespace-only name is rejected on create") do
    TurboDocxSdk::TurboQuote.create_quote(
      "name" => "   ", "companyId" => company_id, "contactId" => contact_id
    )
  end

  expect_rejection("S24", "tab/newline-only name is rejected on create") do
    TurboDocxSdk::TurboQuote.create_quote(
      "name" => "\t\n", "companyId" => company_id, "contactId" => contact_id
    )
  end

  expect_rejection("S25", "empty name is rejected on create") do
    TurboDocxSdk::TurboQuote.create_quote(
      "name" => "", "companyId" => company_id, "contactId" => contact_id
    )
  end

  # =============================================
  # 3. LENGTH BOUNDARIES — the limit applies AFTER trimming
  # =============================================
  puts "\n3. Length boundaries\n\n"

  at_limit = new_quote.call("A" * 255)
  record("S26", "255 characters is accepted (inclusive maximum)",
         at_limit["name"].length == 255, "length=#{at_limit['name'].length}")

  expect_rejection("S27", "256 characters is rejected") do
    TurboDocxSdk::TurboQuote.create_quote(
      "name" => "A" * 256, "companyId" => company_id, "contactId" => contact_id
    )
  end

  padded_to_limit = new_quote.call("  #{'B' * 255}  ")
  record("S28", "255 chars wrapped in whitespace is accepted — trim runs before the length check",
         padded_to_limit["name"].length == 255, "length=#{padded_to_limit['name'].length}")

  # =============================================
  # 4. RENAMING A DRAFT
  # =============================================
  puts "\n4. Renaming a draft\n\n"

  source = new_quote.call("Acme Q3")
  renamed = TurboDocxSdk::TurboQuote.update_quote(source["id"], "name" => "Acme Q3 — Revised")
  record("S2", "update_quote renames a draft",
         renamed["name"] == "Acme Q3 — Revised", "name=#{renamed['name'].inspect}")

  trimmed = TurboDocxSdk::TurboQuote.update_quote(source["id"], "name" => "  Acme Q3 — Final  ")
  record("S21", "update_quote trims the new name",
         trimmed["name"] == "Acme Q3 — Final", "name=#{trimmed['name'].inspect}")

  expect_rejection("S23a", "whitespace-only name is rejected on update") do
    TurboDocxSdk::TurboQuote.update_quote(source["id"], "name" => "   ")
  end

  after_rejection = TurboDocxSdk::TurboQuote.get_quote(source["id"])
  record("S23b", "the rejected rename left the stored name untouched",
         after_rejection["name"] == "Acme Q3 — Final", "name=#{after_rejection['name'].inspect}")

  # =============================================
  # 5. DUPLICATE NAMING
  # =============================================
  puts "\n5. Duplicate naming\n\n"

  copy = TurboDocxSdk::TurboQuote.duplicate_quote(source["id"])
  created_quote_ids << copy["id"]
  record("S3", 'duplicate_quote prefixes the copy with "Copy of "',
         copy["name"] == "Copy of Acme Q3 — Final", "name=#{copy['name'].inspect}")

  record("S13", "the copy is built from the CURRENT name, not the name at creation",
         !copy["name"].include?("Revised") && copy["name"].include?("Final"),
         "source was renamed twice; copy=#{copy['name'].inspect}")

  copy_of_copy = TurboDocxSdk::TurboQuote.duplicate_quote(copy["id"])
  created_quote_ids << copy_of_copy["id"]
  record("S30", "duplicating a copy genuinely stacks the prefix (unlike a renewal)",
         copy_of_copy["name"] == "Copy of #{copy['name']}", "name=#{copy_of_copy['name'].inspect}")

  long_source = new_quote.call("C" * 255)
  long_copy = TurboDocxSdk::TurboQuote.duplicate_quote(long_source["id"])
  created_quote_ids << long_copy["id"]
  record("S29", "a copy of a 255-char name is truncated to 255, so the insert cannot overflow",
         long_copy["name"].length == 255 && long_copy["name"].start_with?("Copy of "),
         "length=#{long_copy['name'].length} prefix=#{long_copy['name'][0, 12].inspect}")

  # =============================================
  # 6. RENAME IS DRAFT-ONLY
  # =============================================
  puts "\n6. Rename is draft-only\n\n"

  if ENV["RUN_SEND_CHECKS"] == "1"
    to_send = new_quote.call("Sent Quote Rename Check")
    TurboDocxSdk::TurboQuote.send_quote(to_send["id"])
    expect_rejection("S72", "a sent quote refuses a rename") do
      TurboDocxSdk::TurboQuote.update_quote(to_send["id"], "name" => "Renamed After Send")
    end
  else
    skip("S72", "a sent quote refuses a rename",
         "set RUN_SEND_CHECKS=1 with a send-capable org " \
         "(sender name + email on the org quote template)")
  end

  # =============================================
  # 7. SUMMARY
  # =============================================
  passed  = RESULTS.count { |r| r[:outcome] == :pass }
  failed  = RESULTS.count { |r| r[:outcome] == :fail }
  skipped = RESULTS.count { |r| r[:outcome] == :skip }

  puts "\n#{'=' * 60}"
  puts "  #{passed} passed · #{failed} failed · #{skipped} skipped"
  puts "#{'=' * 60}\n\n"

  if failed.positive?
    puts "Failed rows:"
    RESULTS.select { |r| r[:outcome] == :fail }.each do |result|
      puts "  #{result[:id]}  #{result[:description]} — #{result[:detail]}"
    end
    # Recorded rather than exited here, so the ensure block still cleans up before we quit.
    any_failed = true
  end
ensure
  # =============================================
  # CLEANUP — leave the org as we found it
  # =============================================
  puts "\nCleaning up..."
  created_quote_ids.each do |quote_id|
    begin
      TurboDocxSdk::TurboQuote.delete_quote(quote_id)
    rescue StandardError # cleanup is best-effort
      nil
    end
  end
  begin
    TurboDocxSdk::TurboQuote.delete_contact(contact_id) if contact_id
  rescue StandardError
    nil
  end
  begin
    TurboDocxSdk::TurboQuote.delete_company(company_id) if company_id
  rescue StandardError
    nil
  end
  puts "Done."
end

exit 1 if any_failed
