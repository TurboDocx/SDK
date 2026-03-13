package cmdutil

import "github.com/TurboDocx/SDK/packages/cli/internal/config"

// Package-level state set by root command's PersistentPreRunE
var (
	resolvedConfig *config.Config
	jsonOutput     bool
	plainOutput    bool
)

// SetResolvedConfig sets the resolved config from root command
func SetResolvedConfig(cfg *config.Config) {
	resolvedConfig = cfg
}

// GetResolvedConfig returns the resolved config
func GetResolvedConfig() *config.Config {
	if resolvedConfig == nil {
		return &config.Config{}
	}
	return resolvedConfig
}

// SetOutputMode sets the JSON/plain output modes
func SetOutputMode(json, plain bool) {
	jsonOutput = json
	plainOutput = plain
}

// IsJSON returns whether JSON output mode is enabled
func IsJSON() bool { return jsonOutput }

// IsPlain returns whether plain (no color) output mode is enabled
func IsPlain() bool { return plainOutput }
