//go:build ignore
// +build ignore

// Example: Send a Template Set Up in TurboDocx (Signer Roles)
//
// Set the template up once in TurboDocx:
//  1. Upload a PDF as a template.
//  2. On its Signatures tab, add each signer as a role (e.g. "Client", "Countersigner").
//     Tick "Fill in name and email when sending" for a role that changes every time;
//     give a role a name and email when it's always the same person (e.g. your countersigner).
//  3. Drag each role's fields onto the PDF and save the signature setup.
//
// Then send it from code by naming each recipient's role. The fields saved for that role come
// with it, so you never pass coordinates or anchors.
//
// Use this when: the same document goes out again and again with different signers.
//
// Run with: TEMPLATE_ID=<your template id> go run examples/turbosign_template_roles.go

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
	})
	if err != nil {
		fmt.Printf("Error creating client: %v\n", err)
		return
	}

	templateID := getEnv("TEMPLATE_ID", "your-template-id-here")
	ctx := context.Background()

	// 1. See the template's roles. The keys are also shown under "Use via API" on the
	//    template's page in TurboDocx.
	setup, err := client.TurboSign.GetTemplateSignatureSetup(ctx, templateID)
	if err != nil {
		// An unknown template comes back as an error here.
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Println("Template roles (in signing order):")
	for _, role := range setup.Roles {
		signer := "filled in when sending"
		if role.HasSavedSigner {
			signer = fmt.Sprintf("saved signer %s <%s>", role.DefaultName, role.DefaultEmail)
		}
		fmt.Printf("  %d. %s (%s): %s, %d field(s)\n", role.Order, role.Key, role.Label, signer, role.FieldCount)
	}

	// 2. Pass a recipient for every role filled in when sending. A role with a saved signer can
	//    be left out (its saved signer is used), or passed to send to someone else this time.
	result, err := client.TurboSign.SendSignature(ctx, &turbodocx.SendSignatureRequest{
		TemplateID: templateID,
		Recipients: []turbodocx.Recipient{
			{Role: "client", Name: "Jane Doe", Email: "jane@client.com"},
			// "countersigner" left out: the signer saved on the template is used
		},
		// No Fields: the template's saved fields come with each role. Any fields you add here
		// are placed in addition to them (e.g. an extra witness signature).
	})
	if err != nil {
		// A role the template doesn't have, or a role with no saved signer that you left out,
		// comes back as a validation error whose message names the role and lists the valid ones.
		fmt.Printf("Error: %v\n", err)
		return
	}

	fmt.Println("\n✅ Document sent!")
	fmt.Printf("Document ID: %s\n", result.DocumentID)

	// 3. Track it like any other document.
	progress, err := client.TurboSign.GetRecipients(ctx, result.DocumentID)
	if err != nil {
		fmt.Println("\nNote: Could not fetch recipient status")
		return
	}
	fmt.Printf("\n%d of %d signed, still waiting on %d\n",
		progress.Summary.Completed, progress.Summary.Total, progress.Summary.WaitingOn)
	for _, recipient := range progress.Recipients {
		fmt.Printf("  %s <%s>: %s\n", recipient.Name, recipient.Email, recipient.EffectiveStatus)
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
