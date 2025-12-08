#!/usr/bin/env python3
"""
TurboSign Python SDK - Manual Test Suite

Run: python manual_test.py

Make sure to configure the values below before running.
"""

import asyncio
import json
import os
import sys

from turbodocx_sdk import TurboSign

# =============================================
# CONFIGURE THESE VALUES BEFORE RUNNING
# =============================================
API_KEY = "TDX-your-api-key-here"  # Replace with your actual TurboDocx API key
BASE_URL = "http://localhost:3000"  # Replace with your API URL
ORG_ID = "your-organization-uuid-here"  # Replace with your organization UUID

TEST_PDF_PATH = "/path/to/your/test-document.pdf"  # Replace with path to your test PDF/DOCX
TEST_EMAIL = "test-recipient@example.com"  # Replace with a real email to receive notifications

# Configure TurboSign
TurboSign.configure(api_key=API_KEY, base_url=BASE_URL, org_id=ORG_ID)


# =============================================
# TEST FUNCTIONS
# =============================================

async def test_prepare_for_review():
    """Test 1: Prepare document for review (no emails sent) - using fileLink"""
    print("\n--- Test 1: prepare_for_review (using fileLink) ---")

    # Using fileLink instead of file upload or templateId
    # Replace with a publicly accessible PDF/DOCX URL
    file_url = "https://example.com/sample-document.pdf"  # Replace with actual publicly accessible PDF URL

    result = await TurboSign.prepare_for_review(
        file_link=file_url,
        recipients=[
            {"name": "Signer One", "email": TEST_EMAIL, "signingOrder": 1}
        ],
        fields=[
            {
                "recipientEmail": TEST_EMAIL,
                "type": "signature",
                "page": 1,
                "x": 100,
                "y": 550,
                "width": 200,
                "height": 50,
            },
            {
                "recipientEmail": TEST_EMAIL,
                "type": "checkbox",
                "page": 1,
                "x": 320,
                "y": 550,
                "width": 50,
                "height": 50,
                "defaultValue": "true",
            },
        ],
        document_name="Review Test Document (fileLink)",
    )

    print("Result:", json.dumps(result, indent=2))
    return result.get("documentId")


async def test_prepare_for_signing_single():
    """Test 2: Prepare document for signing and send emails"""
    print("\n--- Test 2: prepare_for_signing_single ---")

    with open(TEST_PDF_PATH, "rb") as f:
        pdf_buffer = f.read()

    result = await TurboSign.prepare_for_signing_single(
        # template_id="341af877-02d4-4549-823b-87089a3f7b02",  # Replace with your template ID
        file=pdf_buffer,
        recipients=[
            {"name": "Test User", "email": TEST_EMAIL, "signingOrder": 1}
        ],
        fields=[
            {
                "recipientEmail": TEST_EMAIL,
                "type": "text",
                "template": {
                    "anchor": "{hello}",
                    "placement": "replace",
                    "size": {"width": 200, "height": 80},
                    "offset": {"x": 0, "y": 0},
                    "caseSensitive": True,
                    "useRegex": False,
                },
                "defaultValue": "Sample Text",
                "required": True,
                "isMultiline": True,
            },
            {
                "recipientEmail": TEST_EMAIL,
                "type": "last_name",
                "page": 1,
                "x": 100,
                "y": 650,
                "width": 200,
                "height": 50,
                "defaultValue": "Doe",
            },
        ],
        document_name="Signing Test Document",
        document_description="Sample contract for testing single-step signature endpoint",
        sender_name="Test Sender",
        sender_email="sender@example.com",
        cc_emails=["cc@example.com"],
    )

    print("Result:", json.dumps(result, indent=2))
    return result.get("documentId")


async def test_get_status(document_id: str):
    """Test 3: Get document status"""
    print("\n--- Test 3: get_status ---")

    result = await TurboSign.get_status(document_id)
    print("Result:", json.dumps(result, indent=2))
    return result


async def test_download(document_id: str):
    """Test 4: Download signed document"""
    print("\n--- Test 4: download ---")

    result = await TurboSign.download(document_id)
    print(f"Result: PDF received, size: {len(result)} bytes")

    # Save to file
    output_path = "./downloaded-document.pdf"
    with open(output_path, "wb") as f:
        f.write(result)
    print(f"File saved to: {output_path}")

    return result


async def test_resend(document_id: str, recipient_ids: list):
    """Test 5: Resend signature emails"""
    print("\n--- Test 5: resend_email ---")

    result = await TurboSign.resend_email(document_id, recipient_ids)
    print("Result:", json.dumps(result, indent=2))
    return result


async def test_void(document_id: str):
    """Test 6: Void document"""
    print("\n--- Test 6: void_document ---")

    result = await TurboSign.void_document(document_id, "Testing void functionality")
    print("Result:", json.dumps(result, indent=2))
    return result


async def test_get_audit_trail(document_id: str):
    """Test 7: Get audit trail"""
    print("\n--- Test 7: get_audit_trail ---")

    result = await TurboSign.get_audit_trail(document_id)
    print("Result:", json.dumps(result, indent=2))
    return result


# =============================================
# MAIN TEST RUNNER
# =============================================

async def run_all_tests():
    print("==============================================")
    print("TurboSign Python SDK - Manual Test Suite")
    print("==============================================")

    # Check if test PDF exists
    if not os.path.exists(TEST_PDF_PATH):
        print(f"\nError: Test PDF not found at {TEST_PDF_PATH}")
        print("Please add a test PDF file and update TEST_PDF_PATH.")
        sys.exit(1)

    try:
        # Uncomment and run tests as needed:

        # Test 1: Prepare for Review
        # review_doc_id = await test_prepare_for_review()

        # Test 2: Prepare for Signing (creates a new document)
        # sign_doc_id = await test_prepare_for_signing_single()

        # Test 3: Get Status (replace with actual document ID)
        # await test_get_status("document-uuid-here")

        # Test 4: Download (replace with actual document ID)
        # await test_download("document-uuid-here")

        # Test 5: Resend (replace with actual document ID and recipient ID)
        # await test_resend("document-uuid-here", ["recipient-uuid-here"])

        # Test 6: Void (do this last as it cancels the document)
        # await test_void("document-uuid-here")

        # Test 7: Get Audit Trail (replace with actual document ID)
        # await test_get_audit_trail("document-uuid-here")

        print("\n==============================================")
        print("All tests completed successfully!")
        print("==============================================")

    except Exception as error:
        print("\n==============================================")
        print("TEST FAILED")
        print("==============================================")
        print(f"Error: {error}")
        if hasattr(error, "status_code"):
            print(f"Status Code: {error.status_code}")
        if hasattr(error, "code"):
            print(f"Error Code: {error.code}")
        sys.exit(1)


# Run tests
if __name__ == "__main__":
    asyncio.run(run_all_tests())
