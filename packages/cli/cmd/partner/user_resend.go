package partner

import (
	"context"
	"fmt"

	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var userResendCmd = &cobra.Command{
	Use:   "resend-invite <userId>",
	Short: "Resend invitation to partner portal user",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.ResendPartnerPortalInvitationToUser(context.Background(), args[0])
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Invitation resent to partner user %s\n", args[0])
		return nil
	},
}

func init() {
	userCmd.AddCommand(userResendCmd)
}
