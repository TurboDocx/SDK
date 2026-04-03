package partner

import (
	"context"
	"fmt"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var orgUserAddCmd = &cobra.Command{
	Use:   "add <orgId>",
	Short: "Add user to organization",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		email, _ := cmd.Flags().GetString("email")
		role, _ := cmd.Flags().GetString("role")
		if email == "" {
			return fmt.Errorf("--email is required")
		}
		if role == "" {
			return fmt.Errorf("--role is required")
		}

		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.AddUserToOrganization(context.Background(), args[0], &turbodocx.AddOrgUserRequest{
			Email: email,
			Role:  role,
		})
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "User added to organization\n")
		fmt.Fprintf(cmd.OutOrStdout(), "ID:    %s\n", resp.Data.ID)
		fmt.Fprintf(cmd.OutOrStdout(), "Email: %s\n", resp.Data.Email)
		fmt.Fprintf(cmd.OutOrStdout(), "Role:  %s\n", resp.Data.Role)
		return nil
	},
}

func init() {
	orgUserAddCmd.Flags().String("email", "", "User email (required)")
	orgUserAddCmd.Flags().String("role", "", "User role (required)")
	orgUserCmd.AddCommand(orgUserAddCmd)
}
