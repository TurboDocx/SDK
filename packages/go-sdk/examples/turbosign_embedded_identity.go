//go:build ignore
// +build ignore

// Example: Embedded Signing (with optional Identity Verification)
//
// Embedded signing takes a signer from your own app straight to a TurboSign signing page,
// without sending signing-link emails. At its core it is two steps: your backend asks TurboSign
// for a signing URL for the recipient, then opens it (a new tab, a redirect, or an iframe). That
// is all embedded signing needs. A plain embedded recipient signs with no extra verification step.
//
// Identity verification is an OPTIONAL layer on top. Add IdentityVerification to a recipient
// ONLY when you want an extra check before they sign, in one of these modes:
//   - otp          TurboSign runs a one-time-passcode challenge (email or SMS)
//   - external_idv your own identity provider verified them; you assert it when requesting the URL
//   - override     opt out of verification (development/testing; recorded as not-verified on the certificate)
//
// Without IdentityVerification, CreateSigningURL still works: IdentityVerificationMode comes
// back "" and PendingChecks is empty, and the signing page opens straight to the document.
//
// Use this when: you embed signing in your own product and control the signer's session yourself.

package main

import (
	"context"
	"fmt"
	"os"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
)

func main() {
	// Configure the TurboDocx client.
	client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
		APIKey:      getEnv("TURBODOCX_API_KEY", "your-api-key-here"),
		OrgID:       getEnv("TURBODOCX_ORG_ID", "your-org-id-here"),
		SenderEmail: getEnv("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"),
		SenderName:  getEnv("TURBODOCX_SENDER_NAME", "Your Company Name"),
	})
	if err != nil {
		fmt.Printf("Error creating client: %v\n", err)
		return
	}

	pdfFile, err := os.ReadFile("../../ExampleAssets/sample-contract.pdf")
	if err != nil {
		fmt.Printf("Error reading file: %v\n", err)
		return
	}

	ctx := context.Background()

	// 0) OPTIONAL: check what your org allows before you start. These org-wide GATES are set once by
	//    an admin (in E-Signature settings, on the Identity & embedding tab, or via the organization
	//    preferences API) and apply to every send. They are read-only from the SDK. The per-recipient
	//    MODE below is the part you choose on each signer, not here.
	settings, err := client.TurboSign.GetEmbeddedSigningSettings(ctx)
	if err != nil {
		fmt.Printf("Error reading embedded signing settings: %v\n", err)
		return
	}
	if !settings.Enabled {
		fmt.Println("Embedded signing is not enabled for this organization. An admin can turn it on in E-Signature settings.")
		return
	}
	fmt.Printf(
		"Embedded signing enabled. external_idv allowed: %t, override allowed: %t.\n\n",
		settings.AllowExternalIDV, settings.AllowIdentityOverride,
	)

	// 1) Prepare the document with an EMBEDDED recipient. This is the baseline: no
	//    IdentityVerification, so the signer opens their signing URL and signs directly, with no
	//    extra verification step. The signer's real email is always the signer of record.
	//    ExternalID is your own key for the signer (an Airtable row, a CRM id) so you can request
	//    the signing URL later without storing TurboDocx's recipient id.
	sent, err := client.TurboSign.SendSignature(ctx, &turbodocx.SendSignatureRequest{
		File:         pdfFile,
		FileName:     "sample-contract.pdf",
		DocumentName: "Service Agreement",
		Recipients: []turbodocx.Recipient{
			{
				Name:         "Jane Doe",
				Email:        "jane@example.com",
				SigningOrder: 1,
				ExternalID:   "your_customer_123",

				// OPTIONAL: add identity verification to require an extra check before signing.
				// Leave this out entirely for a plain embedded recipient (the baseline above). To turn
				// it on, uncomment exactly ONE of the modes below:
				//
				//   otp: TurboSign challenges the signer with a one-time passcode before the document
				//   opens. Use channel "sms" to text the passcode; then also set the recipient's Phone.
				// IdentityVerification: &turbodocx.IdentityVerification{Mode: "otp", Channel: "email"},
				//
				//   external_idv: your own identity provider already verified the signer; you assert it
				//   when you request the signing URL (see step 2).
				// IdentityVerification: &turbodocx.IdentityVerification{Mode: "external_idv", Provider: "CAPA"},
				//
				//   override: opt out of verification for development/testing (recorded as not-verified).
				// IdentityVerification: &turbodocx.IdentityVerification{Mode: "override", OverrideIdentityVerification: true, Reason: "Sandbox testing"},
			},
		},
		Fields: []turbodocx.Field{
			{
				Type:           "signature",
				RecipientEmail: "jane@example.com",
				Template: &turbodocx.TemplateAnchor{
					Anchor:    "{signature1}",
					Placement: "replace",
					Size:      &turbodocx.Size{Width: 100, Height: 30},
				},
			},
		},
	})
	if err != nil {
		fmt.Printf("Error preparing document: %v\n", err)
		return
	}

	fmt.Printf("Document %s prepared.\n\n", sent.DocumentID)

	// 2) When the signer is ready (they clicked "Sign now" in YOUR app, and you have confirmed the
	//    logged-in user is this recipient), request a signing URL. Mint it at click time and never
	//    store it (for the bypass modes below the URL is single-use and expires in minutes). This
	//    call works whether or not the recipient has identity verification configured.
	link, err := client.TurboSign.CreateSigningURL(ctx, sent.DocumentID, &turbodocx.CreateSigningURLRequest{
		// Select the recipient by YOUR externalId (or pass RecipientID instead, exactly one):
		ExternalID: "your_customer_123",
		// OPTIONAL: only for external_idv recipients, pass the assertion from your identity provider:
		// IdentityAssertion: &turbodocx.IdentityAssertion{
		//   Provider:       "CAPA",
		//   VerificationID: "capa_verif_8f2a91",
		//   VerifiedAt:     time.Now().UTC().Format(time.RFC3339),
		//   SubjectEmail:   "jane@example.com",
		// },
		ReturnURL: "https://app.yourcompany.com/signed", // where the signer returns after signing (https)
	})
	if err != nil {
		fmt.Printf("Error creating signing URL: %v\n", err)
		return
	}

	fmt.Println("Open this URL for the signer (new tab, redirect, or iframe):")
	fmt.Printf("  %s\n", link.URL)
	// With no IdentityVerification, IdentityVerificationMode is "" and PendingChecks is [].
	mode := link.IdentityVerificationMode
	if mode == "" {
		mode = "(none)"
	}
	fmt.Printf("  mode: %s\n", mode)
	// For "otp", PendingChecks lists the passcode step the signer clears on the page
	// (e.g. ["email_otp"]); with no verification, or for external_idv/override, it is [].
	fmt.Printf("  pendingChecks: %v\n", link.PendingChecks)
	// ExpiresAt is a *string: nil for otp/no-verification recipients, whose link follows the
	// document's own signing window rather than a short single-use expiry.
	expiresAt := "(no separate expiry; follows the document window)"
	if link.ExpiresAt != nil {
		expiresAt = *link.ExpiresAt
	}
	fmt.Printf("  expiresAt: %s\n", expiresAt)

	// 3) The signing page does the rest. What URL is depends on the recipient's mode:
	//    - no verification or otp: the reusable signing link (a ?token= URL). For otp the page asks
	//      for the passcode first; with no verification it opens the document straight away. The link
	//      follows the document's own signing window and survives a refresh.
	//    - external_idv or override: a single-use, short-lived link (a ?sut= URL) that the page
	//      redeems once when opened. Mint a fresh one each time; do not reuse it.
	//    Watch the completed webhook to know when signing finishes, then download the signed PDF.
	//    If a signer was verified, the certificate of completion carries the identity-verification line.
	//
	// link.URL is an embeddable signing URL (/e-signature/embed/...). If you frame it, the browser
	// enforces a per-tenant Content-Security-Policy: frame-ancestors on the page, so an origin that is
	// NOT on the org's allow-list is HARD-BLOCKED from embedding (not merely warned). Ask your org admin
	// to add your app's origin to the "Allowed embedding domains" list in the E-Signature settings
	// (Identity & embedding tab); you can read the current list from settings.AllowedFrameAncestors
	// above. The non-embedded email-invite signing links (/e-signature/sign/...) deny all framing.
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
