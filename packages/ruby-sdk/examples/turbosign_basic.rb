# frozen_string_literal: true

# Example 2: Review Link - Template Anchors
#
# This example creates a review link first, then sends manually.
# Uses template anchors like {signature1} and {date1} in your PDF.
#
# Use this when: You want to review the document before sending
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
  pdf_file = StringIO.new(File.binread("../../ExampleAssets/sample-contract.pdf"))

  puts "Creating review link with template anchors...\n\n"

  result = TurboDocxSdk::TurboSign.create_signature_review_link(
    "file"                => pdf_file,
    "documentName"        => "Contract Agreement",
    "documentDescription" => "This document requires electronic signatures from both parties.",
    "recipients"          => [
      {
        "name"         => "John Doe",
        "email"        => "john@example.com",
        "signingOrder" => 1
      },
      {
        "name"         => "Jane Smith",
        "email"        => "jane@example.com",
        "signingOrder" => 2
      }
    ],
    "fields"              => [
      # First recipient - using template anchors
      {
        "type"           => "full_name",
        "recipientEmail" => "john@example.com",
        "template"       => {
          "anchor"    => "{name1}",
          "placement" => "replace",
          "size"      => { "width" => 100, "height" => 30 }
        }
      },
      {
        "type"           => "signature",
        "recipientEmail" => "john@example.com",
        "template"       => {
          "anchor"    => "{signature1}",
          "placement" => "replace",
          "size"      => { "width" => 100, "height" => 30 }
        }
      },
      {
        "type"           => "date",
        "recipientEmail" => "john@example.com",
        "template"       => {
          "anchor"    => "{date1}",
          "placement" => "replace",
          "size"      => { "width" => 75, "height" => 30 }
        }
      },
      # Second recipient
      {
        "type"           => "full_name",
        "recipientEmail" => "jane@example.com",
        "template"       => {
          "anchor"    => "{name2}",
          "placement" => "replace",
          "size"      => { "width" => 100, "height" => 30 }
        }
      },
      {
        "type"           => "signature",
        "recipientEmail" => "jane@example.com",
        "template"       => {
          "anchor"    => "{signature2}",
          "placement" => "replace",
          "size"      => { "width" => 100, "height" => 30 }
        }
      },
      {
        "type"           => "date",
        "recipientEmail" => "jane@example.com",
        "template"       => {
          "anchor"    => "{date2}",
          "placement" => "replace",
          "size"      => { "width" => 75, "height" => 30 }
        }
      }
    ]
  )

  puts "\nReview link created!"
  puts "Document ID: #{result['documentId']}"
  puts "Status: #{result['status']}"
  puts "Preview URL: #{result['previewUrl']}"

  if result["recipients"]
    puts "\nRecipients:"
    result["recipients"].each do |recipient|
      puts "  #{recipient['name']} (#{recipient['email']}) - #{recipient['status'] || 'N/A'}"
    end
  end

  puts "\nYou can now:"
  puts "1. Review the document at the preview URL"
  puts "2. Send to recipients using: TurboDocxSdk::TurboSign.send_signature(...)"
rescue TurboDocxSdk::TurboDocxError => e
  puts "Error: #{e.message}"
end
