package partner

import (
	"context"
	"fmt"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var orgApikeyUpdateCmd = &cobra.Command{
	Use:   "update <orgId> <keyId>",
	Short: "Update organization API key",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		req := &turbodocx.UpdateOrgApiKeyRequest{}
		name, _ := cmd.Flags().GetString("name")
		role, _ := cmd.Flags().GetString("role")
		req.Name = name
		req.Role = role

		if name == "" && role == "" {
			return fmt.Errorf("at least one of --name or --role is required")
		}

		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.UpdateOrganizationApiKey(context.Background(), args[0], args[1], req)
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "API key %s updated\n", args[1])
		return nil
	},
}

func init() {
	orgApikeyUpdateCmd.Flags().String("name", "", "New API key name")
	orgApikeyUpdateCmd.Flags().String("role", "", "New API key role")
	orgApikeyCmd.AddCommand(orgApikeyUpdateCmd)
}
