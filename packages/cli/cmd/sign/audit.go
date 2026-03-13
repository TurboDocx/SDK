package sign

import (
	"context"
	"fmt"

	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var auditCmd = &cobra.Command{
	Use:   "audit <documentId>",
	Short: "Get document audit trail",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newSignClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.GetAuditTrail(context.Background(), args[0])
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Document: %s (%s)\n\n", resp.Document.Name, resp.Document.ID)

		headers := []string{"Timestamp", "Action", "User"}
		var rows [][]string
		for _, entry := range resp.AuditTrail {
			user := ""
			if entry.User != nil {
				user = entry.User.Name
			} else if entry.Recipient != nil {
				user = entry.Recipient.Name
			}
			rows = append(rows, []string{entry.Timestamp, entry.ActionType, user})
		}
		output.PrintTable(cmd.OutOrStdout(), headers, rows)
		return nil
	},
}
