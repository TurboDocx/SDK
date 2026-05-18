package partner

import (
	"context"
	"fmt"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var userAddCmd = &cobra.Command{
	Use:   "add",
	Short: "Add user to partner portal",
	RunE: func(cmd *cobra.Command, args []string) error {
		email, _ := cmd.Flags().GetString("email")
		role, _ := cmd.Flags().GetString("role")
		if email == "" {
			return fmt.Errorf("--email is required")
		}
		if role == "" {
			return fmt.Errorf("--role is required")
		}

		req := &turbodocx.AddPartnerUserRequest{
			Email: email,
			Role:  role,
		}

		permissionsStr, _ := cmd.Flags().GetString("permissions")
		if permissionsStr != "" {
			var perms turbodocx.PartnerPermissions
			if err := parseJSONOrFile(permissionsStr, &perms); err != nil {
				return fmt.Errorf("invalid permissions: %w", err)
			}
			req.Permissions = perms
		}

		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.AddUserToPartnerPortal(context.Background(), req)
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "User added to partner portal\n")
		fmt.Fprintf(cmd.OutOrStdout(), "ID:    %s\n", resp.Data.ID)
		fmt.Fprintf(cmd.OutOrStdout(), "Email: %s\n", resp.Data.Email)
		fmt.Fprintf(cmd.OutOrStdout(), "Role:  %s\n", resp.Data.Role)
		return nil
	},
}

func init() {
	userAddCmd.Flags().String("email", "", "User email (required)")
	userAddCmd.Flags().String("role", "", "User role (required)")
	userAddCmd.Flags().String("permissions", "", "Permissions JSON or @file path")
	userCmd.AddCommand(userAddCmd)
}
