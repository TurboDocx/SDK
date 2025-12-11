"""
Example 2: Review Link - Template Anchors

This example creates a review link first, then sends manually.
Uses template anchors like {signature1} and {date1} in your PDF.

Use this when: You want to review the document before sending
"""

import asyncio
import os
from turbodocx_sdk import TurboSign

async def review_link_example():
    # Configure TurboSign
    TurboSign.configure(
        api_key=os.getenv("TURBODOCX_API_KEY", "your-api-key-here"),
        org_id=os.getenv("TURBODOCX_ORG_ID", "your-org-id-here"),
        sender_email=os.getenv("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"),
        sender_name=os.getenv("TURBODOCX_SENDER_NAME", "Your Company Name")
    )

    try:
        # Read PDF file
        with open("../../ExampleAssets/sample-contract.pdf", "rb") as f:
            pdf_file = f.read()

        print("Creating review link with template anchors...\n")

        result = await TurboSign.create_signature_review_link(
            file=pdf_file,
            document_name="Contract Agreement",
            document_description="This document requires electronic signatures from both parties.",
            recipients=[
                {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "signingOrder": 1
                },
                {
                    "name": "Jane Smith",
                    "email": "jane@example.com",
                    "signingOrder": 2
                }
            ],
            fields=[
                # First recipient - using template anchors
                {
                    "type": "full_name",
                    "recipientEmail": "john@example.com",
                    "template": {
                        "anchor": "{name1}",
                        "placement": "replace",
                        "size": {"width": 100, "height": 30}
                    }
                },
                {
                    "type": "signature",
                    "recipientEmail": "john@example.com",
                    "template": {
                        "anchor": "{signature1}",
                        "placement": "replace",
                        "size": {"width": 100, "height": 30}
                    }
                },
                {
                    "type": "date",
                    "recipientEmail": "john@example.com",
                    "template": {
                        "anchor": "{date1}",
                        "placement": "replace",
                        "size": {"width": 75, "height": 30}
                    }
                },
                # Second recipient
                {
                    "type": "full_name",
                    "recipientEmail": "jane@example.com",
                    "template": {
                        "anchor": "{name2}",
                        "placement": "replace",
                        "size": {"width": 100, "height": 30}
                    }
                },
                {
                    "type": "signature",
                    "recipientEmail": "jane@example.com",
                    "template": {
                        "anchor": "{signature2}",
                        "placement": "replace",
                        "size": {"width": 100, "height": 30}
                    }
                },
                {
                    "type": "date",
                    "recipientEmail": "jane@example.com",
                    "template": {
                        "anchor": "{date2}",
                        "placement": "replace",
                        "size": {"width": 75, "height": 30}
                    }
                }
            ]
        )

        print("\n✅ Review link created!")
        print(f"Document ID: {result['documentId']}")
        print(f"Status: {result['status']}")
        print(f"Preview URL: {result['previewUrl']}")

        if result.get('recipients'):
            print("\nRecipients:")
            for recipient in result['recipients']:
                print(f"  {recipient['name']} ({recipient['email']}) - {recipient.get('status', 'N/A')}")

        print("\nYou can now:")
        print("1. Review the document at the preview URL")
        print("2. Send to recipients using: await TurboSign.send(document_id)")

    except Exception as error:
        print(f"Error: {error}")

# Run the example
if __name__ == "__main__":
    asyncio.run(review_link_example())
