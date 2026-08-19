# frozen_string_literal: true

# Example: Conditional (IF/THEN) Fields
#
# A checkbox can control other fields so signers only see what applies to them:
#   - Give a "checkbox" field a stable metadata.fieldKey.
#   - Give a dependent field a metadata.conditional rule that references that key.
#       operator: "is_checked" | "is_not_checked"  -- when the rule fires.
#       action:   "show"   (hidden until the rule fires)
#                 "unlock" (visible but read-only until the rule fires).
#
# One checkbox can drive any number of dependent fields -- give them the same
# controllingFieldKey. Uses create_signature_review_link (no emails are sent).
#
# Set environment variables before running:
#   export TURBODOCX_API_KEY=your-api-key
#   export TURBODOCX_ORG_ID=your-org-uuid
#   export TURBODOCX_SENDER_EMAIL=support@yourcompany.com
#   export TURBODOCX_SENDER_NAME="Your Company Name"

require "stringio"
require "turbodocx_sdk"

TurboDocxSdk::TurboSign.configure(
  api_key:      ENV.fetch("TURBODOCX_API_KEY", "your-api-key-here"),
  org_id:       ENV.fetch("TURBODOCX_ORG_ID", "your-org-id-here"),
  sender_email: ENV.fetch("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"),
  sender_name:  ENV.fetch("TURBODOCX_SENDER_NAME", "Your Company Name")
)

begin
  pdf_file = StringIO.new(File.binread("../../ExampleAssets/advanced-contract.pdf"))

  puts "Creating a review link with conditional fields...\n\n"

  # NOTE: keys inside a field hash stay camelCase -- they are sent to the API verbatim.
  result = TurboDocxSdk::TurboSign.create_signature_review_link(
    "file"         => pdf_file,
    "documentName" => "Conditional Fields Demo",
    "recipients"   => [{ "name" => "John Doe", "email" => "john@example.com", "signingOrder" => 1 }],
    "fields"       => [
      # Controlling checkboxes -- each carries a stable fieldKey.
      { "type" => "checkbox", "recipientEmail" => "john@example.com", "page" => 1, "x" => 60, "y" => 120, "width" => 20, "height" => 20, "metadata" => { "fieldKey" => "request_changes" } },
      { "type" => "checkbox", "recipientEmail" => "john@example.com", "page" => 1, "x" => 60, "y" => 300, "width" => 20, "height" => 20, "metadata" => { "fieldKey" => "override_amount" } },
      { "type" => "checkbox", "recipientEmail" => "john@example.com", "page" => 1, "x" => 60, "y" => 480, "width" => 20, "height" => 20, "metadata" => { "fieldKey" => "consent" } },

      # show + is_checked -- HIDDEN until "request_changes" is checked.
      { "type" => "text", "recipientEmail" => "john@example.com", "page" => 1, "x" => 120, "y" => 120, "width" => 260, "height" => 40, "defaultValue" => "",
        "metadata" => { "conditional" => { "controllingFieldKey" => "request_changes", "operator" => "is_checked", "action" => "show" } } },
      # ONE checkbox driving a SECOND dependent (same controllingFieldKey) -- a signature.
      { "type" => "signature", "recipientEmail" => "john@example.com", "page" => 1, "x" => 120, "y" => 180, "width" => 200, "height" => 50,
        "metadata" => { "conditional" => { "controllingFieldKey" => "request_changes", "operator" => "is_checked", "action" => "show" } } },

      # unlock + is_checked -- VISIBLE but locked until "override_amount" is checked.
      { "type" => "text", "recipientEmail" => "john@example.com", "page" => 1, "x" => 120, "y" => 300, "width" => 150, "height" => 30, "defaultValue" => "1000.00",
        "metadata" => { "conditional" => { "controllingFieldKey" => "override_amount", "operator" => "is_checked", "action" => "unlock" } } },

      # show + is_not_checked -- a "please explain" box shown only while consent is WITHHELD.
      { "type" => "text", "recipientEmail" => "john@example.com", "page" => 1, "x" => 120, "y" => 480, "width" => 260, "height" => 40, "defaultValue" => "",
        "metadata" => { "conditional" => { "controllingFieldKey" => "consent", "operator" => "is_not_checked", "action" => "show" } } },

      # A normal required signature with no rule -- always visible, always required.
      { "type" => "signature", "recipientEmail" => "john@example.com", "page" => 1, "x" => 120, "y" => 620, "width" => 200, "height" => 50, "required" => true }
    ]
  )

  puts "✅ Review link created!\n\n"
  puts "Document ID: #{result['documentId']}"
  puts "Preview URL: #{result['previewUrl']}"

  # Validation: a malformed rule (unknown operator/action, or a missing/empty controllingFieldKey)
  #   is rejected with HTTP 400 and code "InvalidConditionalRule" (raised as a ValidationError).
  # Fail-open: a well-formed rule whose controllingFieldKey matches NO checkbox is NOT an error --
  #   the dependent field simply stays visible/editable. Double-check your keys match exactly.
rescue StandardError => e
  puts "Error: #{e.message}"
end
