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

var orgUserListCmd = &cobra.Command{
	Use:   "list <orgId>",
	Short: "List organization users",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		req := &turbodocx.ListOrgUsersRequest{}
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

		resp, err := client.ListOrganizationUsers(context.Background(), args[0], req)
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Total: %d\n\n", resp.Data.TotalRecords)
		headers := []string{"ID", "Email", "Role", "Active", "Created"}
		var rows [][]string
		for _, u := range resp.Data.Results {
			rows = append(rows, []string{
				u.ID,
				u.Email,
				u.Role,
				strconv.FormatBool(u.IsActive),
				u.CreatedOn,
			})
		}
		output.PrintTable(cmd.OutOrStdout(), headers, rows)
		return nil
	},
}

func init() {
	orgUserListCmd.Flags().Int("limit", 0, "Maximum number of results")
	orgUserListCmd.Flags().Int("offset", 0, "Number of results to skip")
	orgUserListCmd.Flags().String("search", "", "Search query")
	orgUserCmd.AddCommand(orgUserListCmd)
}
