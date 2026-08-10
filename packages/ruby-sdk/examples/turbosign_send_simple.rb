# frozen_string_literal: true

# Example 1: Send Signature Directly - Template Anchors
#
# This example sends a document directly to recipients for signature.
# Uses template anchors like {signature1} and {date1} in your PDF.
#
# Use this when: You want to send immediately without review
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

  puts "Sending document directly to recipients...\n\n"

  result = TurboDocxSdk::TurboSign.send_signature(
    "file"                => pdf_file,
    "documentName"        => "Partnership Agreement",
    "documentDescription" => "Q1 2025 Partnership Agreement - Please review and sign",
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
      # First recipient's fields - using template anchors
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
          "anchor"    => "{signature1}",       # Text in your PDF to replace
          "placement" => "replace",            # Replace the anchor text
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
      # Second recipient's fields
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

  puts "Document sent successfully!\n\n"
  puts "Document ID: #{result['documentId']}"
  puts "Message: #{result['message']}"

  # Signing links are emailed to recipients — they are not returned by the API.
  # get_recipients reports who has signed and who you are still waiting on.
  begin
    progress = TurboDocxSdk::TurboSign.get_recipients(result["documentId"])
    summary = progress["summary"]
    puts "\n#{summary['completed']} of #{summary['total']} signed, " \
         "still waiting on #{summary['waitingOn']}"
    progress["recipients"].each do |recipient|
      puts "  #{recipient['name']} <#{recipient['email']}>: #{recipient['effectiveStatus']}"
    end
  rescue TurboDocxSdk::TurboDocxError
    puts "\nNote: Could not fetch recipient status"
  end
rescue TurboDocxSdk::TurboDocxError => e
  puts "Error: #{e.message}"
end
