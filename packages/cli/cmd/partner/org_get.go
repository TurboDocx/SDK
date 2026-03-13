package partner

import (
	"context"
	"strconv"

	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var orgGetCmd = &cobra.Command{
	Use:   "get <orgId>",
	Short: "Get organization details",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		resp, err := client.GetOrganizationDetails(context.Background(), args[0])
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		pairs := []output.KeyValue{
			{Key: "ID", Value: resp.Data.ID},
			{Key: "Name", Value: resp.Data.Name},
			{Key: "Active", Value: strconv.FormatBool(resp.Data.IsActive)},
			{Key: "Users", Value: strconv.Itoa(resp.Data.UserCount)},
			{Key: "Created", Value: resp.Data.CreatedOn},
		}
		output.PrintKeyValue(cmd.OutOrStdout(), pairs)
		return nil
	},
}

func init() {
	orgCmd.AddCommand(orgGetCmd)
}
