package main

import (
	"os"

	"github.com/TurboDocx/SDK/packages/cli/cmd"
)

var (
	version = "dev"
	commit  = "none"
)

func main() {
	cmd.SetVersionInfo(version, commit)
	if err := cmd.Execute(); err != nil {
		os.Exit(1)
	}
}
