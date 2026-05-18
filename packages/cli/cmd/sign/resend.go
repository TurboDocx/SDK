package sign

import (
	"context"
	"fmt"
	"strings"

	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var resendCmd = &cobra.Command{
	Use:   "resend <documentId>",
	Short: "Resend signature request emails",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		idsStr, _ := cmd.Flags().GetString("recipient-ids")
		if idsStr == "" {
			return fmt.Errorf("--recipient-ids is required")
		}

		recipientIDs := strings.Split(idsStr, ",")
		for i := range recipientIDs {
			recipientIDs[i] = strings.TrimSpace(recipientIDs[i])
		}

		client, err := newSignClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.ResendEmail(context.Background(), args[0], recipientIDs)
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Resent to %d recipient(s)\n", resp.RecipientCount)
		return nil
	},
}

func init() {
	resendCmd.Flags().String("recipient-ids", "", "Comma-separated recipient IDs")
}
