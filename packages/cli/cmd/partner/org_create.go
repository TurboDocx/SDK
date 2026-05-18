package partner

import (
	"context"
	"fmt"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var orgCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create a new organization",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		name, _ := cmd.Flags().GetString("name")
		req := &turbodocx.CreateOrganizationRequest{Name: name}

		metadataStr, _ := cmd.Flags().GetString("metadata")
		if metadataStr != "" {
			if err := parseJSONOrFile(metadataStr, &req.Metadata); err != nil {
				return fmt.Errorf("invalid metadata: %w", err)
			}
		}

		resp, err := client.CreateOrganization(context.Background(), req)
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Organization created\n")
		fmt.Fprintf(cmd.OutOrStdout(), "ID:   %s\n", resp.Data.ID)
		fmt.Fprintf(cmd.OutOrStdout(), "Name: %s\n", resp.Data.Name)
		return nil
	},
}

func init() {
	orgCreateCmd.Flags().String("name", "", "Organization name (required)")
	_ = orgCreateCmd.MarkFlagRequired("name")
	orgCreateCmd.Flags().String("metadata", "", "Metadata JSON or @file path")
	orgCmd.AddCommand(orgCreateCmd)
}
