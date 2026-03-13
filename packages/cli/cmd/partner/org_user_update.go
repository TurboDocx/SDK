package partner

import (
	"context"
	"fmt"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var orgUserUpdateCmd = &cobra.Command{
	Use:   "update <orgId> <userId>",
	Short: "Update organization user role",
	Args:  cobra.ExactArgs(2),
	RunE: func(cmd *cobra.Command, args []string) error {
		role, _ := cmd.Flags().GetString("role")
		if role == "" {
			return fmt.Errorf("--role is required")
		}

		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.UpdateOrganizationUserRole(context.Background(), args[0], args[1], &turbodocx.UpdateOrgUserRequest{Role: role})
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "User %s role updated to %s\n", args[1], role)
		return nil
	},
}

func init() {
	orgUserUpdateCmd.Flags().String("role", "", "New role (required)")
	orgUserCmd.AddCommand(orgUserUpdateCmd)
}
