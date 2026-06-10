# frozen_string_literal: true

# TurboQuote Example: Price Books
#
# This example demonstrates price book management:
# 1. Create a pricebook type (category)
# 2. Create a price book with per-product overrides
# 3. Apply the price book to a quote
# 4. Browse pricebook products
# 5. Remove the price book and clean up
#
# Optionally, send the quote with a TurboDocx deliverable attached:
#   export DELIVERABLE_ID=your-deliverable-uuid
#
# Set environment variables before running:
#   export TURBODOCX_API_KEY=your-api-key
#   export TURBODOCX_ORG_ID=your-org-uuid

require "turbodocx_sdk"

TurboDocxSdk::TurboQuote.configure(
  api_key: ENV["TURBODOCX_API_KEY"],
  org_id:  ENV["TURBODOCX_ORG_ID"]
)

type_id          = nil
product_id       = nil
pricebook_type_id = nil
pricebook_id     = nil
company_id       = nil
contact_id       = nil
quote_id         = nil

begin
  # 1. Create a product category and a product
  puts "Setting up catalog..."
  product_category = TurboDocxSdk::TurboQuote.create_type(
    "name"         => "SaaS -- Pricebook Demo",
    "categoryType" => TurboDocxSdk::CategoryType::PRODUCT_CATEGORY
  )
  type_id = product_category["id"]

  product = TurboDocxSdk::TurboQuote.create_product(
    "name"             => "Enterprise Seat",
    "categoryId"       => type_id,
    "listPrice"        => 150.00,
    "billingFrequency" => TurboDocxSdk::BillingFrequency::MONTHLY,
    "sku"              => "ENT-SEAT-001",
    "showInCatalog"    => true
  )
  product_id = product["id"]
  puts format("Product: %s @ $%.2f/mo", product["name"], product["listPrice"])

  # 2. Create a pricebook type
  puts "\nCreating pricebook type..."
  pb_type           = TurboDocxSdk::TurboQuote.create_type(
    "name"         => "Partner Pricing",
    "categoryType" => TurboDocxSdk::CategoryType::PRICEBOOK_TYPE
  )
  pricebook_type_id = pb_type["id"]
  puts "Pricebook type: #{pb_type['name']} (ID: #{pricebook_type_id})"

  # 3. Create a price book with per-product pricing override
  puts "\nCreating price book..."
  pricebook = TurboDocxSdk::TurboQuote.create_price_book(
    "name"               => "Partner Tier A",
    "priceBookTypeId"    => pricebook_type_id,
    "validFrom"          => "2026-01-01",
    "validTo"            => "2026-12-31",
    "discountPercent"    => 20,
    "showInQuoteBuilder" => true,
    "productPricing"     => [
      {
        "productId"    => product_id,
        "discountType" => TurboDocxSdk::DiscountType::PERCENT,
        "discountPercent" => 25
      }
    ]
  )
  pricebook_id = pricebook["id"]
  puts "Price book: #{pricebook['name']} (ID: #{pricebook_id})"
  puts "  Default discount: #{pricebook['discountPercent']}%"

  # 4. List pricebook products to see the overrides
  pb_products = TurboDocxSdk::TurboQuote.list_price_book_products(pricebook_id)
  puts "  Products with custom pricing: #{pb_products['totalRecords']}"

  # 5. Create a company, contact, and quote
  puts "\nCreating company and quote..."
  company    = TurboDocxSdk::TurboQuote.create_company(
    "name"     => "Partner Corp (Pricebook Demo)",
    "contacts" => [{ "name" => "Alice Partner", "email" => "alice@partner-demo.example.com" }]
  )
  company_id = company["id"]
  contacts   = TurboDocxSdk::TurboQuote.list_company_contacts(company_id)
  contact_id = contacts["results"][0]["id"]

  quote    = TurboDocxSdk::TurboQuote.create_quote(
    "name"      => "Partner Renewal 2026",
    "companyId" => company_id,
    "contactId" => contact_id,
    "currency"  => TurboDocxSdk::Currency::USD,
    "termDays"  => 365
  )
  quote_id = quote["id"]
  puts "Quote: #{quote['quoteNumber']} (status: #{quote['status']})"

  # 6. Add a line item manually
  TurboDocxSdk::TurboQuote.add_line_items(quote_id,
    "productId"        => product_id,
    "productName"      => product["name"],
    "unitPrice"        => 150.00,
    "billingFrequency" => TurboDocxSdk::BillingFrequency::MONTHLY,
    "quantity"         => 20
  )
  puts "Added 20 seats at list price"

  # 7. Apply the price book -- bulk-updates all matching line items
  puts "\nApplying price book..."
  apply_result = TurboDocxSdk::TurboQuote.apply_price_book(quote_id, pricebook_id)
  puts "  Updated: #{apply_result['updatedCount']} item(s)"
  puts "  Skipped: #{apply_result['skippedCount']} item(s)"
  puts "  #{apply_result['message']}"

  # 8. Check the updated quote totals
  updated_quote = TurboDocxSdk::TurboQuote.get_quote(quote_id)
  puts format("\nUpdated quote subtotal (monthly): $%.2f", updated_quote.fetch("subtotalMonthly", 0))

  # 9. Optionally send the quote with a deliverable attachment
  deliverable_id = ENV["DELIVERABLE_ID"]
  if deliverable_id
    puts "\nSending quote with deliverable attachment..."
    send_result = TurboDocxSdk::TurboQuote.send_quote_with_deliverable(quote_id,
      "deliverableId" => deliverable_id,
      "mergePosition" => "end"
    )
    puts "Sent! Document ID: #{send_result['documentId']}"
    puts "Status: #{send_result['quote']['status']}"
  else
    puts "\n(Set DELIVERABLE_ID env var to test send_quote_with_deliverable)"
  end

  # 10. Remove pricebook linkage from quote
  puts "\nRemoving price book from quote..."
  TurboDocxSdk::TurboQuote.remove_price_book(quote_id)
  puts "Price book removed from quote"

ensure
  puts "\nCleaning up..."
  if quote_id
    TurboDocxSdk::TurboQuote.delete_quote(quote_id)
    puts "Deleted quote #{quote_id}"
  end
  if contact_id
    TurboDocxSdk::TurboQuote.delete_contact(contact_id)
  end
  if company_id
    TurboDocxSdk::TurboQuote.delete_company(company_id)
    puts "Deleted company #{company_id}"
  end
  if pricebook_id
    TurboDocxSdk::TurboQuote.delete_price_book(pricebook_id)
    puts "Deleted price book #{pricebook_id}"
  end
  if product_id
    TurboDocxSdk::TurboQuote.delete_product(product_id)
    puts "Deleted product #{product_id}"
  end
  if pricebook_type_id
    TurboDocxSdk::TurboQuote.delete_type(pricebook_type_id)
  end
  if type_id
    TurboDocxSdk::TurboQuote.delete_type(type_id)
    puts "Deleted types"
  end
  puts "Done."
end
