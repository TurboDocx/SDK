package partner

import (
	"context"
	"fmt"

	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var apikeyRevokeCmd = &cobra.Command{
	Use:   "revoke <keyId>",
	Short: "Revoke partner API key",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.RevokePartnerApiKey(context.Background(), args[0])
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Partner API key %s revoked\n", args[0])
		return nil
	},
}

func init() {
	apikeyCmd.AddCommand(apikeyRevokeCmd)
}
