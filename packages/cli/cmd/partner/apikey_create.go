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

var apikeyCreateCmd = &cobra.Command{
	Use:   "create",
	Short: "Create partner API key",
	RunE: func(cmd *cobra.Command, args []string) error {
		name, _ := cmd.Flags().GetString("name")
		scopesStr, _ := cmd.Flags().GetString("scopes")
		description, _ := cmd.Flags().GetString("description")

		if name == "" {
			return fmt.Errorf("--name is required")
		}
		if scopesStr == "" {
			return fmt.Errorf("--scopes is required")
		}

		scopes := strings.Split(scopesStr, ",")
		for i := range scopes {
			scopes[i] = strings.TrimSpace(scopes[i])
		}

		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.CreatePartnerApiKey(context.Background(), &turbodocx.CreatePartnerApiKeyRequest{
			Name:        name,
			Scopes:      scopes,
			Description: description,
		})
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Partner API key created\n")
		fmt.Fprintf(cmd.OutOrStdout(), "ID:     %s\n", resp.Data.ID)
		fmt.Fprintf(cmd.OutOrStdout(), "Name:   %s\n", resp.Data.Name)
		fmt.Fprintf(cmd.OutOrStdout(), "Key:    %s\n", resp.Data.Key)
		fmt.Fprintf(cmd.OutOrStdout(), "Scopes: %s\n", strings.Join(resp.Data.Scopes, ", "))
		return nil
	},
}

func init() {
	apikeyCreateCmd.Flags().String("name", "", "API key name (required)")
	apikeyCreateCmd.Flags().String("scopes", "", "Comma-separated scopes (required)")
	apikeyCreateCmd.Flags().String("description", "", "API key description")
	apikeyCmd.AddCommand(apikeyCreateCmd)
}
