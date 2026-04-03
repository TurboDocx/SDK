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

var apikeyListCmd = &cobra.Command{
	Use:   "list",
	Short: "List partner API keys",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		req := &turbodocx.ListPartnerApiKeysRequest{}
		limit, _ := cmd.Flags().GetInt("limit")
		offset, _ := cmd.Flags().GetInt("offset")
		search, _ := cmd.Flags().GetString("search")

		if cmd.Flags().Changed("limit") {
			req.Limit = &limit
		}
		if cmd.Flags().Changed("offset") {
			req.Offset = &offset
		}
		req.Search = search

		resp, err := client.ListPartnerApiKeys(context.Background(), req)
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Total: %d\n\n", resp.Data.TotalRecords)
		headers := []string{"ID", "Name", "Scopes", "Created", "Last Used"}
		var rows [][]string
		for _, k := range resp.Data.Results {
			rows = append(rows, []string{k.ID, k.Name, strings.Join(k.Scopes, ","), k.CreatedOn, k.LastUsedOn})
		}
		output.PrintTable(cmd.OutOrStdout(), headers, rows)
		return nil
	},
}

func init() {
	apikeyListCmd.Flags().Int("limit", 0, "Maximum number of results")
	apikeyListCmd.Flags().Int("offset", 0, "Number of results to skip")
	apikeyListCmd.Flags().String("search", "", "Search query")
	apikeyCmd.AddCommand(apikeyListCmd)
}
