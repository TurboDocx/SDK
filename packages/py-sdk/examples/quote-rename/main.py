"""
TurboQuote Example: Quote Renaming & Duplicate Naming

A small, self-contained app that asserts the naming contract documented in
docs/SDKs/quote-python.md. It creates everything it needs and cleans up after itself.

What it proves:
- `name` is trimmed on create_quote and update_quote; whitespace-only is a 400
- the 255-character limit is applied AFTER trimming
- duplicate_quote names the copy `Copy of <source>`, truncated to 255
- renaming is draft-only — a sent quote refuses the rename

Row ids (S20, S29, ...) refer to docs/QUOTE_RENAME_SDK_TEST_PLAN.md, so a failure here
can be quoted straight into that plan.

Send-dependent checks (S72) need an org whose quote template has a sender name + email.
They are skipped unless RUN_SEND_CHECKS=1, and reported as skipped rather than passed.

Set environment variables before running:
  export TURBODOCX_API_KEY=your-api-key
  export TURBODOCX_ORG_ID=your-org-uuid

Run: python examples/quote-rename/main.py
"""

import asyncio
import os
import sys
import time

from turbodocx_sdk import TurboQuote

results = []


def record(row_id, description, passed, detail):
    results.append({"id": row_id, "description": description,
                    "outcome": "pass" if passed else "fail", "detail": detail})
    print(f"  {'PASS' if passed else 'FAIL'}  {row_id}  {description}\n        {detail}")


def skip(row_id, description, reason):
    results.append({"id": row_id, "description": description, "outcome": "skip", "detail": reason})
    print(f"  SKIP  {row_id}  {description}\n        {reason}")


async def expect_rejection(row_id, description, coroutine_factory):
    """Runs a call expected to fail validation and reports the status code it produced."""
    try:
        await coroutine_factory()
        record(row_id, description, False, "the call SUCCEEDED — a 400 was expected")
    except Exception as error:  # noqa: BLE001 — the point is to inspect whatever came back
        status_code = getattr(error, "status_code", None)
        record(row_id, description, status_code == 400, f"status={status_code} message={error}")


async def main():
    TurboQuote.configure(
        api_key=os.getenv("TURBODOCX_API_KEY"),
        org_id=os.getenv("TURBODOCX_ORG_ID"),
        base_url=os.getenv("TURBODOCX_BASE_URL", "https://api.turbodocx.com"),
    )

    created_quote_ids = []
    company_id = None
    contact_id = None

    try:
        # =============================================
        # 1. SET UP — a company and contact to hang quotes off
        #    (TurboQuoteHeader.companyId is NOT NULL, so this is mandatory)
        # =============================================
        print("1. Creating company and contact...\n")

        company = await TurboQuote.create_company({
            "name": f"Rename Example Co {int(time.time() * 1000)}",
            "country": "US",
            "contacts": [{"name": "Dana Reed", "email": "dana@rename-example.example.com"}],
        })
        company_id = company["id"]

        contact = await TurboQuote.create_contact({
            "name": "Dana Reed",
            "companyId": company_id,
            "email": "dana@rename-example.example.com",
        })
        contact_id = contact["id"]

        async def new_quote(name):
            quote = await TurboQuote.create_quote({
                "name": name, "companyId": company_id, "contactId": contact_id,
            })
            created_quote_ids.append(quote["id"])
            return quote

        # =============================================
        # 2. TRIMMING ON CREATE
        # =============================================
        print("\n2. Trimming on create\n")

        padded = await new_quote("  Acme Q3  ")
        record("S20", "create_quote trims leading/trailing whitespace",
               padded["name"] == "Acme Q3", f"name={padded['name']!r}")

        interior = await new_quote("Acme  Corp")
        record("S44", "interior whitespace is preserved (trim is not a normalise)",
               interior["name"] == "Acme  Corp", f"name={interior['name']!r}")

        unicode_quote = await new_quote("案件 🚀 Ünïcode")
        record("S31", "unicode and emoji survive round-trip",
               unicode_quote["name"] == "案件 🚀 Ünïcode", f"name={unicode_quote['name']!r}")

        await expect_rejection("S22", "whitespace-only name is rejected on create",
                               lambda: TurboQuote.create_quote(
                                   {"name": "   ", "companyId": company_id, "contactId": contact_id}))

        await expect_rejection("S24", "tab/newline-only name is rejected on create",
                               lambda: TurboQuote.create_quote(
                                   {"name": "\t\n", "companyId": company_id, "contactId": contact_id}))

        await expect_rejection("S25", "empty name is rejected on create",
                               lambda: TurboQuote.create_quote(
                                   {"name": "", "companyId": company_id, "contactId": contact_id}))

        # =============================================
        # 3. LENGTH BOUNDARIES — the limit applies AFTER trimming
        # =============================================
        print("\n3. Length boundaries\n")

        at_limit = await new_quote("A" * 255)
        record("S26", "255 characters is accepted (inclusive maximum)",
               len(at_limit["name"]) == 255, f"length={len(at_limit['name'])}")

        await expect_rejection("S27", "256 characters is rejected",
                               lambda: TurboQuote.create_quote(
                                   {"name": "A" * 256, "companyId": company_id, "contactId": contact_id}))

        padded_to_limit = await new_quote("  " + "B" * 255 + "  ")
        record("S28", "255 chars wrapped in whitespace is accepted — trim runs before the length check",
               len(padded_to_limit["name"]) == 255, f"length={len(padded_to_limit['name'])}")

        # =============================================
        # 4. RENAMING A DRAFT
        # =============================================
        print("\n4. Renaming a draft\n")

        source = await new_quote("Acme Q3")
        renamed = await TurboQuote.update_quote(source["id"], {"name": "Acme Q3 — Revised"})
        record("S2", "update_quote renames a draft",
               renamed["name"] == "Acme Q3 — Revised", f"name={renamed['name']!r}")

        trimmed = await TurboQuote.update_quote(source["id"], {"name": "  Acme Q3 — Final  "})
        record("S21", "update_quote trims the new name",
               trimmed["name"] == "Acme Q3 — Final", f"name={trimmed['name']!r}")

        await expect_rejection("S23a", "whitespace-only name is rejected on update",
                               lambda: TurboQuote.update_quote(source["id"], {"name": "   "}))

        after_rejection = await TurboQuote.get_quote(source["id"])
        record("S23b", "the rejected rename left the stored name untouched",
               after_rejection["name"] == "Acme Q3 — Final", f"name={after_rejection['name']!r}")

        # =============================================
        # 5. DUPLICATE NAMING
        # =============================================
        print("\n5. Duplicate naming\n")

        copy = await TurboQuote.duplicate_quote(source["id"])
        created_quote_ids.append(copy["id"])
        record("S3", 'duplicate_quote prefixes the copy with "Copy of "',
               copy["name"] == "Copy of Acme Q3 — Final", f"name={copy['name']!r}")

        record("S13", "the copy is built from the CURRENT name, not the name at creation",
               "Revised" not in copy["name"] and "Final" in copy["name"],
               f"source was renamed twice; copy={copy['name']!r}")

        copy_of_copy = await TurboQuote.duplicate_quote(copy["id"])
        created_quote_ids.append(copy_of_copy["id"])
        record("S30", "duplicating a copy genuinely stacks the prefix (unlike a renewal)",
               copy_of_copy["name"] == f"Copy of {copy['name']}", f"name={copy_of_copy['name']!r}")

        long_source = await new_quote("C" * 255)
        long_copy = await TurboQuote.duplicate_quote(long_source["id"])
        created_quote_ids.append(long_copy["id"])
        record("S29", "a copy of a 255-char name is truncated to 255, so the insert cannot overflow",
               len(long_copy["name"]) == 255 and long_copy["name"].startswith("Copy of "),
               f"length={len(long_copy['name'])} prefix={long_copy['name'][:12]!r}")

        # =============================================
        # 6. RENAME IS DRAFT-ONLY
        # =============================================
        print("\n6. Rename is draft-only\n")

        if os.getenv("RUN_SEND_CHECKS") == "1":
            to_send = await new_quote("Sent Quote Rename Check")
            await TurboQuote.send_quote(to_send["id"])
            await expect_rejection("S72", "a sent quote refuses a rename",
                                   lambda: TurboQuote.update_quote(
                                       to_send["id"], {"name": "Renamed After Send"}))
        else:
            skip("S72", "a sent quote refuses a rename",
                 "set RUN_SEND_CHECKS=1 with a send-capable org "
                 "(sender name + email on the org quote template)")

        # =============================================
        # 7. SUMMARY
        # =============================================
        passed = sum(1 for r in results if r["outcome"] == "pass")
        failed = sum(1 for r in results if r["outcome"] == "fail")
        skipped = sum(1 for r in results if r["outcome"] == "skip")

        print("\n" + "=" * 60)
        print(f"  {passed} passed · {failed} failed · {skipped} skipped")
        print("=" * 60 + "\n")

        if failed:
            print("Failed rows:")
            for result in (r for r in results if r["outcome"] == "fail"):
                print(f"  {result['id']}  {result['description']} — {result['detail']}")
            sys.exit(1)

    finally:
        # =============================================
        # CLEANUP — leave the org as we found it
        # =============================================
        print("\nCleaning up...")
        for quote_id in created_quote_ids:
            try:
                await TurboQuote.delete_quote(quote_id)
            except Exception:  # noqa: BLE001 — cleanup is best-effort
                pass
        if contact_id:
            try:
                await TurboQuote.delete_contact(contact_id)
            except Exception:  # noqa: BLE001
                pass
        if company_id:
            try:
                await TurboQuote.delete_company(company_id)
            except Exception:  # noqa: BLE001
                pass
        print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
