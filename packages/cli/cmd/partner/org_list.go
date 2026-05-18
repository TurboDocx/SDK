package partner

import (
	"context"
	"fmt"
	"strconv"

	turbodocx "github.com/TurboDocx/SDK/packages/go-sdk"
	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var orgListCmd = &cobra.Command{
	Use:   "list",
	Short: "List organizations",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		req := &turbodocx.ListOrganizationsRequest{}
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

		resp, err := client.ListOrganizations(context.Background(), req)
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Total: %d\n\n", resp.Data.TotalRecords)
		headers := []string{"ID", "Name", "Users", "Active", "Created"}
		var rows [][]string
		for _, org := range resp.Data.Results {
			rows = append(rows, []string{
				org.ID,
				org.Name,
				strconv.Itoa(org.UserCount),
				strconv.FormatBool(org.IsActive),
				org.CreatedOn,
			})
		}
		output.PrintTable(cmd.OutOrStdout(), headers, rows)
		return nil
	},
}

func init() {
	orgListCmd.Flags().Int("limit", 0, "Maximum number of results")
	orgListCmd.Flags().Int("offset", 0, "Number of results to skip")
	orgListCmd.Flags().String("search", "", "Search query")
	orgCmd.AddCommand(orgListCmd)
}
