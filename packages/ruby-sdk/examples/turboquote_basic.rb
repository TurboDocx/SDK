# frozen_string_literal: true

# TurboQuote Example: Full Quote Lifecycle
#
# This example demonstrates the complete TurboQuote flow:
# 1. Create a company and contact
# 2. Create a quote
# 3. Add product line items
# 4. Download the quote PDF
# 5. Send the quote
# 6. Clean up all created resources
#
# Set environment variables before running:
#   export TURBODOCX_API_KEY=your-api-key
#   export TURBODOCX_ORG_ID=your-org-uuid

require "turbodocx_sdk"

TurboDocxSdk::TurboQuote.configure(
  api_key: ENV["TURBODOCX_API_KEY"],
  org_id:  ENV["TURBODOCX_ORG_ID"]
)

company_id = nil
contact_id = nil
quote_id   = nil

begin
  # 1. Create a company with an initial contact
  puts "Creating company..."
  company    = TurboDocxSdk::TurboQuote.create_company(
    "name"     => "Acme Corporation (SDK Demo)",
    "city"     => "Austin",
    "state"    => "TX",
    "country"  => "US",
    "contacts" => [
      {
        "name"  => "Jane Smith",
        "email" => "jane.smith@acme-demo.example.com",
        "title" => "VP of Engineering"
      }
    ]
  )
  company_id = company["id"]
  puts "Created company: #{company['name']} (ID: #{company_id})"

  # 2. Fetch the contact created with the company
  contacts_resp = TurboDocxSdk::TurboQuote.list_company_contacts(company_id)
  contact_id    = contacts_resp["results"][0]["id"]
  puts "Contact ID: #{contact_id}\n\n"

  # 3. Create a quote
  puts "Creating quote..."
  quote    = TurboDocxSdk::TurboQuote.create_quote(
    "name"      => "Enterprise Software License — Q3 2026",
    "companyId" => company_id,
    "contactId" => contact_id,
    "currency"  => "USD",
    "termDays"  => 30,
    "taxRate"   => 8.25
  )
  quote_id = quote["id"]
  puts "Created quote: #{quote['quoteNumber']} (ID: #{quote_id}, status: #{quote['status']})\n\n"

  # 4. Add product line items
  puts "Adding line items..."
  line_items = TurboDocxSdk::TurboQuote.add_line_items(quote_id, [
    {
      "productId"        => nil,
      "productName"      => "Platform License",
      "unitPrice"        => 500.00,
      "billingFrequency" => "monthly",
      "quantity"         => 10,
      "discountType"     => TurboDocxSdk::DiscountType::PERCENT,
      "discountPercent"  => 15
    },
    {
      "productId"        => nil,
      "productName"      => "Support Add-on",
      "unitPrice"        => 200.00,
      "billingFrequency" => "monthly",
      "quantity"         => 1
    }
  ])
  puts "Added #{line_items.length} line item(s)"

  # 5. Fetch the updated quote to see totals
  quote = TurboDocxSdk::TurboQuote.get_quote(quote_id)
  puts format("Quote subtotal (monthly): $%.2f", quote.fetch("subtotalMonthly", 0))
  puts format("Quote grand total: $%.2f\n\n", quote.fetch("grandTotal", 0))

  # 6. Download the quote PDF
  puts "Downloading quote PDF..."
  pdf_bytes   = TurboDocxSdk::TurboQuote.download_quote_pdf(quote_id)
  output_path = "/tmp/quote_#{quote_id}.pdf"
  File.binwrite(output_path, pdf_bytes)
  puts "PDF saved to #{output_path} (#{pdf_bytes.bytesize} bytes)\n\n"

  # 7. Send the quote (uncomment if you want to send the email)
  # puts "Sending quote..."
  # send_result = TurboDocxSdk::TurboQuote.send_quote(quote_id)
  # puts "Quote sent: #{send_result['message']}"
  # puts "New status: #{send_result['quote']['status']}\n\n"

ensure
  # 8. Clean up — delete in reverse order
  puts "Cleaning up..."
  if quote_id
    TurboDocxSdk::TurboQuote.delete_quote(quote_id)
    puts "Deleted quote #{quote_id}"
  end
  if contact_id
    TurboDocxSdk::TurboQuote.delete_contact(contact_id)
    puts "Deleted contact #{contact_id}"
  end
  if company_id
    TurboDocxSdk::TurboQuote.delete_company(company_id)
    puts "Deleted company #{company_id}"
  end
  puts "Done."
end
