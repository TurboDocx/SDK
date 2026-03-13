package cmd

import (
	"fmt"
	"runtime"

	"github.com/TurboDocx/SDK/packages/cli/internal/output"
	"github.com/spf13/cobra"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print version information",
	RunE: func(cmd *cobra.Command, args []string) error {
		if IsJSON() {
			return output.PrintJSON(cmd.OutOrStdout(), map[string]string{
				"version": versionStr,
				"commit":  commitStr,
				"go":      runtime.Version(),
				"os":      runtime.GOOS,
				"arch":    runtime.GOARCH,
			})
		}

		fmt.Fprintf(cmd.OutOrStdout(), "turbodocx version %s (commit %s)\n", versionStr, commitStr)
		fmt.Fprintf(cmd.OutOrStdout(), "go: %s, os/arch: %s/%s\n", runtime.Version(), runtime.GOOS, runtime.GOARCH)
		return nil
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}
