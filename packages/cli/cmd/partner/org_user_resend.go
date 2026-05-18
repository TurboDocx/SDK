package partner

import (
	"context"
	"fmt"

	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var orgUserResendCmd = &cobra.Command{
	Use:   "resend-invite <orgId> <userId>",
	Short: "Resend invitation to organization user",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.ResendOrganizationInvitationToUser(context.Background(), args[0], args[1])
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Invitation resent to user %s in organization %s\n", args[1], args[0])
		return nil
	},
}

func init() {
	orgUserCmd.AddCommand(orgUserResendCmd)
}
