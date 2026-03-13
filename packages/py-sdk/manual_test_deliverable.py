#!/usr/bin/env python3
"""
Deliverable Python SDK - Manual Test Suite

Run: python manual_test_deliverable.py

Make sure to configure the values below before running.
"""

import asyncio
import json
import sys

from turbodocx_sdk import Deliverable

# =============================================
# CONFIGURE THESE VALUES BEFORE RUNNING
# =============================================
API_KEY = "your-api-key-here"  # Replace with your actual TurboDocx API key
BASE_URL = "http://localhost:3000"  # Replace with your API URL
ORG_ID = "your-organization-id-here"  # Replace with your organization UUID

TEMPLATE_ID = "your-template-id-here"  # Replace with a valid template UUID
DELIVERABLE_ID = "your-deliverable-id-here"  # Replace with a valid deliverable UUID
DELIVERABLE_ITEM_ID = "your-deliverable-item-id-here"  # Replace with a valid deliverable item UUID

# Configure Deliverable
Deliverable.configure(
    api_key=API_KEY,
    base_url=BASE_URL,
    org_id=ORG_ID,
)


# =============================================
# TEST FUNCTIONS
# =============================================

async def test_list_deliverables():
    """Test 1: List deliverables with pagination"""
    print("\n--- Test 1: list_deliverables ---")

    result = await Deliverable.list_deliverables(
        limit=10,
        offset=0,
        show_tags=True,
    )

    print(f"Total Records: {result.get('totalRecords')}")
    print("Result:", json.dumps(result, indent=2))
    return result


async def test_generate_deliverable():
    """Test 2: Generate a deliverable from a template"""
    print("\n--- Test 2: generate_deliverable ---")

    result = await Deliverable.generate_deliverable(
        name="SDK Manual Test Document",
        template_id=TEMPLATE_ID,
        variables=[
            {"placeholder": "{CompanyName}", "text": "TechCorp Inc.", "mimeType": "text"},
            {"placeholder": "{EmployeeName}", "text": "John Smith", "mimeType": "text"},
        ],
        tags=["sdk-test", "manual"],
    )

    print("Result:", json.dumps(result, indent=2))
    return result["results"]["deliverable"]["id"]


async def test_get_deliverable_details(deliverable_id: str):
    """Test 3: Get full deliverable details"""
    print("\n--- Test 3: get_deliverable_details ---")

    result = await Deliverable.get_deliverable_details(
        deliverable_id,
        show_tags=True,
    )

    print("Result:", json.dumps(result, indent=2))
    return result


async def test_update_deliverable_info(deliverable_id: str):
    """Test 4: Update deliverable name and tags"""
    print("\n--- Test 4: update_deliverable_info ---")

    result = await Deliverable.update_deliverable_info(
        deliverable_id,
        name="SDK Manual Test Document (Updated)",
        tags=["sdk-test", "manual", "updated"],
    )

    print("Result:", json.dumps(result, indent=2))
    return result


async def test_delete_deliverable(deliverable_id: str):
    """Test 5: Soft-delete a deliverable"""
    print("\n--- Test 5: delete_deliverable ---")

    result = await Deliverable.delete_deliverable(deliverable_id)
    print("Result:", json.dumps(result, indent=2))
    return result


async def test_download_source_file(deliverable_id: str):
    """Test 6: Download source file (DOCX/PPTX)"""
    print("\n--- Test 6: download_source_file ---")

    result = await Deliverable.download_source_file(deliverable_id)
    print(f"Result: File received, size: {len(result)} bytes")

    output_path = "./downloaded-deliverable.docx"
    with open(output_path, "wb") as f:
        f.write(result)
    print(f"File saved to: {output_path}")

    return result


async def test_download_pdf(deliverable_id: str):
    """Test 7: Download PDF version"""
    print("\n--- Test 7: download_pdf ---")

    result = await Deliverable.download_pdf(deliverable_id)
    print(f"Result: PDF received, size: {len(result)} bytes")

    output_path = "./downloaded-deliverable.pdf"
    with open(output_path, "wb") as f:
        f.write(result)
    print(f"File saved to: {output_path}")

    return result


async def test_list_deliverable_items():
    """Test 8: List deliverable items"""
    print("\n--- Test 8: list_deliverable_items ---")

    result = await Deliverable.list_deliverable_items(
        limit=10,
        show_tags=True,
        column0="createdOn",
        order0="desc",
    )

    print(f"Total Records: {result.get('totalRecords')}")
    print("Result:", json.dumps(result, indent=2))
    return result


async def test_get_deliverable_item(item_id: str):
    """Test 9: Get a single deliverable item"""
    print("\n--- Test 9: get_deliverable_item ---")

    result = await Deliverable.get_deliverable_item(
        item_id,
        show_tags=True,
    )

    print("Result:", json.dumps(result, indent=2))
    return result


# =============================================
# MAIN TEST RUNNER
# =============================================

async def run_all_tests():
    print("==============================================")
    print("Deliverable Python SDK - Manual Test Suite")
    print("==============================================")

    try:
        # Uncomment and run tests as needed:

        # Test 1: List Deliverables
        # await test_list_deliverables()

        # Test 2: Generate Deliverable (replace TEMPLATE_ID above)
        # new_id = await test_generate_deliverable()

        # Test 3: Get Deliverable Details (replace with actual deliverable ID)
        # await test_get_deliverable_details(DELIVERABLE_ID)

        # Test 4: Update Deliverable Info (replace with actual deliverable ID)
        # await test_update_deliverable_info(DELIVERABLE_ID)

        # Test 5: Delete Deliverable (run last — soft-deletes the deliverable)
        # await test_delete_deliverable(DELIVERABLE_ID)

        # Test 6: Download Source File (replace with actual deliverable ID)
        # await test_download_source_file(DELIVERABLE_ID)

        # Test 7: Download PDF (replace with actual deliverable ID)
        # await test_download_pdf(DELIVERABLE_ID)

        # Test 8: List Deliverable Items
        # await test_list_deliverable_items()

        # Test 9: Get Deliverable Item (replace with actual deliverable item ID)
        # await test_get_deliverable_item(DELIVERABLE_ITEM_ID)

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
