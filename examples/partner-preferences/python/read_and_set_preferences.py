"""Example: what a partner sees when managing a tenant's TurboSign display
preferences through the SDK. Reads a child org's preferences, flips the
locked-fields background, and reads them back to prove the change stuck.

Run (from packages/py-sdk installed, or with the repo on PYTHONPATH):

    TURBODOCX_BASE_URL=http://localhost:3001 \\
    TURBODOCX_PARTNER_API_KEY=TDXP-... \\
    TURBODOCX_PARTNER_ID=<partner-uuid> \\
    ORG_ID=<child-org-uuid> \\
    python3 examples/partner-preferences/python/read_and_set_preferences.py
"""

import asyncio
import os
import sys

from turbodocx_sdk import TurboPartner


def show(label, prefs):
    print(
        f"{label}: outline={not prefs['hideSignatureOutline']} "
        f"hash={not prefs['hideSignatureHash']} "
        f"lockedGreyBackground={prefs['lockedFieldsBackground']}"
    )


async def main():
    org_id = os.environ.get("ORG_ID")
    if not org_id:
        print("Set ORG_ID to a child org UUID this partner owns.", file=sys.stderr)
        sys.exit(1)

    # Config comes from env vars (TURBODOCX_PARTNER_API_KEY / _PARTNER_ID / _BASE_URL).
    TurboPartner.configure(
        partner_api_key=os.environ["TURBODOCX_PARTNER_API_KEY"],
        partner_id=os.environ["TURBODOCX_PARTNER_ID"],
        base_url=os.environ.get("TURBODOCX_BASE_URL"),
    )

    # 1. What does the partner see right now for this tenant?
    before = (await TurboPartner.get_organization_preferences(org_id))["data"]["preferences"]
    show("BEFORE", before)

    # 2. Flip the locked-fields background to the opposite of its current value.
    #    Note: the request key stays camelCase — it is an API field, not a Python name.
    nxt = not before["lockedFieldsBackground"]
    updated = (
        await TurboPartner.update_organization_preferences(
            org_id, {"lockedFieldsBackground": nxt}
        )
    )["data"]["preferences"]
    show("UPDATED", updated)

    # 3. Read it back fresh to prove it persisted.
    after = (await TurboPartner.get_organization_preferences(org_id))["data"]["preferences"]
    show("AFTER ", after)

    if after["lockedFieldsBackground"] != nxt:
        raise SystemExit("Round-trip mismatch: the value did not persist.")
    print(f"\nOK — the partner changed lockedFieldsBackground to {nxt} and it stuck.")


if __name__ == "__main__":
    asyncio.run(main())
