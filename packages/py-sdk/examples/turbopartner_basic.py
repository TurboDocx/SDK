"""
TurboPartner Example: Organization Lifecycle

This example demonstrates the full TurboPartner partner management flow:
1. Create an organization with entitlements
2. Add a user to the organization
3. Create an API key for the organization
4. List organizations and users
5. Clean up resources

Set environment variables before running:
  export TURBODOCX_PARTNER_API_KEY=TDXP-your-key
  export TURBODOCX_PARTNER_ID=your-partner-uuid
"""

import asyncio
import os
from turbodocx_sdk import TurboPartner


async def main():
    # 1. Configure the partner client
    TurboPartner.configure(
        partner_api_key=os.getenv("TURBODOCX_PARTNER_API_KEY", "TDXP-your-key-here"),
        partner_id=os.getenv("TURBODOCX_PARTNER_ID", "your-partner-uuid"),
    )

    # 2. Create an organization with entitlements
    print("Creating organization...")
    org = await TurboPartner.create_organization(
        "Acme Corporation",
        features={
            "maxUsers": 25,
            "maxStorage": 5 * 1024 * 1024 * 1024,  # 5 GB
            "maxTemplates": 100,
            "maxSignatures": 500,
            "hasTDAI": True,
            "hasPptx": True,
            "hasFileDownload": True,
        },
    )
    org_id = org["data"]["id"]
    print(f"Created organization: {org['data']['name']} (ID: {org_id})\n")

    # 3. Add a user to the organization
    print("Adding user to organization...")
    user = await TurboPartner.add_user_to_organization(
        org_id, email="admin@acme.com", role="admin"
    )
    print(f"Added user: {user['data']['email']} (Role: {user['data']['role']})\n")

    # 4. Create an API key for the organization
    print("Creating organization API key...")
    api_key = await TurboPartner.create_organization_api_key(
        org_id, name="Production Key", role="admin"
    )
    print(f"Created API key: {api_key['data']['name']}")
    print(f"Key value: {api_key['data']['key']}\n")

    # 5. List all organizations
    print("Listing organizations...")
    orgs = await TurboPartner.list_organizations(limit=10)
    print(f"Total organizations: {orgs['data']['totalRecords']}")
    for o in orgs["data"]["results"]:
        print(f"  - {o['name']} (ID: {o['id']})")
    print()

    # 6. Get full organization details (includes features + tracking)
    print("Getting organization details...")
    details = await TurboPartner.get_organization_details(org_id)
    print(f"Organization: {details['data']['name']}")
    if details["data"].get("features") and details["data"]["features"].get("maxUsers"):
        print(f"  Max Users: {details['data']['features']['maxUsers']}")
    if details["data"].get("tracking"):
        print(f"  Current Users: {details['data']['tracking']['numUsers']}")
    print()

    # 7. List users in the organization
    print("Listing organization users...")
    users = await TurboPartner.list_organization_users(org_id)
    print(f"Total users: {users['data']['totalRecords']}")
    for u in users["data"]["results"]:
        print(f"  - {u['email']} ({u['role']})")

    print("\nDone! Organization is fully provisioned.")


if __name__ == "__main__":
    asyncio.run(main())
