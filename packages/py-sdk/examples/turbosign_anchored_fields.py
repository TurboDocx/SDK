"""
Example: Anchored Fields on a Template's Signature Setup

An anchored field ties a signature field to a tag such as {ClientSign} in a Word template, for
one signer role. Wherever the tag appears in a document generated from the template, the field
goes there, sized to fit the tag.

Before you run it:
  - A Word template containing the tag, with at least one signer role saved on its Signatures tab.
  - A deliverable generated from that template in which the tag still appears as text. Generate
    it after the tag is a signature field, or give the tag's variable its own tag as the value.

Environment:
  TURBODOCX_API_KEY       an administrator or contributor API key
  TURBODOCX_ORG_ID        your organization id
  TURBODOCX_SENDER_EMAIL  the sender shown on the document
  TURBODOCX_BASE_URL      optional, defaults to https://api.turbodocx.com
  TEMPLATE_ID             the Word template
  DELIVERABLE_ID          a deliverable generated from that template
  ROLE_KEY                optional, the signer role that fills the tag (default "client")
  ANCHOR_TAG              optional, the tag (default "{ClientSign}")
  SIGNER_NAME, SIGNER_EMAIL  optional, who the review link is prepared for

Run with: TEMPLATE_ID=... DELIVERABLE_ID=... python examples/turbosign_anchored_fields.py
"""

import asyncio
import os
import sys

from turbodocx_sdk import TurboSign


async def anchored_fields_example():
    TurboSign.configure(
        api_key=os.getenv("TURBODOCX_API_KEY", "your-api-key-here"),
        org_id=os.getenv("TURBODOCX_ORG_ID", "your-org-id-here"),
        sender_email=os.getenv("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"),
        sender_name=os.getenv("TURBODOCX_SENDER_NAME", "Your Company Name"),
        base_url=os.getenv("TURBODOCX_BASE_URL", "https://api.turbodocx.com"),
    )

    template_id = os.getenv("TEMPLATE_ID", "your-template-id-here")
    deliverable_id = os.getenv("DELIVERABLE_ID", "your-deliverable-id-here")
    role_key = os.getenv("ROLE_KEY", "client")
    anchor = os.getenv("ANCHOR_TAG", "{ClientSign}")
    signer_name = os.getenv("SIGNER_NAME", "Jane Doe")
    signer_email = os.getenv("SIGNER_EMAIL", "jane@example.com")

    try:
        # 1. Save a signature field on the tag for the role. Adding the same type on the same tag
        #    for the same role again returns the existing field.
        added = await TurboSign.add_template_signature_anchor(
            template_id=template_id,
            role_key=role_key,
            type="signature",
            anchor=anchor,
        )
        field_id = added["fieldId"]
        print(f'1. Anchored field {field_id} added on {anchor} for role "{role_key}"')
        if added["tagBecameSignatureField"]:
            print("   The tag is now a signature field, not a text variable")

        # 2. Read the setup back: every anchored field, and how many each role has.
        setup = await TurboSign.get_template_signature_setup(template_id)
        print("2. Anchored fields on the template:")
        for a in setup["anchors"]:
            missing = ", tag not in the template" if a["notFound"] else ""
            print(f"   {a['anchor']} -> {a['roleKey']} ({a['type']}){missing}")
        for role in setup["roles"]:
            print(
                f"   Role {role['key']}: {role['anchoredFieldCount']} anchored "
                f"of {role['fieldCount']} field(s)"
            )

        # 3. Prepare the deliverable for signing with your own field on the tag.
        #    apply_signature_setup matches it to the saved anchored field (same tag and type), so
        #    it fits the tag and a tag missing from the document is skipped instead of failing.
        #    A review link sends no email; send_signature takes the same arguments and emails
        #    the signer.
        result = await TurboSign.create_signature_review_link(
            deliverable_id=deliverable_id,
            document_name="Anchored Fields Example",
            apply_signature_setup=True,
            recipients=[{"name": signer_name, "email": signer_email, "signingOrder": 1}],
            fields=[
                {"type": "signature", "recipientEmail": signer_email, "template": {"anchor": anchor}}
            ],
        )
        print(f"3. Review link ready for document {result['documentId']}")
        print(f"   Preview: {result.get('previewUrl')}")

        # 4. Remove the anchored field. The tag goes back to being a text variable.
        removed = await TurboSign.remove_template_signature_anchor(template_id, field_id)
        left = len(removed["signatureSetup"]["fields"])
        print(f"4. Anchored field {field_id} removed, {left} field(s) left in the setup")

    except Exception as error:
        # A role the template doesn't have is a NotFoundError (SignerRoleNotFound); a tag held by
        # another role, or already holding a different field, is a ConflictError.
        print(f"Error: {error}")
        sys.exit(1)


# Run the example
if __name__ == "__main__":
    asyncio.run(anchored_fields_example())
