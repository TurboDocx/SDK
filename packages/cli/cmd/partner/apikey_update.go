package partner

import (
	"context"
	"fmt"
	"strings"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var apikeyUpdateCmd = &cobra.Command{
	Use:   "update <keyId>",
	Short: "Update partner API key",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		req := &turbodocx.UpdatePartnerApiKeyRequest{}
		name, _ := cmd.Flags().GetString("name")
		description, _ := cmd.Flags().GetString("description")
		scopesStr, _ := cmd.Flags().GetString("scopes")

		req.Name = name
		req.Description = description
		if scopesStr != "" {
			scopes := strings.Split(scopesStr, ",")
			for i := range scopes {
				scopes[i] = strings.TrimSpace(scopes[i])
			}
			req.Scopes = scopes
		}

		if name == "" && description == "" && scopesStr == "" {
			return fmt.Errorf("at least one of --name, --description, or --scopes is required")
		}

		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.UpdatePartnerApiKey(context.Background(), args[0], req)
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Partner API key %s updated\n", args[0])
		return nil
	},
}

func init() {
	apikeyUpdateCmd.Flags().String("name", "", "New API key name")
	apikeyUpdateCmd.Flags().String("description", "", "New API key description")
	apikeyUpdateCmd.Flags().String("scopes", "", "New comma-separated scopes")
	apikeyCmd.AddCommand(apikeyUpdateCmd)
}
