"""
TurboQuote Example: Products and Bundles Catalog

This example demonstrates catalog management:
1. Create a product category (type)
2. Create products in the catalog
3. Create a bundle from those products
4. List and browse the catalog
5. Add bundle items to a quote
6. Clean up all created resources

Set environment variables before running:
  export TURBODOCX_API_KEY=your-api-key
  export TURBODOCX_ORG_ID=your-org-uuid
"""

import asyncio
import os
from turbodocx_sdk import TurboQuote


async def main():
    # Configure once — no senderEmail needed for TurboQuote
    TurboQuote.configure(
        api_key=os.getenv("TURBODOCX_API_KEY"),
        org_id=os.getenv("TURBODOCX_ORG_ID"),
    )

    type_id = None
    product_a_id = None
    product_b_id = None
    bundle_id = None
    company_id = None
    contact_id = None
    quote_id = None

    try:
        # 1. Create a product category
        print("Creating product category...")
        category = await TurboQuote.create_type({
            "name": "SaaS — SDK Demo",
            "categoryType": "product_category",
        })
        type_id = category["id"]
        print(f"Category: {category['name']} (ID: {type_id})")

        # 2. Create products
        print("\nCreating products...")
        product_a = await TurboQuote.create_product({
            "name": "Starter Seat",
            "categoryId": type_id,
            "listPrice": 49.00,
            "billingFrequency": "monthly",
            "sku": "SEAT-STARTER-001",
            "description": "Single user seat — Starter tier",
            "showInCatalog": True,
        })
        product_a_id = product_a["id"]
        print(f"Product A: {product_a['name']} (ID: {product_a_id})")

        product_b = await TurboQuote.create_product({
            "name": "Professional Seat",
            "categoryId": type_id,
            "listPrice": 99.00,
            "billingFrequency": "monthly",
            "sku": "SEAT-PRO-001",
            "description": "Single user seat — Professional tier",
            "showInCatalog": True,
        })
        product_b_id = product_b["id"]
        print(f"Product B: {product_b['name']} (ID: {product_b_id})")

        # 3. Get primary images for multiple products at once
        print("\nFetching primary images...")
        images = await TurboQuote.get_product_primary_images([product_a_id, product_b_id])
        print(f"Primary images result: {images}")

        # 4. Create a bundle from the products
        print("\nCreating bundle...")
        bundle = await TurboQuote.create_bundle({
            "name": "Team Starter Pack",
            "categoryId": type_id,
            "description": "5 Starter seats + 1 Pro seat",
            "sku": "BUNDLE-TEAM-001",
            "bundleDiscountType": "percent",
            "bundleDiscountPercent": 10,
            "showItemsToEndUser": True,
            "showInCatalog": True,
            "currency": "USD",
            "items": [
                {
                    "productId": product_a_id,
                    "unitPrice": 49.00,
                    "quantity": 5,
                    "billingFrequency": "monthly",
                },
                {
                    "productId": product_b_id,
                    "unitPrice": 99.00,
                    "quantity": 1,
                    "billingFrequency": "monthly",
                },
            ],
        })
        bundle_id = bundle["id"]
        print(f"Bundle: {bundle['name']} (ID: {bundle_id})")
        print(f"  Total list price: ${bundle.get('totalListPrice', 0):.2f}/mo")

        # 5. List the catalog
        print("\nListing products (catalog)...")
        product_list = await TurboQuote.list_products({"showInCatalog": True, "limit": 10})
        print(f"  {product_list['totalRecords']} product(s) in catalog")

        bundle_list = await TurboQuote.list_bundles({"showInCatalog": True})
        print(f"  {bundle_list['totalRecords']} bundle(s) in catalog")

        # 6. Create a minimal company/contact/quote and add the bundle
        print("\nCreating demo quote with bundle...")
        company = await TurboQuote.create_company({
            "name": "Demo Co (Products Example)",
            "contacts": [{"name": "Demo User", "email": "demo@example.com"}],
        })
        company_id = company["id"]
        contacts = await TurboQuote.list_company_contacts(company_id)
        contact_id = contacts["results"][0]["id"]

        quote = await TurboQuote.create_quote({
            "name": "Team Starter Quote",
            "companyId": company_id,
            "contactId": contact_id,
        })
        quote_id = quote["id"]

        bundle_items = await TurboQuote.add_bundle_line_items(quote_id, {
            "bundleId": bundle_id,
            "bundleName": bundle["name"],
            "quantity": 2,
            "discountType": "percent",
            "discountPercent": 5,
        })
        print(f"Added bundle line item: {bundle_items[0]['bundleName']}")

    finally:
        # Clean up in dependency order
        print("\nCleaning up...")
        if quote_id:
            await TurboQuote.delete_quote(quote_id)
            print(f"Deleted quote {quote_id}")
        if contact_id:
            await TurboQuote.delete_contact(contact_id)
        if company_id:
            await TurboQuote.delete_company(company_id)
            print(f"Deleted company {company_id}")
        if bundle_id:
            await TurboQuote.delete_bundle(bundle_id)
            print(f"Deleted bundle {bundle_id}")
        if product_b_id:
            await TurboQuote.delete_product(product_b_id)
        if product_a_id:
            await TurboQuote.delete_product(product_a_id)
            print(f"Deleted products")
        if type_id:
            await TurboQuote.delete_type(type_id)
            print(f"Deleted category {type_id}")
        print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
