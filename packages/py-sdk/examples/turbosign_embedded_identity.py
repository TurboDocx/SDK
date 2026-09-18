"""
Example: Embedded Signing (with optional Identity Verification)

Embedded signing takes a signer from your own app straight to a TurboSign signing page,
without sending signing-link emails. At its core it is two steps: your backend asks TurboSign
for a signing URL for the recipient, then opens it (a new tab, a redirect, or an iframe). That
is all embedded signing needs. A plain embedded recipient signs with no extra verification step.

Identity verification is an OPTIONAL layer on top. Add ``identity_verification`` to a recipient
ONLY when you want an extra check before they sign, in one of these modes:
  - otp          TurboSign runs a one-time-passcode challenge (email or SMS)
  - external_idv your own identity provider verified them; you assert it when requesting the URL
  - override     opt out of verification (development/testing; recorded as not-verified on the certificate)

Without ``identity_verification``, ``create_signing_url`` still works: ``identityVerificationMode``
comes back None and ``pendingChecks`` is empty, and the signing page opens straight to the document.

Use this when: you embed signing in your own product and control the signer's session yourself.
"""

import asyncio
import json
import os
import sys

from turbodocx_sdk import TurboSign


async def embedded_identity_example():
    TurboSign.configure(
        api_key=os.getenv("TURBODOCX_API_KEY", "your-api-key-here"),
        org_id=os.getenv("TURBODOCX_ORG_ID", "your-org-id-here"),
        sender_email=os.getenv("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"),
        sender_name=os.getenv("TURBODOCX_SENDER_NAME", "Your Company Name"),
    )

    with open("../../ExampleAssets/sample-contract.pdf", "rb") as f:
        pdf_file = f.read()

    # 0) OPTIONAL: check what your org allows before you start. These org-wide GATES are set once by
    #    an admin (in E-Signature settings, on the Identity & embedding tab, or via the organization
    #    preferences API) and apply to every send. They are read-only from the SDK. The per-recipient
    #    MODE below is the part you choose on each signer, not here.
    settings = await TurboSign.get_embedded_signing_settings()
    if not settings["enabled"]:
        raise RuntimeError(
            "Embedded signing is not enabled for this organization. An admin can turn it on in E-Signature settings."
        )
    print(
        f"Embedded signing enabled. external_idv allowed: {settings['allowExternalIdv']}, "
        f"override allowed: {settings['allowIdentityOverride']}.\n"
    )

    # 1) Prepare the document with an EMBEDDED recipient. This is the baseline: no
    #    `identity_verification`, so the signer opens their signing URL and signs directly, with no
    #    extra verification step. The signer's real email is always the signer of record.
    #    `externalId` is your own key for the signer (an Airtable row, a CRM id) so you can request
    #    the signing URL later without storing TurboDocx's recipient id.
    sent = await TurboSign.send_signature(
        file=pdf_file,
        document_name="Service Agreement",
        recipients=[
            {
                "name": "Jane Doe",
                "email": "jane@example.com",
                "signingOrder": 1,
                "externalId": "your_customer_123",

                # OPTIONAL: add identity verification to require an extra check before signing.
                # Leave this out entirely for a plain embedded recipient (the baseline above). To turn
                # it on, uncomment exactly ONE of the modes below:
                #
                #   otp: TurboSign challenges the signer with a one-time passcode before the document
                #   opens. Use channel 'sms' to text the passcode; then also set the recipient's `phone`.
                # "identityVerification": {"mode": "otp", "channel": "email"},
                #
                #   external_idv: your own identity provider already verified the signer; you assert it
                #   when you request the signing URL (see step 2).
                # "identityVerification": {"mode": "external_idv", "provider": "CAPA"},
                #
                #   override: opt out of verification for development/testing (recorded as not-verified).
                # "identityVerification": {"mode": "override", "overrideIdentityVerification": True, "reason": "Sandbox testing"},
            },
        ],
        fields=[
            {
                "type": "signature",
                "recipientEmail": "jane@example.com",
                "template": {"anchor": "{signature1}", "placement": "replace", "size": {"width": 100, "height": 30}},
            },
        ],
    )

    print(f"Document {sent['documentId']} prepared.\n")

    # 2) When the signer is ready (they clicked "Sign now" in YOUR app, and you have confirmed the
    #    logged-in user is this recipient), request a signing URL. Mint it at click time and never
    #    store it (for the bypass modes below the URL is single-use and expires in minutes). This
    #    call works whether or not the recipient has identity verification configured.
    link = await TurboSign.create_signing_url(
        sent["documentId"],
        # Select the recipient by YOUR externalId (or pass recipient_id instead, exactly one):
        external_id="your_customer_123",
        # OPTIONAL: only for external_idv recipients, pass the assertion from your identity provider:
        # identity_assertion={
        #     "provider": "CAPA",
        #     "verificationId": "capa_verif_8f2a91",
        #     "verifiedAt": "2026-01-01T00:00:00Z",
        #     "subjectEmail": "jane@example.com",
        # },
        return_url="https://app.yourcompany.com/signed",  # where the signer returns after signing (https)
    )

    print("Open this URL for the signer (new tab, redirect, or iframe):")
    print(f"  {link['url']}")
    # With no identity_verification, `identityVerificationMode` is None and `pendingChecks` is [].
    print(f"  mode: {link.get('identityVerificationMode') or '(none)'}")
    # For `otp`, pendingChecks lists the passcode step the signer clears on the page
    # (e.g. ['email_otp']); with no verification, or for external_idv/override, it is [].
    print(f"  pendingChecks: {json.dumps(link['pendingChecks'])}")
    print(f"  expiresAt: {link.get('expiresAt') or '(no separate expiry; follows the document window)'}")

    # 3) The signing page does the rest. What `url` is depends on the recipient's mode:
    #    - no verification or otp: the reusable signing link (a `?token=` URL). For otp the page asks
    #      for the passcode first; with no verification it opens the document straight away. The link
    #      follows the document's own signing window and survives a refresh.
    #    - external_idv or override: a single-use, short-lived link (a `?sut=` URL) that the page
    #      redeems once when opened. Mint a fresh one each time; do not reuse it.
    #    Watch the `completed` webhook to know when signing finishes, then download the signed PDF.
    #    If a signer was verified, the certificate of completion carries the identity-verification line.
    #
    # `link["url"]` is an embeddable signing URL (/e-signature/embed/...). If you frame it, the browser
    # enforces a per-tenant Content-Security-Policy: frame-ancestors on the page, so an origin that is
    # NOT on the org's allow-list is HARD-BLOCKED from embedding (not merely warned). Ask your org admin
    # to add your app's origin to the "Allowed embedding domains" list in the E-Signature settings
    # (Identity & embedding tab); you can read the current list from `settings["allowedFrameAncestors"]`
    # above. The non-embedded email-invite signing links (/e-signature/sign/...) deny all framing.


if __name__ == "__main__":
    try:
        asyncio.run(embedded_identity_example())
    except Exception as error:
        print(f"Embedded identity example failed: {error}")
        sys.exit(1)
