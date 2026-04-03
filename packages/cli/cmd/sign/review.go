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

var reviewCmd = &cobra.Command{
	Use:   "review",
	Short: "Create signature review link",
	Long:  "Prepare a document for review without sending signature request emails.",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newSignClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		req, err := buildReviewRequest(cmd)
		if err != nil {
			return err
		}

		resp, err := client.CreateSignatureReviewLink(context.Background(), req)
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Document ID: %s\n", resp.DocumentID)
		fmt.Fprintf(cmd.OutOrStdout(), "Preview URL: %s\n", resp.PreviewURL)
		fmt.Fprintf(cmd.OutOrStdout(), "Message:     %s\n", resp.Message)
		return nil
	},
}

func buildReviewRequest(cmd *cobra.Command) (*turbodocx.CreateSignatureReviewLinkRequest, error) {
	req := &turbodocx.CreateSignatureReviewLinkRequest{}

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

	recipientsStr, _ := cmd.Flags().GetString("recipients")
	if recipientsStr != "" {
		if err := parseJSONOrFile(recipientsStr, &req.Recipients); err != nil {
			return nil, fmt.Errorf("invalid recipients: %w", err)
		}
	}

	fieldsStr, _ := cmd.Flags().GetString("fields")
	if fieldsStr != "" {
		if err := parseJSONOrFile(fieldsStr, &req.Fields); err != nil {
			return nil, fmt.Errorf("invalid fields: %w", err)
		}
	}

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
	reviewCmd.Flags().String("file", "", "Local file path to upload")
	reviewCmd.Flags().String("file-link", "", "URL to document")
	reviewCmd.Flags().String("deliverable-id", "", "TurboDocx deliverable ID")
	reviewCmd.Flags().String("template-id", "", "TurboSign template ID")
	reviewCmd.Flags().String("recipients", "", "Recipients JSON or @file path")
	reviewCmd.Flags().String("fields", "", "Signature fields JSON or @file path")
	reviewCmd.Flags().String("document-name", "", "Document name")
	reviewCmd.Flags().String("document-description", "", "Document description")
	reviewCmd.Flags().String("cc-emails", "", "CC email addresses JSON array or @file path")
}
