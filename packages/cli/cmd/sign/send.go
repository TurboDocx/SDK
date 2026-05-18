package sign

import (
	"context"
	"fmt"
	"os"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var sendCmd = &cobra.Command{
	Use:   "send",
	Short: "Send document for signing",
	Long:  "Prepare a document and send signature request emails to recipients.",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newSignClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		req, err := buildSendRequest(cmd)
		if err != nil {
			return err
		}

		resp, err := client.SendSignature(context.Background(), req)
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Document ID: %s\n", resp.DocumentID)
		fmt.Fprintf(cmd.OutOrStdout(), "Message:     %s\n", resp.Message)
		return nil
	},
}

func buildSendRequest(cmd *cobra.Command) (*turbodocx.SendSignatureRequest, error) {
	req := &turbodocx.SendSignatureRequest{}

	// File sources
	filePath, _ := cmd.Flags().GetString("file")
	fileLink, _ := cmd.Flags().GetString("file-link")
	deliverableID, _ := cmd.Flags().GetString("deliverable-id")
	templateID, _ := cmd.Flags().GetString("template-id")

	if filePath != "" {
		data, err := os.ReadFile(filePath)
		if err != nil {
			return nil, fmt.Errorf("failed to read file: %w", err)
		}
		req.File = data
		req.FileName = filePath
	}
	req.FileLink = fileLink
	req.DeliverableID = deliverableID
	req.TemplateID = templateID

	// Recipients
	recipientsStr, _ := cmd.Flags().GetString("recipients")
	if recipientsStr != "" {
		if err := parseJSONOrFile(recipientsStr, &req.Recipients); err != nil {
			return nil, fmt.Errorf("invalid recipients: %w", err)
		}
	}

	// Fields
	fieldsStr, _ := cmd.Flags().GetString("fields")
	if fieldsStr != "" {
		if err := parseJSONOrFile(fieldsStr, &req.Fields); err != nil {
			return nil, fmt.Errorf("invalid fields: %w", err)
		}
	}

	// Optional
	req.DocumentName, _ = cmd.Flags().GetString("document-name")
	req.DocumentDescription, _ = cmd.Flags().GetString("document-description")

	ccEmails, _ := cmd.Flags().GetString("cc-emails")
	if ccEmails != "" {
		var emails []string
		if err := parseJSONOrFile(ccEmails, &emails); err != nil {
			return nil, fmt.Errorf("invalid cc-emails: %w", err)
		}
		req.CCEmails = emails
	}

	return req, nil
}

func init() {
	sendCmd.Flags().String("file", "", "Local file path to upload")
	sendCmd.Flags().String("file-link", "", "URL to document")
	sendCmd.Flags().String("deliverable-id", "", "TurboDocx deliverable ID")
	sendCmd.Flags().String("template-id", "", "TurboSign template ID")
	sendCmd.Flags().String("recipients", "", "Recipients JSON or @file path")
	sendCmd.Flags().String("fields", "", "Signature fields JSON or @file path")
	sendCmd.Flags().String("document-name", "", "Document name")
	sendCmd.Flags().String("document-description", "", "Document description")
	sendCmd.Flags().String("cc-emails", "", "CC email addresses JSON array or @file path")
}
