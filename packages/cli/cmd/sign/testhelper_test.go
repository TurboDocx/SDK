package sign

import (
	"bytes"

	"github.com/TurboDocx/SDK/packages/cli/internal/config"
	"github.com/spf13/cobra"
)

// withMockClient replaces newSignClient with a mock for the duration of fn
func withMockClient(mock *mockSignClient, fn func()) {
	original := newSignClient
	newSignClient = func(cfg *config.Config) (SignClient, error) {
		return mock, nil
	}
	defer func() { newSignClient = original }()
	fn()
}

// executeSignCmd creates a fresh command tree and executes with the given args
func executeSignCmd(args []string) (*bytes.Buffer, error) {
	root := &cobra.Command{Use: "test"}
	// Create a fresh copy of SignCmd to avoid state leakage
	root.AddCommand(SignCmd)

	var buf bytes.Buffer
	root.SetOut(&buf)
	root.SetErr(&buf)
	root.SetArgs(append([]string{"sign"}, args...))

	err := root.Execute()
	return &buf, err
}
