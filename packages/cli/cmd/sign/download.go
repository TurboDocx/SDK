package sign

import (
	"context"
	"fmt"
	"os"

	"github.com/TurboDocx/SDK/packages/cli/cmd/cmdutil"
	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var downloadCmd = &cobra.Command{
	Use:   "download <documentId>",
	Short: "Download signed document",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		client, err := newSignClient(cmdutil.GetResolvedConfig())
		if err != nil {
			return err
		}

		data, err := client.Download(context.Background(), args[0])
		if err != nil {
			return err
		}

		outPath, _ := cmd.Flags().GetString("output")
		if outPath == "" {
			outPath = args[0] + ".pdf"
		}

		if err := os.WriteFile(outPath, data, 0644); err != nil {
			return fmt.Errorf("failed to write file: %w", err)
		}

		if isJSONMode() {
			return output.PrintJSON(cmd.OutOrStdout(), map[string]interface{}{
				"filePath": outPath,
				"size":     len(data),
			})
		}

		fmt.Fprintf(cmd.OutOrStdout(), "Downloaded to %s (%d bytes)\n", outPath, len(data))
		return nil
	},
}

func init() {
	downloadCmd.Flags().StringP("output", "o", "", "Output file path (default: <documentId>.pdf)")
}
