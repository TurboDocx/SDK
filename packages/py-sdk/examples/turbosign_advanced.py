"""
Example 3: Review Link - Advanced Field Types

This example demonstrates advanced field types and features:
- Multiple field types: signature, date, text, checkbox, company, title
- Readonly fields with default values
- Required fields
- Multiline text fields

Use this when: You need complex forms with varied input types
"""

import asyncio
import os
from turbodocx_sdk import TurboSign

async def advanced_fields_example():
    # Configure TurboSign
    TurboSign.configure(
        api_key=os.getenv("TURBODOCX_API_KEY", "your-api-key-here"),
        org_id=os.getenv("TURBODOCX_ORG_ID", "your-org-id-here"),
        sender_email=os.getenv("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"),
        sender_name=os.getenv("TURBODOCX_SENDER_NAME", "Your Company Name")
    )

    try:
        # Read PDF file
        with open("../../ExampleAssets/advanced-contract.pdf", "rb") as f:
            pdf_file = f.read()

        print("Creating review link with advanced field types...\n")

        result = await TurboSign.create_signature_review_link(
            file=pdf_file,
            document_name="Advanced Contract",
            document_description="Contract with advanced signature field features",
            recipients=[
                {
                    "name": "John Doe",
                    "email": "john@example.com",
                    "signingOrder": 1
                }
            ],
            fields=[
                # Signature field
                {
                    "type": "signature",
                    "recipientEmail": "john@example.com",
                    "template": {
                        "anchor": "{signature}",
                        "placement": "replace",
                        "size": {"width": 100, "height": 30}
                    }
                },
                # Date field
                {
                    "type": "date",
                    "recipientEmail": "john@example.com",
                    "template": {
                        "anchor": "{date}",
                        "placement": "replace",
                        "size": {"width": 75, "height": 30}
                    }
                },
                # Full name field
                {
                    "type": "full_name",
                    "recipientEmail": "john@example.com",
                    "template": {
                        "anchor": "{printed_name}",
                        "placement": "replace",
                        "size": {"width": 100, "height": 20}
                    }
                },
                # Readonly field with default value (pre-filled)
                {
                    "type": "company",
                    "recipientEmail": "john@example.com",
                    "defaultValue": "Acme Corporation",
                    "isReadonly": True,
                    "template": {
                        "anchor": "{company}",
                        "placement": "replace",
                        "size": {"width": 100, "height": 20}
                    }
                },
                # Required checkbox with default checked
                {
                    "type": "checkbox",
                    "recipientEmail": "john@example.com",
                    "defaultValue": "true",
                    "required": True,
                    "template": {
                        "anchor": "{terms_checkbox}",
                        "placement": "replace",
                        "size": {"width": 20, "height": 20}
                    }
                },
                # Title field
                {
                    "type": "title",
                    "recipientEmail": "john@example.com",
                    "template": {
                        "anchor": "{title}",
                        "placement": "replace",
                        "size": {"width": 75, "height": 30}
                    }
                },
                # Multiline text field
                {
                    "type": "text",
                    "recipientEmail": "john@example.com",
                    "isMultiline": True,
                    "template": {
                        "anchor": "{notes}",
                        "placement": "replace",
                        "size": {"width": 200, "height": 50}
                    }
                }
            ]
        )

        print("✅ Review link created!\n")
        print(f"Document ID: {result['documentId']}")
        print(f"Status: {result['status']}")
        print(f"Preview URL: {result['previewUrl']}")

        if result.get('recipients'):
            print("\nRecipients:")
            for recipient in result['recipients']:
                print(f"  {recipient['name']} ({recipient['email']}) - {recipient.get('status', 'N/A')}")

        print("\nNext steps:")
        print("1. Review the document at the preview URL")
        print("2. Send to recipients: await TurboSign.send_signature(...)")

    except Exception as error:
        print(f"Error: {error}")

# Run the example
if __name__ == "__main__":
    asyncio.run(advanced_fields_example())
