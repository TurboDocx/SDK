package partner

import (
	"context"
	"fmt"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var orgApikeyCreateCmd = &cobra.Command{
	Use:   "create <orgId>",
	Short: "Create organization API key",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		name, _ := cmd.Flags().GetString("name")
		role, _ := cmd.Flags().GetString("role")
		if name == "" {
			return fmt.Errorf("--name is required")
		}
		if role == "" {
			return fmt.Errorf("--role is required")
		}

		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.CreateOrganizationApiKey(context.Background(), args[0], &turbodocx.CreateOrgApiKeyRequest{
			Name: name,
			Role: role,
		})
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "API key created\n")
		fmt.Fprintf(cmd.OutOrStdout(), "ID:   %s\n", resp.Data.ID)
		fmt.Fprintf(cmd.OutOrStdout(), "Name: %s\n", resp.Data.Name)
		fmt.Fprintf(cmd.OutOrStdout(), "Key:  %s\n", resp.Data.Key)
		fmt.Fprintf(cmd.OutOrStdout(), "Role: %s\n", resp.Data.Role)
		return nil
	},
}

func init() {
	orgApikeyCreateCmd.Flags().String("name", "", "API key name (required)")
	orgApikeyCreateCmd.Flags().String("role", "", "API key role (required)")
	orgApikeyCmd.AddCommand(orgApikeyCreateCmd)
}
