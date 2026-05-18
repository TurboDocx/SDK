package partner

import (
	"context"
	"fmt"

	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var orgApikeyRevokeCmd = &cobra.Command{
	Use:   "revoke <orgId> <keyId>",
	Short: "Revoke organization API key",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.RevokeOrganizationApiKey(context.Background(), args[0], args[1])
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "API key %s revoked from organization %s\n", args[1], args[0])
		return nil
	},
}

func init() {
	orgApikeyCmd.AddCommand(orgApikeyRevokeCmd)
}
