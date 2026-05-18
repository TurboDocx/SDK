package partner

import (
	"context"
	"fmt"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var orgUpdateCmd = &cobra.Command{
	Use:   "update <orgId>",
	Short: "Update organization info",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		name, _ := cmd.Flags().GetString("name")

		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.UpdateOrganizationInfo(context.Background(), args[0], &turbodocx.UpdateOrganizationRequest{Name: name})
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Organization updated\n")
		fmt.Fprintf(cmd.OutOrStdout(), "ID:   %s\n", resp.Data.ID)
		fmt.Fprintf(cmd.OutOrStdout(), "Name: %s\n", resp.Data.Name)
		return nil
	},
}

func init() {
	orgUpdateCmd.Flags().String("name", "", "New organization name (required)")
	_ = orgUpdateCmd.MarkFlagRequired("name")
	orgCmd.AddCommand(orgUpdateCmd)
}
