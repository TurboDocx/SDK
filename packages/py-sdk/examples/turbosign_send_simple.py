"""
Example 1: Send Signature Directly - Template Anchors

This example sends a document directly to recipients for signature.
Uses template anchors like {signature1} and {date1} in your PDF.

Use this when: You want to send immediately without review
"""

import asyncio
import os
from turbodocx_sdk import TurboSign

async def send_directly_example():
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

        print("Sending document directly to recipients...\n")

        result = await TurboSign.send_signature(
            file=pdf_file,
            document_name="Partnership Agreement",
            document_description="Q1 2025 Partnership Agreement - Please review and sign",
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
                # First recipient's fields - using template anchors
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
                        "anchor": "{signature1}",       # Text in your PDF to replace
                        "placement": "replace",          # Replace the anchor text
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
                # Second recipient's fields
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

        print("✅ Document sent successfully!\n")
        print(f"Document ID: {result['documentId']}")
        print(f"Message: {result['message']}")

        # To get sign URLs and recipient details, use get_status
        try:
            status = await TurboSign.get_status(result['documentId'])
            if status.get('recipients'):
                print("\nSign URLs:")
                for recipient in status['recipients']:
                    print(f"  {recipient['name']}: {recipient.get('signUrl', 'N/A')}")
        except Exception as status_error:
            print("\nNote: Could not fetch recipient sign URLs")

    except Exception as error:
        print(f"Error: {error}")

# Run the example
if __name__ == "__main__":
    asyncio.run(send_directly_example())
