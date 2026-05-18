package partner

import (
	"context"
	"fmt"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var orgEntitlementsCmd = &cobra.Command{
	Use:   "entitlements <orgId>",
	Short: "Update organization entitlements",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		req := &turbodocx.UpdateEntitlementsRequest{}

		featuresStr, _ := cmd.Flags().GetString("features")
		if featuresStr != "" {
			var features turbodocx.Features
			if err := parseJSONOrFile(featuresStr, &features); err != nil {
				return fmt.Errorf("invalid features: %w", err)
			}
			req.Features = &features
		}

		trackingStr, _ := cmd.Flags().GetString("tracking")
		if trackingStr != "" {
			var tracking turbodocx.Tracking
			if err := parseJSONOrFile(trackingStr, &tracking); err != nil {
				return fmt.Errorf("invalid tracking: %w", err)
			}
			req.Tracking = &tracking
		}

		resp, err := client.UpdateOrganizationEntitlements(context.Background(), args[0], req)
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Entitlements updated for organization %s\n", args[0])
		return nil
	},
}

func init() {
	orgEntitlementsCmd.Flags().String("features", "", "Features JSON or @file path")
	orgEntitlementsCmd.Flags().String("tracking", "", "Tracking JSON or @file path")
	orgCmd.AddCommand(orgEntitlementsCmd)
}
