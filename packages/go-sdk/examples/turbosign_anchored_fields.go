//go:build ignore
// +build ignore

// Example: Anchored Fields on a Template's Signature Setup
//
// An anchored field ties a signature field to a tag such as {ClientSign} in a Word template, for
// one signer role. Wherever the tag appears in a document generated from the template, the field
// goes there, sized to fit the tag.
//
// Before you run it:
//   - A Word template containing the tag, with at least one signer role saved on its Signatures tab.
//   - A deliverable generated from that template in which the tag still appears as text. Generate
//     it after the tag is a signature field, or give the tag's variable its own tag as the value.
//
// Environment:
//
//	TURBODOCX_API_KEY       an administrator or contributor API key
//	TURBODOCX_ORG_ID        your organization id
//	TURBODOCX_SENDER_EMAIL  the sender shown on the document
//	TURBODOCX_BASE_URL      optional, defaults to https://api.turbodocx.com
//	TEMPLATE_ID             the Word template
//	DELIVERABLE_ID          a deliverable generated from that template
//	ROLE_KEY                optional, the signer role that fills the tag (default "client")
//	ANCHOR_TAG              optional, the tag (default "{ClientSign}")
//	SIGNER_NAME, SIGNER_EMAIL  optional, who the review link is prepared for
//
// Run with: TEMPLATE_ID=... DELIVERABLE_ID=... go run examples/turbosign_anchored_fields.go

package main

import (
	"context"
	"fmt"
	"os"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
)

func main() {
	client, err := turbodocx.NewClientWithConfig(turbodocx.ClientConfig{
		APIKey:      getEnv("TURBODOCX_API_KEY", "your-api-key-here"),
		OrgID:       getEnv("TURBODOCX_ORG_ID", "your-org-id-here"),
		SenderEmail: getEnv("TURBODOCX_SENDER_EMAIL", "support@yourcompany.com"),
		SenderName:  getEnv("TURBODOCX_SENDER_NAME", "Your Company Name"),
		BaseURL:     getEnv("TURBODOCX_BASE_URL", "https://api.turbodocx.com"),
	})
	if err != nil {
		fail("creating client", err)
	}

	templateID := getEnv("TEMPLATE_ID", "your-template-id-here")
	deliverableID := getEnv("DELIVERABLE_ID", "your-deliverable-id-here")
	roleKey := getEnv("ROLE_KEY", "client")
	anchor := getEnv("ANCHOR_TAG", "{ClientSign}")
	signerName := getEnv("SIGNER_NAME", "Jane Doe")
	signerEmail := getEnv("SIGNER_EMAIL", "jane@example.com")
	ctx := context.Background()

	// 1. Save a signature field on the tag for the role. Adding the same type on the same tag for
	//    the same role again returns the existing field. A role the template doesn't have is a
	//    *NotFoundError (SignerRoleNotFound); a tag held by another role, or already holding a
	//    different field, is a *ConflictError.
	added, err := client.TurboSign.AddTemplateSignatureAnchor(ctx, &turbodocx.AddTemplateSignatureAnchorRequest{
		TemplateID: templateID,
		RoleKey:    roleKey,
		Type:       "signature",
		Anchor:     anchor,
	})
	if err != nil {
		fail("adding the anchored field", err)
	}
	fmt.Printf("1. Anchored field %s added on %s for role %q\n", added.FieldID, anchor, roleKey)
	if added.TagBecameSignatureField {
		fmt.Println("   The tag is now a signature field, not a text variable")
	}

	// 2. Read the setup back: every anchored field, and how many each role has.
	setup, err := client.TurboSign.GetTemplateSignatureSetup(ctx, templateID)
	if err != nil {
		fail("reading the setup", err)
	}
	fmt.Println("2. Anchored fields on the template:")
	for _, a := range setup.Anchors {
		missing := ""
		if a.NotFound {
			missing = ", tag not in the template"
		}
		fmt.Printf("   %s -> %s (%s)%s\n", a.Anchor, a.RoleKey, a.Type, missing)
	}
	for _, role := range setup.Roles {
		fmt.Printf("   Role %s: %d anchored of %d field(s)\n", role.Key, role.AnchoredFieldCount, role.FieldCount)
	}

	// 3. Prepare the deliverable for signing with your own field on the tag. ApplySignatureSetup
	//    matches it to the saved anchored field (same tag and type), so it fits the tag and a tag
	//    missing from the document is skipped instead of failing. A review link sends no email;
	//    SendSignature takes the same request and emails the signer.
	result, err := client.TurboSign.CreateSignatureReviewLink(ctx, &turbodocx.CreateSignatureReviewLinkRequest{
		DeliverableID:       deliverableID,
		DocumentName:        "Anchored Fields Example",
		ApplySignatureSetup: turbodocx.BoolPtr(true),
		Recipients:          []turbodocx.Recipient{{Name: signerName, Email: signerEmail, SigningOrder: 1}},
		Fields: []turbodocx.Field{
			{Type: "signature", RecipientEmail: signerEmail, Template: &turbodocx.TemplateAnchor{Anchor: anchor}},
		},
	})
	if err != nil {
		fail("creating the review link", err)
	}
	fmt.Printf("3. Review link ready for document %s\n", result.DocumentID)
	fmt.Printf("   Preview: %s\n", result.PreviewURL)

	// 4. Remove the anchored field. The tag goes back to being a text variable.
	removed, err := client.TurboSign.RemoveTemplateSignatureAnchor(ctx, templateID, added.FieldID)
	if err != nil {
		fail("removing the anchored field", err)
	}
	fields, _ := removed.SignatureSetup["fields"].([]interface{})
	fmt.Printf("4. Anchored field %s removed, %d field(s) left in the setup\n", added.FieldID, len(fields))
}

func fail(step string, err error) {
	fmt.Printf("Error %s: %v\n", step, err)
	os.Exit(1)
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
