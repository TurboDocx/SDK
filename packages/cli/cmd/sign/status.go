package sign

import (
	"context"
	"fmt"

	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

// jsonMode is a package-level var for test control. In production, use cmdutil.IsJSON().
var jsonMode bool

func isJSONMode() bool {
	return jsonMode || cmdutil.IsJSON()
}

var statusCmd = &cobra.Command{
	Use:   "status <documentId>",
	Short: "Get document signing status",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newSignClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.GetStatus(context.Background(), args[0])
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Document: %s\n", args[0])
		fmt.Fprintf(cmd.OutOrStdout(), "Status:   %s\n", output.StatusColor(resp.Status))
		return nil
	},
}
