package partner

import (
	"context"
	"fmt"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var userUpdateCmd = &cobra.Command{
	Use:   "update <userId>",
	Short: "Update partner user role and permissions",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		req := &turbodocx.UpdatePartnerUserRequest{}
		role, _ := cmd.Flags().GetString("role")
		permissionsStr, _ := cmd.Flags().GetString("permissions")

		if role == "" && permissionsStr == "" {
			return fmt.Errorf("at least one of --role or --permissions is required")
		}

		req.Role = role
		if permissionsStr != "" {
			var perms turbodocx.PartnerPermissions
			if err := parseJSONOrFile(permissionsStr, &perms); err != nil {
				return fmt.Errorf("invalid permissions: %w", err)
			}
			req.Permissions = &perms
		}

		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.UpdatePartnerUserPermissions(context.Background(), args[0], req)
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Partner user %s updated\n", args[0])
		return nil
	},
}

func init() {
	userUpdateCmd.Flags().String("role", "", "New role")
	userUpdateCmd.Flags().String("permissions", "", "Permissions JSON or @file path")
	userCmd.AddCommand(userUpdateCmd)
}
