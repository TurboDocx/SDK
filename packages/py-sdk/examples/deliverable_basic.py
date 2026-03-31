"""
Deliverable SDK - Basic Usage Example

This example demonstrates the complete deliverable workflow:
1. Configure the SDK
2. Generate a deliverable from a template
3. List deliverables
4. Get deliverable details
5. Download the source file and PDF
6. Update a deliverable
"""

import asyncio
import os

from turbodocx_sdk import Deliverable


async def main():
    # 1. Configure with your API credentials
    Deliverable.configure(
        api_key=os.environ["TURBODOCX_API_KEY"],
        org_id=os.environ["TURBODOCX_ORG_ID"],
    )

    # 2. Generate a deliverable from a template
    print("Generating deliverable...")
    created = await Deliverable.generate_deliverable(
        template_id="YOUR_TEMPLATE_ID",
        name="Employee Contract - John Smith",
        description="Employment contract for senior developer",
        variables=[
            {"placeholder": "{EmployeeName}", "text": "John Smith", "mimeType": "text"},
            {"placeholder": "{CompanyName}", "text": "TechCorp Solutions Inc.", "mimeType": "text"},
            {"placeholder": "{JobTitle}", "text": "Senior Software Engineer", "mimeType": "text"},
        ],
        tags=["hr", "contract", "employee"],
    )
    deliverable_id = created["results"]["deliverable"]["id"]
    print(f"Created deliverable: {deliverable_id}")

    # 3. List deliverables
    print("\nListing deliverables...")
    listing = await Deliverable.list_deliverables(
        limit=5,
        show_tags=True,
    )
    print(f"Found {listing['totalRecords']} deliverables")
    for d in listing["results"]:
        print(f"  - {d['name']} ({d['id']})")

    # 4. Get full details
    print("\nGetting deliverable details...")
    details = await Deliverable.get_deliverable_details(deliverable_id, show_tags=True)
    print(f"Name: {details['name']}")
    print(f"Template: {details.get('templateName')}")
    print(f"Variables: {len(details.get('variables', []))}")
    tags = details.get("tags", [])
    print(f"Tags: {', '.join(t['label'] for t in tags)}")

    # 5. Download files
    print("\nDownloading source file...")
    source_file = await Deliverable.download_source_file(deliverable_id)
    with open("contract.docx", "wb") as f:
        f.write(source_file)
    print("Saved contract.docx")

    print("Downloading PDF...")
    pdf_file = await Deliverable.download_pdf(deliverable_id)
    with open("contract.pdf", "wb") as f:
        f.write(pdf_file)
    print("Saved contract.pdf")

    # 6. Update the deliverable
    print("\nUpdating deliverable...")
    updated = await Deliverable.update_deliverable_info(
        deliverable_id,
        name="Employee Contract - John Smith (Final)",
        tags=["hr", "contract", "finalized"],
    )
    print(updated["message"])

    # 7. Delete the deliverable (soft delete)
    # deleted = await Deliverable.delete_deliverable(deliverable_id)
    # print(deleted["message"])

    print("\nDone!")


if __name__ == "__main__":
    asyncio.run(main())
