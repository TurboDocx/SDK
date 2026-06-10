# frozen_string_literal: true

# TurboQuote Example: Products and Bundles Catalog
#
# This example demonstrates catalog management:
# 1. Create a product category (type)
# 2. Create products in the catalog
# 3. Create a bundle from those products
# 4. List and browse the catalog
# 5. Add bundle items to a quote
# 6. Clean up all created resources
#
# Set environment variables before running:
#   export TURBODOCX_API_KEY=your-api-key
#   export TURBODOCX_ORG_ID=your-org-uuid

require "turbodocx_sdk"

# Configure once — no senderEmail needed for TurboQuote
TurboDocxSdk::TurboQuote.configure(
  api_key: ENV["TURBODOCX_API_KEY"],
  org_id:  ENV["TURBODOCX_ORG_ID"]
)

type_id       = nil
product_a_id  = nil
product_b_id  = nil
bundle_id     = nil
company_id    = nil
contact_id    = nil
quote_id      = nil

begin
  # 1. Create a product category
  puts "Creating product category..."
  category = TurboDocxSdk::TurboQuote.create_type(
    "name"         => "SaaS -- SDK Demo",
    "categoryType" => TurboDocxSdk::CategoryType::PRODUCT_CATEGORY
  )
  type_id = category["id"]
  puts "Category: #{category['name']} (ID: #{type_id})"

  # 2. Create products
  puts "\nCreating products..."
  product_a = TurboDocxSdk::TurboQuote.create_product(
    "name"             => "Starter Seat",
    "categoryId"       => type_id,
    "listPrice"        => 49.00,
    "billingFrequency" => TurboDocxSdk::BillingFrequency::MONTHLY,
    "sku"              => "SEAT-STARTER-001",
    "description"      => "Single user seat -- Starter tier",
    "showInCatalog"    => true
  )
  product_a_id = product_a["id"]
  puts "Product A: #{product_a['name']} (ID: #{product_a_id})"

  product_b = TurboDocxSdk::TurboQuote.create_product(
    "name"             => "Professional Seat",
    "categoryId"       => type_id,
    "listPrice"        => 99.00,
    "billingFrequency" => TurboDocxSdk::BillingFrequency::MONTHLY,
    "sku"              => "SEAT-PRO-001",
    "description"      => "Single user seat -- Professional tier",
    "showInCatalog"    => true
  )
  product_b_id = product_b["id"]
  puts "Product B: #{product_b['name']} (ID: #{product_b_id})"

  # 3. Get primary images for multiple products at once
  puts "\nFetching primary images..."
  images = TurboDocxSdk::TurboQuote.get_product_primary_images([product_a_id, product_b_id])
  puts "Primary images result: #{images}"

  # 4. Create a bundle from the products
  puts "\nCreating bundle..."
  bundle = TurboDocxSdk::TurboQuote.create_bundle(
    "name"                => "Team Starter Pack",
    "categoryId"          => type_id,
    "description"         => "5 Starter seats + 1 Pro seat",
    "sku"                 => "BUNDLE-TEAM-001",
    "bundleDiscountType"  => TurboDocxSdk::DiscountType::PERCENT,
    "bundleDiscountPercent" => 10,
    "showItemsToEndUser"  => true,
    "showInCatalog"       => true,
    "currency"            => TurboDocxSdk::Currency::USD,
    "items"               => [
      {
        "productId"        => product_a_id,
        "unitPrice"        => 49.00,
        "quantity"         => 5,
        "billingFrequency" => TurboDocxSdk::BillingFrequency::MONTHLY
      },
      {
        "productId"        => product_b_id,
        "unitPrice"        => 99.00,
        "quantity"         => 1,
        "billingFrequency" => TurboDocxSdk::BillingFrequency::MONTHLY
      }
    ]
  )
  bundle_id = bundle["id"]
  puts "Bundle: #{bundle['name']} (ID: #{bundle_id})"
  puts format("  Total list price: $%.2f/mo", bundle.fetch("totalListPrice", 0))

  # 5. List the catalog
  puts "\nListing products (catalog)..."
  product_list = TurboDocxSdk::TurboQuote.list_products("showInCatalog" => true, "limit" => 10)
  puts "  #{product_list['totalRecords']} product(s) in catalog"

  bundle_list = TurboDocxSdk::TurboQuote.list_bundles("showInCatalog" => true)
  puts "  #{bundle_list['totalRecords']} bundle(s) in catalog"

  # 6. Create a minimal company/contact/quote and add the bundle
  puts "\nCreating demo quote with bundle..."
  company = TurboDocxSdk::TurboQuote.create_company(
    "name"     => "Demo Co (Products Example)",
    "contacts" => [{ "name" => "Demo User", "email" => "demo@example.com" }]
  )
  company_id = company["id"]
  contacts   = TurboDocxSdk::TurboQuote.list_company_contacts(company_id)
  contact_id = contacts["results"][0]["id"]

  quote = TurboDocxSdk::TurboQuote.create_quote(
    "name"      => "Team Starter Quote",
    "companyId" => company_id,
    "contactId" => contact_id
  )
  quote_id = quote["id"]

  bundle_items = TurboDocxSdk::TurboQuote.add_bundle_line_items(quote_id,
    "bundleId"     => bundle_id,
    "bundleName"   => bundle["name"],
    "quantity"     => 2,
    "discountType" => TurboDocxSdk::DiscountType::PERCENT,
    "discountPercent" => 5
  )
  puts "Added bundle line item: #{bundle_items[0]['bundleName']}"

ensure
  # Clean up in dependency order
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
  if bundle_id
    TurboDocxSdk::TurboQuote.delete_bundle(bundle_id)
    puts "Deleted bundle #{bundle_id}"
  end
  if product_b_id
    TurboDocxSdk::TurboQuote.delete_product(product_b_id)
  end
  if product_a_id
    TurboDocxSdk::TurboQuote.delete_product(product_a_id)
    puts "Deleted products"
  end
  if type_id
    TurboDocxSdk::TurboQuote.delete_type(type_id)
    puts "Deleted category #{type_id}"
  end
  puts "Done."
end
