"""
TurboQuote Example: Full Quote Lifecycle

This example demonstrates the complete TurboQuote flow:
1. Create a company and contact
2. Create a quote
3. Add product line items
4. Download the quote PDF
5. Send the quote
6. Clean up all created resources

Set environment variables before running:
  export TURBODOCX_API_KEY=your-api-key
  export TURBODOCX_ORG_ID=your-org-uuid
"""

import asyncio
import os
from turbodocx_sdk import TurboQuote


async def main():
    # 1. Configure the TurboQuote client (no senderEmail required)
    TurboQuote.configure(
        api_key=os.getenv("TURBODOCX_API_KEY"),
        org_id=os.getenv("TURBODOCX_ORG_ID"),
    )

    company_id = None
    contact_id = None
    quote_id = None

    try:
        # 2. Create a company with an initial contact
        print("Creating company...")
        company = await TurboQuote.create_company({
            "name": "Acme Corporation (SDK Demo)",
            "city": "Austin",
            "state": "TX",
            "country": "US",
            "contacts": [
                {
                    "name": "Jane Smith",
                    "email": "jane.smith@acme-demo.example.com",
                    "title": "VP of Engineering",
                }
            ],
        })
        company_id = company["id"]
        print(f"Created company: {company['name']} (ID: {company_id})")

        # 3. Fetch the contact that was created with the company
        contacts_resp = await TurboQuote.list_company_contacts(company_id)
        contact_id = contacts_resp["results"][0]["id"]
        print(f"Contact ID: {contact_id}\n")

        # 4. Create a quote
        print("Creating quote...")
        quote = await TurboQuote.create_quote({
            "name": "Enterprise Software License — Q3 2026",
            "companyId": company_id,
            "contactId": contact_id,
            "currency": "USD",
            "termDays": 30,
            "taxRate": 8.25,
        })
        quote_id = quote["id"]
        print(f"Created quote: {quote['quoteNumber']} (ID: {quote_id}, status: {quote['status']})\n")

        # 5. Add product line items
        print("Adding line items...")
        # Custom/ad-hoc line items (no catalog product): productId must be
        # present and explicitly None.
        line_items = await TurboQuote.add_line_items(quote_id, [
            {
                "productId": None,
                "productName": "Platform License",
                "unitPrice": 500.00,
                "billingFrequency": "monthly",
                "quantity": 10,
                "discountType": "percent",
                "discountPercent": 15,
            },
            {
                "productId": None,
                "productName": "Support Add-on",
                "unitPrice": 200.00,
                "billingFrequency": "monthly",
                "quantity": 1,
            },
        ])
        print(f"Added {len(line_items)} line item(s)")

        # 6. Fetch the updated quote to see totals
        quote = await TurboQuote.get_quote(quote_id)
        print(f"Quote subtotal (monthly): ${quote.get('subtotalMonthly', 0):.2f}")
        print(f"Quote grand total: ${quote.get('grandTotal', 0):.2f}\n")

        # 7. Download the quote PDF
        print("Downloading quote PDF...")
        pdf_bytes = await TurboQuote.download_quote_pdf(quote_id)
        output_path = f"/tmp/quote_{quote_id}.pdf"
        with open(output_path, "wb") as f:
            f.write(pdf_bytes)
        print(f"PDF saved to {output_path} ({len(pdf_bytes):,} bytes)\n")

        # 8. Send the quote (comment this out if you don't want to send email)
        # print("Sending quote...")
        # send_result = await TurboQuote.send_quote(quote_id)
        # print(f"Quote sent: {send_result['message']}")
        # print(f"New status: {send_result['quote']['status']}\n")

    finally:
        # 9. Clean up — delete in reverse order
        print("Cleaning up...")
        if quote_id:
            await TurboQuote.delete_quote(quote_id)
            print(f"Deleted quote {quote_id}")
        if contact_id:
            await TurboQuote.delete_contact(contact_id)
            print(f"Deleted contact {contact_id}")
        if company_id:
            await TurboQuote.delete_company(company_id)
            print(f"Deleted company {company_id}")
        print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
