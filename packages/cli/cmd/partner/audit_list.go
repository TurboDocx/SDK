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

var auditListCmd = &cobra.Command{
	Use:   "list",
	Short: "List partner audit logs",
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newPartnerClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		req := &turbodocx.ListAuditLogsRequest{}
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
		req.Action, _ = cmd.Flags().GetString("action")
		req.ResourceType, _ = cmd.Flags().GetString("resource-type")
		req.ResourceID, _ = cmd.Flags().GetString("resource-id")
		req.StartDate, _ = cmd.Flags().GetString("start-date")
		req.EndDate, _ = cmd.Flags().GetString("end-date")

		successStr, _ := cmd.Flags().GetString("success")
		if successStr != "" {
			val, err := strconv.ParseBool(successStr)
			if err != nil {
				return fmt.Errorf("invalid --success value: %w", err)
			}
			req.Success = &val
		}

		resp, err := client.GetPartnerAuditLogs(context.Background(), req)
		if err != nil {
			return err
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), resp)
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Total: %d\n\n", resp.Data.TotalRecords)
		headers := []string{"ID", "Action", "Resource Type", "Resource ID", "Success", "Created"}
		var rows [][]string
		for _, entry := range resp.Data.Results {
			rows = append(rows, []string{
				entry.ID,
				entry.Action,
				entry.ResourceType,
				entry.ResourceID,
				strconv.FormatBool(entry.Success),
				entry.CreatedOn,
			})
		}
		output.PrintTable(cmd.OutOrStdout(), headers, rows)
		return nil
	},
}

func init() {
	auditListCmd.Flags().Int("limit", 0, "Maximum number of results")
	auditListCmd.Flags().Int("offset", 0, "Number of results to skip")
	auditListCmd.Flags().String("search", "", "Search query")
	auditListCmd.Flags().String("action", "", "Filter by action")
	auditListCmd.Flags().String("resource-type", "", "Filter by resource type")
	auditListCmd.Flags().String("resource-id", "", "Filter by resource ID")
	auditListCmd.Flags().String("success", "", "Filter by success (true/false)")
	auditListCmd.Flags().String("start-date", "", "Filter by start date")
	auditListCmd.Flags().String("end-date", "", "Filter by end date")
	auditCmd.AddCommand(auditListCmd)
}
