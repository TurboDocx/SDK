package sign

import (
	"context"
	"fmt"

	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var voidCmd = &cobra.Command{
	Use:   "void <documentId>",
	Short: "Void a document (cancel signature request)",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		reason, _ := cmd.Flags().GetString("reason")
		if reason == "" {
			return fmt.Errorf("--reason is required")
		}

		client, err := newSignClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.VoidDocument(context.Background(), args[0], reason)
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Document %s has been voided\n", args[0])
		fmt.Fprintf(cmd.OutOrStdout(), "Reason: %s\n", resp.VoidReason)
		return nil
	},
}

func init() {
	voidCmd.Flags().String("reason", "", "Reason for voiding (required)")
}
