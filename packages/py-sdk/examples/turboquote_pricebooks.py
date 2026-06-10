"""
TurboQuote Example: Price Books

This example demonstrates price book management:
1. Create a pricebook type (category)
2. Create a price book with per-product overrides
3. Apply the price book to a quote
4. Browse pricebook products
5. Remove the price book and clean up

Optionally, send the quote with a TurboDocx deliverable attached:
  export DELIVERABLE_ID=your-deliverable-uuid

Set environment variables before running:
  export TURBODOCX_API_KEY=your-api-key
  export TURBODOCX_ORG_ID=your-org-uuid
"""

import asyncio
import os
from turbodocx_sdk import TurboQuote


async def main():
    TurboQuote.configure(
        api_key=os.getenv("TURBODOCX_API_KEY"),
        org_id=os.getenv("TURBODOCX_ORG_ID"),
    )

    type_id = None
    product_id = None
    pricebook_type_id = None
    pricebook_id = None
    company_id = None
    contact_id = None
    quote_id = None

    try:
        # 1. Create a product category and a product
        print("Setting up catalog...")
        product_category = await TurboQuote.create_type({
            "name": "SaaS — Pricebook Demo",
            "categoryType": "product_category",
        })
        type_id = product_category["id"]

        product = await TurboQuote.create_product({
            "name": "Enterprise Seat",
            "categoryId": type_id,
            "listPrice": 150.00,
            "billingFrequency": "monthly",
            "sku": "ENT-SEAT-001",
            "showInCatalog": True,
        })
        product_id = product["id"]
        print(f"Product: {product['name']} @ ${product['listPrice']:.2f}/mo")

        # 2. Create a pricebook type
        print("\nCreating pricebook type...")
        pb_type = await TurboQuote.create_type({
            "name": "Partner Pricing",
            "categoryType": "pricebook_type",
        })
        pricebook_type_id = pb_type["id"]
        print(f"Pricebook type: {pb_type['name']} (ID: {pricebook_type_id})")

        # 3. Create a price book with per-product pricing override
        print("\nCreating price book...")
        pricebook = await TurboQuote.create_price_book({
            "name": "Partner Tier A",
            "priceBookTypeId": pricebook_type_id,
            "validFrom": "2026-01-01",
            "validTo": "2026-12-31",
            "discountPercent": 20,
            "showInQuoteBuilder": True,
            "productPricing": [
                {
                    "productId": product_id,
                    "discountType": "percent",
                    "discountPercent": 25,
                },
            ],
        })
        pricebook_id = pricebook["id"]
        print(f"Price book: {pricebook['name']} (ID: {pricebook_id})")
        print(f"  Default discount: {pricebook['discountPercent']}%")

        # 4. List pricebook products to see the overrides
        pb_products = await TurboQuote.list_price_book_products(pricebook_id)
        print(f"  Products with custom pricing: {pb_products['totalRecords']}")

        # 5. Create a company, contact, and quote
        print("\nCreating company and quote...")
        company = await TurboQuote.create_company({
            "name": "Partner Corp (Pricebook Demo)",
            "contacts": [{"name": "Alice Partner", "email": "alice@partner-demo.example.com"}],
        })
        company_id = company["id"]
        contacts = await TurboQuote.list_company_contacts(company_id)
        contact_id = contacts["results"][0]["id"]

        quote = await TurboQuote.create_quote({
            "name": "Partner Renewal 2026",
            "companyId": company_id,
            "contactId": contact_id,
            "currency": "USD",
            "termDays": 365,
        })
        quote_id = quote["id"]
        print(f"Quote: {quote['quoteNumber']} (status: {quote['status']})")

        # 6. Add a line item manually
        await TurboQuote.add_line_items(quote_id, {
            "productId": product_id,
            "productName": product["name"],
            "unitPrice": 150.00,
            "billingFrequency": "monthly",
            "quantity": 20,
        })
        print("Added 20 seats at list price")

        # 7. Apply the price book — bulk-updates all matching line items
        print("\nApplying price book...")
        apply_result = await TurboQuote.apply_price_book(quote_id, pricebook_id)
        print(f"  Updated: {apply_result['updatedCount']} item(s)")
        print(f"  Skipped: {apply_result['skippedCount']} item(s)")
        print(f"  {apply_result['message']}")

        # 8. Check the updated quote totals
        updated_quote = await TurboQuote.get_quote(quote_id)
        print(f"\nUpdated quote subtotal (monthly): ${updated_quote.get('subtotalMonthly', 0):.2f}")

        # 9. Optionally send the quote with a deliverable attachment
        deliverable_id = os.getenv("DELIVERABLE_ID")
        if deliverable_id:
            print("\nSending quote with deliverable attachment...")
            send_result = await TurboQuote.send_quote_with_deliverable(quote_id, {
                "deliverableId": deliverable_id,
                "mergePosition": "end",
            })
            print(f"Sent! Document ID: {send_result['documentId']}")
            print(f"Status: {send_result['quote']['status']}")
        else:
            print("\n(Set DELIVERABLE_ID env var to test sendQuoteWithDeliverable)")

        # 10. Remove pricebook linkage from quote
        print("\nRemoving price book from quote...")
        await TurboQuote.remove_price_book(quote_id)
        print("Price book removed from quote")

    finally:
        print("\nCleaning up...")
        if quote_id:
            await TurboQuote.delete_quote(quote_id)
            print(f"Deleted quote {quote_id}")
        if contact_id:
            await TurboQuote.delete_contact(contact_id)
        if company_id:
            await TurboQuote.delete_company(company_id)
            print(f"Deleted company {company_id}")
        if pricebook_id:
            await TurboQuote.delete_price_book(pricebook_id)
            print(f"Deleted price book {pricebook_id}")
        if product_id:
            await TurboQuote.delete_product(product_id)
            print(f"Deleted product {product_id}")
        if pricebook_type_id:
            await TurboQuote.delete_type(pricebook_type_id)
        if type_id:
            await TurboQuote.delete_type(type_id)
            print(f"Deleted types")
        print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
