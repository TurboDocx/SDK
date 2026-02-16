"""
TurboPartner Example: API Key & User Management

This example demonstrates partner-level management:
- Partner API key creation with scoped permissions
- Partner portal user management
- Audit log querying

Set environment variables before running:
  export TURBODOCX_PARTNER_API_KEY=TDXP-your-key
  export TURBODOCX_PARTNER_ID=your-partner-uuid
"""

import asyncio
import os
from turbodocx_sdk import (
    TurboPartner,
    SCOPE_ORG_READ,
    SCOPE_ORG_USERS_READ,
    SCOPE_AUDIT_READ,
)


async def main():
    TurboPartner.configure(
        partner_api_key=os.getenv("TURBODOCX_PARTNER_API_KEY", "TDXP-your-key-here"),
        partner_id=os.getenv("TURBODOCX_PARTNER_ID", "your-partner-uuid"),
    )

    # --- Partner API Keys ---

    # Create a scoped partner API key (read-only for orgs and audit)
    print("Creating scoped partner API key...")
    key = await TurboPartner.create_partner_api_key(
        name="Read-Only Monitoring Key",
        description="For monitoring dashboard - read-only access",
        scopes=[SCOPE_ORG_READ, SCOPE_ORG_USERS_READ, SCOPE_AUDIT_READ],
    )
    print(f"Created key: {key['data']['name']}")
    print(f"Key value: {key['data']['key']}")
    print(f"Scopes: {key['data']['scopes']}\n")

    # List all partner API keys
    print("Listing partner API keys...")
    keys = await TurboPartner.list_partner_api_keys()
    for k in keys["data"]["results"]:
        print(f"  - {k['name']} (ID: {k['id']})")
    print()

    # --- Partner Portal Users ---

    # Add a user to the partner portal with specific permissions
    print("Adding partner portal user...")
    user = await TurboPartner.add_user_to_partner_portal(
        email="ops@yourcompany.com",
        role="member",
        permissions={
            "canManageOrgs": True,
            "canManageOrgUsers": True,
            "canViewAuditLogs": True,
            # Other permissions default to false
        },
    )
    print(f"Added partner user: {user['data']['email']} (Role: {user['data']['role']})\n")

    # List partner portal users
    print("Listing partner portal users...")
    users = await TurboPartner.list_partner_portal_users()
    for u in users["data"]["results"]:
        admin = " [PRIMARY ADMIN]" if u.get("isPrimaryAdmin") else ""
        print(f"  - {u['email']} ({u['role']}){admin}")
    print()

    # --- Audit Logs ---

    # Query recent audit logs
    print("Fetching recent audit logs...")
    logs = await TurboPartner.get_partner_audit_logs(limit=5)
    print(f"Total log entries: {logs['data']['totalRecords']} (showing first {len(logs['data']['results'])})")
    for entry in logs["data"]["results"]:
        print(f"  [{entry['createdOn']}] {entry['action']} {entry['resourceType']} (success: {entry['success']})")

    print("\nDone!")


if __name__ == "__main__":
    asyncio.run(main())
