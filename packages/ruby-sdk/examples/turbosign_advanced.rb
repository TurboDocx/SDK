# frozen_string_literal: true

# Example 3: Review Link - Advanced Field Types
#
# This example demonstrates advanced field types and features:
# - Multiple field types: signature, date, text, checkbox, company, title
# - Readonly fields with default values
# - Required fields
# - Multiline text fields
#
# Use this when: You need complex forms with varied input types
#
# Set environment variables before running:
#   export TURBODOCX_API_KEY=your-api-key
#   export TURBODOCX_ORG_ID=your-org-uuid
#   export TURBODOCX_SENDER_EMAIL=support@yourcompany.com
#   export TURBODOCX_SENDER_NAME="Your Company Name"

require "stringio"
require "turbodocx_sdk"

# Configure TurboSign
TurboDocxSdk::TurboSign.configure(
  api_key:      ENV.fetch("TURBODOCX_API_KEY", "your-api-key-here"),
  org_id:       ENV.fetch("TURBODOCX_ORG_ID", "your-org-id-here"),
  sender_email: ENV.fetch("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"),
  sender_name:  ENV.fetch("TURBODOCX_SENDER_NAME", "Your Company Name")
)

begin
  # Read PDF file (raw bytes wrapped in an IO; a plain file path String also works)
  pdf_file = StringIO.new(File.binread("../../ExampleAssets/advanced-contract.pdf"))

  puts "Creating review link with advanced field types...\n\n"

  result = TurboDocxSdk::TurboSign.create_signature_review_link(
    "file"                => pdf_file,
    "documentName"        => "Advanced Contract",
    "documentDescription" => "Contract with advanced signature field features",
    "recipients"          => [
      {
        "name"         => "John Doe",
        "email"        => "john@example.com",
        "signingOrder" => 1
      }
    ],
    "fields"              => [
      # Signature field
      {
        "type"           => "signature",
        "recipientEmail" => "john@example.com",
        "template"       => {
          "anchor"    => "{signature}",
          "placement" => "replace",
          "size"      => { "width" => 100, "height" => 30 }
        }
      },
      # Date field
      {
        "type"           => "date",
        "recipientEmail" => "john@example.com",
        # pins a fixed date in MM/DD/YYYY; omit defaultValue to auto-fill the recipient's signing date
        "defaultValue"   => "12/31/2026",
        "template"       => {
          "anchor"    => "{date}",
          "placement" => "replace",
          "size"      => { "width" => 75, "height" => 30 }
        }
      },
      # Full name field
      {
        "type"           => "full_name",
        "recipientEmail" => "john@example.com",
        "template"       => {
          "anchor"    => "{printed_name}",
          "placement" => "replace",
          "size"      => { "width" => 100, "height" => 20 }
        }
      },
      # Readonly field with default value (pre-filled)
      {
        "type"           => "company",
        "recipientEmail" => "john@example.com",
        "defaultValue"   => "Acme Corporation",
        "isReadonly"     => true,
        "template"       => {
          "anchor"    => "{company}",
          "placement" => "replace",
          "size"      => { "width" => 100, "height" => 20 }
        }
      },
      # Required checkbox with default checked
      {
        "type"           => "checkbox",
        "recipientEmail" => "john@example.com",
        "defaultValue"   => "true",
        "required"       => true,
        "template"       => {
          "anchor"    => "{terms_checkbox}",
          "placement" => "replace",
          "size"      => { "width" => 20, "height" => 20 }
        }
      },
      # Title field
      {
        "type"           => "title",
        "recipientEmail" => "john@example.com",
        "template"       => {
          "anchor"    => "{title}",
          "placement" => "replace",
          "size"      => { "width" => 75, "height" => 30 }
        }
      },
      # Multiline text field
      {
        "type"           => "text",
        "recipientEmail" => "john@example.com",
        "isMultiline"    => true,
        "template"       => {
          "anchor"    => "{notes}",
          "placement" => "replace",
          "size"      => { "width" => 200, "height" => 50 }
        }
      },
      # Conditional (IF/THEN) fields
      # Controlling checkbox: carries a stable fieldKey that dependents reference
      {
        "type"           => "checkbox",
        "recipientEmail" => "john@example.com",
        "template"       => {
          "anchor"    => "{request_changes}",
          "placement" => "replace",
          "size"      => { "width" => 20, "height" => 20 }
        },
        "metadata"       => { "fieldKey" => "request_changes" }
      },
      # Dependent text field: hidden until the checkbox above is checked ("If checked, explain")
      {
        "type"           => "text",
        "recipientEmail" => "john@example.com",
        "isMultiline"    => true,
        "template"       => {
          "anchor"    => "{change_details}",
          "placement" => "replace",
          "size"      => { "width" => 200, "height" => 50 }
        },
        "metadata"       => {
          "conditional" => {
            "controllingFieldKey" => "request_changes",
            "operator"            => "is_checked",
            "action"              => "show"
          }
        }
      }
    ]
  )

  puts "Review link created!\n\n"
  puts "Document ID: #{result['documentId']}"
  puts "Status: #{result['status']}"
  puts "Preview URL: #{result['previewUrl']}"

  if result["recipients"]
    puts "\nRecipients:"
    result["recipients"].each do |recipient|
      puts "  #{recipient['name']} (#{recipient['email']}) - #{recipient['status'] || 'N/A'}"
    end
  end

  puts "\nNext steps:"
  puts "1. Review the document at the preview URL"
  puts "2. Send to recipients: TurboDocxSdk::TurboSign.send_signature(...)"
rescue TurboDocxSdk::TurboDocxError => e
  puts "Error: #{e.message}"
end
